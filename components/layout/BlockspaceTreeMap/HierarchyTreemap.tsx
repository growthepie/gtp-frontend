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
import { FloatingPortal } from "@floating-ui/react";
import dayjs from "@/lib/dayjs";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";

type RawTreeMapResponse = {
  data?: {
    types?: string[];
    data?: Array<Array<string | number | null>>;
  };
};

type MetricKey = "txcount" | "fees";
type MetricValueKey = "txcount" | "fees_paid_usd" | "fees_paid_eth";
type GroupByKey = "chain" | "category" | "owner";
type HierarchyDimension = "chain" | "main" | "sub" | "owner" | "contract";
type ColorTheme = "dark" | "light";

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

const GROUP_BY_LABELS: Record<GroupByKey, { label: string; shortLabel: string }> = {
  chain: { label: "By Chains", shortLabel: "Chains" },
  category: { label: "By Categories", shortLabel: "Categories" },
  owner: { label: "By Apps", shortLabel: "Apps" },
};

const GROUP_BY_DIMENSIONS: Record<GroupByKey, HierarchyDimension[]> = {
  chain: ["chain", "main", "sub", "owner", "contract"],
  category: ["main", "chain", "sub", "owner", "contract"],
  owner: ["owner", "chain", "main", "sub", "contract"],
};

const getRootScopeLabel = (groupBy: GroupByKey, chainLabel: string | null) => {
  const baseLabel =
    groupBy === "chain"
      ? "All Chains"
      : groupBy === "category"
        ? "All Categories"
        : "All Apps";

  if (!chainLabel) return baseLabel;
  if (groupBy === "chain") return chainLabel;
  return `${groupBy === "category" ? "Categories" : "Apps"} in ${chainLabel}`;
};

type SettingsDropdownOption = {
  value: string;
  label: string;
};

function SettingsDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  isOpen,
  onOpenChange,
  disabled = false,
}: {
  value: string;
  options: SettingsDropdownOption[];
  onChange: (nextValue: string) => void;
  ariaLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? "z-[120]" : "z-0"}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onOpenChange(!isOpen);
        }}
        className={`relative w-full h-[24px] rounded-full  heading-small-xxs font-semibold pl-[10px] pr-[24px] text-left transition-colors ${
          disabled
            ? "cursor-default opacity-50 bg-color-bg-medium text-color-text-primary"
            : "bg-color-bg-medium hover:bg-color-ui-hover text-color-text-primary"
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <GTPIcon
          icon="gtp-chevronright-monochrome"
          size="sm"
          className={`!size-[10px] text-color-text-primary/70 transition-transform duration-200 ${
            isOpen ? "-rotate-90" : "rotate-90"
          }`}
          containerClassName="!h-full pointer-events-none absolute right-[8px] inset-y-0 flex items-center"
        />
      </button>

      <div
        role="listbox"
        aria-label={ariaLabel}
        className={`absolute left-0 right-0 top-[calc(100%+4px)] flex flex-col whitespace-normal rounded-[12px] bg-color-bg-default shadow-standard overflow-hidden origin-top transition-all duration-150 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto z-[200]" : "opacity-0 -translate-y-[2px] pointer-events-none z-[-1]"
        }`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={`block w-full h-[30px] shrink-0 px-[10px] text-left heading-small-xxs font-semibold transition-colors ${
                index > 0 ? "" : ""
              } ${
                isSelected
                  ? "bg-color-ui-active text-color-text-primary"
                  : "bg-color-bg-default text-color-text-primary/80 hover:bg-color-ui-hover hover:text-color-text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

const encodeNodeValue = (value: string) => encodeURIComponent(value);
const decodeNodeValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const buildNodeId = (
  nodeType: HierarchyDimension,
  context: Array<[HierarchyDimension, string]>,
) => `${nodeType}:${context.map(([key, value]) => `${key}=${encodeNodeValue(value)}`).join("|")}`;

const extractNodeDimension = (nodeId: string, dimension: HierarchyDimension) => {
  const match = nodeId.match(new RegExp(`${dimension}=([^|:]+)`));
  if (!match) return null;
  return decodeNodeValue(match[1]);
};

const getContractAddressFromId = (nodeId: string) => {
  if (!nodeId.startsWith("contract:")) return "";
  return extractNodeDimension(nodeId, "contract") ?? "";
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
  if (boxHeight < 42) return 0;
  if (boxHeight < 80) return 16;
  if (boxHeight < 130) return 18;
  if (boxHeight < 180) return 22;
  return 26;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getSpacingBase = (size: number) => {
  if (size < 56) return 0;
  if (size < 96) return 1;
  if (size < 160) return 2;
  if (size < 260) return 3;
  return 4;
};

const getPaddingOuter = (node: { depth: number; x0: number; x1: number; y0: number; y1: number }) => {
  const size = Math.min(node.x1 - node.x0, node.y1 - node.y0);
  const base = getSpacingBase(size);
  const depthOffset = node.depth <= 1 ? 1 : node.depth === 2 ? 0 : 0;
  const maxByDepth = node.depth <= 1 ? 6 : node.depth === 2 ? 4 : 3;
  return clamp(base + depthOffset, 0, maxByDepth);
};

const getPaddingInner = (node: { depth: number; x0: number; x1: number; y0: number; y1: number }) => {
  const size = Math.min(node.x1 - node.x0, node.y1 - node.y0);
  const base = getSpacingBase(size);
  const depthPenalty = node.depth <= 1 ? 1 : node.depth === 2 ? 2 : 1;
  const maxByDepth = node.depth <= 1 ? 4 : node.depth === 2 ? 3 : 3;
  return clamp(base - depthPenalty, 0, maxByDepth);
};

const getNodeBorderRadius = (depth: number, width: number, height: number) => {
  const minSide = Math.min(width, height);
  if (minSide < 8) return 0;

  const depthCap = depth <= 1 ? 14 : depth === 2 ? 10 : depth === 3 ? 8 : 6;
  const scaledBySize = Math.floor(minSide / 6);
  const radius = Math.min(depthCap, scaledBySize);

  return radius >= 2 ? radius : 0;
};

const getChainColorForNode = (
  nodeId: string,
  allChainsByKeys: Record<string, { colors?: { dark?: string[]; light?: string[] } }>,
  colorTheme: ColorTheme = "dark",
) => {
  const chainKey = extractNodeDimension(nodeId, "chain") ?? "";
  const colors = allChainsByKeys[chainKey]?.colors;
  return (
    colors?.[colorTheme]?.[0]
    ?? colors?.dark?.[0]
    ?? colors?.light?.[0]
    ?? "#4A5A58"
  );
};

const MAIN_CATEGORY_ICONS: Record<string, string> = {
  defi: "gtp-defi",
  finance: "gtp-defi",
  nft: "gtp-nft",
  token_transfers: "gtp-tokentransfers",
  utility: "gtp-utilities",
  social: "gtp-socials",
  cefi: "gtp-cefi",
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
  selectedTimespan,
  showUsd,
  rootScopeLabel,
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
  selectedTimespan: "1d" | "7d";
  showUsd: boolean;
  rootScopeLabel: string;
  metricFormatter: Intl.NumberFormat;
  contractCountById: { count: (id: string) => number };
  parsed: {
    nodeById: Record<string, NodeData>;
    childrenByParent: Record<string, NodeData[]>;
    totalValue: number;
    chainTotals: Record<string, number>;
  };
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
  const nodeChainKey = extractNodeDimension(hoveredNode.data.id, "chain") ?? "";
  const chainTotal = nodeChainKey ? parsed.chainTotals[nodeChainKey] ?? 0 : 0;
  const parentIsChain = parentNode?.id?.startsWith("chain:");
  const chainShare = !isChainNode && !parentIsChain && chainTotal > 0
    ? (hoveredNode.data.value / chainTotal) * 100
    : null;
  const chainLabel = nodeChainKey
    ? (AllChainsByKeys[nodeChainKey]?.label ?? keyToTitle(nodeChainKey))
    : "";

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

  // Compact value formatting for children list
  const formatCompactValue = (value: number): string => {
    const prefix = selectedMetric === "fees" ? (showUsd ? "$" : "Ξ") : "";
    if (selectedMetric === "fees" && !showUsd) {
      if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
      if (value >= 1) return `${prefix}${value.toFixed(2)}`;
      return `${prefix}${value.toFixed(4)}`;
    }
    if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
    return `${prefix}${Math.round(value).toLocaleString("en-US")}`;
  };

  const pathParts = hoveredNode.data.fullPath.split(" > ").filter(Boolean);
  const parentNameFromPath = pathParts.length > 1 ? pathParts[pathParts.length - 2] : null;
  const parentContextPathFromPath = pathParts.length > 2 ? pathParts.slice(0, -2).join(" > ") : null;
  const compactPath = (path: string | null) => {
    if (!path) return "";
    const parts = path.split(" > ").filter(Boolean);
    if (parts.length <= 2) return parts.join(" > ");
    return `... > ${parts.slice(-2).join(" > ")}`;
  };

  // Breadcrumb: show ancestors only (exclude the current node name)
  const ancestorPath = (() => {
    if (pathParts.length <= 1) return null;
    const ancestors = pathParts.slice(0, -1);
    if (ancestors.length >= 5) {
      return [ancestors[0], "...", ...ancestors.slice(-2)].join(" > ");
    }
    return ancestors.join(" > ");
  })();

  const timespanLabel = selectedTimespan === "7d" ? "Last 7d" : "Yesterday";
  const contractCount = contractCountById.count(hoveredNode.data.id);

  // Single share line to reduce tooltip noise: parent > chain > global.
  const primaryShare: {
    pct: number;
    denominator: string;
    barColor: string;
  } = (() => {
    if (parentShare !== null) {
      const parentName = parentNameFromPath ?? parentNode!.name;
      const hasParentContext =
        !!parentContextPathFromPath && parentContextPathFromPath !== rootScopeLabel;
      return {
        pct: parentShare,
        denominator: hasParentContext
          ? `${parentName} in ${compactPath(parentContextPathFromPath)}`
          : parentName,
        barColor: `color-mix(in srgb, ${chainOutlineColor} 50%, transparent)`,
      };
    }

    if (chainShare !== null) {
      return {
        pct: chainShare,
        denominator: `${chainLabel} total`,
        barColor: `color-mix(in srgb, ${chainOutlineColor} 70%, transparent)`,
      };
    }

    return {
      pct: hoveredNode.data.sharePct,
      denominator: rootScopeLabel,
      barColor: chainOutlineColor,
    };
  })();

  // Top children helper
  const getTopChildren = (nodeId: string, n: number): { name: string; value: number; pct: number }[] => {
    const children = parsed.childrenByParent[nodeId];
    if (!children || children.length === 0) return [];
    const nodeValue = parsed.nodeById[nodeId]?.value ?? 0;
    if (nodeValue <= 0) return [];
    const sorted = [...children].filter(child => child.value > 0).sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, n);
    const rest = sorted.slice(n);
    const result = top.map(child => ({
      name: child.name,
      value: child.value,
      pct: (child.value / nodeValue) * 100,
    }));
    if (rest.length > 0) {
      const otherValue = rest.reduce((sum, child) => sum + child.value, 0);
      result.push({
        name: "Other",
        value: otherValue,
        pct: (otherValue / nodeValue) * 100,
      });
    }
    return result;
  };

  const hasChildren = (hoveredNode.children?.length ?? 0) > 0;
  const topChildren = hasChildren ? getTopChildren(hoveredNode.data.id, 3) : [];
  const feesPerContract = selectedMetric === "fees" && contractCount > 0
    ? hoveredNode.data.value / contractCount
    : null;

  return (
    <FloatingPortal>
      <div
        ref={tooltipRef}
        className="fixed z-50 rounded-[15px]  bg-color-bg-default px-[15px] py-[10px] text-color-text-primary shadow-standard pointer-events-none flex flex-col gap-y-[8px] max-w-[380px] min-w-[260px] w-max"
        style={{
          left: `${adjustedPos.left}px`,
          top: `${adjustedPos.top}px`,
        }}
      >
        {/* A) Header: icon + name + breadcrumb + timespan */}
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
          <div className="heading-small-xxxs tracking-wide">
            {ancestorPath ? `${ancestorPath} · ${timespanLabel}` : timespanLabel}
          </div>
        </div>

        {/* B) Primary metric */}
        <div>
          <div className="numbers-lg">
            {selectedMetric === "fees" && (showUsd ? "$" : "Ξ")}
            {formatValue(hoveredNode.data.value)}
          </div>
          <div className="heading-small-xxxs">
            {getMetricLabel(selectedMetric, showUsd)}
            {contractCount > 0 && (
              <> · <span className="numbers-xs">{contractCount.toLocaleString()}</span> contract{contractCount !== 1 ? "s" : ""}</>
            )}
          </div>
        </div>

        {/* C) Share (single denominator) */}
        <div className="flex flex-col gap-y-[3px]">
          <div className="flex items-end justify-between gap-x-[10px]">
            <div className="text-xxs font-semibold text-color-text-primary/90">Share {`of ${primaryShare.denominator}`}</div>
            <div className="numbers-xs">{primaryShare.pct.toFixed(2)}%</div>
          </div>
          <div className="h-[3px] rounded-full bg-color-bg-medium mt-[2px]">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${Math.min(primaryShare.pct, 100)}%`, backgroundColor: primaryShare.barColor }}
            />
          </div>
        </div>

        {/* D) Context stats grid */}
        {feesPerContract !== null && (
          <div className="grid grid-cols-[auto_1fr] gap-x-[10px] gap-y-[2px]">
            <span className="text-xxs">Fees/contract</span>
            <span className="numbers-xs text-right">
              {showUsd ? "$" : "Ξ"}{formatValue(feesPerContract)}
            </span>
          </div>
        )}

        {/* E) Top children composition (parent nodes only) */}
        {topChildren.length > 0 && (
          <div>
            <div className="heading-small-xxxs text-color-text-secondary mb-[4px]">Top inside {hoveredNode.data.name}:</div>
            <div className="flex flex-col gap-y-[2px]">
              {topChildren.map((child, i) => (
                <div key={`${child.name}-${i}`} className="grid grid-cols-[1fr_auto_auto] gap-x-[8px] items-baseline">
                  <span className="text-xxs truncate">{child.name}</span>
                  <span className="numbers-xs text-right">{formatCompactValue(child.value)}</span>
                  <span className="numbers-xs text-right w-[42px]">{child.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FloatingPortal>
  );
}

export default function HierarchyTreemap({ chainKey }: { chainKey?: string }) {
  const { AllChainsByKeys } = useMaster();
  const { data, isLoading, isValidating } = useSWR<RawTreeMapResponse>(BlockspaceURLs["tree-map"]);
  const { data: projectsData } = useSWR<any>(LabelsURLS.projectsFiltered);
  const { resolvedTheme } = useTheme();
  const colorTheme: ColorTheme = resolvedTheme === "light" ? "light" : "dark";

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("txcount");
  const [selectedTimespan, setSelectedTimespan] = useState<"1d" | "7d">("1d");
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByKey>("chain");
  const [includeChainBreakdown, setIncludeChainBreakdown] = useState<boolean>(true);
  const [showUsd] = useLocalStorage("showUsd", true);
  const [showUnlabeled, setShowUnlabeled] = useState<boolean>(false);
  const [selectedDepth, setSelectedDepth] = useState<number>(DEFAULT_DEPTH);
  const [hoverSettings, setHoverSettings] = useState<boolean>(false);
  const [isGroupByDropdownOpen, setIsGroupByDropdownOpen] = useState<boolean>(false);
  const [rootId, setRootId] = useState<string | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (selectedGroupBy === "chain" && !includeChainBreakdown) {
      setIncludeChainBreakdown(true);
    }
  }, [selectedGroupBy, includeChainBreakdown]);

  useEffect(() => {
    if (!hoverSettings) {
      setIsGroupByDropdownOpen(false);
    }
  }, [hoverSettings]);

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
        chainTotals: {} as Record<string, number>,
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
        chainTotals: {} as Record<string, number>,
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

    const hierarchyOrder = (
      selectedGroupBy === "chain" || includeChainBreakdown
        ? GROUP_BY_DIMENSIONS[selectedGroupBy]
        : GROUP_BY_DIMENSIONS[selectedGroupBy].filter((dimension) => dimension !== "chain")
    ) as HierarchyDimension[];
    const nodes = new Map<string, NodeData>();
    const chainTotals: Record<string, number> = {};

    rows.forEach((row) => {
      if (dateSet.size > 0 && !dateSet.has(String(row[dateIndex]))) return;

      const rowChainKey = String(row[chainIndex] ?? "unknown");
      if (chainKey && rowChainKey !== chainKey) return;
      const mainCategoryKey = normalizeHierarchyKey(row[mainCategoryIndex]);
      const subCategoryKey = normalizeHierarchyKey(row[subCategoryIndex]);
      const ownerKey = normalizeHierarchyKey(row[ownerIndex]);
      if (!showUnlabeled && subCategoryKey === "unlabeled") return;
      if (!showUnlabeled && selectedGroupBy === "owner" && ownerKey === "unlabeled") return;
      const address = String(row[addressIndex] ?? "unknown").toLowerCase();
      const contractName = String(row[contractNameIndex] ?? "Unknown Contract");
      const metricValue = toNumber(row[metricIndex]);
      if (metricValue <= 0) return;

      const chainLabel = AllChainsByKeys[rowChainKey]?.label ?? keyToTitle(rowChainKey);
      const chainColor = (
        AllChainsByKeys[rowChainKey]?.colors?.[colorTheme]?.[0]
        ?? AllChainsByKeys[rowChainKey]?.colors?.dark?.[0]
        ?? AllChainsByKeys[rowChainKey]?.colors?.light?.[0]
        ?? DEFAULT_COLOR
      );
      const resolvedContractName = contractName === "-" ? shortAddress(address) : contractName;

      const dimensionValues: Record<HierarchyDimension, string> = {
        chain: rowChainKey,
        main: mainCategoryKey,
        sub: subCategoryKey,
        owner: ownerKey,
        contract: address,
      };
      const dimensionNames: Record<HierarchyDimension, string> = {
        chain: chainLabel,
        main: keyToTitle(mainCategoryKey),
        sub: keyToTitle(subCategoryKey),
        owner: keyToTitle(ownerKey),
        contract: resolvedContractName,
      };
      const dimensionColors: Record<HierarchyDimension, string> = {
        chain: chainColor,
        main: addAlpha(chainColor, 0.9),
        sub: addAlpha(chainColor, 0.8),
        owner: addAlpha(chainColor, 0.7),
        contract: addAlpha(chainColor, 0.6),
      };

      let parentId: string | undefined;
      const context: Array<[HierarchyDimension, string]> = [];

      hierarchyOrder.forEach((dimension) => {
        const value = dimensionValues[dimension];
        context.push([dimension, value]);
        const nodeId = buildNodeId(dimension, context);

        if (!nodes.has(nodeId)) {
          nodes.set(nodeId, {
            id: nodeId,
            parent: parentId,
            name: dimensionNames[dimension],
            value: 0,
            color: dimensionColors[dimension],
          });
        }

        nodes.get(nodeId)!.value += metricValue;
        parentId = nodeId;
      });

      chainTotals[rowChainKey] = (chainTotals[rowChainKey] ?? 0) + metricValue;
    });

    const chartData = Array.from(nodes.values());

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

    const totalValue = Object.values(chainTotals).reduce((sum, value) => sum + value, 0);

    return {
      dates,
      latestDate,
      chartData,
      totalValue,
      chainTotals,
      nodeById,
      childrenByParent,
    };
  }, [data, selectedTimespan, selectedMetric, selectedGroupBy, includeChainBreakdown, showUsd, showUnlabeled, AllChainsByKeys, chainKey, colorTheme]);

  const effectiveRootId = rootId && parsed.nodeById[rootId] ? rootId : null;
  const chainLabel = chainKey
    ? AllChainsByKeys[chainKey]?.label ?? keyToTitle(chainKey)
    : null;
  const rootScopeLabel = getRootScopeLabel(selectedGroupBy, chainLabel);

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
    const chainKey = extractNodeDimension(nodeId, "chain") ?? "";
    if (!chainKey || !AllChainsByKeys[chainKey]) return null;
    const chainUrlKey = AllChainsByKeys[chainKey]?.urlKey ?? chainKey.replace(/_/g, "-");
    return `${chainUrlKey}-logo-monochrome`;
  };

  const getNodeIcons = (nodeId: string) => {
    const prefix = nodeId.split(":")[0];
    const chainKey = extractNodeDimension(nodeId, "chain") ?? "";
    const isMainCategory = prefix === "main";
    const hasOwnerProject = prefix === "owner" || prefix === "contract";
    const mainCategoryKey = isMainCategory ? (extractNodeDimension(nodeId, "main") ?? "") : "";
    const ownerProjectKey = hasOwnerProject ? (extractNodeDimension(nodeId, "owner") ?? "") : "";
    const mainCategoryIcon = MAIN_CATEGORY_ICONS[mainCategoryKey];
    const ownerProjectLogo = ownerProjectToLogo[ownerProjectKey];
    const chainUrlKey = chainKey
      ? (AllChainsByKeys[chainKey]?.urlKey ?? chainKey.replace(/_/g, "-"))
      : null;
    const chainIcon = prefix === "chain" && chainUrlKey ? `${chainUrlKey}-logo-monochrome` : null;

    return { mainCategoryIcon, ownerProjectLogo, chainIcon };
  };

  const displayTree = useMemo(() => {
    const shouldHideUnlabeled = !showUnlabeled;
    const isSubcategoryUnlabeled = (id: string) => {
      if (id.startsWith("unlabeled:")) return true;
      const prefix = id.split(":")[0];
      if (!["sub", "owner", "contract"].includes(prefix)) return false;

      const isUnlabeledSubcategory = (extractNodeDimension(id, "sub") ?? "") === "unlabeled";
      if (isUnlabeledSubcategory) return true;

      if (selectedGroupBy === "owner" && ["owner", "contract"].includes(prefix)) {
        return (extractNodeDimension(id, "owner") ?? "") === "unlabeled";
      }

      return false;
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
      const isExplicitUnlabeled = (child: NodeData) => {
        if (child.id.startsWith("unlabeled:")) return false;
        const isUnlabeledSubcategory = (extractNodeDimension(child.id, "sub") ?? "") === "unlabeled";
        if (isUnlabeledSubcategory) return true;
        if (selectedGroupBy === "owner") {
          return (extractNodeDimension(child.id, "owner") ?? "") === "unlabeled";
        }
        return false;
      };
      const isAggregatedOthers = (child: NodeData) =>
        (extractNodeDimension(child.id, "contract") ?? "") === "all others";

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
      name: rootScopeLabel,
      value: displayTotalValue,
      color: "transparent",
      hierarchyLevel: "Root",
      fullPath: rootScopeLabel,
      sharePct: 100,
      children: rootChildren,
    } as DisplayNode;
  }, [effectiveRootId, parsed.childrenByParent, parsed.nodeById, parsed.totalValue, rootScopeLabel, selectedDepth, selectedGroupBy, showUnlabeled]);

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
        const headerGap = node.depth <= 1 ? 4 : 3;
        return headerHeight + HEADER_VERTICAL_PADDING * 2 + headerGap;
      })(root as any) as HierarchyRectangularNode<DisplayNode>;

    return treemapRoot.descendants().filter((node) => node.depth > 0);
  }, [containerWidth, displayTree]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const hoveredNode = useMemo(
    () => laidOutNodes.find((node) => node.data.id === hoveredId) ?? null,
    [hoveredId, laidOutNodes],
  );

  useEffect(() => {
    setRootId(null);
    setHoveredId(null);
    setTappedId(null);
    setTooltipPos(null);
  }, [selectedGroupBy]);

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
              className={`absolute top-1/2 min-h-0 w-[190px] md:w-[336px] bg-color-bg-default right-0 rounded-b-2xl z-[1] transition-all duration-300 ${isGroupByDropdownOpen ? "overflow-visible" : "overflow-hidden"} ${hoverSettings ? "shadow-standard" : "shadow-transparent"
                }`}
              style={{
                width: hoverSettings ? undefined : 0,
                height: hoverSettings ? "220px" : 0,
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
                      <div className="relative z-[40] grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] items-center w-full place-items-center whitespace-nowrap">
                        <div className="flex flex-1 items-center place-self-start md:place-self-end">
                          <div className="font-semibold text-right">
                            Group by
                          </div>
                        </div>
                        <div className="rounded-full w-[6px] h-[6px] bg-color-bg-medium hidden md:block" />
                        <SettingsDropdown
                          value={selectedGroupBy}
                          options={[
                            { value: "chain", label: GROUP_BY_LABELS.chain.label },
                            { value: "category", label: GROUP_BY_LABELS.category.label },
                            { value: "owner", label: GROUP_BY_LABELS.owner.label },
                          ]}
                          onChange={(nextValue) => setSelectedGroupBy(nextValue as GroupByKey)}
                          ariaLabel="Select primary grouping"
                          isOpen={isGroupByDropdownOpen}
                          onOpenChange={setIsGroupByDropdownOpen}
                        />
                      </div>
                      <div className="relative z-0 grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] pt-[5px] md:pt-0 items-center w-full place-items-center whitespace-nowrap">
                        <div className="flex flex-1 items-center place-self-start md:place-self-end">
                          <div className="font-semibold text-right">
                            Chain breakdown
                          </div>
                        </div>
                        <div className="rounded-full w-[6px] h-[6px] bg-color-bg-medium hidden md:block" />
                        <ToggleSwitch
                          size="sm"
                          values={[
                            { value: "include", label: "Include" },
                            { value: "exclude", label: "Exclude" },
                          ]}
                          value={includeChainBreakdown ? "include" : "exclude"}
                          onChange={(v) => setIncludeChainBreakdown(v === "include")}
                          ariaLabel="Toggle chain breakdown"
                          disabled={selectedGroupBy === "chain"}
                          className="w-full [&>div]:w-full"
                        />
                      </div>
                      <div className="relative z-0 grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] items-center w-full place-items-center whitespace-nowrap">
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
                      <div className="relative z-0 grid grid-rows md:grid-cols-[140px,6px,1fr] gap-[5px] md:gap-[10px] pt-[5px] md:pt-0 items-center w-full place-items-center whitespace-nowrap">
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

      <div className="flex flex-col gap-y-[3px]">
        {/* Ancestor path (smaller) — animates in/out */}
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: (currentPath.length > 1 || effectiveRootId) ? "1fr" : "0fr",
            opacity: (currentPath.length > 1 || effectiveRootId) ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="heading-small-xxs text-color-text-primary flex items-center gap-x-[5px] flex-wrap pb-[3px]">
              <button
                type="button"
                className="hover:underline whitespace-nowrap"
                onClick={() => setRootId(null)}
              >
                {rootScopeLabel}
              </button>
              {currentPath.slice(0, -1).map((node) => {
                const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.id);
                const chainColor = getChainColorForNode(node.id, AllChainsByKeys as any, colorTheme);
                return (
                  <div key={node.id} className="flex items-center gap-x-[5px] whitespace-nowrap">
                    <span>&gt;</span>
                    {chainIcon ? (
                      <GTPIcon icon={chainIcon as any} size="sm" className="shrink-0" style={{ color: chainColor }} />
                    ) : ownerProjectLogo ? (
                      <Image
                        src={ownerProjectLogo}
                        alt={node.name}
                        className="w-[14px] h-[14px] rounded-[3px] object-cover shrink-0"
                        width={14}
                        height={14}
                      />
                    ) : mainCategoryIcon ? (
                      <GTPIcon icon={mainCategoryIcon as any} size="sm" className="shrink-0" />
                    ) : null}
                    <button
                      type="button"
                      className="hover:underline whitespace-nowrap"
                      onClick={() => setRootId(node.id)}
                    >
                      {node.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Current node (larger) — fades in on change */}
        <div
          key={effectiveRootId ?? "__root__"}
          className="flex items-center gap-x-[5px]"
          style={{ animation: "breadcrumbFadeIn 300ms ease-in-out" }}
        >
          {effectiveRootId && (
            <button
              className="shrink-0 flex items-center justify-center rounded-full w-[28px] h-[28px] bg-color-bg-medium hover:bg-color-ui-hover transition-colors cursor-pointer"
              onClick={() => {
                const parentId = parsed.nodeById[effectiveRootId]?.parent ?? null;
                setRootId(parentId ?? null);
              }}
              aria-label="Go up one level"
              title="Go up one level"
            >
              <GTPIcon
                icon={"feather:corner-left-up" as any}
                size="sm"
                className="!size-[15px] text-color-text-primary"
                containerClassName="!size-[15px]"
              />
            </button>
          )}
          {(() => {
            const lastNode = currentPath[currentPath.length - 1];
            if (!lastNode) {
              return <span className="text-sm md:heading-lg whitespace-nowrap">{rootScopeLabel}</span>;
            }
            const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(lastNode.id);
            const chainColor = getChainColorForNode(lastNode.id, AllChainsByKeys as any, colorTheme);
            return (
              <div className="text-sm md:heading-lg flex items-center gap-x-[5px] whitespace-nowrap">
                {chainIcon ? (
                  <GTPIcon icon={chainIcon as any} size="sm" className="shrink-0" style={{ color: chainColor }} />
                ) : ownerProjectLogo ? (
                  <Image
                    src={ownerProjectLogo}
                    alt={lastNode.name}
                    className="w-[16px] h-[16px] rounded-[3px] object-cover shrink-0"
                    width={16}
                    height={16}
                  />
                ) : mainCategoryIcon ? (
                  <GTPIcon icon={mainCategoryIcon as any} size="sm" className="shrink-0" />
                ) : null}
                <span>{lastNode.name}</span>
              </div>
            );
          })()}
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
              setTappedId(null);
            }}
            onClick={(e) => {
              // Tap on empty space clears tooltip
              if (e.target === e.currentTarget) {
                setTappedId(null);
                setHoveredId(null);
                setTooltipPos(null);
              }
            }}
          >
            {laidOutNodes.map((node) => {
              const width = Math.max(0, node.x1 - node.x0);
              const height = Math.max(0, node.y1 - node.y0);

              const isContainer = !!node.children?.length;
              const canSelectNode =
                !node.data.id.startsWith("other:") && !node.data.id.startsWith("unlabeled:");
              const isHovered = hoveredId === node.data.id;
              const headerHeight = isContainer ? getHeaderHeight(height) : 0;
              const canShowHeader = isContainer && headerHeight > 0;
              const canShowHeaderIcon = canShowHeader && width >= 52;
              const canShowHeaderShare = canShowHeader && width >= 140;
              const headerPaddingX = width < 56 ? 4 : width < 84 ? 6 : 10;
              const headerContentGap = width < 56 ? 3 : 5;
              const isNarrowHeader = width < 72;
              const canShowLeafLabel = !isContainer && width * height > 2800 && width >= 70 && height >= 18;
              const canShowContractAddress = width >= 120;
              const minSide = Math.min(width, height);
              const borderRadius = getNodeBorderRadius(node.depth, width, height);
              const isTinyDeepNode = node.depth >= 3 && minSide < 10;
              const isSmallDeepNode = node.depth >= 3 && minSide < 14;
              const defaultBorderWidth = minSide < 4
                ? "0px"
                : node.depth <= 2
                  ? "2px"
                  : isTinyDeepNode
                    ? "0px"
                    : isSmallDeepNode
                      ? "0.5px"
                      : "1px";
              const hoveredBorderWidth = node.depth <= 2
                ? "2px"
                : isTinyDeepNode
                  ? "0px"
                  : "1px";
              const chainOutlineColor = getChainColorForNode(node.data.id, AllChainsByKeys as any, colorTheme);
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
                  className={`absolute border overflow-hidden transition-[left,top,width,height,border-color,box-shadow,opacity] duration-300 ease-out ${canSelectNode ? "cursor-pointer" : "cursor-default"}`}
                  style={{
                    left: `${node.x0}px`,
                    top: `${node.y0}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    background: neutralBg,
                    borderColor: isHovered ? "rgb(var(--text-primary))" : chainOutlineColor,
                    borderWidth: isHovered ? hoveredBorderWidth : defaultBorderWidth,
                    boxShadow: isHovered ? "inset 0 0 0 1px rgb(var(--text-primary) / 0.4)" : undefined,
                    borderRadius: `${borderRadius}px`,
                  }}
                  onClick={(e) => {
                    if (!canSelectNode) return;
                    // Desktop (already hovered via mouseEnter) or second tap: drill down
                    if (hoveredId === node.data.id && tappedId === node.data.id || hoveredId === node.data.id && tappedId === null) {
                      setTappedId(null);
                      setHoveredId(null);
                      setTooltipPos(null);
                      setRootId(node.data.id);
                    } else {
                      // Touch first tap: show tooltip
                      setTappedId(node.data.id);
                      setHoveredId(node.data.id);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseEnter={() => setHoveredId(node.data.id)}
                >
                  {canShowHeader && (
                    <div
                      className="absolute left-0 top-0 w-full border-b border-color-text-primary/20 py-[2px] flex items-center overflow-hidden bg-color-ui-active/80"
                      style={{
                        height: `${headerHeight + HEADER_VERTICAL_PADDING * 2}px`,
                        paddingLeft: `${headerPaddingX}px`,
                        paddingRight: `${headerPaddingX}px`,
                      }}
                    >
                      {(() => {
                        const { mainCategoryIcon, ownerProjectLogo, chainIcon } = getNodeIcons(node.data.id);

                        return (
                          <div
                            className="flex items-center justify-start min-w-0 w-full"
                            style={{ gap: `${headerContentGap}px` }}
                          >
                            {canShowHeaderIcon && ownerProjectLogo ? (
                              <Image
                                src={ownerProjectLogo}
                                alt={node.data.name}
                                className="w-[14px] rounded-[3px] object-cover shrink-0"
                                width={14}
                                height={14}
                              />
                            ) : canShowHeaderIcon && chainIcon ? (
                              <GTPIcon
                                icon={chainIcon as any}
                                size="sm"
                                className="text-color-text-primary shrink-0"
                              />
                            ) : canShowHeaderIcon && mainCategoryIcon ? (
                              <GTPIcon
                                icon={mainCategoryIcon as any}
                                size="sm"
                                className="text-color-text-primary shrink-0"
                              />
                            ) : null}
                            <div
                              className={`min-w-0 font-semibold text-color-text-primary truncate ${isNarrowHeader ? "text-[11px]" : "text-[12px]"
                                }`}
                            >
                              {node.data.name}
                            </div>
                            {canShowHeaderShare && (
                              <div className="numbers-xxs !font-normal text-color-text-primary shrink-0">
                                {node.data.sharePct.toFixed(1)}%
                              </div>
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
                        <div className="absolute top-[6px] left-[8px] right-[8px] text-color-text-primary text-[11px] leading-tight truncate overflow-hidden">
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
                                className="text-color-text-primary shrink-0"
                              />
                            ) : mainCategoryIcon ? (
                              <GTPIcon
                                icon={mainCategoryIcon as any}
                                size="sm"
                                className="text-color-text-primary shrink-0"
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
              selectedTimespan={selectedTimespan}
              showUsd={showUsd}
              rootScopeLabel={rootScopeLabel}
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
