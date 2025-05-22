"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FloatingBarContainer } from './FloatingBar/FloatingBarContainer';
import { SearchInput } from './FloatingBar/SearchInput';
import { Badge } from './FloatingBar/Badge';
import { FloatingBarButton } from './FloatingBar/FloatingBarButton';
import { FilterSelectionContainer } from './FloatingBar/FilterSelectionContainer';
import { Popover } from './FloatingBar/Popover';
import { ToggleOption } from './FloatingBar/ToggleOption';
import { NumericInput } from './FloatingBar/NumericInput';
import { GTPIcon } from './GTPIcon';
import { useUIContext } from '@/contexts/UIContext';
import Icon from './Icon';
import { useLocalStorage } from 'usehooks-ts';
export default function GlobalFloatingBar() {
  const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", false);
  const { isSidebarOpen, toggleSidebar } = useUIContext();
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<number>(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('SVG');
  const [selectedSize, setSelectedSize] = useState(24);
  
  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    console.log('Search submitted:', query);
    // Implement global search functionality here
  };
  
  // Handle filter selection
  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };
  
  // Handle filter removal
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
  };
  
  // Create filter badges
  const filterBadges = activeFilters.map(filter => (
    <Badge
      key={filter}
      label={filter}
      leftIcon="feather:tag"
      rightIcon="heroicons-solid:x-circle"
      rightIconColor="#FE5468"
      onClick={() => removeFilter(filter)}
    />
  ));
  
  // Handle download
  const handleDownload = () => {
    console.log('Download triggered');
    // Implement download functionality
  };

  if (!showGlobalSearchBar) return null;

  return (
    <div className={`fixed top-[30px] left-0 right-0 z-50 flex justify-center w-full pointer-events-none`}>
      <div className="w-full max-w-[1680px] px-[40px] md:px-[20px]">
    <FloatingBarContainer className='px-[15px] py-[10px]'>
      {/* Home Button */}
      <div className="flex items-center justify-between w-[230px]">
      <Link href="/" passHref>
        <GTPLogoNew />
      </Link>
      <div className="flex items-center justify-end h-full cursor-pointer " onClick={() => {
              // track("clicked Sidebar Close", {
              //   location: "desktop sidebar",
              //   page: window.location.pathname,
              // });
              toggleSidebar();
            }}>
              <Icon
                icon={isSidebarOpen ? "feather:log-out" : "feather:log-in"}
                className={`w-[13.15px] h-[13.15px] transition-transform ${isSidebarOpen ? "rotate-180" : ""
                  }`}

              />
            </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 min-w-0">
        <SearchInput
          query={searchQuery}
          setQuery={setSearchQuery}
          placeholder="Search..."
          onEnter={handleSearchSubmit}
          iconsCount={searchQuery ? results : undefined}
        />
      </div>

      {/* Active Filters Section */}
      {activeFilters.length > 0 && (
        <div className="hidden md:block max-w-[300px] lg:max-w-[400px]">
          <FilterSelectionContainer>
            {filterBadges}
            {activeFilters.length > 0 && (
              <div onClick={clearAllFilters} className="cursor-pointer">
                <Badge
                  rightIcon="heroicons-solid:x"
                  rightIconColor="#FE5468"
                  label="Clear All"
                />
              </div>
            )}
          </FilterSelectionContainer>
        </div>
      )}

      {/* Settings/Format Popover */}
      <Popover
        trigger={
          <FloatingBarButton
            icon="gtp-settings"
            label={window.innerWidth >= 1024 ? "Settings" : undefined}
            title="Settings"
          />
        }
        content={
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[#CDD8D3] mb-2">Format</h3>
              <div className="flex gap-2">
                <ToggleOption
                  option="SVG"
                  selectedOption={selectedFormat}
                  setSelectedOption={setSelectedFormat}
                  icon="gtp-svg"
                />
                <ToggleOption
                  option="PNG"
                  selectedOption={selectedFormat}
                  setSelectedOption={setSelectedFormat}
                  icon="gtp-png"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#CDD8D3] mb-2">Size</h3>
              <NumericInput
                value={selectedSize}
                setValue={setSelectedSize}
                min={8}
                max={128}
                unit="px"
              />
            </div>
          </div>
        }
        position="bottom"
        width="240px"
      />

      {/* Filters Popover */}
      <Popover
        trigger={
          <FloatingBarButton
            icon="gtp:gtp-notification"
            title="Filters"
          />
        }
        content={
          <div className="p-4 gap-y-3 min-w-[200px] ml-auto mr-0">
            <h3 className="text-sm font-medium text-[#CDD8D3]">Filter Categories</h3>
            {['Web3', 'DeFi', 'Social', 'NFT', 'Cross-Chain'].map(category => (
              <div
                key={category}
                className="flex items-center px-3 py-2 rounded-md hover:bg-[#1F2726] cursor-pointer"
                onClick={() => addFilter(category)}
              >
                <span className="text-sm text-[#CDD8D3]">{category}</span>
              </div>
            ))}
          </div>
        }
        position="bottom"
      />
    </FloatingBarContainer>
    </div>
    </div>
  );
}

const GTPLogoNew = () => {
  return (
    <svg width="194" height="46" viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.1032 15.2443C13.026 14.1679 13.3192 13.1795 13.9481 12.2211C14.3693 11.5839 14.9665 10.896 15.6254 10.1381C17.3254 8.18037 19.431 5.75704 19.9466 2.5459C21.0675 5.00735 20.5238 7.40073 19.2831 9.60169C18.7249 10.591 18.1068 11.3017 17.5169 11.9796C16.8226 12.7774 16.1682 13.5298 15.698 14.6362C15.4394 15.238 15.2923 15.8143 15.2233 16.3779L13.1032 15.2443Z" fill="url(#paint0_radial_22425_42194)"/>
<path d="M16.741 17.1918C16.9996 16.2424 17.4471 15.3548 18.0416 14.4934C18.5335 13.7746 18.9946 13.2418 19.4084 12.7635C20.8007 11.1525 21.6648 10.1523 21.4116 4.75293C21.574 5.09964 21.7347 5.43364 21.8908 5.75584L21.8917 5.75766C23.2495 8.57671 24.2025 10.5535 22.6014 13.2682C21.81 14.6096 21.2327 15.2767 20.7227 15.8667C20.1482 16.5301 19.658 17.0974 19.0418 18.4171L16.741 17.1918Z" fill="url(#paint1_radial_22425_42194)"/>
<path d="M22.7032 16.341C22.0787 17.0807 21.0595 18.1009 21.0132 18.168L26.7811 14.9433C26.6604 13.8687 25.868 12.6025 24.8941 10.8027C25.0911 13.1752 24.1653 14.6084 22.7032 16.341Z" fill="url(#paint2_radial_22425_42194)"/>
<path d="M26.7384 16.0156C26.5832 16.7036 25.7336 18.1349 25.1092 18.8782C23.136 21.2253 22.1086 22.2264 20.4205 25.758C20.3252 25.3759 20.2253 25.0155 20.13 24.6715C19.659 22.9725 19.3694 21.5575 19.934 20.3377L26.7384 16.0156Z" fill="url(#paint3_radial_22425_42194)"/>
<path d="M19.1191 23.9723C18.6363 22.5591 18.2896 21.3774 18.5419 19.8826L16.5252 18.5684C16.4135 20.7675 17.3529 23.3352 19.9469 26.6407C19.8089 25.822 19.395 24.7801 19.1191 23.9723Z" fill="url(#paint4_radial_22425_42194)"/>
<path d="M15.1809 17.6928C15.2154 18.408 15.6574 20.2986 16.0532 21.2988C14.9241 19.8584 13.6897 17.6484 13.3367 16.4902L15.1809 17.6928Z" fill="url(#paint5_radial_22425_42194)"/>
<path d="M38.9341 28.4409C38.9341 25.1689 32.8494 22.417 24.6264 21.6465C23.8423 22.5269 23.0581 23.6196 22.3084 25.2307L21.1793 27.3753C20.9642 27.7711 20.5676 28.0306 20.1274 28.0651C19.6799 28.0996 19.2488 27.9036 18.982 27.5451L18.2577 26.5721C16.7493 24.6462 15.6456 23.1205 14.7752 21.6928C6.79455 22.5232 0.934082 25.2316 0.934082 28.4409C0.934082 32.31 9.44932 35.4513 19.9386 35.4513C20.4451 35.4513 20.9479 35.444 21.4453 35.4295L22.9846 31.0721L22.9973 31.0412C23.3367 30.1926 24.1536 29.6371 25.0621 29.6244H25.0685L38.6582 29.6607C38.7979 29.3185 38.9341 28.7976 38.9341 28.4409Z" fill="url(#paint6_radial_22425_42194)"/>
<path d="M25.6228 35.5455H36.27L35.8044 36.7263H25.2135L22.8555 43.4527V36.3097L24.5046 31.6437C24.5981 31.4077 24.8268 31.2507 25.0837 31.2471L37.9899 31.2507L37.5125 32.4143H26.7382L26.4079 33.3963H37.144L36.634 34.5635H25.9958L25.6228 35.5455Z" fill="url(#paint7_radial_22425_42194)"/>
<path d="M1.58765 31.5332C2.81383 35.0003 5.81441 39.0728 6.45246 39.6682C8.65615 41.7439 15.7564 43.4529 21.3482 43.4529V37.6088C11.6549 37.6088 4.08722 34.4693 1.58765 31.5332Z" fill="url(#paint8_radial_22425_42194)"/>
<path d="M160.866 27.2218C160.866 23.5419 158.303 20.875 154.621 20.875C150.892 20.875 148.276 23.588 148.276 27.3404C148.276 31.3976 150.933 33.6625 155.64 33.6625C157.18 33.6677 158.699 33.2953 160.067 32.577L159.461 30.1704C158.227 30.7848 156.858 31.1587 155.662 31.1587C153.222 31.1587 151.748 30.0962 151.585 28.281H160.789C160.818 28.024 160.866 27.599 160.866 27.2218ZM151.522 26.2779C151.684 24.6027 152.872 23.4002 154.597 23.4002C156.321 23.4002 157.511 24.6027 157.673 26.2779H151.522Z" fill="#CDD8D3"/>
<path d="M146.883 16.4639H143.761V19.6019H146.883V16.4639Z" fill="#CDD8D3"/>
<path d="M146.883 21.0879H143.761V33.4504H146.883V21.0879Z" fill="#CDD8D3"/>
<path d="M136.654 20.875C134.813 20.875 133.368 21.7727 132.436 23.2108V21.0875H129.71V38.0046H132.833V31.7451C133.646 32.9822 135.101 33.6889 136.794 33.6889C139.894 33.6889 142.364 30.9742 142.364 27.2465C142.364 23.5188 139.964 20.875 136.654 20.875ZM136.004 30.9973C134.162 30.9973 132.811 29.4637 132.811 27.3635C132.811 25.1694 134.162 23.5649 136.004 23.5649C137.845 23.5649 139.173 25.1694 139.173 27.3635C139.171 29.4637 137.842 30.9973 136.002 30.9973H136.004Z" fill="#CDD8D3"/>
<path d="M122.67 20.875C118.943 20.875 116.333 23.588 116.333 27.3404C116.333 31.3976 118.988 33.6625 123.697 33.6625C125.237 33.6675 126.756 33.2951 128.124 32.577L127.512 30.1704C126.277 30.7848 124.909 31.1587 123.715 31.1587C121.274 31.1587 119.8 30.0962 119.636 28.281H128.846C128.869 28.0207 128.916 27.5957 128.916 27.2185C128.916 23.5468 126.352 20.875 122.67 20.875ZM119.571 26.2779C119.733 24.6027 120.923 23.4002 122.647 23.4002C124.372 23.4002 125.56 24.6027 125.722 26.2779H119.571Z" fill="#CDD8D3"/>
<path d="M111.88 20.8752C110.996 20.8618 110.124 21.0869 109.354 21.5276C108.585 21.9682 108.107 22.6083 107.663 23.3823V16.4639H104.539V33.4502H107.663V27.8298C107.663 25.3985 108.782 23.6524 110.554 23.6524C111.834 23.6524 112.604 24.5963 112.604 26.5071V33.4436H115.726V25.7362C115.725 23.0528 114.862 20.8752 111.88 20.8752Z" fill="#CDD8D3"/>
<path d="M101.928 30.7615C101.277 30.7615 100.763 30.4073 100.763 29.5574V23.5169H103.326V21.0873H100.763V17.7812H97.6409V21.0873H93.2138L90.9913 30.8471L89.1366 22.3935H86.5334L84.6786 30.8587L82.4334 21.0955H79.2559L82.4708 33.458H86.1527L87.8122 26.3749L89.5092 33.458H93.0511L95.6543 23.5252H97.6425V30.1471C97.6425 32.5767 98.853 33.6623 101.045 33.6623C102.171 33.668 103.279 33.3756 104.259 32.8139L103.628 30.3118C103.256 30.4782 102.58 30.7615 101.928 30.7615Z" fill="#CDD8D3"/>
<path d="M73.4292 20.875C69.7002 20.875 67.0205 23.5649 67.0205 27.2992C67.0205 31.0335 69.7002 33.6938 73.4292 33.6938C77.1339 33.6938 79.8135 31.0039 79.8135 27.2992C79.8135 23.5946 77.1339 20.875 73.4292 20.875ZM73.4292 30.9973C71.5875 30.9973 70.2354 29.439 70.2354 27.2926C70.2354 25.1463 71.5875 23.5649 73.4292 23.5649C75.271 23.5649 76.6214 25.1216 76.6214 27.2696C76.6214 29.4176 75.2693 30.9973 73.4292 30.9973Z" fill="#CDD8D3"/>
<path d="M62.9647 23.7297V21.0942H60.0996V33.4567H63.2218V25.9716C63.8726 24.5797 65.4817 23.8302 66.9037 23.8302V20.9459L66.741 20.9229C65.249 20.9229 63.827 22.0314 62.9647 23.7297Z" fill="#CDD8D3"/>
<path d="M55.9507 23.2586C55.0184 21.8189 53.5736 20.875 51.6945 20.875C48.377 20.875 46 23.5649 46 27.2696C46 30.6662 48.3998 33.2853 51.7319 33.2853C52.4702 33.2944 53.2004 33.1284 53.8641 32.8006C54.5277 32.4728 55.1063 31.9923 55.5537 31.3976V32.6248C55.5537 34.9605 54.2261 36.2108 51.8962 36.2108C50.1944 36.2108 48.9367 35.8566 47.4448 35.1022L46.5353 37.438C48.2034 38.2778 50.0414 38.7137 51.9043 38.7113C56.2387 38.7113 58.6856 36.5172 58.6856 32.6248V21.0941H55.9507V23.2586ZM52.3843 30.7617C50.5442 30.7617 49.1922 29.2281 49.1922 27.3635C49.1922 25.1694 50.5442 23.5649 52.3843 23.5649C54.2244 23.5649 55.5537 25.1694 55.5537 27.3635C55.5537 29.2281 54.2261 30.7617 52.3843 30.7617Z" fill="#CDD8D3"/>
<defs>
<radialGradient id="paint0_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.1535 6.84238) rotate(117.912) scale(11.808 9.11336)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint1_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.1799 8.99725) rotate(115.692) scale(11.4385 8.3377)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint2_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.6971 13.0905) rotate(127.548) scale(7.00774 6.31751)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint3_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.4013 19.0418) rotate(125.634) scale(9.04236 7.98874)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint4_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.3022 21.0758) rotate(112.642) scale(6.59793 4.37388)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint5_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15.5427 17.9839) rotate(119.008) scale(4.14768 3.28196)">
<stop stop-color="#1DF7EF"/>
<stop offset="1" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint6_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31.793 25.9345) rotate(159.689) scale(30.0014 18.2218)">
<stop stop-color="#FFDF27"/>
<stop offset="0.9999" stop-color="#FE5468"/>
</radialGradient>
<radialGradient id="paint7_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35.1458 35.0383) rotate(140.592) scale(14.5034 13.2732)">
<stop stop-color="#1DF7EF"/>
<stop offset="0.9999" stop-color="#10808C"/>
</radialGradient>
<radialGradient id="paint8_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.6347 35.2357) rotate(148.427) scale(17.1733 14.2932)">
<stop stop-color="#1DF7EF"/>
<stop offset="0.9999" stop-color="#10808C"/>
</radialGradient>
</defs>
</svg>

  );
};
