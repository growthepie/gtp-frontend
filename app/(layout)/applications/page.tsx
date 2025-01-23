"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "./Search";
import Controls from "./Controls";
import { AggregatedDataRow, useApplicationsData } from "./ApplicationsDataContext";
import { ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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


export default function Page() {
  const { applicationDataAggregated, selectedMetrics, isLoading } = useApplicationsData();
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
      <Container className="hidden md:grid grid-flow-row pt-[10px]  md:grid-cols-2 lg:grid-cols-3 gap-[10px]">

        {applicationDataAggregated.length > 0 &&
          [...[...applicationDataAggregated]
            .sort((a, b) => b[selectedMetrics[0] + "_pct"] - a[selectedMetrics[0] + "_pct"])
            .filter(
              (application) => application[selectedMetrics[0] + "_pct"] < Infinity && application.gas_fees_usd > 1000
            ).slice(0, 3)].map((application, index) => (
              <ApplicationCard key={application.owner_project} application={application} />
            ))
        }
        {applicationDataAggregated.length > 0 &&
          [...[...applicationDataAggregated]
            .sort((a, b) => a[selectedMetrics[0] + "_pct"] - b[selectedMetrics[0] + "_pct"])
            .filter(
              (application) => application[selectedMetrics[0] + "_pct"] > -Infinity && application.gas_fees_usd > 1000
            ).slice(0, 3)].map((application, index) => (
              <ApplicationCard key={application.owner_project} application={application} />
            ))
        }
        {isLoading && new Array(6).fill(0).map((_, index) => (
          <ApplicationCard key={index} application={undefined} />
        ))}
      </Container>
      {applicationDataAggregated.length > 0 && <ApplicationCardSwiper />}
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Ranked (Gas Fees USD)</div>
          <div className="text-xs">
            Applications ranked by your selected metric and applied chain filter. Note that currently you apply a chain filter.
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer reduceLeftMask={true}>
        <ApplicationsTable />
      </HorizontalScrollContainer>
    </>
  )
}

const ApplicationCardSwiper = () => {
  const { selectedChains, selectedTimespan, applicationDataAggregated } = useApplicationsData();
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
  const { ownerProjectToProjectData, selectedChains, setSelectedChains, selectedMetrics, selectedTimespan } = useApplicationsData();

  const numContractsString = useCallback((application: AggregatedDataRow) => {
    return application.num_contracts.toLocaleString("en-GB");
  }, [selectedChains, selectedTimespan]);

  const getLinks = (application: AggregatedDataRow) => {
    const links: { icon: string, link: string }[] = [];
    const linkPrefixes = ["", "https://x.com/", "https://github.com/"];
    const icons = ["feather:monitor", "ri:twitter-x-fill", "ri:github-fill"];
    const keys = ["website", "twitter", "main_github"];


    keys.forEach((key, i) => {
      const link = application[key];
      if (link) {
        links.push({
          icon: icons[i],
          link: `${linkPrefixes[i]}${link}`,
        });
      } else {
        links.push({
          icon: icons[i],
          link: "",
        });
      }
    });

    return links;
  };

  const getRank = (application: AggregatedDataRow) => {
    return application[`rank_${selectedMetrics.length === 0 ? "gas_fees_usd" : selectedMetrics[0]}`];
  }

  const getMetricPrefix = useCallback(() => {
    if (selectedMetrics.length === 0) {
      return "$";
    }
    if (selectedMetrics[0].includes("_eth")) {
      return "Ξ";
    } else if (selectedMetrics[0].includes("_usd")) {
      return "$";
    }
    return "";
  }, [selectedMetrics]);

  const getMetricString = () => {
    if (!application) return null;
    console.log("application", application);
    if (selectedMetrics.length === 0) {
      return `${application['gas_fees_usd'].toLocaleString("en-GB")}`;
    }

    return `${application[selectedMetrics[0]].toLocaleString("en-GB")}`;
  };

  if(!application) {
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
            <div className="numbers-xs text-[#CDD8D3]">{getRank(application)}</div>
            {application[`${selectedMetrics[0]}_pct`] !== Infinity ? (
            <div className={`flex justify-end w-[49px] numbers-xs ${application[`${selectedMetrics[0]}_pct`] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
              {application[`${selectedMetrics[0]}_pct`] < 0 ? '-' : '+'}{Math.abs(application[`${selectedMetrics[0]}_pct`]).toFixed(0)}%
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
              {getMetricPrefix()}
              {getMetricString()}

            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center gap-x-[5px]">
        <div className="size-[36px] select-none">
          {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].logo_path ? (
            <Image
              src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[application.owner_project].logo_path}`}
              width={36} height={36}
              className="rounded-full select-none"
              alt={ownerProjectToProjectData[application.owner_project].display_name}
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-[36px] h-[36px] bg-forest-950 rounded-full"></div>
          )}
        </div>
        {ownerProjectToProjectData[application.owner_project] ? (
          <div className="heading-large-md flex-1">{ownerProjectToProjectData[application.owner_project].display_name}</div>
        ) : (
          <div className="heading-large-md flex-1 opacity-60">{application.owner_project}</div>
        )}
        <div className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">{ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].main_category}</div>
        <div className="flex items-center gap-x-[5px]">
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
        </div>
      </div>
    </div>
  )
}

const ApplicationsTable = () => {
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, selectedTimespan, selectedMetrics, applicationDataAggregated, sortOrder, setSortOrder, setSelectedMetrics } = useApplicationsData();

  const maxMetric = useMemo(() => {
    return applicationDataAggregated.reduce((acc, application) => {
      return Math.max(acc, application[selectedMetrics[0]]);
    }, 0);
  }, [applicationDataAggregated, selectedMetrics]);


  return (
    <>
      <GridTableHeader
        gridDefinitionColumns="grid-cols-[26px,313px,199px,minmax(135px,800px),95px,200px,20px]"
        className="group text-[14px] !px-[5px] !py-0 gap-x-[15px] !pb-[4px]"
      >
        <div />
        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs pl-[0px]"
        // sort={{
        //   sortOrder: sortOrder ? "asc" : "desc",
        //   metric: contractCategory,
        // }}
        // setSort={(sort: { metric: string; sortOrder: string }) => {
        //   setSortOrder(!sortOrder);
        //   setContractCategory(sort.metric);
        // }}
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
        <GridTableHeaderCell
          metric="gas_fees_usd"
          className="heading-small-xs"
          justify="end"
          sort={{
            sortOrder: sortOrder,
            metric: selectedMetrics.length === 0 ? "gas_fees_usd" : selectedMetrics[0],
          }}
          setSort={(sort) => {
            setSelectedMetrics([sort.metric as any]);
            if(sortOrder === "asc") {
              setSortOrder("desc");
            } else {
              setSortOrder("asc");
            }
          }}
        >
          Gas Fees USD
        </GridTableHeaderCell>
        <div />
      </GridTableHeader>
      <div className="flex flex-col gap-y-[5px]">

        {applicationDataAggregated
          .slice(0, 10)
          .map((application, index) => (
            <ApplicationTableRow key={index} application={application} maxMetric={maxMetric} />
          ))}
        {applicationDataAggregated
          .slice(applicationDataAggregated.length / 2, applicationDataAggregated.length / 2 + 10)
          .map((application, index) => (
            <ApplicationTableRow key={index} application={application} maxMetric={maxMetric} />
          ))}
        {applicationDataAggregated
          .slice(-10)
          .map((application, index) => (
            <ApplicationTableRow key={index} application={application} maxMetric={maxMetric} />
          ))}
      </div>

    </>
  )
}

const ApplicationTableRow = ({ application, maxMetric }: { application: AggregatedDataRow, maxMetric: number }) => {
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, selectedTimespan, setSelectedChains, ownerProjectToProjectData, selectedMetrics } = useApplicationsData();

  const getUniqueChains = (application: AggregatedDataRow) => {
    return application.origin_keys;
  };

  const getGTPCategoryIcon= (category: string): GTPIconName | "" => {

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

  const getMetricPrefix = useCallback(() => {
    if (selectedMetrics.length === 0) {
      return "$";
    }
    if (selectedMetrics[0].includes("_eth")) {
      return "Ξ";
    } else if (selectedMetrics[0].includes("_usd")) {
      return "$";
    }
    return "";
  }, [selectedMetrics]);

  const getMetricString = () => {
    if (!application) return null;
    console.log("application", application);
    if (selectedMetrics.length === 0) {
      return `${application['gas_fees_usd'].toLocaleString("en-GB")}`;
    }

    return `${application[selectedMetrics[0]].toLocaleString("en-GB")}`;
  };


  return (
    <GridTableRow gridDefinitionColumns="grid-cols-[26px,313px,199px,minmax(135px,800px),95px,200px,20px]" className={`group text-[14px] !px-[5px] !py-0 h-[34px] gap-x-[15px]`}>
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          {ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].logo_path ? (
            <Image
              src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[application.owner_project].logo_path || ''}`}
              width={26} height={26}
              className="rounded-full select-none"
              alt={ownerProjectToProjectData[application.owner_project] && ownerProjectToProjectData[application.owner_project].display_name}
            />
          ) : (
            <div className="size-[26px] bg-forest-950 rounded-full"></div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-x-[5px]">
        {/* <div className="size-[26px] select-none">
          {application.logo_path && image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              // src={`https://api.growthepie.xyz/v1/apps/logos/${application.logo_path}`}
              width={26} height={26}
              className="rounded-full"
              alt={application.display_name}
            />
          ) : (
            <div className="size-[26px] bg-[#5A6462]/30 rounded-full"></div>
          )}
        </div> */}
        {ownerProjectToProjectData[application.owner_project] ? (
          <div className="text-xxs">{ownerProjectToProjectData[application.owner_project].display_name}</div>
        ) : (
          <div className="text-xxs opacity-60">{application.owner_project}</div>
        )}
      </div>
      <div className="flex items-center gap-x-[5px]">
        {getUniqueChains(application).map((chain, index) => (
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
      <div className="text-xs">
        <div className="flex items-center gap-x-[5px] whitespace-nowrap">
          {/* <GTPIcon icon={getGTPCategoryIcon()} size="sm" /> */}
          {ownerProjectToProjectData[application.owner_project] && (
            <>
              <GTPIcon icon={getGTPCategoryIcon(ownerProjectToProjectData[application.owner_project].main_category) as GTPIconName} size="sm" />
              {ownerProjectToProjectData[application.owner_project].main_category}
            </>
            )}
        </div>

      </div>
      <div className="numbers-xs text-right">
        {application.num_contracts}
      </div>
      <div className="flex justify-end text-right">
        <div className="w-[160px] flex flex-col items-end gap-y-[2px]">
          <div className="flex justify-end items-center gap-x-[2px]">
            <div className="numbers-xs">
              {getMetricPrefix()}
              {getMetricString()}
            </div>
            {application[selectedMetrics[0] + "_pct"] !== Infinity ?
            <div className={`numbers-xxs w-[49px] text-right ${application[selectedMetrics[0] + "_pct"] < 0 ? 'text-[#FF3838]' : 'text-[#4CFF7E]'}`}>
              {application[selectedMetrics[0] + "_pct"] < 0 ? '-' : '+'}{Math.abs(application[selectedMetrics[0] + "_pct"]).toFixed(0)}%
              </div>
              : <div className="w-[49px]">&nbsp;</div>}
          </div>
          <div className="relative w-full h-[4px] rounded-full">
            <div className="absolute h-[4px] right-0"
              style={{
                width: `${application[selectedMetrics[0]] / maxMetric * 100
                  }%`,
                background: "linear-gradient(145deg, #FE5468 0%, #FFDF27 100%)",
                borderRadius: "999px",
              }}
            />


          </div>
        </div>
      </div>
      <div className="relative flex justify-end items-center pr-[0px]">
        <div className="absolute cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </div>
      </div>

    </GridTableRow>
  )
}