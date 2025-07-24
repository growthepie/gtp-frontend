// File: components/quick-bites/blocks/DropdownBlock.tsx
'use client';

import React, { useState } from 'react';
import { DropdownBlock as DropdownBlockType } from '@/lib/types/blockTypes';
import Dropdown, { DropdownOption } from '@/components/quick-bites/Dropdown';

interface DropdownBlockProps {
  block: DropdownBlockType;
}

export const DropdownBlock: React.FC<DropdownBlockProps> = ({ block }) => {
  const [selectedValue, setSelectedValue] = useState<string>(block.defaultValue || '');

  const handleChange = (value: string) => {
    setSelectedValue(value);
    // You can add additional logic here to handle the selection
    // For example, trigger API calls, update parent state, etc.
    console.log('Dropdown selection changed:', value);
  };

  return (
    <div className="my-6">
      {block.label && (
        <label className="block text-sm font-medium mb-2">
          {block.label}
        </label>
      )}
      
      <div className="w-full">
        <Dropdown
          options={block.options}
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