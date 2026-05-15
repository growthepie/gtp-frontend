// Server-side helper that derives the current top apps across the Ethereum
// L2 ecosystem. Sister to computeL2Leaderboard / computeL2FeesLeaderboard /
// computeL2StablesLeaderboard / computeL2TxsEcosystem.
//
// Shape is different from those: the output isn't periods × metrics, it's a
// set of top-N lists across all L2s for three different ranking metrics
// (transaction count, daily active addresses, gas fees paid), plus a
// per-category breakdown of the top 5 apps in each category by transaction
// count.
//
// Data sources:
//   - `/v1/apps/app_overview_{window}.json` — per-(project, chain) rollups
//     with txcount, daa, gas_fees_usd over the chosen window. Includes
//     Ethereum mainnet rows; we drop those before aggregating.
//   - `/v1/labels/projects_filtered.json` — project metadata. Used to look
//     up `display_name` (for human-readable prose) and `main_category` (for
//     the per-category top-5).
//   - `/v1/master.json` — kept consistent with the other answer pages so the
//     "L2 universe" framing matches.
//
// Aggregation across chains:
//   - txcount and gas_fees_usd are summed across L2 origin_keys per project.
//   - daa is also summed; a user active on multiple L2s is double-counted
//     because there's no cross-chain address overlap data in the API. This
//     is called out in the methodology FAQ.

import { cache } from 'react';
import { MasterURL, ApplicationsURLs, LabelsURLS } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Default window for the headline leaderboards. 30 days is the most stable
// "currently popular" snapshot — short enough to be current, long enough not
// to be noisy from a single high-activity day. Adjust by changing this one
// constant; the helper will refetch the corresponding overview file.
const DEFAULT_WINDOW = '30d' as const;
export const APPS_WINDOW = DEFAULT_WINDOW;
export const APPS_WINDOW_LABEL = 'last 30 days';

const APP_SITE_PATH = '/applications/';

export type AppEntry = {
  owner_project: string;
  displayName: string;
  url: string;
  // Sum across L2 origin_keys.
  txcount: number;
  daa: number;
  gas_fees_usd: number;
  // Number of L2 chains the project is active on within the window.
  chainCount: number;
  mainCategory: string | null;
};

export type CategoryGroup = {
  category: string;
  // Top apps in this category by transaction count.
  apps: AppEntry[];
};

export type L2TopApps = {
  generatedAtIso: string;
  window: string;
  windowLabel: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // Top 10 apps ecosystem-wide by each ranking metric.
  topByTxcount: AppEntry[];
  topByDaa: AppEntry[];
  topByGasFees: AppEntry[];
  // Top 5 apps per category (sorted descending by category total txcount so
  // the biggest categories surface first).
  topByCategory: CategoryGroup[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-top-apps' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Lookup table from owner_project key → { displayName, mainCategory }.
// Returned by the projects_filtered.json endpoint.
type ProjectMeta = { displayName: string; mainCategory: string | null };

const buildProjectMeta = (
  projectsJson: any,
): Record<string, ProjectMeta> => {
  const types: string[] | undefined = projectsJson?.data?.types;
  const rows: any[][] | undefined = projectsJson?.data?.data;
  if (!Array.isArray(types) || !Array.isArray(rows)) return {};
  const ownerIdx = types.indexOf('owner_project');
  const nameIdx = types.indexOf('display_name');
  const catIdx = types.indexOf('main_category');
  if (ownerIdx < 0) return {};
  const out: Record<string, ProjectMeta> = {};
  for (const row of rows) {
    const owner = row?.[ownerIdx];
    if (typeof owner !== 'string') continue;
    out[owner] = {
      displayName: (nameIdx >= 0 ? row[nameIdx] : null) ?? owner,
      mainCategory: catIdx >= 0 ? (row[catIdx] ?? null) : null,
    };
  }
  return out;
};

export const getL2TopApps = cache(
  async (): Promise<L2TopApps | null> => {
    let master: any;
    let overview: any;
    let projects: any;

    try {
      const overviewUrl = ApplicationsURLs.overview.replace(
        '{timespan}',
        DEFAULT_WINDOW,
      );
      [master, overview, projects] = await Promise.all([
        fetchJson(MasterURL),
        fetchJson(overviewUrl),
        fetchJson(LabelsURLS.projectsFiltered),
      ]);
    } catch (err) {
      console.error('getL2TopApps: upstream fetch failed', err);
      return null;
    }

    const chains: Record<string, any> = master?.chains ?? {};

    const isL2 = (key: string): boolean => {
      const c = chains[key];
      if (!c) return false;
      if (c.deployment && c.deployment !== 'PROD') return false;
      if (NON_L2_KEYS.has(key)) return false;
      if (c.bucket === 'Layer 1') return false;
      if (c.bucket === '-') return false;
      return true;
    };

    const universeKeys = Object.keys(chains).filter(isL2).sort();
    const universeSet = new Set(universeKeys);

    // --- Parse app_overview ------------------------------------------------
    const types: string[] | undefined = overview?.data?.types;
    const rows: any[] | undefined = overview?.data?.data;
    if (!Array.isArray(types) || !Array.isArray(rows)) {
      console.error('getL2TopApps: app_overview payload missing types/data');
      return null;
    }
    const idx = {
      owner_project: types.indexOf('owner_project'),
      origin_key: types.indexOf('origin_key'),
      gas_fees_usd: types.indexOf('gas_fees_usd'),
      txcount: types.indexOf('txcount'),
      daa: types.indexOf('daa'),
    };
    if (idx.owner_project < 0 || idx.origin_key < 0) {
      console.error('getL2TopApps: app_overview missing required columns');
      return null;
    }

    const projectMeta = buildProjectMeta(projects);

    // --- Aggregate per owner_project (sum across L2 origin_keys only) ------
    const byProject = new Map<
      string,
      {
        txcount: number;
        daa: number;
        gas_fees_usd: number;
        chainKeys: Set<string>;
      }
    >();

    for (const row of rows) {
      if (!Array.isArray(row)) continue;
      const owner = row[idx.owner_project];
      const origin = row[idx.origin_key];
      if (typeof owner !== 'string' || typeof origin !== 'string') continue;
      // Only count rows where the chain is in our curated L2 universe —
      // drops Ethereum mainnet + sidechains. Apps that only live on L1 won't
      // appear here, which is what we want for an "L2 apps" answer page.
      if (!universeSet.has(origin)) continue;
      const tx =
        idx.txcount >= 0 && typeof row[idx.txcount] === 'number'
          ? (row[idx.txcount] as number)
          : 0;
      const daa =
        idx.daa >= 0 && typeof row[idx.daa] === 'number'
          ? (row[idx.daa] as number)
          : 0;
      const gas =
        idx.gas_fees_usd >= 0 && typeof row[idx.gas_fees_usd] === 'number'
          ? (row[idx.gas_fees_usd] as number)
          : 0;
      const existing = byProject.get(owner) ?? {
        txcount: 0,
        daa: 0,
        gas_fees_usd: 0,
        chainKeys: new Set<string>(),
      };
      existing.txcount += tx;
      existing.daa += daa;
      existing.gas_fees_usd += gas;
      existing.chainKeys.add(origin);
      byProject.set(owner, existing);
    }

    // --- Materialise as AppEntry rows --------------------------------------
    const apps: AppEntry[] = [];
    for (const [owner, agg] of byProject) {
      // Skip projects with literally zero L2 activity across all metrics —
      // they're noise in the rankings.
      if (agg.txcount === 0 && agg.daa === 0 && agg.gas_fees_usd === 0)
        continue;
      const meta = projectMeta[owner];
      apps.push({
        owner_project: owner,
        displayName: meta?.displayName ?? owner,
        url: `${APP_SITE_PATH}${encodeURIComponent(owner)}`,
        txcount: agg.txcount,
        daa: agg.daa,
        gas_fees_usd: agg.gas_fees_usd,
        chainCount: agg.chainKeys.size,
        mainCategory: meta?.mainCategory ?? null,
      });
    }

    const cloneSort = (
      key: 'txcount' | 'daa' | 'gas_fees_usd',
      n: number,
    ): AppEntry[] =>
      [...apps].sort((a, b) => b[key] - a[key]).slice(0, n);

    const topByTxcount = cloneSort('txcount', 10);
    const topByDaa = cloneSort('daa', 10);
    const topByGasFees = cloneSort('gas_fees_usd', 10);

    // --- Per-category top 5 (by txcount) -----------------------------------
    const byCategory = new Map<string, AppEntry[]>();
    for (const app of apps) {
      const cat = app.mainCategory ?? 'Uncategorized';
      const bucket = byCategory.get(cat) ?? [];
      bucket.push(app);
      byCategory.set(cat, bucket);
    }
    const categoryGroups: CategoryGroup[] = [];
    for (const [category, list] of byCategory) {
      list.sort((a, b) => b.txcount - a.txcount);
      categoryGroups.push({ category, apps: list.slice(0, 5) });
    }
    // Sort categories by the sum of their top-5 transaction counts so the
    // largest categories appear first in prose / tables.
    categoryGroups.sort((a, b) => {
      const aSum = a.apps.reduce((s, x) => s + x.txcount, 0);
      const bSum = b.apps.reduce((s, x) => s + x.txcount, 0);
      return bSum - aSum;
    });

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      window: DEFAULT_WINDOW,
      windowLabel: APPS_WINDOW_LABEL,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      topByTxcount,
      topByDaa,
      topByGasFees,
      topByCategory: categoryGroups,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtCount = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return Math.round(n).toString();
};

const fmtUsd = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

const valueFor = (app: AppEntry, metric: AppMetric): number =>
  metric === 'txcount'
    ? app.txcount
    : metric === 'daa'
      ? app.daa
      : app.gas_fees_usd;

const fmtValue = (app: AppEntry, metric: AppMetric): string =>
  metric === 'gas_fees_usd' ? fmtUsd(app.gas_fees_usd) : fmtCount(valueFor(app, metric));

type AppMetric = 'txcount' | 'daa' | 'gas_fees_usd';
const METRIC_LABEL: Record<AppMetric, string> = {
  txcount: 'transactions',
  daa: 'active addresses (summed across chains)',
  gas_fees_usd: 'gas fees paid',
};

export const formatAppEntry = (app: AppEntry, metric: AppMetric): string =>
  `${app.displayName} (${fmtValue(app, metric)})`;

export const formatTopList = (
  apps: AppEntry[],
  metric: AppMetric,
  count = 10,
): string => {
  if (!apps || apps.length === 0) return 'unavailable';
  return apps
    .slice(0, count)
    .map((e, i) => `${i + 1}. ${formatAppEntry(e, metric)}`)
    .join('; ');
};

export const formatLeader = (
  apps: AppEntry[],
  metric: AppMetric,
): string => (apps && apps[0] ? formatAppEntry(apps[0], metric) : 'unavailable');

// Dense quotable sentence for the overall headline — collapses the three
// top-1 leaders into one quoteable claim AI engines can lift verbatim.
export const buildTopAppsDenseSentence = (
  data: L2TopApps,
  dataDateUtc: string,
): string => {
  const tx = data.topByTxcount?.[0];
  const daa = data.topByDaa?.[0];
  const gas = data.topByGasFees?.[0];
  if (!tx || !daa || !gas) {
    return `**Top apps on Ethereum L2s** (${data.windowLabel}, data ${dataDateUtc} UTC): unavailable.`;
  }
  return (
    `Across Ethereum L2s over the ${data.windowLabel} (data ${dataDateUtc} UTC), ` +
    `the top app by transactions is **${tx.displayName}** (${fmtCount(tx.txcount)}), ` +
    `by active addresses **${daa.displayName}** (${fmtCount(daa.daa)}, summed across chains), ` +
    `and by gas fees paid **${gas.displayName}** (${fmtUsd(gas.gas_fees_usd)}). ` +
    `Top 10 by transactions: ${formatTopList(data.topByTxcount, 'txcount', 10)}.`
  );
};

// Markdown-rendered "Top 5 apps by category" expansion. The article processor
// can drop this as a single placeholder — clean way to surface a variable
// number of categories without hard-coding placeholders per category.
export const buildCategoryTop5Markdown = (data: L2TopApps): string => {
  if (!data.topByCategory || data.topByCategory.length === 0) return '_No category data available._';
  const sections: string[] = [];
  for (const g of data.topByCategory) {
    const items = g.apps
      .map(
        (e, i) =>
          `${i + 1}. **${e.displayName}** — ${fmtCount(e.txcount)} transactions`,
      )
      .join('\n');
    sections.push(`### ${g.category}\n\n${items}`);
  }
  return sections.join('\n\n');
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildTopAppsAnswerTables = (data: L2TopApps): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);

  const tableForMetric = (
    apps: AppEntry[],
    metric: AppMetric,
    title: string,
  ): AnswerTable => ({
    title,
    caption: `Top 10 apps on Ethereum L2s by ${METRIC_LABEL[metric]} over the ${data.windowLabel}. Data: ${dataDate} UTC.`,
    headers: ['Rank', 'App', 'Value', 'Active on (L2s)', 'Category'],
    rows: apps.slice(0, 10).map((e, i) => [
      String(i + 1),
      e.displayName,
      fmtValue(e, metric),
      String(e.chainCount),
      e.mainCategory ?? '—',
    ]),
  });

  const txTable = tableForMetric(data.topByTxcount, 'txcount', 'Top 10 apps by transactions');
  const daaTable = tableForMetric(data.topByDaa, 'daa', 'Top 10 apps by active addresses');
  const gasTable = tableForMetric(data.topByGasFees, 'gas_fees_usd', 'Top 10 apps by gas fees paid');

  // Single per-category table: each row is "category, #1, #2, #3, #4, #5".
  // Keeps the SEO shell rendering simple — one <table> element rather than a
  // dozen.
  const cellApp = (a?: AppEntry) =>
    a ? `${a.displayName} (${fmtCount(a.txcount)})` : '—';
  const categoryTable: AnswerTable = {
    title: 'Top 5 apps per category, by transaction count',
    caption: `Top 5 apps in each category by transactions over the ${data.windowLabel}. Categories sorted by combined transaction count. Data: ${dataDate} UTC.`,
    headers: ['Category', '#1', '#2', '#3', '#4', '#5'],
    rows: data.topByCategory.map((g) => [
      g.category,
      cellApp(g.apps[0]),
      cellApp(g.apps[1]),
      cellApp(g.apps[2]),
      cellApp(g.apps[3]),
      cellApp(g.apps[4]),
    ]),
  };

  return [txTable, daaTable, gasTable, categoryTable];
};

// Multi-sentence acceptedAnswer used as QAPage.acceptedAnswer.text.
export const buildTopAppsAcceptedAnswer = (data: L2TopApps): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const tx = data.topByTxcount?.[0];
  const daa = data.topByDaa?.[0];
  const gas = data.topByGasFees?.[0];
  if (!tx || !daa || !gas) {
    return 'Data currently unavailable. See growthepie.com/applications for the live Ethereum L2 apps leaderboard.';
  }
  return (
    `Over the ${data.windowLabel}, the top apps on Ethereum L2s are: ` +
    `**${tx.displayName}** by transactions (${fmtCount(tx.txcount)}), ` +
    `**${daa.displayName}** by active addresses (${fmtCount(daa.daa)}, summed across chains), ` +
    `and **${gas.displayName}** by gas fees paid (${fmtUsd(gas.gas_fees_usd)}). ` +
    `Top 10 by transactions: ${formatTopList(data.topByTxcount, 'txcount', 10)}. ` +
    `Data: ${dataDate} UTC. Live leaderboards: growthepie.com/applications.`
  );
};
