"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Icon from "@/components/layout/Icon";
import { useUIContext } from "@/contexts/UIContext";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { delay } from "lodash";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import Heading from "@/components/layout/Heading";
import { usePathname } from "next/navigation";
import Search from "./Search";
import Controls from "./Controls";
import { useMaster } from "@/contexts/MasterContext";
import { AggregatedDataRow, useApplicationsData } from "../_contexts/ApplicationsDataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { useLocalStorage } from "usehooks-ts";


type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const PageTitle = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  
  useEffect(() => {
    document.title = `${ownerProjectToProjectData[owner_project]?.display_name || owner_project} - growthepie`;
  }, [ownerProjectToProjectData, owner_project]);

  return null;
}

export const ApplicationIcon = ({ owner_project, size }: ApplicationIconProps) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const sizeClassMap = {
    sm: "size-[26px]",
    md: "size-[36px]",
    lg: "size-[46px]",
  };

  // const sizePixelMap = {
  //   sm: 15,
  //   md: 24,
  //   lg: 36,
  // };

  const sizePixelMap = {
    sm: 26,
    md: 36,
    lg: 46,
  };

  return (
    <div className={`flex items-center justify-center select-none bg-[#151A19] rounded-full ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="select-none rounded-full"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`flex items-center justify-center ${sizeClassMap[size]} bg-[#151A19] !bg-transparent rounded-full`}>
          <GTPIcon icon="gtp-project-monochrome" size={size} className="text-[#5A6462]" />
        </div>
      )}
    </div>
  );
}

export const PageTitleAndDescriptionAndControls = () => {
  const pathname = usePathname();
  const [urlOwnerProject, setUrlOwnerProject] = useState<string | null>(null);
  useEffect(() => {
    // console.log(window.location.pathname.split("/")[2]);
    // setUrlOwnerProject(window.location.pathname.split("/")[2]);
    setUrlOwnerProject(pathname.split("/")[2]);
  }, [pathname]);

  const [scrollY, setScrollY] = useState(0);

  const scrollHandler = () => {
    const scrollY = window.scrollY;
    setScrollY(scrollY);
  }

  useEffect(() => {
    window.addEventListener("scroll", scrollHandler);
    return () => {
      window.removeEventListener("scroll", scrollHandler);
    }
  }, []);

  if(!urlOwnerProject) return (
    <>
      <div className="flex items-center h-[43px] gap-x-[8px]">
        <GTPIcon icon="gtp-project" size="lg" />
        <Heading className="heading-large-lg md:heading-large-xl h-[36px]" as="h1">
          Applications
           {/* {scrollY} {`${Math.min(0, -88 + scrollY)}px`} */}
        </Heading>
      </div>
      <div className="text-sm">
        An overview of the most used applications across the Ethereum ecosystem.
      </div>
      <Search />
      <Controls />
    </>
  );

  return (
    <>
      <div className="flex items-end gap-x-[10px]">
        <div className="flex flex-col flex-1 gap-y-[15px]">
          <div className="flex items-center min-h-[43px] gap-x-[8px]">
            <BackButton />
            <div className="flex-1 flex items-center min-h-[43px] gap-x-[8px]">
            <ApplicationIcon owner_project={urlOwnerProject} size="md" />
            <Heading className="heading-large-lg lg:heading-large-xl min-h-[36px]" as="h1">
              <ApplicationDisplayName owner_project={urlOwnerProject} />
            </Heading>
            </div>
          </div>
        
          <div className="flex-1 text-sm font-medium">
            <ApplicationDescription owner_project={urlOwnerProject} />
            {/* Relay is a cross-chain payment system that enables instant, low-cost bridging and transaction execution by connecting users with relayers who act on their behalf for a small fee. It aims to minimize gas costs and execution latency, making it suitable for applications like payments, bridging, NFT minting, and gas abstraction. I can add one more sentence to that and its still legible. And one more maybe so that we reach 450 characters. Let’s see.  */}
          </div>
        </div>
        <div className="hidden lg:block">
        <ProjectDetailsLinks owner_project={urlOwnerProject} />
        </div>
        <div className="block lg:hidden">
        <ProjectDetailsLinks owner_project={urlOwnerProject} mobile />
        </div>
      </div>
      {/* <Search /> */}
      <Controls />
    </>
  );
}

export const ApplicationDisplayName = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project;
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  return ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].description ? ownerProjectToProjectData[owner_project].description : "Description not available";
}

export const BackButton = () => {
  const router = useRouter();

  const handleBack = () => {
    // Check for a history entry from our app.
    // One method is to check if a scroll position was saved
    const savedScrollPos = sessionStorage.getItem('applicationsScrollPos');

    // You might also check window.history.state.idx (if available) to decide.
    if (savedScrollPos || (window.history.state && window.history.state.idx > 0)) {
      // If we know the user came from /applications,
      // use router.back() so that the browser restores the scroll position.
      router.back();
    } else {
      // Otherwise, push to /applications (scroll will be at the top)
      router.push('/applications');
    }
  };

  return (
    <div
      className="size-[36px] bg-[#344240] rounded-full flex justify-center items-center cursor-pointer"
      onClick={handleBack}
    >
      <Icon icon="feather:arrow-left" className="size-[26px] text-[#CDD8D3]" />
    </div>
  );
};

export type MultipleSelectTopRowChildProps = {
  handleNext: () => void;
  handlePrev: () => void;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect?: ( selected: string[] ) => void;
  options: {
    key: string;
    icon?: string;
    name: string;
  }[];
  canSelectNone?: boolean;
};
export const MultipleSelectTopRowChild = ({ handleNext, handlePrev, selected, setSelected, onSelect, options, canSelectNone = false}: MultipleSelectTopRowChildProps) => {
  const { isMobile } = useUIContext();
  // const [isHovering, setIsHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="group flex flex-col relative lg:h-[44px] w-full lg:w-[300px]">
        <div
          className={`relative flex rounded-full h-[41px] lg:h-full w-full lg:z-[15] p-[5px] cursor-pointer ${isMobile ? "w-full" : "w-[271px]"}`}
          style={{
            backgroundColor: "#344240",
          }}
        >
          <div
            className="rounded-[40px] w-[54px] h-full bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[12] hover:cursor-pointer"
            onClick={handlePrev}
          >
            <Icon icon="feather:arrow-left" className="w-6 h-6" />
          </div>
          <div
            className="flex flex-1 flex-col items-center justify-center  gap-y-[1px]"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            <div className={`flex font-[550] gap-x-[5px] justify-center items-center w-32`}>
              <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
                {selected.length > 1 ? "Multiple" : options.find((option) => option.key === selected[0])?.name}
              </div>
            </div>
          </div>
          <div
            className="rounded-[40px] w-[54px] h-full bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[12] hover:cursor-pointer"
            onClick={handleNext}

          >
            <Icon icon="feather:arrow-right" className="w-6 h-6" />
          </div>
        </div>
        <div
          className={`flex flex-col relative lg:absolute lg:top-1/2 bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${isOpen
              ? `lg:z-[14] overflow-hidden border-transparent rounded-b-[30px] lg:border-forest-200 lg:dark:border-forest-500 lg:rounded-b-[22px] lg:shadow-[0px_4px_46.2px_#00000066] lg:dark:shadow-[0px_4px_46.2px_#000000]`
              : "max-h-0 z-[13] overflow-hidden border-transparent rounded-b-[22px]"
            } `}
          style={{
            maxHeight: isOpen ? `${options.length * 24 + (options.length - 1) * 10 + 37 + 16}px` : "0px",
          }}
          
        >
          <div className="pb-[20px] lg:pb-[16px]">
            <div className="h-[10px] lg:h-[37px]"></div>
            {options.map((opt, index) => (
              <div
                className="flex px-[25px] py-[5px] gap-x-[15px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  setIsOpen(false);
                  

                  const newSelected = selected.includes(opt.key) ? selected.filter((m) => m !== opt.key) : [...selected, opt.key];
                  if(newSelected.length === 0 && !canSelectNone)
                    return;

                  setSelected(newSelected);
                  onSelect && onSelect(newSelected);
                }}
                key={index}
              >
                <Icon
                  icon={selected.includes(opt.key) ? "feather:check-circle" : "feather:circle"}
                  className="size-[15px]"
                />
                {opt.icon && (
                  <GTPIcon
                    icon={(selected.includes(opt.key) ? `${opt.icon}` : `${opt.icon}-monochrome`) as GTPIconName}
                    className="size-[24px] text-[#5A6462]"
                  />
                )}
                <div>{opt.name}</div>
              </div>
            ))}
          </div>
        </div>
        {isOpen && (
          <div
            className={`hidden lg:block lg:fixed inset-0 z-[3]`}
            onClick={() => {
              setIsOpen(false);
            }}
          />
        )}
      </div>
    </>
  )
}

export const ProjectDetailsLinks = memo(({ owner_project, mobile }: { owner_project: string, mobile?: boolean }) => {
  "use client";
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const linkPrefixes = ["https://x.com/", "https://github.com/", "", ""];
  const icons = ["gtp:x", "gtp:github", "feather:monitor", "gtp:discord"];
  const keys = ["twitter", "main_github", "website", "discord"];

  if(mobile) {
    return (
      <div className="flex flex-col items-center justify-start gap-y-[10px]">
        {ownerProjectToProjectData[owner_project] && keys.filter(
          (key) => ownerProjectToProjectData[owner_project][key]
        ).map((key, index) => (
          <Link
            key={key}
              href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
              target="_blank"
              className={`flex !size-[36px] bg-[#1F2726] rounded-full justify-center items-center ${key=== "website" && "gap-x-[6px] px-[5px] w-fit"}`}
            >
              {<Icon icon={icons[index]} className="size-[15px] select-none" />}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-[10px]">
      {ownerProjectToProjectData[owner_project] && keys.filter(
        (key) => ownerProjectToProjectData[owner_project][key]
      ).map((key, index) => (
        <Link
          key={key}
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
            className={`size-[54px] bg-[#1F2726] rounded-full flex justify-center items-center ${key=== "website" && "gap-x-[6px] px-[5px] w-fit"}`}
          >
            {key === "website" ? (
              <>
                {ownerProjectToProjectData[owner_project] && (
                  <ApplicationIcon owner_project={owner_project} size="md" />
                )}
                <div className="text-xxxs">Website</div>
                <div className="size-[24px] rounded-full bg-[#344240] flex justify-center items-center">
                  <Icon icon="feather:arrow-right" className="size-[17px] text-[#CDD8D3]" />
                </div>
              </>
            ) : (
            <Icon
              icon={icons[index]}
              className="size-[24px] select-none"
            />
            
        )}
        </Link>
      ))}
    </div>
  );
});

ProjectDetailsLinks.displayName = 'Links';

export const ApplicationCard = memo(({ application, className, width, metric }: { application?: AggregatedDataRow, className?: string, width?: number, metric: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const router = useRouter();
  const { selectedTimespan } = useTimespan();

  const metricKey = useMemo(() => {
    let key = metric;
    if (metric === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [metric, showUsd]);

  const rank = useMemo(() => {
    if (!application) return null;

    return application[`rank_${metricKey}`];

  }, [application, metricKey]);

  const value = useMemo(() => {
    if (!application) return null;

    return application[metricKey];
  }, [application, metricKey]);

  const prefix = useMemo(() => {
    const def = metricsDef[metric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, metric, showUsd]);

  const decimals = useMemo(() => {
    const def = metricsDef[metric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.decimals : def.eth.decimals;
    } else {
      return Object.values(def)[0].decimals;
    }
  }, [metricsDef, metric, showUsd]);

  if (!application) {
    return (
      <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] min-w-[340px] ${className || ""} `} style={{ width: width || undefined }}>
      </div>
    )
  }

  return (
    <Link href={{ pathname: `/applications/${application.owner_project}`, query: { timespan: selectedTimespan } }}
      className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] ${className || ""} group hover:cursor-pointer hover:bg-forest-500/10`} 
      style={{ width: width || undefined }}
      // onClick={() => {
      //   // window.location.href = `/applications/${application.owner_project}`;
      //   router.push(`/applications/${application.owner_project}`);
      // }}
    >
      <div>
        <div className="flex flex-col">
        <div className="w-full flex justify-between items-end h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#CDD8D3]">{application.num_contracts.toLocaleString("en-GB")}</div>
            <div className="text-xs text-[#5A6462]">{application.num_contracts === 1 ? 'contract' : 'contracts'}</div>
          </div>
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-[#CDD8D3]">{rank}</div>
            {application[`${metricKey}_change_pct`] !== Infinity ? (
              <div className={`flex justify-end w-[60px] numbers-xs ${application[`${metricKey}_change_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
                {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{formatNumber(Math.abs(application[`${metricKey}_change_pct`]), {defaultDecimals: 1, thresholdDecimals: {base: 1}})}%
              </div>
            ) : <div className="w-[49px]">&nbsp;</div>}
          </div>
        </div>
        <div className="h-[20px] w-full flex items-center justify-end gap-x-[3px]">
          <div className="numbers-sm text-[#CDD8D3]">
            {prefix}
            {value?.toLocaleString("en-GB", { maximumFractionDigits: decimals })}
          </div>
        </div>
        </div>
        {/* <div className="w-full h-[20px] flex justify-between items-center">
          <div className="flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#CDD8D3]">{numContractsString(application)}</div>
            <div className="text-xs text-[#5A6462]">contracts</div>
          </div>
          <div className="flex items-end gap-x-[3px]">
            <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-[#CDD8D3]">{rank}</div>
          </div>
        </div> */}

        {/* <div className="w-full flex justify-between items-start">
          <div/>
          <div className="flex flex-col items-end gap-y-[2px]">
            <div className="flex flex-col items-end justify-start gap-y-[3px]">
              <div className="flex justify-end numbers-sm text-[#CDD8D3] w-[100px]">
                {prefix}
                {value?.toLocaleString("en-GB")}
              </div>
              <div className="flex items-end gap-x-[3px]">
                {application[`${metricKey}_change_pct`] !== Infinity ? (
                  <div className={`h-[3px] flex justify-end w-[45px] numbers-xxxs ${application[`${metricKey}_change_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
                    {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{Math.abs(application[`${metricKey}_change_pct`]).toLocaleString("en-GB",{maximumFractionDigits:0})}%
                  </div>
                ) : (
                  <div className="w-[49px]">&nbsp;</div>
                )}
            </div>
            </div>
          </div>
        </div> */}
      </div>
      
      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="md" />
        {/* {ownerProjectToProjectData[application.owner_project] ? (
          <div className="heading-large-md flex-1 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        ) : (
          <div className="heading-large-md flex-1 opacity-60 group-hover:underline"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        )} */}
        <div className="heading-large-md flex-1 overflow-visible truncate">
          {/* <div className="relative group/tooltip heading-large-md w-fit group-hover:underline min-h-[32px] flex flex-col justify-center overflow-visible">
          <ApplicationDisplayName owner_project={application.owner_project} />
          <ApplicationTooltip application={application} />
          </div> */}
          <Tooltip placement="bottom-start" allowInteract>
            <TooltipTrigger className="group-hover:underline ">
              <ApplicationDisplayName owner_project={application.owner_project} />
            </TooltipTrigger>
            <TooltipContent className="z-[99] left-0 ml-[20px]">
              <ApplicationTooltip application={application} />
            </TooltipContent>
          </Tooltip>
        </div>
        <Link className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={{ pathname: `/applications/${application.owner_project}`, query: { timespan: selectedTimespan } }}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">
          <Category category={ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : ""} />
        </div>
        <div className="h-[20px] flex items-center gap-x-[5px]">
          {/* {application.origin_keys.map((chain, index) => (
            <div
              key={index}
              className={`cursor-pointer ${selectedChains.includes(chain) ? '' : '!text-[#5A6462]'} hover:!text-inherit`} style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors["dark"][0] : '' }}
              onClick={() => {
                if (selectedChains.includes(chain)) {
                  setSelectedChains(selectedChains.filter((c) => c !== chain));
                } else {
                  setSelectedChains([...selectedChains, chain]);
                }
              }}
            >
              {AllChainsByKeys[chain] && (
                <Icon
                  icon={`gtp:${AllChainsByKeys[
                    chain
                  ].urlKey
                    }-logo-monochrome`}
                  className="w-[15px] h-[15px]"
                  style={{
                    color: AllChainsByKeys[chain].colors["dark"][0],
                  }}
                />
              )}
            </div>
          ))} */}
          <Chains origin_keys={application.origin_keys} />
        </div>
        
      </div>
    </Link>
  )
});

ApplicationCard.displayName = 'ApplicationCard';


export const ApplicationTooltip = memo(({application}: {application: AggregatedDataRow}) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated } = useApplicationsData();

  const descriptionPreview = useMemo(() => {
    if (!application || !ownerProjectToProjectData[application.owner_project] || !ownerProjectToProjectData[application.owner_project].description) return "";
    const chars = ownerProjectToProjectData[application.owner_project].description.length;
    const firstPart = ownerProjectToProjectData[application.owner_project].description.slice(0, Math.min(100, chars));

    return firstPart.split(" ").slice(0, -1).join(" ");
    
  }, [application, ownerProjectToProjectData]);  

  if(!application || !ownerProjectToProjectData) return null;

  return (
    <div
      className="cursor-default z-[99] p-[15px] left-[20px] w-[345px] top-[32px] bg-[#1F2726] rounded-[15px] transition-opacity duration-300"
      style={{
        boxShadow: "0px 0px 30px #000000",
        // left: `${mouseOffsetX}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex flex-col pl-[5px] gap-y-[10px]">
        {/* {mouseOffsetX} */}
        <div className="flex gap-x-[5px] items-center">
          {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].logo_path ? (
            <Image
              src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[application.owner_project].logo_path}`}
              width={15} height={15}
              className="select-none rounded-full size-[15px]"
              alt={application.owner_project}
              onDragStart={(e) => e.preventDefault()}
              loading="eager"
              priority={true}
            />
          ) : (
            <div className={`flex items-center justify-center size-[15px] bg-[#151A19] rounded-full`}>
              <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[12px] text-[#5A6462]" containerClassName="flex items-center justify-center" />
            </div>
          )}
          <div className="heading-small-xs">{ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project}</div>
        </div>
        <div className="text-xs">
          {descriptionPreview}...
        </div>
          <Links owner_project={application.owner_project} showUrl={true} />
      </div>

    </div>
  )
});

ApplicationTooltip.displayName = 'ApplicationTooltip';

export const TopGainersAndLosersTooltip = ({ metric }: { metric: string }) => {
  const {metricsDef} = useMetrics();
  const { timespans, selectedTimespan} = useTimespan();
  return (
    <div
      className="w-[400px] bg-[#1F2726] rounded-[15px] flex flex-col gap-y-[5px] px-[20px] py-[15px] transition-opacity duration-300"
      style={{
        boxShadow: "0px 0px 30px #000000",
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="heading-small-xs">Top Gainers and Losers</div>
      <div className="text-xs">
        This section shows applications that have experienced the most significant change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label}:
      </div>
      <div className="text-xs">
        <ul className="list-disc list-inside">
          <li>3 &quot;Top Gainers&quot;</li>
          <li>3 &quot;Top Losers&quot;</li>
        </ul>
      </div>

      <div className="text-xxs">
      This is calculated by comparing the change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label} to the previous {timespans[selectedTimespan].label} for each application, after filtering out applications with less than the median {metricsDef[metric].name} across all applications.
      </div>

        {/* that have experienced the most significant change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label}.
        </div>
        <div className="text-xs">
           This is calculated by comparing the change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label} to the previous {timespans[selectedTimespan].label} after filtering out applications with less than the median {metricsDef[metric].name} value.
        </div> */}
    </div>
  );
}

export const MetricTooltip = ({ metric }: { metric: string }) => {
  const {metricsDef} = useMetrics();
  const content = {
    gas_fees: {
      title: metricsDef["gas_fees"].name,
      content: "The total gas fees paid by users who interacted with contracts associated with this application within the selected timeframe and across the selected chains.",
    },
    txcount: {
      title: metricsDef["txcount"].name,
      content: "The total number of transactions in the selected timeframe across the selected chains.",
    },
    daa: {
      title: metricsDef["daa"].name,
      content: "The total number of unique addresses that interacted with the contracts in the selected timeframe across the selected chains.",
    },
  }


  return (
    <div
      className="w-[238px] bg-[#1F2726] rounded-[15px] flex flex-col gap-y-[5px] px-[20px] py-[15px] transition-opacity duration-300"
      style={{
        boxShadow: "0px 0px 30px #000000",
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="heading-small-xs">{content[metric].title}</div>
      <div className="text-xs">
        {content[metric].content}
      </div>
    </div>
  );
}

export const Links = memo(({ owner_project, showUrl}: { owner_project: string, showUrl?: boolean }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const linkPrefixes = ["", "https://x.com/", "https://github.com/"];
  const icons = ["feather:monitor", "ri:twitter-x-fill", "ri:github-fill"];
  const keys = ["website", "twitter", "main_github"];
  
  // default hover key should be the first link that is not empty
  const defaultHoverKey = useMemo(() => {
    if (!ownerProjectToProjectData[owner_project]) return "website";
    return keys.find((key) => ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project][key]) || "website";
  }, [ownerProjectToProjectData, owner_project]);

  const [currentHoverKey, setCurrentHover] = useState(defaultHoverKey);

  const formatUrl = (url: string) => {
    // remove https:// and trailing slash
    return url.replace("https://", "").replace(/\/$/, "");
  }

  if(!ownerProjectToProjectData[owner_project]) return null;
  
  if(showUrl) {
    return (
    <div className="flex flex-col gap-y-[5px] pt-[10px]">
      <div className="flex items-center gap-x-[5px]" onMouseLeave={() => setCurrentHover(defaultHoverKey)}>
      {ownerProjectToProjectData[owner_project] && keys.map((key, index) => {
        if(!ownerProjectToProjectData[owner_project][key]) return null;

        return (
        <div key={index} className="h-[15px] w-[15px]" onMouseEnter={() => setCurrentHover(key)}>
          {ownerProjectToProjectData[owner_project][key] && <Link
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
          >
            <Icon
              icon={icons[index]}
              className="w-[15px] h-[15px] select-none"
            />
          </Link>}
        </div>
        )
      })}
      </div>
      <div className="text-xxs text-[#5A6462]">
        {`${formatUrl(linkPrefixes[keys.indexOf(currentHoverKey)]+ownerProjectToProjectData[owner_project][currentHoverKey]).replace("https://", "")}`}
      </div>
    </div>
    );
  }

  return (
    <div className="flex items-center gap-x-[5px]">
      {ownerProjectToProjectData[owner_project] && keys.map((key, index) => (
        <div key={index} className="h-[15px] w-[15px]">
          {ownerProjectToProjectData[owner_project][key] && <Link
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
          >
            <Icon
              icon={icons[index]}
              className="w-[15px] h-[15px] select-none"
            />
          </Link>}
        </div>
      ))}
    </div>
  );
});

Links.displayName = 'Links';

export const Chains = ({ origin_keys }: { origin_keys: string[] }) => {
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, setSelectedChains } = useApplicationsData();

  return (
    <div className="flex items-center gap-x-[0px] group/chains">
      {origin_keys.map((chain, index) => (
        <div
          key={index}
          className={`group-hover/chains:opacity-50 hover:!opacity-100 cursor-pointer p-[2.5px] ${selectedChains.includes(chain) || selectedChains.length === 0 ? '' : '!text-[#5A6462]'}`} style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors["dark"][0] : '' }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (selectedChains.includes(chain)) {
              setSelectedChains(selectedChains.filter((c) => c !== chain));
            } else {
              setSelectedChains([...selectedChains, chain]);
            }
          }}
        >
          {AllChainsByKeys[chain] && (
            // <GridTableChainIcon origin_key={AllChainsByKeys[chain].key} color={AllChainsByKeys[chain].colors["dark"][0]} />
            <Icon
              icon={`gtp:${AllChainsByKeys[
                chain
              ].urlKey
                }-logo-monochrome`}
              className="w-[15px] h-[15px]"
            />
          )}
        </div>
      ))}
      {/* <div className="rounded-full w-[47px] border border-[#344240] flex items-center justify-center">
        more

      </div> */}
    </div>
  );
};

export const Category = ({ category }: { category: string }) => {
  const getGTPCategoryIcon = (category: string): GTPIconName | "" => {

    switch (category) {
      case "Cross-Chain":
        return "gtp-crosschain";
      case "Utility":
        return "gtp-utilities";
      case "Token Transfers":
        return "gtp-tokentransfers";
      case "DeFi":
        return "gtp-defi";
      case "Social":
        return "gtp-socials";
      case "NFT":
        return "gtp-nft";
      case "CeFi":
        return "gtp-cefi";
      default:
        return "";
    }
  }

  return (
    <div className="flex items-center gap-x-[5px] whitespace-nowrap">
      {/* <GTPIcon icon={getGTPCategoryIcon()} size="sm" /> */}
      {category && (
        <>
          <GTPIcon icon={getGTPCategoryIcon(category) as GTPIconName} size="sm" />
          {category}
        </>
      )}
    </div>
  );
}

interface ThresholdConfig {
  value: number;
  suffix: string;
  decimals?: number;
}

interface FormatNumberOptions {
  defaultDecimals?: number;
  thresholdDecimals?: {
    [key: string]: number;  // 'T', 'B', 'M', 'k', or 'base' for numbers < 1000
  };
}

export function formatNumber(
  number: number, 
  options: FormatNumberOptions = {}
): string {
  // Handle special cases
  if (!Number.isFinite(number)) return 'N/A';
  if (number === 0) return '0';

  const defaultDecimals = options.defaultDecimals ?? 2;
  
  // Define formatting thresholds
  const thresholds: ThresholdConfig[] = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'k' }
  ];
  
  const absNumber = Math.abs(number);
  
  // Find the appropriate threshold
  const threshold = thresholds.find(t => absNumber >= t.value);
  
  if (threshold) {
    const scaledNumber = number / threshold.value;
    const decimals = options.thresholdDecimals?.[threshold.suffix] ?? defaultDecimals;
    return scaledNumber.toFixed(decimals) + threshold.suffix;
  }
  
  // For numbers less than 1000
  const baseDecimals = options.thresholdDecimals?.['base'] ?? defaultDecimals;
  return number.toFixed(baseDecimals);
}