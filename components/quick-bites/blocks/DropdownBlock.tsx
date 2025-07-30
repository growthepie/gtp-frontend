'use client';

import React, { useState } from 'react';
import { DropdownBlock as DropdownBlockType } from '@/lib/types/blockTypes';
import Dropdown, { DropdownOption } from '@/components/quick-bites/Dropdown';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';

interface DropdownBlockProps {
  block: DropdownBlockType;
}

export const DropdownBlock: React.FC<DropdownBlockProps> = ({ block }) => {
  const { sharedState, setSharedState } = useQuickBite();
  const stateKey = block.stateKey || 'defaultDropdown';
  const selectedValue = sharedState[stateKey] || block.defaultValue || '';

  const { data: jsonData, error, isLoading } = useSWR(block.readFromJSON ? block.jsonData?.url : null);

  // Get the actual options source - either from block or from JSON
  const dropdownOptions = React.useMemo((): DropdownOption[] => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToOptions) {
      // Navigate to the path in the JSON data
      const pathParts = block.jsonData.pathToOptions.split('.');
      let data = jsonData;
      for (const part of pathParts) {
        data = data[part];
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('DropdownBlock Options Debug:', {
          pathToOptions: block.jsonData.pathToOptions,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'no first item'
        });
      }
      
      // Convert array format to DropdownOption format
      if (Array.isArray(data)) {
        return data.map((item, index) => {
          // Handle different data structures
          if (typeof item === 'string') {
            // Simple string array
            return {
              value: item,
              label: item
            };
          } else if (typeof item === 'object' && item !== null) {
            // Object with value/label or custom mapping
            const valueField = block.jsonData?.valueField || 'value';
            const labelField = block.jsonData?.labelField || 'label';
            
            return {
              value: item[valueField] || item.id || item.key || `option-${index}`,
              label: item[labelField] || item.name || item.title || item[valueField] || `Option ${index + 1}`
            };
          }
          
          // Fallback for unexpected data types
          return {
            value: `option-${index}`,
            label: String(item)
          };
        });
      }
      
      // If it's an object, try to convert to array of options
      if (typeof data === 'object' && data !== null) {
        return Object.entries(data).map(([key, value]) => ({
          value: key,
          label: typeof value === 'string' ? value : key
        }));
      }
      
      // Debug logging for unexpected data structure
      if (process.env.NODE_ENV === 'development') {
        console.warn('DropdownBlock: Unexpected data structure for options:', data);
      }
      
      return [];
    }
    
    return block.options || [];
  }, [block.readFromJSON, block.options, block.jsonData, jsonData]);

  // Add debug logging for development
  React.useEffect(() => {
    if (block.readFromJSON && process.env.NODE_ENV === 'development') {
      console.log('DropdownBlock Debug:', {
        url: block.jsonData?.url,
        isLoading,
        error,
        hasData: !!jsonData,
        optionsCount: dropdownOptions.length,
        jsonData: jsonData ? 'Data received' : 'No data'
      });
    }
  }, [block.readFromJSON, block.jsonData?.url, isLoading, error, jsonData, dropdownOptions.length]);

  const handleChange = (value: string) => {
    setSharedState(stateKey, value);
  };

  // Show loading state
  if (block.readFromJSON && isLoading) {
    return (
      <div className="my-6">
        {block.label && (
          <label className="block text-sm font-medium mb-2">
            {block.label}
          </label>
        )}
        <div className="w-full">
          <div className="flex items-center justify-center p-4 text-forest-600 dark:text-forest-400 border rounded-lg">
            Loading options...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (block.readFromJSON && error) {
    return (
      <div className="my-6">
        {block.label && (
          <label className="block text-sm font-medium mb-2">
            {block.label}
          </label>
        )}
        <div className="w-full">
          <div className="flex items-center justify-center p-4 text-red-600 dark:text-red-400 border border-red-300 rounded-lg">
            Error loading options: {error.message}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no options
  if (dropdownOptions.length === 0) {
    return (
      <div className="my-6">
        {block.label && (
          <label className="block text-sm font-medium mb-2">
            {block.label}
          </label>
        )}
        <div className="w-full">
          <div className="flex items-center justify-center p-4 text-forest-600 dark:text-forest-400 border rounded-lg">
            No options available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      {block.label && (
        <label className="block text-sm font-medium mb-2">
          {block.label}
        </label>
      )}
      
      <div className="w-full">
        <Dropdown
          options={dropdownOptions}
          value={selectedValue}
          placeholder={block.placeholder}
          onChange={handleChange}
          searchable={block.searchable}
          disabled={block.disabled}
        />
      </div>
    </div>
  );
};