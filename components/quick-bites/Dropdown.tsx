// File: components/ui/Dropdown.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = "Select an option...",
  onChange,
  searchable = true,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Get selected option
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  const scrollToHighlighted = (index: number) => {
    if (optionsListRef.current && index >= 0) {
      const optionElement = optionsListRef.current.children[index] as HTMLElement;
      if (optionElement) {
        const listRect = optionsListRef.current.getBoundingClientRect();
        const optionRect = optionElement.getBoundingClientRect();
        
        if (optionRect.bottom > listRect.bottom) {
          // Scroll down if option is below visible area
          optionsListRef.current.scrollTop += optionRect.bottom - listRect.bottom;
        } else if (optionRect.top < listRect.top) {
          // Scroll up if option is above visible area
          optionsListRef.current.scrollTop -= listRect.top - optionRect.top;
        }
      }
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(nextIndex);
          scrollToHighlighted(nextIndex);
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
          setHighlightedIndex(prevIndex);
          scrollToHighlighted(prevIndex);
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full px-[15px] py-[10px] 
          bg-[#344240] hover:bg-[#5A6462] 
          rounded-[15px] 
          text-left text-xs
          flex items-center justify-between
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-x-[8px] flex-1 min-w-0">
          {/* {selectedOption?.icon && (
            <Icon 
              icon={selectedOption.icon} 
              className="w-[16px] h-[16px] flex-shrink-0"
              style={{ color: selectedOption.color }}
            />
          )} */}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <Icon
          icon={isOpen ? 'feather:chevron-up' : 'feather:chevron-down'}
          className="w-[16px] h-[16px] flex-shrink-0 ml-2"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <div className="bg-[#2A3433] border border-[#FFFFFF] rounded-[15px] shadow-lg max-h-[250px] overflow-hidden">
            {/* Search Input */}
            {searchable && (
              <div className="p-[10px] border-b border-[#5A6462]">
                <div className="relative">
                  <Icon
                    icon="feather:search"
                    className="absolute left-[10px] top-1/2 transform -translate-y-1/2 w-[14px] h-[14px] text-[#CDD8D3] opacity-60"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    placeholder="Search options..."
                    className="w-full pl-[32px] pr-[10px] py-[6px] bg-[#344240] rounded-[8px] text-xs placeholder-[#CDD8D3] placeholder-opacity-60 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Options List with Scrolling */}
            <div 
              ref={optionsListRef}
              className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-[#2A3433] scrollbar-thumb-[#5A6462] hover:scrollbar-thumb-[#6B7473]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#5A6462 #2A3433'
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-[15px] py-[10px] text-xs text-[#CDD8D3] opacity-60">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      w-full px-[15px] py-[8px] text-left text-xs
                      flex items-center gap-x-[8px]
                      transition-colors duration-150
                      ${index === highlightedIndex 
                        ? 'bg-[#5A6462]' 
                        : 'hover:bg-[#344240]'
                      }
                      ${option.value === value 
                        ? 'bg-[#151A19] bg-opacity-20' 
                        : ''
                      }
                    `}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {/* {option.icon && (
                      <Icon 
                        icon={option.icon} 
                        className="w-[16px] h-[16px] flex-shrink-0"
                        style={{ color: option.color }}
                      />
                    )} */}
                    <span className="truncate flex-1">{option.label}</span>
                    {option.value === value && (
                      <Icon
                        icon="feather:check"
                        className="w-[14px] h-[14px] flex-shrink-0"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;