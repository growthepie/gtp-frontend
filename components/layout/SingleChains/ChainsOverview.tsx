"use client";
import { useState } from "react";
import { ChainInfo } from "@/types/api/MasterResponse";
import { ChainData } from "@/types/api/ChainOverviewResponse";
import { Icon } from "@iconify/react";
import { GTPIcon } from "../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";


function dataAvailToArray(x: string) {
    let retObject: { icon: string; label: string }[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }

      if (x.includes("MantleDA")) {
        retObject.push({
          icon: "customoffchain",
          label: "MantleDA",
        });
      }

      if (x.includes("DAC")) {
        retObject.push({
          icon: "committee",
          label: "DAC (committee)",
        });
      }

      if (x.includes("Celestia")) {
        retObject.push({
          icon: "celestiafp",
          label: "Celestia",
        });
      }

      if (x.includes("memo")) {
        retObject.push({
          icon: "memofp",
          label: "Memo",
        });
      }
    }
    return retObject;
}

const ChainsOverview = ({ chainData }: { chainData: ChainInfo }) => {
    return (
        <div className="flex flex-col w-full">

            <AboutChain chainData={chainData} />
        </div>
    )
}


const AboutChain = ({ chainData }: { chainData: ChainInfo }) => {

    const [open, setOpen] = useState<boolean>(true);
    return (
        <div className={`flex flex-col w-full rounded-[15px] bg-[#1F2726] px-[30px] py-[15px]  ${open ? "gap-y-[10px]" : ""}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-x-[15px] text-[#5A6462]" onClick={() => setOpen(!open)}>
                    <GTPIcon icon="gtp-chevrondown-monochrome" className={`!w-[24px] !h-[22px] transition-all ${!open ? "-rotate-90" : ""}`} containerClassName="!w-[24px] !h-[24px] pt-[2px]" />
                    <div className="heading-large-md">About {chainData.name}</div>
                </div>
            </div>
            <div className="flex flex-col w-full text-sm transition-all duration-300 overflow-hidden " 
            style={{
                height: open ? 24 : 0,
            }}
            >

                {chainData.description}
            </div>
            <div className="flex justify-between gap-x-[10px] overflow-hidden transition-all duration-300"
            style={{
                height: open ? 150 : 0,
            }}
            >
                <div className="flex justify-between gap-x-[15px] w-full max-w-[850px]">
                    <div className="flex flex-col justify-between h-full">
                        {/* reverse the order of the month and year in the data conversion to show year first */}   
                        <MetricTab title="Launch Date"><div>{chainData.launch_date ? new Date(chainData.launch_date).toLocaleDateString(undefined, { year: "numeric", month: "long", }) : "N/A"}</div></MetricTab>
                        <MetricTab title="Company"><div>{chainData.company ? chainData.company : "N/A"}</div></MetricTab>
                        <MetricTab title="Chain ID"><div>{chainData.company ? chainData.company : "N/A"}</div></MetricTab>
                    </div>
                    <div className="flex flex-col justify-between h-full">
                        <MetricTab title="Stack"><div>{chainData.stack.label}</div></MetricTab>
                        <MetricTab title="Cluster"><div>{"N/A"}</div></MetricTab>
                        <MetricTab title="Rollup as a service"><div>{chainData.raas}</div></MetricTab>
                    </div>
                    <div className="flex flex-col justify-between h-full">
                        <MetricTab title="Gas Token"><div>{"N/A"}</div></MetricTab>
                        <MetricTab title="Type"><div>{chainData.technology}</div></MetricTab>
                        <MetricTab title="EVM"><div>{chainData.purpose}</div></MetricTab>
                    </div>
                    <div className="flex flex-col justify-between h-full">
                        <MetricTab title="Data Availability">
                            <div className="text-[10px] leading-[150%] font-medium  ">
                                {dataAvailToArray(
                                    chainData.da_layer,
                                ).map((x) => (
                                    <div
                                    className="flex items-center gap-x-1"
                                    key={x.label}
                                    >
                                    <Icon
                                        icon={`gtp:${x.icon}`}
                                        className="w-[12px] h-[12px]"
                                    />
                                    </div>
                                ))}
                            </div>
                        </MetricTab>
                        <div className="flex gap-x-[10px]">
                            <div className="flex items-start"><GTPIcon icon="gtp-layer2-maturity-developing" className="!w-[24px] !h-[22px]" containerClassName="!w-[24px] !h-[24px] pt-[2px]" /></div>
                            <div className="text-xxs max-w-[200px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}

const MetricTab = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
        <div className="flex flex-col w-full gap-y-[2px]">
            <div className="heading-large-xxxs text-[#5A6462]">{title}</div>
            <div className="text-sm whitespace-nowrap">{children}</div>
        </div>
    )
}

export default ChainsOverview;