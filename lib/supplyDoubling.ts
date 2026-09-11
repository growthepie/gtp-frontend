export const doublingYears = (annualRate: number | null): number | null => {
  if (annualRate === null || !Number.isFinite(annualRate) || annualRate <= -1) return null;
  if (annualRate <= 0) return Infinity;
  return Math.log(2) / Math.log1p(annualRate);
};

export const FIAT_SUPPLY_SERIES = [
  { currency: "USD", name: "US dollar", aggregate: "M2", series: "M2SL" },
  { currency: "EUR", name: "Euro", aggregate: "M3", series: "MABMM301EZM189S" },
  { currency: "GBP", name: "Pound sterling", aggregate: "M3", series: "MABMM301GBM189S" },
] as const;

export type FiatSupplyGrowth = {
  currency: string;
  annualRate: number | null;
  baselineDate: string | null;
  latestDate: string | null;
};
