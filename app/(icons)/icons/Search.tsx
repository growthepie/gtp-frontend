"use client";

import { useState } from "react";
import { SearchIcon, CloseIcon } from "./Icons";

export default function Search() {
  const [query, setQuery] = useState("");

  // Example count of icons
  const iconsCount = 89;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearQuery = () => {
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <div className="relative transition-all duration-300">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-[#1F2726] rounded-[22px] min-h-[44px]" />

        {/* Search bar content */}
        <div className="relative flex items-center min-h-[44px] rounded-[22px] z-[2]">
          {/* Search icon */}
          <div className="flex items-center justify-center w-[42px] h-[44px]">
            <SearchIcon />
          </div>

          {/* Search input */}
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-2"
            placeholder="Search..."
            value={query}
            onChange={handleInputChange}
          />

          {query.length > 0 && (
            <div className="flex items-center mr-2">
              {/* Badge with “xx icons” */}
              <div
                className="
                  flex items-center justify-center 
                  w-[66px] h-[24px] 
                  px-[15px] gap-[5px]
                  border border-[#CDD8D3]
                  bg-transparent
                  whitespace-nowrap
                  rounded-[22px]
                "
              >
                <span
                  className="
                    text-[9px] font-[500] 
                    leading-[13.5px] 
                    text-[#CDD8D3]
                    font-['Raleway']
                  "
                >
                  {iconsCount} icons
                </span>
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
