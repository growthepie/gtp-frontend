"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import { BarRow } from "./_components/StatBar";
import ScrollArea from "./_components/ScrollArea";
import { ACCENT_HEX } from "./_components/colors";
import { EthAssetMarketCapsResponse, MarketCapCategory } from "@/lib/eth-the-asset/data";
import { EthAssetURLs } from "@/lib/urls";

type Asset = { key: string; name: string; cap: number; kind: MarketCapCategory; method?: string };

const FILTERS = ["everything", "equity", "commodity", "crypto"] as const;

// Oil (proved reserves × Brent) is hundreds of times ETH, so the bar scale stops at
// the next-largest asset and oil's bar runs off the end, labelled with its value.
const OFF_SCALE_KEYS = ["oil"];

// ETH / BTC chart spans. The series is daily since April 2021; "Max" shows all of
// it (the default), the shorter spans zoom in on recent days.
const RATIO_SPANS = [
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "1y", label: "1 year", days: 365 },
  { key: "max", label: "Max", days: null },
] as const;
type RatioSpan = (typeof RATIO_SPANS)[number]["key"];

const formatCap = (usd: number) => (usd >= 1e12 ? `$${(usd / 1e12).toFixed(2)}T` : `$${Math.round(usd / 1e9)}B`);

export default function RankingSection() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("everything");
  const [filtersWrapping, setFiltersWrapping] = useState(false);
  const [ratioSpan, setRatioSpan] = useState<RatioSpan>("max");
  const [ratioSpansWrapping, setRatioSpansWrapping] = useState(false);
  // A 1px marker right after ETH's row, at the bottom of where the row sits in the
  // list. While it's scrolled out of view, the sticky row is pinned over other rows.
  const [ethEnd, setEthEnd] = useState<HTMLDivElement | null>(null);
  const [ethPinned, setEthPinned] = useState(false);
  useEffect(() => {
    if (!ethEnd) return;
    const observer = new IntersectionObserver(([entry]) => setEthPinned(!entry.isIntersecting));
    observer.observe(ethEnd);
    return () => observer.disconnect();
  }, [ethEnd]);
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

  const sourceNames = useMemo(
    () => [...new Set(allAssets.length ? Object.values(caps!.categories).flat().flatMap((a) => a.sources.map((s) => s.name)) : [])],
    [allAssets, caps],
  );

  const ratio = caps?.eth_btc_ratio;
  const ratioSeries = useMemo<GTPChartSeries[] | null>(() => {
    const valid = ratio?.data?.filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v));
    if (!valid?.length) return null;
    const days = RATIO_SPANS.find((s) => s.key === ratioSpan)?.days;
    // Count back from the latest point, not from now, so a late update can't empty a span.
    const points = days ? valid.filter(([t]) => t > valid[valid.length - 1][0] - days * 86_400_000) : valid;
    const data: [number, number][] = points.map(([t, v]) => [t, v * 100]);
    return [{ name: "ETH / BTC market cap", data, seriesType: "area", color: hex.yellow }];
  }, [ratio?.data, ratioSpan, hex.yellow]);
  const latestRatio = ratio && Number.isFinite(ratio.current) ? ratio.current * 100 : null;
  const ratioSpanDays = RATIO_SPANS.find((s) => s.key === ratioSpan)?.days;
  const ratioSince = ratioSeries
    ? ratioSpanDays
      ? `last ${RATIO_SPANS.find((s) => s.key === ratioSpan)!.label}`
      : "since " + new Date(ratioSeries[0].data[0][0]).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    : null;
  const showsOffScale = rows.some((r) => OFF_SCALE_KEYS.includes(r.key));

  // Side by side, the two columns share one set of rows (subgrid: title,
  // description, button bar, card, footnote), so the cards are always the same
  // height even when one footnote wraps to two lines and the other doesn't.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
      <div className="flex flex-col gap-y-[15px] lg:grid lg:grid-rows-subgrid lg:row-span-5">
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
        {/* Fixed height whichever filter is picked; the list scrolls inside it. 342px
            shows 12 full rows above the pinned ETH row, with no part-row peeking out. */}
        <Card className="h-[342px]">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-y-[8px]">
              {rows.map((r) => (
                <Fragment key={r.key}>
                <BarRow
                  label={r.name}
                  value={r.cap}
                  display={formatCap(r.cap)}
                  max={max}
                  color={r.key === "eth" ? "turquoise" : "neutral"}
                  emphasis={r.key === "eth"}
                  accentLabel={r.key === "eth"}
                  hint={r.method}
                  // ETH stays in view: while its row is below the fold it sticks to the
                  // bottom of the list, then scrolls up with the rest once reached. While
                  // pinned, the rows just above it fade out behind it.
                  className={
                    r.key === "eth"
                      ? `sticky bottom-0 z-[1] bg-color-bg-default py-[4px] -my-[4px] before:absolute before:inset-x-0 before:bottom-full before:h-[32px] before:bg-gradient-to-t before:from-color-bg-default before:to-color-bg-default/0 before:pointer-events-none before:transition-opacity before:duration-200 ${ethPinned ? "before:opacity-100" : "before:opacity-0"}`
                      : ""
                  }
                />
                {/* -mt cancels the list gap so the marker sits right under ETH's row. */}
                {r.key === "eth" && <div ref={setEthEnd} aria-hidden className="h-[1px] -mt-[9px]" />}
                </Fragment>
              ))}
            </div>
          </ScrollArea>
        </Card>
        <div className="text-xs text-color-text-primary/70">
          {showsOffScale && "Oil runs off the scale. "}Commodity caps are estimates (hover a row for the method).
          {sourceNames.length > 0 && <> Sources: {sourceNames.join(", ")}.</>}
        </div>
      </div>

      <div className="flex flex-col gap-y-[15px] lg:grid lg:grid-rows-subgrid lg:row-span-5">
        <SectionTitle icon="gtp-compare" title="ETH / BTC market cap" titleSize="md" as="h2" />
        <SectionDescription>Without commentary.</SectionDescription>
        <GTPButtonContainer style={ratioSpansWrapping ? { borderRadius: "15px" } : undefined}>
          <GTPButtonRow wrap onWrapChange={setRatioSpansWrapping}>
            {RATIO_SPANS.map((s) => (
              <GTPButton
                key={s.key}
                label={s.label}
                isSelected={ratioSpan === s.key}
                clickHandler={() => setRatioSpan(s.key)}
                size="sm"
              />
            ))}
          </GTPButtonRow>
        </GTPButtonContainer>
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
          {ratioSince && `Daily, ${ratioSince}.`}{ratio?.sources?.length ? ` Sources: ${ratio.sources.map((s) => s.name).join(", ")}.` : ""}
        </div>
      </div>
    </div>
  );
}
