import React, { useState } from 'react';
import { TableBlock as TableBlockType } from "@/lib/types/blockTypes";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from "@iconify/react";
import Link from 'next/link';

export const TableBlock = ({ block }: { block: TableBlockType }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);


  // Sort data based on current sort configuration
  const sortedRowKeys = React.useMemo(() => {
    const rowKeys = Object.keys(block.rowData);
    const columnKeyNames = Object.keys(block.columnKeys);
    
    if (!sortConfig) {
      // Use default sorting if specified
      if (block.columnSortBy === "value") {
        return rowKeys.sort((a, b) => {
          const firstColumn = columnKeyNames[0];
          const aValue = block.rowData[a]?.[firstColumn]?.value || 0;
          const bValue = block.rowData[b]?.[firstColumn]?.value || 0;
          return (bValue as number) - (aValue as number);
        });
      } else if (block.columnSortBy === "name") {
        return rowKeys.sort((a, b) => a.localeCompare(b));
      }
      return rowKeys;
    }

    return rowKeys.sort((a, b) => {
      const aRow = block.rowData[a];
      const bRow = block.rowData[b];
      
      // If sorting by row name (key)
      if (sortConfig.key === 'name') {
        const result = a.localeCompare(b);
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      // If sorting by column value
      const aCell = aRow?.[sortConfig.key];
      const bCell = bRow?.[sortConfig.key];
      
      if (!aCell || !bCell) return 0;
      
      // Get sortByValue from column configuration
      const columnConfig = block.columnKeys[sortConfig.key];
      const shouldSortByValue = columnConfig?.sortByValue ?? true;
      
      const aValue = shouldSortByValue ? (aCell.value || 0) : a;
      const bValue = shouldSortByValue ? (bCell.value || 0) : b;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortConfig.direction === 'asc' ? result : -result;
      }
      
      const result = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [block.rowData, block.columnKeys, block.columnSortBy, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'desc' };
    });
  };
 


  const getSortIcon = (key: string) => {
    return (
      <Icon
        icon={
          sortConfig?.key === key && sortConfig.direction === "asc"
            ? "feather:arrow-up"
            : "feather:arrow-down"
        }
        className="w-[9px] h-[9px]"
        style={{
          opacity: sortConfig?.key === key ? 1 : 0.2,
        }}
      />
    );
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value || '');
  };

  return (
    <div className={`my-8 ${block.className || ''}`}>
      {block.content && (
        <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">
          {block.content}
        </div>
      )}
      
      <div className="overflow-x-auto bg-transparent rounded-lg shadow-sm">
        <div className="w-full min-w-[500px]">
          {/* Header Row */}
          <div className="flex ">
            {Object.entries(block.columnKeys).map(([columnKey, columnConfig]) => (
              <div 
                key={columnKey}
                className="flex-1 text-left px-4 py-2 heading-small-xxs  cursor-pointer transition-colors "
                onClick={() => columnConfig.sortByValue && handleSort(columnKey)}
              >
                <div className={`flex items-center gap-2 ${columnKey === "name" ? 'relative left-[15px]' : ''}`}>
                  {columnConfig.label || columnKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  
                  {columnConfig.sortByValue && getSortIcon(columnKey)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Data Rows */}
          <div className="flex flex-col">
            {sortedRowKeys.map((rowKey, index) => (
              <div 
                key={rowKey}
                className={`flex border-[1px] rounded-full border-forest-900 bg-transparent transition-colors mb-1 ${
                  index % 2 === 0 ? '' : ''
                }`}
              >
                {Object.keys(block.columnKeys).map((columnKey) => {
                  const cellData = block.rowData[rowKey]?.[columnKey];
                  return (
                    <div key={`${rowKey}-${columnKey}`} className={`flex flex-1 py-2  ${columnKey === "name" ? 'relative right-[8px] px-4' : ' px-4'}`}>
                      <div className="flex items-center gap-2 ">
                        {cellData?.icon && (
                          <GTPIcon 
                            icon={cellData.icon as GTPIconName} 
                            size="sm"
                            style={cellData.color ? { color: cellData.color } : undefined}
                          />
                        )}
                        {cellData?.link ? (
                          <Link href={cellData.link}>
                            <span 
                              className={`flex h-full w-full items-center hover:underline ${cellData?.value && typeof cellData?.value === 'number' ? 'numbers-xs' : 'text-xs '}`}
                            >
                              {cellData?.value && typeof cellData?.value === 'number' && formatValue(cellData?.value)}
                              {cellData?.value && typeof cellData?.value === 'string' && cellData?.value}
                            </span>
                          </Link>
                        ) : (
                          <span 
                            className={`flex h-full w-full items-center  ${cellData?.value && typeof cellData?.value === 'number' ? 'numbers-xs' : 'text-xs '}`}
                          >
                            {cellData?.value && typeof cellData?.value === 'number' && formatValue(cellData?.value)}
                            {cellData?.value && typeof cellData?.value === 'string' && cellData?.value}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};