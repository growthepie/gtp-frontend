"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "../Search";
import Controls from "../Controls";
import { AggregatedDataRow, useApplicationsData } from "../ApplicationsDataContext";
import { MetricDef, useMetrics } from "../MetricsContext";
import { ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GridTableChainIcon } from "@/components/layout/GridTable";
import { useMaster } from "@/contexts/MasterContext";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
  GridTableContainer,
} from "@/components/layout/GridTable";
import { GTPIconName } from "@/icons/gtp-icon-names";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { formatNumber } from "@/lib/chartUtils";
import { useLocalStorage } from "usehooks-ts";
import { Virtuoso } from "react-virtuoso";
import { set } from "lodash";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import { ApplicationDisplayName, ApplicationIcon } from "../Components";
import { useUIContext } from "@/contexts/UIContext";
import { useProjectsMetadata } from "../ProjectsMetadataContext";
import { useSort } from "../SortContext";

export default function Page() {
  const { applicationDataAggregated, isLoading } = useApplicationsData();
  const { selectedMetrics } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const { topGainers, topLosers } = useMemo(() => {
    let medianMetricKey = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      medianMetricKey = "gas_fees_eth";

    const medianMetricValues = applicationDataAggregated.map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);

    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];

    console.log("medianMetricKey", medianMetricKey);
    console.log("medianValue", medianValue);
    console.log("applicationDataAggregated", applicationDataAggregated);

    // filter out applications with < median value of selected metric and with previous value of 0
    const filteredApplications = applicationDataAggregated
      .filter((application) => application[medianMetricKey] > medianValue && application["prev_" + medianMetricKey] > 0);
    console.log("filteredApplications", filteredApplications);

    // top 3 applications with highest change_pct
    return {
      topGainers: [...filteredApplications]
        .sort((a, b) => b[medianMetricKey + "_change_pct"] - a[medianMetricKey + "_change_pct"])
        .slice(0, 3),
      topLosers: [...filteredApplications]
        .sort((a, b) => a[medianMetricKey + "_change_pct"] - b[medianMetricKey + "_change_pct"])
        .slice(0, 3),
    }
  }, [applicationDataAggregated, selectedMetrics]);

  return (
    <>
      <Container className="pt-[30px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Gainers and Losers</div>
          <div className="text-xs">
            Projects that saw the biggest change in the selected timeframe.
          </div>
        </div>
      </Container>
      <Container className="hidden md:grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]">
        {topGainers.map((application, index) => (
          <ApplicationCard key={application.owner_project} application={application} />
        ))}
        {topLosers.map((application, index) => (
          <ApplicationCard key={application.owner_project} application={application} />
        ))}
        {isLoading && new Array(6).fill(0).map((_, index) => (
          <ApplicationCard key={index} application={undefined} />
        ))}
      </Container>
      {/* <Container> */}
      <div className="block md:hidden pt-[10px]">
        <CardSwiper cards={[...topGainers.map((application) => <ApplicationCard key={application.owner_project} application={application} />), ...topLosers.map((application) => <ApplicationCard key={application.owner_project} application={application} />)]} />
        </div>
      {/* </Container> */}
      {/* {applicationDataAggregated.length > 0 && <ApplicationCardSwiper />} */}
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Ranked (Gas Fees USD)</div>
          <div className="text-xs">
            Applications ranked by your selected metric and applied chain filter. Note that currently you apply a chain filter.
          </div>
        </div>
      </Container>
      {/* <HorizontalScrollContainer reduceLeftMask={true}> */}
      <div className="h-[800px]">
      <ApplicationsTable />
      </div>
      {/* </HorizontalScrollContainer> */}
    </>
  )
}

const CardSwiper = ({ cards }: { cards: React.ReactNode[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (containerRef.current) {
      // get the container’s bounding rect to compute center
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      const children = Array.from(containerRef.current.children);
      let closestIndex = 0;
      let closestDistance = Infinity;

      children.forEach((child, index) => {
        const rect = child.getBoundingClientRect();
        // Calculate the center of each card
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);

    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    // Run once on mount to set the active index correctly.
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-scroll scroll-smooth snap-x snap-mandatory touch-pan-x scrollbar-none px-[20px] -space-x-[calc(100vw/10)] touch-none"
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className={`snap-center transition-[transform,opacity] duration-300 ease-in-out ${
            index === activeIndex ? "scale-100 opacity-100" : "scale-[0.75] opacity-50"
          }`}
          style={{ 
            minWidth: "calc(100vw - 40px)",
          }}
        >
          {card}
        </div>
      ))}
    </div>
  );
};

const ApplicationCardSwiper = () => {
  const { applicationDataAggregated } = useApplicationsData();
  const [cardWidth, setCardWidth] = useState(340);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate visible applications
  const visibleApplications = useMemo(() => {
    return [...applicationDataAggregated.slice(0, 3), ...applicationDataAggregated.slice(-3)];
  }, [applicationDataAggregated]);

  // Dragging state
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStartX(e.screenX);
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setDragging(false);
  };

  // Handle mouse move event
  const handleMouseMove = (e: MouseEvent) => {
    if (dragging && containerRef.current) {
      const dx = e.screenX - dragStartX;
      const newScrollLeft = scrollLeft - dx;
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;

      // Ensure scrollLeft stays within bounds
      const boundedScrollLeft = Math.max(0, Math.min(maxScroll, newScrollLeft));

      // Update scroll position
      containerRef.current.scrollLeft = boundedScrollLeft;
      setScrollLeft(boundedScrollLeft);
      setDragStartX(e.screenX);
    }
  };

  useEffect(() => {
    // Update container width on resize
    const updateContainerWidth = () => {
      setCardWidth(window.innerWidth - 40);
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);

    // Add global event listeners
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragging, dragStartX, scrollLeft]); // Add dependencies

  useEffect(() => {
    setCardWidth(window.innerWidth - 40);
  }, []);


  return (
    <div
      ref={containerRef}
      className="pt-[10px] flex md:hidden flex-nowrap select-none relative overflow-scroll scrollbar-none pl-[30px] pr-[10px]"
      // onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      onMouseDown={handleMouseDown}
      onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}


    >
      {visibleApplications.map((application, index) => {
        // Calculate scaling and translation to give a carousel effect
        const distance = (index * cardWidth) - scrollLeft;
        const scaleX = 0.85 + 0.15 * (1 - Math.abs(distance) / containerWidth);
        const scaleY = 0.85 + 0.15 * (1 - Math.abs(distance) / containerWidth);

        return (
          <div
            key={index}
            className="relative"
            style={{
              overflow: 'visible',
              width: `${cardWidth + 10}px`,
              paddingRight: '20px',
              marginLeft: '-20px',
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'center'
            }}
          >
            <ApplicationCard application={application} className="" width={cardWidth} />
          </div>
        );
      })}
    </div>
  );
};


const ApplicationCard = ({ application, className, width }: { application?: AggregatedDataRow, className?: string, width?: number }) => {
  const { AllChainsByKeys } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedChains, setSelectedChains, } = useApplicationsData();
  const { selectedMetrics, metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const numContractsString = useCallback((application: AggregatedDataRow) => {
    return application.num_contracts.toLocaleString("en-GB");
  }, []);


  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  const rank = useMemo(() => {
    if (!application) return null;

    return application[`rank_${metricKey}`];

  }, [application, metricKey]);

  const value = useMemo(() => {
    if (!application) return null;

    return application[metricKey];
  }, [application, metricKey]);

  const prefix = useMemo(() => {
    const def = metricsDef[selectedMetrics[0]].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, selectedMetrics, showUsd]);

  if (!application) {
    return (
      <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] min-w-[340px] ${className || ""} transition-all duration-300`} style={{ width: width || undefined }}>
      </div>
    )
  }

  return (
    <div className={`flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px] ${className || ""} transition-all duration-300`} style={{ width: width || undefined }}>
      <div>
        <div className="w-full flex justify-between items-end h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#CDD8D3]">{numContractsString(application)}</div>
            <div className="text-xs text-[#5A6462]">contracts</div>
          </div>
          <div className="h-[20px] flex items-end gap-x-[3px]">
            <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-[#CDD8D3]">{rank}</div>
            {application[`${metricKey}_change_pct`] !== Infinity ? (
              <div className={`flex justify-end w-[49px] numbers-xs ${application[`${metricKey}_change_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
                {application[`${metricKey}_change_pct`] < 0 ? '-' : '+'}{Math.abs(application[`${metricKey}_change_pct`]).toFixed(0)}%
              </div>
            ) : <div className="w-[49px]">&nbsp;</div>}
          </div>

        </div>
        <div className="w-full flex justify-between items-center h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[5px]">
            {/* {JSON.stringify( application)} */}
            {application.origin_keys.map((chain, index) => (
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
                  />
                )}
              </div>
            ))}
          </div>
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-sm text-[#CDD8D3]">
              {prefix}
              {value.toLocaleString("en-GB")}


            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center gap-x-[5px]">
        <ApplicationIcon owner_project={application.owner_project} size="lg" />
        {ownerProjectToProjectData[application.owner_project] ? (
          <div className="heading-large-md flex-1"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        ) : (
          <div className="heading-large-md flex-1 opacity-60"><ApplicationDisplayName owner_project={application.owner_project} /></div>
        )}
        <Link className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${application.owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">{ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].main_category}</div>
        {/* <div className="flex items-center gap-x-[5px]">
          {getLinks(application).map((item, index) => (
            <div key={index} className="h-[15px] w-[15px]">
              {item.link && <Link
                href={item.link.includes("http") ? item.link : `https://${item.link}`}
                target="_blank"
              >
                <Icon
                  icon={item.icon}
                  className="w-[15px] h-[15px] select-none"
                />
              </Link>}
            </div>
          ))}
        </div> */}
        <Links application={application} />
      </div>
    </div>
  )
}

const Links = memo(({ application }: { application: AggregatedDataRow }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const linkPrefixes = ["", "https://x.com/", "https://github.com/"];
  const icons = ["feather:monitor", "ri:twitter-x-fill", "ri:github-fill"];
  const keys = ["website", "twitter", "main_github"];

  return (
    <div className="flex items-center gap-x-[5px]">
      {ownerProjectToProjectData[application.owner_project] && keys.map((key, index) => (
        <div key={index} className="h-[15px] w-[15px]">
          {ownerProjectToProjectData[application.owner_project][key] && <Link
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[application.owner_project][key]}`}
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

const ApplicationsTable = () => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated} = useApplicationsData();
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);


  const maxMetrics = useMemo(() => {
    return selectedMetricKeys.map((metric) => {
      return applicationDataAggregated.reduce((acc, application) => {
        return Math.max(acc, application[metric]);
      }, 0);
    });
  }, [applicationDataAggregated, selectedMetricKeys]);


  const rowData = useMemo(() => {
    return applicationDataAggregated.map((application) => {
      return {
        logo_path: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].logo_path : "",
        owner_project: application.owner_project,
        display_name: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].display_name : application.owner_project,
        origin_keys: application.origin_keys,
        category: ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : "",
        num_contracts: application.num_contracts,
        gas_fees: application[metricKey],
        gas_fees_eth: application.gas_fees_eth,
        gas_fees_usd: application.gas_fees_usd,
        gas_fees_change_pct: application[metricKey + "_change_pct"],
        rank_gas_fees: application[`rank_${metricKey}`],


      };
    });
  }, [applicationDataAggregated, metricKey, ownerProjectToProjectData]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 313px 199px minmax(135px,800px) 95px ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );


  return (
    <HorizontalScrollContainer reduceLeftMask={true}>
      <GridTableHeader
        gridDefinitionColumns={gridColumns}
        className="group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px]"
        style={{
          gridTemplateColumns: gridColumns,
        }}
      >
        <div />
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs pl-[0px]"
        >
          Application
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs"
        >
          Chains
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs"
        >
          <div className="flex items-center gap-x-[5px]">
            <GTPIcon icon="gtp-categories" size="sm" />
            Category
          </div>
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs"
          justify="end"
        >
          # Contracts
        </GridTableHeaderCell>
        {selectedMetrics.map((metric, index) => {
          // let key = selectedMetricKeys[index];
          return (
            <GridTableHeaderCell
              key={metric}
              metric={metric}
              className="heading-small-xs pl-[25px] pr-[15px] z-[0] whitespace-nowrap"
              justify="end"
              sort={sort}
              setSort={setSort}
              extraRight={
                <div className="flex items-center gap-x-[5px] pl-[5px] cursor-default z-[10]">
                  <div
                    className="cursor-pointer flex items-center rounded-full bg-[#344240] text-[#CDD8D3] gap-x-[2px] px-[5px] h-[18px]"
                    onClick={() => {
                      setSort({
                        metric: `${selectedMetricKeys[index]}_change_pct`, //"gas_fees_change_pct",
                        sortOrder:
                          sort.metric === `${selectedMetricKeys[index]}_change_pct`
                            ? sort.sortOrder === "asc"
                              ? "desc"
                              : "asc"
                            : "desc",
                      });
                    }}
                  >
                    <div className="text-xxxs !leading-[14px]">Change</div>
                    {/* <Icon icon="feather:arrow-down" className="w-[10px] h-[10px]" /> */}
                    <Icon
                      icon={
                        sort.metric === `${selectedMetricKeys[index]}_change_pct` && sort.sortOrder === "asc"
                          ? "feather:arrow-up"
                          : "feather:arrow-down"
                      }
                      className="w-[10px] h-[10px]"
                      style={{
                        opacity: sort.metric === `${selectedMetricKeys[index]}_change_pct` ? 1 : 0.2,
                      }}
                    />
                  </div>
                  <Tooltip placement="bottom">
                    <TooltipTrigger>
                      <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                    </TooltipTrigger>
                    <TooltipContent className="z-[99]">
                      <MetricTooltip metric={metric} />
                    </TooltipContent>
                  </Tooltip>
                </div>
              }
            >
              {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
            </GridTableHeaderCell>
          )
        })}
        <div />
      </GridTableHeader>
      <div className="flex flex-col gap-y-[5px]">
        <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={applicationDataAggregated.length}
          itemContent={(index) => (
            <ApplicationTableRow key={applicationDataAggregated[index].owner_project} application={applicationDataAggregated[index]} maxMetrics={maxMetrics} />
          )}
        />
      </div>

    </HorizontalScrollContainer>
  )
}
type AltApplicationTableRowProps = {
  logo_path: string;
  owner_project: string;
  display_name: string;
  origin_keys: string[];
  category: string;
  num_contracts: number;
  gas_fees: number;
  gas_fees_eth: number;
  gas_fees_usd: number;
  gas_fees_change_pct: number;
  rank_gas_fees: number;
};


const Chains = ({ origin_keys }: { origin_keys: string[] }) => {
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, setSelectedChains } = useApplicationsData();

  return (
    <div className="flex items-center gap-x-[5px]">
      {origin_keys.map((chain, index) => (
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
    </div>
  );
};

const Category = ({ category }: { category: string }) => {
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

const Value = ({ rank, def, value, change_pct, maxMetric }: { rank: number, def: MetricDef, value: number, change_pct: number, maxMetric: number }) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const progressWidth = useMemo(() =>
    `${(value / maxMetric) * 100}%`,
    [value, maxMetric]
  );

  return (
    <div className="flex items-center justify-end gap-[5px]">
      <div className="numbers-xs text-[#5A6462]">{rank}</div>
      <div className="w-[178px] flex flex-col items-end gap-y-[2px]">

        <div className="flex justify-end items-center gap-x-[2px]">
          <div className="numbers-xs">
            {Object.keys(def.units).includes("eth") ? showUsd ? def.units.usd.prefix : def.units.eth.prefix : Object.values(def.units)[0].prefix}
            {value.toLocaleString("en-GB")}
          </div>
          {change_pct !== Infinity ?
            <div className={`numbers-xxs w-[49px] text-right ${change_pct < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
              {change_pct < 0 ? '-' : '+'}{Math.abs(change_pct).toFixed(0)}%
            </div>
            : <div className="w-[49px]">&nbsp;</div>}
        </div>
        <div className="relative w-full h-[4px] rounded-full">
          <div className="absolute h-[4px] right-0"
            style={{
              width: progressWidth,
              background: "linear-gradient(145deg, #FE5468 0%, #FFDF27 100%)",
              borderRadius: "999px",
            }}
          />

          {/* {maxMetric} */}
        </div>
      </div>
    </div>
  )
}



const ApplicationTableRow = memo(({ application, maxMetrics }: { application: AggregatedDataRow, maxMetrics: number[] }) => {
  const { ownerProjectToProjectData  } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 313px 199px minmax(135px,800px) 95px ${selectedMetricKeys.map(() => `237px`).join(" ")} 20px`,
    [selectedMetricKeys]
  );

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !px-[5px] !py-0 h-[34px] gap-x-[15px] mb-[5px]`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          <ApplicationIcon owner_project={application.owner_project} size="md" />
        </div>
      </div>
      <div className="flex items-center gap-x-[5px] justify-between">
        <ApplicationDisplayName owner_project={application.owner_project} />
        <Links application={application} />
      </div>
      <div className="flex items-center gap-x-[5px]">
        <Chains origin_keys={application.origin_keys} />
      </div>
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[application.owner_project] ? ownerProjectToProjectData[application.owner_project].main_category : ""} />
      </div>
      <div className="numbers-xs text-right">
        {application.num_contracts}
      </div>
      {selectedMetricKeys.map((key, index) => (
        <div
          key={key}
          className={`flex justify-end pr-[15px] items-center text-right h-full ${selectedMetricKeys.length == 1 || (selectedMetricKeys.length > 1 && (index + 1) % 2 == 0) ? 'bg-[#344240]/30' : ''} `}
        >
          <Value rank={application[`rank_${key}`]} def={metricsDef[selectedMetrics[index]]} value={application[key]} change_pct={application[`${key}_change_pct`]} maxMetric={maxMetrics[index]} />
        </div>
      ))}
      <div className="relative flex justify-end items-center pr-[0px]">
        <Link className="absolute cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/${application.owner_project}`}>
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </Link>
      </div>
      {/* #344240/30 */}
    </GridTableRow>
  )
});

ApplicationTableRow.displayName = 'ApplicationTableRow';

const MetricTooltip = ({ metric }: { metric: string }) => {
  const content = {
    gas_fees: {
      title: "Gas Fees",
      content: "The total gas fees paid by all contracts in the selected timeframe across the selected chains.",
    },
    txcount: {
      title: "Transactions",
      content: "The total number of transactions in the selected timeframe across the selected chains.",
    }
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
