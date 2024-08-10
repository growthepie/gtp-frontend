"use client";
import { Chain, Get_AllChainsNavigationItems } from "@/lib/chains";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useSWR from "swr";

type MasterContextType = {
  data: MasterResponse | undefined;
  AllChains: Chain[];
  AllChainsByKeys: { [key: string]: Chain };
  EnabledChainsByKeys: { [key: string]: Chain };
  ChainsNavigationItems: {
    name: string;
    label: string;
    key: string;
    icon: string;
    options: {
      label: string;
      icon: string;
      key: string;
      urlKey: string;
      hide: boolean;
      excludeFromSitemap: boolean;
    }[];
  } | null;
  formatMetric: (value: number, unit: string) => string;
};

const MasterContext = createContext<MasterContextType | null>({
  data: undefined,
  AllChains: [],
  AllChainsByKeys: {},
  EnabledChainsByKeys: {},
  ChainsNavigationItems: null,
  formatMetric: () => "MasterProvider: formatMetric not found",
});

export const MasterProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR<MasterResponse>(MasterURL);
  const [AllChains, setAllChains] = useState<Chain[]>([]);
  const [AllChainsByKeys, setAllChainsByKeys] = useState<{ [key: string]: Chain }>({});
  const [EnabledChainsByKeys, setEnabledChainsByKeys] = useState<{ [key: string]: Chain }>({});
  const [ChainsNavigationItems, setChainsNavigationItems] = useState<any>({});

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

  return (
    <MasterContext.Provider
      value={{ data, AllChains, AllChainsByKeys, EnabledChainsByKeys, ChainsNavigationItems, formatMetric }}
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





export const Get_AllChainsByKeys = (master: MasterResponse) => {
  console.log("master", master);

  let chains: { [key: string]: any } = {};
  Object.keys(master.chains).forEach((key) => {
    console.log("key", key, master.chains[key]);
    let chain = master.chains[key];
    chains[key] = {
      label: chain.name,
      icon: chain.logo?.body ? chain.logo.body : null,
      key: key,
      urlKey: key.replace(/_/g, "-"),
      chainType: getChainTypeFromMasterChainType(key, chain.chain_type),
      ecosystem: chain.ecosystem,
      description: chain.description,
      border: {
        light: [
          `border-[${chain.colors.light[0]}]`,
          `border-[${chain.colors.light[1]}]`,
        ],
        dark: [
          `border-[${chain.colors.dark[0]}]`,
          `border-[${chain.colors.dark[1]}]`,
        ],
      },
      colors: {
        light: [`${chain.colors.light[0]}`, `${chain.colors.light[1]}`],
        dark: [`${chain.colors.dark[0]}`, `${chain.colors.dark[1]}`],
      },
      backgrounds: {
        light: [
          `bg-[${chain.colors.light[0]}]`,
          `bg-[${chain.colors.light[1]}]`,
        ],
        dark: [`bg-[${chain.colors.dark[0]}]`, `bg-[${chain.colors.dark[1]}]`],
      },
      darkTextOnBackground: chain.colors.darkTextOnBackground,
    };
  });

  return chains;
};

const getChainTypeFromMasterChainType = (
  chainKey: string,
  masterChainType: string,
) => {
  if (chainKey === "all_l2s") {
    return "all-l2s";
  }

  if (masterChainType === "-") {
    return null;
  }

  return masterChainType;
};

