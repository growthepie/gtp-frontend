"use client";

import useSWR from "swr";
import { doublingYears, FIAT_SUPPLY_SERIES, FiatSupplyGrowth } from "@/lib/supplyDoubling";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Supply data unavailable");
  return response.json();
};

export default function SupplyDoubling({ annualRate, rateDate }: {
  annualRate: number | null;
  rateDate: string | null;
}) {
  const { data, error } = useSWR<{ currencies: FiatSupplyGrowth[] }>("/api/supply-doubling", fetcher, {
    revalidateOnFocus: false,
  });
  const rows = [
    { currency: "ETH", name: "Ether", aggregate: "Net issuance", annualRate,
      period: rateDate ? `Annualised rate · ${rateDate}` : "Rate unavailable",
      source: "https://api.growthepie.com/v1/eim/eth_supply.json" },
    ...FIAT_SUPPLY_SERIES.map((asset) => {
      const observation = data?.currencies.find((row) => row.currency === asset.currency);
      return { ...asset, annualRate: observation?.annualRate ?? null,
        period: observation?.latestDate ? `${observation.baselineDate} – ${observation.latestDate}` : data || error ? "Data unavailable" : "Loading…",
        source: `https://fred.stlouisfed.org/series/${asset.series}` };
    }),
  ];

  return (
    <section className="col-span-3 rounded-[15px] bg-color-bg-default p-[20px] md:p-[30px]" aria-labelledby="supply-doubling-title">
      <h2 id="supply-doubling-title" className="heading-large-md">Supply doubling time</h2>
      <p className="text-sm text-color-text-secondary mt-[8px]">
        How many years would it take for supply to double if this growth rate continued?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[15px] my-[20px]">
        {rows.map((row) => {
          const years = doublingYears(row.annualRate);
          return (
            <div key={row.currency} className={`rounded-[12px] border p-[20px] ${row.currency === "ETH" ? "border-color-accent-turquoise" : "border-color-text-secondary/20"}`}>
              <div className="flex justify-between gap-[10px] items-baseline">
                <h3 className="heading-large-sm">{row.currency}</h3>
                <span className="text-xs text-color-text-secondary">{row.aggregate}</span>
              </div>
              <p className="text-xs text-color-text-secondary mt-[4px]">{row.name}</p>
              <p className="text-2xl font-semibold tabular-nums mt-[20px]">
                {years === null ? "—" : years === Infinity ? "Does not double" : `${years.toLocaleString("en-GB", { maximumFractionDigits: 1 })} years`}
              </p>
              <p className="text-sm mt-[8px]">
                {row.annualRate === null ? "Growth rate unavailable" : `${(row.annualRate * 100).toFixed(4)}% annual growth`}
              </p>
              <a href={row.source} target="_blank" rel="noreferrer" className="block text-xs text-color-text-secondary underline mt-[12px]">
                {row.period}
              </a>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-color-text-secondary leading-relaxed">
        Years = ln(2) / ln(1 + annual growth rate). ETH uses its latest annualised net issuance rate;
        fiat uses compound annual growth over the ten years ending at each series’ latest observation.
        Fiat sources: Federal Reserve (USD) and OECD (EUR, GBP), via FRED. Observation dates differ and
        some series are historical. M2 and M3 include bank deposits and have different definitions;
        they are not directly equivalent to ETH supply. Zero or negative growth does not double supply.
        This is a constant-growth illustration, not a forecast of supply, prices, or purchasing power.
      </p>
    </section>
  );
}
