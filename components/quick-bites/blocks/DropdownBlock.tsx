'use client';

import React, { useEffect } from 'react';
import { DropdownBlock as DropdownBlockType, DropdownOption } from '@/lib/types/blockTypes';
import GTPDropdown, { GTPDropdownOption } from '@/components/GTPComponents/GTPDropdown';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { useMaster } from '@/contexts/MasterContext';
import { useTheme } from 'next-themes';
import { useQuickBite } from '@/contexts/QuickBiteContext';
import useSWR from 'swr';
import fiatData from '@/public/dicts/fiat.json';

interface DropdownBlockProps {
  block: DropdownBlockType;
}

export const DropdownBlock: React.FC<DropdownBlockProps> = ({ block }) => {
  const { sharedState, setSharedState, setExclusiveFilterKeys, setInclusiveFilterKeys } = useQuickBite();
  const stateKey = block.stateKey || 'defaultDropdown';
  const selectedValue = stateKey in sharedState ? sharedState[stateKey] : block.defaultValue || null;
  const { data: jsonData, error, isLoading } = useSWR(block.readFromJSON ? block.jsonData?.url : null);
  const { AllChainsByKeys } = useMaster();
  const { resolvedTheme } = useTheme();

  // on mount, set the shared state to the default value if it's not already set
  useEffect(() => {
    if (!(stateKey in sharedState) && block.defaultValue) {
      setSharedState(stateKey, block.defaultValue || null);
      if (block.exclusive) {
        setExclusiveFilterKeys({ categoryKey: null, valueKey: block.defaultValue });
      } else if (block.inclusive) {
        setInclusiveFilterKeys({ categoryKey: null, valueKey: block.defaultValue });
      }
    }
  }, [block.defaultValue, block.exclusive, block.inclusive, setExclusiveFilterKeys, setInclusiveFilterKeys, setSharedState, sharedState, stateKey]);

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
            const fiatInfo = fiatData[item.toUpperCase() as keyof typeof fiatData];
            const fiatCountry = fiatInfo?.country?.toLowerCase();
            // Simple string array
            return {
              value: item,
              label: fiatInfo?.name || item,
              ...(fiatCountry ? { icon: `flag:${fiatCountry}-4x3` } : {}),
            };
          } else if (typeof item === 'object' && item !== null) {
            // Object with value/label or custom mapping
            const valueField = block.jsonData?.valueField || 'value';
            const configuredLabelField = block.jsonData?.labelField;
            const labelField = configuredLabelField || 'label';
            const resolvedValue = item[valueField] || item.id || item.key || `option-${index}`;
            
            const logoField = block.jsonData?.logoField;
            const logoPrefix = block.jsonData?.logoPrefix ?? '';
            const rawLogo = logoField ? item[logoField] : undefined;
            const fiatCodeFromItem = typeof item.fiat === "string" ? item.fiat : undefined;
            const fiatCodeFromValue = typeof resolvedValue === "string" ? resolvedValue : undefined;
            const resolvedFiatCode = fiatCodeFromItem ?? fiatCodeFromValue;
            const fiatInfo = resolvedFiatCode
              ? fiatData[resolvedFiatCode.toUpperCase() as keyof typeof fiatData]
              : undefined;
            const fiatName = fiatInfo?.name;
            const fiatCountry =
              !rawLogo && resolvedFiatCode
                ? fiatInfo?.country?.toLowerCase()
                : undefined;
            const isFiatOption = valueField === "fiat" || Boolean(fiatCodeFromItem);
            return {
              value: resolvedValue,
              label:
                (isFiatOption ? fiatName : undefined) ||
                item[labelField] ||
                item.name ||
                item.title ||
                item[valueField] ||
                `Option ${index + 1}`,
              ...(rawLogo ? { logo: `${logoPrefix}${rawLogo}` } : {}),
              ...(fiatCountry ? { icon: `flag:${fiatCountry}-4x3` } : {}),
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

  const labelStateKey = block.labelStateKey;

  // Derive the label as a primitive so the effect below has a stable, comparable dependency
  const resolvedLabel = React.useMemo(() => {
    if (!labelStateKey || !selectedValue) return null;
    return dropdownOptions.find(o => o.value === selectedValue)?.label ?? null;
  }, [labelStateKey, selectedValue, dropdownOptions]);

  // Sync the resolved label into sharedState (watches a primitive, not the array)
  useEffect(() => {
    if (labelStateKey && resolvedLabel !== null) {
      setSharedState(labelStateKey, resolvedLabel);
    }
  }, [labelStateKey, resolvedLabel, setSharedState]);

  const handleChange = (value: string | null, categoryKey?: string | null) => {
    if (value === null && block.allowEmpty) {
      setSharedState(stateKey, null);
      if (labelStateKey) setSharedState(labelStateKey, null);
      setExclusiveFilterKeys({ categoryKey: null, valueKey: null });
      setInclusiveFilterKeys({ categoryKey: null, valueKey: null });
    } else if (value !== null) {
      setSharedState(stateKey, value);
      if (labelStateKey) {
        const match = dropdownOptions.find(o => o.value === value);
        if (match) setSharedState(labelStateKey, match.label);
      }
      if (block.exclusive) {
        setExclusiveFilterKeys({ categoryKey: categoryKey || null, valueKey: value });
      } else if (block.inclusive) {
        setInclusiveFilterKeys({ categoryKey: categoryKey || null, valueKey: value });
      }
    }
  };




  // Options for the platform dropdown: chain values get their chain icon (auto-detected
  // unless jsonData.useChainIcons says otherwise), logos become images, and labels like
  // "HUBC | Hub Cyber Security" show only the part before "|" once selected.
  const gtpOptions = React.useMemo((): GTPDropdownOption[] => {
    const useChainIcons = block.jsonData?.useChainIcons;
    const isChainDropdown = useChainIcons === false
      ? false
      : useChainIcons === true || (dropdownOptions.length > 0 && dropdownOptions.every((option) => Boolean(AllChainsByKeys?.[option.value])));
    return dropdownOptions.map((option) => {
      const chain = isChainDropdown ? AllChainsByKeys?.[option.value] : undefined;
      const chainColor = chain ? chain.colors[resolvedTheme === "light" ? "light" : "dark"][0] : undefined;
      return {
        value: option.value,
        label: option.label,
        ...(option.label.includes("|") ? { triggerLabel: option.label.split("|")[0].trim() } : {}),
        ...(option.logo ? { imageUrl: option.logo } : {}),
        ...(!option.logo && option.icon ? { icon: option.icon as GTPIconName } : {}),
        ...(!option.logo && !option.icon && chain
          ? { icon: `gtp:${chain.urlKey}-logo-monochrome` as GTPIconName, iconStyle: { color: chainColor } }
          : {}),
      };
    });
  }, [dropdownOptions, block.jsonData?.useChainIcons, AllChainsByKeys, resolvedTheme]);

  // Loading, error and empty states keep the dropdown's shape (disabled, with a status
  // instead of the placeholder), so nothing jumps when the options arrive.
  const status =
    block.readFromJSON && isLoading
      ? "Loading options…"
      : block.readFromJSON && error
        ? "Couldn't load options"
        : dropdownOptions.length === 0
          ? "No options available"
          : null;

  return (
    <div className="my-6">
      {block.label && (
        <label className="block heading-small-xs mb-[10px]">
          {block.label}
        </label>
      )}
      <GTPDropdown
        options={status ? [] : gtpOptions}
        value={selectedValue ?? undefined}
        placeholder={status ?? block.placeholder ?? "Select an option"}
        onChange={(value) => handleChange(value)}
        onClear={block.allowEmpty ? () => handleChange(null) : undefined}
        searchable={block.searchable ?? true}
        disabled={Boolean(status) || block.disabled}
      />
    </div>
  );
};

