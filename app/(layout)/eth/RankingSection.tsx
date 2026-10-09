"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import { BarRow } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { ACCENT_HEX } from "./_components/colors";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";

// Illustrative — no live source for cross-asset market caps exists in this repo.
type Asset = { name: string; capB: number; kind: "equity" | "commodity" | "crypto" };
const RANKS: Asset[] = [
  { name: "Gold", capB: 22400, kind: "commodity" },
  { name: "Nvidia", capB: 4180, kind: "equity" },
  { name: "Apple", capB: 3410, kind: "equity" },
  { name: "Silver", capB: 1890, kind: "commodity" },
  { name: "Bitcoin", capB: 1720, kind: "crypto" },
  { name: "Berkshire Hathaway", capB: 1040, kind: "equity" },
  { name: "Visa", capB: 640, kind: "equity" },
  { name: "ETH", capB: 504, kind: "crypto" },
  { name: "Coca-Cola", capB: 290, kind: "equity" },
];

const FILTERS = ["everything", "equity", "commodity", "crypto"] as const;

// ETH's market cap as a % of Bitcoin's, ending on the same caps as the ranking
// so the two charts agree.
const capOf = (name: string) => RANKS.find((r) => r.name === name)!.capB;
const LATEST_CAP_RATIO_PCT = (capOf("ETH") / capOf("Bitcoin")) * 100;
export default function RankingSection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("everything");
  const [filtersWrapping, setFiltersWrapping] = useState(false);
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];

  const rows = RANKS.filter((r) => r.name === "ETH" || filter === "everything" || r.kind === filter).sort((a, b) => b.capB - a.capB);
  const max = Math.max(...rows.map((r) => r.capB));

  // The time axis rides on the real supply series' timestamps, so the x values
  // are honest dates and identical on server and client (no Date.now()).
  const ratioSeries = useMemo<GTPChartSeries[] | null>(() => {
    const timestamps = ethSnapshot?.recentTimestamps;
    if (!timestamps?.length) return null;
    // Illustrative shape, scaled so the last point lands on today's cap ratio.
    const shape = timestamps.map((_, i) => 0.031 + Math.sin(i / 9) * 0.004 + Math.sin(i / 24) * 0.006 + i * 0.00008);
    const scale = LATEST_CAP_RATIO_PCT / shape[shape.length - 1];
    const data: [number, number][] = timestamps.map((ts, i) => [ts, shape[i] * scale]);
    return [{ name: "ETH / BTC market cap", data, seriesType: "area", color: hex.yellow }];
  }, [ethSnapshot?.recentTimestamps, hex.yellow]);

  const latestRatio = useMemo(() => {
    if (!ratioSeries) return null;
    const points = ratioSeries[0].data;
    return points[points.length - 1][1];
  }, [ratioSeries]);

  // Side by side, both columns stretch to the taller one and their cards fill
  // the slack, so the two footnotes line up.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-rank" title="How big is it, really?" titleSize="md" as="h2" />
        <SectionDescription>ETH next to assets you already have a sense of.</SectionDescription>
        {/* Same control bar as the fundamentals charts. It sits inside this column, so
            side by side it stops at the column edge rather than running under ETH / BTC.
            The four labels don't fit a phone on one line, so the row itself wraps and
            reports it (the bar's own check only sees one item, the row). */}
        <GTPButtonContainer style={filtersWrapping ? { borderRadius: "15px" } : undefined}>
          <GTPButtonRow wrap onWrapChange={setFiltersWrapping}>
            {FILTERS.map((f) => (
              <GTPButton key={f} label={f} isSelected={filter === f} clickHandler={() => setFilter(f)} size="sm" />
            ))}
          </GTPButtonRow>
        </GTPButtonContainer>
        <Card className="flex-1">
          {/* An invisible copy of the full list shares the grid cell, so the card
              keeps the "everything" height whichever filter is picked. */}
          <div className="grid">
            <div className="[grid-area:1/1] invisible flex flex-col gap-y-[8px]" aria-hidden>
              {RANKS.map((r) => (
                <BarRow key={r.name} label={r.name} value={r.capB} display={`$${(r.capB / 1000).toFixed(2)}T`} max={max} color="neutral" />
              ))}
            </div>
            <div className="[grid-area:1/1] flex flex-col gap-y-[8px]">
              {rows.map((r) => (
                <BarRow
                  key={r.name}
                  label={r.name}
                  value={r.capB}
                  display={`$${(r.capB / 1000).toFixed(2)}T`}
                  max={max}
                  color={r.name === "ETH" ? "turquoise" : "neutral"}
                  emphasis={r.name === "ETH"}
                />
              ))}
            </div>
          </div>
        </Card>
        <IllustrativeNote>Market caps are illustrative.</IllustrativeNote>
      </div>

      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-compare" title="ETH / BTC market cap" titleSize="md" as="h2" />
        <SectionDescription>Without commentary.</SectionDescription>
        <Card className="flex-1">
          <div className="flex items-baseline gap-x-[10px]">
            <span className="numbers-2xl">{latestRatio ? `${latestRatio.toFixed(1)}%` : "—"}</span>
            <span className="heading-small-xxxs pt-[1px]">of Bitcoin&apos;s market cap</span>
          </div>
          {/* Fixed height when stacked; grows into the card when side by side. */}
          <div className="relative h-[200px] lg:h-auto lg:flex-1 lg:min-h-[200px]">
            {ratioSeries && (
              <div className="absolute inset-0">
                <GTPChart
                  series={ratioSeries}
                  xAxisType="time"
                  height="100%"
                  lineWidth={2}
                  areaOpacity={0.1}
                  decimals={1}
                  suffix="%"
                  compactXAxis
                  showWatermark={false}
                />
              </div>
            )}
          </div>
        </Card>
        <IllustrativeNote>The ETH/BTC market cap series is illustrative.</IllustrativeNote>
      </div>
    </div>
  );
}
