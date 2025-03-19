"use client";
import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import { useLocalStorage } from "usehooks-ts";
import Subheading from "@/components/layout/Subheading";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Icon from "@/components/layout/ServerIcon";
import { text } from "stream/consumers";

export function LandingFirstHeaders() {
  const [isFocusEnabled] = useLocalStorage("focusEnabled", false);  
  const textToggles = {
    "header_1": {
      "total": "Ethereum Ecosystem Traction",
      "l2" : "Layer 2 Traction"
    },
    "subheader_1": {
        "total": "These aggregated metrics across Ethereum Mainnet and all tracked Layer 2s give you a glimpse of the entire Ethereum ecosystem.",
        "l2": "These aggregated metrics across all tracked Layer 2s give you a glimpse of the Ethereum Layer 2 ecosystem."
    },
  }
  return (
    <>
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon icon={"gtp-ethereumlogo"} size="lg" />
          <Heading
            id="layer-2-traction-title"
            className="heading-large-lg"
          >
            {textToggles.header_1[isFocusEnabled ? "l2" : "total"]}
          </Heading>
        </div>
        <Subheading className="text-md px-[5px] ">
          <div>{textToggles.subheader_1[isFocusEnabled ? "l2" : "total"]}</div>
        </Subheading>
    </>  
);
}


export function LandingSecondHeaders() {
    const [isFocusEnabled] = useLocalStorage("focusEnabled", false);  
    const textToggles = {
        "header_2": {
            "total": "Ethereum Weekly Engagement",
            "l2" : "Layer 2 Weekly Engagement"
        },
        "subheader_2": {
            "total": "Number of unique addresses interacting with one or multiple chains in the Ethereum ecosystem in a given week.",
            "l2": "Number of unique addresses interacting with one or multiple Layer 2s in the Ethereum ecosystem in a given week."
        },
    }
    return (
        <>
            <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
                <GTPIcon icon={"gtp-ethereum-weekly"} size="lg" />
                <Heading className="heading-large-lg">
                    {textToggles.header_2[isFocusEnabled ? "l2" : "total"]}
                </Heading>
            </div>
            <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
                {textToggles.subheader_2[isFocusEnabled ? "l2" : "total"]}
            </Subheading>
        </>  
    );      
}


