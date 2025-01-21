"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "./Search";
import Controls from "./Controls";
import { ApplicationRow, useApplicationsData } from "./ApplicationsDataContext";
import { ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { useCallback, useEffect, useMemo, useState } from "react";
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


export default function Page() {
  const { AllChainsByKeys } = useMaster();
  const { topGainers, topLosers, ownerProjectToProjectData, dataWithRanking, applicationRowsSortedFiltered, selectedChains, selectedTimespan } = useApplicationsData();
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
      <Container className="pt-[15px] grid grid-flow-row md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
        {[...applicationRowsSortedFiltered
          .filter((application) => application.data.some((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan))
          .slice(0, 3), ...applicationRowsSortedFiltered
            .filter((application) => application.data.some((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan))
            .slice(-3)].map((application, index) => (
              <ApplicationCard key={application.owner_project} application={application} />
            ))}
      </Container>
      <Container className="pt-[30px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Top Ranked (Transaction Count)</div>
          <div className="text-xs">
            Applications ranked by your selected metric and applied chain filter. Note that currently you apply a chain filter.
          </div>
        </div>
      </Container>
      <Container className="pt-[15px]">
        <ApplicationsTable />
        </Container>
    </>
  )
}



const ApplicationCard = ({ application }: { application: ApplicationRow }) => {
  const { AllChainsByKeys } = useMaster();
  const { applicationRowsSortedFiltered: applicationRowsSorted, ownerProjectToProjectData, selectedChains, setSelectedChains, selectedMetrics, selectedTimespan } = useApplicationsData();

  const numContractsString = useCallback((application: ApplicationRow) => {
    return application.data.
      filter((datum) => (
        selectedChains.length === 0 ||
        selectedChains.includes(
          datum[application.dataKeys.indexOf("origin_key")] as string)
      ) && selectedTimespan == datum[application.dataKeys.indexOf("timespan")] as string
      )
      .reduce((acc, datum) => {
        return acc + (datum[application.dataKeys.indexOf("num_contracts")] as number);
      }, 0);
  }, [selectedChains, selectedTimespan]);

  const getLinks = (application: ApplicationRow) => {
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

  const getUniqueChains = (application: ApplicationRow) => {
    const chains = application.data.map((d) => d[application.dataKeys.indexOf("origin_key")] as string);
    return [...new Set(chains)].sort();
  };

  const getRank = (application: ApplicationRow) => {
    return applicationRowsSorted.filter((application) =>
      application.data.some((datum) =>
      (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string) &&
        datum[application.dataKeys.indexOf("timespan")] === selectedTimespan)
      ))
      .findIndex((app) => app.owner_project === application.owner_project) + 1;
  }


  return (
    <div className="flex flex-col justify-between h-[140px] border-[0.5px] border-[#5A6462] rounded-[15px] px-[15px] pt-[5px] pb-[10px]">
      <div>
        <div className="w-full flex justify-between items-end h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[3px]">
            <div className="numbers-xs text-[#CDD8D3]">{numContractsString(application)}</div>
            <div className="text-xs text-[#5A6462]">contracts</div>
          </div>
          <div className="h-[20px] flex items-end gap-x-[3px]">
            <div className="numbers-xs text-[#5A6462]">Rank</div>
            <div className="numbers-xs text-[#CDD8D3]">{getRank(application)}</div>
            <div className="numbers-xs text-[#4CFF7E]">+34%</div>
          </div>

        </div>
        <div className="w-full flex justify-between items-center h-[20px]">
          <div className="h-[20px] flex items-center gap-x-[5px]">
            {/* {JSON.stringify(getUniqueChains(application))} */}
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
            <div className="numbers-sm text-[#CDD8D3]">{
              application.data.filter((datum) =>
                (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) &&
                datum[application.dataKeys.indexOf("timespan")] === selectedTimespan)
                .reduce((acc, datum) => {
                  return acc + (datum[application.dataKeys.indexOf(selectedMetrics.length === 0 ? "gas_fees_usd" : selectedMetrics[0])] as number);
                }, 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  compactDisplay: "short",
                })
            }
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center gap-x-[5px]">
        <div className="size-[36px] select-none">
          {application.logo_path ? (
            <Image
              src={`https://api.growthepie.xyz/v1/apps/logos/${application.logo_path}`}
              width={36} height={36}
              className="rounded-full"
              alt={application.display_name}
            />
          ) : (
            <div className="w-[36px] h-[36px] bg-[#5A6462]/30 rounded-full"></div>
          )}
        </div>
        <div className="heading-large-md flex-1">{application.display_name}</div>
        <div className="cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-[5px]">
        <div className="text-xs">Category Placeholder</div>
        <div className="flex items-center gap-x-[5px]">
          {getLinks(application).map((item, index) => (
            <div key={index} className="h-[15px] w-[15px]">
              {item.link && <Link
                href={item.link.includes("http") ? item.link : `https://${item.link}`}
                target="_blank"
              >
                <Icon
                  icon={item.icon}
                  className="w-[15px] h-[15px]"
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
  const { applicationRowsSortedFiltered, selectedChains, selectedTimespan, selectedMetrics } = useApplicationsData();

  const maxMetric = useMemo(() => {
    return applicationRowsSortedFiltered.reduce((acc, application) => {
      return Math.max(acc, application.data.filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan).reduce((acc, datum) => {
        return acc + (datum[application.dataKeys.indexOf(selectedMetrics.length === 0 ? "gas_fees_usd" : selectedMetrics[0])] as number);
      }, 0));
    }, 0);
  }, [applicationRowsSortedFiltered, selectedChains, selectedTimespan, selectedMetrics]);


  return (
    <>
      <GridTableHeader
        gridDefinitionColumns="grid-cols-[313px,199px,minmax(135px,800px),95px,200px,20px]"
        className="group text-[14px] !px-0 !py-0 gap-x-[15px] !pb-[4px]"
      >

        <GridTableHeaderCell
          metric="owner_project"
          className="heading-small-xs pl-[37px]"
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
          metric="owner_project"
          className="heading-small-xs"
          justify="end"
        >
          Gas Fees (USD)
        </GridTableHeaderCell>
        <div />
      </GridTableHeader>
      <div className="flex flex-col gap-y-[5px]">

        {applicationRowsSortedFiltered.filter((application) => application.data.some((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan))
          .filter((app, index) => index < 10 || index > applicationRowsSortedFiltered.length - 10)
          .map((application, index) => (
            <ApplicationTableRow key={index} application={application} maxMetric={maxMetric} />
          ))}
      </div>

    </>
  )
}

const ApplicationTableRow = ({ application, maxMetric }: { application: ApplicationRow, maxMetric: number }) => {
  const [image, setImage] = useState<string | null>(null);
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, selectedTimespan, setSelectedChains } = useApplicationsData();


  // fetch image with headers 
  // "X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN
  useEffect(() => {
    if (!application.logo_path) return;
    const headers = new Headers();
    headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN!);
    const requestOptions = {
      method: "GET",
      headers: headers,
    };
    fetch(`https://api.growthepie.xyz/v1/apps/logos/${application.logo_path}`, requestOptions).then((res) => {
      if (res.ok) {
        // blob() returns a promise that resolves with a Blob
        res.blob().then((blob) => {
          setImage(URL.createObjectURL(blob));
        });

      }
    });
  }, [application.logo_path]);

  const getUniqueChains = (application: ApplicationRow) => {
    const chains = application.data.map((d) => d[application.dataKeys.indexOf("origin_key")] as string);
    return [...new Set(chains)].sort();
  };

  const getRandomGTPCategoryIcon = () => {
    const icons: GTPIconName[] = [
      "gtp-crosschain",
      "gtp-utilities",
      "gtp-tokentransfers",
      "gtp-defi",
      "gtp-socials",
      "gtp-nft",
      "gtp-cefi",
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  }


  return (
    <GridTableRow gridDefinitionColumns="grid-cols-[313px,199px,minmax(135px,800px),95px,200px,20px]" className={`group text-[14px] !px-0 !py-0 h-[34px] gap-x-[15px]`}>
      <div className="flex items-center gap-x-[5px] pl-[5px]">
        <div className="size-[26px] select-none">
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
        </div>
        <div className="text-xxs">{application.display_name}</div>
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
        <div className="flex items-center gap-x-[5px]">
          <GTPIcon icon={getRandomGTPCategoryIcon()} size="sm" />
          Category Placeholder
        </div>

      </div>
      <div className="numbers-xs text-right">
        {application.data.filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan).reduce((acc, datum) => {
          return acc + (datum[application.dataKeys.indexOf("num_contracts")] as number);
        }, 0).toLocaleString("en-GB")}
      </div>
      <div className="flex justify-end text-right">
        <div className="w-[160px] flex flex-col items-end gap-y-[2px]">
        <div className="flex justify-end items-center gap-x-[2px]">
          <div className="numbers-xs">
          {application.data.filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan).reduce((acc, datum) => {
            return acc + (datum[application.dataKeys.indexOf("gas_fees_usd")] as number);
          }, 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            compactDisplay: "short",
          })}
          </div>
          <div className="numbers-xxs text-[#4CFF7E] w-[49px] text-right">+34%</div>
        </div>
        <div className="relative w-full h-[4px] rounded-full">
          <div className="absolute h-[4px] right-0"
            style={{
              width: `${(application.data.filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan).reduce((acc, datum) => {
                return acc + (datum[application.dataKeys.indexOf("gas_fees_usd")] as number);
              }, 0) / maxMetric) * 100}%`,
              background: "linear-gradient(145deg, #FE5468 0%, #FFDF27 100%)",
              borderRadius: "999px",
            }}
          />


        </div>
        </div>
      </div>
      <div className="relative flex justify-end items-center pr-[5px]">
        <div className="absolute cursor-pointer size-[24px] bg-[#344240] rounded-full flex justify-center items-center">
          <Icon icon="feather:arrow-right" className="w-[17.14px] h-[17.14px] text-[#CDD8D3]" />
        </div>
      </div>

    </GridTableRow>
  )
}