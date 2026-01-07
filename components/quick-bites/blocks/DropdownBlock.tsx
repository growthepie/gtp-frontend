'use client';

import React, { useEffect, useState } from 'react';
import { DropdownBlock as DropdownBlockType } from '@/lib/types/blockTypes';
import Dropdown, { DropdownOption } from '@/components/quick-bites/Dropdown';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';

interface DropdownBlockProps {
  block: DropdownBlockType;
}

export const DropdownBlock: React.FC<DropdownBlockProps> = ({ block }) => {
  const { sharedState, setSharedState, exclusiveFilterKeys, setExclusiveFilterKeys, inclusiveFilterKeys, setInclusiveFilterKeys } = useQuickBite();
  const stateKey = block.stateKey || 'defaultDropdown';
  const selectedValue = stateKey in sharedState ? sharedState[stateKey] : block.defaultValue || null;
  const { data: jsonData, error, isLoading } = useSWR(block.readFromJSON ? block.jsonData?.url : null);

  // on mount, set the shared state to the default value if it's not already set
  useEffect(() => {
    if (!sharedState[stateKey] && block.defaultValue) {
      setSharedState(stateKey, block.defaultValue || null);
      if (block.exclusive) {
        setExclusiveFilterKeys({ categoryKey: null, valueKey: block.defaultValue });
      } else if (block.inclusive) {
        setInclusiveFilterKeys({ categoryKey: null, valueKey: block.defaultValue });
      }
    }
  }, []);

  // Get the actual options source - either from block or from JSON
  const dropdownOptions = React.useMemo((): DropdownOption[] => {
    if (block.readFromJSON && jsonData && block.jsonData?.pathToOptions) {
      // Navigate to the path in the JSON data

      const pathParts = block.jsonData.pathToOptions.split('.');
      let data = jsonData;
      for (const part of pathParts) {
        data = data[part];
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

  const handleChange = (value: string | null, categoryKey?: string | null) => {
    console.log('handleChange', value);
    if (value === null && block.allowEmpty) {
      setSharedState(stateKey, null);
      setExclusiveFilterKeys({ categoryKey: null, valueKey: null });
      setInclusiveFilterKeys({ categoryKey: null, valueKey: null });
    } else if (value !== null) {

      setSharedState(stateKey, value);

      if (block.exclusive) {
        setExclusiveFilterKeys({ categoryKey: categoryKey || null, valueKey: value });
      } else if (block.inclusive) {
        setInclusiveFilterKeys({ categoryKey: categoryKey || null, valueKey: value });
      }
    }
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

  // Show empty state if no options and not loading
  if (dropdownOptions.length === 0 && !isLoading) {
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
          allowEmpty={block.allowEmpty}
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