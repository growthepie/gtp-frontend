"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import GTPMetricCard from "@/components/layout/Applications/AppMetricCard";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import { useMediaQuery } from "@react-hook/media-query";
import { useSSEMetrics } from "@/components/layout/EthAgg/useSSEMetrics";
import {
  EthAssetKpisResponse,
  EthAssetStatsResponse,
  KPI_TIMEFRAMES,
  KpiKey,
  KpiTimeframe,
  liveStatValue,
} from "@/lib/eth-the-asset/data";
import { EthAssetURLs } from "@/lib/urls";
import { ACCENT_HEX, AccentColor } from "./_components/colors";
import EtherDiamond from "./_components/EtherDiamond";

// Imperva (Thales) Bad Bot Report 2026: automated share of web traffic in 2025.
// Static — the report is annual; update when the next edition comes out.
const BOT_TRAFFIC_SHARE_PCT = 53;

// Both sides move by tiny amounts per second, so the figure needs ~13 decimals
// before the change is visible.
const ETH_PER_PERSON_DECIMALS = 13;

// One timespan drives every hero card. These are exactly the timeframes in
// eth_asset/kpis.json; each card's change is over the selected one.
const TIMESPANS: Record<KpiTimeframe, { label: string; shortLabel: string; dateFormat: string }> = {
  "24h": { label: "24 hours", shortLabel: "24h", dateFormat: "DD MMM HH:mm" },
  "7d": { label: "7 days", shortLabel: "7d", dateFormat: "DD MMM HH:mm" },
  "60d": { label: "60 days", shortLabel: "60d", dateFormat: "DD MMM YYYY" },
  "1y": { label: "1 year", shortLabel: "1y", dateFormat: "DD MMM YYYY" },
  "5y": { label: "5 years", shortLabel: "5y", dateFormat: "MMM YYYY" },
};

// change_pct is a fraction; the card wants a percentage. Null hides the badge.
const toPct = (fraction: number | null | undefined) =>
  fraction === null || fraction === undefined ? null : fraction * 100;

export default function EthHero() {
  const { globalMetrics } = useSSEMetrics();
  const { data: kpisData } = useSWR<EthAssetKpisResponse>(EthAssetURLs.kpis);
  const { data: statsData } = useSWR<EthAssetStatsResponse>(EthAssetURLs.stats);
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const walletsStat = statsData?.data?.total_wallets;
  const perPersonStat = statsData?.data?.eth_per_person;
  const lifetimeWallets = walletsStat ? Math.round(liveStatValue(walletsStat, now)) : null;
  const ethPerPerson = perPersonStat ? liveStatValue(perPersonStat, now) : null;
  const worldPopulation = perPersonStat
    ? perPersonStat.details.world_population +
      ((now - perPersonStat.timestamp) / 1000) * perPersonStat.details.world_population_per_second
    : null;

  const isMobile = useMediaQuery("(max-width: 967px)");
  const [timespan, setTimespan] = useState<KpiTimeframe>("1y");
  const [timespanBarWrapping, setTimespanBarWrapping] = useState(false);

  // Every card reads the same timeframe from kpis.json.
  const kpis = useMemo(() => {
    const series = (key: KpiKey) => {
      const tf = kpisData?.data?.kpis?.[key]?.timeframes?.[timespan];
      const points = tf?.data?.filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v)) ?? [];
      return {
        current: tf?.current,
        change: toPct(tf?.change_pct),
        values: points.map(([, v]) => v),
        timestamps: points.map(([t]) => new Date(t).toISOString()),
      };
    };
    return {
      price: series("eth_price"),
      supply: series("eth_supply"),
      stakingYield: series("staking_yield"),
      stakedShare: series("staked_share"),
      burned: series("eth_burned"),
    };
  }, [kpisData, timespan]);

  // The live SSE price when it's streaming, otherwise kpis.json's latest hourly price.
  const livePrice = globalMetrics.eth_price_usd;
  const isLivePrice = !!livePrice && livePrice > 0;
  const displayedPrice = isLivePrice ? livePrice : kpis.price.current;
  const kpisUpdated = kpisData?.last_updated_utc;
  const dateFormat = TIMESPANS[timespan].dateFormat;
  const hasSeries = (s: { values: number[]; current?: number }) => s.values.length > 1 && s.current !== undefined;

  const tile = (color: AccentColor) => hex[color];

  const supplyTooltip = useMemo(() => {
    const first = kpis.supply.values[0];
    const eth = (v: number) => `${Math.round(v).toLocaleString("en-US")} ETH`;
    return {
      formatValue: eth,
      detail: (i: number) => {
        const delta = kpis.supply.values[i] - first;
        // Change since the span's first point.
        return { value: `${delta >= 0 ? "+" : "−"}${eth(Math.abs(delta))}` };
      },
    };
  }, [kpis.supply.values]);

  return (
    <div className="@container flex flex-col gap-y-[30px]">
      {/* Hero columns switch at the same widths as the metric-card grid below (both are
          measured on this same-width container): 1 column → stacked, 2 card columns →
          1fr 1fr, 3 card columns → 2fr 1fr. Keep these in step with that grid. */}
      <div className="grid grid-cols-1 @[850px]:grid-cols-2 @[1295px]:grid-cols-[2fr_1fr] gap-[10px] items-center">
        <div className="flex flex-col gap-y-[15px]">
          <div className="heading-small-xs text-color-accent-turquoise">ETH the asset</div>
          <h1 className="heading-large-xl md:heading-large-2xl">The asset that pays you for holding it.</h1>
          <div className="text-md lg:text-lg">
            ETH secures Ethereum, earns a yield, and backs loans.
          </div>
          <div className="flex items-baseline gap-x-[12px] flex-wrap">
            {displayedPrice ? (
              <span className="numbers-5xl">
                {displayedPrice.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ) : (
              <span className="numbers-5xl text-color-text-primary/40">—</span>
            )}
            {/* The SSE stream doesn't currently send eth_price_usd, so the headline usually
                falls back to kpis.json's hourly price — only claim "live" when it really is. */}
            {isLivePrice ? (
              <span className="heading-small-xs flex items-center gap-x-[5px]">
                <span className="relative flex h-[6px] w-[6px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-positive opacity-75" />
                  <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-color-positive" />
                </span>
                1 ETH · live
              </span>
            ) : (
              displayedPrice && (
                <span className="heading-small-xs text-color-text-primary/70">
                  1 ETH{kpisUpdated ? ` · as of ${kpisUpdated.slice(11, 16)} UTC` : ""}
                </span>
              )
            )}
          </div>
          {/* The two stat pills sit on one row. They step down in size as the row narrows —
              full from 600px, compact from 500px, extra-compact below — so they still fit
              (the 2-column hero's heading can be as narrow as 420px). Only on small phones,
              where even the extra-compact pills don't fit, does the second one wrap.
              When shrunk, hovering a pill scales it back to full size (full ÷ shrunk
              width: ≈1.19 compact, ≈1.4 extra-compact), growing from its outer edge over
              the other pill so it never leaves the row. Once the second pill has wrapped
              onto its own row (< 419px) it grows rightward instead.
              Meanwhile the other pill shrinks toward its own outer edge so they never
              overlap. Sized for the narrowest row at each step: hovered full width + gap +
              shrunk sibling ≤ 500px (×0.8) or ≤ 419px (×0.58). Not needed once wrapped. */}
          <div className="@container">
          <div className="flex flex-wrap items-center gap-x-[6px] @[500px]:gap-x-[10px] gap-y-[8px]">
          {lifetimeWallets && lifetimeWallets > 0 && (
            <div className="flex flex-wrap items-center gap-x-[4px] @[500px]:gap-x-[6px] @[600px]:gap-x-[8px] min-h-[26px] @[500px]:min-h-[30px] @[600px]:min-h-[36px] px-[8px] @[500px]:px-[10px] @[600px]:px-[15px] py-[4px] @[500px]:py-[5px] @[600px]:py-[6px] rounded-full bg-color-bg-medium w-fit origin-left relative z-0 hover:z-10 transition-transform duration-200 hover:scale-[1.4] @[500px]:hover:scale-[1.19] @[600px]:hover:scale-100 @[419px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.58] @[500px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.8] @[600px]:[:has(>*:hover)>&:not(:hover)]:scale-100">
              <GTPIcon icon="gtp-wallet" size="sm" className="text-color-accent-turquoise" />
              <span className="flex items-center gap-x-[3px] @[500px]:gap-x-[4px] @[600px]:gap-x-[5px]">
                <span className="numbers-xxs @[500px]:numbers-xs @[600px]:numbers-sm tabular-nums">{lifetimeWallets.toLocaleString("en-US")}</span>
                <span className="heading-small-xxxs @[500px]:heading-small-xxs @[600px]:heading-small-xs">wallets used ETH</span>
              </span>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About wallets that have used ETH" className="flex items-center justify-center">
                    <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm flex flex-col gap-y-[8px]">
                  <span>
                    Every address that has ever been active on Ethereum Mainnet, ticking forward at today&apos;s pace
                    of new addresses. Wallets aren&apos;t people — one person can
                    have many, and exchanges hold ETH for millions of users in a few. Addresses that have only used Layer 2s
                    aren&apos;t counted.
                  </span>
                  <span>
                    Not every wallet is a person, either: online, {BOT_TRAFFIC_SHARE_PCT}% of web traffic is bots — 40%
                    malicious and 13% benign ones like search crawlers, against 47% humans (Imperva Bad Bot Report 2026,
                    measured across sites Imperva protects).
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {ethPerPerson !== null && (
            <div className="flex flex-wrap items-center gap-x-[4px] @[500px]:gap-x-[6px] @[600px]:gap-x-[8px] min-h-[26px] @[500px]:min-h-[30px] @[600px]:min-h-[36px] px-[8px] @[500px]:px-[10px] @[600px]:px-[15px] py-[4px] @[500px]:py-[5px] @[600px]:py-[6px] rounded-full bg-color-bg-medium w-fit origin-left @[419px]:origin-right relative z-0 hover:z-10 transition-transform duration-200 hover:scale-[1.4] @[500px]:hover:scale-[1.19] @[600px]:hover:scale-100 @[419px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.58] @[500px]:[:has(>*:hover)>&:not(:hover)]:scale-[0.8] @[600px]:[:has(>*:hover)>&:not(:hover)]:scale-100">
              <GTPIcon icon="gtp-users-monochrome" size="sm" className="text-color-accent-yellow" />
              <span className="flex items-center gap-x-[3px] @[500px]:gap-x-[4px] @[600px]:gap-x-[5px]">
                <span className="numbers-xxs @[500px]:numbers-xs @[600px]:numbers-sm tabular-nums">{ethPerPerson?.toFixed(ETH_PER_PERSON_DECIMALS)}</span>
                <span className="heading-small-xxxs @[500px]:heading-small-xxs @[600px]:heading-small-xs">ETH per person</span>
              </span>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About ETH per person" className="flex items-center justify-center">
                    <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm flex flex-col gap-y-[8px]">
                  <span>
                    If all ETH were split evenly across the world&apos;s{" "}
                    <span className="numbers-xs tabular-nums">{Math.round(worldPopulation ?? 0).toLocaleString("en-US")}</span>{" "}
                    people, each would have {ethPerPerson?.toFixed(4)} ETH. Most people hold none, so owning even a small
                    amount puts you in a meaningful percentile of holders.
                  </span>
                  <span>
                    Both sides tick forward every second at their current pace: supply from ultrasound.money, and world
                    population projected from World Bank data, not counted live.
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          </div>
          </div>
        </div>
        <EtherDiamond height={380} />
      </div>

      {/* Columns follow the grid's own width (not the viewport), so the sidebar being
          open or closed doesn't matter. 3 columns from 1295px (cards ≥ 425px, sparkline ≥ 110px) — low enough for a
          14" MacBook Pro (1512px) with the sidebar hidden, which gives a ~1321px grid. 2 columns
          from 850px: cards ≥ 420px, which still leaves the sparkline 105px between the
          label column and the value (see FILL_SPARKLINE_* in AppMetricCard). */}
      <div className="@container flex flex-col gap-y-[10px]">
        {/* Same bar and buttons as the fundamentals chart timespans; every card below
            follows it, and each card's change is over the selected span. */}
        <GTPButtonContainer
          isWrapping={timespanBarWrapping}
          setIsWrapping={setTimespanBarWrapping}
          style={timespanBarWrapping ? { borderRadius: "15px" } : undefined}
        >
          <GTPButtonRow autoFill>
            {KPI_TIMEFRAMES.map((key) => (
              <GTPButton
                key={key}
                label={isMobile ? TIMESPANS[key].shortLabel : TIMESPANS[key].label}
                innerStyle={isMobile ? { minWidth: 0, padding: "5px 8px" } : undefined}
                className="min-w-0"
                variant="primary"
                size="sm"
                clickHandler={() => setTimespan(key)}
                isSelected={timespan === key}
              />
            ))}
          </GTPButtonRow>
        </GTPButtonContainer>
        <div className="grid grid-cols-1 @[850px]:grid-cols-2 @[1295px]:grid-cols-3 gap-[10px]">
          {hasSeries(kpis.price) && displayedPrice ? (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label="ETH price"
              icon="gtp-tokeneth"
              value={displayedPrice}
              wowChange={kpis.price.change}
              prefix="$"
              sparkline={kpis.price.values}
              timestamps={kpis.price.timestamps}
              tooltipDateFormat={dateFormat}
              color={tile("turquoise")}
            />
          ) : (
            <div className="flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px]">
              <span className="flex items-center gap-x-[10px]">
                <GTPIcon icon="gtp-tokeneth" size="md" />
                <span className="heading-large-xxs xs:heading-large-xs">ETH price</span>
              </span>
              <span className="numbers-sm xs:numbers-md text-color-accent-turquoise">
                {displayedPrice?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "—"}
              </span>
            </div>
          )}
          {hasSeries(kpis.supply) && (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label="Supply"
              decimals={1}
              stackSuffixWhenNarrow
              icon="gtp-realtime"
              value={kpis.supply.current!}
              // Change over the selected span (net of burn).
              wowChange={kpis.supply.change}
              suffix=" ETH"
              sparkline={kpis.supply.values}
              timestamps={kpis.supply.timestamps}
              tooltipDateFormat={dateFormat}
              // Supply moves only a few thousand ETH a day, so "122.1M" would read the
              // same at every point: show it to the ETH, plus the change since the span began.
              tooltip={supplyTooltip}
              color={tile("yellow")}
            />
          )}
          {hasSeries(kpis.stakingYield) && (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label="Staking yield"
              icon="gtp-metrics-fdv"
              value={kpis.stakingYield.current! * 100}
              wowChange={kpis.stakingYield.change}
              suffix="% APR"
              sparkline={kpis.stakingYield.values.map((v) => v * 100)}
              timestamps={kpis.stakingYield.timestamps}
              tooltipDateFormat={dateFormat}
              color={tile("turquoise")}
            />
          )}
          {hasSeries(kpis.stakedShare) && (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label="Supply staked"
              decimals={1}
              icon="gtp-lock"
              value={kpis.stakedShare.current! * 100}
              wowChange={kpis.stakedShare.change}
              suffix="%"
              sparkline={kpis.stakedShare.values.map((v) => v * 100)}
              timestamps={kpis.stakedShare.timestamps}
              tooltipDateFormat={dateFormat}
              color={tile("turquoise")}
            />
          )}
          {hasSeries(kpis.burned) && (
            <GTPMetricCard
              fillSparkline
              nonInteractive
              label="ETH burned"
              decimals={1}
              stackSuffixWhenNarrow
              icon="gtp-metrics-feespaidbyusers"
              // Total burned within the span; the change is vs the previous equal span.
              value={kpis.burned.current!}
              wowChange={kpis.burned.change}
              suffix=" ETH"
              sparkline={kpis.burned.values}
              timestamps={kpis.burned.timestamps}
              tooltipDateFormat={dateFormat}
              color={tile("red")}
            />
          )}
          <Link
            href="/ethereum-ecosystem/metrics"
            className="group flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px] shadow-standard transition-colors hover:bg-color-ui-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-color-accent-turquoise"
          >
            <span className="flex items-center gap-x-[10px]">
              <GTPIcon icon="gtp-metrics-activity" size="md" />
              <span className="heading-large-xxs xs:heading-large-xs">Ecosystem activity</span>
            </span>
            <GTPIcon icon="gtp-chevronright" size="sm" className="shrink-0 transition-transform group-hover:translate-x-[3px]" />
          </Link>
        </div>
        <div className="text-xs text-color-text-primary/70">
          Each card&apos;s change is over the selected timespan; burned compares the total with the previous equal span.
          Sources: CoinGecko, ultrasound.money, ethsupply.fyi and growthepie.
        </div>
      </div>
    </div>
  );
}
