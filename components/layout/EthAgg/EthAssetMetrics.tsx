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
import dayjs from "@/lib/dayjs";
import Container from "@/components/layout/Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipGeneral } from "@/components/GTPComponents/GTPTooltip";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { useTheme } from "next-themes";
import { useSSEMetrics } from "./useSSEMetrics";
import { ToggleSwitch } from "@/components/layout/ToggleSwitch";
import {
  formatRatePercent,
  projectForward,
  roundRate,
  useProjectedPopulation,
  useSimulatedPrice,
  useTicker,
} from "./ethAssetHelpers";

const ETH_SUPPLY_URL = "https://api.growthepie.com/v1/eim/eth_supply.json";

/** Card chrome matching ExpandableCardContainer minus the expand affordance. */
const StaticCard = ({
  children,
  infoSlot,
}: {
  children: React.ReactNode;
  infoSlot: React.ReactNode;
}) => (
  <div className="relative w-full z-0 h-full min-h-[306px]">
    <div className="@container w-full h-full bg-color-bg-default rounded-[15px] flex flex-col py-[15px] px-[30px] relative overflow-hidden group/card">
      {children}
      <div className="absolute bottom-0 left-0 right-0 w-full py-[10px] px-[15px] h-fit flex items-center justify-end">
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

/** Small label above a secondary value, matching the metric cards. */
const SubMetric = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-y-[2px] overflow-hidden">
    <div className="heading-small-xxxs text-color-text-secondary">{label}</div>
    <div className="numbers-sm whitespace-nowrap">{value}</div>
  </div>
);

const SimulatedBadge = () => (
  <div className="px-[5px] py-[1px] rounded-full bg-color-bg-medium heading-small-xxxs text-color-text-secondary whitespace-nowrap">
    simulated
  </div>
);

// --- Card 1: ETH Price (replaces Ethereum Uptime) ---

const EthPriceCard = () => {
  const { globalMetrics } = useSSEMetrics();
  const { theme } = useTheme();

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

  const { price, history } = useSimulatedPrice(anchorPrice);
  const drift = price !== null && anchorPrice !== null ? price - anchorPrice : null;

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
    <StaticCard
      infoSlot={
        "This price is generated in the browser, not observed. A mean-reverting random walk is seeded from the live ETH price derived from the fee stream, then moved by random shocks each second. Use it to demonstrate the layout, never as market data."
      }
    >
      <div className="flex items-center gap-x-[8px] pb-[15px]">
        <div className="heading-large-md">ETH Price</div>
        <SimulatedBadge />
      </div>

      <div className="flex flex-col gap-y-[30px]">
        <div className="flex flex-col @[420px]:flex-row @[420px]:items-end @[420px]:justify-between gap-y-[15px] gap-x-[10px]">
          <div className="flex flex-col gap-y-[5px]">
            <div className="numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent whitespace-nowrap">
              {price !== null
                ? `$${price.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </div>
            <div className="heading-small-xs text-color-text-secondary">random walk, 1s steps</div>
          </div>
          <div className="flex gap-x-[20px]">
            <SubMetric
              label="Live Anchor"
              value={
                anchorPrice !== null
                  ? `$${anchorPrice.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`
                  : "—"
              }
            />
            <SubMetric
              label="Drift"
              value={
                drift !== null
                  ? `${drift >= 0 ? "+" : "−"}$${Math.abs(drift).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "—"
              }
            />
          </div>
        </div>

        <div className="relative w-full h-[63px]">
          {history.length > 1 && (
            <GTPChart
              series={chartSeries}
              xAxisType="category"
              animation={false}
              showWatermark={false}
              grid={{ right: 0, top: 5, bottom: 0 }}
              ySplitNumber={2}
              yAxisMin={yAxisMin}
              yAxisMax={yAxisMax}
              yAxisLabelFormatter={(v) => `$${v.toFixed(2)}`}
            />
          )}
        </div>
      </div>
    </StaticCard>
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

const EthSupplyCard = ({ nowMs }: { nowMs: number | null }) => {
  const { supply, baseTime, annualRate } = useProjectedSupply(nowMs);

  return (
    <StaticCard
      infoSlot={
        "Projected, not measured. The last daily supply reading from growthepie's ETH supply tracker is carried forward at the current annualised net issuance rate. Real issuance arrives per block and is offset by the EIP-1559 burn."
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
            <div className="heading-small-xs text-color-text-secondary">projected from last daily reading</div>
          </div>
          <div className="flex gap-x-[20px]">
            <SubMetric
              label="Issuance Rate"
              value={formatRatePercent(annualRate) ? `${formatRatePercent(annualRate)} / yr` : "—"}
            />
            <SubMetric
              label="Last Reading"
              value={baseTime !== null ? dayjs.utc(baseTime).format("D MMM YYYY") : "—"}
            />
          </div>
        </div>
      </div>
    </StaticCard>
  );
};

// --- Card 3: ETH per Person (replaces Token Transfer Fees) ---

type PerCapitaMode = "eth-per-person" | "people-per-eth";

const PER_CAPITA_MODES = [
  { value: "eth-per-person", label: "Ξ / person" },
  { value: "people-per-eth", label: "People / Ξ" },
];

const EthPerPersonCard = ({ nowMs }: { nowMs: number | null }) => {
  const { supply } = useProjectedSupply(nowMs);
  const { population, annualRate: populationGrowth, baseYear } = useProjectedPopulation(nowMs);
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
    <StaticCard
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
          <div className="flex gap-x-[20px]">
            <SubMetric label="Population Source" value={baseYear ? `World Bank ${baseYear}` : "—"} />
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
      </div>
    </StaticCard>
  );
};

// --- Layout ---

const EthAssetMetrics = () => {
  const nowMs = useTicker(1000);

  return (
    <Container className="z-[1]">
      <div className="grid grid-cols-[1fr,1fr,1fr] gap-[15px] w-full @container">
        <div className="col-span-3 @[1040px]:col-span-1">
          <EthPriceCard />
        </div>
        <div className="flex flex-col lg:flex-row gap-[15px] col-span-3 @[1040px]:col-span-2">
          <EthSupplyCard nowMs={nowMs} />
          <EthPerPersonCard nowMs={nowMs} />
        </div>
      </div>
    </Container>
  );
};

export default EthAssetMetrics;
