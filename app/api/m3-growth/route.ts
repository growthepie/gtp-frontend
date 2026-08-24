import { NextResponse } from "next/server";
import JSZip from "jszip";

const CFS_DIVISIA_URL = "https://www.centerforfinancialstability.org/amfm/Divisia.xlsx";
const HISTORY_YEARS = 10;
const EXCEL_EPOCH_OFFSET_DAYS = 25_569;

type Observation = {
  timestamp: number;
  value: number;
};

// Annual June observations from the CFS workbook. The upstream Excel download
// is occasionally slow or unavailable, so keep a small verified snapshot to
// ensure the simulation can still render rather than returning an SWR error.
const FALLBACK_OBSERVATIONS: Observation[] = [
  ["2016-06-01", 1354.9749692941234],
  ["2017-06-01", 1404.8552242216506],
  ["2018-06-01", 1457.9794122404385],
  ["2019-06-01", 1527.8990079472164],
  ["2020-06-01", 1843.9897398607047],
  ["2021-06-01", 2008.6453958310663],
  ["2022-06-01", 2104.725990367495],
  ["2023-06-01", 2038.4735388537197],
  ["2024-06-01", 2063.8506165475783],
  ["2025-06-01", 2146.895921307551],
  ["2026-06-01", 2287.0855187384755],
].map(([date, value]) => ({ timestamp: Date.parse(`${date}T00:00:00Z`), value: Number(value) }));

const responseFor = (observations: Observation[], isFallback = false) => {
  const latest = observations.at(-1);
  if (!latest) throw new Error("CFS workbook returned no usable Divisia M3 observations");

  const targetTime = latest.timestamp - HISTORY_YEARS * 365.25 * 24 * 60 * 60 * 1000;
  const baseline = observations.reduce((closest, observation) =>
    Math.abs(observation.timestamp - targetTime) < Math.abs(closest.timestamp - targetTime)
      ? observation
      : closest,
  );
  const elapsedYears = (latest.timestamp - baseline.timestamp) / (365.25 * 24 * 60 * 60 * 1000);
  const annualRate = (latest.value / baseline.value) ** (1 / elapsedYears) - 1;

  return NextResponse.json({
    annualRate,
    index: latest.value,
    history: observations.filter((observation) => observation.timestamp >= targetTime),
    latestDate: new Date(latest.timestamp).toISOString().slice(0, 10),
    baselineDate: new Date(baseline.timestamp).toISOString().slice(0, 10),
    source: "Center for Financial Stability Divisia M3",
    isFallback,
  });
};

export async function GET() {
  try {
    const response = await fetch(CFS_DIVISIA_URL, {
      next: { revalidate: 24 * 60 * 60 },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`CFS returned HTTP ${response.status}`);

    const workbook = await JSZip.loadAsync(await response.arrayBuffer());
    const worksheet = workbook.file("xl/worksheets/sheet1.xml");
    if (!worksheet) throw new Error("CFS workbook is missing its Broad worksheet");

    const xml = await worksheet.async("text");
    const observations: Observation[] = [];
    for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = new Map<string, number>();
      for (const cellMatch of rowMatch[1].matchAll(
        /<c[^>]*r="([AJ])\d+"[^>]*>\s*<v>([^<]+)<\/v>\s*<\/c>/g,
      )) {
        cells.set(cellMatch[1], Number(cellMatch[2]));
      }

      const excelDate = cells.get("A");
      const m3Index = cells.get("J");
      if (
        !Number.isFinite(excelDate) ||
        !Number.isFinite(m3Index) ||
        excelDate! < EXCEL_EPOCH_OFFSET_DAYS
      ) {
        continue;
      }
      observations.push({
        timestamp: (excelDate! - EXCEL_EPOCH_OFFSET_DAYS) * 24 * 60 * 60 * 1000,
        value: m3Index!,
      });
    }

    return responseFor(observations);
  } catch {
    return responseFor(FALLBACK_OBSERVATIONS, true);
  }
}
