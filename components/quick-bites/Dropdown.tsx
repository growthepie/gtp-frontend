// File: components/ui/Dropdown.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { useMaster } from '@/contexts/MasterContext';
import VerticalScrollContainer from '../VerticalScrollContainer';
import { GTPIconName } from '@/icons/gtp-icon-names';

export interface DropdownOption {
  value: string;
  label: string;
  logo?: string; // Optional image URL rendered as icon
  icon?: string; // Optional GTP icon name rendered as icon
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
  useChainIcons?: boolean; // Override chain icon auto-detection (default: auto-detect)
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  allowEmpty = false,
  placeholder = "Select an option...",
  onChange,
  searchable = true,
  className = '',
  disabled = false,
  useChainIcons,
}) => {
  const { AllChainsByKeys } = useMaster();
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
  const isChainDropdown = useMemo(() => {
    if (useChainIcons === false) return false;
    if (useChainIcons === true) return true;
    return options.length > 0 && options.every((option) => Boolean(AllChainsByKeys?.[option.value]));
  }, [options, AllChainsByKeys, useChainIcons]);

  const getChainDisplay = (option: DropdownOption) => {
    if (!isChainDropdown) return null;

    const chain = AllChainsByKeys?.[option.value];
    if (!chain) return null;

    return {
      icon: `gtp:${chain.urlKey}-logo-monochrome`,
      color: chain.colors.dark[0],
    };
  };
  const selectedChainDisplay = selectedOption ? getChainDisplay(selectedOption) : null;

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
    const selectValue = (selectedValue: string) => {
      onChange(selectedValue);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

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
            selectValue(filteredOptions[highlightedIndex].value);
          } else if (searchTerm && filteredOptions.length > 0) {
            // If no option is highlighted but there's a search term, select the first filtered option
            selectValue(filteredOptions[0].value);
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
  }, [isOpen, highlightedIndex, filteredOptions, searchTerm, onChange]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleContainerClick = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleSelect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const getPlaceholderText = () => {
    if (isOpen && searchable) {
      return `${placeholder ?? ""}...`;
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
            bg-color-ui-active rounded-b-[22px] ${isOpen ? "shadow-standard" : ""}
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
                  {filteredOptions.map((option, index) => {
                    const chainDisplay = getChainDisplay(option);

                    return (
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
                        {option.logo ? (
                          <img src={option.logo} alt="" className="size-[16px] rounded-full shrink-0 object-contain" />
                        ) : option.icon ? (
                          <GTPIcon
                            icon={option.icon as GTPIconName}
                            className="!size-[13px] shrink-0"
                            containerClassName="!size-[13px]"
                            size="sm"
                          />
                        ) : chainDisplay && (
                          <GTPIcon
                            icon={chainDisplay.icon as GTPIconName}
                            size="sm"
                            style={{ color: chainDisplay.color }}
                            className="shrink-0"
                          />
                        )}
                        <span className="truncate flex-1 text-color-text-primary">{option.label}</span>
                      </div>
                    );
                  })}
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
            bg-color-bg-medium dark:bg-color-bg-default hover:bg-color-bg-medium 
            rounded-[22px] 
            transition-all duration-300
            cursor-pointer z-[18]
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center w-full min-h-[44px] px-[15px] gap-x-[10px]">

            {/* Input/Display Area */}
            <div className="flex-1 min-w-0 flex items-center gap-[10px]">
              {searchable ? (
                isOpen || !selectedOption ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder={getPlaceholderText()}
                    className={`w-full bg-transparent text-color-text-primary border-none outline-none text-xs ${!isOpen ? 'cursor-pointer' : ''}`}
                    disabled={disabled}
                  />
                ) : (
                  <div className="flex items-center gap-[10px] min-w-0">
                    {selectedOption.logo ? (
                      <img src={selectedOption.logo} alt="" className="size-[16px] rounded-full shrink-0 object-contain" />
                    ) : selectedOption.icon ? (
                      <GTPIcon
                        icon={selectedOption.icon as GTPIconName}
                        className="!size-[13px] shrink-0"
                        containerClassName="!size-[13px]"
                        size="sm"
                      />
                    ) : selectedChainDisplay && (
                      <GTPIcon
                        icon={selectedChainDisplay.icon as GTPIconName}
                        size="sm"
                        style={{ color: selectedChainDisplay.color }}
                        className="shrink-0"
                      />
                    )}
                    <span className="text-color-text-primary text-xs truncate">
                      {selectedOption.label.split('|')[0]}
                    </span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-[10px] min-w-0">
                  {selectedOption?.logo ? (
                    <img src={selectedOption.logo} alt="" className="size-[16px] rounded-full shrink-0 object-contain" />
                  ) : selectedOption?.icon ? (
                    <GTPIcon
                      icon={selectedOption.icon as GTPIconName}
                      className="!size-[13px] shrink-0"
                      containerClassName="!size-[13px]"
                      size="sm"
                    />
                  ) : selectedChainDisplay && (
                    <GTPIcon
                      icon={selectedChainDisplay.icon as GTPIconName}
                      size="sm"
                      style={{ color: selectedChainDisplay.color }}
                      className="shrink-0"
                    />
                  )}
                  <span className="text-color-text-primary text-xs truncate">
                    {selectedOption?.label.split('|')[0] || placeholder}
                  </span>
                </div>
              )}
            </div>

            {allowEmpty && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center text-color-text-secondary hover:text-color-text-primary transition-colors"
                aria-label="Clear selection"
              >
                <GTPIcon
                  icon="in-button-close-monochrome"
                  className="!size-[12px]"
                  containerClassName='!size-[12px]'
                  size="sm"
                />
              </button>
            )}

            {/* Right Icon */}
              <GTPIcon
                icon="in-button-down-monochrome"
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
