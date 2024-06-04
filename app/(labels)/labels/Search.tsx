"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/layout/Icon';
import useSWR from 'swr';
import { MasterURL } from '@/lib/urls';
import { MasterResponse } from '@/types/api/MasterResponse';
import { AllChainsByKeys, Get_SupportedChainKeys } from '@/lib/chains';
import { useSessionStorage } from 'usehooks-ts';

export default function Search() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const { data: master } = useSWR<MasterResponse>(MasterURL);

  const [labelsChainsFilter, setLabelsChainsFilter] = useSessionStorage<string[]>('labelsChainsFilter', []);

  const Filters = useMemo(() => {
    if (!master) return [];
    return labelsChainsFilter.map(chainKey => (
      <div key={chainKey} className="flex items-center bg-[#344240] text-[10px] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer" onClick={() => setLabelsChainsFilter(labelsChainsFilter.filter(f => f !== chainKey))}>
        <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`} className='text-[#CDD8D3] w-[15px] h-[15px]'
          style={{
            color: AllChainsByKeys[chainKey].colors["dark"][0] + 99,
          }}
        /></div>
        <div className="text-[#CDD8D3] leading-[150%] pr-0.5">{master.chains[chainKey].name_short}</div>
        <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:x-circle" className='text-[#FE5468] w-[15px] h-[15px]' /></div>
      </div>
    ));

  }, [labelsChainsFilter, master, setLabelsChainsFilter]);


  return (
    <div className="relative w-full">
      <div className='fixed inset-0 bg-black/10 z-0' onClick={() => setIsOpen(false)} style={{ opacity: isOpen ? 0.5 : 0, pointerEvents: isOpen ? 'auto' : 'none' }} />
      <div className="absolute left-0 right-0 -bottom-[22px] min-h-[44px] z-10 flex items-center bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px]" onClick={() => setIsOpen(true)}>
        <div className={`relative flex justify-center ${isOpen ? "w-[24px] h-[24px]" : "w-[24px] h-[24px]"}`}>
          <div className={`absolute top-0 left-[10px] ${isOpen ? "opacity-0" : "opacity-100 delay-0"} transition-all duration-300`}><SearchIcon /></div>
          <div className={`absolute top-[4px] left-[16px] ${isOpen ? "opacity-100 delay-0" : "opacity-0"} transition-all duration-300`}><Icon icon="feather:chevron-down" className="w-[16px] h-[16px]" /></div>
        </div>
        {Filters.length > 0 && (
          <div className="flex gap-x-[10px] items-center pl-[15px] flex-wrap py-[10px] gap-y-[5px]">
            {Filters}
          </div>
        )}
        <input ref={inputRef} className="px-[11px] h-full flex flex-1 bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none" placeholder="Search" />
      </div>
      <div className={`absolute rounded-b-[22px] bg-[#151A19] left-0 right-0 top-0 shadow-[0px_0px_50px_0px_#000000] transition-all duration-300 ${isOpen ? "max-h-[240px]" : "max-h-0"} overflow-hidden`}>
        <div className='flex flex-col pl-[12px] pr-[25px] pb-[15px] pt-[29px] gap-y-[10px] text-[10px]'>
          <div className="flex gap-x-[10px] items-center">
            <div className="w-[15px] h-[15px]"><Icon icon="heroicons-solid:qrcode" className='w-[15px] h-[15px]' /></div>
            <div className="text-white leading-[150%]">Address</div>
            <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
            <div className="flex items-center bg-[#344240] rounded-full pl-[2px] pr-[5px] gap-x-[5px]">
              <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon="feather:search" className='text-[#CDD8D3] w-[15px] h-[15px]' /></div>
              <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:plus-circle" className='text-[#5A6462] w-[15px] h-[15px]' /></div>
            </div>
          </div>
          <div className="flex gap-x-[10px] items-start">
            <div className="w-[15px] h-[15px]"><Icon icon="gtp:gtp-chain-alt" className='w-[15px] h-[15px] text-white' /></div>
            <div className="text-white leading-[150%]">Chain</div>
            <div className="w-[6px] h-[6px] mt-1.5 bg-[#344240] rounded-full" />
            {master && (
              <div className='flex flex-1 flex-wrap gap-x-[10px] gap-y-[5px] transition-all'>
                {Object.keys(master.chains).filter(chain => !labelsChainsFilter.includes(chain) && chain !== "ethereum").sort(
                  (a, b) => master.chains[a].name.localeCompare(master.chains[b].name)
                ).map(chainKey => (
                  <div key={chainKey} className="flex items-center bg-[#344240] text-[10px] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer" onClick={() => setLabelsChainsFilter([...labelsChainsFilter, chainKey])}>
                    <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`} className='text-[#CDD8D3] w-[15px] h-[15px]'
                      style={{
                        color: AllChainsByKeys[chainKey].colors["dark"][0] + 99,
                      }}
                    /></div>
                    <div className="text-[#CDD8D3] leading-[150%] pr-0.5">{master.chains[chainKey].name_short}</div>
                    <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:plus-circle" className='text-[#5A6462] w-[15px] h-[15px]' /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-x-[10px] items-center">
            <div className="w-[15px] h-[15px]"><Icon icon="feather:tag" className='w-[15px] h-[15px]' /></div>
            <div className="text-white leading-[150%]">Usage Category</div>
            <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
            <div className="flex items-center bg-[#344240] rounded-full pl-[2px] pr-[5px] gap-x-[5px]">
              <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon="feather:search" className='text-[#CDD8D3] w-[15px] h-[15px]' /></div>
              <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:plus-circle" className='text-[#5A6462] w-[15px] h-[15px]' /></div>
            </div>
          </div>
          <div className="flex gap-x-[10px] items-center">
            <div className="w-[15px] h-[15px]"><Icon icon="feather:tag" className='w-[15px] h-[15px]' /></div>
            <div className="text-white leading-[150%]">Owner Project</div>
            <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
            <div className="flex items-center bg-[#344240] rounded-full pl-[2px] pr-[5px] gap-x-[5px]">
              <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon="feather:search" className='text-[#CDD8D3] w-[15px] h-[15px]' /></div>
              <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:plus-circle" className='text-[#5A6462] w-[15px] h-[15px]' /></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_6590_27443)">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M17.6 8.8C17.6 13.6601 13.6601 17.6 8.8 17.6C3.93989 17.6 0 13.6601 0 8.8C0 3.93989 3.93989 0 8.8 0C13.6601 0 17.6 3.93989 17.6 8.8ZM8.8 15.2C12.3346 15.2 15.2 12.3346 15.2 8.8C15.2 5.26538 12.3346 2.4 8.8 2.4C5.26538 2.4 2.4 5.26538 2.4 8.8C2.4 12.3346 5.26538 15.2 8.8 15.2Z" fill="url(#paint0_linear_6590_27443)" />
      <circle cx="8.75" cy="8.75" r="5.75" fill="url(#paint1_linear_6590_27443)" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M23.1638 23.2927C22.7733 23.6833 22.1401 23.6833 21.7496 23.2927L13.707 15.2501C13.3164 14.8596 13.3164 14.2264 13.707 13.8359L13.8359 13.707C14.2264 13.3164 14.8596 13.3164 15.2501 13.707L23.2927 21.7496C23.6833 22.1401 23.6833 22.7733 23.2927 23.1638L23.1638 23.2927Z" fill="url(#paint2_linear_6590_27443)" />
    </g>
    <defs>
      <linearGradient id="paint0_linear_6590_27443" x1="8.8" y1="0" x2="20.6644" y2="16.6802" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FE5468" />
        <stop offset="1" stop-color="#FFDF27" />
      </linearGradient>
      <linearGradient id="paint1_linear_6590_27443" x1="8.75" y1="14.5" x2="8.75" y2="3" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10808C" />
        <stop offset="1" stop-color="#1DF7EF" />
      </linearGradient>
      <linearGradient id="paint2_linear_6590_27443" x1="18.4998" y1="13.4141" x2="25.3567" y2="23.054" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FE5468" />
        <stop offset="1" stop-color="#FFDF27" />
      </linearGradient>
      <clipPath id="clip0_6590_27443">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>)