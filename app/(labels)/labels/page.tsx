//@ts-nocheck
"use client";
import LabelsContainer from "@/components/layout/LabelsContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
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
} from "@/types/api/LabelsResponse";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { uniqBy } from "lodash";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import SVGSparkline, {
  SVGSparklineProvider,
  useSVGSparkline,
} from "./SVGSparkline";
import { useLabelsPage } from "./LabelsContext";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import Link from "next/link";

import { GridTableChainIcon } from "@/components/layout/GridTable";
import { GTPIcon } from "@/components/layout/GTPIcon";

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
  const { setDownloadData, tableRef } = useLabelsPage();
  const { is2XL, isMobile } = useUIContext();
  const showGwei = true;
  const showCents = true;

  const { formatMetric } = useMaster();

  //True is default descending false ascending
  // const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const [showDeploymentTx, setShowDeploymentTx] = useSessionStorage(
    "labels::showDeploymentTx",
    false,
  );

  const [showDeployerAddress, setShowDeployerAddress] = useSessionStorage(
    "labels::showDeployerAddress",
    false,
  );

  const [allowDownloadData, setAllowDownloadData] = useSessionStorage(
    "labels::allowDownloadData",
    false,
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
      setSort((prev) => ({
        ...prev,
        metric: currentMetric,
      }));
    }
  }, [currentMetric, sort, setSort]);

  // const [metricIndex, setMetricIndex] = useState(0);
  // const [metricChangeIndex, setMetricChangeIndex] = useState(0);

  const [labelsNumberFiltered, setLabelsNumberFiltered] =
    useSessionStorage<number>("labelsNumberFiltered", 300);

  const [labelsFilters, setLabelsFilters] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
    deployer_address: string[];
    txcount: number[];
    txcount_change: number[];
    gas_fees_usd: number[];
    gas_fees_usd_change: number[];
    daa: number[];
    daa_change: number[];
  }>("labelsFiltersObj", {
    address: [],
    origin_key: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
    deployer_address: [],
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

  const [labelsDeployerAddresses, setLabelsDeployerAddresses] =
    useSessionStorage<string[]>("labelsDeployerAddresses", []);

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
          rows = rows.filter(
            (label) =>
              all_usage_categories.includes(label.usage_category) ||
              label.usage_category === null,
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

    if (
      labelsFilters.deployer_address &&
      labelsFilters.deployer_address.length > 0
    ) {
      rows = rows.filter((label) =>
        labelsFilters.deployer_address.includes(label.deployer_address),
      );
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
      [
        "owner_project",
        "address",
        "name",
        "category",
        "subcategory",
        "deployment_tx",
        "deployer_address",
      ].includes(sort.metric)
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
    if (!fullLabelsData) return;

    const uniqueOwnerProjects = uniqBy(
      fullLabelsData.data
        .filter((label) => label.owner_project && label.owner_project !== "")
        .map((label) => ({
          owner_project: label.owner_project,
          owner_project_clear: label.owner_project_clear || label.owner_project,
        }))
        .sort((a, b) =>
          a.owner_project_clear.localeCompare(b.owner_project_clear),
        ),
      "owner_project",
    );

    setLabelsOwnerProjects(uniqueOwnerProjects);

    const uniqueDeployerAddresses = uniqBy(
      fullLabelsData.data
        .filter(
          (label) => label.deployer_address && label.deployer_address !== "",
        )
        .map((label) => label.deployer_address)
        .sort((a, b) => a.localeCompare(b)),
      (a) => a,
    );

    setLabelsDeployerAddresses(uniqueDeployerAddresses);
  }, [
    fullLabelsData,
    data,
    setLabelsDeployerAddresses,
    setLabelsOwnerProjects,
  ]);

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
      if (
        key === "owner_project" &&
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof key === "string"
      ) {
        setLabelsFilters({
          ...labelsFilters,
          owner_project: labelsFilters[key].find(
            (f) => f.owner_project === value["owner_project"],
          )
            ? labelsFilters[key].filter(
              (f) => f.owner_project !== value["owner_project"],
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
      const timestamps = data.map(
        (row) => row[sparklineLabelsData.data.types.indexOf("unix")],
      );

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
    let cols = [
      "15px",
      "minmax(150px, 350px)",
      "225px",
      "180px",
      "120px",
      "120px",
      "125px",
      "185px",
    ];
    let colsLarge = [
      "15px",
      "minmax(150px, 350px)",
      "225px",
      "180px",
      "120px",
      "120px",
      "125px",
      "185px",
    ];

    if (showDeploymentTx && showDeployerAddress) {
      cols = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "115px",
        "185px",
      ];
      colsLarge = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "115px",
        "185px",
      ];
    } else if (showDeploymentTx) {
      cols = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "185px",
      ];
      colsLarge = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "185px",
      ];
    } else if (showDeployerAddress) {
      cols = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "185px",
      ];
      colsLarge = [
        "15px",
        "minmax(150px, 350px)",
        "215px",
        "180px",
        "120px",
        "120px",
        "125px",
        "120px",
        "185px",
      ];
    }

    if (is2XL) return colsLarge.join(" ");

    return cols.join(" ");
  }, [is2XL, showDeployerAddress, showDeploymentTx]);

  // const downloadCSV = useCallback(() => {
  //   // compile CSV from data w/ headers
  //   const headers = [
  //     "Contract Address",
  //     "Chain ID",
  //     "Owner Project",
  //     "Contract Name",
  //     "Category",
  //     "Subcategory",
  //     "Deployment Date",
  //     "Transaction Count",
  //     "Gas Fees",
  //     "Active Addresses",
  //     // "Origin Key",

  //     "Deployment Tx",
  //     "Deployer Address",
  //   ];

  //   const rows = filteredLabelsData.map((label) => {
  //     return [
  //       label.address,
  //       label.chain_id,
  //       label.owner_project,
  //       label.name,
  //       label.category,
  //       label.subcategory,
  //       label.deployment_date,
  //       label.txcount,
  //       label.gas_fees_usd,
  //       label.daa,
  //       // label.origin_key,

  //       label.deployment_tx,
  //       label.deployer_address,
  //     ];
  //   });

  //   const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

  //   const blob = new Blob([csv], { type: "text/csv" });

  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement
  //     ("a");
  //   a.href = url;
  //   a.download = "labels.csv";
  //   a.click();
  //   URL.revokeObjectURL(url);
  // }, [filteredLabelsData]);

  // const downloadJSON = useCallback(() => {
  //   const json = JSON.stringify(filteredLabelsData, null, 2);

  //   const blob = new Blob([json], { type: "application/json" });

  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "labels.json";
  //   a.click();
  //   URL.revokeObjectURL(url);
  // }, [filteredLabelsData]);

  useEffect(() => {
    setDownloadData(filteredLabelsData);
  }, [filteredLabelsData, setDownloadData]);

  // const addressFirstRef = useRef<HTMLDivElement>(null);
  const [addressRef, { width: addressWidth }] =
    useElementSizeObserver<HTMLDivElement>();

  const numAddressChars = useMemo(() => {
    return Math.min(Math.floor((addressWidth - 24) / 7.2) - 6, 42 - 6);
  }, [addressWidth, showDeployerAddress, showDeploymentTx]);

  const getProjectTwitterLink = useCallback(
    (ownerProject: string) => {
      if (!ownerProjectToProjectData[ownerProject]) return "";
      const twitter = ownerProjectToProjectData[ownerProject][4];

      // if includes "https://" or "http://" then return the link
      if (twitter.includes("https://") || twitter.includes("http://"))
        return twitter;

      return `https://x.com/${twitter}`;
    },
    [ownerProjectToProjectData],
  );

  

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, quickLabelsLoading]}
        dataValidating={[masterValidating, quickLabelsLoading]}
      />

      {/* {master && <Header downloadCSV={downloadCSV} downloadJSON={downloadJSON} />} */}

      {/* <div className="relative pb-[114px] pt-[140px]"> */}
      <LabelsContainer className="pt-[110px] md:pt-[175px] flex items-end sm:items-center justify-between md:justify-start gap-x-[10px] z-[21]">
        <h1 className="text-[20px] md:text-[30px] pl-[15px] leading-[120%] font-bold z-[19]">
          Smart Contracts in the Ethereum Ecosystem
        </h1>
      </LabelsContainer>
      <div
        className={`sticky pl-[60px] pr-[60px] top-[70px] md:top-[144px] z-[1]`}
      >
        <div
          className="bg-[#151a19] z-50 fixed inset-0 pointer-events-none"
          style={{
            backgroundPosition: "top",
            maskImage: isMobile
              ? `linear-gradient(to bottom, white 0, white 120px, transparent 150px`
              : `linear-gradient(to bottom, white 0, white 200px, transparent 230px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <LabelsTableContainer
        ref={tableRef}
        className="block mx-auto"
        includeMargin={false}
        header={
          <>
            {filteredLabelsData && (
              <GridTableHeader
                className="pb-[4px] text-[12px] gap-x-[20px] z-[2]"
                style={{
                  gridTemplateColumns: gridTemplateColumns,
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
                      className="absolute left-[15px] cursor-pointer text-[#CDD8D3] bg-[#5A6462] rounded-full pl-[1px] pr-[2px] py-[1px]"
                      onClick={handlePreviousMetric}
                    >
                      <Icon
                        icon="feather:chevron-left"
                        className="w-[13px] h-[13px]"
                      />
                    </div>
                    <div
                      className="absolute -right-[18px] cursor-pointer text-[#CDD8D3] bg-[#5A6462] rounded-full pr-[1px] pl-[2px] py-[1px]"
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
              {virtualizer.getVirtualItems().map((item, index) => {
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
                      style={{
                        gridTemplateColumns: gridTemplateColumns,
                      }}
                    >
                      <GridTableChainIcon origin_key={filteredLabelsData[item.index].origin_key} />
                      <div
                        className="flex h-full items-center hover:bg-transparent"
                        ref={index === 0 ? addressRef : undefined}
                      >
                        <span
                          className="@container flex-1 flex h-full items-center hover:bg-transparent pr-[10px] font-mono select-none"
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
                            className={`flex transition-all duration-300 ${numAddressChars === 42 - 6
                              ? ""
                              : "font-semibold bg-[linear-gradient(90deg,#CDD8D3_calc(100%-17px),transparent_100%)] bg-clip-text text-transparent backface-visibility-hidden"
                              }  `}
                            style={{
                              direction: "ltr",
                              textOverflow: ". !important",
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(
                                filteredLabelsData[item.index].address,
                              );
                            }}
                          >
                            {filteredLabelsData[item.index].address.slice(
                              0,
                              numAddressChars,
                            )}
                          </div>
                          <div
                            className={`relative h-full flex items-center text-[#CDD8D333] ${numAddressChars === 42 - 6 && "!hidden"
                              }`}
                          >
                            &hellip;
                          </div>
                          <div
                            className={`transition-all duration-300  ${numAddressChars === 42 - 6
                              ? ""
                              : "font-semibold bg-[linear-gradient(-90deg,#CDD8D3_calc(100%-17px),transparent_100%)] bg-clip-text text-transparent backface-visibility-hidden"
                              } `}
                          >
                            {filteredLabelsData[item.index].address.slice(-6)}
                          </div>
                          <div className="pl-[10px] flex">
                            <Icon
                              icon={
                                copiedAddress ===
                                  filteredLabelsData[item.index].address
                                  ? "feather:check-circle"
                                  : "feather:copy"
                              }
                              className="w-[14px] h-[14px] cursor-pointer"
                              onClick={() => {
                                handleCopyAddress(
                                  filteredLabelsData[item.index].address,
                                );
                              }}
                            />
                          </div>
                        </span>
                      </div>
                      <div className="flex h-full items-center justify-between w-full">
                        {filteredLabelsData[item.index].owner_project ? (
                          <>
                            <div className="flex h-full items-center gap-x-[3px] max-w-full">
                              <Tooltip placement="right" allowInteract>
                                <TooltipTrigger className="max-w-full">
                                  <Badge
                                    size="sm"
                                    className="max-w-[155px]"
                                    truncateStyle="end"
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
                                        ? "heroicons-solid:x-circle"
                                        : "heroicons-solid:plus-circle"
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
                                </TooltipTrigger>
                                {ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                ] &&
                                  (ownerProjectToProjectData[
                                    filteredLabelsData[item.index].owner_project
                                  ][2] ||
                                    ownerProjectToProjectData[
                                    filteredLabelsData[item.index]
                                      .owner_project
                                    ][4] ||
                                    ownerProjectToProjectData[
                                    filteredLabelsData[item.index]
                                      .owner_project
                                    ][5]) && (
                                    <TooltipContent className="relativeflex flex-col items-start justify-center gap-y-[5px] rounded-[10px] p-2.5 bg-[#151a19] border border-[#5A6462] z-[19] max-w-[300px]">
                                      <div className="absolute top-[calc(50%-4px)] -left-1 w-2 h-2 bg-[#151a19]  border-[#5A6462] border border-r-0 border-t-0 transform rotate-45"></div>
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][2] && (
                                          <div className="flex items-center text-xs pb-1">{`${ownerProjectToProjectData[
                                            filteredLabelsData[item.index]
                                              .owner_project
                                          ][2]
                                            }`}</div>
                                        )}
                                      {/* website */}
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][5] && (
                                          <Link
                                            href={
                                              ownerProjectToProjectData[
                                              filteredLabelsData[item.index]
                                                .owner_project
                                              ][5]
                                            }
                                            target="_blank"
                                            className="group flex items-center gap-x-[5px] text-xs"
                                          >
                                            <div className="w-[12px] h-[12px]">
                                              <Icon
                                                icon="feather:globe"
                                                className="w-[12px] h-[12px]"
                                              />
                                            </div>
                                            <div className="group-hover:underline">
                                              {
                                                ownerProjectToProjectData[
                                                filteredLabelsData[item.index]
                                                  .owner_project
                                                ][5]
                                              }
                                            </div>
                                          </Link>
                                        )}

                                      {/* github */}
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][3] && (
                                          <Link
                                            href={`https://github.com/${ownerProjectToProjectData[
                                              filteredLabelsData[item.index]
                                                .owner_project
                                            ][3]
                                              }/`}
                                            target="_blank"
                                            className="group flex items-center gap-x-[5px] text-xs"
                                          >
                                            <div className="w-[12px] h-[12px]">
                                              <Icon
                                                icon="ri:github-fill"
                                                className="w-[12px] h-[12px]"
                                              />
                                            </div>
                                            <div className="group-hover:underline">
                                              {
                                                ownerProjectToProjectData[
                                                filteredLabelsData[item.index]
                                                  .owner_project
                                                ][3]
                                              }
                                            </div>
                                          </Link>
                                        )}

                                      {/* twitter */}
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][4] && (
                                          <div className="flex items-center">
                                            <Link
                                              href={getProjectTwitterLink(
                                                filteredLabelsData[item.index]
                                                  .owner_project
                                              )}
                                              target="_blank"
                                              className="group flex items-center gap-x-[5px] text-xs"
                                            >
                                              <div className="w-[12px] h-[12px]">
                                                <Icon
                                                  icon="prime:twitter"
                                                  className="w-[12px] h-[12px]"
                                                />
                                              </div>
                                              <div className="group-hover:underline">
                                                {
                                                  ownerProjectToProjectData[
                                                  filteredLabelsData[item.index]
                                                    .owner_project
                                                  ][4]
                                                }
                                              </div>
                                            </Link>
                                          </div>
                                        )}
                                    </TooltipContent>
                                  )}
                              </Tooltip>
                            </div>
                            <div className="flex justify-between gap-x-[5px] xmax-w-0 @[390px]:max-w-[100px] xgroup-hover:max-w-[100px] overflow-hidden transition-all duration-300">
                              <div className="flex items-center gap-x-[5px]">
                                {ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                ] &&
                                  ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                  ][5] && (
                                    <div className="h-[15px] w-[15px]">
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][5] && (
                                          <a
                                            href={
                                              ownerProjectToProjectData[
                                              filteredLabelsData[item.index]
                                                .owner_project
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
                                  )}
                                {ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                ] &&
                                  ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                  ][3] && (
                                    <div className="h-[15px] w-[15px]">
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][3] && (
                                          <a
                                            href={`https://github.com/${ownerProjectToProjectData[
                                              filteredLabelsData[item.index]
                                                .owner_project
                                            ][3]
                                              }/`}
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
                                  )}
                                {ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                ] &&
                                  ownerProjectToProjectData[
                                  filteredLabelsData[item.index].owner_project
                                  ][4] && (
                                    <div className="h-[15px] w-[15px]">
                                      {ownerProjectToProjectData[
                                        filteredLabelsData[item.index]
                                          .owner_project
                                      ][4] && (
                                          <a
                                            href={getProjectTwitterLink(
                                              filteredLabelsData[item.index]
                                                .owner_project,
                                            )}
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
                                  )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px]">
                            Not Available
                          </div>
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
                          <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px]">
                            Not Available
                          </div>
                        )}
                      </div>
                      <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap">
                        <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap max-w-[100%] hover:max-w-[300px] transition-all duration-300 z-10">
                          {filteredLabelsData[item.index].usage_category && (
                            <Badge
                              size="sm"
                              label={
                                master?.blockspace_categories.main_categories[
                                subcategoryToCategoryMapping[
                                filteredLabelsData[item.index]
                                  .usage_category
                                ]
                                ]
                              }
                              leftIcon={
                                "gtp:da-celestia-logo-monochrome"
                              }
                              leftIconColor="#CDD8D3"
                              rightIcon={
                                labelsFilters.category.includes(
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index]
                                    .usage_category
                                  ],
                                )
                                  ? "heroicons-solid:x-circle"
                                  : "heroicons-solid:plus-circle"
                              }
                              rightIconColor={
                                labelsFilters.category.includes(
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index]
                                    .usage_category
                                  ],
                                )
                                  ? "#FE5468"
                                  : undefined
                              }
                              onClick={() =>
                                handleFilter(
                                  "category",
                                  subcategoryToCategoryMapping[
                                  filteredLabelsData[item.index]
                                    .usage_category
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
                                  ? "heroicons-solid:x-circle"
                                  : "heroicons-solid:plus-circle"
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
                          </div>
                        )}
                      </div>
                      {showDeploymentTx && (
                        <div
                          className="@container flex-1 flex h-full items-center hover:bg-transparent pr-[10px] text-[11px]"
                          style={{
                            fontFeatureSettings: "'pnum' on, 'lnum' on",
                          }}
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
                                style={{ direction: "ltr" }}
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    filteredLabelsData[item.index]
                                      .deployment_tx,
                                  );
                                }}
                              >
                                {filteredLabelsData[
                                  item.index
                                ].deployment_tx.slice(
                                  0,
                                  filteredLabelsData[item.index].deployment_tx
                                    .length - 6,
                                )}
                              </div>
                              <div className="transition-all duration-300">
                                {filteredLabelsData[
                                  item.index
                                ].deployment_tx.slice(-6)}
                              </div>
                              <div className="pl-[10px]">
                                <Icon
                                  icon={
                                    copiedAddress ===
                                      filteredLabelsData[item.index].deployment_tx
                                      ? "feather:check-circle"
                                      : "feather:copy"
                                  }
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(
                                      filteredLabelsData[item.index]
                                        .deployment_tx,
                                    );
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
                          style={{
                            fontFeatureSettings: "'pnum' on, 'lnum' on",
                          }}
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
                              <Badge
                                size="sm"
                                truncateStyle="middle"
                                className="!max-w-[110px]"
                                label={
                                  filteredLabelsData[item.index]
                                    .deployer_address
                                }
                                leftIcon={
                                  "material-symbols:deployed-code-account-rounded"
                                }
                                leftIconColor="#CDD8D3"
                                rightIcon={
                                  labelsFilters.deployer_address.includes(
                                    filteredLabelsData[item.index]
                                      .deployer_address,
                                  )
                                    ? "heroicons-solid:x-circle"
                                    : "heroicons-solid:plus-circle"
                                }
                                rightIconColor={
                                  labelsFilters.deployer_address.includes(
                                    filteredLabelsData[item.index]
                                      .deployer_address,
                                  )
                                    ? "#FE5468"
                                    : undefined
                                }
                                onClick={(e) => {
                                  handleFilter(
                                    "deployer_address",
                                    filteredLabelsData[item.index]
                                      .deployer_address,
                                  );
                                  e.stopPropagation();
                                }}
                              />
                              <div className="pl-[10px]">
                                <Icon
                                  icon={
                                    copiedAddress ===
                                      filteredLabelsData[item.index]
                                        .deployer_address
                                      ? "feather:check-circle"
                                      : "feather:copy"
                                  }
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(
                                      filteredLabelsData[item.index]
                                        .deployer_address,
                                    );
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
                            key={`${filteredLabelsData[item.index].origin_key
                              }_${filteredLabelsData[item.index].address}`}
                            isDBLoading={false}
                            minUnix={SparklineTimestampRange[0]}
                            maxUnix={SparklineTimestampRange[1]}
                            data={
                              sparklineLabelsData &&
                                sparklineLabelsData.data[
                                `${filteredLabelsData[item.index].origin_key}_${filteredLabelsData[item.index].address
                                }`
                                ]
                                ? sparklineLabelsData.data[
                                  `${filteredLabelsData[item.index].origin_key
                                  }_${filteredLabelsData[item.index].address}`
                                ].sparkline.map((d) => [
                                  d[
                                  sparklineLabelsData.data.types.indexOf(
                                    "unix",
                                  )
                                  ],
                                  d[
                                  sparklineLabelsData.data.types.indexOf(
                                    currentMetric,
                                  )
                                  ],
                                ])
                                : []
                            }
                            change={
                              filteredLabelsData[item.index][
                              `${currentMetric}_change`
                              ]
                            }
                            value={
                              filteredLabelsData[item.index][currentMetric]
                            }
                            valueType={currentMetric}
                          >
                            <LabelsSVGSparkline
                              chainKey={
                                filteredLabelsData[item.index].origin_key
                              }
                            />
                          </SVGSparklineProvider>
                        </div>
                      </div>
                    </GridTableRow>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* </div> */}
      </LabelsTableContainer>
      {/* </div> */}

      {/* <Footer downloadCSV={downloadCSV} downloadJSON={downloadJSON} /> */}
    </>
  );
}

type GridTableProps = {
  gridDefinitionColumns: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

// grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"
const GridTableHeader = ({
  children,
  gridDefinitionColumns,
  className,
  style,
}: GridTableProps) => {
  return (
    <div
      className={`select-none gap-x-[10px] pl-[10px] pr-[30px] pt-[30px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
const GridTableRow = ({
  children,
  gridDefinitionColumns,
  className,
  style,
}: GridTableProps) => {
  return (
    <div
      className={`select-text gap-x-[10px] pl-[10px] pr-[30px] py-[5px] text-xs items-center rounded-full border border-forest-900/20 dark:border-forest-500/20 grid ${gridDefinitionColumns} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

const LabelsSparkline = ({ chainKey }: { chainKey: string }) => {
  const {
    data,
    change,
    value,
    valueType,
    hoverDataPoint,
    setHoverDataPoint,
    isDBLoading,
  } = useCanvasSparkline();
  const { formatMetric } = useMaster();

  return (
    <>
      {isDBLoading ? (
        <div className="relative flex items-center justify-center text-[#5A6462] text-[10px] w-[100px] h-full">
          Loading Chart
        </div>
      ) : (
        <CanvasSparkline chainKey={chainKey} />
      )}
      {hoverDataPoint ? (
        <div className="flex flex-col justify-center items-end numbers-xs">
          <div className="min-w-[55px] text-right">
            {hoverDataPoint[1] && formatMetric(hoverDataPoint[1], valueType)}
          </div>
          <div className={`text-[9px] text-right leading-[1] text-forest-400`}>
            {new Date(hoverDataPoint[0]).toLocaleDateString("en-GB", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-end numbers-xs">
          <div className="min-w-[55px] text-right">
            {formatMetric(value, valueType)}
          </div>
          {(change === null ||
            parseFloat((change * 100).toFixed(0)) === "0") && (
              <div
                className={`text-[9px] text-right leading-[1] text-[#CDD8D399] font-normal`}
              >
                {change === null && "—"}
                {change !== null && "0.0%"}
              </div>
            )}
          {change !== null && parseFloat((change * 100).toFixed(1)) > 0 && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#1DF7EF] font-normal`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
          )}
          {change !== null && parseFloat((change * 100).toFixed(1)) < 0 && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#FE5468] font-semibold`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
          )}
          {/* <div
            className={`text-[9px] text-right leading-[1] ${change > 0
              ? "text-[#1DF7EF] font-normal"
              : "text-[#FE5468] font-semibold "
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
  const {
    data,
    change,
    value,
    valueType,
    hoverDataPoint,
    setHoverDataPoint,
    isDBLoading,
  } = useSVGSparkline();
  const { formatMetric } = useMaster();

  return (
    <>
      {isDBLoading ? (
        <div className="relative flex items-center justify-center text-[#5A6462] text-[10px] w-[100px] h-full">
          Loading Chart
        </div>
      ) : (
        <SVGSparkline chainKey={chainKey} />
      )}
      {hoverDataPoint ? (
        <div
          className="flex flex-col justify-center items-end"
          style={{
            fontFeatureSettings: "'pnum' on, 'lnum' on",
          }}
        >
          <div className="min-w-[55px] text-right">
            {hoverDataPoint[1] && formatMetric(hoverDataPoint[1], valueType)}
          </div>
          <div className={`text-[9px] text-right leading-[1] text-forest-400`}>
            {new Date(hoverDataPoint[0]).toLocaleDateString("en-GB", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-end numbers-xs">
          <div className="min-w-[55px] text-right">
            {formatMetric(value, valueType)}
          </div>
          {(change === null ||
            parseFloat((change * 100).toFixed(0)) === "0") && (
              <div
                className={`text-[9px] text-right leading-[1] text-[#CDD8D399] font-normal`}
              >
                {change === null && "—"}
                {change !== null && "0.0%"}
              </div>
            )}
          {change !== null && parseFloat((change * 100).toFixed(1)) > 0 && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#1DF7EF] font-normal`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
          )}
          {change !== null && parseFloat((change * 100).toFixed(1)) < 0 && (
            <div
              className={`text-[9px] text-right leading-[1] text-[#FE5468] font-semibold`}
            >
              {change > 0 && "+"}
              {(change * 100).toLocaleString("en-GB", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
          )}
          {/* <div
            className={`text-[9px] text-right leading-[1] ${change > 0
              ? "text-[#1DF7EF] font-normal"
              : "text-[#FE5468] font-semibold "
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