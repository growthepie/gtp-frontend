//@ts-nocheck
"use client";
import LabelsContainer from "@/components/layout/LabelsContainer";
import Icon from "@/components/layout/Icon";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  useEventListener,
  useSessionStorage,
  useLocalStorage,
} from "usehooks-ts";
import { LabelsParquetURLS, LabelsURLS, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  LabelsResponse,
  LabelsResponseHelper,
  ParsedDatum,
} from "@/types/Labels/LabelsResponse";
import Header from "./Header";

import Footer from "./Footer";
import LabelsTableContainer from "@/components/LabelsTableContainer";

import { IS_PRODUCTION } from "@/lib/helpers";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import ShowLoading from "@/components/layout/ShowLoading";
import Sparkline from "./Sparkline";
import CanvasSparkline from "./CanvasSparkline";
import { AddIcon, Badge, RemoveIcon } from "./Search";
import { formatNumber } from "@/lib/chartUtils";
import { CanvasSparklineProvider, useCanvasSparkline } from "./CanvasSparkline";
import { Table } from "apache-arrow";
// import wasmInit, { wasmMemory, readParquet } from "parquet-wasm";
import { parseTable } from "arrow-js-ffi";
// import { useProjectData } from "../useProjectData";
// import { useDuckDB } from "../SparklineParquetContext";
import { uniqBy } from "lodash";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import SVGSparkline, { SVGSparklineProvider, useSVGSparkline } from "./SVGSparkline";
import { GridTableChainIcon, GridTableHeader, GridTableRow } from "@/components/layout/GridTable";
import { GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (url) => {
        if (url.includes("api.growthepie.com")) {
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

function labelsMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    /// Add logger to the original fetcher.
    const extendedFetcher = (...args) => {
      return fetcher(...args).then((data) => {
        const labelsHelper = LabelsResponseHelper.fromResponse(data);
        return labelsHelper;
      });
    };

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config);
  };
}
const metricKeys = ["txcount", "gas_fees_usd", "daa"];
const sparklineMetricKeys = ["txcount", "gas_fees", "active_addresses"];

const metricKeysLabels = {
  txcount: "Transaction Count",
  gas_fees_usd: "Gas Fees",
  daa: "Active Addresses",
};

export default function LabelsPage() {
  const { AllChainsByKeys, formatMetric } = useMaster();
  const isMobile = useUIContext((state) => state.isMobile);
  const showGwei = true;
  const showCents = true;

  //True is default descending false ascending
  // const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const [showDeploymentTx, setShowDeploymentTx] = useSessionStorage(
    "labels::showDeploymentTx",
    false
  );

  const [showDeployerAddress, setShowDeployerAddress] = useSessionStorage(
    "labels::showDeployerAddress",
    false
  );

  const [allowDownloadData, setAllowDownloadData] = useSessionStorage(
    "labels::allowDownloadData",
    false
  );

  const [labelsChainsFilter, setLabelsChainsFilter] = useSessionStorage<
    string[]
  >("labelsChainsFilter", []);

  const metrics = useMemo(() => {
    return {
      txcosts_median: {
        title: "Median Fee",
      },
      txcosts_native_median: {
        title: "Transfer ETH",
      },
      txcosts_swap: {
        title: "Swap Token",
      },
    };
  }, []);

  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: quickLabelsData,
    error: quickLabelsError,
    isLoading: quickLabelsLoading,
    isValidating: quickLabelsValidating,
  } = useSWR<LabelsResponseHelper>(LabelsURLS.quick, fallbackFetcher, {
    use:
      apiRoot === "dev" && !IS_PRODUCTION
        ? [devMiddleware, labelsMiddleware]
        : [labelsMiddleware],
  });

  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(LabelsURLS.projects, fallbackFetcher, {
    use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
  });

  // const [ownerProjectToProjectData, setOwnerProjectToProjectData] = useState<{
  //   [key]: any[];
  // }>({});

  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let ownerProjectToProjectData = {};
    projectsData.data.data.forEach((project) => {
      ownerProjectToProjectData[project[0]] = project;
    });

    return ownerProjectToProjectData;
  }, [projectsData]);

  // useEffect(() => {
  //   if (!projectsData) {

  //     let ownerProjectToProjectData = {};
  //     projectsData.data.data.forEach((project) => {
  //       ownerProjectToProjectData[project[0]] = project;
  //     });
  //     setOwnerProjectToProjectData(ownerProjectToProjectData);
  //   }
  // }, [projectsData]);

  const {
    data: fullLabelsData,
    error: fullLabelsError,
    isLoading: fullLabelsLoading,
    isValidating: fullLabelsValidating,
  } = useSWR<LabelsResponseHelper>(
    quickLabelsData ? LabelsURLS.full : null,
    fallbackFetcher,
    {
      use:
        apiRoot === "dev" && !IS_PRODUCTION
          ? [devMiddleware, labelsMiddleware]
          : [labelsMiddleware],
    },
  );

  const {
    data: sparklineLabelsData,
    error: sparklineLabelsError,
    isLoading: sparklineLabelsLoading,
    isValidating: sparklineLabelsValidating,
  } = useSWR<any>(quickLabelsData ? LabelsURLS.sparkline : null);

  // const {
  //   db,
  //   isLoading: isDBLoading,
  //   error: dbError,
  //   data: parquetSparklineData,
  // } = useDuckDB();

  const [currentMetric, setCurrentMetric] = useState(metricKeys[0]);

  const [sort, setSort] = useState({
    metric: "txcount",
    sortOrder: "desc",
  });

  const handlePreviousMetric = useCallback(() => {
    const currentIndex = metricKeys.indexOf(currentMetric);
    const newIndex =
      currentIndex === 0 ? metricKeys.length - 1 : currentIndex - 1;
    // if (sort.metric === currentMetric) {
    //   setSort({
    //     metric: metricKeys[newIndex],
    //     sortOrder: sort.sortOrder,
    //   });
    // }
    setCurrentMetric(metricKeys[newIndex]);
  }, [currentMetric]);

  const handleNextMetric = useCallback(() => {
    const currentIndex = metricKeys.indexOf(currentMetric);
    const newIndex =
      currentIndex === metricKeys.length - 1 ? 0 : currentIndex + 1;
    // if (sort.metric === currentMetric) {
    //   setSort({
    //     metric: metricKeys[newIndex],
    //     sortOrder: sort.sortOrder,
    //   });
    // }
    setCurrentMetric(metricKeys[newIndex]);
  }, [currentMetric]);

  useEffect(() => {
    if (!currentMetric) return;

    if (metricKeys.includes(sort.metric) && sort.metric !== currentMetric) {
      setSort(prev => ({
        ...prev,
        metric: currentMetric,
      }));
    }
  }, [currentMetric, sort, setSort]);

  // const [metricIndex, setMetricIndex] = useState(0);
  // const [metricChangeIndex, setMetricChangeIndex] = useState(0);

  const [labelsNumberFiltered, setLabelsNumberFiltered] =
    useSessionStorage<number>("labelsNumberFiltered", 0);

  const [labelsFilters, setLabelsFilters] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
    txcount: number[];
    txcount_change: number[];
    gas_fees_usd: number[];
    gas_fees_usd_change: number[];
    daa: number[];
    daa_change: number[];
  }>("labelsFilters", {
    address: [],
    origin_key: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
    txcount: [],
    txcount_change: [],
    gas_fees_usd: [],
    gas_fees_usd_change: [],
    daa: [],
    daa_change: [],
  });

  // The scrollable element for your list
  const listRef = useRef<HTMLDivElement>();

  const [labelsOwnerProjects, setLabelsOwnerProjects] = useSessionStorage<
    { owner_project: string; owner_project_clear: string }[]
  >("labelsOwnerProjects", []);

  const data = useMemo(() => {
    if (!quickLabelsData && !fullLabelsData) return [];

    return quickLabelsData ? quickLabelsData.data : fullLabelsData.data;
  }, [quickLabelsData, fullLabelsData]);

  const dataTypes = useMemo(() => {
    if (!quickLabelsData && !fullLabelsData) return {};

    return quickLabelsData ? quickLabelsData.types : fullLabelsData.types;
  }, [quickLabelsData, fullLabelsData]);

  const subcategoryToCategoryMapping = useMemo(() => {
    if (!master) return {};

    let mapping = {};

    Object.keys(master.blockspace_categories.mapping).forEach((category) => {
      master.blockspace_categories.mapping[category].forEach((subcategory) => {
        mapping[subcategory] = category;
      });
    });

    return mapping;
  }, [master]);

  const filteredLabelsData = useMemo<ParsedDatum[]>(() => {
    let rows = [];

    if ((!quickLabelsData && !fullLabelsData) || !master) return rows;

    if (!fullLabelsData) {
      rows = quickLabelsData.data;
    } else {
      rows = fullLabelsData.data;
    }

    const numFilters = Object.values(labelsFilters).flat().length;

    if (numFilters !== 0) {
      if (labelsFilters.origin_key.length > 0) {
        rows = rows.filter((label) =>
          labelsFilters.origin_key.includes(label.origin_key),
        );
      }

      if (labelsFilters.address.length > 0) {
        // check if the search address is anywhere in the address (case insensitive)
        rows = rows.filter((label) => {
          return labelsFilters.address.some((address) =>
            label.address.toLowerCase().includes(address.toLowerCase()),
          );
        });
      }

      if (labelsFilters.name.length > 0) {
        rows = rows.filter((label) => labelsFilters.name.includes(label.name));
      }

      let subcategoriesInCategoryFilters = [];
      labelsFilters.category.forEach((category) => {
        subcategoriesInCategoryFilters.push(
          master.blockspace_categories.mapping[category],
        );
      });

      subcategoriesInCategoryFilters = subcategoriesInCategoryFilters.flat();

      let both = [
        ...subcategoriesInCategoryFilters,
        ...labelsFilters.subcategory,
      ];

      let isUnlabeledSelected = labelsFilters.category.includes("unlabeled");

      let all_usage_categories = [...new Set(both)];

      if (all_usage_categories.length > 0) {
        if (isUnlabeledSelected) {
          rows = rows.filter((label) =>
            all_usage_categories.includes(label.usage_category) || label.usage_category === null,
          );
        } else {
          rows = rows.filter((label) =>
            all_usage_categories.includes(label.usage_category),
          );
        }
      }

      if (labelsFilters.owner_project.length > 0) {
        rows = rows.filter((label) =>
          labelsFilters.owner_project
            .map((o) => o.owner_project)
            .includes(label.owner_project),
        );
      }
    }

    // sort
    if (["deployment_date"].includes(sort.metric)) {
      rows.sort((a, b) => {
        let aVal = a[sort.metric];
        let bVal = b[sort.metric];

        if (!aVal && !bVal) return 0;

        if (!aVal) return 1;

        if (!bVal) return -1;

        let aDate = new Date(aVal);
        let bDate = new Date(bVal);

        if (sort.sortOrder === "asc") {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      });
    }

    if (["txcount", "gas_fees_usd", "daa"].includes(sort.metric)) {
      rows.sort((a, b) => {
        let aMetric = a[sort.metric];
        let bMetric = b[sort.metric];
        if (sort.sortOrder === "asc") {
          return aMetric - bMetric;
        } else {
          return bMetric - aMetric;
        }
      });
    }

    if (["category", "subcategory"].includes(sort.metric)) {
      rows.sort((a, b) => {
        let aUsageCategory = a["usage_category"];
        let bUsageCategory = b["usage_category"];

        let aMetric =
          sort.metric === "category"
            ? subcategoryToCategoryMapping[aUsageCategory]
            : aUsageCategory;
        let bMetric =
          sort.metric === "category"
            ? subcategoryToCategoryMapping[bUsageCategory]
            : bUsageCategory;

        if (!aMetric && !bMetric) return 0;

        if (!aMetric) return 1;

        if (!bMetric) return -1;

        if (sort.sortOrder === "asc") {
          return aMetric.localeCompare(bMetric);
        } else {
          return bMetric.localeCompare(aMetric);
        }
      });
    }

    if (
      ["owner_project", "address", "name", "category", "subcategory", "deployment_tx", "deployer_address"].includes(
        sort.metric,
      )
    ) {
      rows.sort((a, b) => {
        let aMetric = a[sort.metric];
        let bMetric = b[sort.metric];

        if (!aMetric && !bMetric) return 0;

        if (!aMetric) return 1;

        if (!bMetric) return -1;

        if (sort.sortOrder === "asc") {
          return aMetric.localeCompare(bMetric);
        } else {
          return bMetric.localeCompare(aMetric);
        }
      });
    }

    return rows;
  }, [
    quickLabelsData,
    fullLabelsData,
    master,
    labelsFilters,
    sort.metric,
    sort.sortOrder,
    subcategoryToCategoryMapping,
  ]);

  useEffect(() => {
    if (filteredLabelsData) {
      setLabelsNumberFiltered(filteredLabelsData.length);
    }
  }, [filteredLabelsData, setLabelsNumberFiltered]);

  useEffect(() => {
    const uniqueOwnerProjects =
      uniqBy(
        data
          .filter((label) => label.owner_project)
          .map((label) => ({
            owner_project: label.owner_project,
            owner_project_clear:
              label.owner_project_clear || label.owner_project,
          }))
          .sort((a, b) =>
            a.owner_project_clear

              .localeCompare(b.owner_project_clear),
          ),
        "owner_project");

    setLabelsOwnerProjects(uniqueOwnerProjects);

    // setLabelsOwnerProjectClears(uniqueOwnerProjects.map((u) => u[1]));
  }, [data, setLabelsOwnerProjects]);

  // The virtualizer
  const virtualizer = useWindowVirtualizer({
    count: filteredLabelsData.length,
    // getScrollElement: () => listRef.current,
    estimateSize: () => 37,
    // size: 37,
    // scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: 32,
    getItemKey: (index) =>
      `${filteredLabelsData[index].origin_key}_${filteredLabelsData[index].address}}`,
  });

  const items = virtualizer.getVirtualItems();

  const [paddingTop, paddingBottom] =
    items.length > 0
      ? [
        Math.max(0, items[0].start - virtualizer.options.scrollMargin),
        Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end),
      ]
      : [0, 0];

  const handleFilter = useCallback(
    (key: string, value: string | number) => {
      if (key === "owner_project" && typeof value !== "string" && typeof value !== "number" && typeof key === "string") {
        setLabelsFilters({
          ...labelsFilters,
          owner_project: labelsFilters[key].find(
            (f) => f.owner_project === value['owner_project'],
          )
            ? labelsFilters[key].filter(
              (f) => f.owner_project !== value['owner_project'],
            )
            : [...labelsFilters[key], value],
        });
      } else {
        setLabelsFilters({
          ...labelsFilters,
          [key]: labelsFilters[key].includes(value)
            ? labelsFilters[key].filter((f) => f !== value)
            : [...labelsFilters[key], value],
        });
      }
    },
    [labelsFilters, setLabelsFilters],
  );

  // find the min and max of the current metric
  const SparklineTimestampRange = useMemo(() => {
    if (!sparklineLabelsData) return [0, 0];

    // parquetSparklineData[
    //   `${filteredLabelsData[item.index].origin_key}_${filteredLabelsData[item.index].address
    //   }`
    // ]

    let min = Infinity;
    let max = -Infinity;

    Object.keys(sparklineLabelsData.data).forEach((key) => {
      if (key === "types") return;
      const data = sparklineLabelsData.data[key].sparkline;
      const timestamps = data.map((row) => row[sparklineLabelsData.data.types.indexOf("unix")]);

      min = Math.min(min, ...timestamps);
      max = Math.max(max, ...timestamps);
    });

    return [min, max];

  }, [sparklineLabelsData]);

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddressTimeout = useRef<number | null>(null);

  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);

    if (copyAddressTimeout.current) {
      clearTimeout(copyAddressTimeout.current);
    }

    copyAddressTimeout.current = window.setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  }, []);


  const gridTemplateColumns = useMemo(() => {

    let cols = ["15px", "200px", "180px", "180px", "120px", "120px", "minmax(125px,1600px)", "187px"];


    if (showDeploymentTx && showDeployerAddress) {
      cols = ["15px", "200px", "180px", "180px", "120px", "120px", "minmax(125px,1600px)", "120px", "115px", "187px"]
    }
    else if (showDeploymentTx) {
      cols = ["15px", "200px", "180px", "180px", "120px", "120px", "minmax(125px,1600px)", "120px", "187px"]
    }

    else if (showDeployerAddress) {
      cols = ["15px", "200px", "180px", "180px", "120px", "120px", "minmax(125px,1600px)", "120px", "187px"]
    }


    return cols.join(" ");
  }, [showDeployerAddress, showDeploymentTx]);


  const downloadCSV = useCallback(() => {
    // compile CSV from data w/ headers
    const headers = [
      "Contract Address",
      "Owner Project",
      "Contract Name",
      "Category",
      "Subcategory",
      "Deployment Date",
      "Transaction Count",
      "Gas Fees",
      "Active Addresses",
      "Origin Key",
      "Deployment Tx",
      "Deployer Address",
    ];

    const rows = filteredLabelsData.map((label) => {
      return [
        label.address,
        label.owner_project,
        label.name,
        label.category,
        label.subcategory,
        label.deployment_date,
        label.txcount,
        label.gas_fees_usd,
        label.daa,
        label.origin_key,
        label.deployment_tx,
        label.deployer_address,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement
      ("a");
    a.href = url;
    a.download = "labels.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLabelsData]);


  const downloadJSON = useCallback(() => {
    const json = JSON.stringify(filteredLabelsData, null, 2);

    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "labels.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLabelsData]);




  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, quickLabelsLoading]}
        dataValidating={[masterValidating, quickLabelsLoading]}
      />

      {master && <Header downloadCSV={downloadCSV} downloadJSON={downloadJSON} />}

      {/* <div className="relative pb-[114px] pt-[140px]"> */}
      <LabelsContainer className="pt-[110px] md:pt-[175px] w-full flex items-end sm:items-center justify-between md:justify-start gap-x-[10px] z-[21]">
        <h1 className="text-[20px] md:text-[30px] pl-[15px] leading-[120%] font-bold z-[19]">
          Smart Contracts on Ethereum Layer 2s
        </h1>
      </LabelsContainer>
      <div className={`sticky pl-[60px] pr-[60px] top-[70px] md:top-[144px] z-[1]`}>
        <div
          className="bg-color-ui-active z-50 fixed inset-0 pointer-events-none"
          style={{
            backgroundPosition: "top",
            maskImage: isMobile ? `linear-gradient(to bottom, white 0, white 120px, transparent 150px` : `linear-gradient(to bottom, white 0, white 200px, transparent 230px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      {/* <LabelsContainer className="fixed 2xl:hidden inset-0 flex flex-col items-center justify-center bg-color-ui-active z-[999]">
        <div className="text-forest-400 text-center font-semibold text-[20px]">
          This page is not currently supported on small screens
        </div>
        <div className="text-forest-400 text-center">
          Please view on a larger device or make your browser window wider.
        </div>
      </LabelsContainer> */}
      {/* <div className="bg-black h-10 w-32 text-white fixed top-0 left-0 z-50">
        {SparklineTimestampRange}
      </div> */}
      {/* <div className="bg-black h-10 w-32 text-white fixed top-0 left-0 z-50">
        {JSON.stringify(sort)} -  {currentMetric}
      </div> */}

      <LabelsTableContainer
        className="block"
        // className="w-full h-screen"
        // forcedMinWidth={1272 + 200}
        includeMargin={false}
        header={
          <>
            {filteredLabelsData && (
              <GridTableHeader
                className="pb-[4px] text-[12px] gap-x-[20px] z-[2]"
                // gridDefinitionColumns="pb-[4px] text-[12px] grid-cols-[15px,minmax(160px,1600px),150px,200px,105px,105px,175px,192px] gap-x-[20px] z-[2]"
                style={{
                  gridTemplateColumns: gridTemplateColumns
                }}
              >
                <div className="flex items-center justify-center"></div>
                <div
                  className="flex items-center justify-start cursor-pointer"
                  onClick={() => {
                    setSort({
                      metric: "address",
                      sortOrder:
                        sort.metric === "address"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  Contract Address
                  <Icon
                    icon={
                      sort.metric === "address" && sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    className="w-[12px] h-[12px]"
                    style={{
                      opacity: sort.metric === "address" ? 1 : 0.2,
                    }}
                  />
                </div>
                <div
                  className="flex items-center justify-start cursor-pointer"
                  onClick={() => {
                    setSort({
                      metric: "owner_project",
                      sortOrder:
                        sort.metric === "owner_project"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  <Badge
                    size="sm"
                    label="Owner Project"
                    leftIcon={null}
                    leftIconColor="#FFFFFF"
                    rightIconColor={
                      sort.metric === "owner_project" ? "#FFFFFF" : undefined
                    }
                    rightIcon={
                      sort.metric === "owner_project" &&
                        sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    rightIconSize="sm"
                    className="border border-[#5A6462]"
                  />
                </div>
                <div
                  className="flex items-center justify-start cursor-pointer"
                  onClick={() => {
                    setSort({
                      metric: "name",
                      sortOrder:
                        sort.metric === "name"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  Contract Name
                  <Icon
                    icon={
                      sort.metric === "name" && sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    className="w-[12px] h-[12px]"
                    style={{
                      opacity: sort.metric === "name" ? 1 : 0.2,
                    }}
                  />
                </div>
                {/* <div className="flex items-center justify-start">Category</div> */}
                <div
                  className="flex items-center justify-start cursor-pointer"
                  onClick={() => {
                    setSort({
                      metric: "category",
                      sortOrder:
                        sort.metric === "category"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  <Badge
                    size="sm"
                    label="Category"
                    leftIcon={null}
                    leftIconColor="#FFFFFF"
                    rightIconColor={
                      sort.metric === "category" ? "#FFFFFF" : undefined
                    }
                    rightIcon={
                      sort.metric === "category" && sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    rightIconSize="sm"
                    className="border border-[#5A6462]"
                  />
                </div>
                <div
                  className="flex items-center justify-start cursor-pointer"
                  onClick={() => {
                    setSort({
                      metric: "subcategory",
                      sortOrder:
                        sort.metric === "subcategory"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  <Badge
                    size="sm"
                    label="Subcategory"
                    leftIcon={null}
                    leftIconColor="#FFFFFF"
                    rightIconColor={
                      sort.metric === "subcategory" ? "#FFFFFF" : undefined
                    }
                    rightIcon={
                      sort.metric === "subcategory" && sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    rightIconSize="sm"
                    className="border border-[#5A6462]"
                  />
                </div>

                <div
                  className="flex items-center justify-end cursor-pointer -mr-[12px]"
                  onClick={() => {
                    setSort({
                      metric: "deployment_date",
                      sortOrder:
                        sort.metric === "deployment_date"
                          ? sort.sortOrder === "asc"
                            ? "desc"
                            : "asc"
                          : "desc",
                    });
                  }}
                >
                  Date Deployed
                  <Icon
                    icon={
                      sort.metric === "deployment_date" &&
                        sort.sortOrder === "asc"
                        ? "feather:arrow-up"
                        : "feather:arrow-down"
                    }
                    className="w-[12px] h-[12px]"
                    style={{
                      opacity: sort.metric === "deployment_date" ? 1 : 0.2,
                    }}
                  />
                </div>
                {showDeploymentTx && (
                  <div
                    className="flex items-center justify-start cursor-pointer"
                    onClick={() => {
                      setSort({
                        metric: "deployment_tx",
                        sortOrder:
                          sort.metric === "deployment_tx"
                            ? sort.sortOrder === "asc"
                              ? "desc"
                              : "asc"
                            : "desc",
                      });
                    }}
                  >
                    Deployment Tx
                    <Icon
                      icon={
                        sort.metric === "deployment_tx" &&
                          sort.sortOrder === "asc"
                          ? "feather:arrow-up"
                          : "feather:arrow-down"
                      }
                      className="w-[12px] h-[12px]"
                      style={{
                        opacity: sort.metric === "deployment_tx" ? 1 : 0.2,
                      }}
                    />
                  </div>
                )}
                {showDeployerAddress && (
                  <div
                    className="flex items-center justify-start cursor-pointer"
                    onClick={() => {
                      setSort({
                        metric: "deployer_address",
                        sortOrder:
                          sort.metric === "deployer_address"
                            ? sort.sortOrder === "asc"
                              ? "desc"
                              : "asc"
                            : "desc",
                      });
                    }}
                  >
                    Deployer Address
                    <Icon
                      icon={
                        sort.metric === "deployer_address" &&
                          sort.sortOrder === "asc"
                          ? "feather:arrow-up"
                          : "feather:arrow-down"
                      }
                      className="w-[12px] h-[12px]"
                      style={{
                        opacity: sort.metric === "deployer_address" ? 1 : 0.2,
                      }}
                    />
                  </div>
                )}
                <div className="relative flex items-center justify-end -mr-[12px]">
                  <div className=" flex items-center">
                    <div
                      className=" flex items-center cursor-pointer"
                      onClick={() => {
                        setSort({
                          metric: currentMetric,
                          sortOrder:
                            sort.metric === currentMetric
                              ? sort.sortOrder === "asc"
                                ? "desc"
                                : "asc"
                              : "desc",
                        });
                      }}
                    >
                      {metricKeysLabels[currentMetric]} (7 days)

                      <Icon
                        icon={
                          sort.metric === currentMetric &&
                            sort.sortOrder === "asc"
                            ? "feather:arrow-up"
                            : "feather:arrow-down"
                        }
                        className="w-[12px] h-[12px]"
                        style={{
                          opacity: sort.metric === currentMetric ? 1 : 0.2,
                        }}
                      />
                    </div>
                    <div
                      className="absolute left-[15px] cursor-pointer text-color-text-primary bg-color-ui-hover rounded-full pl-[1px] pr-[2px] py-[1px]"
                      onClick={handlePreviousMetric}
                    >
                      <Icon
                        icon="feather:chevron-left"
                        className="w-[13px] h-[13px]"
                      />
                    </div>
                    <div
                      className="absolute -right-[20px] cursor-pointer text-color-text-primary bg-color-ui-hover rounded-full pr-[1px] pl-[2px] py-[1px]"
                      onClick={handleNextMetric}
                    >
                      <Icon
                        icon="feather:chevron-right"
                        className="w-[13px] h-[13px]"
                      />
                    </div>
                  </div>
                </div>
              </GridTableHeader>
            )}
          </>
        }
      >
        <div ref={listRef}>
          {filteredLabelsData && (
            <div
              className="relative flex-flex-col gap-y-[3px]"
              style={{
                paddingTop,
                paddingBottom,
                height: filteredLabelsData.length * 37,
              }}
            >
              {virtualizer.getVirtualItems().map((item) => {
                return (
                  <div
                    key={item.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${item.size}px`,
                      transform: `translateY(${item.start - virtualizer.options.scrollMargin
                        }px)`,
                    }}
                  >
                    <GridTableRow
                      className="group text-[12px] h-[34px] inline-grid transition-all duration-300 gap-x-[20px] mb-[3px]"
                      // gridDefinitionColumns="grid-cols-[15px,minmax(160px,1600px),150px,200px,105px,105px,175px,192px] x-has-[span:hover]:grid-cols-[15px,minmax(390px,800px),150px,200px,105px,105px,175px,192px]"
                      style={{
                        gridTemplateColumns: gridTemplateColumns
                      }}
                    >
                      <GridTableChainIcon origin_key={filteredLabelsData[item.index].origin_key} />
                      <div className="@container flex h-full items-center hover:bg-transparent">
                        <span
                          className="@container flex-1 flex h-full items-center hover:bg-transparent pr-[10px]"
                          onDoubleClick={(e) => {
                            e.preventDefault(); // Prevent default double-click behavior
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          <div
                            className="truncate transition-all duration-300"
                            style={{ direction: 'ltr' }}
                            onClick={() => {
                              navigator.clipboard.writeText(filteredLabelsData[item.index].address)
                            }}
                          >
                            {filteredLabelsData[item.index].address.slice(0, filteredLabelsData[item.index].address.length - 6)}
                          </div>
                          <div className="transition-all duration-300">
                            {filteredLabelsData[item.index].address.slice(-6)}
                          </div>
                          <div className="pl-[10px] hidden 3xl:flex">
                            <Icon
                              icon={copiedAddress === filteredLabelsData[item.index].address ? "feather:check-circle" : "feather:copy"}
                              className="w-[14px] h-[14px] cursor-pointer"
                              onClick={() => {
                                handleCopyAddress(filteredLabelsData[item.index].address);
                              }}
                            />
                          </div>
                        </span>


                        {ownerProjectToProjectData[
                          filteredLabelsData[item.index].owner_project
                        ] && (
                            <div className="flex w-full justify-between gap-x-[5px] max-w-0 @[390px]:max-w-[100px] group-hover:max-w-[100px] overflow-hidden transition-all duration-300">
                              <div className="flex 3xl:hidden">
                                <Icon
                                  icon={copiedAddress === filteredLabelsData[item.index].address ? "feather:check-circle" : "feather:copy"}
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(filteredLabelsData[item.index].address);
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-x-[5px]">
                                <div className="h-[15px] w-[15px]">
                                  {ownerProjectToProjectData[
                                    filteredLabelsData[item.index].owner_project
                                  ][5] && (

                                      <a
                                        href={
                                          ownerProjectToProjectData[
                                          filteredLabelsData[item.index].owner_project
                                          ][5]
                                        }
                                        target="_blank"
                                        className="group flex items-center gap-x-[5px] text-xs"
                                      >

                                        <Icon
                                          icon="ri:global-line"
                                          className="w-[15px] h-[15px]"
                                        />

                                      </a>
                                    )}
                                </div>
                                <div className="h-[15px] w-[15px]">

                                  {ownerProjectToProjectData[
                                    filteredLabelsData[item.index].owner_project
                                  ][3] && (
                                      <a
                                        href={
                                          ownerProjectToProjectData[
                                          filteredLabelsData[item.index].owner_project
                                          ][3]
                                        }
                                        target="_blank"
                                        className="group flex items-center gap-x-[5px] text-xs"
                                      >
                                        <Icon
                                          icon="ri:github-fill"
                                          className="w-[15px] h-[15px]"
                                        />
                                      </a>
                                    )}
                                </div>
                                <div className="h-[15px] w-[15px]">

                                  {ownerProjectToProjectData[
                                    filteredLabelsData[item.index].owner_project
                                  ][4] && (
                                      <a
                                        href={
                                          ownerProjectToProjectData[
                                          filteredLabelsData[item.index].owner_project
                                          ][4]
                                        }
                                        target="_blank"
                                        className="group flex items-center gap-x-[5px] text-xs"
                                      >
                                        <Icon
                                          icon="ri:twitter-x-fill"
                                          className="w-[15px] h-[15px]"
                                        />
                                      </a>
                                    )}
                                </div>

                              </div>
                            </div>
                          )}

                      </div>
                      <div className="flex h-full items-center">
                        {filteredLabelsData[item.index].owner_project ? (
                          <div className="flex h-full items-center gap-x-[3px] max-w-full">

                            <Badge
                              size="sm"
                              label={
                                filteredLabelsData[item.index]
                                  .owner_project_clear
                              }
                              leftIcon={null}
                              leftIconColor="#FFFFFF"
                              rightIcon={
                                labelsFilters.owner_project.find(
                                  (f) =>
                                    f.owner_project ===
                                    filteredLabelsData[item.index]
                                      .owner_project,
                                )
                                  ? "gtp:in-button-close-monochrome"
                                  : "gtp:in-button-plus-monochrome"
                              }
                              rightIconColor={
                                labelsFilters.owner_project.find(
                                  (f) =>
                                    f.owner_project ===
                                    filteredLabelsData[item.index]
                                      .owner_project,
                                )
                                  ? "#FE5468"
                                  : undefined
                              }
                              onClick={() =>
                                handleFilter("owner_project", {
                                  owner_project:
                                    filteredLabelsData[item.index]
                                      .owner_project,
                                  owner_project_clear:
                                    filteredLabelsData[item.index]
                                      .owner_project_clear,
                                })
                              }
                            />

                          </div>
                        ) : (
                          <GTPTooltipNew
                            placement="bottom-start"
                            allowInteract={true}
                            trigger={
                              <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px] cursor-pointer select-none">
                                Not Available
                              </div>
                            }
                            containerClass="flex flex-col gap-y-[10px]"
                            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                          >
                            <OLIContractTooltip 
                              icon="gtp-project-monochrome" 
                              iconClassName="text-[#5A6462]" 
                              project_name="Not Available" 
                              message="Project information not available."
                              contractAddress={filteredLabelsData[item.index].address}
                              chain={filteredLabelsData[item.index].origin_key}
                            />
                          </GTPTooltipNew>
                        )}
                      </div>

                      <div>
                        {filteredLabelsData[item.index].name ? (
                          <div className="flex h-full items-center gap-x-[3px]">
                            <div className="truncate">
                              {filteredLabelsData[item.index].name}
                            </div>
                            {labelsFilters.name.includes(
                              filteredLabelsData[item.index].name,
                            ) ? (
                              <RemoveIcon
                                onClick={() =>
                                  handleFilter(
                                    "name",
                                    filteredLabelsData[item.index].name,
                                  )
                                }
                              />
                            ) : (
                              <AddIcon
                                onClick={() =>
                                  handleFilter(
                                    "name",
                                    filteredLabelsData[item.index].name,
                                  )
                                }
                              />
                            )}
                          </div>
                        ) : (
                          <GTPTooltipNew
                            placement="bottom-start"
                            allowInteract={true}
                            trigger={
                              <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px] cursor-pointer select-none">
                                Not Available
                              </div>
                            }
                            containerClass="flex flex-col gap-y-[10px]"
                            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                          >
                            <OLIContractTooltip 
                              icon="gtp-project-monochrome" 
                              iconClassName="text-[#5A6462]" 
                              project_name="Not Available" 
                              message="Contract information not available."
                              contractAddress={filteredLabelsData[item.index].address}
                              chain={filteredLabelsData[item.index].origin_key}
                            />
                          </GTPTooltipNew>
                        )}
                      </div>

                      {/* <div className="flex h-full items-center gap-x-[3px]">
                        <div>{master?.blockspace_categories.main_categories[subcategoryToCategoryMapping[filteredLabelsData[item.index].usage_category]]}</div>
                        {filteredLabelsData[item.index].usage_category && <AddIcon />}
                      </div> */}

                      <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap">
                        <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap max-w-[100%] hover:max-w-[300px] transition-all duration-300 z-10">
                          {filteredLabelsData[item.index].usage_category && (
                            <Badge
                              size="sm"
                              label={
                                master?.blockspace_categories.main_categories[
                                subcategoryToCategoryMapping[
                                filteredLabelsData[item.index].usage_category
                                ]
                                ]
                              }
                              leftIcon={
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M12 6.00019C12 9.314 9.31371 12.0004 6 12.0004C2.68629 12.0004 0 9.314 0 6.00019C0 2.68638 2.68629 0 6 0C9.31371 0 12 2.68638 12 6.00019ZM7.34382 10.8177C6.91622 10.9367 6.46554 11.0003 6 11.0003C5.33203 11.0003 4.69465 10.8694 4.11215 10.6317C4.82952 10.506 5.65961 10.2499 6.53205 9.8741C6.7696 10.2694 7.04371 10.5905 7.34382 10.8177ZM1 6.00123C1.00023 7.11395 1.36391 8.14173 1.97878 8.97232C2.14906 8.66364 2.4013 8.33202 2.72307 7.99134C1.96571 7.38585 1.37599 6.69891 1 6.00123ZM3.44466 1.70145C4.19246 1.25594 5.06635 1.00003 6 1.00003C6.46554 1.00003 6.91622 1.06366 7.34382 1.18269C7.05513 1.40121 6.79049 1.70664 6.55933 2.08148C5.45843 1.72166 4.37921 1.59964 3.44466 1.70145ZM7.05278 3.3415C6.84167 3.89095 6.68872 4.55609 6.62839 5.2961C7.42655 4.91981 8.20029 4.63928 8.89799 4.46243C8.42349 4.07705 7.86331 3.72077 7.22925 3.42222C7.17039 3.39451 7.11156 3.36761 7.05278 3.3415ZM7.5113 2.45111C7.55931 2.47277 7.60729 2.49489 7.65523 2.51746C8.55899 2.943 9.34518 3.48234 9.97651 4.07822C9.85526 3.5862 9.69097 3.15297 9.49943 2.79723C9.06359 1.98779 8.62905 1.80006 8.4 1.80006C8.20804 1.80006 7.87174 1.93192 7.5113 2.45111ZM10.1994 5.89963C10.1998 5.93304 10.2 5.96655 10.2 6.00019C10.2 6.08685 10.1987 6.17275 10.1962 6.25783C9.55723 6.9422 8.55121 7.71298 7.30236 8.38912C7.2045 8.4421 7.10697 8.49352 7.00987 8.54336C6.79529 7.94561 6.64842 7.22163 6.60999 6.41969C7.78713 5.81519 8.90057 5.44121 9.76216 5.30205C9.90504 5.47067 10.0322 5.64082 10.1428 5.81054C10.1623 5.84042 10.1811 5.87012 10.1994 5.89963ZM9.75092 8.64922C9.46563 8.78698 9.10753 8.88983 8.66956 8.93957C8.55374 8.95273 8.43432 8.96175 8.31169 8.96653C8.94406 8.59205 9.51568 8.19342 10.0072 7.7922C9.93735 8.10093 9.8507 8.38805 9.75092 8.64922ZM7.88025 9.96684C8.26764 9.97979 8.63918 9.9592 8.98795 9.90588C8.74757 10.1331 8.53702 10.2003 8.4 10.2003C8.2761 10.2003 8.09208 10.1454 7.88025 9.96684ZM6.11653 2.99003C5.17456 2.69987 4.27867 2.61313 3.53224 2.69791C2.47745 2.81771 1.88588 3.24554 1.65906 3.72727C1.43225 4.209 1.47937 4.93756 2.059 5.82694C2.38732 6.33071 2.86134 6.83828 3.4599 7.29837C4.05658 6.79317 4.78328 6.28844 5.60152 5.82713C5.62011 4.77164 5.80805 3.7957 6.11653 2.99003ZM3.54862 8.57586C3.47564 8.64993 3.40675 8.72315 3.3421 8.79529C3.0225 9.15193 2.84429 9.44047 2.76697 9.63864C2.76137 9.653 2.75652 9.66623 2.75232 9.67838C2.76479 9.68151 2.77852 9.68468 2.79361 9.68784C3.00181 9.73142 3.34083 9.73992 3.81416 9.66726C4.19302 9.6091 4.62225 9.50457 5.08534 9.35405C4.9056 9.28242 4.72583 9.20443 4.54657 9.12002C4.19544 8.95469 3.86206 8.77218 3.54862 8.57586ZM5.97884 8.61386C5.64712 8.50665 5.3102 8.37424 4.97255 8.21526C4.74853 8.10978 4.53373 7.99709 4.32867 7.87846C4.7138 7.5704 5.15661 7.25944 5.64755 6.9595C5.70709 7.55249 5.82082 8.11007 5.97884 8.61386Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              }
                              leftIconColor="#FFFFFF"
                              rightIcon={
                                labelsFilters.category.includes(
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index].usage_category
                                  ],
                                )
                                  ? "gtp:in-button-close-monochrome"
                                  : "gtp:in-button-plus-monochrome"
                              }
                              rightIconColor={
                                labelsFilters.category.includes(
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index].usage_category
                                  ],
                                )
                                  ? "#FE5468"
                                  : undefined
                              }
                              onClick={() =>
                                handleFilter(
                                  "category",
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index].usage_category
                                  ],
                                )
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex h-full items-center gap-x-[3px]">
                        <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap max-w-[100%] hover:max-w-[300px] transition-all duration-300 z-10">
                          {filteredLabelsData[item.index].usage_category && (
                            <Badge
                              size="sm"
                              label={
                                master?.blockspace_categories.sub_categories[
                                filteredLabelsData[item.index].usage_category
                                ]
                              }
                              leftIcon={null}
                              leftIconColor="#FFFFFF"
                              rightIcon={
                                labelsFilters.subcategory.includes(
                                  filteredLabelsData[item.index].usage_category,
                                )
                                  ? "gtp:in-button-close-monochrome"
                                  : "gtp:in-button-plus-monochrome"
                              }
                              rightIconColor={
                                labelsFilters.subcategory.includes(
                                  filteredLabelsData[item.index].usage_category,
                                )
                                  ? "#FE5468"
                                  : undefined
                              }
                              onClick={() =>
                                handleFilter(
                                  "subcategory",
                                  filteredLabelsData[item.index].usage_category,
                                )
                              }
                            />
                          )}
                        </div>
                        {/* {filteredLabelsData[item.index].usage_category && <Badge size="sm" label={master?.blockspace_categories.sub_categories[filteredLabelsData[item.index].usage_category]} leftIcon={null} leftIconColor="#FFFFFF" rightIcon="in-button-plus-monochrome" />} */}
                      </div>

                      <div className="flex h-full items-center justify-end gap-x-[3px]">
                        {filteredLabelsData[item.index].deployment_date && (
                          <div className="flex items-center gap-x-[3px]">
                            <div>
                              {new Date(
                                filteredLabelsData[item.index].deployment_date,
                              ).toLocaleDateString("en-GB", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            {/* <AddIcon /> */}
                          </div>
                        )}
                      </div>
                      {showDeploymentTx && (
                        <div
                          className="@container flex-1 flex h-full items-center hover:bg-transparent pr-[10px] text-[11px]"
                          onDoubleClick={(e) => {
                            e.preventDefault(); // Prevent default double-click behavior
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          {filteredLabelsData[item.index].deployment_tx && (
                            <>
                              <div
                                className="truncate transition-all duration-300"
                                style={{ direction: 'ltr' }}
                                onClick={() => {
                                  navigator.clipboard.writeText(filteredLabelsData[item.index].deployment_tx)
                                }}
                              >
                                {filteredLabelsData[item.index].deployment_tx.slice(0, filteredLabelsData[item.index].deployment_tx.length - 6)}
                              </div>
                              <div className="transition-all duration-300">
                                {filteredLabelsData[item.index].deployment_tx.slice(-6)}
                              </div>
                              <div className="pl-[10px]">
                                <Icon
                                  icon={copiedAddress === filteredLabelsData[item.index].deployment_tx ? "feather:check-circle" : "feather:copy"}
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(filteredLabelsData[item.index].deployment_tx);
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {showDeployerAddress && (
                        <div
                          className="@container flex-1 flex h-full items-center hover:bg-transparent pr-[10px] text-[11px]"
                          onDoubleClick={(e) => {
                            e.preventDefault(); // Prevent default double-click behavior
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          {filteredLabelsData[item.index].deployer_address && (
                            <>
                              <div
                                className="truncate transition-all duration-300"
                                style={{ direction: 'ltr' }}
                                onClick={() => {
                                  navigator.clipboard.writeText(filteredLabelsData[item.index].deployer_address)
                                }}
                              >
                                {filteredLabelsData[item.index].deployer_address.slice(0, filteredLabelsData[item.index].deployer_address.length - 6)}
                              </div>
                              <div className="transition-all duration-300">
                                {filteredLabelsData[item.index].deployer_address.slice(-6)}
                              </div>
                              <div className="pl-[10px]">
                                <Icon
                                  icon={copiedAddress === filteredLabelsData[item.index].deployer_address ? "feather:check-circle" : "feather:copy"}
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(filteredLabelsData[item.index].deployer_address);
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between pl-[20px]">
                        <div className="relative flex h-[20px] justify-between w-full">
                          <SVGSparklineProvider
                            key={`${filteredLabelsData[item.index].origin_key}_${filteredLabelsData[item.index].address}`}
                            isDBLoading={false}
                            minUnix={SparklineTimestampRange[0]}
                            maxUnix={SparklineTimestampRange[1]}
                            data={sparklineLabelsData && sparklineLabelsData.data[
                              `${filteredLabelsData[item.index].origin_key}_${filteredLabelsData[item.index].address
                              }`
                            ] ? sparklineLabelsData.data[
                              `${filteredLabelsData[item.index].origin_key}_${filteredLabelsData[item.index].address
                              }`
                            ].sparkline.map((d) => [d[sparklineLabelsData.data.types.indexOf("unix")], d[sparklineLabelsData.data.types.indexOf(currentMetric)]]) : []}
                            change={
                              filteredLabelsData[item.index][
                              `${currentMetric}_change`
                              ]
                            }
                            value={
                              filteredLabelsData[item.index][currentMetric]
                            }
                            valueType={
                              currentMetric
                            }
                          >
                            <LabelsSVGSparkline chainKey={filteredLabelsData[item.index].origin_key} />
                          </SVGSparklineProvider>
                        </div>
                      </div>
                    </GridTableRow>
                  </div>
                )
              })}
            </div>
          )}
        </div >

        {/* </div> */}
      </LabelsTableContainer >
      {/* </div> */}

      <Footer downloadCSV={downloadCSV} downloadJSON={downloadJSON} />
    </>
  );
}

// type GridTableProps = {
//   gridDefinitionColumns: string;
//   className?: string;
//   children: React.ReactNode;
//   style?: React.CSSProperties;
// };

// // grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// // class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"
// const GridTableHeader = ({
//   children,
//   gridDefinitionColumns,
//   className,
//   style,
// }: GridTableProps) => {
//   return (
//     <div
//       className={`select-none gap-x-[10px] pl-[10px] pr-[32px] pt-[30px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns} ${className}`}
//       style={style}
//     >
//       {children}
//     </div>
//   );
// };

// // grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// // class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
// const GridTableRow = ({
//   children,
//   gridDefinitionColumns,
//   className,
//   style,
// }: GridTableProps) => {
//   return (
//     <div
//       className={`select-text gap-x-[10px] pl-[10px] pr-[32px] py-[5px] text-xs items-center rounded-full border border-forest-900/20 dark:border-forest-500/20 grid ${gridDefinitionColumns} ${className}`}
//       style={style}
//     >
//       {children}
//     </div>
//   );
// };

const LabelsSparkline = ({ chainKey }: { chainKey: string }) => {
  const { data, change, value, valueType, hoverDataPoint, setHoverDataPoint, isDBLoading } = useCanvasSparkline();
  const { formatMetric } = useMaster();

  return (
    <>
      {isDBLoading ?
        <div className="relative flex items-center justify-center text-[#5A6462] text-[10px] w-[100px] h-full">
          Loading Chart
        </div> :
        <CanvasSparkline chainKey={chainKey} />
      }
      {hoverDataPoint ? (
        <div
          className="flex flex-col justify-center items-end numbers-xs"
        >
          <div className="min-w-[55px] text-right" >
            {hoverDataPoint[1] && formatMetric(hoverDataPoint[1], valueType)}
          </div>
          <div className={`text-[9px] text-right leading-[1] text-forest-400`}>{new Date(hoverDataPoint[0]).toLocaleDateString("en-GB",
            {
              month: "short",
              day: "numeric",
              year: "numeric"
            }
          )}</div>
        </div>
      ) : (
        <div
          className="flex flex-col justify-center items-end numbers-xs"
        >
          <div className="min-w-[55px] text-right">
            {formatMetric(value, valueType)}
          </div>
          {(change === null || parseFloat((change * 100).toFixed(0)) === "0") && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#CDD8D399] font-normal`}
            >
              {change === null && "—"}
              {change !== null && "0.0%"}
            </div>
          )}
          {(change !== null && parseFloat((change * 100).toFixed(1)) > 0) && (
            <div
              className={`text-[9px] text-right leading-[1] text-color-accent-turquoise font-normal`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </div>
          )}
          {(change !== null && parseFloat((change * 100).toFixed(1)) < 0) && (
            <div
              className={`text-[9px] text-right leading-[1] text-color-accent-red font-semibold`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </div>
          )}
          {/* <div
            className={`text-[9px] text-right leading-[1] ${change > 0
              ? "text-color-accent-turquoise font-normal"
              : "text-color-accent-red font-semibold "
              }`}
          >
            {change > 0 && "+"}
            {formatNumber(change * 100, true, false)}%
          </div> */}
        </div>
      )}
    </>
  );
};

const LabelsSVGSparkline = ({ chainKey }: { chainKey: string }) => {
  const { data, change, value, valueType, hoverDataPoint, setHoverDataPoint, isDBLoading } = useSVGSparkline();
  const { formatMetric } = useMaster();

  return (
    <>
      {isDBLoading ?
        <div className="relative flex items-center justify-center text-[#5A6462] text-[10px] w-[100px] h-full">
          Loading Chart
        </div> :
        <SVGSparkline chainKey={chainKey} />
      }
      {hoverDataPoint ? (
        <div
          className="flex flex-col justify-center items-end numbers-xs"
          
        >
          <div className="min-w-[55px] text-right" >
            {hoverDataPoint[1] && formatMetric(hoverDataPoint[1], valueType)}
          </div>
          <div className={`text-[9px] text-right leading-[1] text-forest-400`}>{new Date(hoverDataPoint[0]).toLocaleDateString("en-GB",
            {
              month: "short",
              day: "numeric",
              year: "numeric"
            }
          )}</div>
        </div>
      ) : (
        <div
          className="flex flex-col justify-center items-end numbers-xs"
        >
          <div className="min-w-[55px] text-right">
            {formatMetric(value, valueType)}
          </div>
          {(change === null || parseFloat((change * 100).toFixed(0)) === "0") && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#CDD8D399] font-normal`}
            >
              {change === null && "—"}
              {change !== null && "0.0%"}
            </div>
          )}
          {(change !== null && parseFloat((change * 100).toFixed(1)) > 0) && (
            <div
              className={`text-[9px] text-right leading-[1] text-color-accent-turquoise font-normal`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </div>
          )}
          {(change !== null && parseFloat((change * 100).toFixed(1)) < 0) && (
            <div
              className={`text-[9px] text-right leading-[1] text-color-accent-red font-semibold`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </div>
          )}
          {/* <div
            className={`text-[9px] text-right leading-[1] ${change > 0
              ? "text-color-accent-turquoise font-normal"
              : "text-color-accent-red font-semibold "
              }`}
          >
            {change > 0 && "+"}
            {formatNumber(change * 100, true, false)}%
          </div> */}
        </div>
      )}
    </>
  );
};

const WorldIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.52757 1.86364C4.12609 1.86364 1.36865 4.61098 1.36865 8C1.36865 11.389 4.12609 14.1364 7.52757 14.1364C10.9291 14.1364 13.6865 11.389 13.6865 8C13.6865 4.61098 10.9291 1.86364 7.52757 1.86364ZM0 8C0 3.85786 3.37021 0.5 7.52757 0.5C11.6849 0.5 15.0551 3.85786 15.0551 8C15.0551 12.1421 11.6849 15.5 7.52757 15.5C3.37021 15.5 0 12.1421 0 8Z"
      fill="#CDD8D3"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0 8C0 7.62344 0.306383 7.31818 0.684325 7.31818H14.3708C14.7488 7.31818 15.0551 7.62344 15.0551 8C15.0551 8.37656 14.7488 8.68182 14.3708 8.68182H0.684325C0.306383 8.68182 0 8.37656 0 8Z"
      fill="#CDD8D3"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.47476 8C5.52166 10.0965 6.24532 12.1149 7.52757 13.7608C8.80982 12.1149 9.53349 10.0965 9.58039 8C9.53349 5.90352 8.80982 3.88512 7.52757 2.23918C6.24532 3.88512 5.52166 5.90352 5.47476 8ZM7.52757 1.18182L7.02231 0.721984C5.19874 2.71107 4.16242 5.2924 4.1061 7.9858C4.1059 7.99527 4.1059 8.00473 4.1061 8.0142C4.16242 10.7076 5.19874 13.2889 7.02231 15.278C7.15196 15.4194 7.33533 15.5 7.52757 15.5C7.71981 15.5 7.90319 15.4194 8.03284 15.278C9.85641 13.2889 10.8927 10.7076 10.949 8.0142C10.9492 8.00473 10.9492 7.99527 10.949 7.9858C10.8927 5.2924 9.85641 2.71107 8.03284 0.721984L7.52757 1.18182Z"
      fill="#CDD8D3"
    />
  </svg>
);

const XIcon = () => (
  <svg
    width="15"
    height="16"
    viewBox="0 0 15 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.51237 6.85148L13.8026 0.5H12.549L7.95548 6.0149L4.28669 0.5H0.0551758L5.60311 8.8395L0.0551758 15.5H1.30885L6.15968 9.67608L10.0342 15.5H14.2657L8.51237 6.85148ZM6.79529 8.91297L6.23317 8.08255L1.76057 1.47476H3.68614L7.29558 6.80746L7.8577 7.63788L12.5495 14.5696H10.624L6.79529 8.91297Z"
      fill="#CDD8D3"
    />
  </svg>
);
