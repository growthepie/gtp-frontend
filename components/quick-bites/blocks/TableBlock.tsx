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

  const { data: jsonData, error, isLoading } = useSWR(block.readFromJSON ? block.jsonData?.url : null);

  // Get the actual data source - either from block or from JSON
  const tableData = React.useMemo(() => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToRowData) {
      // Navigate to the path in the JSON data
      const pathParts = block.jsonData.pathToRowData.split('.');
      let data = jsonData;
      for (const part of pathParts) {
        data = data[part];
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('TableBlock Data Debug:', {
          pathToRowData: block.jsonData.pathToRowData,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'no first item'
        });
      }
      
      // Convert array format to rowData object format
      if (Array.isArray(data)) {
        const rowData: typeof block.rowData = {};
        data.forEach((rowItem, index) => {
          // Generate a row key - try to use a meaningful identifier from the data
          const tickerValue = rowItem.ticker?.value;
          const nameValue = rowItem.name?.value;
          const contractValue = rowItem.contract_address?.value;
          const rowKey = tickerValue || nameValue || contractValue || `row-${index}`;
          
          rowData[rowKey] = rowItem;
        });
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('TableBlock Converted Data:', {
            originalArrayLength: data.length,
            convertedObjectKeys: Object.keys(rowData).length,
            sampleRowKey: Object.keys(rowData)[0],
            sampleRowData: Object.keys(rowData).length > 0 ? rowData[Object.keys(rowData)[0]] : 'no rows'
          });
        }
        
        return rowData;
      }
      
      // If it's already an object, use it directly
      return data || {};
    }
    return block.rowData || {};
  }, [block.readFromJSON, block.rowData, block.jsonData, jsonData]);

  // Get the column keys - either from block or from JSON
  const dynamicColumnKeys = React.useMemo(() => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToColumnKeys) {
      // Get columnKeys from JSON if path is specified
      const columnPathParts = block.jsonData.pathToColumnKeys.split('.');
      let columnKeys = jsonData;
      for (const part of columnPathParts) {
        columnKeys = columnKeys[part];
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('TableBlock ColumnKeys Debug (explicit path):', {
          pathToColumnKeys: block.jsonData.pathToColumnKeys,
          columnKeysType: typeof columnKeys,
          columnKeysKeys: columnKeys && typeof columnKeys === 'object' ? Object.keys(columnKeys) : 'not object'
        });
      }
      
      return columnKeys || {};
    }
    // If no specific path for columnKeys, try to infer from the same parent as rowData
    if (block.readFromJSON && jsonData && block.jsonData?.pathToRowData) {
      // Navigate to the parent path and look for columnKeys
      const pathParts = block.jsonData.pathToRowData.split('.');
      // Remove the last part (e.g., "rowData") to get the parent path
      const parentPath = pathParts.slice(0, -1);
      let parent = jsonData;
      for (const part of parentPath) {
        parent = parent[part];
      }
      // Try to find columnKeys in the same parent
      if (parent && parent.columnKeys) {
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('TableBlock ColumnKeys Debug (auto-discovered):', {
            parentPath: parentPath.join('.'),
            hasColumnKeys: !!parent.columnKeys,
            columnKeysKeys: Object.keys(parent.columnKeys)
          });
        }
        return parent.columnKeys;
      }
    }
    // If no specific path for columnKeys, try to infer from the first row of data
    if (block.readFromJSON && jsonData) {
      const firstRowKey = Object.keys(tableData)[0];
      if (firstRowKey && tableData[firstRowKey]) {
        const inferredColumnKeys: typeof block.columnKeys = {};
        Object.keys(tableData[firstRowKey]).forEach(columnKey => {
          inferredColumnKeys[columnKey] = {
            sortByValue: true, // Default to sortable
            label: columnKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          };
        });
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('TableBlock ColumnKeys Debug (inferred):', {
            inferredFrom: 'first row data',
            columnKeysKeys: Object.keys(inferredColumnKeys)
          });
        }
        
        return inferredColumnKeys;
      }
    }
    return block.columnKeys || {};
  }, [block.readFromJSON, block.columnKeys, block.jsonData, jsonData, tableData]);

  // Helper function to determine if a column is primarily numeric
  const isColumnNumeric = React.useMemo(() => {
    const columnTypes: Record<string, boolean> = {};
    const rowKeys = Object.keys(tableData);
    
    Object.keys(dynamicColumnKeys).forEach(columnKey => {
      let numericCount = 0;
      let totalCount = 0;
      
      rowKeys.forEach(rowKey => {
        const cellData = tableData[rowKey]?.[columnKey];
        if (cellData?.value !== undefined && cellData?.value !== null) {
          totalCount++;
          if (typeof cellData.value === 'number') {
            numericCount++;
          }
        }
      });
      
      // Consider a column numeric if more than 50% of non-empty values are numbers
      columnTypes[columnKey] = totalCount > 0 && (numericCount / totalCount) > 0.5;
    });
    
    return columnTypes;
  }, [tableData, dynamicColumnKeys]);

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

  // Add debug logging for development
  React.useEffect(() => {
    if (block.readFromJSON && process.env.NODE_ENV === 'development') {
      console.log('TableBlock Debug:', {
        url: block.jsonData?.url,
        isLoading,
        error,
        hasData: !!jsonData,
        jsonData: jsonData ? 'Data received' : 'No data'
      });
    }
  }, [block.readFromJSON, block.jsonData?.url, isLoading, error, jsonData]);

  // Show loading state
  if (block.readFromJSON && isLoading) {
    return (
      <div className={`my-8 ${block.className || ''}`}>
        {block.content && (
          <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">
            {block.content}
          </div>
        )}
        <div className="flex items-center justify-center p-8 text-forest-600 dark:text-forest-400">
          Loading table data...
        </div>
      </div>
    );
  }

  // Show error state
  if (block.readFromJSON && error) {
    return (
      <div className={`my-8 ${block.className || ''}`}>
        {block.content && (
          <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">
            {block.content}
          </div>
        )}
        <div className="flex items-center justify-center p-8 text-red-600 dark:text-red-400">
          Error loading table data: {error.message}
        </div>
      </div>
    );
  }

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

  // Show empty state if no data
  if (Object.keys(tableData).length === 0 || columnKeyNames.length === 0) {
    return (
      <div className={`my-8 ${block.className || ''}`}>
        {block.content && (
          <div className="mb-4 text-sm text-forest-700 dark:text-forest-300">
            {block.content}
          </div>
        )}
        <div className="flex items-center justify-center p-8 text-forest-600 dark:text-forest-400">
          No data available to display
        </div>
      </div>
    );
  }

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
            {Object.entries(dynamicColumnKeys).map(([columnKey, columnConfig]) => {
              // Use the consistent column type detection
              const isNumericColumn = isColumnNumeric[columnKey];
              
              return (
                <div 
                  key={columnKey}
                  className={`px-4 py-2 heading-small-xxs cursor-pointer transition-colors ${
                    isNumericColumn ? 'text-right' : 'text-left'
                  }`}
                  onClick={() => (columnConfig as any)?.sortByValue && handleSort(columnKey)}
                >
                  <div className={`flex items-center gap-2  ${
                    isNumericColumn ? 'justify-end' : ''
                  }`}>
                    {(columnConfig as any)?.label || columnKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    
                    {(columnConfig as any)?.sortByValue && getSortIcon(columnKey)}
                  </div>
                </div>
              );
            })}
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
                      // Use the consistent column type detection
                      const isNumericColumn = isColumnNumeric[columnKey];
                      
                      return (
                        <div key={`${rowKey}-${columnKey}`} className={`flex items-center py-2 overflow-hidden px-4 `}

                        >
                          <div className="flex items-center gap-2 w-full">
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
                                  className={`flex h-full w-full items-center hover:underline ${
                                    isNumericColumn ? 'numbers-xs justify-end' : 'text-xs'
                                  }`}
                                >
                                  {cellData?.value && typeof cellData?.value === 'number' && formatValue(cellData?.value)}
                                  {cellData?.value && typeof cellData?.value === 'string' && cellData?.value}
                                </span>
                              </Link>
                            ) : (
                              <span 
                                className={`flex h-full w-full items-center truncate ${
                                  isNumericColumn ? 'numbers-xs justify-end' : 'text-xs text-left'
                                }`}
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