// Client-side 7-day rolling average for blockspace category-comparison data.
//
// Why this exists: the per-category split files
// (`blockspace/category_comparison/{main_category}.json`) will eventually drop
// the `daily_7d_rolling` field to shrink payloads. The full `daily` series is
// always present, so we recompute the rolling mean here. The combined
// `category_comparison.json` keeps both fields, so this is only applied to the
// split files (and is a no-op when the field is already present).
//
// The algorithm must match the backend's pandas `.rolling(7).mean()` with the
// default `min_periods=7` followed by `dropna()`:
//   1. Sort rows by unix ascending.
//   2. Right-aligned window of 7 consecutive rows; output[i] = mean over rows
//      i-6 .. i for every value column. The output unix is rows[i]'s unix.
//   3. Drop the first 6 rows (fewer than 7 prior points), so the rolling series
//      is 6 entries shorter than `daily` and starts on the 7th day.
//   4. The window is positional (7 rows), not a 7-calendar-day window.
//
// Validated against the published `daily_7d_rolling` field across every
// category / subcategory / chain: an exact match within the split files'
// 6-significant-figure rounding noise (visually identical, not bit-identical).

export type Row = number[];

export interface TimeseriesBlock {
  types: string[];
  [chainKey: string]: string[] | Row[];
}

// Minimal shape we touch on a category (or subcategory) node. Other fields
// (`aggregated`, `type`, ...) are preserved untouched.
export interface RollingNode {
  daily?: TimeseriesBlock;
  daily_7d_rolling?: TimeseriesBlock;
  subcategories?: {
    list?: string[];
    [sub: string]: string[] | RollingNode | undefined;
  };
  [key: string]: unknown;
}

// Right-aligned 7-row rolling mean. Resolves the unix column by name (carried
// straight through); every other column is averaged. Output rows have the same
// width/order as `types`. Returns [] for series shorter than 7 rows.
export function rolling7d(types: string[], daily: Row[]): Row[] {
  if (!Array.isArray(types) || !Array.isArray(daily)) return [];
  const named = types.indexOf("unix");
  const unixIdx = named < 0 ? 0 : named;

  const rows = [...daily].sort((a, b) => a[unixIdx] - b[unixIdx]);
  const out: Row[] = [];

  for (let i = 6; i < rows.length; i++) {
    const win = rows.slice(i - 6, i + 1); // 7 consecutive rows, right-aligned
    const r: Row = new Array(types.length);
    for (let c = 0; c < types.length; c++) {
      if (c === unixIdx) {
        r[c] = rows[i][c]; // unix = current row's unix
        continue;
      }
      let sum = 0;
      for (const row of win) sum += row[c] as number;
      r[c] = sum / 7;
    }
    out.push(r);
  }
  return out;
}

// Recompute a whole `daily` block's rolling series (every chain column).
function rollingBlock(daily: TimeseriesBlock): TimeseriesBlock {
  const types = (daily.types as string[]) ?? [];
  const out: TimeseriesBlock = { types: [...types] };
  for (const key of Object.keys(daily)) {
    if (key === "types") continue;
    out[key] = rolling7d(types, daily[key] as Row[]);
  }
  return out;
}

// Backfill `daily_7d_rolling` on a single node from its `daily` series.
// Returns the node unchanged if the field already exists or there's no `daily`.
function backfillNode<T extends RollingNode>(node: T): T {
  if (!node || node.daily_7d_rolling || !node.daily) return node;
  return { ...node, daily_7d_rolling: rollingBlock(node.daily) };
}

// Ensure a category node — and each of its subcategory nodes — carries a
// `daily_7d_rolling` field, recomputing from `daily` where the backend has
// dropped it. Idempotent: when the field is already present (e.g. the combined
// file, or before the backend flips the drop flag) the input is returned as-is.
export function ensureRolling7d<T extends RollingNode>(node: T): T {
  if (!node) return node;

  let next = backfillNode(node);

  const subs = next.subcategories;
  if (subs && typeof subs === "object") {
    let subsChanged = false;
    const nextSubs: NonNullable<RollingNode["subcategories"]> = {
      ...subs,
    };
    for (const key of Object.keys(subs)) {
      if (key === "list") continue;
      const subNode = subs[key];
      if (subNode && typeof subNode === "object" && !Array.isArray(subNode)) {
        const backfilled = backfillNode(subNode as RollingNode);
        if (backfilled !== subNode) {
          nextSubs[key] = backfilled;
          subsChanged = true;
        }
      }
    }
    if (subsChanged) {
      if (next === node) next = { ...node };
      next.subcategories = nextSubs;
    }
  }

  return next;
}
