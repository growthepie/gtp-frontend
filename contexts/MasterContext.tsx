"use client";
import { Chain, Get_AllChainsByKeys, Get_AllChainsNavigationItems, Get_SupportedChainKeys } from "@/lib/chains";
import { GloHolderURL, MasterURL } from "@/lib/urls";
import { DataAvailabilityLayerData, DataAvailabilityLayers, MasterResponse } from "@/types/api/MasterResponse";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ImportChainIcons } from "@/lib/chainIcons";
import useSWR from "swr";
import { GTPIconName } from "@/icons/gtp-icon-names";

type MasterContextType = {
  data: MasterResponse | undefined;
  AllChains: Chain[];
  AllChainsByKeys: { [key: string]: Chain };
  AllDALayers: (DataAvailabilityLayerData & { key: string, label: string })[];
  AllDALayersByKeys: { [key: string]: DataAvailabilityLayerData & { key: string, label: string } };
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
  formatMetric: (value: number, unit: string) => string;
  getUnits: (metric: string) => any;
};

const MasterContext = createContext<MasterContextType | null>({
  data: undefined,
  AllChains: [],
  AllChainsByKeys: {},
  AllDALayers: [],
  AllDALayersByKeys: {},
  EnabledChainsByKeys: {},
  SupportedChainKeys: [],
  ChainsNavigationItems: null,
  formatMetric: () => "MasterProvider: formatMetric not found",
  getUnits: () => "MasterProvider: getUnits not found",
});

export const MasterProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR<MasterResponse>(MasterURL);
  const [AllChains, setAllChains] = useState<Chain[]>([]);
  const [AllChainsByKeys, setAllChainsByKeys] = useState<{ [key: string]: Chain }>({});
  const [AllDALayers, setDALayers] = useState<(DataAvailabilityLayerData & { key: string, label: string })[]>([]);
  const [AllDALayersByKeys, setDALayersByKeys] = useState<{ [key: string]: DataAvailabilityLayerData & { key: string, label: string } }>({});
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

      // import chain icons into iconify
      ImportChainIcons(data);
    }
  }, [data]);

  const formatMetric = useCallback((value: number, metric: string, unitType: string = "value") => {
    if (metric === "gas_fees_usd") {
      metric = "fees";
      unitType = "usd";
    }

    if (!data) {
      return `MasterProvider: data not found`;
    }

    const metricInfo = data.metrics[metric];

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

  const getUnits = useCallback((metric: string) => {
    if (!data) {
      return `MasterProvider: data not found`;
    }

    const metricInfo = data.metrics[metric];
    if (!metricInfo) {
      console.error(`MasterProvider: metricInfo not found: ${metric}`);
      return {};
    }

    if (!metricInfo.units) {
      console.error(`MasterProvider: metricInfo.units not found: ${metric}`);
      return {};
    }



    return metricInfo.units;
  }, [data]);

  return (
    <MasterContext.Provider
      value={{
        data,
        AllChains,
        AllChainsByKeys,
        AllDALayers,
        AllDALayersByKeys,
        EnabledChainsByKeys,
        SupportedChainKeys: Get_SupportedChainKeys(data),
        ChainsNavigationItems,
        formatMetric,
        getUnits
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
