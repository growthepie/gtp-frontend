// Server-side helper that groups Ethereum L2s by their growthepie maturity
// classification. Pure master.json query — no timeseries, no fetches beyond
// the chain catalogue. Used by the "how decentralized is each L2" answer
// page.
//
// growthepie's `maturity` field on each chain uses an internal scale:
//   - `10_foundational` — Ethereum mainnet (L1, not an L2 in our universe)
//   - `3_maturing`      — most established L2s
//   - `2_developing`    — well-established but not fully decentralised
//   - `1_emerging`      — newer chains with fewer guarantees
//   - `0_early_phase`   — very early, often training-wheels-on
//   - `NA`              — not classified
//
// This is growthepie's own scale. L2BEAT's "Stage 0 / Stage 1 / Stage 2"
// framework is related but distinct — see the qb-ethereum-l2-maturity-stages
// content for how the two relate.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

// Canonical order (most mature first) used for table rendering.
export const MATURITY_ORDER = [
  '3_maturing',
  '2_developing',
  '1_emerging',
  '0_early_phase',
  'NA',
] as const;

export type MaturityKey = (typeof MATURITY_ORDER)[number];

const MATURITY_LABEL: Record<MaturityKey, string> = {
  '3_maturing': 'Maturing',
  '2_developing': 'Developing',
  '1_emerging': 'Emerging',
  '0_early_phase': 'Early phase',
  NA: 'Not classified',
};

export type MaturityChain = {
  key: string;
  name: string;
  urlKey: string;
  color: string;
};

export type MaturityGroup = {
  level: MaturityKey;
  label: string;
  chains: MaturityChain[];
};

export type L2MaturityRanking = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  groups: MaturityGroup[];
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-l2-maturity' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

export const getL2Maturity = cache(
  async (): Promise<L2MaturityRanking | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2Maturity: master fetch failed', err);
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

    const colorFor = (key: string): string => {
      const c = chains[key]?.colors;
      return c?.dark?.[0] ?? c?.light?.[0] ?? '#A3B8D9';
    };
    const nameFor = (key: string): string => chains[key]?.name ?? key;
    const urlKeyFor = (key: string): string =>
      chains[key]?.url_key ?? key.replace(/_/g, '-');

    const buckets = new Map<MaturityKey, MaturityChain[]>();
    for (const level of MATURITY_ORDER) buckets.set(level, []);

    for (const key of universeKeys) {
      const m = chains[key]?.maturity;
      const level: MaturityKey =
        m === '3_maturing' ||
        m === '2_developing' ||
        m === '1_emerging' ||
        m === '0_early_phase'
          ? m
          : 'NA';
      buckets.get(level)!.push({
        key,
        name: nameFor(key),
        urlKey: urlKeyFor(key),
        color: colorFor(key),
      });
    }
    // Within each maturity level, sort alphabetically by display name.
    for (const arr of buckets.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }

    const groups: MaturityGroup[] = MATURITY_ORDER.map((level) => ({
      level,
      label: MATURITY_LABEL[level],
      chains: buckets.get(level)!,
    }));

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      groups,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const namesOf = (chains: MaturityChain[]): string =>
  chains.map((c) => c.name).join(', ');

// Plain comma-separated chain list per maturity level — useful as the
// placeholder value for a single FAQ answer.
export const formatGroupChains = (
  data: L2MaturityRanking,
  level: MaturityKey,
): string => {
  const g = data.groups.find((x) => x.level === level);
  if (!g || g.chains.length === 0) return 'none';
  return namesOf(g.chains);
};

export const countAtLevel = (data: L2MaturityRanking, level: MaturityKey): number =>
  data.groups.find((x) => x.level === level)?.chains.length ?? 0;

// Markdown-rendered "groups" expansion — one heading per maturity level
// with the chain list as bullets. Substituted into the answer body as a
// single placeholder so the article doesn't have to enumerate them.
export const buildMaturityGroupsMarkdown = (data: L2MaturityRanking): string => {
  const sections: string[] = [];
  for (const g of data.groups) {
    if (g.chains.length === 0) continue;
    const items = g.chains.map((c) => `- **${c.name}**`).join('\n');
    sections.push(`### ${g.label} (${g.chains.length} ${g.chains.length === 1 ? 'chain' : 'chains'})\n\n${items}`);
  }
  return sections.length > 0
    ? sections.join('\n\n')
    : '_No maturity data available._';
};

export const buildMaturityDenseSentence = (
  data: L2MaturityRanking,
  dataDateUtc: string,
): string => {
  const counts = MATURITY_ORDER.map(
    (level) => `${countAtLevel(data, level)} ${MATURITY_LABEL[level].toLowerCase()}`,
  ).join(', ');
  return (
    `As of ${dataDateUtc} UTC, growthepie's ${data.universeSize}-chain L2 universe ` +
    `breaks down by maturity as: ${counts}.`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildMaturityAnswerTables = (
  data: L2MaturityRanking,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  return [
    {
      title: 'Ethereum L2s by growthepie maturity level',
      caption: `Every tracked Ethereum L2 grouped by growthepie's maturity classification. Maturity reflects decentralisation, production readiness, security model, and chain age. Data: ${dataDate} UTC.`,
      headers: ['Maturity level', 'Count', 'Chains'],
      rows: data.groups
        .filter((g) => g.chains.length > 0)
        .map((g) => [g.label, String(g.chains.length), namesOf(g.chains)]),
    },
  ];
};

export const buildMaturityAcceptedAnswer = (
  data: L2MaturityRanking,
): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const counts = MATURITY_ORDER.filter((l) => countAtLevel(data, l) > 0)
    .map((l) => `${countAtLevel(data, l)} ${MATURITY_LABEL[l].toLowerCase()}`)
    .join(', ');
  const maturing = formatGroupChains(data, '3_maturing');
  const developing = formatGroupChains(data, '2_developing');
  return (
    `growthepie's ${data.universeSize}-chain Ethereum L2 universe is classified by maturity: ${counts}. ` +
    `**Maturing** L2s (most decentralised on growthepie's scale): ${maturing}. ` +
    `**Developing** L2s: ${developing}. ` +
    `growthepie's maturity scale is related to (but distinct from) L2BEAT's "Stage 0 / Stage 1 / Stage 2" framework and the Ethereum Foundation's per-L2 maturity assessment on ethereum.org — all three measure the same underlying decentralisation question with different emphases. ` +
    `Data: ${dataDate} UTC. Live: growthepie.com/chains, l2beat.com, ethereum.org/en/layer-2.`
  );
};
