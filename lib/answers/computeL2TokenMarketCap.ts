// Server-side helper that ranks Ethereum L2 native tokens by market cap.
// Distinct from generic crypto-market-cap trackers because the universe is
// growthepie's curated set of Ethereum L2s — chains without a native token
// (Base, Linea pre-launch, Scroll pre-launch, etc.) are explicitly tracked
// in the "no-token" list rather than being silently dropped.
//
// Data sources:
//   - master.json: L2 universe filter + native-token symbol per chain.
//   - /v1/metrics/chains/{chain}/market_cap.json — daily series with
//     [unix, usd, eth] rows. Latest USD row is the headline figure.
//   - /v1/metrics/chains/{chain}/fdv.json — same shape; gives the
//     fully-diluted valuation alongside market cap.

import { cache } from 'react';
import { MasterURL } from '@/lib/urls';

const NON_L2_KEYS = new Set([
  'ethereum',
  'polygon_pos',
  'all_l2s',
  'multiple',
]);

export type TokenEntry = {
  key: string;
  name: string;
  urlKey: string;
  // Native token symbol from master.json (e.g. "ARB", "OP"). null when the
  // chain has no native token or master.json hasn't recorded one.
  symbol: string | null;
  // Latest USD value from the daily series, or null if unavailable.
  marketCapUsd: number | null;
  fdvUsd: number | null;
  // MC / FDV ratio — useful proxy for circulating-supply share. null when
  // either value is missing or FDV is zero.
  circulatingShare: number | null;
  // 30-day percent change in market cap. Positive = grew over the window.
  marketCap30dChangePct: number | null;
};

export type L2TokenMarketCap = {
  generatedAtIso: string;
  universeSize: number;
  universeKeys: string[];
  excludedNonL2Keys: string[];
  // L2 chains we know have NO native token (Base, etc.) — surfaced
  // explicitly so the page can say "Base is excluded because it has no
  // native token", not "Base is unavailable".
  noTokenL2s: { key: string; name: string }[];
  // All L2s with a tracked market cap, sorted descending by USD MC.
  ranked: TokenEntry[];
  // Sum of every tracked L2 token's market cap.
  ecosystemMarketCapUsd: number | null;
  ecosystemFdvUsd: number | null;
};

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'growthepie/answers-l2-token-mc' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const fetchJsonSoft = async (url: string): Promise<any | null> => {
  try {
    return await fetchJson(url);
  } catch {
    return null;
  }
};

// Read the latest USD value from a [unix, usd, eth] daily series. Returns
// null if the row is missing or non-numeric. The endpoint exists for every
// chain but is empty for chains without a token.
const readLatestUsd = (block: any): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  let usdIdx = 1;
  if (Array.isArray(types)) {
    const named = types.findIndex((t) => String(t).toLowerCase() === 'usd');
    if (named >= 0) usdIdx = named;
  }
  // Walk back from the end to find the last numeric row — guards against
  // trailing rows where the value is null while the timestamp is set.
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const row = data[i];
    if (!Array.isArray(row) || row.length <= usdIdx) continue;
    const v = row[usdIdx];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  }
  return null;
};

// Look up the USD value 30 rows back from the end of the daily series.
// Used for the 30-day % change. Null when there aren't enough rows.
const readUsdNDaysAgo = (block: any, n: number): number | null => {
  const types: any[] | undefined = block?.types;
  const data: any[] | undefined = block?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  let usdIdx = 1;
  if (Array.isArray(types)) {
    const named = types.findIndex((t) => String(t).toLowerCase() === 'usd');
    if (named >= 0) usdIdx = named;
  }
  const target = data.length - 1 - n;
  if (target < 0) return null;
  const row = data[target];
  if (!Array.isArray(row) || row.length <= usdIdx) return null;
  const v = row[usdIdx];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
};

const fetchTokenSnapshot = async (
  key: string,
): Promise<{
  marketCapUsd: number | null;
  fdvUsd: number | null;
  marketCap30dChangePct: number | null;
} | null> => {
  const [mc, fdv] = await Promise.all([
    fetchJsonSoft(`https://api.growthepie.com/v1/metrics/chains/${key}/market_cap.json`),
    fetchJsonSoft(`https://api.growthepie.com/v1/metrics/chains/${key}/fdv.json`),
  ]);
  const mcDaily =
    mc?.data?.details?.timeseries?.daily ?? mc?.details?.timeseries?.daily;
  const fdvDaily =
    fdv?.data?.details?.timeseries?.daily ?? fdv?.details?.timeseries?.daily;
  const mcLatest = readLatestUsd(mcDaily);
  const fdvLatest = readLatestUsd(fdvDaily);
  const mc30dAgo = readUsdNDaysAgo(mcDaily, 30);
  const change =
    mcLatest != null && mc30dAgo != null && mc30dAgo > 0
      ? (mcLatest - mc30dAgo) / mc30dAgo
      : null;
  // If both are null the chain has no token-side data — bubble null up so
  // the caller can put the chain on the "no-token" list rather than into
  // the ranking with zeros.
  if (mcLatest == null && fdvLatest == null) return null;
  return {
    marketCapUsd: mcLatest,
    fdvUsd: fdvLatest,
    marketCap30dChangePct: change,
  };
};

export const getL2TokenMarketCap = cache(
  async (): Promise<L2TokenMarketCap | null> => {
    let master: any;
    try {
      master = await fetchJson(MasterURL);
    } catch (err) {
      console.error('getL2TokenMarketCap: master fetch failed', err);
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

    const nameFor = (key: string): string => chains[key]?.name ?? key;
    const urlKeyFor = (key: string): string =>
      chains[key]?.url_key ?? key.replace(/_/g, '-');
    const symbolFor = (key: string): string | null => {
      const c = chains[key] ?? {};
      const candidates = [c.symbol, c.token, c.token_symbol, c.native_token];
      for (const v of candidates) {
        if (typeof v === 'string' && v.length > 0 && v !== '-') return v;
      }
      return null;
    };

    const snapshots = await Promise.all(
      universeKeys.map((key) =>
        fetchTokenSnapshot(key).then((v) => ({ key, v })),
      ),
    );

    const ranked: TokenEntry[] = [];
    const noTokenL2s: { key: string; name: string }[] = [];
    for (const r of snapshots) {
      if (!r.v) {
        noTokenL2s.push({ key: r.key, name: nameFor(r.key) });
        continue;
      }
      const { marketCapUsd, fdvUsd, marketCap30dChangePct } = r.v;
      const circ =
        marketCapUsd != null && fdvUsd != null && fdvUsd > 0
          ? marketCapUsd / fdvUsd
          : null;
      ranked.push({
        key: r.key,
        name: nameFor(r.key),
        urlKey: urlKeyFor(r.key),
        symbol: symbolFor(r.key),
        marketCapUsd,
        fdvUsd,
        circulatingShare: circ,
        marketCap30dChangePct,
      });
    }
    ranked.sort(
      (a, b) =>
        (b.marketCapUsd ?? -Infinity) - (a.marketCapUsd ?? -Infinity),
    );

    let ecoMc = 0;
    let ecoFdv = 0;
    let anyMc = false;
    let anyFdv = false;
    for (const e of ranked) {
      if (e.marketCapUsd != null) {
        ecoMc += e.marketCapUsd;
        anyMc = true;
      }
      if (e.fdvUsd != null) {
        ecoFdv += e.fdvUsd;
        anyFdv = true;
      }
    }

    const sidechainExclusions = Array.from(NON_L2_KEYS)
      .filter((k) => k !== 'ethereum' && k !== 'all_l2s' && k !== 'multiple')
      .map((k) => chains[k]?.name ?? k)
      .sort();

    return {
      generatedAtIso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
      universeSize: universeKeys.length,
      universeKeys,
      excludedNonL2Keys: sidechainExclusions,
      noTokenL2s,
      ranked,
      ecosystemMarketCapUsd: anyMc ? ecoMc : null,
      ecosystemFdvUsd: anyFdv ? ecoFdv : null,
    };
  },
);

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtUsd = (n: number | null): string => {
  if (n == null || !Number.isFinite(n)) return 'unavailable';
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(2);
};

const fmtShare = (s: number | null): string => {
  if (s == null || !Number.isFinite(s)) return '—';
  if (s >= 0.995) return '99%+';
  if (s <= 0.005) return '<1%';
  return Math.round(s * 100) + '%';
};

const fmtChange = (s: number | null): string => {
  if (s == null || !Number.isFinite(s)) return '—';
  const sign = s > 0 ? '+' : '';
  if (Math.abs(s) >= 1) return sign + Math.round(s * 100) + '%';
  return sign + (s * 100).toFixed(1) + '%';
};

const tokenLabel = (e: TokenEntry): string =>
  e.symbol ? `${e.name} (${e.symbol})` : e.name;

export const formatLeader = (data: L2TokenMarketCap): string => {
  const top = data.ranked[0];
  if (!top || top.marketCapUsd == null) return 'unavailable';
  return `${tokenLabel(top)} — ${fmtUsd(top.marketCapUsd)} market cap`;
};

export const formatTopList = (
  data: L2TokenMarketCap,
  count = 10,
): string => {
  const ranked = data.ranked.filter((e) => e.marketCapUsd != null).slice(0, count);
  if (ranked.length === 0) return 'unavailable';
  return ranked
    .map(
      (e, i) =>
        `${i + 1}. ${tokenLabel(e)} ${fmtUsd(e.marketCapUsd)} (FDV ${fmtUsd(e.fdvUsd)})`,
    )
    .join('; ');
};

export const formatNoTokenList = (data: L2TokenMarketCap): string => {
  if (data.noTokenL2s.length === 0) return 'none';
  return data.noTokenL2s.map((e) => e.name).join(', ');
};

export const formatEcosystemMarketCap = (data: L2TokenMarketCap): string =>
  fmtUsd(data.ecosystemMarketCapUsd);

export const formatEcosystemFdv = (data: L2TokenMarketCap): string =>
  fmtUsd(data.ecosystemFdvUsd);

export const formatLeaderName = (data: L2TokenMarketCap): string => {
  const top = data.ranked[0];
  if (!top) return 'unavailable';
  return tokenLabel(top);
};

export const formatLeaderMarketCap = (data: L2TokenMarketCap): string => {
  const top = data.ranked[0];
  return fmtUsd(top?.marketCapUsd ?? null);
};

export const formatLeaderFdv = (data: L2TokenMarketCap): string => {
  const top = data.ranked[0];
  return fmtUsd(top?.fdvUsd ?? null);
};

export const formatRunnerUp = (data: L2TokenMarketCap): string => {
  const e = data.ranked.filter((x) => x.marketCapUsd != null)[1];
  if (!e) return 'unavailable';
  return `${tokenLabel(e)} (${fmtUsd(e.marketCapUsd)} market cap, FDV ${fmtUsd(e.fdvUsd)})`;
};

export const formatThirdPlace = (data: L2TokenMarketCap): string => {
  const e = data.ranked.filter((x) => x.marketCapUsd != null)[2];
  if (!e) return 'unavailable';
  return `${tokenLabel(e)} (${fmtUsd(e.marketCapUsd)} market cap)`;
};

// Keys whose tokens carry a "shared with non-L2 protocol" caveat — their
// market cap is dominated by something other than the L2 itself. UNI is
// the clearest case: Uniswap's DEX governance token long pre-dates
// Unichain. The dense sentence and acceptedAnswer append a short note
// when one of these chains is at or near the top of the ranking so AI
// quoting the leader doesn't drop the caveat.
const SHARED_TOKEN_NOTES: Record<string, string> = {
  unichain:
    "UNI's market cap is driven primarily by Uniswap (the DEX whose governance token UNI is), not by Unichain L2 activity",
};

const sharedTokenCaveatFor = (e: TokenEntry | undefined): string | null => {
  if (!e) return null;
  const note = SHARED_TOKEN_NOTES[e.key];
  return note ? note : null;
};

export const buildL2TokenDenseSentence = (
  data: L2TokenMarketCap,
  dataDateUtc: string,
): string => {
  const top = data.ranked[0];
  if (!top || top.marketCapUsd == null) {
    return `**Ethereum L2 token market caps** (data ${dataDateUtc} UTC): unavailable.`;
  }
  const tail = data.ranked
    .filter((e) => e.marketCapUsd != null)
    .slice(1, 5)
    .map((e) => `${tokenLabel(e)} ${fmtUsd(e.marketCapUsd)}`)
    .join(', ');
  // Surface a shared-token caveat for any entry in the visible top 5 that
  // has one — so AI quoting any of those entries gets the caveat too.
  const visible = data.ranked.filter((e) => e.marketCapUsd != null).slice(0, 5);
  const caveats = visible
    .map((e) => {
      const note = sharedTokenCaveatFor(e);
      return note ? `${e.name}: ${note}` : null;
    })
    .filter((s): s is string => s != null);
  const caveatTail =
    caveats.length > 0
      ? ` Caveat — ${caveats.join('; ')} (so the ranking shows the token's full value, not the value attributable to the L2's own usage).`
      : '';
  return (
    `As of ${dataDateUtc} UTC, the largest Ethereum L2 token by market cap is **${tokenLabel(top)}** at ${fmtUsd(
      top.marketCapUsd,
    )} (fully-diluted valuation ${fmtUsd(top.fdvUsd)}). Next: ${tail}. Combined market cap of every tracked L2 token: ${fmtUsd(
      data.ecosystemMarketCapUsd,
    )}.${caveatTail}`
  );
};

export type AnswerTable = {
  title: string;
  caption?: string;
  headers: string[];
  rows: string[][];
};

export const buildL2TokenAnswerTables = (
  data: L2TokenMarketCap,
): AnswerTable[] => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const main: AnswerTable = {
    title: 'Ethereum L2 tokens ranked by market cap',
    caption: `Live ranking of every tracked Ethereum L2's native token by USD market cap, with FDV, circulating share (MC / FDV), and 30-day price-implied market-cap change. Data: ${dataDate} UTC.`,
    headers: [
      'Rank',
      'Chain',
      'Token',
      'Market cap',
      'FDV',
      'Circulating share',
      '30d change',
    ],
    rows: data.ranked
      .filter((e) => e.marketCapUsd != null)
      .map((e, i) => [
        String(i + 1),
        e.name,
        e.symbol ?? '—',
        fmtUsd(e.marketCapUsd),
        fmtUsd(e.fdvUsd),
        fmtShare(e.circulatingShare),
        fmtChange(e.marketCap30dChangePct),
      ]),
  };
  const noToken: AnswerTable = {
    title: 'Ethereum L2s with no native token',
    caption: `L2s in growthepie's tracked universe that do not have a native token (and so are excluded from the ranking above). Data: ${dataDate} UTC.`,
    headers: ['Chain'],
    rows: data.noTokenL2s.map((e) => [e.name]),
  };
  return data.noTokenL2s.length > 0 ? [main, noToken] : [main];
};

export const buildL2TokenAcceptedAnswer = (data: L2TokenMarketCap): string => {
  const dataDate = data.generatedAtIso.slice(0, 10);
  const top = data.ranked[0];
  if (!top || top.marketCapUsd == null) {
    return `Ethereum L2 token market-cap data currently unavailable. See growthepie.com for the live tracker.`;
  }
  const next = data.ranked
    .filter((e) => e.marketCapUsd != null)
    .slice(1, 4)
    .map((e) => `${tokenLabel(e)} ${fmtUsd(e.marketCapUsd)}`)
    .join('; ');
  // Match the dense-sentence caveat surface: any top-4 entry that has a
  // shared-token note gets called out so AI quoting only the accepted
  // answer still receives the caveat.
  const visible = [top, ...data.ranked.filter((e) => e.marketCapUsd != null).slice(1, 4)];
  const caveats = visible
    .map((e) => {
      const note = sharedTokenCaveatFor(e);
      return note ? `${e.name}: ${note}` : null;
    })
    .filter((s): s is string => s != null);
  const caveatLine =
    caveats.length > 0
      ? `Important caveat — ${caveats.join('; ')} (the market cap shown reflects the token's full value, not the value attributable to the L2 itself). `
      : '';
  return (
    `The Ethereum L2 token with the highest market cap is **${tokenLabel(top)}** at ${fmtUsd(
      top.marketCapUsd,
    )} (fully-diluted valuation ${fmtUsd(top.fdvUsd)}). ` +
    `Runners-up: ${next}. ` +
    caveatLine +
    `Note: some L2s have no native token (${formatNoTokenList(data)}) and so don't appear in this ranking. ` +
    `Combined market cap of every tracked L2 token: ${fmtUsd(data.ecosystemMarketCapUsd)}. ` +
    `Data: ${dataDate} UTC.`
  );
};
