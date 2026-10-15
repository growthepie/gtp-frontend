"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import { BarRow } from "./_components/StatBar";
import { ACCENT_HEX } from "./_components/colors";
import { EthAssetMarketCapsResponse, MarketCapCategory } from "@/lib/eth-the-asset/data";
import { EthAssetURLs } from "@/lib/urls";

type Asset = { key: string; name: string; cap: number; kind: MarketCapCategory; method?: string };

const FILTERS = ["everything", "equity", "commodity", "crypto"] as const;

// Oil (proved reserves × Brent) is hundreds of times ETH, so the bar scale stops at
// the next-largest asset and oil's bar runs off the end, labelled with its value.
const OFF_SCALE_KEYS = ["oil"];

const formatCap = (usd: number) => (usd >= 1e12 ? `$${(usd / 1e12).toFixed(2)}T` : `$${Math.round(usd / 1e9)}B`);

export default function RankingSection() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("everything");
  const [filtersWrapping, setFiltersWrapping] = useState(false);
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];
  const { data } = useSWR<EthAssetMarketCapsResponse>(EthAssetURLs.marketCaps);
  const caps = data?.data;

  const allAssets = useMemo<Asset[]>(() => {
    if (!caps?.categories) return [];
    return (Object.keys(caps.categories) as MarketCapCategory[])
      .flatMap((kind) =>
        caps.categories[kind].map((item) => ({
          key: item.key,
          name: item.key === "eth" ? "ETH" : item.name,
          cap: item.market_cap_usd,
          kind,
          method: item.method,
        })),
      )
      .filter((a) => Number.isFinite(a.cap))
      .sort((a, b) => b.cap - a.cap);
  }, [caps]);

  const rows = allAssets.filter((r) => r.key === "eth" || filter === "everything" || r.kind === filter);
  const scaleOf = (assets: Asset[]) => Math.max(0, ...assets.filter((r) => !OFF_SCALE_KEYS.includes(r.key)).map((r) => r.cap));
  const max = scaleOf(rows);
  const fullMax = scaleOf(allAssets);

  const sourceNames = useMemo(
    () => [...new Set(allAssets.length ? Object.values(caps!.categories).flat().flatMap((a) => a.sources.map((s) => s.name)) : [])],
    [allAssets, caps],
  );

  const ratio = caps?.eth_btc_ratio;
  const ratioSeries = useMemo<GTPChartSeries[] | null>(() => {
    const points = ratio?.data?.filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v));
    if (!points?.length) return null;
    const data: [number, number][] = points.map(([t, v]) => [t, v * 100]);
    return [{ name: "ETH / BTC market cap", data, seriesType: "area", color: hex.yellow }];
  }, [ratio?.data, hex.yellow]);
  const latestRatio = ratio && Number.isFinite(ratio.current) ? ratio.current * 100 : null;
  const ratioSince = ratioSeries
    ? new Date(ratioSeries[0].data[0][0]).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    : null;
  const showsOffScale = rows.some((r) => OFF_SCALE_KEYS.includes(r.key));

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
              {allAssets.map((r) => (
                <BarRow key={r.key} label={r.name} value={r.cap} display={formatCap(r.cap)} max={fullMax} color="neutral" />
              ))}
            </div>
            <div className="[grid-area:1/1] flex flex-col gap-y-[8px]">
              {rows.map((r) => (
                <BarRow
                  key={r.key}
                  label={r.name}
                  value={r.cap}
                  display={formatCap(r.cap)}
                  max={max}
                  color={r.key === "eth" ? "turquoise" : "neutral"}
                  emphasis={r.key === "eth"}
                  hint={r.method}
                />
              ))}
            </div>
          </div>
        </Card>
        <div className="text-xs text-color-text-primary/70">
          {showsOffScale && "Oil runs off the scale. "}Commodity caps are estimates (hover a row for the method).
          {sourceNames.length > 0 && <> Sources: {sourceNames.join(", ")}.</>}
        </div>
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
        <div className="text-xs text-color-text-primary/70">
          {ratioSince && `Daily, since ${ratioSince}.`}{ratio?.sources?.length ? ` Sources: ${ratio.sources.map((s) => s.name).join(", ")}.` : ""}
        </div>
      </div>
    </div>
  );
}
