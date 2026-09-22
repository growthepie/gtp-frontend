"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
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
export default function RankingSection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("everything");
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];

  const rows = RANKS.filter((r) => r.name === "ETH" || filter === "everything" || r.kind === filter).sort((a, b) => b.capB - a.capB);
  const max = Math.max(...rows.map((r) => r.capB));

  // The time axis rides on the real supply series' timestamps, so the x values
  // are honest dates and identical on server and client (no Date.now()).
  const ratioSeries = useMemo<GTPChartSeries[] | null>(() => {
    const timestamps = ethSnapshot?.recentTimestamps;
    if (!timestamps?.length) return null;
    const data: [number, number][] = timestamps.map((ts, i) => [
      ts,
      0.031 + Math.sin(i / 9) * 0.004 + Math.sin(i / 24) * 0.006 + i * 0.00008,
    ]);
    return [{ name: "ETH / BTC", data, seriesType: "area", color: hex.yellow }];
  }, [ethSnapshot?.recentTimestamps, hex.yellow]);

  const latestRatio = useMemo(() => {
    if (!ratioSeries) return null;
    const points = ratioSeries[0].data;
    return points[points.length - 1][1];
  }, [ratioSeries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] items-start">
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-rank" title="How big is it, really?" titleSize="md" as="h2" />
        <SectionDescription>ETH next to assets you already have a sense of.</SectionDescription>
        <GTPButtonRow>
          {FILTERS.map((f) => (
            <GTPButton key={f} label={f} isSelected={filter === f} clickHandler={() => setFilter(f)} size="sm" />
          ))}
        </GTPButtonRow>
        <Card>
          <div className="flex flex-col gap-y-[8px]">
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
        </Card>
        <IllustrativeNote>Market caps are illustrative.</IllustrativeNote>
      </div>

      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-compare" title="ETH / BTC" titleSize="md" as="h2" />
        <SectionDescription>Without commentary.</SectionDescription>
        <Card>
          <div className="flex items-baseline gap-x-[10px]">
            <span className="numbers-2xl">{latestRatio ? latestRatio.toFixed(4) : "—"}</span>
            <span className="heading-small-xxxs pt-[1px]">BTC per ETH</span>
          </div>
          <div className="h-[200px]">
            {ratioSeries && (
              <GTPChart
                series={ratioSeries}
                xAxisType="time"
                height="100%"
                lineWidth={2}
                areaOpacity={0.1}
                decimals={4}
                compactXAxis
                showWatermark={false}
              />
            )}
          </div>
        </Card>
        <IllustrativeNote>The ETH/BTC series is illustrative.</IllustrativeNote>
      </div>
    </div>
  );
}
