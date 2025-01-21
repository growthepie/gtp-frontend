"use client";
import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { IS_PRODUCTION } from "@/lib/helpers";
import { ApplicationsURLs, DAMetricsURLs, DAOverviewURL, LabelsURLS, MasterURL, MetricsURLs } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ChainData, MetricData, MetricsResponse } from "@/types/api/MetricsResponse";
import { AppOverviewResponse, AppOverviewResponseHelper, ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

export type ApplicationRow = {
  owner_project: string;
  display_name: string;
  description: string;
  main_github: string;
  twitter: string;
  website: string;
  logo_path: string;
  dataKeys: ["origin_key", "timespan", "num_contracts", "gas_fees_eth", "gas_fees_eth_change", "gas_fees_usd", "gas_fees_usd_change", "txcount", "txcount_change"];
  data: [
    string, // origin_key
    string, // timespan
    number, // num_contracts
    number, // gas_fees_eth
    number, // gas_fees_eth_change (put placeholder for now)
    number, // gas_fees_usd
    number, // gas_fees_usd_change (put placeholder for now)
    number, // txcount
    number, // txcount_change (put placeholder for now)
  ][]
}

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (url) => {
        if (url.includes("api.growthepie.xyz")) {
          // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
          let newUrl = url.replace("/v1/", "/dev/");
          return fetch(newUrl).then((r) => r.json());
        } else {
          return fetch(url).then((r) => r.json());
        }
      },
      config,
    );
  };
};

function applicationsMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    /// Add logger to the original fetcher.
    const extendedFetcher = (...args) => {
      return fetcher(...args).then((data) => {
        const helper = AppOverviewResponseHelper.fromResponse(data);
        return helper;
      });
    };

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config);
  };
}


export type ApplicationsDataContextType = {
  selectedTimespan: string;
  setSelectedTimespan: (value: string) => void;
  selectedMetrics: ("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[];
  setSelectedMetrics: (value: ("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[]) => void;
  selectedChains: string[];
  setSelectedChains: (value: string[]) => void;
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  timespans: {
    [key: string]: {
      label: string;
      shortLabel: string;
      value: number;
      xMin: number;
      xMax: number;
    };
  }
  data: any;
  topGainers: ParsedDatum[];
  topLosers: ParsedDatum[];
  ownerProjectToProjectData: { [key: string]: {
    owner_project: string;
    display_name: string;
    description: string;
    main_github: string;
    twitter: string;
    website: string;
    logo_path: string;
  }};
  dataWithRanking: { [key: string]: (ParsedDatum & {ranking: number}) };
  applicationRowsSortedFiltered: ApplicationRow[];
}

export const ApplicationsDataContext = createContext<ApplicationsDataContextType | undefined>(undefined);

export const ApplicationsDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: applicationsData,
    error: applicationsError,
    isLoading: applicationsLoading,
    isValidating: applicationsValidating,
  } = useSWR<AppOverviewResponseHelper>(ApplicationsURLs.overview, fallbackFetcher, {
    use:
      apiRoot === "dev" && !IS_PRODUCTION
        ? [devMiddleware, applicationsMiddleware]
        : [applicationsMiddleware],
  });

  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(LabelsURLS.projects, fallbackFetcher, {
    use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
  });

  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let ownerProjectToProjectData = {};
    projectsData.data.data.forEach((project) => {
      ownerProjectToProjectData[project[0]] = {
        owner_project: project[0],
        display_name: project[1],
        description: project[2],
        main_github: project[3],
        twitter: project[4],
        website: project[5],
        logo_path: project[6],
      }
    });

    return ownerProjectToProjectData;
  }, [projectsData]);

  const [selectedMetrics, setSelectedMetrics] = useState<("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[]>(["gas_fees_usd"]);
  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  const { data, error, isLoading, isValidating } = useSWR<DAOverviewResponse>(DAOverviewURL);

  const timespans = useMemo(() => {
    let xMax = Date.now();

    if (!isMonthly) {
      return {
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
          xMin: xMax - 1 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
          xMin: xMax - 7 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
          xMin: xMax - 30 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
          xMin: number;
          xMax: number;
        };
      };
    } else {
      return {
        "90d": {
          shortLabel: "3m",
          label: "3 months",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
          xMin: number;
          xMax: number;
        };
      };
    }
  }, [isMonthly]);

  const topGainers = useMemo(() => {
    if (!applicationsData) return [];
    return applicationsData.data.sort((a, b) => {
      // sort by descending order of the sum of all selected metrics
      const aSum = selectedMetrics.reduce((acc, metric) => acc + a[metric], 0);
      const bSum = selectedMetrics.reduce((acc, metric) => acc + b[metric], 0);
      return bSum - aSum;
    }).slice(0, 3);
  }, [applicationsData, selectedMetrics]);

  const topLosers = useMemo(() => {
    if (!applicationsData) return [];
    return applicationsData.data.sort((a, b) => {
      // sort by ascending order of the sum of all selected metrics
      const aSum = selectedMetrics.reduce((acc, metric) => acc + a[metric], 0);
      const bSum = selectedMetrics.reduce((acc, metric) => acc + b[metric], 0);
      return aSum - bSum;
    }).slice(0, 3);
  }, [applicationsData, selectedMetrics]);

  const dataWithRanking = useMemo(() => {
    // sort by descending order of the sum of all selected metrics
    if (!applicationsData) return [];

    const dataWithRanking = applicationsData.data.map((datum) => {
      const sum = selectedMetrics.reduce((acc, metric) => acc + datum[metric], 0);
      return {
        ...datum,
        sum,
      };
    }).sort((a, b) => b.sum - a.sum).reduce((acc, datum, index) => {
    // add ranking
    return {
      ...acc,
      [datum.origin_key]: {
        ...datum,
        ranking: index + 1,
      },
    };
    }, {});

    return dataWithRanking;

  }, [applicationsData, selectedMetrics]);

  

  const applicationRows = useMemo(() => {
    if (!applicationsData) return [];

    const applicationRows: {[key: string]: ApplicationRow} = applicationsData.data.reduce((acc, datum) => {
      const owner_project = datum.owner_project;

      const data: [string, string, number, number, number, number, number, number, number] = [datum.origin_key, datum.timespan, datum.num_contracts, datum.gas_fees_eth, datum.gas_fees_eth /100, datum.gas_fees_usd, datum.gas_fees_usd/100, datum.txcount, datum.txcount/100];

      if (!acc[owner_project]) {

        const display_name = ownerProjectToProjectData[owner_project]?.display_name || "";
        const description = ownerProjectToProjectData[owner_project]?.description || "";
        const main_github = ownerProjectToProjectData[owner_project]?.main_github || "";
        const twitter = ownerProjectToProjectData[owner_project]?.twitter || "";
        const website = ownerProjectToProjectData[owner_project]?.website || "";
        const logo_path = ownerProjectToProjectData[owner_project]?.logo_path || "";

        acc[owner_project] = {
          owner_project,
          display_name,
          description,
          main_github,
          twitter,
          website,
          logo_path,
          dataKeys: ["origin_key", "timespan", "num_contracts", "gas_fees_eth", "gas_fees_eth_change", "gas_fees_usd", "gas_fees_usd_change", "txcount", "txcount_change"],
          data: [data],
        };
      }else{
        acc[owner_project].data.push(data);
      }

      return acc;
    }, {} as { [key: string]: ApplicationRow });

    return Object.values(applicationRows);
  }, [applicationsData, ownerProjectToProjectData]);

  const applicationRowsSortedFiltered = useMemo(() => {
    return applicationRows.filter((application) => application.data.some((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[application.dataKeys.indexOf("origin_key")] as string)) && datum[application.dataKeys.indexOf("timespan")] === selectedTimespan))
    .sort((a, b) => {
      // sort by descending order of the sum of all selected metrics
      const aSum = a.data
      .filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[a.dataKeys.indexOf("origin_key")] as string)) && selectedTimespan == datum[a.dataKeys.indexOf("timespan")])
      .reduce(
        (acc, datum) => {
          return selectedMetrics.length === 0 ? acc + (datum[a.dataKeys.indexOf("gas_fees_usd")] as number) : acc + (datum[a.dataKeys.indexOf(selectedMetrics[0])] as number)
        }, 0
      );
      const bSum = b.data
      .filter((datum) => (selectedChains.length === 0 || selectedChains.includes(datum[b.dataKeys.indexOf("origin_key")] as string)) && selectedTimespan == datum[b.dataKeys.indexOf("timespan")])
      .reduce(
        (acc, datum) => {
          return selectedMetrics.length === 0 ? acc + (datum[b.dataKeys.indexOf("gas_fees_usd")] as number) : acc + (datum[b.dataKeys.indexOf(selectedMetrics[0])] as number)
        }, 0
      );
      return bSum - aSum;
    });
  }, [applicationRows, selectedChains, selectedTimespan, selectedMetrics]);


  return (
    <ApplicationsDataContext.Provider value={{ 
      selectedTimespan, setSelectedTimespan, 
      selectedMetrics, setSelectedMetrics,
      selectedChains, setSelectedChains,
      isMonthly, setIsMonthly, 
      timespans,
      data, 
      topGainers, topLosers, 
      ownerProjectToProjectData, 
      dataWithRanking, 
      applicationRowsSortedFiltered
      }}>
      {children}
    </ApplicationsDataContext.Provider>
  );  
}

export const useApplicationsData = () => {
  const context = useContext(ApplicationsDataContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}