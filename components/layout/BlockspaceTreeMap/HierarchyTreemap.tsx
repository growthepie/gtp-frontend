"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { ToggleSwitch } from "@/components/layout/ToggleSwitch";
import { StepSwitch } from "@/components/layout/StepSwitch";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Icon } from "@iconify/react";
import { FloatingPortal } from "@floating-ui/react";
import dayjs from "@/lib/dayjs";
import { useLocalStorage } from "usehooks-ts";

type RawTreeMapResponse = {
  data?: {
    types?: string[];
    data?: Array<Array<string | number | null>>;
  };
};

type MetricKey = "txcount" | "fees";
type MetricValueKey = "txcount" | "fees_paid_usd" | "fees_paid_eth";

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

const METRIC_LABELS: Record<MetricKey, { label: string; shortLabel: string }> = {
  txcount: { label: "Transaction Count", shortLabel: "Tx Count" },
  fees: { label: "Gas Fees", shortLabel: "Fees" },
};

const METRIC_LONG_LABELS: Record<MetricKey, string> = {
  txcount: "Transaction Count",
  fees: "Fees Paid",
};

const METRIC_FORMAT: Record<MetricValueKey, Intl.NumberFormatOptions> = {
  fees_paid_usd: { maximumFractionDigits: 2 },
  fees_paid_eth: { maximumFractionDigits: 6 },
  txcount: { maximumFractionDigits: 0 },
};

const DEFAULT_COLOR = "#5A6462";
const DEFAULT_DEPTH = 3;
const MIN_DEPTH = 2;
const MAX_DEPTH = 5;
const MAX_CHILDREN_PER_PARENT = 12;
const HEADER_VERTICAL_PADDING = 2;

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

const normalizeHierarchyKey = (value: string | number | null | undefined) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "unlabeled";
  const lower = raw.toLowerCase();
  if (["-", "null", "unknown", "unlabeled", "unlabelled"].includes(lower)) return "unlabeled";
  return raw;
};

const getContractAddressFromId = (nodeId: string) => {
  const idParts = nodeId.split(":");
  if (idParts[0] !== "contract") return "";
  return idParts[5] ?? "";
};

const isAggregatedContractAddress = (address: string) =>
  address.toLowerCase() === "all others";

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
  if (boxHeight < 60) return 0;
  if (boxHeight < 110) return 18;
  if (boxHeight < 170) return 22;
  return 26;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getPaddingOuter = (node: { depth: number; x0: number; x1: number; y0: number; y1: number }) => {
  const size = Math.min(node.x1 - node.x0, node.y1 - node.y0);
  if (node.depth <= 1) {
    if (size < 180) return 0;
    return clamp(Math.floor(size / 70), 1, 6);
  }
  if (node.depth === 2) {
    if (size < 120) return 0;
    return clamp(Math.floor(size / 90), 1, 4);
  }
  return clamp(Math.floor(size / 90), 1, 3);
};

const getPaddingInner = (node: { depth: number; x0: number; x1: number; y0: number; y1: number }) => {
  const size = Math.min(node.x1 - node.x0, node.y1 - node.y0);
  if (node.depth <= 1) {
    if (size < 180) return 0;
    return clamp(Math.floor(size / 90), 1, 4);
  }
  if (node.depth === 2) {
    if (size < 120) return 0;
    return clamp(Math.floor(size / 120), 1, 3);
  }
  return clamp(Math.floor(size / 120), 1, 3);
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

const resolveMetricValueKey = (metric: MetricKey, showUsd: boolean): MetricValueKey => {
  if (metric === "fees") return showUsd ? "fees_paid_usd" : "fees_paid_eth";
  return metric;
};

const getMetricLabel = (metric: MetricKey, showUsd: boolean) => {
  if (metric === "fees") {
    return `${METRIC_LONG_LABELS[metric]} (${showUsd ? "USD" : "ETH"})`;
  }
  return METRIC_LONG_LABELS[metric];
};

const TOOLTIP_OFFSET = 16;
const TOOLTIP_MARGIN = 8;

function TreemapTooltip({
  hoveredNode,
  tooltipPos,
  selectedMetric,
  showUsd,
  metricFormatter,
  contractCountById,
  parsed,
  AllChainsByKeys,
  getNodeIcons,
  getChainIconForId,
}: {
  hoveredNode: HierarchyRectangularNode<DisplayNode> | null;
  tooltipPos: { x: number; y: number } | null;
  selectedMetric: MetricKey;
  showUsd: boolean;
  metricFormatter: Intl.NumberFormat;
  contractCountById: { count: (id: string) => number };
  parsed: { nodeById: Record<string, NodeData> };
  AllChainsByKeys: Record<string, any>;
  getNodeIcons: (nodeId: string) => { mainCategoryIcon?: string; ownerProjectLogo?: string; chainIcon: string | null };
  getChainIconForId: (nodeId: string) => string | null;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!tooltipPos || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = tooltipPos.x + TOOLTIP_OFFSET;
    let top = tooltipPos.y + TOOLTIP_OFFSET;

    if (left + w + TOOLTIP_MARGIN > vw) {
      left = tooltipPos.x - w - TOOLTIP_OFFSET;
    }
    if (top + h + TOOLTIP_MARGIN > vh) {
      top = tooltipPos.y - h - TOOLTIP_OFFSET;
    }

    left = Math.max(TOOLTIP_MARGIN, left);
    top = Math.max(TOOLTIP_MARGIN, top);

    setAdjustedPos({ left, top });
  }, [tooltipPos]);

  if (!hoveredNode || !tooltipPos) return null;

  const chainOutlineColor = getChainColorForNode(hoveredNode.data.id, AllChainsByKeys);
  const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(hoveredNode.data.id);
  const nodeChainIcon = getChainIconForId(hoveredNode.data.id);
  const isChainNode = hoveredNode.data.id.startsWith("chain:");
  const contractAddress = getContractAddressFromId(hoveredNode.data.id);
  const shortContract = contractAddress ? shortAddress(contractAddress) : "";
  const isContract = hoveredNode.data.id.startsWith("contract:");
  const displayName =
    isContract && shortContract && !isAggregatedContractAddress(contractAddress)
      ? hoveredNode.data.name && hoveredNode.data.name !== shortContract
        ? `${hoveredNode.data.name} (${shortContract})`
        : shortContract
      : hoveredNode.data.name;
  const parentId = parsed.nodeById[hoveredNode.data.id]?.parent;
  const parentNode = parentId ? parsed.nodeById[parentId] : null;
  const parentShare = parentNode && parentNode.value > 0
    ? (hoveredNode.data.value / parentNode.value) * 100
    : null;

  // Chain share: what % of the chain's total does this node represent?
  const idParts = hoveredNode.data.id.split(":");
  const nodeChainKey = ["chain", "main", "sub", "owner", "contract"].includes(idParts[0])
    ? (idParts[1] ?? "") : "";
  const chainNodeId = nodeChainKey ? `chain:${nodeChainKey}` : "";
  const chainNode = chainNodeId ? parsed.nodeById[chainNodeId] : null;
  const parentIsChain = parentNode?.id?.startsWith("chain:");
  const chainShare = !isChainNode && !parentIsChain && chainNode && chainNode.value > 0
    ? (hoveredNode.data.value / chainNode.value) * 100
    : null;
  const chainLabel = chainNode?.name ?? nodeChainKey;

  // Smart value formatting: drop unnecessary decimals at scale
  const formatValue = (value: number): string => {
    if (selectedMetric === "fees") {
      if (showUsd) {
        if (value >= 1000) return Math.round(value).toLocaleString("en-US");
        return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      // ETH
      if (value >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
      if (value >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
      return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
    }
    return metricFormatter.format(value);
  };

  // Breadcrumb: show ancestors only (exclude the current node name)
  const ancestorPath = (() => {
    const parts = hoveredNode.data.fullPath.split(" > ");
    if (parts.length <= 1) return null; // chain-level, no ancestors to show
    const ancestors = parts.slice(0, -1);
    if (ancestors.length >= 5) {
      return [ancestors[0], "...", ...ancestors.slice(-2)].join(" > ");
    }
    return ancestors.join(" > ");
  })();

  return (
    <FloatingPortal>
      <div
        ref={tooltipRef}
        className="fixed z-50 rounded-[15px] border border-[#3B4342] bg-color-bg-default px-[15px] py-[10px] text-color-text-primary shadow-standard pointer-events-none flex flex-col gap-y-[6px] min-w-[220px] w-max"
        style={{
          left: `${adjustedPos.left}px`,
          top: `${adjustedPos.top}px`,
        }}
      >
        {/* Header: name + ancestor breadcrumb */}
        <div>
          <div className="flex items-center gap-x-[6px]">
            {!isChainNode && nodeChainIcon && (
              <GTPIcon icon={nodeChainIcon as any} size="sm" className="shrink-0" style={{ color: chainOutlineColor }} />
            )}
            {ownerProjectLogo ? (
              <Image
                src={ownerProjectLogo}
                alt={hoveredNode.data.name}
                className="w-[14px] h-[14px] rounded-[3px] object-cover shrink-0"
                width={14}
                height={14}
              />
            ) : chainIcon ? (
              <GTPIcon icon={chainIcon as any} size="sm" className="shrink-0" style={{ color: chainOutlineColor }} />
            ) : mainCategoryIcon ? (
              <GTPIcon icon={mainCategoryIcon as any} size="sm" className="shrink-0" />
            ) : null}
            <span className="heading-small-sm">{displayName}</span>
          </div>
          {ancestorPath
            ? <div className="text-color-text-secondary heading-small-xxxs tracking-wide">{ancestorPath}</div>
            : <div className="heading-small-xxxs">&nbsp;</div>
          }
        </div>
        {/* Value + contracts */}
        <div className="text-xxs text-color-text-secondary leading-[1.4]">
          <span className="numbers-md text-color-text-primary">{selectedMetric === "fees" && (showUsd ? "$" : "Ξ")}{formatValue(hoveredNode.data.value)}</span>
          {" "}{selectedMetric === "fees" ? "in gas fees" : "transactions"} across{" "}
          <span className="numbers-xs text-color-text-primary">{contractCountById.count(hoveredNode.data.id).toLocaleString()}</span> contract{contractCountById.count(hoveredNode.data.id) !== 1 ? "s" : ""}
        </div>
        {/* Share percentages with data bars */}
        <div className="flex flex-col gap-y-[5px] min-w-[180px]">
          {parentShare !== null && (
            <div>
              <div className="flex items-baseline gap-x-[5px]">
                <span className="numbers-sm text-color-text-primary">{parentShare.toFixed(2)}%</span>
                <span className="text-xxs text-color-text-secondary">of {parentNode!.name}</span>
              </div>
              <div className="h-[3px] rounded-full bg-color-bg-medium mt-[3px]">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(parentShare, 100)}%`, backgroundColor: chainOutlineColor }}
                />
              </div>
            </div>
          )}
          {chainShare !== null ? (
            <div>
              <div className="flex items-baseline gap-x-[5px]">
                <span className="numbers-xs text-color-text-primary">{chainShare.toFixed(2)}%</span>
                <span className="text-xxs text-color-text-secondary">of {chainLabel}</span>
              </div>
              <div className="h-[3px] rounded-full bg-color-bg-medium mt-[3px]">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(chainShare, 100)}%`, backgroundColor: `color-mix(in srgb, ${chainOutlineColor} 50%, transparent)` }}
                />
              </div>
            </div>
          ) : isChainNode && (
            <div>
              <div className="flex items-baseline gap-x-[5px]">
                <span className="numbers-sm text-color-text-primary">{hoveredNode.data.sharePct.toFixed(2)}%</span>
                <span className="text-xxs text-color-text-secondary">of all chains</span>
              </div>
              <div className="h-[3px] rounded-full bg-color-bg-medium mt-[3px]">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(hoveredNode.data.sharePct, 100)}%`, backgroundColor: chainOutlineColor }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FloatingPortal>
  );
}

export default function HierarchyTreemap({ chainKey }: { chainKey?: string }) {
  const { AllChainsByKeys } = useMaster();
  const { data, isLoading, isValidating } = useSWR<RawTreeMapResponse>(BlockspaceURLs["tree-map"]);
  const { data: projectsData } = useSWR<any>(LabelsURLS.projectsFiltered);

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("txcount");
  const [selectedTimespan, setSelectedTimespan] = useState<"1d" | "7d">("1d");
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showUnlabeled, setShowUnlabeled] = useState<boolean>(false);
  const [selectedDepth, setSelectedDepth] = useState<number>(DEFAULT_DEPTH);
  const [hoverSettings, setHoverSettings] = useState<boolean>(false);
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
    const metricKey = resolveMetricValueKey(selectedMetric, showUsd);
    const metricIndex = fieldIndex[metricKey];

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
    const dateSet = new Set<string>();
    if (latestDate) {
      const maxDays = selectedTimespan === "7d" ? 6 : 0;
      for (let offset = 0; offset <= maxDays; offset += 1) {
        dateSet.add(dayjs(latestDate).subtract(offset, "day").format("YYYY-MM-DD"));
      }
    }

    const chainNodes = new Map<string, NodeData>();
    const mainCategoryNodes = new Map<string, NodeData>();
    const subCategoryNodes = new Map<string, NodeData>();
    const ownerNodes = new Map<string, NodeData>();
    const contractNodes = new Map<string, NodeData>();

    rows.forEach((row) => {
      if (dateSet.size > 0 && !dateSet.has(String(row[dateIndex]))) return;

      const rowChainKey = String(row[chainIndex] ?? "unknown");
      if (chainKey && rowChainKey !== chainKey) return;
      const mainCategoryKey = normalizeHierarchyKey(row[mainCategoryIndex]);
      const subCategoryKey = normalizeHierarchyKey(row[subCategoryIndex]);
      if (!showUnlabeled && subCategoryKey === "unlabeled") return;
      const ownerKey = normalizeHierarchyKey(row[ownerIndex]);
      const address = String(row[addressIndex] ?? "unknown").toLowerCase();
      const contractName = String(row[contractNameIndex] ?? "Unknown Contract");
      const metricValue = toNumber(row[metricIndex]);
      if (metricValue <= 0) return;

      const chainLabel = AllChainsByKeys[rowChainKey]?.label ?? keyToTitle(rowChainKey);
      const chainColor = AllChainsByKeys[rowChainKey]?.colors.dark?.[0] ?? DEFAULT_COLOR;

      const chainId = `chain:${rowChainKey}`;
      const mainCategoryId = `main:${rowChainKey}:${mainCategoryKey}`;
      const subCategoryId = `sub:${rowChainKey}:${mainCategoryKey}:${subCategoryKey}`;
      const ownerId = `owner:${rowChainKey}:${mainCategoryKey}:${subCategoryKey}:${ownerKey}`;
      const contractId = `contract:${rowChainKey}:${mainCategoryKey}:${subCategoryKey}:${ownerKey}:${address}`;

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
        const resolvedContractName =
          contractName === "-" ? shortAddress(address) : contractName;
        contractNodes.set(contractId, {
          id: contractId,
          parent: ownerId,
          name: resolvedContractName,
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
  }, [data, selectedTimespan, selectedMetric, showUsd, showUnlabeled, AllChainsByKeys, chainKey]);

  const effectiveRootId = rootId && parsed.nodeById[rootId] ? rootId : null;
  const chainLabel = chainKey
    ? AllChainsByKeys[chainKey]?.label ?? keyToTitle(chainKey)
    : null;

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

  const getChainIconForId = (nodeId: string): string | null => {
    const idParts = nodeId.split(":");
    const prefix = idParts[0];
    const chainKey = ["chain", "main", "sub", "owner", "contract"].includes(prefix)
      ? (idParts[1] ?? "")
      : prefix === "other" ? (idParts[2] ?? "") : "";
    if (!chainKey || !AllChainsByKeys[chainKey]) return null;
    const chainUrlKey = AllChainsByKeys[chainKey]?.urlKey ?? chainKey.replace(/_/g, "-");
    return `${chainUrlKey}-logo-monochrome`;
  };

  const getNodeIcons = (nodeId: string) => {
    const idParts = nodeId.split(":");
    const prefix = idParts[0];
    const chainKey = idParts[1] ?? "";
    const isMainCategory = prefix === "main";
    const hasOwnerProject = prefix === "owner" || prefix === "contract";
    const mainCategoryKey = isMainCategory ? idParts[2] : "";
    const ownerProjectKey = hasOwnerProject ? (idParts[4] ?? "") : "";
    const mainCategoryIcon = MAIN_CATEGORY_ICONS[mainCategoryKey];
    const ownerProjectLogo = ownerProjectToLogo[ownerProjectKey];
    const chainUrlKey = AllChainsByKeys[chainKey]?.urlKey ?? chainKey.replace(/_/g, "-");
    const chainIcon = prefix === "chain" ? `${chainUrlKey}-logo-monochrome` : null;

    return { mainCategoryIcon, ownerProjectLogo, chainIcon };
  };

  const displayTree = useMemo(() => {
    const shouldHideUnlabeled = !showUnlabeled;
    const isSubcategoryUnlabeled = (id: string) => {
      if (id.startsWith("unlabeled:")) return true;
      const parts = id.split(":");
      const prefix = parts[0];
      if (!["sub", "owner", "contract"].includes(prefix)) return false;
      return (parts[3] ?? "") === "unlabeled";
    };

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

    const makeNode = (
      id: string,
      depth: number,
      valueOverrides?: Map<string, number>,
    ): DisplayNode | null => {
      const node = parsed.nodeById[id];
      if (!node) return null;
      if (shouldHideUnlabeled && isSubcategoryUnlabeled(id)) return null;
      const nodeValue = valueOverrides?.get(id) ?? node.value;

      const current: DisplayNode = {
        id: node.id,
        name: node.name,
        value: nodeValue,
        color: node.color ?? DEFAULT_COLOR,
        hierarchyLevel: getHierarchyLevel(node.id),
        fullPath: getFullPath(node.id),
        sharePct: parsed.totalValue > 0 ? (nodeValue / parsed.totalValue) * 100 : 0,
      };

      if (depth >= selectedDepth) return current;

      const childrenRaw = parsed.childrenByParent[id] ?? [];
      const children = shouldHideUnlabeled
        ? childrenRaw.filter((child) => !isSubcategoryUnlabeled(child.id))
        : childrenRaw;
      const minShareOfParent = depth === 1 ? 0.002 : depth === 2 ? 0.008 : 0.015;
      const minValue = nodeValue * minShareOfParent;
      const primaryChildren = children.filter((child) => child.value >= minValue);
      const tinyChildren = children.filter((child) => child.value < minValue);
      const isExplicitUnlabeled = (child: NodeData) =>
        child.id.includes(":unlabeled") && !child.id.startsWith("unlabeled:");
      const isAggregatedOthers = (child: NodeData) => child.id.includes(":all others");

      const keptChildren = primaryChildren.slice(0, MAX_CHILDREN_PER_PARENT);
      const hiddenChildren = [
        ...tinyChildren,
        ...primaryChildren.slice(MAX_CHILDREN_PER_PARENT),
      ];

      const unlabeledChild = children.find(isExplicitUnlabeled);
      if (unlabeledChild && !keptChildren.some((child) => child.id === unlabeledChild.id)) {
        keptChildren.push(unlabeledChild);
        const overflow = keptChildren.length - MAX_CHILDREN_PER_PARENT;
        if (overflow > 0) {
          keptChildren
            .filter((child) => !isExplicitUnlabeled(child))
            .sort((a, b) => a.value - b.value)
            .slice(0, overflow)
            .forEach((child) => {
              const idx = keptChildren.findIndex((item) => item.id === child.id);
              if (idx >= 0) keptChildren.splice(idx, 1);
              hiddenChildren.push(child);
            });
        }
      }

      const aggregatedChild = children.find(isAggregatedOthers);
      if (aggregatedChild && !keptChildren.some((child) => child.id === aggregatedChild.id)) {
        keptChildren.push(aggregatedChild);
      }

      const overrides = new Map<string, number>();
      if (aggregatedChild && hiddenChildren.length > 0) {
        const hiddenValue = hiddenChildren.reduce((sum, child) => sum + child.value, 0);
        overrides.set(aggregatedChild.id, aggregatedChild.value + hiddenValue);
        hiddenChildren.length = 0;
      }

      const mappedChildren = keptChildren
        .map((child) => makeNode(child.id, depth + 1, overrides))
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
        const childrenSum = mappedChildren.reduce((sum, child) => sum + child.value, 0);
        const missingValue = nodeValue - childrenSum;
        if (missingValue > 0.0001) {
          mappedChildren.push({
            id: `unlabeled:${id}:${depth}`,
            name: "Unlabeled",
            value: missingValue,
            color: addAlpha(node.color ?? DEFAULT_COLOR, 0.25),
            hierarchyLevel: "Unlabeled",
            fullPath: `${getFullPath(id)} > Unlabeled`,
            sharePct: parsed.totalValue > 0 ? (missingValue / parsed.totalValue) * 100 : 0,
          });
        }
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
      .filter((node) => (shouldHideUnlabeled ? !isSubcategoryUnlabeled(node.id) : true))
      .map((node) => makeNode(node.id, 1))
      .filter(Boolean) as DisplayNode[];

    const displayTotalValue = rootChildren.reduce((sum, node) => sum + node.value, 0);

    return {
      id: "__root__",
      name: "All chains",
      value: displayTotalValue,
      color: "transparent",
      hierarchyLevel: "Root",
      fullPath: "All chains",
      sharePct: 100,
      children: rootChildren,
    } as DisplayNode;
  }, [effectiveRootId, parsed.childrenByParent, parsed.nodeById, parsed.totalValue, selectedDepth, showUnlabeled]);

  const laidOutNodes = useMemo(() => {
    const fallbackWidth =
      typeof window !== "undefined"
        ? Math.max(Math.min(window.innerWidth - 120, 2200), 1000)
        : 1200;
    const width = containerWidth > 0 ? containerWidth - 2 : fallbackWidth;
    const height = 720;
    if (!width || !displayTree.children?.length) return [];

    const root = hierarchy(displayTree)
      .sum((node) => (node.children ? 0 : node.value))
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
      .paddingOuter((node) => getPaddingOuter(node))
      .paddingInner((node) => getPaddingInner(node))
      .paddingTop((node) => {
        if (node.depth === 0 || !node.children) return 0;
        const boxHeight = node.y1 - node.y0;
        const headerHeight = getHeaderHeight(boxHeight);
        if (!headerHeight) return 0;
        return headerHeight + HEADER_VERTICAL_PADDING * 2 + 4;
      })(root as any) as HierarchyRectangularNode<DisplayNode>;

    return treemapRoot.descendants().filter((node) => node.depth > 0);
  }, [containerWidth, displayTree]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const hoveredNode = useMemo(
    () => laidOutNodes.find((node) => node.data.id === hoveredId) ?? null,
    [hoveredId, laidOutNodes],
  );

  const metricFormatter = useMemo(() => {
    const metricKey = resolveMetricValueKey(selectedMetric, showUsd);
    return new Intl.NumberFormat("en-US", METRIC_FORMAT[metricKey]);
  }, [selectedMetric, showUsd]);

  const contractCountById = useMemo(() => {
    const cache: Record<string, number> = {};
    const count = (id: string): number => {
      if (cache[id] !== undefined) return cache[id];
      if (id.startsWith("contract:")) {
        cache[id] = 1;
        return 1;
      }
      const children = parsed.childrenByParent[id] ?? [];
      if (!children.length) {
        cache[id] = 0;
        return 0;
      }
      const total = children.reduce((sum, child) => sum + count(child.id), 0);
      cache[id] = total;
      return total;
    };
    return { count };
  }, [parsed.childrenByParent]);


  const hasSourceData = (displayTree.children?.length ?? 0) > 0;

  // Debug logging removed

  return (
    <div className="flex flex-col gap-y-[15px]">
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />

      <TopRowContainer className="gap-y-[10px]">
        <TopRowParent>
          {Object.entries(METRIC_LABELS).map(([key, { label, shortLabel }]) => (
            <TopRowChild
              key={key}
              className="flex items-center justify-center h-[28px] lg:h-[44px]"
              isSelected={selectedMetric === (key as MetricKey)}
              onClick={() => setSelectedMetric(key as MetricKey)}
            >
              <span className="hidden sm:block">{label}</span>
              <span className="block sm:hidden">{shortLabel}</span>
            </TopRowChild>
          ))}
        </TopRowParent>
        <TopRowParent>
          {[
            { id: "1d", label: "Yesterday", shortLabel: "1d" },
            { id: "7d", label: "Last 7 Days", shortLabel: "7d" },
          ].map((option) => (
            <TopRowChild
              key={option.id}
              className="flex items-center justify-center h-[28px] lg:h-[44px]"
              isSelected={selectedTimespan === option.id}
              onClick={() => setSelectedTimespan(option.id as "1d" | "7d")}
            >
              <span className="hidden sm:block">{option.label}</span>
              <span className="block sm:hidden">{option.shortLabel}</span>
            </TopRowChild>
          ))}
          <div
            className="relative z-[50]"
            onMouseEnter={() => setHoverSettings(true)}
            onMouseLeave={() => setHoverSettings(false)}
          >
            <div
              className={`flex items-center relative h-[28px] lg:h-[44px] bg-color-ui-active gap-x-[10px] rounded-full px-[7px] overflow-clip md:px-[15px] py-[10px] transition-all z-[2] duration-300 hover:cursor-pointer ${hoverSettings ? "w-[190px] md:w-[336px] justify-start" : "w-[28px] md:w-[128px] justify-start"
                }`}
            >
              <GTPIcon
                icon="gtp-settings"
                size="sm"
                className="!size-[15px] lg:!size-[24px]"
                containerClassName="!size-[28px] flex items-center jusity-center lg:!size-[24px]"
              />

              <div className="font-semibold transition-all">Settings</div>
            </div>

            <div
              className={`absolute top-1/2 min-h-0 w-[190px] md:w-[336px] bg-color-bg-default right-0 rounded-b-2xl z-[1] transition-all duration-300 overflow-hidden ${hoverSettings ? "shadow-standard" : "shadow-transparent"
                }`}
              style={{
                width: hoverSettings ? undefined : 0,
                height: hoverSettings ? "140px" : 0,
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              }}
              onMouseEnter={() => setHoverSettings(true)}
              onMouseLeave={() => setHoverSettings(false)}
            >
              <div className={`pt-[22px] pb-[12px] flex flex-col w-[190px] md:w-[336px] ${hoverSettings ? "opacity-100" : "opacity-0"} transition-opacity`}>
                <div className="flex flex-col w-full">
                  <div className="flex items-center w-full">
                    <div className="flex flex-col gap-y-[5px] text-[12px] md:pt-[10px] w-full pl-[15px] pr-[15px]">
                      <div className="font-normal text-color-text-primary/50 md:text-right">
                        Treemap settings
                      </div>
                      <div className="grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] items-center w-full place-items-center whitespace-nowrap">
                        <div className="flex flex-1 items-center place-self-start md:place-self-end">
                          <div className="font-semibold text-right">
                            Unlabeled
                          </div>
                        </div>
                        <div className="rounded-full w-[6px] h-[6px] bg-color-bg-medium hidden md:block" />
                        <ToggleSwitch
                          size="sm"
                          values={[
                            { value: "show", label: "Show" },
                            { value: "hide", label: "Hide" },
                          ]}
                          value={showUnlabeled ? "show" : "hide"}
                          onChange={(v) => setShowUnlabeled(v === "show")}
                          ariaLabel="Toggle unlabeled data visibility"
                          className="w-full [&>div]:w-full"
                        />
                      </div>
                      <div className="grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] pt-[5px] md:pt-0 items-center w-full place-items-center whitespace-nowrap">
                        <div className="flex flex-1 items-center place-self-start md:place-self-end">
                          <div className="font-semibold text-right">
                            Visualized levels
                          </div>
                        </div>
                        <div className="rounded-full w-[6px] h-[6px] bg-color-bg-medium hidden md:block" />
                        <StepSwitch
                          size="sm"
                          min={MIN_DEPTH}
                          max={MAX_DEPTH}
                          value={selectedDepth}
                          onChange={setSelectedDepth}
                          ariaLabel="Select visualization depth"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TopRowParent>
      </TopRowContainer>

      <div className="flex flex-col gap-y-[5px]">
        <div className="text-sm md:heading-lg flex items-center gap-x-[5px] w-full flex-wrap">
          {!chainLabel && (
            <button
              type="button"
              className="hover:underline whitespace-nowrap"
              onClick={() => setRootId(null)}
            >
              All chains
            </button>
          )}
          {currentPath.map((node, index) => {
            const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.id);
            const isLast = index === currentPath.length - 1;
            return (
              <div key={node.id} className="flex items-center gap-x-[5px] whitespace-nowrap">
                <span className="text-color-text-secondary">&gt;</span>
                {chainIcon ? (
                  <GTPIcon icon={chainIcon as any} size="sm" className="shrink-0" />
                ) : ownerProjectLogo ? (
                  <Image
                    src={ownerProjectLogo}
                    alt={node.name}
                    className="w-[16px] h-[16px] rounded-[3px] object-cover shrink-0"
                    width={16}
                    height={16}
                  />
                ) : mainCategoryIcon ? (
                  <GTPIcon icon={mainCategoryIcon as any} size="sm" className="shrink-0" />
                ) : null}
                <button
                  type="button"
                  className={`hover:underline ${isLast ? "text-color-text-primary" : "text-color-text-secondary"} whitespace-nowrap`}
                  onClick={() => setRootId(node.id)}
                >
                  {node.name}
                </button>
              </div>
            );
          })}
          {effectiveRootId && (
            <button
              className="bg-color-bg-default rounded-full size-[26px] flex items-center justify-center"
              onClick={() => setRootId(null)}
            >
              <Image
                src="/In-Button-Close.svg"
                alt="Close"
                className="relative left-[0.5px] bottom-[0.5px]"
                width={16}
                height={16}
              />
            </button>
          )}
        </div>
        <div className="text-xs">
          Blockspace usage by {getMetricLabel(selectedMetric, showUsd)}{selectedTimespan === "7d" ? " over the last 7 days" : ""}
        </div>
      </div>

      <div className="relative z-[10] overflow-hidden">
        {hasSourceData ? (
          <div
            ref={setContainerEl}
            className="relative w-full h-[720px] overflow-hidden"
            onMouseMove={(event) => {
              setTooltipPos({
                x: event.clientX,
                y: event.clientY,
              });
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              setTooltipPos(null);
            }}
          >
            {laidOutNodes.map((node) => {
              const width = Math.max(0, node.x1 - node.x0);
              const height = Math.max(0, node.y1 - node.y0);

              const isContainer = !!node.children?.length;
              const canSelectNode =
                !node.data.id.startsWith("other:") && !node.data.id.startsWith("unlabeled:");
              const isHovered = hoveredId === node.data.id;
              const canShowHeader = isContainer && width >= 84 && height >= 34;
              const canShowHeaderShare = canShowHeader && width >= 150;
              const canShowLeafLabel = !isContainer && width * height > 2800 && width >= 70 && height >= 18;
              const canShowContractAddress = width >= 120;
              const maxRadius = node.depth <= 1 ? 15 : node.depth === 2 ? 10 : 6;
              const borderRadius = Math.max(0, Math.min(maxRadius, Math.floor(width / 5), Math.floor(height / 5)));
              const headerHeight = canShowHeader ? getHeaderHeight(height) : 0;
              const chainOutlineColor = getChainColorForNode(node.data.id, AllChainsByKeys as any);
              const neutralBg =
                node.depth <= 1
                  ? "rgb(var(--bg-medium) / 0.14)"
                  : node.depth === 2
                    ? "rgb(var(--bg-medium) / 0.2)"
                    : node.depth === 3
                      ? "rgb(var(--bg-medium) / 0.26)"
                      : "rgb(var(--bg-medium) / 0.3)";


              return (
                <div
                  key={node.data.id}
                  className={`absolute border overflow-hidden ${canSelectNode ? "cursor-pointer" : "cursor-default"}`}
                  style={{
                    left: `${node.x0}px`,
                    top: `${node.y0}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    background: neutralBg,
                    borderColor: isHovered ? "#F4F6F5" : chainOutlineColor,
                    borderWidth: isHovered ? node.depth <= 2 ? "2px" : "1px" : width < 4 || height < 4 ? "0px" : node.depth <= 2 ? "2px" : "1px",
                    boxShadow: isHovered ? "inset 0 0 0 1px #FFFFFF88" : undefined,
                    borderRadius: `${borderRadius}px`,
                  }}
                  onClick={() => {
                    if (canSelectNode) setRootId(node.data.id);
                  }}
                  onMouseEnter={() => setHoveredId(node.data.id)}
                >
                  {canShowHeader && (
                    <div
                      className={`absolute left-0 top-0 w-full border-b border-[#FFFFFF33] px-[10px] py-[2px] flex items-center overflow-hidden ${isHovered ? "bg-[#0C100F85]" : "bg-[#0C100F66]"
                        }`}
                      style={{ height: `${headerHeight + HEADER_VERTICAL_PADDING * 2}px` }}
                    >
                      {(() => {
                        const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.data.id);

                        return (
                          <div className="flex items-center gap-[5px] min-w-0">
                            {ownerProjectLogo ? (
                              <Image
                                src={ownerProjectLogo}
                                alt={node.data.name}
                                className="w-[14px] rounded-[3px] object-cover shrink-0"
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
                            {canShowHeaderShare && (
                              <span className="text-[11px] text-[#D7DEDC] shrink-0">
                                {node.data.sharePct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {canShowLeafLabel && (
                    (() => {
                      const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.data.id);
                      const contractAddress = getContractAddressFromId(node.data.id);
                      const shortContract = contractAddress ? shortAddress(contractAddress) : "";
                      const isContract = node.data.id.startsWith("contract:");
                      const showAddressInline =
                        isContract &&
                        shortContract &&
                        canShowContractAddress &&
                        !isAggregatedContractAddress(contractAddress);
                      const displayName =
                        isContract && showAddressInline
                          ? node.data.name && node.data.name !== shortContract
                            ? `${node.data.name} (${shortContract})`
                            : shortContract
                          : node.data.name;

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
                            <span className="truncate">{displayName}</span>
                          </div>
                        </div>
                      );
                    })()
                  )}

                </div>
              );
            })}

            {laidOutNodes.length > 0 && <TreemapTooltip
              hoveredNode={hoveredNode}
              tooltipPos={tooltipPos}
              selectedMetric={selectedMetric}
              showUsd={showUsd}
              metricFormatter={metricFormatter}
              contractCountById={contractCountById}
              parsed={parsed}
              AllChainsByKeys={AllChainsByKeys}
              getNodeIcons={getNodeIcons}
              getChainIconForId={getChainIconForId}
            />}
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
