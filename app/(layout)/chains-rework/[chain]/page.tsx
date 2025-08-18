"use client";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import { useState } from "react";
import { ChainInfo } from "@/types/api/MasterResponse";
import ChainTabs from "@/components/layout/SingleChains/ChainTabs";

const Chain = ({ params }: { params: any }) => {
    const { chain } = params;
    const master = useMaster();
    const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
    const { theme } = useTheme();
    const [selectedTab, setSelectedTab] = useState<string>("overview");
  
    const { AllChains, AllChainsByKeys } = useMaster();
  
    const [chainKey, setChainKey] = useState<string>(
      AllChains.find((c) => c.urlKey === chain)?.key
        ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
        : "",
    );


    return(
        <Container className="pt-[100px]">
            <ChainTabs chainInfo={master.chains[chainKey]} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
        </Container>
    )
}


export default Chain;