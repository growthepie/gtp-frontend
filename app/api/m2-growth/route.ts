import { NextResponse } from "next/server";

const M2_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=M2SL";
const HISTORY_YEARS = 10;

type Observation = {
  date: Date;
  value: number;
};

export async function GET() {
  try {
    const response = await fetch(M2_CSV_URL, {
      next: { revalidate: 24 * 60 * 60 },
    });

    if (!response.ok) {
      throw new Error(`FRED returned HTTP ${response.status}`);
    }

    const rows = (await response.text()).trim().split("\n").slice(1);
    const observations = rows
      .map((row): Observation | null => {
        const [dateString, valueString] = row.trim().split(",");
        const date = new Date(`${dateString}T00:00:00Z`);
        const value = Number(valueString);
        return Number.isFinite(date.getTime()) && Number.isFinite(value)
          ? { date, value }
          : null;
      })
      .filter((row): row is Observation => row !== null);

    const latest = observations.at(-1);
    if (!latest) throw new Error("FRED returned no usable M2 observations");

    const targetTime = Date.UTC(
      latest.date.getUTCFullYear() - HISTORY_YEARS,
      latest.date.getUTCMonth(),
      1,
    );
    const baseline = observations.reduce((closest, observation) =>
      Math.abs(observation.date.getTime() - targetTime) <
      Math.abs(closest.date.getTime() - targetTime)
        ? observation
        : closest,
    );
    const elapsedYears =
      (latest.date.getTime() - baseline.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualRate = (latest.value / baseline.value) ** (1 / elapsedYears) - 1;

    return NextResponse.json({
      annualRate,
      supply: latest.value * 1_000_000_000,
      history: observations
        .filter((observation) => observation.date.getTime() >= targetTime)
        .map((observation) => ({
          timestamp: observation.date.getTime(),
          value: observation.value * 1_000_000_000,
        })),
      latestDate: latest.date.toISOString().slice(0, 10),
      baselineDate: baseline.date.toISOString().slice(0, 10),
      historyYears: elapsedYears,
      source: "FRED M2SL",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to calculate M2 growth" },
      { status: 502 },
    );
  }
}
