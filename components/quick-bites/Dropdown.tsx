// File: components/ui/Dropdown.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import VerticalScrollContainer from '../VerticalScrollContainer';
import { Badge } from '../layout/FloatingBar/Badge';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  onChange: (value: string | null) => void;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  allowEmpty = false,
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
  const inputRef = useRef<HTMLInputElement>(null);
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
  const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);

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
          optionsListRef.current.scrollTop += optionRect.bottom - listRect.bottom;
        } else if (optionRect.top < listRect.top) {
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
          } else if (searchTerm && filteredOptions.length > 0) {
            // If no option is highlighted but there's a search term, select the first filtered option
            handleSelect(filteredOptions[0].value);
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
  }, [isOpen, highlightedIndex, filteredOptions, searchTerm]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  const handleSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleContainerClick = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Function to display content in the trigger
  const getDisplayContent = () => {
    if (isOpen && searchable) {
      return searchTerm;
    }
    return selectedOption?.label || '';
  };

  const getPlaceholderText = () => {
    if (isOpen && searchable) {
      return "Search options...";
    }
    return placeholder;
  };




  return (
    <>
      {/* Background overlay when dropdown is open */}
      {isOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-black/10 z-[15]"
          style={{
            opacity: isOpen ? 0.5 : 0,
            pointerEvents: isOpen ? "auto" : "none",
          }}
          onMouseDown={() => {
            setIsOpen(false);
            setSearchTerm('');
            setHighlightedIndex(-1);
          }}
        />
      )}

      <div className={`relative w-full ${className} ${isOpen ? "z-[18]" : "z-[16]"}`} ref={dropdownRef}>
        {/* Dropdown Menu - Positioned Behind Main Container */}
        <div
          className={`
            ${isOpen ? "max-h-[400px]" : "max-h-0"} 
            transition-[max-height] duration-300 overflow-hidden
            absolute left-0 right-0 top-[22px] z-[16]
            bg-color-ui-active rounded-b-[22px] ${isOpen ? "shadow-[0px_0px_50px_0px_#000000]" : ""}
          `}
        >
            <div className='h-[30px]' />
            {/* Options List */}
            <VerticalScrollContainer
              // ref={optionsListRef}
              height={Math.min(Math.max(filteredOptions.length * 38 + (filteredOptions.length - 1) * 5, 34), 300)}
              className=''
              scrollbarPosition='right'
             
            >
              {filteredOptions.length === 0 ? (
                <div className="px-[15px] py-[5px] text-xs text-color-text-primary opacity-60 text-center">
                  No options found
                </div>
              ) : (
                <div className="space-y-[5px]">
                  {filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full px-[15px] py-[10px] text-left text-xs
                        flex items-center gap-x-[10px]
                        cursor-pointer
                        ${option.value === value
                          ? 'bg-color-bg-medium hover:bg-color-ui-hover'
                          : 'hover:bg-color-bg-medium'
                        }
                      `}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      {selectedOption === option ? (
                        <GTPIcon icon="gtp-checkmark-single-select-monochrome" size="sm" />
                      ) : (
                        <GTPIcon icon="gtp-checkmark-unchecked-monochrome" size="sm" />
                      )}
                      <span className="truncate flex-1 text-color-text-primary">{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </VerticalScrollContainer>
            <div className='h-[10px]' />
        </div>

        {/* Main Container - Always on Top */}
        <div
          onClick={handleContainerClick}
          className={`
            relative w-full min-h-[44px] 
            bg-color-bg-default hover:bg-color-bg-medium 
            rounded-[22px] 
            transition-all duration-300
            cursor-pointer z-[18]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center w-full min-h-[44px] px-[15px] gap-x-[10px]">

            {/* Input/Display Area */}
            <div className="flex-1 min-w-0 flex items-center gap-[10px]">
              {selectedOption && (
                <div className="flex items-center gap-x-[10px]">
                  <Badge 
                    label={selectedOption.label.split('|')[0]}
                    leftIcon="feather:tag"
                    rightIcon="heroicons-solid:x-circle"
                    rightIconColor="#FE5468"
                    onClick={() => handleSelect(null)}
                   />
                </div>
              )}
              {searchable ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  placeholder={getPlaceholderText()}
                  className={`w-full bg-transparent text-color-text-primary placeholder-[#CDD8D3] placeholder-opacity-60 border-none outline-none text-xs ${!isOpen ? 'cursor-pointer' : ''}`}
                  disabled={disabled}
                />
              ) : (
                <span className="text-color-text-primary text-xs truncate">
                  {selectedOption?.label || placeholder}
                </span>
              )}
            </div>

            {/* Right Icon */}
              <GTPIcon  
                icon="gtp-chevrondown-monochrome"
                className={`!size-[12px] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                containerClassName='!size-[12px]'
                size="sm"
              />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dropdown;