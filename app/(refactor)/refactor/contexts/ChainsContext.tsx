"use client";
import {
  BlockspaceURLs,
  ChainBlockspaceURLs,
  ChainsBaseURL,
  MasterURL,
} from "@/lib/urls";
import {
  ChainData,
  ChainOverviewResponse,
} from "@/types/api/ChainOverviewResponse";
import {
  ChainRanking,
  ChainsData,
  ChainResponse,
  HottestContractData,
} from "@/types/api/ChainResponse";
import { ChainDatum, FeesTableResponse } from "@/types/api/Fees/Table";
import {
  MasterResponse,
  ChainInfo,
  Stack,
  L2BeatStage,
  BlockExplorers,
} from "@/types/api/MasterResponse";
import {
  createContext,
  use,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import React from "react";
import { Icon } from "@iconify/react";
import { useLocalStorage } from "usehooks-ts";
import { set } from "lodash";
import { cp } from "fs";
import ShowLoading from "@/components/layout/ShowLoading";

type ChainContextType = {
  data: ChainsData | undefined;
  info: ChainInfo | undefined;
  chainKey: string;
  feesTable: any;
  compareChain: string | undefined;
  sectionHead: SectionHead | undefined;
  setCompareChain: (chain: string) => void;
  getGradientColor: (percentage: number, weighted?: boolean) => string;
  ChainIcon: React.ReactNode;
};

type CompoundRanking = {
  [key: string]: {
    color: string;
    rank: number;
    out_of: number;
    title: string;
  };
};

const ChainContext = createContext<ChainContextType | null>({
  data: undefined,
  info: undefined,
  chainKey: "",
  feesTable: undefined,
  compareChain: undefined,
  setCompareChain: () => { },
  getGradientColor: () => "",
  sectionHead: undefined,
  ChainIcon: <></>,
});

export const ChainsProvider = ({
  children,
  chainKey,
}: {
  children: React.ReactNode;
  chainKey: string;
}) => {
  const rankChains = {
    daa: {
      Title: "Daily Active Addresses",
    },
    fees: {
      Title: "Fees Paid By Users",
    },
    stables_mcap: {
      Title: "Stablecoin Market Cap",
    },
    profit: {
      Title: "Onchain Profit",
    },
    txcosts: {
      Title: "Transaction Costs",
    },
    fdv: {
      Title: "Fully Diluted Valuation",
    },
    throughput: {
      Title: "Throughput",
    },
  };

  const { cache, mutate } = useSWRConfig();
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  const { data: masterData, isLoading: masterLoading } =
    useSWR<MasterResponse>(MasterURL);
  const { data: chainData, isLoading: chainLoading } = useSWR<ChainResponse>(
    `${ChainsBaseURL}${chainKey}.json`,
  );
  const { data: feeData, isLoading: feeLoading } = useSWR<FeesTableResponse>(
    "https://api.growthepie.xyz/v1/fees/table.json",
  );
  const { data: overviewData, isLoading: overviewLoading } = useSWR<ChainData>(
    ChainBlockspaceURLs[chainKey],
  );

  const [sectionHead, setSectionHead] = useState<SectionHead | undefined>(
    undefined,
  );

  const [compareChain, setCompareChain] = useState<string | undefined>(
    undefined,
  );

  const [compareChainData, setCompareChainData] = useState<
    ChainData | undefined
  >(undefined);
  const [info, setInfo] = useState<ChainInfo | undefined>(undefined);

  useEffect(() => {
    if (masterData) {
      const chainData = masterData.chains[chainKey];

      if (chainData) {
        setInfo(chainData);
      }
    }
  }, [chainKey, masterData]);

  useEffect(() => {
    let data = {};
    if (!masterData || !chainData || !feeData || !overviewData) {
      return;
    }

    const generateRankings = (): CompoundRanking => {
      let allRankings = {} as CompoundRanking;
      Object.keys(rankChains).forEach((key) => {
        let color = chainData.data.ranking
          ? chainData.data.ranking[key]
            ? getGradientColor(chainData.data.ranking[key].color_scale * 100)
            : "#5A6462"
          : "#5A6462";

        allRankings[key] = {
          color: color,
          rank: chainData.data.ranking[key].rank,
          out_of: chainData.data.ranking[key].out_of,
          title: rankChains[key].Title,
        };
      });
      return allRankings;
    };

    const sectionInfoData: SectionHead = {
      menu: {
        hasBlockspaceOverview: overviewData ? true : false,
        block_explorers: masterData.chains[chainKey].block_explorers,
        bridge_url: masterData.chains[chainKey].rhino_listed
          ? masterData.chains[chainKey].rhino_naming
            ? `https://app.rhino.fi/bridge?refId=PG_GrowThePie&token=ETH&chainOut=${masterData.chains[chainKey].rhino_naming}&chain=ETHEREUM`
            : "https://app.rhino.fi/bridge/?refId=PG_GrowThePie"
          : undefined,
      },
      background: {
        info: masterData.chains[chainKey].description,
        launch_date: masterData.chains[chainKey].launch_date,
        rankings: generateRankings(),
        purpose: masterData.chains[chainKey].purpose,
      },
      usage: {
        fees: feeData.chain_data[chainKey],
        hottest_contract: chainData.data.hottest_contract,
      },
      technology: {
        stack: masterData.chains[chainKey].stack,
        da_layer: masterData.chains[chainKey].da_layer,
        technology: masterData.chains[chainKey].technology,
        raas: masterData.chains[chainKey].raas,
      },
      risk: {
        l2beat_stage: masterData.chains[chainKey].l2beat_stage,
      },
    };

    setSectionHead(sectionInfoData);
  }, [masterData, chainData, feeData, overviewData, chainKey]);

  const getGradientColor = useCallback((percentage, weighted = false) => {
    const colors = !weighted
      ? [
        { percent: 0, color: "#1DF7EF" },
        { percent: 20, color: "#76EDA0" },
        { percent: 50, color: "#FFDF27" },
        { percent: 70, color: "#FF9B47" },
        { percent: 100, color: "#FE5468" },
      ]
      : [
        { percent: 0, color: "#1DF7EF" },
        { percent: 2, color: "#76EDA0" },
        { percent: 10, color: "#FFDF27" },
        { percent: 40, color: "#FF9B47" },
        { percent: 80, color: "#FE5468" },
        { percent: 100, color: "#FE5468" }, // Repeat the final color to ensure upper bound
      ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    if (weighted) {
      // Adjust lower and upper bounds for weighted gradient
      lowerBound = colors[0];
      upperBound = colors[1];
    }

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(1, 3), 16) -
        parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(3, 5), 16) -
        parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(5, 7), 16) -
        parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, []);

  if (!chainData) {
    return (
      <div>
        <ShowLoading dataLoading={[chainLoading, masterLoading, feeLoading]} />
      </div>
    );
  }

  return (
    <ChainContext.Provider
      value={{
        data: chainData.data,
        info: info,
        feesTable: feeData,
        chainKey: chainKey,
        compareChain,
        setCompareChain,
        getGradientColor: getGradientColor,
        sectionHead: sectionHead,
        ChainIcon: (
          <Icon
            icon={`gtp:${chainKey}-logo-monochrome`}
            className="w-9 h-9"
            style={{
              color: "#fff",
            }}
          />
        ),
      }}
    >
      {chainData && !chainLoading ? children : null}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const ctx = useContext(ChainContext);

  if (!ctx) {
    throw new Error("useChain must be used within a ChainsProvider");
  }

  return ctx;
};

type SectionHead = {
  menu: {
    hasBlockspaceOverview: boolean;
    block_explorers: BlockExplorers;
    bridge_url: string | undefined;
  };
  background: {
    info: string;
    launch_date: string;
    rankings: CompoundRanking;
    purpose: string;
  };
  usage: {
    fees: ChainDatum;
    hottest_contract: HottestContractData;
  };
  technology: {
    stack: Stack;
    da_layer: string;
    technology: string;
    raas: string;
  };
  risk: {
    l2beat_stage: L2BeatStage;
  };
};
