"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChainInfo, MasterResponse } from "@/types/api/MasterResponse";
import { ChainData, ChainOverviewResponse, StreaksData } from "@/types/api/ChainOverviewResponse";
import { Icon } from "@iconify/react";
import { GTPIcon, GTPMaturityIcon } from "../GTPIcon";
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
import { LifetimeAchievments, StreaksAchievments } from "./OverviewCards/Achievements";
import { GTPTooltipNew, TooltipBody } from "@/components/tooltip/GTPTooltip"
import { useMediaQuery } from "usehooks-ts";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { useTheme } from "next-themes";


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

const ChainsOverview = ({ chainKey, chainData, master, chainDataOverview }: { chainKey: string, chainData: ChainInfo, master: any, chainDataOverview: ChainOverview }) => {

  const {
    data: oldMaster,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);


  const { data: streaksData } = useSWR<StreaksData>(`https://api.growthepie.xyz/v1/chains/all/streaks_today.json`);


  const isMobile = useMediaQuery("(max-width: 767px)");







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
      {oldMaster && chainDataOverview && (
        <div 
          id="content-container"
          className="@container flex flex-col w-full gap-[15px]"
        
        >
          <AboutChain chainData={chainData} master={master} chainKey={chainKey} />
          <div className="grid grid-flow-row grid-cols-1 @[995px]:grid-cols-[minmax(480px,505px)_minmax(505px,auto)] gap-[10px] items-stretch">
            <div className="flex flex-col h-full">
              <SideCards chainKey={chainKey} chainData={chainData} master={master} chainDataOverview={chainDataOverview} />
            </div>
            <div className="flex flex-col w-full gap-y-[15px] h-full min-h-0">
            
              <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] h-fit`}>
                <div className="heading-large-md">Achievements</div>
                <div className="flex justify-between flex-wrap gap-x-[30px] pt-[10px] overflow-wrap">
                <div className="flex-1 w-full md:flex-[1_1_420px] lg:flex-[1_1_460px] md:min-w-[420px] lg:min-w-[460px]">
                    <LifetimeAchievments data={chainDataOverview.data.achievements} master={oldMaster} chainKey={chainKey} />
                  </div>
                  {streaksData?.data[chainKey] && (
                    <div className="w-full xs:flex-1">
                      <StreaksAchievments data={chainDataOverview.data.achievements} master={oldMaster} streaksData={streaksData} chainKey={chainKey} />
                    </div>
                  )}

                </div>
              </div>
              <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default py-[15px] relative`}>
                <ProjectsMetadataProvider>
                  <ApplicationsGrid chainKey={chainKey} />
                </ProjectsMetadataProvider>
              </div>
              {chainDataOverview.data.blockspace.data.length > 0 ? (
                  <div className={`flex flex-col w-full rounded-[15px] bg-color-bg-default py-[15px] h-[218px] relative`}>
                    <div className="px-[30px] heading-large-md">Usage Breakdown</div>
                    <HorizontalScrollContainer enableDragScroll={true} hideScrollbar={true} paddingLeft={20} forcedMinWidth={954} paddingBottom={0} includeMargin={false}>
                      <div className="w-full min-w-[954px] pr-[20px]">
                        <RowProvider
                          value={{
                            master: oldMaster,
                            data: chainDataOverview.data.blockspace,
                            selectedMode: "txcount_share",
                            forceSelectedChain: "",
                            isCategoryHovered: isCategoryHovered,
                            selectedCategory: selectedCategory,
                            selectedChain: chainKey,
                            selectedTimespan: "max",
                            selectedValue: "share",
                            categories: categories,
                            allCats: false,
                            setSelectedChain: () => { },
                            setSelectedCategory: setSelectedCategory,
                            setAllCats: () => { },
                            hoverCategory: hoverCategory,
                            unhoverCategory: unhoverCategory,
                            includeMarginBottom: false,
                          }}
                        >
                          <SingleRowContainer />
                        </RowProvider>
                      </div>
                    </HorizontalScrollContainer>
                    <div className="flex items-center justify-end pr-[15px] w-full absolute bottom-[15px] right-[0px]">
                      <div className='w-[15px] h-fit z-30'>
                        <GTPTooltipNew
                          placement="top-end"
                          size="md"
                          allowInteract={true}
                          trigger={
                            <div
                              className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'} cursor-pointer`}
                              data-tooltip-trigger
                            >
                              <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                            </div>
                          }
                          containerClass="flex flex-col gap-y-[10px]"
                          positionOffset={{ mainAxis: 0, crossAxis: 20 }}

                        >
                          <div>
                            <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                              {"Breakdown of the chain's transactions in the last 7 days by different usage categories."}
                            </TooltipBody>
                          </div>
                        </GTPTooltipNew>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default px-[15px] py-[15px] min-h-[218px] flex-1">
                    <div className="px-[30px] heading-large-md opacity-50">Usage Breakdown</div>
                    <div className="w-full flex flex-col gap-y-[10px] items-center justify-center flex-1 inset-0 z-[2]">
                      <GTPIcon icon="gtp-lock" size="md" className="" />
                      <div className="heading-large-md">
                        Usage Breakdown Not Available
                      </div>
                      <div className="text-xs text-center px-[30px]">
                        Usage breakdown metrics are a paid add-on for each specific chain.<br/>
                        Unfortunately, this chain has not yet added usage breakdown metrics to growthepie. 
                        You can explore this feature on <Link href="/chains/ethereum?tab=blockspace" className="underline">Ethereum Mainnets</Link> page.
                        <br/><br/>
                        Interested? Let us know <Link href="https://discord.gg/fxjJFe7QyN" target="_blank" className="underline">here</Link>. 
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
          <SimilarChains chainKey={chainKey} similarChains={master.chains[chainKey].similar_chains} />
        </div>
      )}
    </>
  )
}

const CountDownCircle = ({ 
  seconds,
  size = 15,
  backgroundColor = 'rgb(var(--bg-medium))',
  textColor = 'rgb(var(--text-primary))',
  strokeWidth,
  onComplete,
  isPaused = false,
}: { 
  seconds: number;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  strokeWidth?: number;
  onComplete?: () => void;
  isPaused?: boolean;
}) => {
  const [progress, setProgress] = useState(1); // 1 = full circle, 0 = empty
  const elapsedRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Calculate proportional stroke width if not provided
  const actualStrokeWidth = strokeWidth || Math.max(1, size / 7);
  
  // Calculate dimensions based on size
  const center = size / 2;
  const radius = Math.max(1, (size - actualStrokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  useEffect(() => {
    if (isPaused || elapsedRef.current >= seconds * 1000) {
      return;
    }

    startTimeRef.current = Date.now();

    const animate = () => {
      if (isPaused) {
        return;
      }

      const now = Date.now();
      const elapsedSinceResume = startTimeRef.current ? now - startTimeRef.current : 0;
      const totalElapsed = elapsedRef.current + elapsedSinceResume;
      const newProgress = Math.max(0, 1 - (totalElapsed / (seconds * 1000)));
      
      setProgress(newProgress);
      
      if (newProgress > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (onComplete) {
        elapsedRef.current = seconds * 1000;
        animationFrameRef.current = undefined;
        onComplete();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (startTimeRef.current !== null) {
        elapsedRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
    };
  }, [seconds, onComplete, isPaused]);
  
  return (
    <svg 
      width={size} 
      height={size} 
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={actualStrokeWidth}
      />
      
      {/* Animated progress circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={textColor}
        strokeWidth={actualStrokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};



const  AboutChain = ({ chainData, master, chainKey }: { chainData: ChainInfo, master: any, chainKey: string }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const { theme } = useTheme();
  const { data: masterData } = useMaster();
  const AllChainsByKeys = useMaster().AllChainsByKeys;

  const isMobile = useMediaQuery("(max-width: 767px)");
  const twitter = socials.Twitter;


  const [timerKey, setTimerKey] = useState<number>(0);
  const handleComplete = () => {
    if (!isHovering) {
      setOpen(false);
    }
  };

  // Reset timer when open state or hover state changes
  useEffect(() => {
    if (open && !isHovering) {
      setTimerKey(prev => prev + 1);
    }
  }, [open, isHovering]);

  return (
    <div 
      className={`select-none flex flex-col w-full rounded-[15px] bg-color-bg-default py-[15px] relative`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={`absolute top-[15px] right-[30px] h-[26px] flex items-center justify-center ${isHovering || !open ? "opacity-0" : "opacity-100"} transition-[opacity] duration-300`}>
        <CountDownCircle 
          seconds={7} 
          key={timerKey}
          onComplete={handleComplete}
          isPaused={isHovering}
        />
      </div>
      <div className="flex flex-col flex-wrap lg:flex-row justify-between items-start lg:items-start @container/header gap-y-[10px]">
        <div className="flex items-center gap-x-[15px] cursor-pointer xs:pl-[30px] pl-[15px] group/aboutchain whitespace-nowrap min-w-[200px] flex-1" onClick={() => setOpen(!open)}>
          <div className="w-[26px] h-[26px] flex items-center justify-center">
          <GTPIcon 
            icon="gtp-chevronright-monochrome" size="sm" 
            className={`!size-[10.67px]`} 
            containerClassName={`!size-[26px] !flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-all duration-300 ${!open ? "rotate-0" : "rotate-90"}`}
          />
          </div>
          <div className="heading-large-md text-color-ui-hover whitespace-nowrap min-w-0 truncate">{chainData.name}</div>
        </div>
        {/* <HorizontalScrollContainer className="flex-1 pb-[15px] h-[35px] overflow-hidden"> */}
        <div className={`px-[30px] @[1155px]/header:pl-0 w-fit flex-wrap flex @[1155px]:justify-end items-center gap-[5px] sm:gap-[10px] ${!open ? "max-w-[1200px] max-h-[110px] opacity-100 transition-[opacity] duration-300  " : "max-h-0 pointer-events-none opacity-0 lg:max-w-0 lg:max-h-0"}`}>
          {master.chains[chainKey].links.website && <LinkButton icon={master.chains[chainKey].links.website ? `gtp:${master.chains[chainKey].url_key}-logo-monochrome` as GTPIconName : "gtp-bridge"} color={AllChainsByKeys[chainKey].colors[theme ?? "dark"][0]} label="Website" href={master.chains[chainKey].links.website} />}
          {Object.keys(master.chains[chainKey].links.socials).length > 0 && <LinkDropdown icon="gtp-socials" label="Socials" links={Object.keys(master.chains[chainKey].links.socials).map((social) => ({ icon: socials[social].icon, label: socials[social].name, href: master.chains[chainKey].links.socials[social] }))} />}
          {master.chains[chainKey].links.github && <LinkButton icon="ri:github-fill" label="Github" href={master.chains[chainKey].links.github} />}

          {master.chains[chainKey].links.docs && <LinkButton icon={master.chains[chainKey].links.docs ? `gtp-read` as GTPIconName : "gtp-bridge"} label="Docs" href={master.chains[chainKey].links.docs} />}
          {/* {master.chains[chainKey].links.others.Governance && <LinkButton icon={null} label="Governance" href={master.chains[chainKey].links.others.Governance} />} */}
          {Object.keys(master.chains[chainKey].links.block_explorers).length > 0 && <LinkDropdown label="Block Explorers" links={Object.keys(master.chains[chainKey].links.block_explorers).map((explorer) => ({ icon: socials[explorer]?.icon, label: explorer, href: master.chains[chainKey].links.block_explorers[explorer] }))} />}
          {Object.keys(master.chains[chainKey].links.bridges).length > 0 && <LinkDropdown label="Bridges" links={Object.keys(master.chains[chainKey].links.bridges).map((bridge) => ({ icon: socials[bridge]?.icon, label: bridge, href: master.chains[chainKey].links.bridges[bridge] }))} />}
          {Object.keys(master.chains[chainKey].links.others).length > 0 && <LinkDropdown label="Others" links={Object.keys(master.chains[chainKey].links.others).map((other) => ({ icon: socials[other]?.icon, label: other, href: master.chains[chainKey].links.others[other] }))} />}
          {/* {Object.keys(master.chains[chainKey].links.rpcs).length > 0 && <LinkDropdown label="RPCs" links={Object.keys(master.chains[chainKey].links.rpcs).map((rpc) => ({ icon: socials[rpc]?.icon, label: rpc, href: master.chains[chainKey].links.rpcs[rpc] }))} />} */}
        </div>
        {/* </HorizontalScrollContainer> */}
      </div>

      <div className="flex justify-between gap-x-[10px] transition-all duration-300 pr-[30px] xs:pl-[30px] pl-[15px]"
        style={{
          maxHeight: open ? 800 : 0,
          paddingTop: open ? "15px" : 0,
          overflow: open ? "visible" : "hidden",
          opacity: open ? 1 : 0,
          transition: "all 0.3s ease-in-out",
        }}
      >
        <div className="flex flex-col w-full gap-y-[10px]">
          <div className="text-sm">
            {chainData.description}
          </div>
          <div className="grid grid-cols-2 @[1145px]:grid-cols-8 gap-x-[10px] flex-1 h-full">
            {/* About Chain Info */}
            <div className="h-full col-span-2 @[1145px]:col-span-4 grid grid-rows-4 @[1145px]:grid-rows-3 grid-flow-col-dense auto-cols-[minmax(0,200px)] gap-x-[3px] gap-y-[8px]">
              {chainData.company && <MetricTab title="Company"><div>{chainData.company ? chainData.company : "N/A"}</div></MetricTab>}
              {chainData.stack.label && chainData.stack.label !== 'Custom' && <MetricTab title="Stack"><div>{chainData.stack.label}</div></MetricTab>}
              {chainData.bucket && <MetricTab title="Cluster"><div>{chainData.bucket}</div></MetricTab>}
              {/*  */}
              {chainData.technology && <MetricTab title="Type"><div>{chainData.technology}</div></MetricTab>}
              {chainData.raas && chainData.raas !== 'Self-hosted' && <MetricTab title="Rollup as a service"><div>{chainData.raas}</div></MetricTab>}
              {chainData.launch_date && <MetricTab title="Launch Date"><div>{chainData.launch_date ? new Date(chainData.launch_date).toLocaleDateString(undefined, { year: "numeric", month: "long", }) : "N/A"}</div></MetricTab>}
              {/* */}
              {chainData["gas_token"] && <MetricTab title="Gas Token"><div>{chainData["gas_token"]}</div></MetricTab>}
              {chainData["caip2"] && <MetricTab title="Chain ID"><div>{chainData["caip2"] ? chainData["caip2"] : "N/A"}</div></MetricTab>}
              {chainData.purpose && <MetricTab title="VM"><div>{chainData.purpose}</div></MetricTab>}
              {dataAvailToArray(chainData.da_layer).length > 0 && (
              <MetricTab title="Data Availability">
                  <div className="flex gap-x-[5px] text-[10px] leading-[150%] font-medium">
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
                        {chainData.da_layer && <div className="text-sm">{chainData.da_layer}</div>}
                      </div>
                    ))}

                  </div>
                </MetricTab>
                )}
            </div>
            {/* Data Availability */}
            <div className="h-full col-span-2 @[1145px]:mt-0 mt-[15px] @[1145px]:col-span-4 grid auto-rows-min  @[1145px]:auto-rows-auto @[1145px]:grid-cols-2  gap-[10px]">
              {/* Maturity Level */}
              <div className="h-full col-span-1 @[1145px]:col-span-1 grid grid-rows-1 grid-flow-col auto-cols-fr gap-[10px]">
                <MetricTab title="Maturity" largerGap={true}>
                  <div className="flex gap-x-[5px] ">
                    {chainData.maturity && (
                      <GTPMaturityIcon
                        maturityKey={chainData.maturity}
                        size="md"
                      />
                    )}

                    <div className="text-md leading-[24px]">{masterData?.maturity_levels[chainData.maturity]?.description}</div>
                  </div>
                </MetricTab>

              </div>
              <div className="flex flex-row flex-wrap @[1145px]:flex-row gap-[5px] max-w-[356px]">
                <MetricTab title="Links" largerGap={true}>
                  <div className="flex flex-row flex-wrap @[1145px]:flex-row gap-[5px]">

                        {master.chains[chainKey].links.website && <LinkButton icon={master.chains[chainKey].links.website ? `gtp:${master.chains[chainKey].url_key}-logo-monochrome` as GTPIconName : "gtp-bridge"} color={AllChainsByKeys[chainKey].colors[theme ?? "dark"][0]} label="Website" href={master.chains[chainKey].links.website} />}
                        {Object.keys(master.chains[chainKey].links.socials).length > 0 && <LinkDropdown icon="gtp-socials" label="Socials" links={Object.keys(master.chains[chainKey].links.socials).map((social) => ({ icon: socials[social].icon, label: socials[social].name, href: master.chains[chainKey].links.socials[social] }))} />}
                        {master.chains[chainKey].links.github && <LinkButton icon="ri:github-fill" label="Github" href={master.chains[chainKey].links.github} />}

                        {master.chains[chainKey].links.docs && <LinkButton icon={master.chains[chainKey].links.docs ? `gtp-read` as GTPIconName : "gtp-bridge"} label="Docs" href={master.chains[chainKey].links.docs} />}
                        {/* {master.chains[chainKey].links.others.Governance && <LinkButton icon={null} label="Governance" href={master.chains[chainKey].links.others.Governance} />} */}
                        {Object.keys(master.chains[chainKey].links.block_explorers).length > 0 && <LinkDropdown label="Block Explorers" links={Object.keys(master.chains[chainKey].links.block_explorers).map((explorer) => ({ icon: socials[explorer]?.icon, label: explorer, href: master.chains[chainKey].links.block_explorers[explorer] }))} />}
                        {Object.keys(master.chains[chainKey].links.bridges).length > 0 && <LinkDropdown label="Bridges" links={Object.keys(master.chains[chainKey].links.bridges).map((bridge) => ({ icon: socials[bridge]?.icon, label: bridge, href: master.chains[chainKey].links.bridges[bridge] }))} />}
                        {Object.keys(master.chains[chainKey].links.others).length > 0 && <LinkDropdown label="Others" links={Object.keys(master.chains[chainKey].links.others).map((other) => ({ icon: socials[other]?.icon, label: other, href: master.chains[chainKey].links.others[other] }))} />}
                        {/* {Object.keys(master.chains[chainKey].links.rpcs).length > 0 && <LinkDropdown label="RPCs" links={Object.keys(master.chains[chainKey].links.rpcs).map((rpc) => ({ icon: socials[rpc]?.icon, label: rpc, href: master.chains[chainKey].links.rpcs[rpc] }))} />} */}

                  </div>
                </MetricTab>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}


const SimilarChains = ({ chainKey, similarChains }: { chainKey: string, similarChains: string[] }) => {
  const { theme } = useTheme();
  const { data: masterData } = useMaster();
  const AllChainsByKeys = useMaster().AllChainsByKeys;

  const randomChains = useMemo(() => {
    // remove repeating chains and filter for "all_l2s" and chainKey and return 5 random chains
    const chains = Object.keys(AllChainsByKeys).filter((chain) => chain !== "all_l2s" && chain !== "multiple" && chain !== chainKey);
    return chains.sort(() => Math.random() - 0.5).slice(0, 5).map((chain) => AllChainsByKeys[chain]);
  }, [AllChainsByKeys, chainKey as string]);
  

  return (
    <div className="flex xs:flex-row flex-col xs:items-center xs:justify-between xs:gap-y-0 gap-y-[10px] justify-start w-full transition-all duration-300 bg-color-bg-default rounded-[15px] xs:px-[30px] px-[15px] xs:py-[15px] py-[10px]">
      <div className="flex items-center gap-x-[10px]">
        <GTPIcon icon="gtp-multiple-chains" className="text-color-ui-hover w-[24px] h-[24px] " />
        <div className="heading-large-md">Similar Chains</div>
        
      </div>
      {/* add for loop that loops 5 times  */}
      <div className="flex items-center gap-x-[10px]">
        {similarChains.map((chainKey, index) => {
          const chain = AllChainsByKeys[chainKey];
          if (!chain) return null;
          return (
            <GTPTooltipNew
              placement="top"
              size="md"
              allowInteract={true}
              containerClass="max-w-fit pl-[15px]"
              key={index + chain.urlKey}
              trigger={
                <div>
                  <Link href={`/chains/${chain.urlKey}`} key={index} className="p-[8px] flex items-center justify-center hover:bg-color-ui-hover bg-color-bg-medium rounded-full">
                    <GTPIcon icon={`gtp:${chain.urlKey}-logo-monochrome` as GTPIconName} className="!w-[28px] !h-[28px]" containerClassName="w-full h-full flex justify-center items-center !h-[28px]"
                    style={{
                      color: chain.colors[theme ?? "dark"][0],
                    }}
                    />
                  </Link>
                </div>
              }
            >
              <div className="text-sm">{chain.label}</div>
            </GTPTooltipNew>
          )
        })}
      </div>
    </div>
  )
}



const LinkButton = ({ icon, label, href, color }: { icon: string | null, label: string, href: string, color?: string }) => {


  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-x-[8px] hover:bg-color-ui-hover bg-color-bg-medium px-[15px] rounded-[20px] h-[26px] cursor-pointer"

    >
      {icon && <GTPIcon icon={icon as GTPIconName} className={`!w-[12px] !h-[12px] xs:!w-[15px] xs:!h-[15px] ${color ? `text-[${color}]` : "text-inherit"}`} containerClassName="!w-[16px] !h-[16px] flex justify-center items-center" 
      style={{
        color: color ? color : "inherit",
      }}
      />}
      <div className=" text-xs xs:text-sm">{label}</div>
    </Link>
  )
}


const LinkDropdown = ({ icon, label, links }: { icon?: string, label: string, links: { icon?: string, label: string, href: string }[] }) => {
  const [linkHeight, setLinkHeight] = useState(26);
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
    <div style={{ minWidth: chipBaseWidth ?? undefined, maxWidth: chipBaseWidth ?? undefined }}>
    <div
      className="relative group transition-all duration-300 isolate z-0 hover:z-50 focus-within:z-50 cursor-pointer"
      onMouseEnter={() => {
        setLinkHeight(links.length * 38 + 32);
        const base = chipBaseWidth ?? chipRef.current?.offsetWidth ?? 0;
        const contentW = measureRef.current?.offsetWidth ?? 0; // already includes padding
        const target = Math.max(base, contentW);
        setPanelWidth(target);
      }}
      onMouseLeave={() => {
        setLinkHeight(26);
        setPanelWidth(chipBaseWidth);
      }}
    >
      {/* Hidden measurement block to determine natural content width */}
      <div className="absolute opacity-0 pointer-events-none -z-10">
        <div ref={measureRef} className="rounded-b-[22px] p-[10px] w-fit">
          <div className="flex flex-col gap-y-[10px] w-full pt-[28px]">
            {links.map((link) => (
              <Link href={link.href} key={link.label} target="_blank" rel="noopener noreferrer" className="block w-full group/row cursor-pointer hover:bg-color-ui-hover pl-[22px] -my-[2px]">
                <div className="flex items-center gap-x-[5px] w-full grow-row relative h-[26px]">
                  <GTPIcon icon={!link.icon ? "feather:globe" as GTPIconName : link.icon as GTPIconName} size="sm" />
                  <div className="flex items-center gap-x-[10px] justify-start text-sm whitespace-nowrap">{link.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div
        className={`absolute top-0 left-0 overflow-hidden z-10 transition-all duration-300 bg-color-ui-active rounded-[22px] py-[10px] ${linkHeight === 26 ? "shadow-none" : "shadow-standard"}`}
        style={{
          height: linkHeight,
          width: panelWidth ?? undefined,
          // boxShadow: linkHeight === 26 ? "none" : "0px 0px 27px 0px var(--color-ui-shadow, #151A19)"
        }}
      >
        <div className="flex flex-col gap-y-[10px] w-full pt-[28px]">
          {links.map((link) => (
            <Link href={link.href} key={link.label} target="_blank" rel="noopener noreferrer" className="block w-full group/row cursor-pointer hover:bg-color-ui-hover pl-[22px] -my-[2px]">
              <div className="flex items-center gap-x-[5px] w-full grow-row relative h-[26px]">
                <GTPIcon icon={!link.icon ? "feather:globe" as GTPIconName : link.icon as GTPIconName} size="sm" />
                <div className="flex items-center gap-x-[10px] justify-start text-sm whitespace-nowrap">{link.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div ref={chipRef} className="flex items-center bg-color-bg-medium hover:bg-color-ui-hover transition-all gap-x-[10px] justify-between duration-300 pl-[15px] pr-[5px] rounded-[20px] h-[26px] z-20 relative" style={{ width: panelWidth ?? undefined }}>
        <div className="flex items-center gap-x-[10px]">
            {icon && <GTPIcon icon={icon as GTPIconName} className=" !w-[12px] xs:!w-[15px] !h-[12px] xs:!h-[15px]" containerClassName="!w-[16px] xs:!w-[15px] !h-[16px] xs:!h-[15px] flex justify-center items-center" />}
            <div className=" text-xs xs:text-sm min-w-fit whitespace-nowrap z-20">{label}</div>
          </div>
          <GTPIcon icon={"gtp-chevronright-monochrome"} className=" !w-[8px] xs:!w-[10.67px] !h-[8px] xs:!h-[10.67px] group-hover:rotate-90 transition-all duration-300" containerClassName="!w-[11px] !h-[11px] flex justify-center items-center z-20" />
      </div>
    </div>
    </div>
  )
}

const MetricTab = ({ title, children, largerGap = false }: { title: string; children: React.ReactNode, largerGap?: boolean }) => {
  return (
    <div className={`flex flex-col ${largerGap ? "gap-y-[10px]" : "gap-y-[2px]"}`}>
      <div className="heading-xxs text-[#5A6462] whitespace-nowrap">{title}</div>
      <div className="text-md">{children}</div>
    </div>
  )
}

export default ChainsOverview;
