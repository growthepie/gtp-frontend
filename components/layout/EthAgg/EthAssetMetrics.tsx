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

import React, { useMemo, useState } from "react";
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
  formatCompact,
  formatRatePercent,
  useEthPrice24hChange,
  projectForward,
  roundRate,
  SIMULATED_ASSETS,
  SimulatedAsset,
  useProjectedBurn,
  useProjectedPopulation,
  useSimulatedAssetPrices,
  useSimulatedAssetSupplies,
  useSimulatedPrice,
  useTicker,
} from "./ethAssetHelpers";

const ETH_SUPPLY_URL = "https://api.growthepie.com/v1/eim/eth_supply.json";

/** ETH leads the inflation list so its rate can be read against the others. */
const INFLATION_ASSETS = [ETH_AS_ASSET, ...SIMULATED_ASSETS];

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
 * seconds, so the rate is read as motion rather than as a second number.
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
        sweepSeconds === undefined ? "" : "w-[44px]"
      }`}
    >
      <div className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
      <div className="heading-small-xxs truncate">{asset.name}</div>
    </div>

    {sweepSeconds !== undefined && (
      // Fixed rather than flexible, so the travel distance stays constant when
      // the text beside it changes length. Allowed to shrink on narrow cards —
      // the track gives way before the value does.
      <div className="relative w-[190px] min-w-[30px] h-[6px]">
        {sweepSeconds !== null && (
          <div
            className="inflation-sweep-marker absolute top-0 size-[6px] rounded-full"
            style={{
              backgroundColor: asset.color,
              animation: `inflation-sweep ${sweepSeconds}s linear infinite`,
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
  /** Seconds for a marker to cross the row; omit for rows without a track. */
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
  const { data } = useSWR<any>(ETH_SUPPLY_URL);

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

    return {
      supply: projectForward(base, baseTime, annualRate, nowMs),
      base,
      baseTime,
      annualRate,
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

  // ETH's rate is live from the API; the rest are seeded constants.
  const inflationRate = (asset: SimulatedAsset) =>
    asset.key === "eth" ? annualRate : roundRate(asset.supplyAnnualRate);

  // 1% inflation crosses the track in two seconds, and the marker's speed
  // scales with the rate — so 4% crosses four times as fast (0.5s).
  const sweepSeconds = (asset: SimulatedAsset) => {
    const ratePercent = (inflationRate(asset) ?? 0) * 100;
    return ratePercent > 0 ? SWEEP_SECONDS_AT_ONE_PERCENT / ratePercent : null;
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
        "Projected, not measured. The last daily supply reading from growthepie's ETH supply tracker is carried forward at the current annualised net issuance rate. Real issuance arrives per block and is offset by the EIP-1559 burn. The burn total is itself simulated — the supply endpoint publishes net issuance rather than the burn, so its baseline and daily rate are seeded constants. The comparison assets have no feed here either."
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
      </div>
    </Container>
  );
};

export default EthAssetMetrics;
