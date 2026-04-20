"use client";

import { useCallback } from "react";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverview, GetRankingColor } from "@/lib/chains";
import { MasterResponse, MetricInfo } from "@/types/api/MasterResponse";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useLocalStorage } from "usehooks-ts";
import { useRouter } from "next/navigation";
import { getFundamentalsByKey } from "@/lib/metrics";
import { useTheme } from "next-themes";
import GTPMetricCard from "@/components/layout/Applications/AppMetricCard";
import MetricRankingIcon from "./MetricRankingIcon";

export default function MetricCards({
  chainKey,
  master,
  metricKey,
  metricData,
  overviewData,
}: {
  chainKey: string;
  master: MasterResponse;
  metricKey: string;
  metricData: MetricInfo;
  overviewData: ChainOverview;
}) {
  const { AllChainsByKeys } = useMaster();
  const chainData = AllChainsByKeys[chainKey];
  const [showUsd] = useLocalStorage("showUsd", true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleCardClick = useCallback(() => {
    const metricItem = getFundamentalsByKey[metricKey];
    if (metricItem?.urlKey) {
      sessionStorage.setItem("fundamentalsChains", JSON.stringify([chainKey]));
      router.push(`/fundamentals/${metricItem.urlKey}/${chainData.urlKey}`);
    }
  }, [metricKey, chainData, chainKey, router]);

  if (
    !chainData ||
    !overviewData.data.ranking[metricKey] ||
    !metricData ||
    !overviewData.data.kpi_cards[metricKey]
  )
    return null;

  const metricUseUSD = Object.keys(metricData.units).includes("usd");
  const unitKey = metricUseUSD ? (showUsd ? "usd" : "eth") : "value";
  const prefix = metricData.units[unitKey].prefix || "";
  const suffix = metricData.units[unitKey].suffix || "";
  const valueIndex = metricUseUSD ? (showUsd ? 0 : 1) : 0;

  const rankingColor = GetRankingColor(
    overviewData.data.ranking[metricKey].color_scale * 100,
    false,
    (resolvedTheme as "dark" | "light") ?? "dark",
  );

  const sparklineRaw = overviewData.data.kpi_cards[metricKey].sparkline.data;
  const sparklineValues: number[] = sparklineRaw.map((item: any) => item[1 + valueIndex]);
  const sparklineTimestamps: string[] = sparklineRaw.map((item: any) => item[0]);

  return (
    <GTPMetricCard
      label={metricData.name}
      leftIcon={
        <MetricRankingIcon
          icon={`gtp-${metricData.icon.replace(/^(metrics-)(.*)/, (_m, p, rest) => p + rest.replace(/-/g, ""))}-monochrome` as GTPIconName}
          rank={overviewData.data.ranking[metricKey].rank}
          rankingColor={rankingColor}
          chainName={master.chains[chainKey].name}
          metricName={metricData.name}
        />
      }
      value={overviewData.data.kpi_cards[metricKey].current_values.data[valueIndex]}
      wowChange={overviewData.data.kpi_cards[metricKey].wow_change.data[0] * 100}
      prefix={prefix}
      suffix={suffix}
      sparkline={sparklineValues}
      timestamps={sparklineTimestamps}
      color={chainData.colors[resolvedTheme ?? "dark"][0]}
      onClick={handleCardClick}
    />
  );
}
