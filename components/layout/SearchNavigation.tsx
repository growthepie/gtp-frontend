"use client";

import React, { useState, useEffect } from 'react';
import { navigationItems } from '../../lib/navigation'; // metrics and trackers 
import { useMaster } from "@/contexts/MasterContext"; // chains (long/short name)
// import { getChainsByBucket } from './SidebarMenuGroup'; // chains bucket (stack)


export default function SearchNavigation({
  className = '',
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const [openSearch, setOpenSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { ChainsNavigationItems, ChainsNavigationItemsByKeys } = useMaster();

  const handleClick = () => {
    setOpenSearch((prev) => !prev);
    if (onClick) onClick();
  };

  // Filter navigationItems and ChainsNavigationItems based on searchTerm
  const filteredResults = () => {
    const regularResults: { parent: string; children: string[] }[] = [];
    const chainsResults: { parent: string; children: string[] }[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Filter regular navigationItems
    navigationItems.forEach((item) => {
      const parentLabel = item.label.toLowerCase();

      if (searchTerm.length >= 3 && parentLabel.includes(searchLower)) {
        regularResults.push({
          parent: item.label,
          children: item.options.map((opt) => opt.label),
        });
      } else if (searchTerm.length >= 2) {
        const matchingChildren = item.options
          .filter((opt) => opt.label.toLowerCase().includes(searchLower))
          .map((opt) => opt.label);

        if (matchingChildren.length > 0) {
          regularResults.push({
            parent: item.label,
            children: matchingChildren,
          });
        }
      }
    });

    // Filter ChainsNavigationItems
    if (ChainsNavigationItems?.options) {
      console.log("useMaster:", useMaster); // Log the full structure
      const uniqueLabels = new Set<string>();

      // Check for "chains" match with 3+ characters
      if (searchTerm.length >= 3 && searchLower.includes("chains")) {
        ChainsNavigationItems.options.forEach((item: { label: string }) => {
          uniqueLabels.add(item.label); // Add all labels
        });
      }
      // Regular search for label and key with 2+ characters
      else if (searchTerm.length >= 2) {
        ChainsNavigationItems.options.forEach((item: { label: string; key: string }) => {
          const labelLower = item.label.toLowerCase();
          const keyLower = item.key.trim().toLowerCase();

          if (labelLower.includes(searchLower) || keyLower.includes(searchLower)) {
            uniqueLabels.add(item.label);
          }
        });
      }

      if (uniqueLabels.size > 0) {
        chainsResults.push({
          parent: "Chains",
          children: Array.from(uniqueLabels),
        });
      }
    }

    return [...regularResults, ...chainsResults];
  };

  const searchResults = filteredResults();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Search
      </button>

      {openSearch && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setOpenSearch(false)}
          />
          <div className="fixed inset-x-0 top-16 mx-auto w-1/2 z-50 bg-[#1f2726] p-1 shadow-lg rounded-[32px]">
            <input
              type="text"
              placeholder="Search: Metrics | Chains | Applications"
              className="w-full px-3 py-2 rounded-[32px] focus:outline-none text-white bg-[#1f2726]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 max-h-60 overflow-y-auto bg-[#1f2726] rounded-b-[32px] shadow-lg text-white">
                {searchResults.map((result, index) => (
                  <li key={index}>
                    <div className="px-3 py-2">{result.parent}</div>
                    {result.children.map((child, childIndex) => (
                      <div
                        key={childIndex}
                        className={`py-2 hover:bg-gray-700 cursor-pointer ${
                          result.parent === "Chains" ? "pl-6" : "pl-6"
                        }`}
                        onClick={() => {
                          console.log(`Selected child: ${child} under ${result.parent}`);
                          setOpenSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        {child}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}