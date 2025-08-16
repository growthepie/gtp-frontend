"use client";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import { useState } from "react";

const Chain = ({ params }: { params: any }) => {
    const { chain } = params;
    const master = useMaster();
    const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
    const { theme } = useTheme();
  
    const { AllChains, AllChainsByKeys } = useMaster();
  
    const [chainKey, setChainKey] = useState<string>(
      AllChains.find((c) => c.urlKey === chain)?.key
        ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
        : "",
    );


    return(
        <Container className="pt-[100px]">
            <SectionBar>
                <SectionBarItem
                    isSelected={true}
                    isLocked={false}
                    comingSoon={false}
                    icon={"gtp:gtp-pie"}
                    header="Test Item"
                />
                <SectionBarItem
                    isSelected={false}
                    isLocked={false}
                    comingSoon={true}
                    icon={"gtp:gtp-pie"}
                    header="Test Item 2"

                />
                <SectionBarItem
                    isSelected={false}
                    isLocked={true}
                    comingSoon={false}
                    icon={"gtp:gtp-pie"}
                    header="Test Item 3"
                />
            </SectionBar>
        </Container>
    )
}


export default Chain;