// File: components/ui/Dropdown.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export interface DropdownOption {
  value: string;
  label: string;
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

  const handleSelect = (selectedValue: string) => {
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
      
      <div className={`relative w-full ${className}`} ref={dropdownRef}>
        {/* Dropdown Menu - Positioned Behind Main Container */}
        <div
          className={`
            ${isOpen ? "max-h-[400px]" : "max-h-0"} 
            transition-[max-height] duration-300 overflow-hidden
            absolute left-0 right-0 top-[22px] z-[16]
            bg-[#151A19] rounded-b-[22px] shadow-[0px_0px_50px_0px_#000000]
          `}
        >
          {/* Options List */}
          <div 
            ref={optionsListRef}
            className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#344240] hover:scrollbar-thumb-[#5A6462] pt-[25px] px-[10px] pb-[10px]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#344240 transparent'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-[15px] py-[15px] text-xs text-[#CDD8D3] opacity-60 text-center">
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
                      rounded-[15px]
                      transition-all duration-150
                      cursor-pointer
                      ${index === highlightedIndex 
                        ? 'bg-[#5A6462]' 
                        : 'hover:bg-[#344240]'
                      }
                      ${option.value === value 
                        ? 'bg-[#344240]' 
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
                        style={{ color: option.color || '#CDD8D3' }}
                      />
                    )} */}
                    <span className="truncate flex-1 text-[#CDD8D3]">{option.label}</span>
                    {option.value === value && (
                      <Icon
                        icon="feather:check"
                        className="w-[16px] h-[16px] flex-shrink-0 text-[#CDD8D3]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Container - Always on Top */}
        <div
          onClick={handleContainerClick}
          className={`
            relative w-full min-h-[44px] 
            bg-[#1F2726] hover:bg-[#344240] 
            rounded-[22px] 
            transition-all duration-300
            cursor-pointer z-[18]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center w-full min-h-[44px] px-[15px] gap-x-[10px]">

            {/* Input/Display Area */}
            <div className="flex-1 min-w-0">
              {searchable ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={getDisplayContent()}
                  onChange={handleInputChange}
                  placeholder={getPlaceholderText()}
                  className="w-full bg-transparent text-[#CDD8D3] placeholder-[#CDD8D3] placeholder-opacity-60 border-none outline-none text-xs"
                  disabled={disabled}
                />
              ) : (
                <span className="text-[#CDD8D3] text-xs truncate">
                  {selectedOption?.label || placeholder}
                </span>
              )}
            </div>

            {/* Right Icon */}
            <div className="flex items-center justify-center w-[24px] h-[24px]">
              <Icon
                icon={isOpen ? 'feather:chevron-up' : 'feather:chevron-down'}
                className="w-[16px] h-[16px] text-[#CDD8D3]"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dropdown;