"use client";

import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { CloseIcon } from "./Icons";

// Receive everything via props: query, setQuery, iconsCount
interface SearchProps {
  query: string;
  setQuery: (value: string) => void;
  iconsCount: number;
}

export default function Search({ query, setQuery, iconsCount }: SearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearQuery = () => {
    setQuery("");
  };

  return (
    <div className="relative w-full">
      <div className="relative transition-all duration-300">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-[#1F2726] rounded-[22px] min-h-[44px]" />

        {/* Search bar content */}
        <div className="relative flex gap-x-[10px] items-center min-h-[44px] rounded-[22px] z-[2]">
          {/* Search icon */}
          <div className="flex items-center justify-center w-[42px] h-[44px]">
            <GTPIcon
              icon={"gtp-search" as GTPIconName}
              size="sm"
              className="w-[20px] h-[20px] text-gray-400"
            />
          </div>

          {/* Search input */}
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-2 leading-[44px]"
            placeholder="Search..."
            value={query}
            onChange={handleInputChange}
          />

          {query.length > 0 && (
            <div className="flex items-center">
              {/* Badge with “xx icons” */}
              <div className="flex items-center justify-center px-[15px] h-[24px] border border-[#CDD8D3] bg-transparent whitespace-nowrap rounded-[22px]">
                <div className="text-xxxs h-[11px]">
                  {iconsCount} icons
                </div>
              </div>

              {/* Close button */}
              <button
                className="flex items-center justify-center w-[42px] h-[44px] focus:outline-none"
                onClick={clearQuery}
              >
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
