'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { TableBlock as TableBlockType } from "@/lib/types/blockTypes";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from 'next/link';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';
import { GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import VerticalScrollContainer from '@/components/VerticalScrollContainer';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import { useMediaQuery } from 'usehooks-ts';
import { useMaster } from "@/contexts/MasterContext";
import { useTheme } from "next-themes";
import { GTPTooltipNew, TooltipBody, TooltipHeader } from "@/components/tooltip/GTPTooltip";
import { ExternalLink } from '@/components/ExternalLink/ExternalLink';
import Mustache from 'mustache';
import { formatDate, formatTimeAgo } from '@/lib/utils/formatters';


const getNestedValue = (obj: any, path: string) => {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), obj);
};

const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

/** Extract hostname from a URL string for display. */
const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const isLikelyEmailAddress = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getBadgeLinkProps = (badge: { label: string; url: string }) => {
  const rawUrl = badge.url.trim();
  const isEmailBadge =
    badge.label.toLowerCase() === "email" ||
    rawUrl.toLowerCase().startsWith("mailto:") ||
    isLikelyEmailAddress(rawUrl);

  if (isEmailBadge) {
    const emailAddress = rawUrl.replace(/^mailto:/i, "").trim();
    return {
      href: emailAddress ? `mailto:${emailAddress}` : rawUrl,
      target: undefined as string | undefined,
      rel: undefined as string | undefined,
    };
  }

  return {
    href: rawUrl,
    target: "_blank",
    rel: "noopener noreferrer",
  };
};

/** Shared badge pill with tooltip showing the destination URL and ExternalLink disclaimer on click. */
const BadgeLink = ({ badge, uniqueKey }: { badge: { label: string; color: string; url: string }; uniqueKey: string }) => {
  const linkProps = getBadgeLinkProps(badge);
  const displayUrl = (() => {
    const raw = badge.url.trim();
    if (isLikelyEmailAddress(raw) || raw.toLowerCase().startsWith('mailto:')) {
      return raw.replace(/^mailto:/i, '').split('?')[0];
    }
    try { return new URL(raw).hostname.replace(/^www\./, ''); } catch { return raw; }
  })();

  return (
    <GTPTooltipNew
      size="fit"
      allowInteract={false}
      enableHover={true}
      positionOffset={{ mainAxis: 5, crossAxis: 0 }}
      containerClass="!py-[8px] !pr-[10px]"
      trigger={
        <span className="inline-flex">
          <ExternalLink
            href={linkProps.href}
            className="inline-flex items-center gap-x-[4px] rounded-full px-[8px] py-[1px] text-xxs font-medium border border-opacity-30 hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ borderColor: badge.color, color: badge.color }}
          >
            <span className="rounded-full size-[5px]" style={{ backgroundColor: badge.color }} />
            {badge.label}
          </ExternalLink>
        </span>
      }
    >
      <div className="flex items-center gap-x-[5px] pl-[10px]">
        <GTPIcon icon={"feather:external-link" as GTPIconName} size="sm" className="text-color-text-primary flex-shrink-0" />
        <span className="text-xs text-color-text-primary truncate max-w-[250px]">{displayUrl}</span>
      </div>
    </GTPTooltipNew>
  );
};

/** Fixed-content column types that should never flex. */
const FIXED_COLUMN_TYPES = new Set(["image", "chain", "boolean", "metric"]);

export const TableBlock = ({ block }: { block: TableBlockType }) => {
  const { sharedState, exclusiveFilterKeys, inclusiveFilterKeys } = useQuickBite();
  const [sortConfig, setSortConfig] = useState<{ metric: string; sortOrder: string }>({ metric: '', sortOrder: 'desc' });
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Track whether the container is too narrow for the table and should show cards.
  // Only triggers a re-render when the boolean result changes (not every pixel).
  const [shouldUseCards, setShouldUseCards] = useState(false);
  const showingCardsRef = useRef(false);
  const minTableWidthRef = useRef(0);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const threshold = minTableWidthRef.current;
        const next = showingCardsRef.current
          ? w < threshold + 32
          : w < threshold;
        if (next !== showingCardsRef.current) {
          showingCardsRef.current = next;
          setShouldUseCards(next);
        }
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { AllChainsByKeys } = useMaster();
  const { resolvedTheme } = useTheme();

  const parseChainKeys = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (value === null || value === undefined) return [];
    return [String(value).trim()].filter(Boolean);
  };

  const toTooltipText = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  };

  const getCellInfoTooltipText = (cellData: any): string | undefined => toTooltipText(cellData?.infoTooltipText);

  const InfoTooltipIcon = ({ text }: { text: string }) => (
    <GTPTooltipNew
      
      allowInteract={true}
      size="md"
      trigger={
        <button
          type="button"
          className="inline-flex items-center justify-center text-[#5A6462] hover:text-color-text-primary cursor-pointer z-"
          aria-label="Show info"
          onClick={(e) => e.preventDefault()}
        >
          <GTPIcon icon="gtp-info-monochrome" size="sm" className="!size-[11px]" containerClassName="!size-[11px]" />
        </button>
      }
      containerClass="flex flex-col gap-y-[10px] z-tooltip"
      positionOffset={{ mainAxis: 10, crossAxis: 15 }}
    >
      <div className="px-[15px]">{text}</div>
    </GTPTooltipNew>
  );

  const url = useMemo(() => {
    if (!block.readFromJSON) return null;
    const rawUrl = block.jsonData?.url;
    if (!rawUrl) return null;

    if (rawUrl.includes("{{")) {
      const requiredVars = (Mustache.parse(rawUrl) || [])
        .filter(tag => tag[0] === 'name')
        .map(tag => tag[1]);

      const allVarsAvailable = requiredVars.every(v => sharedState[v] !== null && sharedState[v] !== undefined);
      if (!allVarsAvailable) return null;

      return Mustache.render(rawUrl, sharedState);
    }

    return rawUrl;
  }, [block.readFromJSON, block.jsonData, sharedState]);

  const { data: jsonData, error, isLoading } = useSWR(url);

  const dynamicColumnKeys = useMemo(() => {
    if (!block.readFromJSON || !jsonData) return block.columnDefinitions || {};
    const columns = getNestedValue(jsonData, block.jsonData?.pathToColumnKeys || '');
    if (Array.isArray(columns)) {
      const keysObject: { [key: string]: { label: string; sortByValue: boolean } } = {};
      columns.forEach(key => {
        keysObject[key] = { label: formatLabel(key), sortByValue: true };
      });
      return keysObject;
    }
    return columns || block.columnDefinitions || {};
  }, [block.readFromJSON, block.columnDefinitions, block.jsonData?.pathToColumnKeys, jsonData]);

  const defaultColumnKeyOrder = useMemo(() => Object.keys(dynamicColumnKeys), [dynamicColumnKeys]);
  const hiddenKeys = useMemo(() => {
    const entries = Object.entries(block.columnDefinitions || {});
    return new Set(entries.filter(([, def]) => def?.hidden).map(([key]) => key));
  }, [block.columnDefinitions]);

  const columnKeyOrder = useMemo(() => {
    const visibleDefault = defaultColumnKeyOrder.filter((key) => !hiddenKeys.has(key));

    if (!Array.isArray(block.columnOrder) || block.columnOrder.length === 0) {
      return visibleDefault;
    }

    const seen = new Set<string>();
    const orderedKeys: string[] = [];

    block.columnOrder.forEach((key) => {
      const columnDef = block.columnDefinitions?.[key];
      const mappedKey = columnDef?.sourceKey || key;
      const keyIsPresentInData = Boolean(dynamicColumnKeys[mappedKey]);
      const hasFixedSourceIndex = typeof columnDef?.sourceIndex === "number";
      const hasAutoIndex = columnDef?.autoIndex === true;
      const hasBadgeSources = Array.isArray(columnDef?.badgeSources) && columnDef.badgeSources.length > 0;
      if ((keyIsPresentInData || hasFixedSourceIndex || hasAutoIndex || hasBadgeSources) && !seen.has(key) && !hiddenKeys.has(key)) {
        orderedKeys.push(key);
        seen.add(key);
      }
    });

    // When columnOrder is provided, use it as explicit visible set.
    // Fallback to visible defaults only if none of the requested keys exist.
    return orderedKeys.length > 0 ? orderedKeys : visibleDefault;
  }, [block.columnOrder, block.columnDefinitions, defaultColumnKeyOrder, dynamicColumnKeys, hiddenKeys]);

  const columnIndexMap = useMemo(() => {
    return defaultColumnKeyOrder.reduce((acc, key, index) => {
      acc[key] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [defaultColumnKeyOrder]);

  const columnDefinitions = useMemo(() => {
    if (block.columnDefinitions) {
      return block.columnDefinitions;
    }
    return {};
  }, [block.columnDefinitions]);

  // Minimum width the table needs: sum of all column minWidths + row horizontal padding
  const minTableWidth = useMemo(() => {
    const total = columnKeyOrder.reduce((sum, columnKey) => {
      const colDef = columnDefinitions[columnKey];
      return sum + (colDef?.minWidth || 120);
    }, 0) + 20; // 20px for row padding (px-[5px] + pr-[15px])
    minTableWidthRef.current = total;
    return total;
  }, [columnKeyOrder, columnDefinitions]);

  const processedRows = useMemo(() => {
    if (!block.readFromJSON || !jsonData) {
      if (block.rowData) {
        return Object.values(block.rowData).map((rowObject: any) =>
          columnKeyOrder.map((key) => {
            const columnDef = columnDefinitions[key];
            const infoSourceKey = columnDef?.infoTooltip?.sourceKey;
            const infoValue = infoSourceKey
              ? (rowObject?.[infoSourceKey]?.value ?? rowObject?.[infoSourceKey])
              : columnDef?.infoTooltip?.text;
            const infoTooltipText = toTooltipText(infoValue);
            const rawCell = rowObject?.[key];
            const baseCell = rawCell && typeof rawCell === "object" ? rawCell : { value: rawCell };
            return infoTooltipText ? { ...baseCell, infoTooltipText } : baseCell;
          })
        );
      }
      return [];
    }
    const rowsArray = getNestedValue(jsonData, block.jsonData?.pathToRowData || '');
    if (!Array.isArray(rowsArray)) return [];
    return rowsArray.map((row, rowIndex) => columnKeyOrder.map((columnKey) => {
      const columnDef = columnDefinitions[columnKey];
      const mappedKey = columnDef?.sourceKey || columnKey;
      const sourceIndex = typeof columnDef?.sourceIndex === "number" ? columnDef.sourceIndex : columnIndexMap[mappedKey];
      let cellValue = sourceIndex !== undefined ? row[sourceIndex] : undefined;

      // Auto-generate 1-based row index when value is missing and autoIndex is set.
      if ((cellValue === undefined || cellValue === null) && columnDef?.autoIndex) {
        cellValue = rowIndex + 1;
      }

      const infoSourceKey = columnDef?.infoTooltip?.sourceKey;
      const infoSourceIndex = infoSourceKey ? columnIndexMap[infoSourceKey] : undefined;
      const infoValue = infoSourceIndex !== undefined ? row[infoSourceIndex] : columnDef?.infoTooltip?.text;
      const infoTooltipText = toTooltipText(infoValue);

      const cellObject: { value: any; link?: string; icon?: string; color?: string; badges?: Array<{ label: string; color: string; url: string }>; infoTooltipText?: string } = { value: cellValue };

      // For badges type: collect values from multiple source keys
      if (columnDef?.type === "badges" && columnDef.badgeSources) {
        cellObject.badges = columnDef.badgeSources.map((source) => {
          const srcIdx = columnIndexMap[source.sourceKey];
          const srcValue = srcIdx !== undefined ? row[srcIdx] : undefined;
          return {
            label: source.label,
            color: source.color,
            url: typeof srcValue === "string" ? srcValue.trim() : "",
          };
        });
      }

      // Generate link if add_url is defined in column definition
      if (columnDef?.add_url && typeof cellValue === 'string') {
        cellObject.link = columnDef.add_url.replace('${cellValue}', cellValue);
      }
      if (infoTooltipText) {
        cellObject.infoTooltipText = infoTooltipText;
      }

      return cellObject;
    }));
  }, [block.readFromJSON, block.rowData, block.jsonData?.pathToRowData, jsonData, columnKeyOrder, columnIndexMap, columnDefinitions]);

  const sortedRows = useMemo(() => {
    const dataToSort = [...processedRows];

    // Filter based on shared state if configured
    if (block.filterOnStateKey) {

      const { stateKey, columnKey } = block.filterOnStateKey;
      const filterValue = sharedState[stateKey] || exclusiveFilterKeys.valueKey || inclusiveFilterKeys.valueKey;

      const filteredData = (filterValue && filterValue !== 'all')
        ? dataToSort.filter(row => {
          const filterIndex = columnKeyOrder.indexOf(columnKey);
          if (exclusiveFilterKeys.valueKey) {
            return filterIndex !== -1 && row[filterIndex]?.value === filterValue;
          } else if (inclusiveFilterKeys.valueKey) {
            return filterIndex !== -1 && row[filterIndex]?.value.includes(filterValue);
          }
          return filterIndex !== -1 && row[filterIndex]?.value.includes(filterValue); // default to inclusive
        })
        : dataToSort;

      if (!sortConfig.metric) return filteredData;

      const sortIndex = columnKeyOrder.indexOf(sortConfig.metric);
      if (sortIndex === -1) return filteredData;

      return filteredData.sort((a, b) => {
        const aValue = a[sortIndex]?.value ?? 0;
        const bValue = b[sortIndex]?.value ?? 0;
        const result = typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
        return sortConfig.sortOrder === 'asc' ? result : -result;
      });
    }

    // Default sorting if no filtering is configured
    if (!sortConfig.metric) return dataToSort;
    const sortIndex = columnKeyOrder.indexOf(sortConfig.metric);
    if (sortIndex === -1) return dataToSort;
    return dataToSort.sort((a, b) => {
      const aValue = a[sortIndex]?.value ?? 0;
      const bValue = b[sortIndex]?.value ?? 0;
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
      return sortConfig.sortOrder === 'asc' ? result : -result;
    });
  }, [processedRows, sortConfig, columnKeyOrder, sharedState, block.filterOnStateKey, exclusiveFilterKeys, inclusiveFilterKeys]);

  const barMaxValues = useMemo(() => {
    const result = { rowBarMax: 0, cellBarMaxes: {} as Record<string, number> };
    const cellBarCols = columnKeyOrder.filter(k => columnDefinitions[k]?.cellBar);

    for (const row of sortedRows) {
      if (block.rowBar?.valueColumn) {
        const idx = columnKeyOrder.indexOf(block.rowBar.valueColumn);
        if (idx !== -1) {
          const val = typeof row[idx]?.value === "number" ? Math.abs(row[idx].value) : 0;
          if (val > result.rowBarMax) result.rowBarMax = val;
        }
      }
      for (const colKey of cellBarCols) {
        const idx = columnKeyOrder.indexOf(colKey);
        if (idx !== -1) {
          const val = typeof row[idx]?.value === "number" ? Math.abs(row[idx].value) : 0;
          if (!result.cellBarMaxes[colKey] || val > result.cellBarMaxes[colKey])
            result.cellBarMaxes[colKey] = val;
        }
      }
    }
    return result;
  }, [sortedRows, columnKeyOrder, columnDefinitions, block.rowBar]);

  const resolveBarColor = (rowData: any[], colorColumn?: string, explicitColor?: string) => {
    if (explicitColor) return explicitColor;
    if (colorColumn) {
      const idx = columnKeyOrder.indexOf(colorColumn);
      const originKey = idx !== -1 ? rowData[idx]?.value : undefined;
      if (typeof originKey === "string" && AllChainsByKeys[originKey])
        return AllChainsByKeys[originKey].colors[resolvedTheme ?? "dark"][1];
    }
    return undefined;
  };

  if (block.readFromJSON && isLoading) return <div className="my-8 text-center">Loading table data...</div>;
  if (block.readFromJSON && error) return <div className="my-8 text-center text-red-500">Error: {error.message}</div>;
  if (sortedRows.length === 0 || columnKeyOrder.length === 0) return <div className="my-8 text-center">No data available</div>;

  const formatValue = (value: any, columnKey: string) => {
    if (value === null || value === undefined || value === '') {
      return null; // Return null so we can render the empty placeholder component
    }

    // get units if exists
    const units = columnDefinitions[columnKey]?.units;
    if (units) {
      const unit = Object.values(units)[0];
      const numericValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numericValue)) {
        return null;
      }
      return `${unit.prefix ?? ''}${numericValue.toLocaleString("en-GB", { minimumFractionDigits: unit.decimals ?? 0, maximumFractionDigits: unit.decimals ?? 0 })}${unit.suffix ?? ''}`;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      return String(value || '');
    }
    return String(value);
  };

  // Empty value placeholder — matches platform pattern (em dash, muted)
  const EmptyCell = ({ centered = false }: { centered?: boolean }) => (
    centered ? (
      <div className="flex items-center justify-center w-full">
        <span className="text-[#5A6462] text-xs">—</span>
      </div>
    ) : (
      <span className="text-[#5A6462] text-xs">—</span>
    )
  );

  // Shared cell content renderer — used by both table rows and card view
  const renderCellContent = (cellData: any, columnKey: string): React.ReactNode => {
    const columnType = columnDefinitions?.[columnKey]?.type;

    if (columnType === "chain") {
      const chainKeys = parseChainKeys(cellData?.value);
      const colDef = columnDefinitions?.[columnKey];
      const showIcon = colDef?.showIcon !== false;
      const showLabel = colDef?.showLabel === true;
      if (chainKeys.length === 0) return <EmptyCell />;
      return (
        <div className="flex items-center w-full gap-x-[5px]">
          {chainKeys.map((chainKey) => {
            const chainInfo = AllChainsByKeys[chainKey];
            if (!chainInfo) return null;
            return (
              <React.Fragment key={chainKey}>
                {showIcon && (
                  <GTPIcon icon={`gtp:${chainInfo.urlKey}-logo-monochrome` as GTPIconName} size="sm" className="flex-shrink-0" style={{ color: chainInfo.colors[resolvedTheme ?? "dark"][0] }} />
                )}
                {showLabel && (
                  <span className="text-xs truncate">{chainInfo.name_short}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    } else if (columnType === "image") {
      const imageSrc = typeof cellData?.value === "string" ? cellData.value.trim() : "";
      return (
        <div className="flex items-center justify-center select-none bg-color-ui-active rounded-full size-[26px] overflow-hidden">
          {imageSrc && (
            <img src={imageSrc} alt="" className="rounded-full w-[26px] h-[26px] object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
      );
    } else if (columnType === "metric" && typeof cellData?.value === "string") {
      const metricIcon = cellData.value === "supply_bridged" ? "gtp-crosschain" : cellData.value === "supply_direct" ? "gtp-tokentransfers" : cellData.value === "locked_supply" ? "gtp-lock" : null;
      return metricIcon ? (
        <div className="flex items-center justify-center w-full text-color-ui-hover"><GTPIcon icon={metricIcon as GTPIconName} size="sm" /></div>
      ) : (
        <span className="text-xs">{formatValue(cellData?.value, columnKey) ?? <EmptyCell />}</span>
      );
    } else if (columnDefinitions?.[columnKey]?.currencyMap && typeof cellData?.value === "string") {
      const info = columnDefinitions[columnKey].currencyMap![cellData.value.toUpperCase()];
      if (!info) return <span className="text-xs">{cellData.value}</span>;
      return (
        <div className="flex items-center gap-x-[8px] w-full min-w-0">
          <span className="inline-flex items-center justify-center flex-shrink-0 min-w-[22px] px-[4px] h-[18px] rounded-[4px] bg-forest-500/10 numbers-xs leading-none">
            {info.symbol}
          </span>
          <span className="text-xs truncate">{info.name}</span>
        </div>
      );
    } else if (columnDefinitions?.[columnKey]?.iconMap && typeof cellData?.value === "string") {
      const mapped = columnDefinitions[columnKey].iconMap![cellData.value];
      return mapped ? (
        <div className="flex items-center gap-x-[5px]"><GTPIcon icon={mapped.icon as GTPIconName} size="sm" /><span className="text-xs">{mapped.label}</span></div>
      ) : (
        <span className="text-xs">{formatValue(cellData?.value, columnKey) ?? <EmptyCell />}</span>
      );
    } else if (columnType === "date") {
      const rawDate = typeof cellData?.value === "string" ? cellData.value.trim() : "";
      if (!rawDate) return <EmptyCell />;
      const colDef = columnDefinitions?.[columnKey];
      const dateStr = formatDate(rawDate, colDef?.dateFormat ?? 'medium');
      const timeAgo = colDef?.showTimeAgo ? formatTimeAgo(rawDate) : null;
      return (
        <div className={`flex flex-col gap-y-[2px] ${timeAgo && "-mt-[5px]"}`}>
          <span className="text-xs">{dateStr}</span>
          {timeAgo && <span className="text-xxs text-color-text-secondary">{timeAgo}</span>}
        </div>
      );
    } else if (columnType === "boolean") {
      const raw = cellData?.value;
      const normalized = raw === true || raw === "true" ? true : raw === false || raw === "false" ? false : null;
      if (normalized === null) return <EmptyCell centered />;
      return (
        <div className="flex items-center justify-center w-full">
          <GTPIcon icon={(normalized ? "feather:check" : "feather:x") as GTPIconName} className={`!w-[14px] !h-[14px] ${normalized ? "text-green-500" : "text-[#5A6462]"}`} containerClassName="!w-[14px] !h-[14px]" />
        </div>
      );
    } else if (columnType === "link") {
      const linkValue = typeof cellData?.value === "string" ? cellData.value.trim() : "";
      if (!linkValue) return <EmptyCell />;
      return (
        <div className="flex items-center gap-x-[5px] w-full text-xs truncate">
          <GTPIcon icon={"feather:external-link" as GTPIconName} className="!w-[12px] !h-[12px] text-[#5A6462] flex-shrink-0" containerClassName="!w-[12px] !h-[12px]" />
          <span className="truncate text-[#5A6462]">{getHostname(linkValue)}</span>
        </div>
      );
    } else if (columnType === "badges") {
      const badges = cellData?.badges as Array<{ label: string; color: string; url: string }> | undefined;
      const activeBadges = badges?.filter(b => b.url) ?? [];
      if (activeBadges.length === 0) return <EmptyCell />;
      return (
        <div className="flex items-start gap-x-[5px] gap-y-[4px] w-full flex-wrap">
          {activeBadges.map((badge, i) => (
            <BadgeLink key={`${badge.label}-${i}`} badge={badge} uniqueKey={`${badge.label}-${i}`} />
          ))}
        </div>
      );
    } else {
      const colDef = columnDefinitions?.[columnKey];
      const formatted = formatValue(cellData?.value, columnKey);
      if (formatted === null) return <EmptyCell />;
      if (colDef?.chip) {
        return (
          <span className="inline-flex items-center rounded-full border border-color-ui-hover px-[8px] h-[18px] numbers-xs uppercase flex-shrink-0">
            {formatted}
          </span>
        );
      }
      return (
        <>
          {cellData?.icon && <GTPIcon icon={cellData.icon as GTPIconName} size="sm" style={cellData.color ? { color: cellData.color } : {}} />}
          <span className={`truncate ${colDef?.isNumeric ? 'numbers-xs' : 'text-xs'}`}>{formatted}</span>
        </>
      );
    }
  };

  // Card view when container is too narrow for the table and cardView config is present.
  // The ResizeObserver callback handles hysteresis and only updates shouldUseCards on change.
  if (!!block.cardView && shouldUseCards) {
    const cardView = block.cardView!;
    const { titleColumn, imageColumn, linkColumn, hiddenColumns = [], autoRowHeight } = cardView;

    // Build sections: use new sections config, or fall back to legacy topColumns/bottomColumns
    const reservedInCard = new Set([titleColumn, ...(imageColumn ? [imageColumn] : []), ...(linkColumn ? [linkColumn] : []), ...hiddenColumns]);
    const cardSections: Array<{ columns: string[]; labelPosition: "right" | "left" | "top" | "bottom" | "hidden"; layout: "spread" | "start" | "end" }> = (() => {
      if (cardView.sections) {
        return cardView.sections.map(s => ({
          columns: s.columns,
          labelPosition: s.labelPosition ?? "right",
          layout: s.layout ?? "spread",
        }));
      }
      // Legacy fallback: topColumns above header, bottomColumns below
      const visibleColumns = columnKeyOrder.filter(key => !reservedInCard.has(key));
      const TAG_TYPES = new Set(["chain", "badges", "boolean", "link", "image"]);
      const topColumns = cardView.topColumns ?? visibleColumns.filter(key => !TAG_TYPES.has(columnDefinitions?.[key]?.type || ""));
      const bottomColumns = cardView.bottomColumns ?? visibleColumns.filter(key => TAG_TYPES.has(columnDefinitions?.[key]?.type || ""));
      const result: typeof cardSections = [];
      if (topColumns.length > 0) result.push({ columns: topColumns as string[], labelPosition: "right", layout: "spread" });
      if (bottomColumns.length > 0) result.push({ columns: bottomColumns as string[], labelPosition: "right", layout: "spread" });
      return result;
    })();

    const titleColIndex = columnKeyOrder.indexOf(titleColumn);
    const imageColIndex = imageColumn ? columnKeyOrder.indexOf(imageColumn) : -1;
    const linkColIndex = linkColumn ? columnKeyOrder.indexOf(linkColumn) : -1;
    const titleColType = columnDefinitions?.[titleColumn]?.type;

    const layoutClassMap = { spread: "justify-between", start: "justify-start gap-x-[10px]", end: "justify-end gap-x-[10px]" };

    const isScrollable = block.scrollable !== false;
    const cardGrid = (
      <div className="grid grid-cols-1 gap-[10px]">
        {sortedRows.map((rowData, rowIndex) => {
          const titleCell = titleColIndex >= 0 ? rowData[titleColIndex] : null;
          const imageCell = imageColIndex >= 0 ? rowData[imageColIndex] : null;
          const imageSrc = typeof imageCell?.value === "string" ? imageCell.value.trim() : "";

          const titleChainKeys = titleColType === "chain" ? parseChainKeys(titleCell?.value) : [];
          const titleChainInfo = titleChainKeys.length > 0 ? AllChainsByKeys[titleChainKeys[0]] : null;

          const linkCell = linkColIndex >= 0 ? rowData[linkColIndex] : null;
          const cardLink = typeof linkCell?.value === "string" ? linkCell.value.trim() : "";
          const titleInfoTooltipText = getCellInfoTooltipText(titleCell);

          return (
            <div key={`card-${rowIndex}`} className="flex flex-col gap-y-[10px] border-[0.5px] border-color-ui-hover rounded-[15px] px-[15px] py-[10px] hover:bg-forest-500/10">
              {/* Header: image/icon + title + info tooltip + arrow link */}
              <div className="flex items-center gap-x-[8px]">
                {imageColumn && (
                  <div className="flex-shrink-0 bg-color-ui-active rounded-full size-[36px] overflow-hidden">
                    {imageSrc && (
                      <img src={imageSrc} alt="" className="rounded-full w-[36px] h-[36px] object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                )}
                {titleColType === "chain" && titleChainInfo ? (
                  <div className="flex items-center gap-x-[8px] flex-1 min-w-0">
                    <GTPIcon icon={`gtp:${titleChainInfo.urlKey}-logo-monochrome` as GTPIconName} size="md" className="flex-shrink-0" style={{ color: titleChainInfo.colors[resolvedTheme ?? "dark"][0] }} />
                    <span className="heading-large-md truncate">{titleChainInfo.name_short}</span>
                    {titleInfoTooltipText && <span className="flex-shrink-0"><InfoTooltipIcon text={titleInfoTooltipText} /></span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-x-[8px] flex-1 min-w-0">
                    <span className="heading-large-md truncate">
                      {titleCell ? (typeof titleCell.value === "string" ? titleCell.value : renderCellContent(titleCell, titleColumn)) : <EmptyCell />}
                    </span>
                    {titleInfoTooltipText && <span className="flex-shrink-0"><InfoTooltipIcon text={titleInfoTooltipText} /></span>}
                  </div>
                )}
                {cardLink && (
                  <a href={cardLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 size-[24px] bg-color-bg-medium rounded-full flex justify-center items-center hover:bg-forest-500/10">
                    <GTPIcon icon={"feather:arrow-right" as GTPIconName} className="!w-[17px] !h-[17px] text-color-text-primary" containerClassName="!w-[17px] !h-[17px]" />
                  </a>
                )}
              </div>

              {/* Sections */}
              {cardSections.map((section, sIdx) => {
                const isVerticalLabel = section.labelPosition === "top" || section.labelPosition === "bottom";
                return (
                  <div key={`section-${sIdx}`} className={`flex flex-wrap items-start ${layoutClassMap[section.layout]}`}>
                    {section.columns.map((colKey) => {
                      const colIdx = columnKeyOrder.indexOf(colKey);
                      const cell = colIdx >= 0 ? rowData[colIdx] : null;
                      const colDef = columnDefinitions[colKey];
                      const label = colDef?.label ?? formatLabel(colKey);
                      const isChainOrKey = ["origin_key", "chain_key"].includes(colKey);
                      const showLabel = section.labelPosition !== "hidden" && !isChainOrKey;

                      const valueEl = (
                        <span className={`${isVerticalLabel ? (colDef?.isNumeric ? 'numbers-sm font-bold' : 'text-md font-bold') : (colDef?.isNumeric ? 'numbers-xs' : 'text-xs')} text-color-text-primary truncate`}>
                          {renderCellContent(cell, colKey)}
                        </span>
                      );
                      const labelEl = showLabel ? (
                        <span className="text-xs text-color-text-secondary flex-shrink-0 truncate">{label}</span>
                      ) : null;

                      if (isVerticalLabel) {
                        return (
                          <div key={colKey} className={`flex flex-col gap-y-[2px] ${autoRowHeight ? '' : ''}`}>
                            {section.labelPosition === "top" && labelEl}
                            {valueEl}
                            {section.labelPosition === "bottom" && labelEl}
                          </div>
                        );
                      }

                      return (
                        <div key={colKey} className={`flex items-center gap-x-[5px] ${autoRowHeight ? '' : 'h-[20px]'}`}>
                          {section.labelPosition === "left" && labelEl}
                          {valueEl}
                          {section.labelPosition === "right" && labelEl}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );

    return (
      <div ref={containerRef} className={`my-8 ${block.className || ''}`}>
        {block.content && <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">{block.content}</div>}
        {isScrollable ? (
          <VerticalScrollContainer
            height={340}
            scrollbarAbsolute={true}
            scrollbarPosition="right"
            paddingRight={30}
          >
            {cardGrid}
          </VerticalScrollContainer>
        ) : cardGrid}
      </div>
    );
  }

  // Build grid template:
  // - expand column gets 2fr (primary flex column)
  // - compact columns (image, icon-only chain, boolean) stay fixed px
  // - all other columns get 1fr to share remaining space
  const expandColumnKey = columnKeyOrder.find(k => columnDefinitions[k]?.expand) ||
    columnKeyOrder.find(k => columnDefinitions[k]?.type === "string" && !columnDefinitions[k]?.isNumeric);

  const gridTemplateColumns = columnKeyOrder.map((columnKey) => {
    const colDef = columnDefinitions[columnKey];
    const minWidth = colDef?.minWidth || 120;
    const colType = colDef?.type;
    const isCompactCol = colType === "image" || (colType === "chain" && !colDef?.showLabel) || colType === "boolean";

    const maxWidth = colDef?.maxWidth;


    if (columnKey === expandColumnKey) {
      return maxWidth ? `minmax(${minWidth}px, ${maxWidth}px)` : `minmax(${minWidth}px, 2fr)`;
    }
    if (isCompactCol) {
      return `${minWidth}px`;
    }
    return maxWidth ? `minmax(${minWidth}px, ${maxWidth}px)` : `minmax(${minWidth}px, 1fr)`;
  }).join(' ');

    return (
    <div ref={containerRef} className={`my-8 ${block.className || ''}`}>
      {block.content && <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">{block.content}</div>}

      <HorizontalScrollContainer includeMargin={isMobile} enableDragScroll>
        {(() => {
          const isScrollable = block.scrollable !== false;
          const tableHeader = (
            <GridTableHeader style={{ gridTemplateColumns }} className={`group heading-small-xs !gap-x-0 !px-[5px] !pr-[15px] select-none min-h-[34px] !pt-0 !pb-0 !items-end`}>
              {columnKeyOrder.map((columnKey, colIdx) => {
                const mappedKey = columnDefinitions[columnKey]?.sourceKey || columnKey;
                const canSort = columnDefinitions[columnKey]?.sortByValue ?? dynamicColumnKeys[mappedKey]?.sortByValue;
                const colType = columnDefinitions[columnKey]?.type;
                const isFirst = colIdx === 0;
                const isImage = colType === "image";
                const isCompact = (colType === "chain" && !columnDefinitions[columnKey]?.showLabel) || colType === "boolean";
                const cellPadding = isImage
                    ? ''
                    : isCompact
                      ? `${isFirst ? 'pl-[5px]' : 'pl-[3px]'} pr-[3px]`
                      : `${isFirst ? 'pl-[5px]' : 'pl-[15px]'} pr-[15px]`;
                return <GridTableHeaderCell
                  key={columnKey}
                  justify={columnDefinitions[columnKey]?.isNumeric ? 'end' : 'start'}
                  metric={canSort ? columnKey : undefined}
                  sort={canSort ? sortConfig : undefined}
                  setSort={canSort ? setSortConfig : undefined}
                  className={`${cellPadding} ${columnDefinitions[columnKey]?.isNumeric ? 'text-right' : 'text-left'}`}
                >
                  {columnDefinitions[columnKey]?.label ?? formatLabel(columnKey)}
                </GridTableHeaderCell>
              })}
            </GridTableHeader>
          );
          const tableRows = (
            <div className="flex flex-col gap-y-[5px] w-full relative mt-[5px]">
            {sortedRows.map((rowData, rowIndex) => (
              <GridTableRow key={`row-${rowIndex}`} style={{ gridTemplateColumns }} className={`relative group text-xs !gap-x-0 !px-[5px] !pr-[15px] !select-none h-[34px] !pt-0 !pb-0`}
                bar={block.rowBar && barMaxValues.rowBarMax > 0 ? {
                  origin_key: block.rowBar.colorColumn
                    ? rowData[columnKeyOrder.indexOf(block.rowBar.colorColumn)]?.value
                    : undefined,
                  color: block.rowBar.color,
                  width: (() => {
                    const idx = columnKeyOrder.indexOf(block.rowBar.valueColumn);
                    const val = idx !== -1 && typeof rowData[idx]?.value === "number" ? rowData[idx].value : 0;
                    return Math.abs(val) / barMaxValues.rowBarMax;
                  })(),
                  containerStyle: {
                    left: 1, right: 1, top: 0, bottom: 0,
                    borderRadius: "9999px",
                    zIndex: -1, overflow: "hidden",
                  },
                } : undefined}
              >
                {rowData.map((cellData, colIndex) => {
                  const columnKey = columnKeyOrder[colIndex];
                  let cellMainContent: React.ReactNode | null = null;
                  let cellLeftContent: React.ReactNode | null = null;
                  let cellRightContent: React.ReactNode | null = null;
                  const columnType = columnDefinitions?.[columnKey]?.type;
                  const isFirst = colIndex === 0;
                  const isImage = columnType === "image";
                  const isCompact = (columnType === "chain" && !columnDefinitions[columnKey]?.showLabel) || columnType === "boolean";
                  const cellPadding = isImage
                    ? ''
                    : isCompact
                      ? `${isFirst ? 'pl-[5px]' : 'pl-[3px]'} pr-[3px]`
                      : `${isFirst ? 'pl-[5px]' : 'pl-[15px]'} pr-[15px]`;

                  if (columnType === "chain") {
                    const chainKeys = parseChainKeys(cellData?.value);
                    const colDef = columnDefinitions?.[columnKey];
                    const showIcon = colDef?.showIcon !== false; // default true
                    const showLabel = colDef?.showLabel === true; // default false
                    if (chainKeys.length === 0) {
                      cellMainContent = <EmptyCell />;
                    } else {
                      cellMainContent = (
                        <div className="flex items-center w-full gap-x-[5px]">
                          {chainKeys.map((chainKey) => {
                            const chainInfo = AllChainsByKeys[chainKey];
                            if (!chainInfo) return null;
                            return (
                              <React.Fragment key={chainKey}>
                                {showIcon && (
                                  <GTPIcon
                                    icon={`gtp:${chainInfo.urlKey}-logo-monochrome` as GTPIconName}
                                    size="sm"
                                    className="flex-shrink-0"
                                    style={{ color: chainInfo.colors[resolvedTheme ?? "dark"][0] }}
                                  />
                                )}
                                {showLabel && (
                                  <span className="text-xs truncate">{chainInfo.name_short}</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    }
                  } else if (columnType === "image") {
                    const imageSrc = typeof cellData?.value === "string" ? cellData.value.trim() : "";
                    cellMainContent = (
                      <div className="flex items-center justify-center select-none bg-color-ui-active rounded-full size-[26px] overflow-hidden">
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt=""
                            className="rounded-full w-[26px] h-[26px] object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                    );
                  } else if (columnDefinitions?.[columnKey]?.currencyMap && typeof cellData?.value === "string") {
                    const info = columnDefinitions[columnKey].currencyMap![cellData.value.toUpperCase()];
                    cellMainContent = info ? (
                      <div className="flex items-center gap-x-[8px] w-full min-w-0">
                        <GTPIcon icon={`flag:${info.country.toLowerCase()}-4x3` as GTPIconName} className="!size-[13px] flex-shrink-0" containerClassName='!size-[13px]' />
                        <span className="text-xs truncate">{info.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs">{cellData.value}</span>
                    );
                  } else if (columnDefinitions?.[columnKey]?.iconMap && typeof cellData?.value === "string") {
                    const mapped = columnDefinitions[columnKey].iconMap![cellData.value];
                    cellMainContent = mapped ? (
                      <div className="flex items-center gap-x-[5px]">
                        <GTPIcon icon={mapped.icon as GTPIconName} size="sm" />
                        <span className="text-xs">{mapped.label}</span>
                      </div>
                    ) : (
                      <span className="text-xs">{formatValue(cellData?.value, columnKey) ?? <EmptyCell />}</span>
                    );
                  } else if (columnType === "date") {
                    const rawDate = typeof cellData?.value === "string" ? cellData.value.trim() : "";
                    if (!rawDate) {
                      cellMainContent = <EmptyCell />;
                    } else {
                      const colDef = columnDefinitions?.[columnKey];
                      const dateStr = formatDate(rawDate, colDef?.dateFormat ?? 'medium');
                      const timeAgo = colDef?.showTimeAgo ? formatTimeAgo(rawDate) : null;
                      cellMainContent = (
                        <div className={`flex flex-col gap-y-[0px] ${colDef.isNumeric && "items-end"}  ${timeAgo && "-mt-[5px]"}`}>
                          <div className="text-xs">{dateStr}</div>
                          {timeAgo && <div className="h-[0px] text-xxxs text-color-text-secondary">{timeAgo}</div>}
                        </div>
                      );
                    }
                  } else if (columnType === "boolean") {
                    const raw = cellData?.value;
                    const normalized = raw === true || raw === "true"
                      ? true
                      : raw === false || raw === "false"
                        ? false
                        : null;
                    if (normalized === null) {
                      cellMainContent = <EmptyCell centered />;
                    } else {
                      cellMainContent = (
                        <div className="flex items-center justify-center w-full">
                          <GTPIcon
                            icon={(normalized ? "feather:check" : "feather:x") as GTPIconName}
                            className={`!w-[14px] !h-[14px] ${normalized ? "text-green-500" : "text-[#5A6462]"}`}
                            containerClassName="!w-[14px] !h-[14px]"
                          />
                        </div>
                      );
                    }
                  } else if (columnType === "link") {
                    const linkValue = typeof cellData?.value === "string" ? cellData.value.trim() : "";
                    if (linkValue) {
                      cellMainContent = (
                        <div className="flex items-center gap-x-[5px] w-full text-xs truncate">
                          <GTPIcon icon={"feather:external-link" as GTPIconName} className="!w-[12px] !h-[12px] text-[#5A6462] flex-shrink-0" containerClassName="!w-[12px] !h-[12px]" />
                          <span className="truncate text-[#5A6462]">{getHostname(linkValue)}</span>
                        </div>
                      );
                    } else {
                      cellMainContent = <EmptyCell />;
                    }
                  } else if (columnType === "badges") {
                    const badges = cellData?.badges as Array<{ label: string; color: string; url: string }> | undefined;
                    const activeBadges = badges?.filter(b => b.url) ?? [];
                    if (activeBadges.length === 0) {
                      cellMainContent = <EmptyCell />;
                    } else {
                      const configuredMaxVisibleBadges = columnDefinitions?.[columnKey]?.maxVisibleBadges;
                      const hasConfiguredBadgeLimit = typeof configuredMaxVisibleBadges === "number";
                      const maxVisibleBadges = Math.max(0, configuredMaxVisibleBadges ?? activeBadges.length);
                      const visibleBadgeLimit =
                        hasConfiguredBadgeLimit && activeBadges.length > maxVisibleBadges
                          ? Math.max(0, maxVisibleBadges - 1)
                          : maxVisibleBadges;
                      const visibleBadges = activeBadges.slice(0, visibleBadgeLimit);
                      const hiddenBadges = activeBadges.slice(visibleBadgeLimit);
                      const hiddenBadgeCount = hiddenBadges.length;

                      // In the main table view, keep badges on a single line and cap visible badges when configured.
                      cellMainContent = (
                        <div className="flex items-center gap-x-[5px] w-full min-w-0 overflow-hidden">
                          {visibleBadges.map((badge, badgeIndex) => (
                            <BadgeLink key={`${badge.label}-${badgeIndex}`} badge={badge} uniqueKey={`${badge.label}-vis-${badgeIndex}`} />
                          ))}
                          {hiddenBadgeCount > 0 && (
                            <GTPTooltipNew
                              size="sm"
                              placement="bottom-end"
                              allowInteract={true}
                              containerClass="flex flex-col gap-y-[10px] !pr-[5px]"
                              positionOffset={{ mainAxis: 5, crossAxis: 0 }}
                              trigger={(
                                <span className="inline-flex items-center rounded-full w-auto pl-[5px] pr-[6px] py-[1.5px] text-xxs bg-color-bg-medium flex-shrink-0 cursor-default">
                                  {`+ ${hiddenBadgeCount} more`}
                                </span>
                              )}
                            >
                              <>
                                <TooltipHeader title={columnDefinitions?.[columnKey]?.label || "Service Endpoints"} />
                                <TooltipBody className="pl-[20px]">
                                  <div className="flex flex-wrap gap-x-[5px] gap-y-[5px]">
                                    {activeBadges.map((badge, badgeIndex) => (
                                      <BadgeLink key={`${badge.label}-all-${badgeIndex}`} badge={badge} uniqueKey={`${badge.label}-all-${badgeIndex}`} />
                                    ))}
                                  </div>
                                </TooltipBody>
                              </>
                            </GTPTooltipNew>
                          )}
                        </div>
                      );
                    }
                  } else {
                    // default cell content
                    const colDef = columnDefinitions?.[columnKey];
                    let formatted = formatValue(cellData?.value, columnKey);
                    let valueMapKey: string | null = null;
                    if (formatted !== null && colDef?.valueMap) {
                      const key = String(formatted).toUpperCase();
                      const mapped = colDef.valueMap[key];
                      if (mapped) {
                        formatted = mapped;
                        if (colDef.valueMapShowKey) valueMapKey = key;
                      }
                    }
                    cellMainContent = formatted !== null ? (
                      colDef?.chip ? (
                        <span className="inline-flex items-center rounded-full border border-color-ui-hover px-[8px] h-[18px] numbers-xs uppercase flex-shrink-0">
                          {formatted}
                        </span>
                      ) : (
                        <>
                          {cellData?.icon && <GTPIcon icon={cellData.icon as GTPIconName} size="sm" style={cellData.color ? { color: cellData.color } : {}} />}
                          <span className={`truncate ${colDef?.isNumeric ? 'numbers-xs' : 'text-xs'} ${colDef?.uppercase ? 'uppercase' : ''}`}>
                            {formatted}{valueMapKey && <span className="text-color-text-secondary"> ({valueMapKey})</span>}
                          </span>
                        </>
                      )
                    ) : <EmptyCell />;
                  }


                  // if address, add copy button and double click to select
                  if (columnDefinitions?.[columnKey]?.type === "address") {
                    cellMainContent = (
                      <div className={`@container flex h-full items-center hover:bg-transparent`}>
                        <span
                          className="@container flex-1 flex h-full items-center hover:bg-transparent numbers-xs"
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          <div
                            className="truncate transition-all duration-300 min-w-0"
                            style={{ direction: 'ltr' }}
                            onClick={() => {
                              navigator.clipboard.writeText(cellData?.value)
                            }}
                          >
                            {cellData?.value.slice(0, cellData?.value.length - 6)}
                          </div>
                          <div className="transition-all duration-300 flex-shrink-0">
                            {cellData?.value.slice(-6)}
                          </div>

                        </span>
                      </div>
                    );

                    // add copy to the right
                    cellRightContent = (
                      <div className="pr-[10px]">
                        <CopyButton value={cellData?.value} />
                      </div>
                    );
                  }

                  // if copyable boolean set to true, add copy button
                  if (columnDefinitions?.[columnKey]?.copyable) {
                    cellRightContent = (
                      <div className="pr-[10px]">
                        <CopyButton value={cellData?.value} />
                      </div>
                    );
                  }

                  // add link to cell content if it exists
                  if (cellData?.link) {
                    cellMainContent = (
                      <Link
                        href={cellData.link}
                        target={cellData.link.includes('http') ? '_blank' : '_self'}
                        rel={cellData.link.includes('http') ? 'noopener noreferrer' : ''}
                        className="hover:underline w-full block cursor-pointer"
                      >
                        {cellMainContent}
                      </Link>
                    );
                  }

                  const infoTooltipText = getCellInfoTooltipText(cellData);
                  if (infoTooltipText) {
                    const infoIcon = <InfoTooltipIcon text={infoTooltipText} />;
                    if (cellRightContent) {
                      cellRightContent = (
                        <div className="flex items-center gap-x-[6px]">
                          {cellRightContent}
                          {infoIcon}
                        </div>
                      );
                    } else {
                      cellRightContent = infoIcon;
                    }
                  }

                  // Cell bar wrapping
                  const cellBarDef = columnDefinitions?.[columnKey]?.cellBar;
                  const isNumeric = columnDefinitions?.[columnKey]?.isNumeric;
                  if (cellBarDef && typeof cellData?.value === "number" && barMaxValues.cellBarMaxes[columnKey] > 0) {
                    const barWidth = Math.abs(cellData.value) / barMaxValues.cellBarMaxes[columnKey];
                    const barColor = resolveBarColor(rowData, cellBarDef.colorColumn, cellBarDef.color) || "#5A6462";
                    cellMainContent = (
                      <div className={`relative flex flex-col w-full gap-y-[4px] ${isNumeric ? 'items-end' : 'items-start'}`}>
                        <div className={`w-full flex items-center ${isNumeric ? 'justify-end' : ''}`}>
                          {cellMainContent}
                        </div>
                        <div className="absolute bottom-[-6px] right-0 w-full h-[4px]">
                          <div className="absolute h-[4px] right-0 rounded-[2px]" style={{ background: barColor, width: `${barWidth*100}%`}}  />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`${rowIndex}-${columnKey}`} className={`flex items-center gap-[5px] w-full ${cellPadding} ${columnDefinitions?.[columnKey]?.isNumeric ? 'justify-end' : 'justify-start'}`}>
                      {cellLeftContent && cellLeftContent}
                      {cellMainContent && cellMainContent}
                      {cellRightContent && cellRightContent}
                    </div>
                  );
                })}
              </GridTableRow>
            ))}
            </div>
          );
          return isScrollable ? (
            <VerticalScrollContainer
              height={340}
              scrollbarAbsolute={true}
              scrollbarPosition="right"
              paddingRight={30}
              className="w-full min-w-[600px]"
              header={tableHeader}
            >
              {tableRows}
            </VerticalScrollContainer>
          ) : (
            <div className="w-full min-w-[600px]">
              {tableHeader}
              {tableRows}
            </div>
          );
        })()}
      </HorizontalScrollContainer>
    </div>
  );
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center">
      <GTPIcon
        icon={copied ? "gtp-checkmark-checked-monochrome" : "gtp-copy-monochrome"}
        size="sm"
        className="cursor-pointer !size-[10px]"
        containerClassName='!size-[10px]'
        onClick={handleCopy}
      />
    </div>
  );
};