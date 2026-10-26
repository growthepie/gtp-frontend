// Stablecoin supply by fiat currency, for the "Stablecoins by Fiat" tracker tile and the Quick
// Bite's KPIs.
//
// fiat/timeseries.json is weekly, and each week's value is the sum of that week's seven daily
// supplies, so its absolute values are ~7x the actual supply (about $1.2T instead of ~$175B).
// Only the shares between currencies are right. So today's USD supply comes from
// fiat/table_usd.json (one row per token and chain), and the total and non-USD supply follow
// from USD's share in the timeseries. That stays correct if the timeseries is ever changed to
// daily or weekly-average values.

export const STABLECOIN_FIAT_TIMESERIES_URL = "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/timeseries.json";
export const STABLECOIN_FIAT_USD_TABLE_URL = "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/table_usd.json";

export type StablecoinFiatSupply = {
  /** Number of fiat currencies tracked */
  currencies: number;
  /** USD-pegged share of all tracked stablecoin supply, 0–1 */
  usdShare: number;
  /** Supply in USD of USD-pegged stablecoins */
  usd: number;
  /** Supply in USD of all tracked stablecoins */
  total: number;
  /** Supply in USD of stablecoins pegged to other currencies */
  nonUsd: number;
};

export function readStablecoinFiatSupply(timeseries: any, usdTable: any): StablecoinFiatSupply | null {
  const types: string[] = timeseries?.data?.timeseries?.types ?? [];
  const rows: unknown[][] = timeseries?.data?.timeseries?.values ?? [];
  const latest = rows[rows.length - 1];
  const usdIndex = types.findIndex((type) => type.toLowerCase() === "usd");
  if (!latest || usdIndex < 0) return null;

  const weekTotal = latest.slice(1).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
  const weekUsd = Number(latest[usdIndex + 1]) || 0;
  if (weekTotal <= 0 || weekUsd <= 0) return null;
  const usdShare = weekUsd / weekTotal;

  // today's USD supply: the table's rows for its latest date
  const columns: string[] = usdTable?.data?.table?.columns ?? [];
  const tableRows: unknown[][] = usdTable?.data?.table?.rows ?? [];
  const dateIndex = columns.indexOf("date");
  const valueIndex = columns.indexOf("value_usd");
  if (valueIndex < 0 || tableRows.length === 0) return null;
  const latestDate = dateIndex < 0 ? null : tableRows.reduce<string>((max, row) => (String(row[dateIndex]) > max ? String(row[dateIndex]) : max), "");
  const usd = tableRows
    .filter((row) => latestDate === null || String(row[dateIndex]) === latestDate)
    .reduce<number>((sum, row) => sum + (Number(row[valueIndex]) || 0), 0);
  if (usd <= 0) return null;

  const total = usd / usdShare;
  return { currencies: types.length, usdShare, usd, total, nonUsd: total - usd };
}
