import React from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface SearchInputProps {
  query: string;
  setQuery: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: (value: string) => void;
  badge?: React.ReactNode;
  className?: string;
  iconsCount?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  query,
  setQuery,
  placeholder = "Search...",
  onFocus,
  onBlur,
  onEnter,
  badge,
  iconsCount,
  className = '',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearQuery = () => {
    setQuery("");
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter(query);
      e.preventDefault();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative transition-all duration-300">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-[#1F2726] rounded-[22px] min-h-[44px]" />

        {/* Search bar content */}
        <div className="relative flex px-[10px] gap-x-[10px] items-center min-h-[44px] rounded-[22px] z-[2]">
          {/* Search icon */}
          <GTPIcon
            icon={"gtp-search" as GTPIconName}
            size="md"
          />

          {/* Search input */}
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 pl-[11px] leading-[44px]"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyUp={handleKeyUp}
          />

          {query.length > 0 && (
            <div className="flex items-center gap-x-[10px]">
              {/* Count badge */}
              {iconsCount !== undefined && (
                <div className="flex items-center justify-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full">
                  <div className="text-xxxs h-[11px]">
                    {iconsCount} {iconsCount === 1 ? 'result' : 'results'}
                  </div>
                </div>
              )}
              
              {/* Custom badge if provided */}
              {badge}

              {/* Clear button */}
              <button
                className="flex items-center justify-center w-[24px] h-[24px] focus:outline-none"
                onClick={clearQuery}
              >
                <GTPIcon icon={"heroicons-solid:x-circle" as GTPIconName} size="sm" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};