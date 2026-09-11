import { NextResponse } from "next/server";
import { FIAT_SUPPLY_SERIES, FiatSupplyGrowth } from "@/lib/supplyDoubling";

export async function GET() {
  const currencies = await Promise.all(
    FIAT_SUPPLY_SERIES.map(async ({ currency, series }): Promise<FiatSupplyGrowth> => {
      try {
        const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`, {
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error("Money supply unavailable");
        const observations = (await response.text()).trim().split("\n").slice(1)
          .map((row) => {
            const [date, rawValue] = row.trim().split(",");
            return { date, timestamp: Date.parse(`${date}T00:00:00Z`), value: Number(rawValue) };
          })
          .filter(({ timestamp, value }) => Number.isFinite(timestamp) && Number.isFinite(value) && value > 0)
          .sort((a, b) => a.timestamp - b.timestamp);
        const latest = observations.at(-1);
        if (!latest) throw new Error("No observations");
        const target = new Date(latest.timestamp);
        target.setUTCFullYear(target.getUTCFullYear() - 10);
        const baseline = observations.reduce((closest, row) =>
          Math.abs(row.timestamp - target.getTime()) < Math.abs(closest.timestamp - target.getTime()) ? row : closest,
        );
        const years = (latest.timestamp - baseline.timestamp) / (365.25 * 86400000);
        if (years < 9 || years > 11) throw new Error("Insufficient ten-year history");
        const annualRate = Math.expm1(Math.log(latest.value / baseline.value) / years);
        if (!Number.isFinite(annualRate)) throw new Error("Invalid growth rate");
        return { currency, annualRate, baselineDate: baseline.date, latestDate: latest.date };
      } catch {
        return { currency, annualRate: null, baselineDate: null, latestDate: null };
      }
    }),
  );
  return NextResponse.json({ currencies });
}
