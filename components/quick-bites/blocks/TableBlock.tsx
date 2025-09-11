'use client';

import React, { useState, useMemo } from 'react';
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
import { Icon } from '@iconify/react';


const getNestedValue = (obj: any, path: string) => {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), obj);
};

const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export const TableBlock = ({ block }: { block: TableBlockType }) => {
  const { sharedState, exclusiveFilterKeys, inclusiveFilterKeys } = useQuickBite();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const url = useMemo(() => {
    if (!block.readFromJSON) return null;
    return block.jsonData?.url || null;
  }, [block.readFromJSON, block.jsonData]);

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
  }, [block.readFromJSON, block.columnDefinitions, jsonData]);

  const columnKeyOrder = useMemo(() => Object.keys(dynamicColumnKeys), [dynamicColumnKeys]);

  const columnDefinitions = useMemo(() => {
    if (block.columnDefinitions) {
      return block.columnDefinitions;
    }
    return {};
  }, [block.readFromJSON, block.columnDefinitions]);

  const processedRows = useMemo(() => {
    if (!block.readFromJSON || !jsonData) {
      if (block.rowData) {
        return Object.values(block.rowData).map(rowObject =>
          columnKeyOrder.map(key => rowObject[key])
        );
      }
      return [];
    }
    const rowsArray = getNestedValue(jsonData, block.jsonData?.pathToRowData || '');
    if (!Array.isArray(rowsArray)) return [];
    return rowsArray.map(row => row.map((cellValue, index) => {
      const cellObject: { value: any; link?: string; icon?: string; color?: string; } = { value: cellValue };
      const columnKey = columnKeyOrder[index];
      const columnDef = columnDefinitions[columnKey];
      
      // Generate link if add_url is defined in column definition
      if (columnDef?.add_url && typeof cellValue === 'string') {
        cellObject.link = columnDef.add_url.replace('${cellValue}', cellValue);
      }
      
      return cellObject;
    }));
  }, [block.readFromJSON, block.rowData, jsonData, columnKeyOrder]);

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

      if (!sortConfig) return filteredData;

      const sortIndex = columnKeyOrder.indexOf(sortConfig.key);
      if (sortIndex === -1) return filteredData;

      return filteredData.sort((a, b) => {
        const aValue = a[sortIndex]?.value ?? 0;
        const bValue = b[sortIndex]?.value ?? 0;
        const result = typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? result : -result;
      });
    }

    // Default sorting if no filtering is configured
    if (!sortConfig) return dataToSort;
    const sortIndex = columnKeyOrder.indexOf(sortConfig.key);
    if (sortIndex === -1) return dataToSort;
    return dataToSort.sort((a, b) => {
      const aValue = a[sortIndex]?.value ?? 0;
      const bValue = b[sortIndex]?.value ?? 0;
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [processedRows, sortConfig, columnKeyOrder, sharedState, block.filterOnStateKey, exclusiveFilterKeys, inclusiveFilterKeys]);

  if (block.readFromJSON && isLoading) return <div className="my-8 text-center">Loading table data...</div>;
  if (block.readFromJSON && error) return <div className="my-8 text-center text-red-500">Error: {error.message}</div>;
  if (sortedRows.length === 0 || columnKeyOrder.length === 0) return <div className="my-8 text-center">No data available</div>;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: (prev?.key === key && prev.direction === 'desc') ? 'asc' : 'desc' }));
  };

  const formatValue = (value: any, columnKey: string) => {
    // get units if exists
    const units = columnDefinitions[columnKey]?.units;
    if (units) {
      const unit = Object.values(units)[0];
      return `${unit.prefix??''}${(value).toLocaleString("en-GB", { minimumFractionDigits: unit.decimals??0, maximumFractionDigits: unit.decimals??0 })}${unit.suffix??''}`;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      return String(value || '');
    }
  }

  const gridTemplateColumns = columnKeyOrder.map((columnKey) => {
    const minWidth = columnDefinitions[columnKey]?.minWidth || 120;
    return `minmax(${minWidth}px, 1fr)`;
  }).join(' ');

  
  

  return (
    <div className={`my-8 ${block.className || ''}`}>
      {block.content && <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">{block.content}</div>}

      <HorizontalScrollContainer includeMargin={isMobile}>
        <VerticalScrollContainer
          height={340}
          scrollbarAbsolute={true}
          scrollbarPosition="right"
          paddingRight={30}
          className="w-full min-w-[600px]"
          header={
            <GridTableHeader style={{ gridTemplateColumns }} className="group heading-small-xs gap-x-[15px] !pl-[15px] !pr-[5px] select-none h-[34px] !pt-0 !pb-0 !items-end">
              {columnKeyOrder.map(columnKey => (
                <GridTableHeaderCell
                  key={columnKey}
                  justify={columnDefinitions[columnKey]?.isNumeric ? 'end' : 'start'}
                  metric={columnKey}
                  sort={{ metric: sortConfig?.key || '', sortOrder: sortConfig?.direction || 'desc' }}
                  onSort={() => dynamicColumnKeys[columnKey]?.sortByValue && handleSort(columnKey)}
                  className={`${columnDefinitions[columnKey]?.isNumeric ? 'text-right' : 'text-left'}`}
                >
                  {columnDefinitions[columnKey]?.label || formatLabel(columnKey)}
                </GridTableHeaderCell>
              ))}
            </GridTableHeader>
          }
        >
          <div className="flex flex-col gap-y-[5px] w-full relative mt-[5px]">
            {sortedRows.map((rowData, rowIndex) => (
              <GridTableRow key={`row-${rowIndex}`} style={{ gridTemplateColumns }} className="group text-xs gap-x-[15px] !pl-[15px] !pr-[15px] select-none h-[34px] !pt-0 !pb-0">
                {rowData.map((cellData, colIndex) => {
                  const columnKey = columnKeyOrder[colIndex];
                  let cellMainContent: React.ReactNode | null = null;
                  let cellLeftContent: React.ReactNode | null = null;
                  let cellRightContent: React.ReactNode | null = null;
                  // default cell content
                  cellMainContent = (
                    <>
                      {cellData?.icon && <GTPIcon icon={cellData.icon as GTPIconName} size="sm" style={cellData.color ? { color: cellData.color } : {}} />}
                      <span className={`truncate ${columnDefinitions?.[columnKey]?.isNumeric ? 'numbers-xs' : 'text-xs'}`}>
                        {formatValue(cellData?.value, columnKey)}
                      </span>
                    </>
                  );


                  // if address, add copy button and double click to select
                  if (columnDefinitions?.[columnKey]?.type === "address") {
                    cellMainContent = (
                      <div className={`@container flex h-full items-center hover:bg-transparent`}>
                        <span
                          className="@container flex-1 flex h-full items-center hover:bg-transparent numbers-xs"
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
                              navigator.clipboard.writeText(cellData?.value)
                            }}
                          >
                            {cellData?.value.slice(0, cellData?.value.length - 6)}
                          </div>
                          <div className="transition-all duration-300">
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
                    // add copy to the right
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



                  return (
                    <div key={`${rowIndex}-${columnKey}`} className={`flex items-center gap-[5px] w-full ${columnDefinitions?.[columnKey]?.isNumeric ? 'justify-end' : 'justify-start'}`}>
                      {cellLeftContent && cellLeftContent}
                      {cellMainContent && cellMainContent}
                      {cellRightContent && cellRightContent}
                    </div>
                  );
                })}
              </GridTableRow>
            ))}
          </div>
        </VerticalScrollContainer>
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