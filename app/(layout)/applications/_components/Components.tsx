"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/layout/Icon";
import { useUIContext } from "@/contexts/UIContext";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
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
import { useLocalStorage } from "usehooks-ts";
 
import { useSearchParamState } from "@/hooks/useSearchParamState";
import { Title, TitleButtonLink } from "@/components/layout/TextHeadingComponents";
import { OLIContractTooltip, TooltipBody, TooltipHeader } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { Badge } from "@/app/(labels)/labels/Search";
import { Chain } from "@/lib/chains";
import useSWR from "swr";
import { ApplicationsURLs } from "@/lib/urls";
import { ApplicationDetailsResponse } from "../_contexts/ApplicationDetailsDataContext";
import { SmartBackButton } from "@/components/SmartBackButton";

type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const PageMetadata = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();

  useEffect(() => {
    // update the document title
    document.title = `${ownerProjectToProjectData[owner_project]?.display_name || owner_project} Application Metrics on Ethereum Layer 2 - growthepie`;
    // update the meta description - if not found, set to general description about application metrics for this app name
    document.querySelector('meta[name="description"]')?.setAttribute("content", ownerProjectToProjectData[owner_project]?.description || "Application metrics for " + owner_project + " on Ethereum Layer 2s.");
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
    <div className={`flex items-center justify-center select-none bg-color-ui-active rounded-full ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="select-none rounded-full"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`flex items-center justify-center ${sizeClassMap[size]} bg-color-ui-active !bg-transparent rounded-full`}>
          <GTPIcon icon="gtp-project-monochrome" size={size} className="text-color-ui-hover" />
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


  if (!urlOwnerProject) return (
    <>
      <div className="flex items-center h-[43px] gap-x-[8px]">
        {/* <GTPIcon icon="gtp-project" size="lg" /> */}
        {/* <Heading className="heading-large-lg md:heading-large-xl h-[36px]" as="h1">
          Applications
        </Heading> */}
        <Title
          icon="gtp-project"
          title="Applications"
          containerClassName="flex md:w-full md:items-center md:justify-between"
          button={
            <>
              <TitleButtonLink
                label="Don’t see your app? Label here."
                icon={"oli-open-labels-initiative" as GTPIconName}
                iconSize="md"
                iconBackground="bg-transparent"
                rightIcon={"feather:arrow-right" as GTPIconName}
                href="/applications/add"
                gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                className="w-fit hidden md:block"
              />

            </>
          }
        />
      </div>
      <div className="flex items-end justify-between gap-x-[10px]">
        <div className="text-sm">
          An overview of the most used applications across the Ethereum ecosystem.
        </div>
        <div className="flex md:hidden">
          <Link
            href="/applications/add"
            className="flex !size-[36px] bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)] rounded-full justify-center items-center"
          >
            <div className="size-[34px] bg-color-bg-default rounded-full flex justify-center items-center">
              <GTPIcon icon={"oli-open-labels-initiative" as GTPIconName} size="md" />
            </div>
          </Link>
        </div>
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
            {/* <BackButton /> */}
            <SmartBackButton />
            <div className="flex-1 flex items-center min-h-[43px] gap-x-[8px]">
              <ApplicationIcon owner_project={urlOwnerProject} size="md" />
              <Heading className="heading-large-lg lg:heading-large-xl min-h-[36px] flex-1" as="h1">
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
  return (
    <span>{ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project}</span>
  )
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  return ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].description ? ownerProjectToProjectData[owner_project].description : "Description not available";
}

export const BackButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // 1. Get the current searchParams as a string (e.g., "q=test&sort=asc")
    const currentParamsString = searchParams.toString().replace(/%2C/g, ",");

    // 2. Determine the target pathname
    const targetPathname = "/applications";

    // 3. Construct the full target URL
    const targetUrl = `${targetPathname}${currentParamsString ? `?${currentParamsString}` : ''}`;

    // 4. Navigate using router.push()
    router.push(targetUrl);
  };

  return (
    <div
      className="size-[36px] rounded-full flex justify-center items-center cursor-pointer bg-color-bg-medium hover:bg-color-ui-hover"
      onClick={handleBack}

    >
      <Icon icon="feather:arrow-left" className="size-[26px] text-color-text-primary" />
    </div>
  );
};



export type MultipleSelectTopRowChildProps = {
  handleNext: () => void;
  handlePrev: () => void;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect?: (selected: string[]) => void;
  options: {
    key: string;
    icon?: string;
    name: string;
  }[];
  canSelectNone?: boolean;
};
export const MultipleSelectTopRowChild = memo(({ handleNext, handlePrev, selected, setSelected, onSelect, options, canSelectNone = false }: MultipleSelectTopRowChildProps) => {
  const isMobile = useUIContext((state) => state.isMobile);
  // const [isHovering, setIsHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Hover behavior with 300ms delay (and touch guard)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTouchStart = () => {
      isTouchRef.current = true;
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      touchTimeoutRef.current = setTimeout(() => {
        isTouchRef.current = false;
      }, 500);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const openWithDelay = () => {
    if (isTouchRef.current) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  };

  const cancelHover = () => {
    if (isTouchRef.current) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay close slightly to allow moving into the panel
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <>
      <div
        className="group flex flex-col relative lg:h-[44px] w-full lg:w-[300px]"

      >
        <div
          className={`relative flex rounded-full h-[41px] lg:h-full w-full lg:z-[15] p-[5px] cursor-pointer bg-color-bg-medium ${isMobile ? "w-full" : "w-[271px]"}`}
          onMouseEnter={openWithDelay}
          onMouseLeave={cancelHover}
        >
          <div
            className="rounded-[40px] w-[54px] h-full bg-color-bg-default flex items-center justify-center z-[12] hover:cursor-pointer"
            onClick={handlePrev}
          >
            <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="rotate-180" />
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
            className="rounded-[40px] w-[54px] h-full bg-color-bg-default flex items-center justify-center z-[12] hover:cursor-pointer"
            onClick={handleNext}

          >
            <GTPIcon icon="gtp-chevronright-monochrome" size="sm" />
          </div>
        </div>
        <div
          className={`flex flex-col relative lg:absolute lg:top-1/2 bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-color-bg-default rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${isOpen
            ? `lg:z-[14] overflow-hidden border-transparent rounded-b-[30px] border-color-bg-medium lg:rounded-b-[22px] shadow-standard`
            : "max-h-0 z-[13] overflow-hidden border-transparent rounded-b-[22px]"
            } `}
          style={{
            maxHeight: isOpen ? `${options.length * 24 + (options.length - 1) * 10 + 37 + 16}px` : "0px",
          }}
          onMouseEnter={openWithDelay}
          onMouseLeave={cancelHover}
        >
          <div className="pb-[20px] lg:pb-[16px]">
            <div className="h-[10px] lg:h-[37px]"></div>
            {options.map((opt, index) => (
              <div
                className="flex px-[25px] py-[5px] gap-x-[15px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  // setIsOpen(false);


                  const newSelected = selected.includes(opt.key) ? selected.filter((m) => m !== opt.key) : [...selected, opt.key];
                  if (newSelected.length === 0 && !canSelectNone)
                    return;

                  setSelected(newSelected);
                  onSelect && onSelect(newSelected);
                }}
                key={index}
              >
                <Icon
                  icon={selected.includes(opt.key) ? "feather:check-circle" : "feather:circle"}
                  className={`size-[15px] ${selected.includes(opt.key) ? "text-color-text-primary" : "text-color-text-secondary"}`}
                />
                {opt.icon && (
                  <GTPIcon
                    icon={(selected.includes(opt.key) ? `${opt.icon}` : `${opt.icon}-monochrome`) as GTPIconName}
                    className="size-[24px] text-color-text-secondary"
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
});

MultipleSelectTopRowChild.displayName = "MultipleSelectTopRowChild";

type SocialLink = {
  key: string;
  icon: string;
  prefix: string;
};

const SOCIAL_LINKS: SocialLink[] = [
  { key: "twitter", icon: "gtp:x", prefix: "https://x.com/" },
  { key: "main_github", icon: "gtp:github", prefix: "https://github.com/" },
  { key: "website", icon: "feather:monitor", prefix: "" },
  // { key: "discord", icon: "gtp:discord", prefix: "" }
];

interface ProjectDetailsLinksProps {
  owner_project: string;
  mobile?: boolean;
}

export const ProjectDetailsLinks = memo(({ owner_project, mobile }: ProjectDetailsLinksProps) => {
  "use client";
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const projectData = ownerProjectToProjectData[owner_project];

  if (!projectData) {
    return null;
  }

  // Filter valid links (not null or empty string)
  const validLinks = SOCIAL_LINKS.filter(link =>
    projectData[link.key] !== null && projectData[link.key] !== ""
  );

  if (mobile) {
    return (
      <div className="flex flex-col items-center justify-start gap-y-[10px]">
        {validLinks.map(({ key, icon, prefix }) => (
          <Link
            key={key}
            href={`${prefix}${projectData[key]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex !size-[36px] bg-color-bg-default rounded-full justify-center items-center"
          >
            <Icon icon={icon} className="size-[15px] select-none" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-[10px]">
      {validLinks.map(({ key, icon, prefix }) => (
        <Link
          key={key}
          href={`${prefix}${projectData[key]}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${key === "website" ? "gap-x-[6px] px-[5px] w-fit h-[54px]" : "size-[54px]"} bg-color-bg-default rounded-full flex justify-center items-center`}
        >
          {key === "website" ? (
            <>
              <ApplicationIcon owner_project={owner_project} size="md" />
              <div className="text-xxxs">Website</div>
              <div className="size-[24px] rounded-full bg-color-bg-medium flex justify-center items-center">
                <Icon icon="feather:arrow-right" className="size-[17px] text-color-text-primary" />
              </div>
            </>
          ) : (
            <Icon icon={icon} className="size-[24px] select-none" />
          )}
        </Link>
      ))}
    </div>
  );
});

ProjectDetailsLinks.displayName = "ProjectDetailsLinks";

export const ApplicationCard = memo(({ application, className, width, chainsPage, chainKey }: { application?: AggregatedDataRow, className?: string, width?: number, chainsPage?: boolean, chainKey?: string }) => {
  const { medianMetric, medianMetricKey } = useApplicationsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const router = useRouter();
  const { selectedTimespan } = useTimespan();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);


  const rank = useMemo(() => {
    if (!application) return null;

    return application[`rank_${medianMetricKey}`];

  }, [application, medianMetricKey]);

  const value = useMemo(() => {
    if (!application) return null;

    return application[medianMetricKey];
  }, [application, medianMetricKey]);



  const prefix = useMemo(() => {
    const def = metricsDef[medianMetric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, medianMetric, showUsd]);

  const decimals = useMemo(() => {
    const def = metricsDef[medianMetric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.decimals : def.eth.decimals;
    } else {
      return Object.values(def)[0].decimals;
    }
  }, [metricsDef, medianMetric, showUsd]);

  if (!application) {
    return (
      <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-color-ui-hover rounded-[15px] px-[15px] pt-[5px] pb-[10px] min-w-[340px] ${className || ""} `} style={{ width: width || undefined }}>
      </div>
    )
  }

  return (
    <Link href={{ pathname: `/applications/${application.owner_project}`, query: searchParams.toString().replace(/%2C/g, ",") }}
      className={`flex flex-col justify-between h-[140px] border-[0.5px] border-color-ui-hover rounded-[15px] px-[15px] pt-[5px] pb-[10px] ${className || ""} group hover:cursor-pointer hover:bg-forest-500/10`}
      style={{ width: width || undefined }}
    >
      <div>
        <div className="flex flex-col">
          <div className="w-full flex justify-between items-end h-[20px]">
            <div className="h-[20px] flex items-center gap-x-[3px]">
              <div className="numbers-xs text-color-text-primary">{application.num_contracts.toLocaleString("en-GB")}</div>
              <div className="text-xs text-color-text-secondary">{application.num_contracts === 1 ? 'contract' : 'contracts'}</div>
            </div>
            <div className="h-[20px] flex items-center gap-x-[3px]">
              <div className="numbers-xs text-color-text-secondary">Rank</div>
              <div className="numbers-xs text-color-text-primary">{rank}</div>
              {application[`${medianMetricKey}_change_pct`] !== Infinity ? (
                <div className={`flex justify-end w-[60px] numbers-xs ${application[`${medianMetricKey}_change_pct`] < 0 ? 'text-color-negative' : 'text-color-positive'}`}>
                  {application[`${medianMetricKey}_change_pct`] < 0 ? '-' : '+'}{formatNumber(Math.abs(application[`${medianMetricKey}_change_pct`]), { defaultDecimals: 1, thresholdDecimals: { base: 1 } })}%
                </div>
              ) : <div className="w-[49px]">&nbsp;</div>}
            </div>
          </div>
          <div className="h-[20px] w-full flex items-center justify-end gap-x-[3px]">
            <div className="numbers-sm text-color-text-primary">
              {prefix}
              {value?.toLocaleString("en-GB", { maximumFractionDigits: decimals })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="md" />
        
          <GTPTooltipNew
            size="md"
            placement="bottom-start"
            allowInteract={true}
            trigger={
              <div className="heading-large-md overflow-visible flex-1 truncate hover:underline cursor-pointer">
                <ApplicationDisplayName owner_project={application.owner_project} />
              </div>
            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
          >
            <ApplicationTooltip application={application} />
          </GTPTooltipNew>
        <div className="cursor-pointer size-[24px] bg-color-bg-medium rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-color-text-primary" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">
          <Category category={ownerProjectToProjectData[application.owner_project]?.main_category || ""} />
        </div>
        <div className="h-[20px] flex items-center gap-x-[5px]">
          {!chainsPage ? <Chains origin_keys={application.origin_keys}/> : <Chains origin_keys={application.origin_keys.filter((key) => key === chainKey)}/>}
        </div>

      </div>
    </Link>
  )
});

ApplicationCard.displayName = 'ApplicationCard';


export const ApplicationTooltip = ({ application }: { application: AggregatedDataRow }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const searchParams = useSearchParams();

  const descriptionPreview = useMemo(() => {
    if (!application || !ownerProjectToProjectData[application.owner_project]) return "";
    
    const description = ownerProjectToProjectData[application.owner_project].description;
    if(!description) return "";

    const chars = description.length;
    const firstPart = description.slice(0, Math.min(100, chars));

    return firstPart.split(" ").slice(0, -1).join(" ");

  }, [application, ownerProjectToProjectData]);

  if (!application || !ownerProjectToProjectData) return null;

  return (
    // <div
    //   className="cursor-default z-[99] p-[15px] left-[20px] w-[300px] md:w-[345px] top-[32px] bg-color-bg-default rounded-[15px] transition-opacity duration-300"
    //   style={{
    //     boxShadow: "0px 0px 30px #000000",
    //     // left: `${mouseOffsetX}px`,
    //   }}
    //   onClick={(e) => {
    //     e.stopPropagation();
    //   }}
    // >
    <TooltipBody className="pl-[15px]">
      <div className="flex flex-col pl-[5px] gap-y-[10px]">
        <Link className="flex gap-x-[5px] items-center justify-between" href={{ pathname: `/applications/${application.owner_project}`, query: searchParams.toString().replace(/%2C/g, ",") }} onClick={(e)=> e.stopPropagation}>
          <div className="flex gap-x-[5px] items-center">
            {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].logo_path ? (
              <Image
                src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[application.owner_project].logo_path}`}
                width={15} height={15}
                className="select-none rounded-full size-[15px]"
                alt={application.owner_project}
                onDragStart={(e) => e.preventDefault()}
                loading="eager"
                priority={true}
              />
            ) : (
              <div className={`flex items-center justify-center size-[15px] bg-color-ui-active rounded-full`}>
                <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[12px] text-color-ui-hover" containerClassName="flex items-center justify-center" />
              </div>
            )}
            <div className="heading-small-xs">{ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project}</div>
          </div>
          <div className="cursor-pointer size-[20px] bg-color-bg-medium rounded-full flex justify-center items-center">
            <Icon icon="feather:arrow-right" className="w-[13px] h-[13px] text-color-text-primary" />
          </div>
        </Link>
        <div className="text-xs">
          {descriptionPreview}...
        </div>
        <Links owner_project={application.owner_project} showUrl={true} />
      </div>
      </TooltipBody>
    // </div>
  )
};

ApplicationTooltip.displayName = 'ApplicationTooltip';

export const ApplicationTooltipAlt = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const searchParams = useSearchParams();

  const descriptionPreview = useMemo(() => {
    if (!ownerProjectToProjectData[owner_project] || !ownerProjectToProjectData[owner_project].description) return "";
    const chars = ownerProjectToProjectData[owner_project].description.length;
    const firstPart = ownerProjectToProjectData[owner_project].description.slice(0, Math.min(100, chars));

    return firstPart.split(" ").slice(0, -1).join(" ");

  }, [owner_project, ownerProjectToProjectData]);

  if (!ownerProjectToProjectData) return null;

  return (
    // <div
    //   className="cursor-default z-[99] p-[15px] left-[20px] w-[300px] md:w-[345px] top-[32px] bg-color-bg-default rounded-[15px] transition-opacity duration-300"
    //   style={{
    //     boxShadow: "0px 0px 30px #000000",
    //     // left: `${mouseOffsetX}px`,
    //   }}
    //   onClick={(e) => {
    //     e.stopPropagation();
    //   }}
    // >
    <TooltipBody className="pl-[15px]">
      <div className="flex flex-col pl-[5px] gap-y-[10px]">
        <Link className="flex gap-x-[5px] items-center justify-between" href={{ pathname: `/applications/${owner_project}`, query: searchParams.toString().replace(/%2C/g, ",") }} onClick={(e)=> e.stopPropagation()}>
          <div className="flex gap-x-[5px] items-center">
            {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
              <Image
                src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
                width={15} height={15}
                className="select-none rounded-full !w-[15px] !h-[15px] !object-cover"
                alt={owner_project}
                onDragStart={(e) => e.preventDefault()}
                loading="eager"
                priority={true}
                unoptimized={true}
              />
            ) : (
              <div className={`flex items-center justify-center size-[15px] bg-color-ui-active rounded-full`}>
                <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[12px] text-color-ui-hover" containerClassName="flex items-center justify-center" />
              </div>
            )}
            <div className="heading-small-xs">{ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project}</div>
          </div>
          <div className="cursor-pointer size-[20px] bg-color-bg-medium rounded-full flex justify-center items-center">
            <Icon icon="feather:arrow-right" className="w-[13px] h-[13px] text-color-text-primary" />
          </div>
        </Link>
        <div className="text-xs">
          {descriptionPreview}...
        </div>
        <Links owner_project={owner_project} showUrl={true} />
      </div>
      </TooltipBody>
    // </div>
  )
};

ApplicationTooltip.displayName = 'ApplicationTooltip';

export const TopGainersAndLosersTooltip = ({ metric, scopeLabel }: { metric: string; scopeLabel?: string }) => {
  const { metricsDef } = useMetrics();
  const { timespans, selectedTimespan } = useTimespan();
  const scopeText = scopeLabel ? ` on ${scopeLabel}` : "";
  const medianScopeText = scopeLabel ? "within this chain view" : "across all applications";
  return (
    <div
      className="w-[400px] bg-color-bg-default rounded-[15px] flex flex-col gap-y-[5px] px-[20px] py-[15px] transition-opacity duration-300 shadow-standard"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="heading-small-xs">Top Gainers</div>
      <div className="text-xs">
        This section shows applications{scopeText} that have experienced the most significant positive change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label}.
      </div>

      <div className="text-xxs">
        Calculated by comparing the change in {metricsDef[metric].name} over the last {timespans[selectedTimespan].label} to the previous {timespans[selectedTimespan].label} for each application, after filtering out applications with less than the median {metricsDef[metric].name} {medianScopeText}.
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
  const { metricsDef } = useMetrics();
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
      className="w-[238px] bg-color-bg-default rounded-[15px] flex flex-col gap-y-[5px] px-[20px] py-[15px] transition-opacity duration-300 shadow-standard"
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

export const Links = memo(({ owner_project, showUrl }: { owner_project: string, showUrl?: boolean }) => {
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

  if (!ownerProjectToProjectData[owner_project]) return null;

  if (showUrl) {
    return (
      <div className="flex flex-col gap-y-[5px] pt-[10px]">
        <div className="flex items-center gap-x-[5px]" onMouseLeave={() => setCurrentHover(defaultHoverKey)}>
          {ownerProjectToProjectData[owner_project] && keys.map((key, index) => {
            if (!ownerProjectToProjectData[owner_project][key]) return null;

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
        <div className="text-xxs text-color-ui-hover">
          {`${formatUrl(linkPrefixes[keys.indexOf(currentHoverKey)] + ownerProjectToProjectData[owner_project][currentHoverKey]).replace("https://", "")}`}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-[5px]">
      {ownerProjectToProjectData[owner_project] && keys.map((key, index) => (
        <div key={index} className="h-[15px] w-[15px]">
          {ownerProjectToProjectData[owner_project][key] && (
            <Link
              href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
              target="_blank"
              onClick={(e)=> {e.stopPropagation(); e.preventDefault()}}
            >
              <Icon
                icon={icons[index]}
                className="w-[15px] h-[15px] select-none"
              />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
});

Links.displayName = 'Links';

export const Chains = ({ origin_keys }: { origin_keys: string[] }) => {
  const { theme } = useTheme();
  const { AllChainsByKeys } = useMaster();
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const { selectedChains, setSelectedChains } = useApplicationsData();
  const [recentChains, setRecentChains] = useLocalStorage<string[]>("applications::recentlySelectedChains", []);

  // Number of chains to display initially
  const [visibleCount, setVisibleCount] = useSearchParamState<number>("maxChains", {
    defaultValue: 5,
  });

  // Update recently selected chains history when a chain is selected
  const updateSelectedChain = (chain: string, isSelected: boolean) => {
    if (isSelected) {
      // Remove chain if it already exists in the array to avoid duplicates
      const filteredRecent = recentChains.filter((c: string) => c !== chain);
      // Add the chain to the beginning of the array (most recent)
      setRecentChains([chain, ...filteredRecent]);
    }

    if (selectedChains.includes(chain)) {
      setSelectedChains(selectedChains.filter((c) => c !== chain));
    } else {
      setSelectedChains([...selectedChains, chain]);
    }
  };

  // Sort the chains so that selected chains appear first, then recent chains, then others
  const sortedOriginKeys = [...origin_keys].sort((a, b) => {
    // 1. Selected chains always come first
    if (selectedChains.includes(a) && !selectedChains.includes(b)) return -1;
    if (!selectedChains.includes(a) && selectedChains.includes(b)) return 1;

    // 2. If both are selected or both are not selected
    if (selectedChains.includes(a) === selectedChains.includes(b)) {
      // 2a. If not selected, sort by recency
      if (!selectedChains.includes(a)) {
        const aIndex = recentChains.indexOf(a);
        const bIndex = recentChains.indexOf(b);

        // If both are in recent chains, sort by recency
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // If only a is in recent chains, a comes first
        if (aIndex !== -1) return -1;
        // If only b is in recent chains, b comes first
        if (bIndex !== -1) return 1;
      }

      // 2b. Special treatment for Ethereum if not in focus mode
      if (!focusEnabled) {
        if (a === "ethereum") return -1;
        if (b === "ethereum") return 1;
      }
    }

    // 3. Maintain original order for items with same priority
    return 0;
  });

  const hiddenCount = sortedOriginKeys.length - visibleCount;

  // Create visible and hidden chains arrays
  const visibleChains = sortedOriginKeys.slice(0, visibleCount);
  const hiddenChains = sortedOriginKeys.slice(visibleCount);

  return (
    <div className="flex items-center gap-x-[5px] group/chains">
      <div className="flex items-center gap-x-[0px]">
        {visibleChains.map((chain, index) => (
          <div
            key={index}
            className={`group-hover/chains:opacity-50 hover:!opacity-100 cursor-pointer p-[2.5px] ${selectedChains.includes(chain) || selectedChains.length === 0 ? '' : '!text-color-ui-hover'}`}
            style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors[theme ?? "dark"][0] : '' }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              updateSelectedChain(chain, !selectedChains.includes(chain));
            }}
          >
            {AllChainsByKeys[chain] && (
              <Icon
                icon={`gtp:${AllChainsByKeys[chain].urlKey}-logo-monochrome`}
                className="w-[15px] h-[15px]"
              />
            )}
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <ChainsTooltip
          visibleChains={visibleChains}
          hiddenChains={hiddenChains}
          selectedChains={selectedChains}
          updateSelectedChain={updateSelectedChain}
          AllChainsByKeys={AllChainsByKeys}
        />
      )}
    </div>
  );
};

export const ChainsTooltip = ({
  visibleChains,
  hiddenChains,
  selectedChains,
  updateSelectedChain,
  AllChainsByKeys,
}: {
  visibleChains: string[];
  hiddenChains: string[];
  selectedChains: string[];
  updateSelectedChain: (chain: string, isSelected: boolean) => void;
  AllChainsByKeys: Record<string, Chain>;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  const hiddenCount = hiddenChains.length;

  // Delay the height calculation until after tooltip is open and rendered
  useEffect(() => {
    if (!isOpen) {
      setIsContentReady(false);
      return;
    }
    
    // Use a small delay to ensure the tooltip content is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        setIsContentReady(true);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [isOpen]);
  
  // Use ResizeObserver to detect size changes after initial render
  useEffect(() => {
    if (!containerRef.current || !isOpen || !isContentReady) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          // When the container size changes, update the height state
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    // Start observing the container
    resizeObserver.observe(containerRef.current);

    // Clean up on unmount or when dependencies change
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, isContentReady]);

  if (hiddenCount === 0) return null;
  
  // Calculate a safe default height before measurement
  // For smoother UX, we can estimate based on typical badge height and count
  const estimatedHeight = Math.min(
    (Math.ceil((visibleChains.length + hiddenChains.length) / 3) * 30) + 10, // Rough estimate: rows * badge height + padding
    110 // Max height limit
  );

  return (
    <GTPTooltipNew
      placement="bottom-start"
      size="sm"
      allowInteract={true}
      onOpenChange={(open) => setIsOpen(open)} // Track when tooltip opens
      trigger={
        <div
          className="h-[18px] px-[5px] py-0.5 rounded-[999px] outline outline-1 outline-offset-[-1px] outline-color-bg-medium flex justify-center items-center cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className="text-color-ui-hover text-[10px] font-medium leading-[15px] whitespace-nowrap">
            +{hiddenCount} more
          </div>
        </div>
      }
      containerClass="flex flex-col gap-y-[10px]"
      positionOffset={{ mainAxis: 5, crossAxis: 20 }}
    >
      <TooltipHeader title={`Chain Selection`} />
      <TooltipBody className="group/chains pl-[15px] flex !flex-row">
        <VerticalScrollContainer 
          height={isContentReady ? Math.min(Math.max(containerHeight, 50), 110) : estimatedHeight}
          className="w-full !h-fit !max-h-[110px]" 
          scrollThumbColor="rgb(var(--bg-default))" 
          scrollTrackColor="rgb(var(--ui-active))"
        >
          <div 
            ref={containerRef} 
            className="flex flex-row flex-wrap gap-[5px]"
          >
            {[...visibleChains, ...hiddenChains].filter((chain) => AllChainsByKeys[chain]).map((chain, index) => {
              const baseBgClass = "bg-color-bg-medium";
              const baseBorderClass = "border border-color-border";
              const hoverBgClass = "hover:bg-color-ui-hover";
              const hoverBorderClass = "hover:border hover:border-color-ui-hover";

              const baseClass = `${baseBgClass} ${baseBorderClass}`;
              const hoverClass = `${hoverBgClass} ${hoverBorderClass}`;

              const areChainsSelected = selectedChains.length > 0;
              const isChainSelected = selectedChains.includes(chain);

              const rightIcon = isChainSelected ? "gtp:in-button-close-monochrome" : undefined;
              const rightIconColor = isChainSelected ? "rgb(var(--accent-red))" : undefined;
              const altColoring = areChainsSelected && !isChainSelected;

              const leftIcon = `gtp:${AllChainsByKeys[chain].urlKey}-logo-monochrome`;
              const leftIconColor = AllChainsByKeys[chain].colors["dark"][0];

              let className = `${baseClass} ${hoverClass}`;
              if (areChainsSelected) {
                if (isChainSelected) {
                  className = `${baseClass} ${hoverClass}`;
                } else {
                  className = `${baseBorderClass} ${hoverClass}`;
                }
              }

              return (
                <Badge
                  key={chain}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    updateSelectedChain(chain, !selectedChains.includes(chain));
                  }}
                  label={AllChainsByKeys[chain].label}
                  leftIcon={leftIcon}
                  leftIconColor={leftIconColor}
                  rightIcon={rightIcon}
                  rightIconColor={rightIconColor}
                  showLabel={true}
                  altColoring={altColoring}
                  className={className}
                />
              )
            })}
          </div>
        </VerticalScrollContainer>
      </TooltipBody>
    </GTPTooltipNew>
  )
}

const getGTPCategoryIcon = (category: string): GTPIconName | "" => {
  switch (category) {
    case "Cross-Chain":
      return "gtp-crosschain";
    case "Utility":
      return "gtp-utilities";
    case "Token Transfers":
      return "gtp-tokentransfers";
    case "Finance":
      return "gtp-defi";
    case "Social":
      return "gtp-socials";
    case "Collectibles":
      return "gtp-nft";
    default:
      return "";
  }
}

const UnknownCategoryIcon = () => {
  return (
    <div className="!size-[15px] text-black/90 rounded-sm bg-color-ui-hover/50 flex justify-center items-center font-bold text-xs pt-[2px]">?</div>
  )
}

export const CategoryTooltipContent = ({ application }: { application: AggregatedDataRow }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { data: masterData } = useMaster();

  if(!masterData){
    return null;
  }

  const isMissingCategory = !ownerProjectToProjectData[application.owner_project] || ownerProjectToProjectData[application.owner_project]?.main_category === undefined;

  const Icon = isMissingCategory ? UnknownCategoryIcon : <GTPIcon icon={getGTPCategoryIcon(ownerProjectToProjectData[application.owner_project].main_category || "") as GTPIconName} size="sm" />;

  return (
    <>
      <TooltipHeader title={`Category`} icon={Icon as React.ReactNode} />
      <TooltipBody className="pl-[15px] !flex-col gap-[5px]">
      {isMissingCategory ? <div className="text-xs text-color-ui-hover">This application has not been categorized yet.</div> : (
        <>
        <div className="heading-small-xs">Subcategories</div>
        <div className="flex flex-col gap-[5px] max-h-[400px] transition-all duration-300 overflow-y-auto">
          <div className="flex flex-col gap-[5px]">
            {ownerProjectToProjectData[application.owner_project].sub_categories?.map((subcategory) => (
              <div key={subcategory} className="text-xs">{masterData.blockspace_categories.sub_categories[subcategory as keyof typeof masterData.blockspace_categories.sub_categories]}</div>
            ))}
          </div>
        </div>
        </>
      )}
      </TooltipBody>
    </>
  )
}

export const Category = ({ category }: { category: string }) => {


  return (
    <>
      {/* <GTPIcon icon={getGTPCategoryIcon()} size="sm" /> */}
      {category && category.toLocaleLowerCase() !== "unknown" ? (
        <div className="flex items-center gap-x-[5px] whitespace-nowrap">
          <GTPIcon icon={getGTPCategoryIcon(category) as GTPIconName} size="sm" />
          <div className="text-xs">{category}</div>
        </div>
      ) : (
        <div className="flex items-center gap-x-[5px] whitespace-nowrap">
          {/* <Icon icon="carbon:unknown-filled" className="size-[15px] text-color-ui-hover/50" /> */}
          <div className="size-[15px] text-black/90 rounded-sm bg-color-ui-hover/50 flex justify-center items-center font-bold text-xs pt-[2px]">?</div>
          <div className="text-xs text-color-text-secondary">Unknown</div>
        </div>
      )}
    </>
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
