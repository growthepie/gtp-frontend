"use client";
import {
  BlockspaceURLs,
  ChainBlockspaceURLs,
  ChainURLs,
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
import { createContext, use, useContext, useEffect, useState } from "react";
import useSWR from "swr";
import React from "react";
import { Icon } from "@iconify/react";

type ChainContextType = {
  data: ChainsData | undefined;
  info: ChainInfo | undefined;
  chainKey: string;
  feesTable: any;
  compareChain: string | undefined;
  sectionHead: SectionHead | undefined;
  setCompareChain: (chain: string) => void;
  ChainIcon: React.ReactNode;
};

const ChainContext = createContext<ChainContextType | null>({
  data: undefined,
  info: undefined,
  chainKey: "",
  feesTable: undefined,
  compareChain: undefined,
  setCompareChain: () => {},
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
  const { data: masterData, isLoading: masterLoading } =
    useSWR<MasterResponse>(MasterURL);
  const { data: chainData, isLoading: chainLoading } = useSWR<ChainResponse>(
    ChainURLs[chainKey],
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
        rankings: chainData.data.ranking,
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

  if (!chainData || chainLoading) {
    return <div>Loading...</div>;
  } else {
    return (
      <ChainContext.Provider
        value={{
          data: chainData.data,
          info: info,
          feesTable: feeData,
          chainKey: chainKey,
          compareChain,
          setCompareChain,
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
  }
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
    rankings: ChainRanking;
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
