import React, { useState } from 'react';
import { TableBlock as TableBlockType } from "@/lib/types/blockTypes";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from "@iconify/react";
import Link from 'next/link';
import useSWR from 'swr';
import  VerticalScrollContainer  from '@/components/VerticalScrollContainer';

export const TableBlock = ({ block }: { block: TableBlockType }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const { data: jsonData } = useSWR(block.readFromJSON ? block.jsonData?.url : null);

  // Get the actual data source - either from block or from JSON
  const tableData = React.useMemo(() => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToRowData) {
      // Navigate to the path in the JSON data
      const pathParts = block.jsonData.pathToRowData.split('.');
      let data = jsonData;
      for (const part of pathParts) {
        data = data[part];
      }
      
      // Convert array to rowData format
      if (Array.isArray(data)) {
        const rowData: typeof block.rowData = {};
        data.forEach((item, index) => {
          const rowKey = item.name || item.id || `row-${index}`;
          rowData[rowKey] = {};
          
          // Get the actual property values in order (by index, not by key name)
          const dataValues = Object.values(item);
          
          // Map each data value to its corresponding column index
          dataValues.forEach((value, columnIndex) => {
            // Use column index as the key so it matches with dynamicColumnKeys
            rowData[rowKey][`col_${columnIndex}`] = {
              value: value as string | number
              // icon, color, and link are optional and will be undefined by default
            };
          });
        });
        return rowData;
      }
    }
    return block.rowData || {};
  }, [block.readFromJSON, block.rowData, block.jsonData, jsonData]);

  // Get the column keys - either from block or from JSON
  const dynamicColumnKeys = React.useMemo(() => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToColumnKeys && block.jsonData?.pathToTypes) {
      // Get columns array from JSON
      const columnPathParts = block.jsonData.pathToColumnKeys.split('.');
      let columns = jsonData;
      for (const part of columnPathParts) {
        columns = columns[part];
      }

      // Get types array from JSON
      const typePathParts = block.jsonData.pathToTypes.split('.');
      let types = jsonData;
      for (const part of typePathParts) {
        types = types[part];
      }

      // Build columnKeys object using index-based keys to match data
      if (Array.isArray(columns) && Array.isArray(types)) {
        const dynamicColumnKeys: typeof block.columnKeys = {};
        columns.forEach((columnName: string, index: number) => {
          const columnType = types[index] || 'string';
          // Use col_${index} as key to match the data structure
          dynamicColumnKeys[`col_${index}`] = {
            sortByValue: columnType === 'number',
            label: columnName // Use the column name directly as the label
          };
        });
        return dynamicColumnKeys;
      }
    }
    return block.columnKeys || {};
  }, [block.readFromJSON, block.columnKeys, block.jsonData, jsonData]);

  // Sort data based on current sort configuration
  const sortedRowKeys = React.useMemo(() => {
    const rowKeys = Object.keys(tableData);
    const columnKeyNames = Object.keys(dynamicColumnKeys);
    
    if (!sortConfig) {
      // Use default sorting if specified
      if (block.columnSortBy === "value") {
        return rowKeys.sort((a, b) => {
          const firstColumn = columnKeyNames[0];
          const aValue = tableData[a]?.[firstColumn]?.value || 0;
          const bValue = tableData[b]?.[firstColumn]?.value || 0;
          return (bValue as number) - (aValue as number);
        });
      } else if (block.columnSortBy === "name") {
        return rowKeys.sort((a, b) => a.localeCompare(b));
      }
      return rowKeys;
    }

    return rowKeys.sort((a, b) => {
      const aRow = tableData[a];
      const bRow = tableData[b];
      
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
      const columnConfig = dynamicColumnKeys[sortConfig.key];
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
  }, [tableData, dynamicColumnKeys, block.columnSortBy, sortConfig]);

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

  // Calculate the value for the grid col definition based on num columns
  const columnKeyNames = Object.keys(dynamicColumnKeys);
  const gridDefinitionColumns = `${columnKeyNames.map(() => 'minmax(100px,1fr)').join(' ')}`;

  return (
    <div className={`my-8 ${block.className || ''}`}>
      {block.content && (
        <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">
          {block.content}
        </div>
      )}
      
      <div className="overflow-x-auto bg-transparent rounded-lg shadow-sm">
                <div className="w-full min-w-[500px]">
          {/* Fixed Header Row - Use same width calculation as scrollable content */}
          <div 
            className="grid pr-4" 
            style={{ 
              gridTemplateColumns: gridDefinitionColumns,
              width: 'calc(100% - 17px)', // Account for typical scrollbar width
            
            }}
          >
            {Object.entries(dynamicColumnKeys).map(([columnKey, columnConfig]) => (
              <div 
                key={columnKey}
                className="text-left px-4 py-2 heading-small-xxs cursor-pointer transition-colors"
                onClick={() => columnConfig.sortByValue && handleSort(columnKey)}

              >
                <div className={`flex items-center gap-2 ${columnKey === "name" ? 'relative left-[15px]' : ''}`}>
                  {columnConfig.label || columnKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  
                  {columnConfig.sortByValue && getSortIcon(columnKey)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Scrollable Data Container */}
          <VerticalScrollContainer 
            height={250}
            className="max-h-[250px]"
          >
            <div className="flex flex-col">
                {sortedRowKeys.map((rowKey, index) => (
                  <div 
                    key={rowKey}
                    className={`grid border-[1px] rounded-full border-forest-900 bg-transparent transition-colors mb-1 ${
                      index % 2 === 0 ? '' : ''
                    }`}
                    style={{ gridTemplateColumns: gridDefinitionColumns
                      
                     }}
                  >
                    {Object.keys(dynamicColumnKeys).map((columnKey) => {
                      const cellData = tableData[rowKey]?.[columnKey];
                      return (
                        <div key={`${rowKey}-${columnKey}`} className={`flex items-center py-2 overflow-hidden ${columnKey === "name" ? 'relative right-[8px] px-4' : 'px-4'}`}
                          
                        >
                          <div className="flex items-center gap-2">
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
                                className={`flex h-full w-full items-center truncate ${cellData?.value && typeof cellData?.value === 'number' ? 'numbers-xs text-right' : 'text-xs text-left'}`}
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
            </VerticalScrollContainer>
        </div>
      </div>
    </div>
  );
};