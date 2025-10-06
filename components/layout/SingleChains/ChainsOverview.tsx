"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChainInfo, MasterResponse } from "@/types/api/MasterResponse";
import { ChainData, ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { Icon } from "@iconify/react";
import { GTPIcon } from "../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import TPSChartCard from "./OverviewCards/TPSChartCard";
import SideCards from "./OverviewCards/SideCards";
import Link from "next/link";
import { RowProvider } from "../BlockspaceOverview/ChainRows/RowContext";
import SingleRowContainer from "../BlockspaceOverview/ChainRows/SingleRowContainer";
import useSWR from "swr";
import { BlockspaceURLs, MasterURL } from "@/lib/urls";
import ApplicationsGrid from "./OverviewCards/ApplicationsGrid";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ChainOverview } from "@/lib/chains";
import { LifetimeAchievments } from "./OverviewCards/Achievments";



const socials = {
    Twitter: {
        icon: "ri:twitter-x-fill",
        name: "Twitter",
    },
    Discord: {
        icon: "gtp:discord",
        name: "Discord",
    },
    Telegram: {
        icon: "feather:telegram",
        name: "Telegram",
    },
    Blog: {
        icon: "feather:globe",
        name: "Website",
    },
    Docs: {
        icon: "feather:book",
        name: "Docs",
    },
} as const;

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

const ChainsOverview = ({ chainKey, chainData, master }: { chainKey: string, chainData: ChainInfo, master: any }) => {
    
    const {
        data: oldMaster,
        error: masterError,
        isLoading: masterLoading,
        isValidating: masterValidating,
      } = useSWR<MasterResponse>(MasterURL);


    const { data: chainDataOverview } = useSWR<ChainOverview>(`https://api.growthepie.xyz/v1/chains/${chainKey}/overview.json`);


    
   

   

    const [hoveredCategories, setHoveredCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState(
        oldMaster ? Object.keys(oldMaster.blockspace_categories.main_categories)[0] : "",
    );

        
    const hoverCategory = (category: string) => {
        if (!hoveredCategories.includes(category)) {
        setHoveredCategories([category]);
        }
    };

    const unhoverCategory = (category: string) => {
        if (hoveredCategories.includes(category)) {
        setHoveredCategories(hoveredCategories.filter((c) => c !== category));
        }
    };

    const isCategoryHovered = (category: string) => {
        return hoveredCategories.includes(category);
    };

    const categories: { [key: string]: string } = useMemo(() => {
        if (oldMaster) {
          const result: { [key: string]: string } = {};
    
          const categoryKeys = Object.keys(
            oldMaster.blockspace_categories.main_categories,
          );
    
          // Remove "unlabeled" if present and store it for later
          const unlabeledIndex = categoryKeys.indexOf("unlabeled");
          let unlabeledCategory = "";
          if (unlabeledIndex !== -1) {
            unlabeledCategory = categoryKeys.splice(unlabeledIndex, 1)[0];
          }
    
          categoryKeys.forEach((key) => {
            const words =
              oldMaster.blockspace_categories.main_categories[key].split(" ");
            const formatted = words
              .map((word) => {
                return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(" ");
            result[key] = formatted;
          });
    
          // Add "unlabeled" to the end if it was present
          if (unlabeledCategory) {
            const words =
              oldMaster.blockspace_categories.main_categories[unlabeledCategory].split(
                " ",
              );
            const formatted = words
              .map((word) => {
                return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(" ");
            result[unlabeledCategory] = formatted;
          }
    
          return result;
        }
    
        return {};
      }, [master]);
    

   
 
    return (
        <>
        { oldMaster && chainDataOverview && (
        <div className="@container flex flex-col w-full gap-[15px]">
            <AboutChain chainData={chainData} master={master} chainKey={chainKey} />
            <div className="grid grid-flow-row @[995px]:grid-cols-[minmax(480px,505px)_minmax(505px,auto)] gap-[10px]">
                <SideCards chainKey={chainKey} chainData={chainData} master={master} chainDataOverview={chainDataOverview} />
                <div className="flex flex-col w-full gap-y-[15px]">
                    <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default px-[30px] py-[15px] h-[215px]`}>
                        <div className="heading-large-md">Achievements</div>
                        <LifetimeAchievments data={chainDataOverview.data.achievements} master={oldMaster} />
                    </div>
                    <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default px-[30px] py-[15px]`}>
                        <ProjectsMetadataProvider>
                            <ApplicationsGrid chainKey={chainKey} chainData={chainData} />
                        </ProjectsMetadataProvider>
                    </div>
                    <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default  py-[15px] h-[218px]`}>
                        <div className="px-[30px] heading-large-md">Usage Breakdown</div>
                        <RowProvider
                            value={{
                                master: oldMaster,
                                data: chainDataOverview.data.blockspace.blockspace,
                                selectedMode: "txcount_share",
                                forceSelectedChain: "",
                                isCategoryHovered: isCategoryHovered, 
                                selectedCategory: selectedCategory,
                                selectedChain: chainKey,
                                selectedTimespan: "max",
                                selectedValue: "share",
                                categories: categories,
                                allCats: false              ,
                                setSelectedChain: () => {},
                                setSelectedCategory: setSelectedCategory,
                                setAllCats: () => {},
                                hoverCategory: hoverCategory,
                                unhoverCategory: unhoverCategory,
                                
                            }}
                            >
                            <SingleRowContainer />
                        </RowProvider>
                    </div>
                </div>
            </div>
        </div>
        )}
        </>
    )
}


const AboutChain = ({ chainData, master, chainKey }: { chainData: ChainInfo, master: any, chainKey: string }) => {

    const [open, setOpen] = useState<boolean>(true);

    const twitter = socials.Twitter;
    return (
        <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default px-[30px] py-[15px]  ${open ? "gap-y-[10px]" : ""}`}>
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-x-[15px] text-[#5A6462]" onClick={() => setOpen(!open)}>
                    <GTPIcon icon="gtp-chevrondown-monochrome" className={`!w-[24px] !h-[22px] transition-all ${!open ? "-rotate-90" : ""}`} containerClassName="!w-[24px] !h-[24px] pt-[2px]" />
                    <div className="heading-large-md">About {chainData.name}</div>
                </div>
                <div className={`flex items-center gap-x-[10px] transition-all duration-300 ${!open ? "opacity-100" : "opacity-0"}`}>
                
                
                    
                    {master.chains[chainKey].links.website && <LinkButton icon="gtp-bridge" label="Website" href={master.chains[chainKey].links.website} />}
                    {master.chains[chainKey].links.docs && <LinkButton icon="gtp-bridge" label="Docs" href={master.chains[chainKey].links.docs} />}
                    {master.chains[chainKey].links.github && <LinkButton icon="gtp-bridge" label="Github" href={master.chains[chainKey].links.github} />}
                    <LinkDropdown icon="gtp-bridge" label="More" links={Object.keys(master.chains[chainKey].links.socials).map((social) => ({ icon: socials[social].icon, label: socials[social].name, href: master.chains[chainKey].links.socials[social] }))} />
                    {master.chains[chainKey].links.governance && <LinkButton icon="gtp-bridge" label="Governance" href={master.chains[chainKey].links.governance} />}
                    <LinkDropdown icon="gtp-bridge" label="RPC" links={Object.keys(master.chains[chainKey].links.rpcs).map((rpc) => ({ icon: socials[rpc]?.icon, label: rpc, href: master.chains[chainKey].links.rpcs[rpc] }))} />
                    <LinkDropdown icon="gtp-bridge" label="Block Explorers" links={Object.keys(master.chains[chainKey].links.block_explorers).map((explorer) => ({ icon: socials[explorer]?.icon, label: explorer, href: master.chains[chainKey].links.block_explorers[explorer] }))} />
                    <LinkDropdown icon="gtp-bridge" label="Bridges" links={Object.keys(master.chains[chainKey].links.bridges).map((bridge) => ({ icon: socials[bridge]?.icon, label: bridge, href: master.chains[chainKey].links.bridges[bridge] }))} />
                </div>
            </div>
            <div className="flex flex-col w-full text-sm transition-all duration-300 overflow-hidden " 
            style={{
                height: open ? 24 : 0,
            }}
            >

                {chainData.description}
            </div>
            <div className="flex justify-between gap-x-[10px] transition-all duration-300"
            style={{
                height: open ? 150 : 0,
                overflow: open ? "visible" : "hidden",
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
                <div className="w-full h-full flex justify-between gap-x-[10px] max-w-[300px]">
                     <div className="flex flex-col items-start justify-between h-full">
                        {master.chains[chainKey].links.website && <LinkButton icon="gtp-bridge" label="Website" href={master.chains[chainKey].links.website} />}
                        {master.chains[chainKey].links.docs && <LinkButton icon="gtp-bridge" label="Docs" href={master.chains[chainKey].links.docs} />}
                        {master.chains[chainKey].links.github && <LinkButton icon="gtp-bridge" label="Github" href={master.chains[chainKey].links.github} />}
                        <LinkDropdown icon="gtp-bridge" label="More"  links={Object.keys(master.chains[chainKey].links.socials).map((social) => ({ icon: socials[social].icon, label: socials[social].name, href: master.chains[chainKey].links.socials[social] }))} />
                     </div>
                     <div className="flex flex-col items-start justify-between h-full">
                        <LinkButton icon="gtp-bridge" label="Governance" href="https://www.google.com" />
                        <LinkDropdown icon="gtp-bridge" label="RPC" links={Object.keys(master.chains[chainKey].links.rpcs).map((rpc) => ({ icon: socials[rpc]?.icon, label: rpc, href: master.chains[chainKey].links.rpcs[rpc] }))} />
                        <LinkDropdown icon="gtp-bridge" label="Block Explorers" links={Object.keys(master.chains[chainKey].links.block_explorers).map((explorer) => ({ icon: socials[explorer]?.icon, label: explorer, href: master.chains[chainKey].links.block_explorers[explorer] }))} />
                        <LinkDropdown icon="gtp-bridge" label="Bridges" links={Object.keys(master.chains[chainKey].links.bridges).map((bridge) => ({ icon: socials[bridge]?.icon, label: bridge, href: master.chains[chainKey].links.bridges[bridge] }))} />
                     </div>
                </div>
            </div>
        </div>
    )
}


const LinkButton = ({ icon, label, href }: { icon: string, label: string, href: string }) => {
    return (
        <Link href={href} className="flex items-center gap-x-[8px] bg-color-bg-medium pl-[6px] pr-[15px] rounded-[20px] h-[28px]">
            <GTPIcon icon={icon as GTPIconName} className="!w-[15px] !h-[15px]" containerClassName="!w-[26px] !h-[26px] flex justify-center items-center" />
            <div className=" heading-small-xs">{label}</div>
        </Link>
    )
}


const LinkDropdown = ({ icon, label, links }: { icon: string, label: string, links: { icon?: string, label: string, href: string }[] }) => {
    const [linkHeight, setLinkHeight] = useState(28);
    const [panelWidth, setPanelWidth] = useState<number | null>(null);
    const [chipBaseWidth, setChipBaseWidth] = useState<number | null>(null);
    const chipRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize panel width and remember chip's base width on mount
        if (chipRef.current) {
            const base = chipRef.current.offsetWidth;
            setChipBaseWidth(base);
            setPanelWidth(base);
        }
    }, []);

    return (
        <div
            className="relative group transition-all duration-300 isolate z-0 hover:z-50 focus-within:z-50"
            onMouseEnter={() => {
                setLinkHeight(links.length * 38 + 32);
                const base = chipBaseWidth ?? chipRef.current?.offsetWidth ?? 0;
                const contentW = measureRef.current?.offsetWidth ?? 0; // already includes padding
                const target = Math.max(base, contentW);
                setPanelWidth(target);
            }}
            onMouseLeave={() => {
                setLinkHeight(28);
                setPanelWidth(chipBaseWidth);
            }}
        >
            {/* Hidden measurement block to determine natural content width */}
            <div className="absolute opacity-0 pointer-events-none -z-10">
                <div ref={measureRef} className="rounded-[20px] p-[10px] w-fit">
                    <div className="flex flex-col gap-y-[10px] pt-[24px] items-stretch w-fit">
                        {links.map((link) => (
                            <div key={`measure-${link.label}`} className="flex items-center gap-x-[8px] h-[28px] whitespace-nowrap">
                                <GTPIcon icon={!link.icon ? ("feather:globe" as GTPIconName) : (link.icon as GTPIconName)} className="!w-[15px] !h-[15px]" containerClassName="!w-[26px] !h-[26px] flex justify-center items-center" />
                                <div className=" heading-small-xs">{link.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div
                className={`absolute top-0 left-0 overflow-hidden z-10 transition-all duration-300 bg-[#000] rounded-[20px] py-[10px]`}
                style={{
                    height: linkHeight,
                    width: panelWidth ?? undefined,
                }}
            >
                <div className="flex flex-col gap-y-[10px] w-full pt-[24px] items-stretch ">
                    {links.map((link) => (
                        <Link href={link.href} key={link.label} className="block w-full group/row ">
                            <div className="flex items-center gap-x-[8px] w-full grow-row relative h-[28px]">
                                <GTPIcon icon={!link.icon ? "feather:globe" as GTPIconName : link.icon as GTPIconName} className="!w-[15px] !h-[15px]" containerClassName="!w-[26px] pl-[5px] z-20 !h-[26px] flex justify-center items-center" />
                                <div className=" heading-small-xs min-w-fit whitespace-nowrap z-20">{link.label}</div>
                                <div className="absolute w-[98%] left-[1px] top-0 bottom-0 z-10 group-hover/row:bg-color-ui-hover  rounded-[10px]"></div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div ref={chipRef} className="flex items-center gap-x-[8px] bg-color-bg-medium transition-all duration-300 pl-[6px] pr-[15px] rounded-[20px] h-[28px] z-20 relative" style={{ width: panelWidth ?? undefined }}>
                <GTPIcon icon={"gtp-chevronright"} className="!w-[15px] !h-[15px] group-hover:rotate-90 transition-all duration-300" containerClassName="!w-[26px] !h-[26px] flex justify-center items-center z-20" />
                <div className=" heading-small-xs min-w-fit whitespace-nowrap z-20">{label}</div>
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