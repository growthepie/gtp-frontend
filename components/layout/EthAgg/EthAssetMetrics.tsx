"use client";

// Top-of-page card row for the "ETH the Asset" ecosystem tab. Mirrors the
// layout of MetricsTop (uptime | TPS | token transfer fees) with each card
// swapped for an ETH-as-money equivalent:
//
//   Ethereum Uptime      -> ETH Price        (simulated random walk)
//   Ecosystem TPS        -> ETH Supply       (projected from issuance rate)
//   Token Transfer Fees  -> ETH per Person   (projected supply / projected population)
//
// Two of the three numbers are not measurements. The tab is gated to
// non-production builds; see app/(layout)/ethereum-ecosystem/[tab]/page.tsx.

import React, { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Container from "@/components/layout/Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipGeneral } from "@/components/GTPComponents/GTPTooltip";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { useTheme } from "next-themes";
import { useSSEMetrics } from "./useSSEMetrics";
import { ToggleSwitch } from "@/components/layout/ToggleSwitch";
import {
  ETH_AS_ASSET,
  ETH_STAKING_YIELD,
  formatCompact,
  formatRatePercent,
  useEthPrice24hChange,
  projectForward,
  roundRate,
  SIMULATED_ASSETS,
  SimulatedAsset,
  STAKED_ETH_AS_ASSET,
  STAKED_ETH_BASE_TIME,
  stakedEthIssuanceRate,
  useProjectedBurn,
  useProjectedPopulation,
  useProjectedStakedSupply,
  useSimulatedAssetPrices,
  useSimulatedAssetSupplies,
  useSimulatedPrice,
  useTicker,
  MS_PER_YEAR,
} from "./ethAssetHelpers";

const ETH_SUPPLY_URL = "https://api.growthepie.com/v1/eim/eth_supply.json";
const M2_GROWTH_URL = "/api/m2-growth";
const M3_GROWTH_URL = "/api/m3-growth";
const SIMULATION_SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  shouldRetryOnError: false,
} as const;

type M2GrowthResponse = {
  annualRate: number;
  supply: number;
  history: { timestamp: number; value: number }[];
  latestDate: string;
  baselineDate: string;
  historyYears: number;
};

type M3GrowthResponse = {
  annualRate: number;
  index: number;
  history: { timestamp: number; value: number }[];
  latestDate: string;
  baselineDate: string;
};

const useM2Growth = () =>
  useSWR<M2GrowthResponse>(M2_GROWTH_URL, SIMULATION_SWR_OPTIONS).data;
const useM3Growth = () =>
  useSWR<M3GrowthResponse>(M3_GROWTH_URL, SIMULATION_SWR_OPTIONS).data;

const USD_M3_AS_ASSET: SimulatedAsset = {
  key: "usd-m3",
  name: "USD M3",
  color: "#3D8B5A",
  unit: "index",
  priceAnchor: 1,
  priceVolatility: 0,
  supplyBase: 0,
  supplyBaseTime: 0,
  supplyAnnualRate: 0,
  supplyDecimals: 2,
  perPersonDecimals: 6,
  peoplePerUnitDecimals: 14,
};

/** ETH leads the inflation list so its rate can be read against the others. */
const INFLATION_ASSETS = [ETH_AS_ASSET, STAKED_ETH_AS_ASSET, ...SIMULATED_ASSETS];

/**
 * Seconds for a 1%/yr asset's marker to cross its track. Every other rate is
 * scaled off this, so changing it retimes the whole list without altering the
 * assets' speeds relative to each other.
 */
const SWEEP_SECONDS_AT_ONE_PERCENT = 2;

/**
 * Card chrome mirroring ExpandableCardContainer. Reimplemented here rather
 * than imported from MetricsTop so this tab does not pull that 1,300-line
 * module (and its chart dependencies) into the bundle for three cards.
 */
const AssetCard = ({
  children,
  infoSlot,
  isExpanded,
  onToggleExpand,
}: {
  children: React.ReactNode;
  infoSlot: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => (
  <div className="relative w-full z-0 h-full min-h-[306px]">
    {/* pb clears the absolutely-positioned chevron/info bar so the expanded
        list never runs underneath it. */}
    <div className="@container w-full h-full bg-color-bg-default rounded-[15px] flex flex-col pt-[15px] pb-[45px] px-[30px] relative overflow-hidden group/card">
      {children}
      <div className="absolute bottom-0 left-0 right-0 w-full py-[10px] px-[15px] h-fit flex items-center justify-between">
        <div className="w-[15px] h-fit" />
        <div
          className="cursor-pointer flex items-center justify-center"
          onClick={onToggleExpand}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse comparison assets" : "Expand comparison assets"}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleExpand();
            }
          }}
        >
          <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            <GTPIcon
              icon="in-button-down-monochrome"
              size="md"
              className="text-color-text-secondary group-hover/card:text-color-ui-hover transition-colors"
            />
          </div>
        </div>
        <div className="w-[15px] h-fit z-30">
          <GTPTooltipNew
            placement="top-start"
            unstyled
            allowInteract={true}
            trigger={
              <div className="flex items-center justify-center w-[15px] h-fit" data-tooltip-trigger>
                <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
              </div>
            }
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
          >
            <GTPTooltipGeneral width={350}>
              <div className="flex flex-col gap-y-[10px] pl-[20px]">{infoSlot}</div>
            </GTPTooltipGeneral>
          </GTPTooltipNew>
        </div>
      </div>
    </div>
  </div>
);

const ASSET_LIST_COLLAPSED_HEIGHT = 52;
const ASSET_ROW_HEIGHT = 22;
const assetListExpandedHeight = (rowCount: number) => 24 + rowCount * ASSET_ROW_HEIGHT;

/**
 * One comparison asset: name, then an optional sweep track, then its value.
 *
 * `sweepSeconds` animates a marker across the track once per that many
 * seconds, so the rate is read as motion rather than as a second number. A
 * negative value runs the marker right to left, for an asset whose supply is
 * shrinking rather than growing.
 */
const AssetRow = ({
  asset,
  value,
  sweepSeconds,
}: {
  asset: SimulatedAsset;
  value: string;
  sweepSeconds?: number | null;
}) => (
  <div className="flex items-center gap-x-[10px]" style={{ height: ASSET_ROW_HEIGHT }}>
    {/* Fixed width on rows with a track, so every track starts and ends at the
        same x — equal-length tracks are what keep the sweep speeds comparable.
        Sized to the widest ticker (dot + gap + ~27px) so the tracks start as
        far left as the labels allow. */}
    <div
      className={`flex items-center gap-x-[6px] min-w-0 shrink-0 ${
        sweepSeconds === undefined ? "" : "w-[52px]"
      }`}
    >
      <div className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
      <div className="heading-small-xxs truncate">{asset.name}</div>
    </div>

    {sweepSeconds !== undefined && (
      // Fixed rather than flexible, so the travel distance stays constant when
      // the text beside it changes length. Allowed to shrink on narrow cards —
      // the track gives way before the value does.
      <div className="relative w-[182px] min-w-[30px] h-[6px]">
        {sweepSeconds !== null && (
          <div
            className="inflation-sweep-marker absolute top-0 size-[6px] rounded-full"
            style={{
              backgroundColor: asset.color,
              animation: `inflation-sweep ${Math.abs(sweepSeconds)}s linear infinite${
                sweepSeconds < 0 ? " reverse" : ""
              }`,
            }}
          />
        )}
      </div>
    )}

    <div
      className={`numbers-xs whitespace-nowrap text-color-text-secondary ${
        sweepSeconds === undefined ? "ml-auto" : "shrink-0 text-left"
      }`}
    >
      {value}
    </div>
  </div>
);

/** The expandable list at the foot of each card. */
const AssetList = ({
  title,
  isExpanded,
  formatValue,
  assets = SIMULATED_ASSETS,
  sweepSeconds,
}: {
  title: string;
  isExpanded: boolean;
  formatValue: (asset: SimulatedAsset) => string;
  /** Defaults to the comparison assets; pass a wider set to include ETH. */
  assets?: SimulatedAsset[];
  /**
   * Seconds for a marker to cross the row, negative to cross it backwards;
   * omit for rows without a track.
   */
  sweepSeconds?: (asset: SimulatedAsset) => number | null;
}) => (
  <div className="relative flex flex-col gap-y-[5px] -mx-[15px] bg-color-bg-default rounded-b-[15px]">
    <div
      className={`flex flex-col gap-y-[2.5px] px-[15px] transition-height duration-500 overflow-y-hidden ${
        !isExpanded
          ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[30px] after:bg-gradient-to-t after:from-color-bg-default after:via-color-bg-default/80 after:to-color-bg-default/20 after:pointer-events-none'
          : ""
      }`}
      style={{
        height: isExpanded ? assetListExpandedHeight(assets.length) : ASSET_LIST_COLLAPSED_HEIGHT,
      }}
    >
      <div className="heading-small-xxxs text-color-text-secondary">{title}</div>
      {assets.map((asset) => (
        <AssetRow
          key={asset.key}
          asset={asset}
          value={formatValue(asset)}
          sweepSeconds={sweepSeconds?.(asset)}
        />
      ))}
    </div>
  </div>
);

const SimulatedBadge = () => (
  <div className="px-[5px] py-[1px] rounded-full bg-color-bg-medium heading-small-xxxs text-color-text-secondary whitespace-nowrap">
    simulated
  </div>
);

// --- Card 1: ETH Price (replaces Ethereum Uptime) ---

const EthPriceCard = ({
  isExpanded,
  onToggleExpand,
}: {
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const { globalMetrics } = useSSEMetrics();
  const { theme } = useTheme();
  const assetPrices = useSimulatedAssetPrices();

  // The live stream carries fee costs in both units; their ratio is the real
  // ETH price, which anchors the walk.
  const anchorPrice = useMemo(() => {
    if (globalMetrics.eth_price_usd && Number.isFinite(globalMetrics.eth_price_usd)) {
      return globalMetrics.eth_price_usd;
    }
    const usd = globalMetrics.ethereum_tx_cost_usd;
    const eth = globalMetrics.ethereum_tx_cost_eth;
    if (usd && eth && Number.isFinite(usd) && Number.isFinite(eth) && eth !== 0) {
      return usd / eth;
    }
    return null;
  }, [globalMetrics]);

  // The anchor is no longer displayed, but it still sets the level the walk
  // orbits and mean-reverts toward.
  const { price, history } = useSimulatedPrice(anchorPrice);
  const change24h = useEthPrice24hChange();

  // Percentage move between the last two steps of the walk.
  const changePercent = useMemo(() => {
    if (history.length < 2) return null;
    const previous = history[history.length - 2].value;
    const current = history[history.length - 1].value;
    if (!previous || !Number.isFinite(previous)) return null;
    return ((current - previous) / previous) * 100;
  }, [history]);

  // The walk moves by a few dollars on a ~$1,800 level, so an axis anchored at
  // zero renders it as a flat line. Fit the axis to the data instead.
  const [yAxisMin, yAxisMax] = useMemo(() => {
    if (history.length === 0) return [undefined, undefined] as const;
    const values = history.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.4, max * 0.001);
    return [min - padding, max + padding] as const;
  }, [history]);

  const chartSeries = useMemo<GTPChartSeries[]>(() => {
    const colors: [string, string] = theme === "dark" ? ["#1df7ef", "#10808c"] : ["#00cfc5", "#0e6f7a"];
    return [
      {
        name: "Simulated Price",
        seriesType: "line",
        data: history.map((point) => [point.timestamp, point.value]),
        color: colors,
      },
    ];
  }, [history, theme]);

  return (
    <AssetCard
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      infoSlot={
        "This price is generated in the browser, not observed. A mean-reverting random walk is seeded from the live ETH price derived from the fee stream, then moved by random shocks each second, and the percentage beside it is the move between the last two steps of that walk. The 24h figure is the exception: it is real, taken from the change between the last two days of growthepie's ETH market cap series. The comparison assets have no live feed at all — their anchors are seeded constants."
      }
    >
      <div className="flex items-center gap-x-[8px] pb-[15px]">
        <div className="heading-large-md">ETH Price</div>
        <SimulatedBadge />
      </div>

      <div className="flex flex-col gap-y-[30px]">
        <div className="flex flex-col @[420px]:flex-row @[420px]:items-end @[420px]:justify-between gap-y-[15px] gap-x-[10px]">
          <div className="flex flex-col gap-y-[5px]">
            <div className="flex items-baseline gap-x-[8px]">
              <div className="numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent whitespace-nowrap">
                {price !== null
                  ? `$${price.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </div>
              <div className="heading-small-xs text-color-text-secondary whitespace-nowrap">
                {changePercent === null
                  ? "—"
                  : `${changePercent >= 0 ? "+" : "−"}${Math.abs(changePercent).toFixed(2)}%`}
              </div>
            </div>
            <div className="heading-small-xs text-color-text-secondary whitespace-nowrap">
              {change24h === null
                ? "—"
                : `24h ${change24h >= 0 ? "+" : "−"}${Math.abs(change24h).toFixed(2)}%`}
            </div>
          </div>
        </div>

        <div className="relative w-full h-[63px]">
          {history.length > 1 && (
            <GTPChart
              series={chartSeries}
              xAxisType="category"
              animation={false}
              showWatermark={false}
              // The lowest y-label is centred on the grid's bottom edge, so a
              // zero bottom inset clips its lower half. The TPS card gets away
              // with bottom:0 because it suppresses its zero label; this axis
              // is fitted to the data and always draws one.
              grid={{ right: 0, top: 5, bottom: 8 }}
              ySplitNumber={2}
              yAxisMin={yAxisMin}
              yAxisMax={yAxisMax}
              yAxisLabelFormatter={(v) => `$${v.toFixed(2)}`}
            />
          )}
        </div>

        <AssetList
          title="Other Assets"
          isExpanded={isExpanded}
          formatValue={(asset) => {
            const assetPrice = assetPrices[asset.key];
            return assetPrice === undefined
              ? "—"
              : `$${assetPrice.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} / ${asset.unit}`;
          }}
        />
      </div>
    </AssetCard>
  );
};

// --- Card 2: ETH Supply (replaces Ecosystem TPS) ---

const useProjectedSupply = (nowMs: number | null) => {
  const { data } = useSWR<any>(ETH_SUPPLY_URL, SIMULATION_SWR_OPTIONS);

  return useMemo(() => {
    const supplySeries = data?.data?.chart?.eth_supply?.daily?.data;
    const rateSeries = data?.data?.chart?.eth_issuance_rate?.daily?.data;
    const lastSupply = Array.isArray(supplySeries) ? supplySeries[supplySeries.length - 1] : null;
    const lastRate = Array.isArray(rateSeries) ? rateSeries[rateSeries.length - 1] : null;

    const base = Array.isArray(lastSupply) ? Number(lastSupply[1]) : null;
    const baseTime = Array.isArray(lastSupply) ? Number(lastSupply[0]) : null;
    // Rounded to the precision we display, so the counter advances at the rate
    // shown on the card rather than at the API's full-precision value.
    const annualRate = roundRate(Array.isArray(lastRate) ? Number(lastRate[1]) : null);
    const supplyHistory = Array.isArray(supplySeries)
      ? supplySeries
          .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
          .map((point: [number, number]) => ({
            timestamp: Number(point[0]) < 1e12 ? Number(point[0]) * 1000 : Number(point[0]),
            value: Number(point[1]),
          }))
          .filter(
            (point: { timestamp: number; value: number }) =>
              Number.isFinite(point.timestamp) && Number.isFinite(point.value),
          )
      : [];

    return {
      supply: projectForward(base, baseTime, annualRate, nowMs),
      base,
      baseTime,
      annualRate,
      supplyHistory,
    };
  }, [data, nowMs]);
};

const EthSupplyCard = ({
  nowMs,
  isExpanded,
  onToggleExpand,
}: {
  nowMs: number | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const { supply, annualRate } = useProjectedSupply(nowMs);
  const assetSupplies = useSimulatedAssetSupplies(nowMs);
  const burned = useProjectedBurn(nowMs);
  const staked = useProjectedStakedSupply(nowMs);

  // ETH's rate is live from the API, staked ETH's is derived from it, and the
  // rest are seeded constants.
  const inflationRate = (asset: SimulatedAsset) => {
    if (asset.key === "eth") return annualRate;
    if (asset.key === STAKED_ETH_AS_ASSET.key) return roundRate(stakedEthIssuanceRate(annualRate));
    return roundRate(asset.supplyAnnualRate);
  };

  // 1% inflation crosses the track in two seconds, and the marker's speed
  // scales with the rate — so 4% crosses four times as fast (0.5s). A negative
  // rate returns negative seconds, which runs the marker back the other way.
  const sweepSeconds = (asset: SimulatedAsset) => {
    const ratePercent = (inflationRate(asset) ?? 0) * 100;
    if (ratePercent === 0) return null;
    const seconds = SWEEP_SECONDS_AT_ONE_PERCENT / Math.abs(ratePercent);
    return ratePercent > 0 ? seconds : -seconds;
  };

  // Slowest sweep first, i.e. lowest inflation at the top. Sorted here rather
  // than in the constant because ETH's rate is live and can move it.
  const sortedInflationAssets = [...INFLATION_ASSETS].sort(
    (a, b) => (inflationRate(a) ?? 0) - (inflationRate(b) ?? 0),
  );

  return (
    <AssetCard
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      infoSlot={
        "Projected, not measured. The last daily supply reading from growthepie's ETH supply tracker is carried forward at the current annualised net issuance rate. Real issuance arrives per block and is offset by the EIP-1559 burn. The burn total is itself simulated — the supply endpoint publishes net issuance rather than the burn, so its baseline and daily rate are seeded constants, as are the amount staked and the staking yield. stETH stands for staked ETH, and its rate is the network's issuance minus that yield: only a minority of the supply is staked, so stakers earn more than the supply grows and their issuance comes out negative. The comparison assets have no feed here either."
      }
    >
      <div className="flex items-center gap-x-[8px] pb-[15px]">
        <div className="heading-large-md">ETH Supply</div>
        <SimulatedBadge />
      </div>

      <div className="flex flex-col gap-y-[30px]">
        <div className="flex flex-col @[420px]:flex-row @[420px]:items-end @[420px]:justify-between gap-y-[15px] gap-x-[10px]">
          <div className="flex flex-col gap-y-[5px]">
            <div className="numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent whitespace-nowrap">
              {supply !== null
                ? `Ξ${supply.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </div>
            <div className="heading-small-xs text-color-text-secondary whitespace-nowrap">
              {`Ξ${burned.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} burned since EIP-1559`}
            </div>
            <div className="heading-small-xs text-color-text-secondary whitespace-nowrap">
              {staked === null
                ? "—"
                : `Ξ${staked.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} staked${
                    supply ? ` · ${((staked / supply) * 100).toFixed(2)}% of supply` : ""
                  }`}
            </div>
          </div>
        </div>

        <AssetList
          title="Inflation"
          isExpanded={isExpanded}
          assets={sortedInflationAssets}
          formatValue={(asset) => {
            const rate = inflationRate(asset);
            const percent = formatRatePercent(rate === null ? null : Math.abs(rate));
            if (percent === null || rate === null) return "—";
            return `${rate >= 0 ? "+" : "−"}${percent}`;
          }}
          sweepSeconds={sweepSeconds}
        />
      </div>
    </AssetCard>
  );
};

// --- Card 3: ETH per Person (replaces Token Transfer Fees) ---

type PerCapitaMode = "eth-per-person" | "people-per-eth";

const PER_CAPITA_MODES = [
  { value: "eth-per-person", label: "Ξ / person" },
  { value: "people-per-eth", label: "People / Ξ" },
];

const EthPerPersonCard = ({
  nowMs,
  isExpanded,
  onToggleExpand,
}: {
  nowMs: number | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const { supply } = useProjectedSupply(nowMs);
  const { population, annualRate: populationGrowth, baseYear } = useProjectedPopulation(nowMs);
  const assetSupplies = useSimulatedAssetSupplies(nowMs);
  const [mode, setMode] = useState<PerCapitaMode>("eth-per-person");

  const isEthPerPerson = mode === "eth-per-person";
  const ratio =
    supply !== null && population
      ? isEthPerPerson
        ? supply / population
        : population / supply
      : null;

  // Both directions are shown at the precision where the change per second is
  // still visible without running into floating-point noise. Ξ/person sits at
  // ~1.5e-2, so 14 places stay well clear of double precision; people/Ξ sits at
  // ~68, three orders of magnitude larger, so it gets 12.
  const decimals = isEthPerPerson ? 14 : 12;
  const formattedRatio =
    ratio !== null
      ? `${isEthPerPerson ? "Ξ" : ""}${ratio.toLocaleString("en-GB", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`
      : "—";

  return (
    <AssetCard
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      infoSlot={
        `Projected ETH supply divided by projected world population. Population comes from the World Bank's "Population, total" (SP.POP.TOTL) world aggregate${
          baseYear ? `, latest observation ${baseYear}` : ""
        }, carried forward at the growth rate implied by its two most recent years. World Bank figures are midyear estimates, so the baseline is anchored to 1 July. Supply and population grow at nearly the same rate, so the ratio is close to constant.`
      }
    >
      <div className="flex items-center gap-x-[8px] pb-[15px]">
        <div className="heading-large-md">{isEthPerPerson ? "ETH per Person" : "People per ETH"}</div>
        <SimulatedBadge />
      </div>

      <div className="flex flex-col gap-y-[20px]">
        <div className="flex flex-col @[420px]:flex-row @[420px]:items-end @[420px]:justify-between gap-y-[15px] gap-x-[10px]">
          <div className="flex flex-col gap-y-[5px]">
            <div className="numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent whitespace-nowrap">
              {formattedRatio}
            </div>
            <div className="heading-small-xs text-color-text-secondary whitespace-nowrap">
              {population
                ? `${population.toLocaleString("en-GB", { maximumFractionDigits: 0 })} people${
                    populationGrowth !== null
                      ? ` · ${populationGrowth >= 0 ? "+" : "−"}${formatRatePercent(Math.abs(populationGrowth))} / yr`
                      : ""
                  }`
                : "if ETH were shared equally"}
            </div>
          </div>
        </div>

        <ToggleSwitch
          size="sm"
          values={PER_CAPITA_MODES}
          value={mode}
          onChange={(next) => setMode(next as PerCapitaMode)}
          ariaLabel="Switch between ETH per person and people per ETH"
          className="self-start"
        />

        <AssetList
          title="Other Assets"
          isExpanded={isExpanded}
          formatValue={(asset) => {
            const assetSupply = assetSupplies[asset.key];
            if (assetSupply === null || assetSupply === undefined || !population) return "—";
            // Follows the card's toggle, so the list never mixes directions.
            return isEthPerPerson
              ? `${(assetSupply / population).toLocaleString("en-GB", {
                  minimumFractionDigits: asset.perPersonDecimals,
                  maximumFractionDigits: asset.perPersonDecimals,
                })} ${asset.unit}`
              : `${(population / assetSupply).toLocaleString("en-GB", {
                  minimumFractionDigits: asset.peoplePerUnitDecimals,
                  maximumFractionDigits: asset.peoplePerUnitDecimals,
                })} / ${asset.unit}`;
          }}
        />
      </div>
    </AssetCard>
  );
};

// --- Ten-year per-person simulation ---

const SIMULATION_DURATION_MS = 25_313;
const SIMULATION_END_PAUSE_MS = 1_500;
const SIMULATION_LOOP_MS = SIMULATION_DURATION_MS + SIMULATION_END_PAUSE_MS;
const SIMULATION_START_YEAR = -5;
const SIMULATION_END_YEAR = 10;
const SIMULATION_YEARS = SIMULATION_END_YEAR - SIMULATION_START_YEAR;
const BITCOIN_SUPPLY_CAP = 21_000_000;
const BITCOIN_BLOCKS_PER_YEAR = (365.25 * 24 * 60) / 10;
const BITCOIN_CURRENT_BLOCK_REWARD = 3.125;
const BITCOIN_HALVING_INTERVAL_YEARS = 4;
const NEXT_BITCOIN_HALVING = Date.UTC(2028, 3, 1);
const PREVIOUS_BITCOIN_HALVING = Date.UTC(2024, 3, 20);
const ETH_STAKING_START = Date.UTC(2020, 11, 1);
const ETH_STAKING_GENESIS_SUPPLY = 524_288;
const SOLANA_START = Date.UTC(2020, 2, 16);
const SOLANA_GENESIS_SUPPLY = 500_000_000;
const SOLANA_CURRENT_INFLATION_RATE = 0.0382;
const SOLANA_ANNUAL_DISINFLATION = 0.15;
const SOLANA_TERMINAL_INFLATION_RATE = 0.015;
const GOLD_HISTORY_START = Date.UTC(2016, 11, 31);
const GOLD_2016_SUPPLY_OZ = 184_500 * 32_150.7466;
const DOT_STORAGE_MAX_ROWS = 5;
const DOT_STORAGE_LANE_HEIGHT = 40;

const getDotStoragePosition = (dotCount: number, index: number) => {
  const dotsPerBlock = DOT_STORAGE_MAX_ROWS * 5;
  const block = Math.floor(index / dotsPerBlock);
  const indexWithinBlock = index % dotsPerBlock;
  const columnWithinBlock = indexWithinBlock % 5;
  const row = Math.floor(indexWithinBlock / 5);
  const rowCount = Math.min(DOT_STORAGE_MAX_ROWS, Math.ceil(dotCount / 5));

  return {
    horizontalOffset: block * 44 + columnWithinBlock * 8,
    verticalOffset: (row - (rowCount - 1) / 2) * 8,
  };
};

const interpolateHistoricalAnchor = (
  startTime: number,
  startValue: number,
  currentValue: number,
  targetTime: number,
  currentTime: number,
) => {
  if (targetTime < startTime) return null;
  if (targetTime >= currentTime) return currentValue;
  const progress = (targetTime - startTime) / (currentTime - startTime);
  return startValue * (currentValue / startValue) ** progress;
};

const valueAtTimestamp = (
  history: { timestamp: number; value: number }[],
  targetTime: number,
) => {
  if (history.length === 0) return null;
  if (targetTime <= history[0].timestamp) return history[0].value;
  if (targetTime >= history[history.length - 1].timestamp) {
    return history[history.length - 1].value;
  }

  let low = 0;
  let high = history.length - 1;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (history[middle].timestamp <= targetTime) low = middle;
    else high = middle;
  }

  const before = history[low];
  const after = history[high];
  const progress = (targetTime - before.timestamp) / (after.timestamp - before.timestamp);
  return before.value + (after.value - before.value) * progress;
};

const projectSolanaSupply = (currentSupply: number, years: number) => {
  let supply = currentSupply;
  let inflationRate = SOLANA_CURRENT_INFLATION_RATE;
  let remainingYears = Math.max(years, 0);

  while (remainingYears > 0) {
    const stepYears = Math.min(remainingYears, 1);
    supply *= (1 + inflationRate) ** stepYears;
    inflationRate = Math.max(
      SOLANA_TERMINAL_INFLATION_RATE,
      inflationRate * (1 - SOLANA_ANNUAL_DISINFLATION) ** stepYears,
    );
    remainingYears -= stepYears;
  }

  return supply;
};

const formatSimulationChange = (change: number) =>
  Math.abs(change).toFixed(Math.abs(change) < 1 ? 2 : 1);

const toDecimalYear = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const nextYearStart = Date.UTC(year + 1, 0, 1);
  return year + (timestamp - yearStart) / (nextYearStart - yearStart);
};

const projectBitcoinSupply = (currentSupply: number, years: number, currentTime: number) => {
  if (years < 0) {
    const yearsSincePreviousHalving = Math.max(
      0,
      (currentTime - PREVIOUS_BITCOIN_HALVING) / (365.25 * 24 * 60 * 60 * 1000),
    );
    let remainingYears = Math.abs(years);
    let epochYears = yearsSincePreviousHalving;
    let reward = BITCOIN_CURRENT_BLOCK_REWARD;
    let supply = currentSupply;

    while (remainingYears > 0) {
      const yearsInEpoch = Math.min(remainingYears, epochYears);
      supply -= yearsInEpoch * BITCOIN_BLOCKS_PER_YEAR * reward;
      remainingYears -= yearsInEpoch;
      reward *= 2;
      epochYears = BITCOIN_HALVING_INTERVAL_YEARS;
    }

    return Math.max(supply, 0);
  }

  const yearsUntilNextHalving = Math.max(
    0,
    (NEXT_BITCOIN_HALVING - currentTime) / (365.25 * 24 * 60 * 60 * 1000),
  );
  let remainingYears = years;
  let epochYears = yearsUntilNextHalving;
  let reward = BITCOIN_CURRENT_BLOCK_REWARD;
  let supply = currentSupply;

  while (remainingYears > 0 && supply < BITCOIN_SUPPLY_CAP) {
    const yearsInEpoch = Math.min(remainingYears, epochYears);
    supply = Math.min(
      BITCOIN_SUPPLY_CAP,
      supply + yearsInEpoch * BITCOIN_BLOCKS_PER_YEAR * reward,
    );
    remainingYears -= yearsInEpoch;
    reward /= 2;
    epochYears = BITCOIN_HALVING_INTERVAL_YEARS;
  }

  return supply;
};

const AssetsPerPersonSimulation = ({ nowMs }: { nowMs: number | null }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const elapsedRef = useRef(0);
  const {
    supply: ethSupply,
    annualRate: ethAnnualRate,
    supplyHistory: ethSupplyHistory,
  } = useProjectedSupply(nowMs);
  const { population, annualRate: populationAnnualRate } = useProjectedPopulation(nowMs);
  const assetSupplies = useSimulatedAssetSupplies(nowMs);
  const m2Growth = useM2Growth();
  const simulationNow = nowMs ?? STAKED_ETH_BASE_TIME;

  useEffect(() => {
    let animationFrame = 0;
    let previousTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (previousTimestamp !== null && !isPaused) {
        elapsedRef.current =
          (elapsedRef.current + timestamp - previousTimestamp) % SIMULATION_LOOP_MS;
        setProgress(Math.min(elapsedRef.current / SIMULATION_DURATION_MS, 1));
      }
      previousTimestamp = timestamp;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  const setSimulationProgress = (nextProgress: number) => {
    const clampedProgress = Math.min(Math.max(nextProgress, 0), 1);
    elapsedRef.current = clampedProgress * SIMULATION_DURATION_MS;
    setProgress(clampedProgress);
  };

  const seekSimulation = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setSimulationProgress((event.clientX - bounds.left) / bounds.width);
  };

  const simulatedYear = SIMULATION_START_YEAR + progress * SIMULATION_YEARS;
  const calendarYear = toDecimalYear(simulationNow + simulatedYear * MS_PER_YEAR);
  const populationRate = populationAnnualRate ?? 0;

  const rows = (() => {
    const assets = [ETH_AS_ASSET, ...SIMULATED_ASSETS];

    return assets.map((asset) => {
      const currentSupply =
        asset.key === "eth"
          ? ethSupply
          : asset.key === "usd"
            ? m2Growth?.supply ?? assetSupplies[asset.key]
            : assetSupplies[asset.key];
      const annualRate =
        asset.key === "eth"
          ? ethAnnualRate ?? 0
          : asset.key === "usd"
            ? m2Growth?.annualRate ?? asset.supplyAnnualRate
            : asset.supplyAnnualRate;
      const projectSupply = (years: number) => {
        if (!currentSupply) return null;
        if (asset.key === "btc") return projectBitcoinSupply(currentSupply, years, simulationNow);
        const targetTime = simulationNow + years * MS_PER_YEAR;
        if (years < 0 && asset.key === "eth") {
          return valueAtTimestamp(ethSupplyHistory, targetTime);
        }
        if (years < 0 && asset.key === "sol") {
          return interpolateHistoricalAnchor(
            SOLANA_START,
            SOLANA_GENESIS_SUPPLY,
            currentSupply,
            targetTime,
            simulationNow,
          );
        }
        if (asset.key === "sol") return projectSolanaSupply(currentSupply, years);
        if (years < 0 && asset.key === "gold") {
          return interpolateHistoricalAnchor(
            GOLD_HISTORY_START,
            GOLD_2016_SUPPLY_OZ,
            currentSupply,
            targetTime,
            simulationNow,
          );
        }
        if (years < 0 && asset.key === "usd" && m2Growth?.history) {
          return valueAtTimestamp(m2Growth.history, targetTime);
        }
        if (asset.key === "usd") return currentSupply * (1 + annualRate) ** years;
        return currentSupply * (1 + annualRate * years);
      };
      const startSupply = projectSupply(SIMULATION_START_YEAR);
      const projectedSupply = projectSupply(simulatedYear);
      const endSupply = projectSupply(SIMULATION_END_YEAR);
      const startPopulation = population
        ? population * (1 + populationRate * SIMULATION_START_YEAR)
        : null;
      const projectedPopulation = population
        ? population * (1 + populationRate * simulatedYear)
        : null;
      const endPopulation = population
        ? population * (1 + populationRate * SIMULATION_END_YEAR)
        : null;
      const startPerPerson =
        startSupply && startPopulation ? startSupply / startPopulation : null;
      const projectedPerPerson =
        projectedSupply && projectedPopulation ? projectedSupply / projectedPopulation : null;
      const currentChange =
        startPerPerson && projectedPerPerson
          ? ((projectedPerPerson / startPerPerson) - 1) * 100
          : null;
      const endPerPerson = endSupply && endPopulation ? endSupply / endPopulation : null;
      const endChange =
        startPerPerson && endPerPerson
          ? ((endPerPerson / startPerPerson) - 1) * 100
          : null;

      return { asset, projectedPerPerson, currentChange, endChange };
    })
      .filter(
        ({ asset }) =>
          asset.key !== "sol" || simulationNow + simulatedYear * MS_PER_YEAR >= SOLANA_START,
      )
      .sort(
        (a, b) =>
          (a.endChange ?? Number.POSITIVE_INFINITY) -
          (b.endChange ?? Number.POSITIVE_INFINITY),
      );
  })();

  return (
    <section className="col-span-3 min-h-[612px] rounded-[15px] bg-color-bg-default px-[30px] pt-[30px] pb-[24px] flex flex-col overflow-hidden relative">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[15px]">
        <div>
          <div className="flex items-center gap-x-[8px]">
            <h2 className="heading-large-lg">Assets per Person</h2>
            <SimulatedBadge />
          </div>
          <p className="text-sm text-color-text-secondary mt-[5px] max-w-[620px]">
            If every unit were shared equally. Supply issuance races population growth over a
            simulated from five years ago to ten years ahead at roughly 0.89 years per second.
            Bitcoin issuance halves every four years and stops at its 21 million supply cap.
          </p>
        </div>
        <div className="flex items-baseline gap-x-[8px] md:text-right">
          <div className="numbers-2xl tabular-nums">{calendarYear.toFixed(1)}</div>
          <div className="heading-small-xs text-color-text-secondary">
            {simulatedYear >= 0 ? "+" : ""}{simulatedYear.toFixed(1)} years from today
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-y-[14px] py-[30px]">
        {rows.map(({ asset, projectedPerPerson, currentChange, endChange }) => {
          const direction = Math.sign(endChange ?? 0);
          const dotCount = endChange === null ? 0 : Math.ceil(Math.abs(endChange));
          const completedChange = Math.abs(currentChange ?? 0);

          return (
            <div
              key={asset.key}
              className="grid grid-cols-[48px,1fr] md:grid-cols-[65px,1fr,210px] items-center gap-x-[15px]"
            >
              <div className="flex items-center gap-x-[8px]">
                <div className="size-[9px] rounded-full" style={{ backgroundColor: asset.color }} />
                <div className="heading-small-xs">{asset.name}</div>
              </div>
              <div
                className="relative flex items-center"
                style={{ height: DOT_STORAGE_LANE_HEIGHT }}
              >
                <div className="absolute left-0 right-0 h-px bg-color-border" />
                {Array.from({ length: dotCount }, (_, index) => {
                  const dotProgress = Math.min(Math.max(completedChange - index, 0), 1);
                  const { horizontalOffset, verticalOffset } = getDotStoragePosition(
                    dotCount,
                    index,
                  );
                  const spawnPosition = direction >= 0 ? 6 : 94;
                  const dotPosition =
                    spawnPosition + ((direction >= 0 ? 94 : 6) - spawnPosition) * dotProgress;
                  const dotPixelOffset =
                    (direction >= 0 ? -horizontalOffset : horizontalOffset) * dotProgress;

                  return (
                    <div
                      key={index}
                      className="absolute size-[7px] rounded-full border border-color-bg-default shadow-sm transition-[left,top,opacity] duration-75 ease-linear"
                      style={{
                        backgroundColor: asset.color,
                        left: `calc(${dotPosition}% + ${dotPixelOffset}px)`,
                        opacity: dotProgress > 0 ? 1 : 0,
                        top: `calc(50% + ${verticalOffset * dotProgress}px)`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                })}
              </div>
              <div className="col-start-2 md:col-start-auto flex items-baseline justify-between md:justify-end gap-x-[10px] min-w-0">
                <div className="numbers-sm tabular-nums truncate">
                  {projectedPerPerson === null
                    ? "—"
                    : `${projectedPerPerson.toLocaleString("en-GB", {
                        maximumSignificantDigits: 5,
                      })} ${asset.unit}`}
                </div>
                <div
                  className={`heading-small-xxs tabular-nums whitespace-nowrap ${
                    direction > 0
                      ? "text-color-negative"
                      : direction < 0
                        ? "text-color-positive"
                        : "text-color-text-secondary"
                  }`}
                >
                  {currentChange === null
                    ? "—"
                    : `${currentChange >= 0 ? "+" : "−"}${formatSimulationChange(currentChange)}% since start`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-end gap-x-[12px]">
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          className="size-[30px] shrink-0 translate-y-[11px] rounded-full bg-color-bg-medium hover:bg-color-ui-hover transition-colors flex items-center justify-center"
          aria-label={isPaused ? "Play simulation" : "Pause simulation"}
        >
          <GTPIcon
            icon={(isPaused ? "feather:play" : "feather:pause") as Parameters<typeof GTPIcon>[0]["icon"]}
            size="sm"
          />
        </button>
        <div className="flex-1">
          <div className="relative heading-small-xxs text-color-text-secondary mb-[8px] h-[14px]">
            <span className="absolute left-0">5 years ago</span>
            <span className="absolute left-1/3 -translate-x-1/2">Today</span>
            <span className="absolute right-0">10 years ahead</span>
          </div>
          <div
            className="relative h-[8px] rounded-full bg-color-bg-medium cursor-pointer overflow-visible"
            onClick={seekSimulation}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setSimulationProgress(
                  progress + (event.key === "ArrowRight" ? 1 / SIMULATION_YEARS : -1 / SIMULATION_YEARS),
                );
              }
            }}
            role="slider"
            tabIndex={0}
            aria-label="Simulation year"
            aria-valuemax={SIMULATION_END_YEAR}
            aria-valuemin={SIMULATION_START_YEAR}
            aria-valuenow={Math.round(simulatedYear)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-color-accent-petrol to-color-accent-turquoise pointer-events-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const DilutionSimulation = ({ nowMs }: { nowMs: number | null }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const elapsedRef = useRef(0);
  const {
    supply: ethSupply,
    annualRate: ethAnnualRate,
    supplyHistory: ethSupplyHistory,
  } = useProjectedSupply(nowMs);
  const stakedSupply = useProjectedStakedSupply(nowMs);
  const assetSupplies = useSimulatedAssetSupplies(nowMs);
  const m2Growth = useM2Growth();
  const m3Growth = useM3Growth();
  const simulationNow = nowMs ?? STAKED_ETH_BASE_TIME;

  useEffect(() => {
    let animationFrame = 0;
    let previousTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (previousTimestamp !== null && !isPaused) {
        elapsedRef.current =
          (elapsedRef.current + timestamp - previousTimestamp) % SIMULATION_LOOP_MS;
        setProgress(Math.min(elapsedRef.current / SIMULATION_DURATION_MS, 1));
      }
      previousTimestamp = timestamp;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  const setSimulationProgress = (nextProgress: number) => {
    const clampedProgress = Math.min(Math.max(nextProgress, 0), 1);
    elapsedRef.current = clampedProgress * SIMULATION_DURATION_MS;
    setProgress(clampedProgress);
  };

  const seekSimulation = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setSimulationProgress((event.clientX - bounds.left) / bounds.width);
  };

  const simulatedYear = SIMULATION_START_YEAR + progress * SIMULATION_YEARS;
  const calendarYear = toDecimalYear(simulationNow + simulatedYear * MS_PER_YEAR);

  const rows = (() => {
    const assets = [
      ETH_AS_ASSET,
      STAKED_ETH_AS_ASSET,
      ...SIMULATED_ASSETS,
      USD_M3_AS_ASSET,
    ];

    return assets
      .map((asset) => {
        const currentSupply =
          asset.key === "eth"
            ? ethSupply
            : asset.key === STAKED_ETH_AS_ASSET.key
              ? stakedSupply
              : asset.key === "usd"
                ? m2Growth?.supply ?? assetSupplies[asset.key]
                : asset.key === USD_M3_AS_ASSET.key
                  ? m3Growth?.index ?? null
              : assetSupplies[asset.key];
        const annualRate =
          asset.key === "eth"
            ? ethAnnualRate ?? 0
            : asset.key === STAKED_ETH_AS_ASSET.key
              ? stakedEthIssuanceRate(ethAnnualRate) ?? -ETH_STAKING_YIELD
              : asset.key === "usd"
                ? m2Growth?.annualRate ?? asset.supplyAnnualRate
                : asset.key === USD_M3_AS_ASSET.key
                  ? m3Growth?.annualRate ?? 0
              : asset.supplyAnnualRate;

        const projectSupply = (years: number) => {
          if (!currentSupply) return null;
          if (asset.key === "btc") {
            return projectBitcoinSupply(currentSupply, years, simulationNow);
          }
          const targetTime = simulationNow + years * MS_PER_YEAR;
          if (years < 0 && asset.key === "eth") {
            return valueAtTimestamp(ethSupplyHistory, targetTime);
          }
          if (years < 0 && asset.key === STAKED_ETH_AS_ASSET.key) {
            return interpolateHistoricalAnchor(
              ETH_STAKING_START,
              ETH_STAKING_GENESIS_SUPPLY,
              currentSupply,
              targetTime,
              simulationNow,
            );
          }
          if (years < 0 && asset.key === "sol") {
            return interpolateHistoricalAnchor(
              SOLANA_START,
              SOLANA_GENESIS_SUPPLY,
              currentSupply,
              targetTime,
              simulationNow,
            );
          }
          if (asset.key === "sol") return projectSolanaSupply(currentSupply, years);
          if (years < 0 && asset.key === "gold") {
            return interpolateHistoricalAnchor(
              GOLD_HISTORY_START,
              GOLD_2016_SUPPLY_OZ,
              currentSupply,
              targetTime,
              simulationNow,
            );
          }
          if (years < 0 && asset.key === "usd" && m2Growth?.history) {
            return valueAtTimestamp(m2Growth.history, targetTime);
          }
          if (years < 0 && asset.key === USD_M3_AS_ASSET.key && m3Growth?.history) {
            return valueAtTimestamp(m3Growth.history, targetTime);
          }
          if (asset.key === STAKED_ETH_AS_ASSET.key) {
            return currentSupply * (1 + ETH_STAKING_YIELD) ** years;
          }
          if (asset.key === "usd") {
            return currentSupply * (1 + annualRate) ** years;
          }
          if (asset.key === USD_M3_AS_ASSET.key) {
            return currentSupply * (1 + annualRate) ** years;
          }
          return currentSupply * (1 + annualRate * years);
        };

        const startSupply =
          asset.key === STAKED_ETH_AS_ASSET.key
            ? ETH_STAKING_GENESIS_SUPPLY
            : projectSupply(SIMULATION_START_YEAR);
        const projectedSupply = projectSupply(simulatedYear);
        const endSupply = projectSupply(SIMULATION_END_YEAR);
        const stakingStartYear = (ETH_STAKING_START - simulationNow) / MS_PER_YEAR;
        const currentChange =
          asset.key === STAKED_ETH_AS_ASSET.key
            ? simulatedYear < stakingStartYear
              ? null
              : ((1 + annualRate) ** (simulatedYear - stakingStartYear) - 1) * 100
            : startSupply && projectedSupply
              ? ((projectedSupply / startSupply) - 1) * 100
              : null;
        const endChange =
          asset.key === STAKED_ETH_AS_ASSET.key
            ? ((1 + annualRate) ** (SIMULATION_END_YEAR - stakingStartYear) - 1) * 100
            : startSupply && endSupply
              ? ((endSupply / startSupply) - 1) * 100
              : null;

        return { asset, projectedSupply, currentChange, endChange };
      })
      .filter(({ asset }) => {
        const simulatedTime = simulationNow + simulatedYear * MS_PER_YEAR;
        if (asset.key === STAKED_ETH_AS_ASSET.key) return simulatedTime >= ETH_STAKING_START;
        if (asset.key === "sol") return simulatedTime >= SOLANA_START;
        return true;
      })
      .sort(
        (a, b) =>
          (a.endChange ?? Number.POSITIVE_INFINITY) -
          (b.endChange ?? Number.POSITIVE_INFINITY),
      );
  })();

  return (
    <section className="col-span-3 min-h-[612px] rounded-[15px] bg-color-bg-default px-[30px] pt-[30px] pb-[24px] flex flex-col overflow-hidden relative">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[15px]">
        <div>
          <div className="flex items-center gap-x-[8px]">
            <h2 className="heading-large-lg">Asset Dilution</h2>
            <SimulatedBadge />
          </div>
          <p className="text-sm text-color-text-secondary mt-[5px] max-w-[680px]">
            Supply growth from five years ago to ten years ahead, independent of population. Staked
            ETH includes simulated staking yield; Bitcoin issuance follows its halving schedule.
            USD M3 is the CFS Divisia M3 index, not a dollar stock.
          </p>
        </div>
        <div className="flex items-baseline gap-x-[8px] md:text-right">
          <div className="numbers-2xl tabular-nums">{calendarYear.toFixed(1)}</div>
          <div className="heading-small-xs text-color-text-secondary">
            {simulatedYear >= 0 ? "+" : ""}{simulatedYear.toFixed(1)} years from today
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-y-[14px] py-[30px]">
        {rows.map(({ asset, projectedSupply, currentChange, endChange }) => {
          const direction = Math.sign(endChange ?? 0);
          const dotCount = endChange === null ? 0 : Math.ceil(Math.abs(endChange));
          const completedChange = Math.abs(currentChange ?? 0);

          return (
            <div
              key={asset.key}
              className="grid grid-cols-[48px,1fr] md:grid-cols-[65px,1fr,210px] items-center gap-x-[15px]"
            >
              <div className="flex items-center gap-x-[8px]">
                <div className="size-[9px] rounded-full" style={{ backgroundColor: asset.color }} />
                <div className="heading-small-xs">{asset.name}</div>
              </div>
              <div
                className="relative flex items-center"
                style={{ height: DOT_STORAGE_LANE_HEIGHT }}
              >
                <div className="absolute left-0 right-0 h-px bg-color-border" />
                {Array.from({ length: dotCount }, (_, index) => {
                  const dotProgress = Math.min(Math.max(completedChange - index, 0), 1);
                  const { horizontalOffset, verticalOffset } = getDotStoragePosition(
                    dotCount,
                    index,
                  );
                  const spawnPosition = 50;
                  const dotPosition =
                    spawnPosition + ((direction >= 0 ? 94 : 6) - spawnPosition) * dotProgress;
                  const dotPixelOffset =
                    (direction >= 0 ? -horizontalOffset : horizontalOffset) * dotProgress;

                  return (
                    <div
                      key={index}
                      className="absolute size-[7px] rounded-full border border-color-bg-default shadow-sm transition-[left,top,opacity] duration-75 ease-linear"
                      style={{
                        backgroundColor: asset.color,
                        left: `calc(${dotPosition}% + ${dotPixelOffset}px)`,
                        opacity: dotProgress > 0 ? 1 : 0,
                        top: `calc(50% + ${verticalOffset * dotProgress}px)`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  );
                })}
              </div>
              <div className="col-start-2 md:col-start-auto flex items-baseline justify-between md:justify-end gap-x-[10px] min-w-0">
                <div className="numbers-sm tabular-nums truncate">
                  {projectedSupply === null
                    ? "—"
                    : `${formatCompact(projectedSupply)} ${asset.unit}`}
                </div>
                <div
                  className={`heading-small-xxs tabular-nums whitespace-nowrap ${
                    direction > 0
                      ? "text-color-negative"
                      : direction < 0
                        ? "text-color-positive"
                        : "text-color-text-secondary"
                  }`}
                >
                  {currentChange === null
                    ? "—"
                    : `${currentChange >= 0 ? "+" : "−"}${formatSimulationChange(currentChange)}% since start`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-end gap-x-[12px]">
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          className="size-[30px] shrink-0 translate-y-[11px] rounded-full bg-color-bg-medium hover:bg-color-ui-hover transition-colors flex items-center justify-center"
          aria-label={isPaused ? "Play dilution simulation" : "Pause dilution simulation"}
        >
          <GTPIcon
            icon={(isPaused ? "feather:play" : "feather:pause") as Parameters<typeof GTPIcon>[0]["icon"]}
            size="sm"
          />
        </button>
        <div className="flex-1">
          <div className="relative heading-small-xxs text-color-text-secondary mb-[8px] h-[14px]">
            <span className="absolute left-0">5 years ago</span>
            <span className="absolute left-1/3 -translate-x-1/2">Today</span>
            <span className="absolute right-0">10 years ahead</span>
          </div>
          <div
            className="relative h-[8px] rounded-full bg-color-bg-medium cursor-pointer overflow-visible"
            onClick={seekSimulation}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setSimulationProgress(
                  progress + (event.key === "ArrowRight" ? 1 / SIMULATION_YEARS : -1 / SIMULATION_YEARS),
                );
              }
            }}
            role="slider"
            tabIndex={0}
            aria-label="Dilution simulation year"
            aria-valuemin={SIMULATION_START_YEAR}
            aria-valuemax={SIMULATION_END_YEAR}
            aria-valuenow={Math.round(simulatedYear)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-color-accent-petrol to-color-accent-turquoise pointer-events-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Layout ---

type CardKey = "price" | "supply" | "per-person";

const EthAssetMetrics = () => {
  const nowMs = useTicker(1000);
  const [expanded, setExpanded] = useState<Record<CardKey, boolean>>({
    price: false,
    supply: false,
    "per-person": false,
  });

  const toggle = (key: CardKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Container className="z-[1]">
      <div className="grid grid-cols-[1fr,1fr,1fr] gap-[15px] w-full @container">
        <div className="col-span-3 @[1040px]:col-span-1">
          <EthPriceCard isExpanded={expanded.price} onToggleExpand={() => toggle("price")} />
        </div>
        <div className="flex flex-col lg:flex-row gap-[15px] col-span-3 @[1040px]:col-span-2">
          <EthSupplyCard
            nowMs={nowMs}
            isExpanded={expanded.supply}
            onToggleExpand={() => toggle("supply")}
          />
          <EthPerPersonCard
            nowMs={nowMs}
            isExpanded={expanded["per-person"]}
            onToggleExpand={() => toggle("per-person")}
          />
        </div>
        <AssetsPerPersonSimulation nowMs={nowMs} />
        <DilutionSimulation nowMs={nowMs} />
      </div>
    </Container>
  );
};

export default EthAssetMetrics;
