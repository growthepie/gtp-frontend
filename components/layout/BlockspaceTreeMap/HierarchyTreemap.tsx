"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  hierarchy,
  treemap,
  treemapBinary,
  treemapSquarify,
  HierarchyRectangularNode,
} from "d3-hierarchy";
import Image from "next/image";
import { BlockspaceURLs, LabelsURLS } from "@/lib/urls";
import { useMaster } from "@/contexts/MasterContext";
import ShowLoading from "@/components/layout/ShowLoading";
import { GTPIcon } from "@/components/layout/GTPIcon";

type RawTreeMapResponse = {
  data?: {
    types?: string[];
    data?: Array<Array<string | number | null>>;
  };
};

type MetricKey = "fees_paid_usd" | "fees_paid_eth" | "txcount" | "daa";

type NodeData = {
  id: string;
  parent?: string;
  name: string;
  value: number;
  color?: string;
};

type DisplayNode = {
  id: string;
  name: string;
  value: number;
  color: string;
  hierarchyLevel: string;
  fullPath: string;
  sharePct: number;
  children?: DisplayNode[];
};

const METRIC_LABELS: Record<MetricKey, string> = {
  fees_paid_usd: "Fees Paid (USD)",
  fees_paid_eth: "Fees Paid (ETH)",
  txcount: "Transaction Count",
  daa: "Daily Active Addresses",
};

const METRIC_FORMAT: Record<MetricKey, Intl.NumberFormatOptions> = {
  fees_paid_usd: { maximumFractionDigits: 2 },
  fees_paid_eth: { maximumFractionDigits: 6 },
  txcount: { maximumFractionDigits: 0 },
  daa: { maximumFractionDigits: 0 },
};

const DEFAULT_COLOR = "#5A6462";
const MAX_DEPTH = 3;
const MAX_CHILDREN_PER_PARENT = 12;

const keyToTitle = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const shortAddress = (address: string) => {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const addAlpha = (hex: string, alpha: number) => {
  const cleaned = hex.replace("#", "");
  const chunk = cleaned.length === 3 ? cleaned.split("").map((x) => x + x).join("") : cleaned;
  if (chunk.length !== 6) return hex;
  const r = parseInt(chunk.slice(0, 2), 16);
  const g = parseInt(chunk.slice(2, 4), 16);
  const b = parseInt(chunk.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getHierarchyLevel = (id: string) => {
  const prefix = id.split(":")[0];
  if (prefix === "chain") return "Chain";
  if (prefix === "main") return "Main Category";
  if (prefix === "sub") return "Sub Category";
  if (prefix === "owner") return "Owner Project";
  return "Contract";
};

const getHeaderHeight = (boxHeight: number) => {
  if (boxHeight < 80) return 14;
  if (boxHeight < 130) return 18;
  return 22;
};

const getChainColorForNode = (
  nodeId: string,
  allChainsByKeys: Record<string, { colors?: { dark?: string[] } }>,
) => {
  const idParts = nodeId.split(":");
  const prefix = idParts[0];
  let chainKey = "";

  if (["chain", "main", "sub", "owner", "contract"].includes(prefix)) {
    chainKey = idParts[1] ?? "";
  } else if (prefix === "other") {
    chainKey = idParts[2] ?? "";
  }

  return allChainsByKeys[chainKey]?.colors?.dark?.[0] ?? "#4A5A58";
};

const MAIN_CATEGORY_ICONS: Record<string, string> = {
  finance: "gtp-defi",
  token_transfers: "gtp-tokentransfers",
  utility: "gtp-utilities",
  social: "gtp-socials",
  cross_chain: "gtp-crosschain",
  collectibles: "gtp-nft",
  unlabeled: "gtp-unlabeled",
};

export default function HierarchyTreemap() {
  const { AllChainsByKeys } = useMaster();
  const { data, isLoading, isValidating } = useSWR<RawTreeMapResponse>(BlockspaceURLs["tree-map"]);
  const { data: projectsData } = useSWR<any>(LabelsURLS.projectsFiltered);

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("fees_paid_usd");
  const [selectedDate, setSelectedDate] = useState<string>("latest");
  const [rootId, setRootId] = useState<string | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerEl || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      setContainerWidth((prev) => (Math.abs(prev - nextWidth) < 1 ? prev : nextWidth));
    });

    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  const parsed = useMemo(() => {
    const types = data?.data?.types ?? [];
    const rows = data?.data?.data ?? [];

    if (!types.length || !rows.length) {
      return {
        dates: [] as string[],
        latestDate: null as string | null,
        chartData: [] as NodeData[],
        totalValue: 0,
        nodeById: {} as Record<string, NodeData>,
        childrenByParent: {} as Record<string, NodeData[]>,
      };
    }

    const fieldIndex = Object.fromEntries(types.map((field, index) => [field, index]));
    const dateIndex = fieldIndex.date;
    const chainIndex = fieldIndex.origin_key;
    const mainCategoryIndex = fieldIndex.main_category_key;
    const subCategoryIndex = fieldIndex.sub_category_key;
    const ownerIndex = fieldIndex.owner_project;
    const addressIndex = fieldIndex.address;
    const contractNameIndex = fieldIndex.contract_name;
    const metricIndex = fieldIndex[selectedMetric];

    if (
      [
        dateIndex,
        chainIndex,
        mainCategoryIndex,
        subCategoryIndex,
        ownerIndex,
        addressIndex,
        contractNameIndex,
        metricIndex,
      ].some((value) => typeof value !== "number")
    ) {
      return {
        dates: [] as string[],
        latestDate: null as string | null,
        chartData: [] as NodeData[],
        totalValue: 0,
        nodeById: {} as Record<string, NodeData>,
        childrenByParent: {} as Record<string, NodeData[]>,
      };
    }

    const dates = Array.from(
      new Set(
        rows
          .map((row) => String(row[dateIndex]))
          .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
      ),
    ).sort((a, b) => b.localeCompare(a));

    const latestDate = dates[0] ?? null;
    const effectiveDate = selectedDate === "latest" ? latestDate : selectedDate;

    const chainNodes = new Map<string, NodeData>();
    const mainCategoryNodes = new Map<string, NodeData>();
    const subCategoryNodes = new Map<string, NodeData>();
    const ownerNodes = new Map<string, NodeData>();
    const contractNodes = new Map<string, NodeData>();

    rows.forEach((row) => {
      if (effectiveDate && String(row[dateIndex]) !== effectiveDate) return;

      const chainKey = String(row[chainIndex] ?? "unknown");
      const mainCategoryKey = String(row[mainCategoryIndex] ?? "unknown");
      const subCategoryKey = String(row[subCategoryIndex] ?? "unknown");
      const ownerKey = String(row[ownerIndex] ?? "unknown");
      const address = String(row[addressIndex] ?? "unknown").toLowerCase();
      const contractName = String(row[contractNameIndex] ?? "Unknown Contract");
      const metricValue = toNumber(row[metricIndex]);
      if (metricValue <= 0) return;

      const chainLabel = AllChainsByKeys[chainKey]?.label ?? keyToTitle(chainKey);
      const chainColor = AllChainsByKeys[chainKey]?.colors.dark?.[0] ?? DEFAULT_COLOR;

      const chainId = `chain:${chainKey}`;
      const mainCategoryId = `main:${chainKey}:${mainCategoryKey}`;
      const subCategoryId = `sub:${chainKey}:${mainCategoryKey}:${subCategoryKey}`;
      const ownerId = `owner:${chainKey}:${mainCategoryKey}:${subCategoryKey}:${ownerKey}`;
      const contractId = `contract:${chainKey}:${mainCategoryKey}:${subCategoryKey}:${ownerKey}:${address}`;

      if (!chainNodes.has(chainId)) {
        chainNodes.set(chainId, { id: chainId, name: chainLabel, value: 0, color: chainColor });
      }
      if (!mainCategoryNodes.has(mainCategoryId)) {
        mainCategoryNodes.set(mainCategoryId, {
          id: mainCategoryId,
          parent: chainId,
          name: keyToTitle(mainCategoryKey),
          value: 0,
          color: addAlpha(chainColor, 0.9),
        });
      }
      if (!subCategoryNodes.has(subCategoryId)) {
        subCategoryNodes.set(subCategoryId, {
          id: subCategoryId,
          parent: mainCategoryId,
          name: keyToTitle(subCategoryKey),
          value: 0,
          color: addAlpha(chainColor, 0.8),
        });
      }
      if (!ownerNodes.has(ownerId)) {
        ownerNodes.set(ownerId, {
          id: ownerId,
          parent: subCategoryId,
          name: keyToTitle(ownerKey),
          value: 0,
          color: addAlpha(chainColor, 0.7),
        });
      }
      if (!contractNodes.has(contractId)) {
        contractNodes.set(contractId, {
          id: contractId,
          parent: ownerId,
          name: contractName === "-" ? shortAddress(address) : contractName,
          value: 0,
          color: addAlpha(chainColor, 0.6),
        });
      }

      chainNodes.get(chainId)!.value += metricValue;
      mainCategoryNodes.get(mainCategoryId)!.value += metricValue;
      subCategoryNodes.get(subCategoryId)!.value += metricValue;
      ownerNodes.get(ownerId)!.value += metricValue;
      contractNodes.get(contractId)!.value += metricValue;
    });

    const chartData: NodeData[] = [
      ...Array.from(chainNodes.values()),
      ...Array.from(mainCategoryNodes.values()),
      ...Array.from(subCategoryNodes.values()),
      ...Array.from(ownerNodes.values()),
      ...Array.from(contractNodes.values()),
    ];

    const nodeById = chartData.reduce(
      (acc, node) => {
        acc[node.id] = node;
        return acc;
      },
      {} as Record<string, NodeData>,
    );

    const childrenByParent = chartData.reduce(
      (acc, node) => {
        const parentKey = node.parent ?? "__root__";
        if (!acc[parentKey]) {
          acc[parentKey] = [];
        }
        acc[parentKey].push(node);
        return acc;
      },
      {} as Record<string, NodeData[]>,
    );

    Object.keys(childrenByParent).forEach((key) => {
      childrenByParent[key].sort((a, b) => b.value - a.value);
    });

    const totalValue = Array.from(chainNodes.values()).reduce((sum, node) => sum + node.value, 0);

    return {
      dates,
      latestDate,
      chartData,
      totalValue,
      nodeById,
      childrenByParent,
    };
  }, [data, selectedDate, selectedMetric, AllChainsByKeys]);

  const effectiveRootId = rootId && parsed.nodeById[rootId] ? rootId : null;

  const currentPath = useMemo(() => {
    if (!effectiveRootId) return [] as Array<{ id: string; name: string }>;

    const path: Array<{ id: string; name: string }> = [];
    let cursor: string | undefined = effectiveRootId;

    while (cursor) {
      const node = parsed.nodeById[cursor];
      if (!node) break;
      path.unshift({ id: node.id, name: node.name });
      cursor = node.parent;
    }

    return path;
  }, [effectiveRootId, parsed.nodeById]);

  const ownerProjectToLogo = useMemo(() => {
    if (!projectsData?.data?.types || !projectsData?.data?.data) return {} as Record<string, string>;

    const types = projectsData.data.types as string[];
    const rows = projectsData.data.data as any[][];
    const ownerProjectIndex = types.indexOf("owner_project");
    const logoPathIndex = types.indexOf("logo_path");
    if (ownerProjectIndex === -1 || logoPathIndex === -1) return {} as Record<string, string>;

    return rows.reduce((acc, row) => {
      const ownerProject = String(row[ownerProjectIndex] ?? "");
      const logoPath = String(row[logoPathIndex] ?? "");
      if (ownerProject && logoPath && logoPath !== "-" && logoPath !== "null") {
        acc[ownerProject] = `https://api.growthepie.com/v1/apps/logos/${logoPath}`;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [projectsData]);

  const getNodeIcons = (nodeId: string) => {
    const idParts = nodeId.split(":");
    const prefix = idParts[0];
    const chainKey = idParts[1] ?? "";
    const isMainCategory = prefix === "main";
    const isOwnerProject = prefix === "owner";
    const mainCategoryKey = isMainCategory ? idParts[2] : "";
    const ownerProjectKey = isOwnerProject ? idParts[4] : "";
    const mainCategoryIcon = MAIN_CATEGORY_ICONS[mainCategoryKey];
    const ownerProjectLogo = ownerProjectToLogo[ownerProjectKey];
    const chainUrlKey = AllChainsByKeys[chainKey]?.urlKey ?? chainKey.replace(/_/g, "-");
    const chainIcon = prefix === "chain" ? `${chainUrlKey}-logo-monochrome` : null;

    return { mainCategoryIcon, ownerProjectLogo, chainIcon };
  };

  const displayTree = useMemo(() => {
    const getFullPath = (id: string) => {
      const names: string[] = [];
      let cursor: string | undefined = id;
      while (cursor) {
        const node = parsed.nodeById[cursor];
        if (!node) break;
        names.unshift(node.name);
        cursor = node.parent;
      }
      return names.join(" > ");
    };

    const makeNode = (id: string, depth: number): DisplayNode | null => {
      const node = parsed.nodeById[id];
      if (!node) return null;

      const current: DisplayNode = {
        id: node.id,
        name: node.name,
        value: node.value,
        color: node.color ?? DEFAULT_COLOR,
        hierarchyLevel: getHierarchyLevel(node.id),
        fullPath: getFullPath(node.id),
        sharePct: parsed.totalValue > 0 ? (node.value / parsed.totalValue) * 100 : 0,
      };

      if (depth >= MAX_DEPTH) return current;

      const children = parsed.childrenByParent[id] ?? [];
      const minShareOfParent = depth === 1 ? 0.002 : depth === 2 ? 0.008 : 0.015;
      const minValue = node.value * minShareOfParent;
      const primaryChildren = children.filter((child) => child.value >= minValue);
      const tinyChildren = children.filter((child) => child.value < minValue);
      const keptChildren = primaryChildren.slice(0, MAX_CHILDREN_PER_PARENT);
      const hiddenChildren = [
        ...tinyChildren,
        ...primaryChildren.slice(MAX_CHILDREN_PER_PARENT),
      ];

      const mappedChildren = keptChildren
        .map((child) => makeNode(child.id, depth + 1))
        .filter(Boolean) as DisplayNode[];

      if (hiddenChildren.length > 0) {
        const hiddenValue = hiddenChildren.reduce((sum, child) => sum + child.value, 0);
        mappedChildren.push({
          id: `other:${id}:${depth}`,
          name: `+${hiddenChildren.length} others`,
          value: hiddenValue,
          color: addAlpha(node.color ?? DEFAULT_COLOR, 0.45),
          hierarchyLevel: "Aggregated",
          fullPath: `${getFullPath(id)} > +${hiddenChildren.length} others`,
          sharePct: parsed.totalValue > 0 ? (hiddenValue / parsed.totalValue) * 100 : 0,
        });
      }

      if (mappedChildren.length > 0) {
        current.children = mappedChildren;
      }

      return current;
    };

    const rootChildrenSource = effectiveRootId
      ? [parsed.nodeById[effectiveRootId]].filter(Boolean)
      : parsed.childrenByParent["__root__"] ?? [];

    const rootChildren = rootChildrenSource
      .map((node) => makeNode(node.id, 1))
      .filter(Boolean) as DisplayNode[];

    return {
      id: "__root__",
      name: "All chains",
      value: rootChildren.reduce((sum, node) => sum + node.value, 0),
      color: "transparent",
      hierarchyLevel: "Root",
      fullPath: "All chains",
      sharePct: 100,
      children: rootChildren,
    } as DisplayNode;
  }, [effectiveRootId, parsed.childrenByParent, parsed.nodeById, parsed.totalValue]);

  const laidOutNodes = useMemo(() => {
    const fallbackWidth =
      typeof window !== "undefined"
        ? Math.max(Math.min(window.innerWidth - 120, 2200), 1000)
        : 1200;
    const width = containerWidth > 0 ? containerWidth - 2 : fallbackWidth;
    const height = 720;
    if (!width || !displayTree.children?.length) return [];

    const root = hierarchy(displayTree)
      .sum((node) => node.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const hybridTile = (node: any, x0: number, y0: number, x1: number, y1: number) => {
      if (node.depth <= 1) {
        treemapBinary(node, x0, y0, x1, y1);
        return;
      }
      treemapSquarify(node, x0, y0, x1, y1);
    };

    const treemapRoot = treemap<DisplayNode>()
      .size([width, height])
      .tile(hybridTile)
      .paddingOuter((node) => (node.depth <= 1 ? 8 : node.depth === 2 ? 4 : 2))
      .paddingInner((node) => (node.depth <= 1 ? 6 : node.depth === 2 ? 4 : 2))
      .paddingTop((node) => {
        if (node.depth === 0 || !node.children) return 0;
        const boxHeight = node.y1 - node.y0;
        if (boxHeight < 34) return 0;
        return getHeaderHeight(boxHeight) + 4;
      })(root as any) as HierarchyRectangularNode<DisplayNode>;

    return treemapRoot.descendants().filter((node) => node.depth > 0);
  }, [containerWidth, displayTree]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredNode = useMemo(
    () => laidOutNodes.find((node) => node.data.id === hoveredId) ?? null,
    [hoveredId, laidOutNodes],
  );

  const metricFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", METRIC_FORMAT[selectedMetric]),
    [selectedMetric],
  );

  const hasSourceData = (displayTree.children?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-y-[15px]">
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />

      <div className="rounded-[15px] bg-color-bg-container p-[12px] md:p-[15px] flex flex-col md:flex-row md:items-center md:justify-between gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <div className="heading-small-sm">Metric</div>
          <select
            className="bg-color-bg-medium rounded-full px-[12px] h-[34px] text-sm border border-color-border"
            value={selectedMetric}
            onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
          >
            {Object.entries(METRIC_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-[8px]">
          <div className="heading-small-sm">Date</div>
          <select
            className="bg-color-bg-medium rounded-full px-[12px] h-[34px] text-sm border border-color-border"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          >
            <option value="latest">Latest ({parsed.latestDate ?? "n/a"})</option>
            {parsed.dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sticky top-[72px] z-20 rounded-[15px] bg-color-bg-container/95 backdrop-blur p-[10px] md:p-[12px]">
        <div className="flex items-center gap-[8px] flex-wrap">
          <button
            type="button"
            className={`rounded-full px-[14px] h-[34px] text-sm border transition-colors ${
              !effectiveRootId
                ? "bg-color-ui-active text-color-text-primary border-color-ui-active"
                : "bg-color-bg-medium text-color-text-primary border-color-border hover:bg-color-ui-hover"
            }`}
            onClick={() => setRootId(null)}
          >
            All chains
          </button>
          {currentPath.map((node, index) => (
            <button
              key={node.id}
              type="button"
              className={`rounded-full px-[14px] h-[34px] text-sm border transition-colors ${
                index === currentPath.length - 1
                  ? "bg-color-ui-active text-color-text-primary border-color-ui-active"
                  : "bg-color-bg-medium text-color-text-primary border-color-border hover:bg-color-ui-hover"
              }`}
              onClick={() => setRootId(node.id)}
            >
              {node.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[15px] bg-color-bg-default overflow-hidden p-[10px] md:p-[14px]">
        {hasSourceData ? (
          <div
            ref={setContainerEl}
            className="relative w-full h-[720px] overflow-hidden bg-color-bg-default"
            onMouseLeave={() => setHoveredId(null)}
          >
            {laidOutNodes.map((node) => {
              const width = Math.max(0, node.x1 - node.x0);
              const height = Math.max(0, node.y1 - node.y0);

              const isContainer = !!node.children?.length;
              const hasRawChildren = (parsed.childrenByParent[node.data.id]?.length ?? 0) > 0;
              const canDrill = !node.data.id.startsWith("other:") && (isContainer || hasRawChildren);
              const isHovered = hoveredId === node.data.id;
              const canShowHeader = isContainer && width >= 84 && height >= 34;
              const canShowLeafLabel = !isContainer && width * height > 2800 && width >= 70 && height >= 18;
              const maxRadius = node.depth <= 1 ? 15 : node.depth === 2 ? 10 : 6;
              const borderRadius = Math.max(0, Math.min(maxRadius, Math.floor(width / 5), Math.floor(height / 5)));
              const headerHeight = canShowHeader ? getHeaderHeight(height) : 0;
              const chainOutlineColor = getChainColorForNode(node.data.id, AllChainsByKeys as any);
              const neutralBg =
                node.depth <= 1
                  ? "rgba(124, 140, 164, 0.14)"
                  : node.depth === 2
                    ? "rgba(124, 140, 164, 0.2)"
                    : node.depth === 3
                      ? "rgba(124, 140, 164, 0.26)"
                      : "rgba(124, 140, 164, 0.3)";

              return (
                <div
                  key={node.data.id}
                  className={`absolute border overflow-hidden ${canDrill ? "cursor-pointer" : "cursor-default"}`}
                  style={{
                    left: `${node.x0}px`,
                    top: `${node.y0}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    background: neutralBg,
                    borderColor: isHovered ? "#F4F6F5" : chainOutlineColor,
                    borderWidth: isHovered ? "3px" : width < 4 || height < 4 ? "0px" : node.depth <= 2 ? "2px" : "1px",
                    boxShadow: isHovered ? "inset 0 0 0 1px #FFFFFF88" : undefined,
                    borderRadius: `${borderRadius}px`,
                  }}
                  onClick={() => {
                    if (canDrill) setRootId(node.data.id);
                  }}
                  onMouseEnter={() => setHoveredId(node.data.id)}
                >
                  {canShowHeader && (
                    <div
                      className="absolute left-0 top-0 w-full border-b border-[#FFFFFF33] bg-[#0C100F66] px-[8px] flex items-center overflow-hidden"
                      style={{ height: `${headerHeight}px` }}
                    >
                      {(() => {
                        const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.data.id);

                        return (
                          <div className="flex items-center gap-[6px] min-w-0">
                            {ownerProjectLogo ? (
                              <Image
                                src={ownerProjectLogo}
                                alt={node.data.name}
                                className="w-[14px] h-[14px] rounded-[3px] object-cover shrink-0"
                                width={14}
                                height={14}
                              />
                            ) : chainIcon ? (
                              <GTPIcon
                                icon={chainIcon as any}
                                size="sm"
                                className="text-[#F4F6F5] shrink-0"
                              />
                            ) : mainCategoryIcon ? (
                              <GTPIcon
                                icon={mainCategoryIcon as any}
                                size="sm"
                                className="text-[#F4F6F5] shrink-0"
                              />
                            ) : null}
                            <span className="text-[12px] font-semibold text-[#F4F6F5] truncate">
                              {node.data.name}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {canShowLeafLabel && (
                    (() => {
                      const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.data.id);

                      return (
                        <div className="absolute top-[6px] left-[8px] right-[8px] text-[#F4F6F5] text-[11px] leading-tight truncate overflow-hidden">
                          <div className="flex items-center gap-[6px] min-w-0">
                            {ownerProjectLogo ? (
                              <Image
                                src={ownerProjectLogo}
                                alt={node.data.name}
                                className="w-[13px] h-[13px] rounded-[3px] object-cover shrink-0"
                                width={13}
                                height={13}
                              />
                            ) : chainIcon ? (
                              <GTPIcon
                                icon={chainIcon as any}
                                size="sm"
                                className="text-[#F4F6F5] shrink-0"
                              />
                            ) : mainCategoryIcon ? (
                              <GTPIcon
                                icon={mainCategoryIcon as any}
                                size="sm"
                                className="text-[#F4F6F5] shrink-0"
                              />
                            ) : null}
                            <span className="truncate">{node.data.name}</span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}

            {hoveredNode && (
              <div className="absolute right-[12px] bottom-[12px] z-30 rounded-[12px] border border-[#3B4342] bg-[rgba(18,24,23,0.96)] px-[10px] py-[8px] text-[12px] text-[#F4F6F5] max-w-[520px]">
                <div className="font-semibold mb-[2px]">{hoveredNode.data.name}</div>
                <div>{METRIC_LABELS[selectedMetric]}: {metricFormatter.format(hoveredNode.data.value)}</div>
                <div>Level: {hoveredNode.data.hierarchyLevel}</div>
                <div>Share of total: {hoveredNode.data.sharePct.toFixed(2)}%</div>
                <div className="opacity-90 mt-[2px]">Path: {hoveredNode.data.fullPath}</div>
              </div>
            )}
            {laidOutNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-color-text-secondary text-sm">
                Preparing layout...
              </div>
            )}
          </div>
        ) : (
          <div className="h-[360px] w-full flex items-center justify-center text-color-text-secondary text-sm">
            No treemap data available for the selected settings.
          </div>
        )}
      </div>
    </div>
  );
}
