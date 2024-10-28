"use client";
import { Chain, Get_AllChainsByKeys, Get_AllChainsNavigationItems, Get_SupportedChainKeys } from "@/lib/chains";
import { GloHolderURL, MasterURL } from "@/lib/urls";
import { DataAvailabilityLayerData, DataAvailabilityLayers, MasterResponse, Metrics, MetricInfo, UnitSchema, Chains } from "@/types/api/MasterResponse";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ImportChainIcons } from "@/lib/chainIcons";
import useSWR from "swr";
import { GTPIconName } from "@/icons/gtp-icon-names";

export type DALayerWithKey = (DataAvailabilityLayerData & { key: string, label: string });

type MasterContextType = {
  data: MasterResponse | undefined;
  AllChains: Chain[];
  AllChainsByKeys: { [key: string]: Chain };
  AllDALayers: DALayerWithKey[];
  AllDALayersByKeys: { [key: string]: DALayerWithKey };
  DefaultChainSelection: string[];
  EnabledChainsByKeys: { [key: string]: Chain };
  SupportedChainKeys: string[];
  ChainsNavigationItems: {
    name: string;
    label: string;
    key: string;
    icon: GTPIconName;
    options: {
      label: string;
      icon: GTPIconName;
      key: string;
      urlKey: string;
      hide: boolean;
      excludeFromSitemap: boolean;
    }[];
  } | null;
  formatMetric: (value: number, unit: string, unitType: string, type?: string) => string;
  // getUnitKeys: (metric: string, type?: string) => (string[] | void);
  // getMetricInfo: (metric: string, type?: string) => (MetricInfo | void);
  metrics: Metrics;
  da_metrics: Metrics;
  chains: Chains;
  da_layers: DataAvailabilityLayers;
};

const MasterContext = createContext<MasterContextType | null>({
  data: undefined,
  AllChains: [],
  AllChainsByKeys: {},
  AllDALayers: [],
  AllDALayersByKeys: {},
  DefaultChainSelection: [],
  EnabledChainsByKeys: {},
  SupportedChainKeys: [],
  ChainsNavigationItems: null,
  formatMetric: () => "",
  // getUnitKeys: () => [],
  // getMetricInfo: () => ({} as MetricInfo),
  metrics: {},
  da_metrics: {},
  chains: {},
  da_layers: {},
});

export const MasterProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR<MasterResponse>(MasterURL);
  const [AllChains, setAllChains] = useState<Chain[]>([]);
  const [AllChainsByKeys, setAllChainsByKeys] = useState<{ [key: string]: Chain }>({});
  const [AllDALayers, setDALayers] = useState<DALayerWithKey[]>([]);
  const [AllDALayersByKeys, setDALayersByKeys] = useState<{ [key: string]: DALayerWithKey }>({});
  const [DefaultChainSelection, setDefaultChainSelection] = useState<string[]>([]);
  const [EnabledChainsByKeys, setEnabledChainsByKeys] = useState<{ [key: string]: Chain }>({});
  const [ChainsNavigationItems, setChainsNavigationItems] = useState<any>({});
  const { data: glo_dollar_data } = useSWR(GloHolderURL);

  useEffect(() => {
    if (data) {
      const allChains = Get_AllChainsByKeys(data);
      // set session storage
      sessionStorage.setItem("AllChainsByKeys", JSON.stringify(allChains));
      setAllChains(Object.values(allChains));
      setAllChainsByKeys(allChains);

      const enabledChainsByKeys = Object.values(allChains).reduce(
        (acc, chain) => {
          if (chain.chainType === "L2") {
            if (chain.ecosystem.includes("all-chains")) {
              acc[chain.key] = chain;
            }
          } else {
            acc[chain.key] = chain;
          }
          return acc;
        },
        {},
      );

      setEnabledChainsByKeys(enabledChainsByKeys);

      const chainsNavigationItems = Get_AllChainsNavigationItems(data);
      setChainsNavigationItems(chainsNavigationItems);

      const daLayersWithKeys: (DataAvailabilityLayerData & { key: string, label: string })[] = Object.entries(data.da_layers).map(([key, value]) => ({ ...value, key, label: value.name }));

      // Data Availability Layers
      setDALayers(daLayersWithKeys);
      setDALayersByKeys(daLayersWithKeys.reduce((acc, layer) => {
        acc[layer.key] = layer;
        return acc;
      }, {}));

      setDefaultChainSelection(data.default_chain_selection);

      // import chain icons into iconify
      ImportChainIcons(data);
    }
  }, [data]);

  const formatMetric = useCallback((value: number, metric: string, unitType: string = "value", type = "fundamentals") => {
    if (metric === "gas_fees_usd") {
      metric = "fees";
      unitType = "usd";
    }

    if (!data) {
      return `MasterProvider: data not found`;
    }

    const metricInfo = type === "fundamentals" ? data.metrics[metric] : data.da_metrics[metric];

    if (!metricInfo) {
      return `MasterProvider: metricInfo not found: ${metric}`;
    }

    const unit = metricInfo.units[unitType];

    if (!unit) {
      return `MasterProvider: unitType not found: ${unitType}`;
    }

    const { currency, prefix, suffix, decimals, decimals_tooltip, agg, agg_tooltip } = unit;

    return `${prefix || ""}${value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix || ""}`;
  }, [data]);

  return (
    <MasterContext.Provider
      value={{
        data,
        AllChains,
        AllChainsByKeys,
        AllDALayers,
        AllDALayersByKeys,
        DefaultChainSelection,
        EnabledChainsByKeys,
        SupportedChainKeys: Get_SupportedChainKeys(data),
        ChainsNavigationItems,
        formatMetric,
        // getUnitKeys,
        // getMetricInfo,
        metrics: data?.metrics || {},
        da_metrics: data?.da_metrics || {},
        chains: data?.chains || {},
        da_layers: data?.da_layers || {},
      }}
    >
      {data && !isLoading && AllChains.length > 0 ? children : null}
    </MasterContext.Provider>
  );
};

export const useMaster = () => {
  const ctx = useContext(MasterContext);

  if (!ctx) {
    throw new Error(
      "useMaster must be used within a MasterProvider",
    );
  }

  return ctx;
};
