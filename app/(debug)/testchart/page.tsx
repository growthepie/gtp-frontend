"use client";

import { type ReactNode, useMemo, useState } from "react";
import GTPChart from "@/components/GTPButton/GTPChart";
import { DEFAULT_COLORS } from "@/lib/echarts-utils";
import { GTPButton } from "@/components/GTPButton/GTPButton";

// --- Mock data helpers ---

const DAY_MS = 86_400_000;
const NOW = Date.now();
const START = NOW - 365 * DAY_MS;

function generateRandomWalk(
  points: number,
  baseValue: number,
  volatility: number,
  seed: number,
): [number, number][] {
  let value = baseValue;
  // Simple seeded PRNG (mulberry32)
  let s = seed | 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const result: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const timestamp = START + i * DAY_MS;
    value = Math.max(value + (rand() - 0.48) * volatility, baseValue * 0.1);
    result.push([timestamp, Math.round(value)]);
  }
  return result;
}

// --- Chain definitions ---

const CHAINS = [
  { name: "Ethereum", color: "#1C1CFF", seed: 1 },
  { name: "Arbitrum", color: "#12AAFF", seed: 2 },
  { name: "Optimism", color: "#FF0420", seed: 3 },
  { name: "Base", color: "#0052FF", seed: 4 },
  { name: "Polygon zkEVM", color: "#7B3FE4", seed: 5 },
  { name: "zkSync Era", color: "#4E529A", seed: 6 },
  { name: "Starknet", color: "#EC796B", seed: 7 },
  { name: "Linea", color: "#61DFFF", seed: 8 },
];

const BLOCKSPACE_CATEGORIES = [
  { name: "DeFi", color: "#1C1CFF", seed: 10 },
  { name: "NFT", color: "#FF0420", seed: 11 },
  { name: "Token Transfers", color: "#12AAFF", seed: 12 },
  { name: "Social", color: "#7B3FE4", seed: 13 },
  { name: "Gaming", color: "#EC796B", seed: 14 },
  { name: "Utility", color: "#00DACC", seed: 15 },
  { name: "Cross-chain", color: "#61DFFF", seed: 16 },
  { name: "Unlabeled", color: "#FFEEDA", seed: 17 },
];

// --- Layout helpers ---

function ShowcaseSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4 space-y-4">
      <header className="space-y-1">
        <h2 className="heading-small-xs lg:heading-small-sm">{title}</h2>
        {description ? <p className="text-xs lg:text-sm text-color-text-secondary">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function ChartContainer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-color-text-secondary uppercase tracking-[0.08em]">{label}</h3>
      <div className="rounded-[14px] border border-color-bg-default overflow-hidden" style={{ height: 360 }}>
        {children}
      </div>
    </div>
  );
}

// --- Timespan selector ---

const TIMESPANS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "1y", days: 365 },
  { label: "Max", days: 0 },
] as const;

function TimespanBar({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (days: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {TIMESPANS.map((t) => (
        <GTPButton
          key={t.label}
          label={t.label}
          clickHandler={() => onSelect(t.days)}
          variant="primary"
          size="xs"
          isSelected={selected === t.days}
        />
      ))}
    </div>
  );
}

// --- Page ---

export default function TestChartPage() {
  const [timespanDays, setTimespanDays] = useState(0);
  // Section 1: Fundamentals — multi-chain data (millions range)
  const chainSeries = useMemo(
    () =>
      CHAINS.map((chain) => ({
        data: generateRandomWalk(365, 2_000_000, 300_000, chain.seed),
        name: chain.name,
        color: chain.color,
      })),
    [],
  );

  // Compute xAxis bounds from selected timespan
  const xAxisRange = useMemo(() => {
    if (timespanDays === 0) return { xAxisMin: undefined, xAxisMax: undefined };
    const maxTimestamp = chainSeries[0]?.data[chainSeries[0].data.length - 1]?.[0] ?? NOW;
    return {
      xAxisMin: maxTimestamp - timespanDays * DAY_MS,
      xAxisMax: maxTimestamp,
    };
  }, [timespanDays, chainSeries]);

  // Section 2: Blockspace — category data (thousands range)
  const blockspaceSeries = useMemo(
    () =>
      BLOCKSPACE_CATEGORIES.map((cat) => ({
        data: generateRandomWalk(365, 5_000, 800, cat.seed),
        name: cat.name,
        color: cat.color,
      })),
    [],
  );

  // Section 3: Economics — revenue/costs (tens of millions)
  const revenueSeries = useMemo(
    () => generateRandomWalk(365, 30_000_000, 4_000_000, 100),
    [],
  );
  const costsSeries = useMemo(
    () => generateRandomWalk(365, 28_000_000, 3_800_000, 200),
    [],
  );
  const profitSeries = useMemo<[number, number][]>(
    () =>
      revenueSeries.map((point, i) => [
        point[0],
        point[1] - costsSeries[i][1],
      ]),
    [revenueSeries, costsSeries],
  );
  const sparklineSeries = useMemo(
    () => generateRandomWalk(365, 5_000_000, 600_000, 300),
    [],
  );

  return (
    <main className="min-h-screen bg-color-bg-default text-color-text-primary px-4 py-6 lg:px-8 font-raleway">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <header className="space-y-2">
          <h1 className="heading-small-md lg:heading-small-lg">GTPChart Test Page</h1>
          <p className="text-sm text-color-text-secondary">
            Route: <code>/testchart</code>. Recreates representative charts from Fundamentals, Blockspace, and Economics
            using the new <code>GTPChart</code> ECharts component with mock data.
          </p>
        </header>

        {/* ===== Section 1: Fundamentals ===== */}
        <ShowcaseSection
          title="1. Fundamentals Metrics"
          description="Multi-chain metrics charts mirroring MetricChart.tsx scale modes: absolute, stacked, percentage, and bar."
        >
          <TimespanBar selected={timespanDays} onSelect={setTimespanDays} />
          <div className="space-y-6">
            <ChartContainer label="Multi-chain Line (Absolute)">
              <GTPChart
                series={chainSeries.map((s) => ({
                  ...s,
                  seriesType: "line" as const,
                }))}
                xAxisMin={xAxisRange.xAxisMin}
                xAxisMax={xAxisRange.xAxisMax}
              />
            </ChartContainer>

            <ChartContainer label="Stacked Area">
              <GTPChart
                series={chainSeries.map((s) => ({
                  ...s,
                  seriesType: "area" as const,
                }))}
                stack
                xAxisMin={xAxisRange.xAxisMin}
                xAxisMax={xAxisRange.xAxisMax}
              />
            </ChartContainer>

            <ChartContainer label="Percentage Area">
              <GTPChart
                series={chainSeries.map((s) => ({
                  ...s,
                  seriesType: "area" as const,
                }))}
                stack
                percentageMode
                xAxisMin={xAxisRange.xAxisMin}
                xAxisMax={xAxisRange.xAxisMax}
              />
            </ChartContainer>

            <ChartContainer label="Bar (Stacked)">
              <GTPChart
                series={chainSeries.map((s) => ({
                  ...s,
                  seriesType: "bar" as const,
                }))}
                stack
                xAxisMin={xAxisRange.xAxisMin}
                xAxisMax={xAxisRange.xAxisMax}
              />
            </ChartContainer>
          </div>
        </ShowcaseSection>

        {/* ===== Section 2: Blockspace ===== */}
        <ShowcaseSection
          title="2. Blockspace Overview"
          description="Category breakdown charts mirroring OverviewChart.tsx stacked and share modes."
        >
          <div className="space-y-6">
            <ChartContainer label="Category Stacked Area">
              <GTPChart
                series={blockspaceSeries.map((s) => ({
                  ...s,
                  seriesType: "area" as const,
                }))}
                stack
              />
            </ChartContainer>

            <ChartContainer label="Category Percentage View">
              <GTPChart
                series={blockspaceSeries.map((s) => ({
                  ...s,
                  seriesType: "area" as const,
                }))}
                stack
                percentageMode
              />
            </ChartContainer>
          </div>
        </ShowcaseSection>

        {/* ===== Section 3: Economics ===== */}
        <ShowcaseSection
          title="3. Economics Breakdown"
          description="Revenue, costs, profit, and sparkline charts mirroring HeadCharts.tsx and BreakdownCharts.tsx."
        >
          <div className="space-y-6">
            <ChartContainer label="Revenue vs Costs (Overlapping Area)">
              <GTPChart
                series={[
                  {
                    name: "Revenue",
                    data: revenueSeries,
                    seriesType: "area",
                    color: "#10808C",
                  },
                  {
                    name: "Costs",
                    data: costsSeries,
                    seriesType: "area",
                    color: "#FE5468",
                  },
                ]}
              />
            </ChartContainer>

            <ChartContainer label="Profit Bar (Positive/Negative)">
              <GTPChart
                series={[
                  {
                    name: "Profit",
                    data: profitSeries,
                    seriesType: "bar",
                    color: "#FFCF27",
                    negativeColor: "#FE5468",
                  },
                ]}
              />
            </ChartContainer>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-color-text-secondary uppercase tracking-[0.08em]">
                Mini Area Sparkline
              </h3>
              <div
                className="rounded-[14px] border border-color-bg-default overflow-hidden"
                style={{ height: 80 }}
              >
                <GTPChart
                  series={[
                    {
                      name: "Metric",
                      data: sparklineSeries,
                      seriesType: "area",
                      color: DEFAULT_COLORS[0],
                    },
                  ]}
                  grid={{ left: 0, right: 0, top: 2, bottom: 0 }}
                  optionOverrides={{
                    xAxis: { show: false, type: "time", boundaryGap: false },
                    yAxis: { show: false },
                    tooltip: { show: false },
                  }}
                />
              </div>
            </div>
          </div>
        </ShowcaseSection>

      </div>
    </main>
  );
}
