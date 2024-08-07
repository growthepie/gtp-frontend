"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/layout/Icon";
import useSWR from "swr";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChainsByKeys, Get_SupportedChainKeys } from "@/lib/chains";
import { useSessionStorage } from "usehooks-ts";
import useDragScroll from "@/hooks/useDragScroll";
import { update } from "lodash";
import { useUIContext } from "@/contexts/UIContext";

export default function Search() {
  const { isMobile } = useUIContext();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const { data: master } = useSWR<MasterResponse>(MasterURL);

  const [showDeployerAddress, setShowDeployerAddress] = useSessionStorage(
    "labels::showDeployerAddress",
    false
  );

  // const [labelsCategoriesFilter, setLabelsCategoriesFilter] = useSessionStorage<string[]>('labelsCategoriesFilter', []);
  // const [labelsSubcategoriesFilter, setLabelsSubcategoriesFilter] = useSessionStorage<string[]>('labelsSubcategoriesFilter', []);
  // const [labelsChainsFilter, setLabelsChainsFilter] = useSessionStorage<string[]>('labelsChainsFilter', []);
  const [labelsNumberFiltered, setLabelsNumberFiltered] =
    useSessionStorage<number>("labelsNumberFiltered", 0);

  const [labelsFilters, setLabelsFilters] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
    deployer_address: string[];
    txcount: number[];
    txcount_change: number[];
    gas_fees_usd: number[];
    gas_fees_usd_change: number[];
    daa: number[];
    daa_change: number[];
  }>("labelsFiltersObj", {
    address: [],
    origin_key: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
    deployer_address: [],
    txcount: [],
    txcount_change: [],
    gas_fees_usd: [],
    gas_fees_usd_change: [],
    daa: [],
    daa_change: [],
  });

  useEffect(() => {
    if (!labelsFilters.deployer_address) {
      setLabelsFilters({
        ...labelsFilters,
        deployer_address: [],
      });
    }
  }, [labelsFilters, setLabelsFilters]);

  const handleFilter = useCallback(
    (
      key: string,
      value:
        | string
        | number
        | { owner_project: string; owner_project_clear: string },
    ) => {
      if (key === "owner_project" && typeof value !== "string" && typeof value !== "number" && typeof key === "string") {
        setLabelsFilters({
          ...labelsFilters,
          owner_project: labelsFilters[key].find(
            (f) => f.owner_project === value['owner_project'],
          )
            ? labelsFilters[key].filter(
              (f) => f.owner_project !== value['owner_project'],
            )
            : [...labelsFilters[key], value],
        });
      } else {
        setLabelsFilters({
          ...labelsFilters,
          [key]: labelsFilters[key].includes(value)
            ? labelsFilters[key].filter((f) => f !== value)
            : [...labelsFilters[key], value],
        });
      }

      setSearch("");
    },
    [labelsFilters, setLabelsFilters],
  );

  useEffect(() => {
    // empty the deployer address filter if it is not shown
    if (!showDeployerAddress) {
      setLabelsFilters((prev) => ({
        ...prev,
        deployer_address: [],
      }));
    }
  }, [showDeployerAddress, setLabelsFilters]);

  const [search, setSearch] = useState<string>("");

  const [labelsAutocomplete, setLabelsAutocomplete] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    deployer_address: string[];
    owner_project: { owner_project: string; owner_project_clear: string }[];
    category: string[];
    subcategory: string[];
  }>("labelsAutocomplete", {
    address: [],
    origin_key: [],
    name: [],
    deployer_address: [],
    owner_project: [],
    category: [],
    subcategory: [],
  });

  // bold the search terms in the badges
  const boldSearch = (text: string) => {
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);
    if (index === -1) return text;
    return (
      <>
        {text.substring(0, index)}
        <span className="font-bold underline">
          {text.substring(index, index + search.length)}
        </span>
        {text.substring(index + search.length)}
      </>
    );
  };

  const [labelsOwnerProjects, setLabelsOwnerProjects] = useSessionStorage<
    { owner_project: string; owner_project_clear: string }[]
  >("labelsOwnerProjects", []);

  const [labelsDeployerAddresses, setLabelsDeployerAddresses] = useSessionStorage<string[]>("labelsDeployerAddresses", []);

  const [labelsOwnerProjectClears, setLabelsOwnerProjectClears] =
    useSessionStorage<string[]>("labelsOwnerProjectClears", []);

  const Filters = useMemo(() => {
    if (!master) return [];

    // const categorySubcategoryFilters = labelsFilters.category.length > 0 ? labelsFilters.category.reduce((acc, category) => {
    //   return [...acc, ...master.blockspace_categories.mapping[category]];
    // }, []) : [];

    // const allSubcategoryFilters = [...labelsFilters.subcategory, ...categorySubcategoryFilters];

    const addressFilters = labelsFilters.address.map((address) => (
      <Badge
        key={address}
        onClick={() => handleFilter("address", address)}
        label={address}
        leftIcon="heroicons-solid:qrcode"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));

    const chainFilters = labelsFilters.origin_key.map((chainKey) => (
      <Badge
        key={chainKey}
        onClick={(e) => { handleFilter("origin_key", chainKey); e.stopPropagation(); }}
        label={master.chains[chainKey].name}
        leftIcon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
        leftIconColor={AllChainsByKeys[chainKey].colors["dark"][0]}
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={isOpen}
        altColoring={isOpen}
      />
    ));

    const categoryFilters = labelsFilters.category.map((category) => (
      <Badge
        key={category}
        onClick={(e) => { handleFilter("category", category); e.stopPropagation(); }}
        label={master.blockspace_categories.main_categories[category]}
        leftIcon="feather:tag"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));

    const subcategoryFilters = labelsFilters.subcategory.map((subcategory) => (
      <Badge
        key={subcategory}
        onClick={(e) => { handleFilter("subcategory", subcategory); e.stopPropagation(); }}
        label={master.blockspace_categories.sub_categories[subcategory]}
        leftIcon="feather:tag"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));

    const ownerProjectFilters = labelsFilters.owner_project.map(
      (row, index) => (
        <Badge
          key={row.owner_project}
          onClick={(e) => { handleFilter("owner_project", row); e.stopPropagation(); }}
          label={row.owner_project_clear}
          leftIcon={"uil:layer-group"}
          leftIconColor="#CDD8D3"
          rightIcon="heroicons-solid:x-circle"
          rightIconColor="#FE5468"
          showLabel={true}
          altColoring={isOpen}
        />
      ),
    );

    const nameFilters = labelsFilters.name.map((name) => (
      <Badge
        key={name}
        onClick={(e) => { handleFilter("name", name); e.stopPropagation(); }}
        label={name}
        leftIcon={undefined}
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    ));



    const deployerAddressFilters = labelsFilters.deployer_address?.map((deployerAddress) => (
      <Badge
        key={deployerAddress}
        truncateStyle="middle"
        className="!max-w-[115px]"
        onClick={(e) => { handleFilter("deployer_address", deployerAddress); e.stopPropagation(); }}
        label={deployerAddress}
        leftIcon={"uil:layer-group"}
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
        altColoring={isOpen}
      />
    )) || [];

    return [
      ...addressFilters,
      ...chainFilters,
      ...categoryFilters,
      ...subcategoryFilters,
      ...ownerProjectFilters,
      ...nameFilters,
      ...deployerAddressFilters,
    ];
  }, [
    handleFilter,
    isOpen,
    labelsFilters.address,
    labelsFilters.category,
    labelsFilters.name,
    labelsFilters.origin_key,
    labelsFilters.owner_project,
    labelsFilters.subcategory,
    labelsFilters.deployer_address,
    master,
  ]);

  useEffect(() => {
    if (!master || labelsOwnerProjects.length === 0 || labelsDeployerAddresses.length === 0) return;

    if (search.length === 0) {
      setLabelsAutocomplete({
        address: [],
        name: [],
        deployer_address: [],
        owner_project: [],
        category: [],
        subcategory: [],
        origin_key: [],
      });
      return;
    }

    const categoryAutocomplete = Object.keys(
      master.blockspace_categories.main_categories,
    ).filter((category) =>
      master.blockspace_categories.main_categories[category]
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const subcategoryAutocomplete = Object.keys(
      master.blockspace_categories.sub_categories,
    ).filter((subcategory) =>
      master.blockspace_categories.sub_categories[subcategory]
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    const chainAutocomplete = Object.keys(master.chains).filter((chainKey) =>
      master.chains[chainKey].name.toLowerCase().includes(search.toLowerCase()),
    );
    const ownerProjectAutocomplete = labelsOwnerProjects.filter((row) =>
      row.owner_project.toLowerCase().includes(search.toLowerCase()),
    );
    const deployerAddressAutocomplete = labelsDeployerAddresses.filter((deployerAddress) =>
      deployerAddress.toLowerCase().includes(search.toLowerCase()),
    );

    setLabelsAutocomplete({
      address: [],
      name: [],
      deployer_address: deployerAddressAutocomplete,
      owner_project: ownerProjectAutocomplete,
      category: categoryAutocomplete,
      subcategory: subcategoryAutocomplete,
      origin_key: chainAutocomplete,
    });
  }, [labelsDeployerAddresses, labelsOwnerProjects, master, search, setLabelsAutocomplete]);

  return (
    <div className="relative w-full">
      <div
        className="fixed inset-0 bg-black/10 z-0"
        onClick={() => setIsOpen(false)}
        style={{
          opacity: isOpen ? 0.5 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />
      <div
        className={`absolute -bottom-[22px] md:bottom-auto md:-top-[22px] ${isOpen ? "-left-[50px] -right-[50px] md:left-0 md:right-0" : "left-0 right-0"} transition-all duration-300 `}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center w-full min-h-[44px]">
          <div className="absolute flex items-center w-full bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[1]" />
          {/* <div className="relative w-full min-h-[44px] z-10 flex items-center bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px]"> */}
          <div className="absolute inset-0 z-[2] flex items-center w-full">
            <div className={`relative flex justify-center items-center pl-[10px]`}>
              {isOpen ? (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon
                    icon="feather:chevron-down"
                    className="w-[16px] h-[16px]"
                  />
                </div>
              ) : <SearchIcon />}
            </div>
            <input
              ref={inputRef}
              className={`${isOpen ? "flex-1" : Filters.length > 0 ? "w-[63px]" : "flex-1"} pl-[11px] h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none overflow-x-clip`}
              placeholder="Search"
              value={search}
              onChange={(e) => {

                setSearch(e.target.value)
              }}
              onKeyUp={(e) => {
                // if enter is pressed, add the search term to the address filters
                if (e.key === "Enter" && search.length > 0) {
                  handleFilter("address", search);
                  setSearch("");
                  e.preventDefault();
                }
              }}
            />

            <div className={`flex items-center justify-between pr-[10px] gap-x-[10px] ${isOpen ? "" : "w-[calc(100%-63px-34px)]"}`}>
              {(!isOpen && Filters.length > 0) ? (
                <>
                  <div className="pl-[10px]">
                    <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                  </div>
                  <FilterSelectionContainer className="w-full">
                    {Filters}
                  </FilterSelectionContainer>
                </>
              ) : <div />}
              <div className={`${isOpen ? "flex" : "hidden md:flex"} justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
                {Filters.length > 0 && (
                  <div className={`flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full`}>
                    <div className="text-[8px] text-[#CDD8D3] font-medium">
                      {labelsNumberFiltered.toLocaleString("en-GB")} contracts
                    </div>
                  </div>
                )}
                {Object.values(labelsFilters).flat().length > 0 && (
                  <div
                    className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                    onClick={() =>
                      setLabelsFilters({
                        address: [],
                        origin_key: [],
                        name: [],
                        owner_project: [],
                        category: [],
                        subcategory: [],
                        deployer_address: [],
                        txcount: [],
                        txcount_change: [],
                        gas_fees_usd: [],
                        gas_fees_usd_change: [],
                        daa: [],
                        daa_change: [],
                      })
                    }
                  >
                    <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#paint0_linear_8794_34411)" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z" fill="#CDD8D3" />
                      <defs>
                        <linearGradient id="paint0_linear_8794_34411" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FE5468" />
                          <stop offset="1" stopColor="#FFDF27" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* <div className="flex items-center justify-between gap-x-[10px] flex-1 pl-[10px] md:pl-0 z-[2]">
            <div className={`flex w-full items-center gap-x-[10px] pl-[10px] md:pl-0`}>
              <div className={`${isOpen ? "w-full" : "w-[120px]"}`}>
                <input
                  ref={inputRef}
                  className={`pl-[11px] h-full bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none`}
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-x-[10px] basis-[calc(100%-120px)]">

                {!isOpen && Filters.length > 0 && (
                  <div className="w-[calc(100%-230px)]">
                    <FilterSelectionContainer className="w-full">
                      {Filters}
                    </FilterSelectionContainer>
                  </div>
                )}
                <div className={`flex justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
                  {Filters.length > 0 && (
                    <div className={`flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full`}>
                      <div className="text-[8px] text-[#CDD8D3] font-medium">
                        {labelsNumberFiltered.toLocaleString("en-GB")} contracts
                      </div>
                    </div>
                  )}
                  {Object.values(labelsFilters).flat().length > 0 && (
                    <div
                      className="flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px]"
                      onClick={() =>
                        setLabelsFilters({
                          address: [],
                          origin_key: [],
                          name: [],
                          owner_project: [],
                          category: [],
                          subcategory: [],
                          txcount: [],
                          txcount_change: [],
                          gas_fees_usd: [],
                          gas_fees_usd_change: [],
                          daa: [],
                          daa_change: [],
                        })
                      }
                    >
                      <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#paint0_linear_8794_34411)" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z" fill="#CDD8D3" />
                        <defs>
                          <linearGradient id="paint0_linear_8794_34411" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FE5468" />
                            <stop offset="1" stopColor="#FFDF27" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div> */}
          {/* </div> */}
          <div
            className={`z-[0] absolute flex flex-col-reverse md:flex-col rounded-t-[22px] md:rounded-t-none md:rounded-b-[22px] bg-[#151A19] left-0 right-0 bottom-[calc(100%-22px)] md:bottom-auto md:top-[calc(100%-22px)] shadow-[0px_0px_50px_0px_#000000] transition-all duration-300 ${isOpen ? "max-h-[650px]" : "max-h-0"
              } overflow-hidden overflow-y-auto lg:overflow-y-hidden scrollbar-thin scrollbar-thumb-forest-700 scrollbar-track-transparent`}
          >
            <div className={`flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[25px] pt-[5px] md:pb-[5px] md:pt-[25px] gap-y-[10px] text-[10px] bg-[#344240] z-[1] ${Filters.length > 0 ? "max-h-[100px]" : "max-h-[20px] opacity-0 !p-0"} transition-all duration-300 overflow-clip`}>
              <div className="flex flex-col md:flex-row h-[50px] md:h-[30px] gap-x-[10px] gap-y-[10px] items-start md:items-center z-[50]">
                <div className="flex gap-x-[10px] items-center">
                  <div className="w-[15px] h-[15px]">
                    <Icon
                      icon="feather:check"
                      className="w-[15px] h-[15px]"
                    />
                  </div>
                  <div className="text-white leading-[150%] whitespace-nowrap">Active Filter(s)</div>
                </div>
                <FilterSelectionContainer className="w-full">
                  {Filters}
                </FilterSelectionContainer>
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[10px] pt-[10px] gap-y-[10px] text-[10px]">
              <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                <div className="flex gap-x-[10px] items-center">
                  <div className="w-[15px] h-[15px]">
                    <Icon
                      icon="heroicons-solid:qrcode"
                      className="w-[15px] h-[15px]"
                    />
                  </div>
                  <div className="text-white leading-[150%]">Address</div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                </div>
                <div
                  className="flex items-center bg-[#344240] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer"
                  onClick={() => handleFilter("address", search)}
                >
                  <div className="flex items-center justify-center w-[25px] h-[25px]">
                    <Icon
                      icon="feather:search"
                      className="text-[#CDD8D3] w-[15px] h-[15px]"
                    />
                  </div>
                  <div className="text-[#CDD8D3] leading-[120%] text-[10px] truncate">
                    {search}
                  </div>
                  <div className="flex items-center justify-center w-[15px] h-[15px]">
                    <Icon
                      icon="heroicons-solid:plus-circle"
                      className="text-[#5A6462] w-[15px] h-[15px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                <div className="flex gap-x-[10px] items-center">
                  <div className="w-[15px] h-[15px]">
                    <Icon
                      icon="gtp:gtp-chain-alt"
                      className="w-[15px] h-[15px] text-white"
                    />
                  </div>
                  <div className="text-white leading-[150%]">Chain</div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                </div>

                {master && (
                  <FilterSelectionContainer className="w-full md:flex-1">
                    {Object.keys(master.chains)
                      .filter(
                        (chainKey) =>
                          !labelsFilters.origin_key.includes(chainKey) &&
                          master.chains[chainKey].enable_contracts === true,
                      )
                      .sort((a, b) =>
                        master.chains[a].name.localeCompare(
                          master.chains[b].name,
                        ),
                      )
                      .map((chainKey) => (
                        <Badge
                          key={chainKey}
                          onClick={(e) => {
                            handleFilter("origin_key", chainKey);
                            e.stopPropagation();
                          }}
                          label={
                            labelsAutocomplete.origin_key.length > 0
                              ? boldSearch(master.chains[chainKey].name)
                              : master.chains[chainKey].name
                          }
                          leftIcon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
                          leftIconColor={
                            AllChainsByKeys[chainKey].colors["dark"][0]
                          }
                          rightIcon="heroicons-solid:plus-circle"
                          className={`${search.length > 0
                            ? labelsAutocomplete.origin_key.includes(chainKey)
                              ? "opacity-100"
                              : "opacity-30"
                            : "opacity-100"
                            } transition-all`}
                        />
                      ))}
                  </FilterSelectionContainer>
                )}
              </div>
              {/* <div className="flex gap-x-[10px] items-center">
                <div className="w-[15px] h-[15px]"><Icon icon="feather:tag" className='w-[15px] h-[15px]' /></div>
                <div className="text-white leading-[150%] whitespace-nowrap">Category</div>
                <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
                <div className="grid grid-flow-col grid-cols-4 grid-rows-2 justify-between items-center flex-1 pl-[18px] gap-x-[5px] gap-y-[5px]">
                  {master && Object.entries(master.blockspace_categories.main_categories).map(([categoryKey, category]) => (
                    <Badge
                      key={categoryKey}
                      size='sm'
                      onClick={(e) => {
                        handleFilter('subcategory', categoryKey)
                        e.stopPropagation();
                      }}
                      label={labelsAutocomplete.category.length > 0 ? boldSearch(master.blockspace_categories.main_categories[categoryKey]) : master.blockspace_categories.main_categories[categoryKey]}
                      leftIcon={undefined}
                      leftIconColor={'#CDD8D3'}
                      rightIcon="heroicons-solid:plus-circle"
                      className={`w-fit justify-between ${search.length > 0 ? labelsAutocomplete.category.includes(categoryKey) ? "opacity-100" : "opacity-30" : "opacity-100"} transition-all`}
                    />
                  ))}
                </div>
                <div className="flex items-center bg-[#344240] rounded-full pl-[2px] pr-[5px] gap-x-[5px]">
                  <div className="flex items-center justify-center w-[25px] h-[25px]"><Icon icon="feather:search" className='text-[#CDD8D3] w-[15px] h-[15px]' /></div>
                  <div className="flex items-center justify-center w-[15px] h-[15px]"><Icon icon="heroicons-solid:plus-circle" className='text-[#5A6462] w-[15px] h-[15px]' /></div>
                </div>
              </div> */}
              <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
                <div className="flex gap-x-[10px] items-start">
                  <div className="w-[15px] h-[15px] mt-1">
                    <Icon icon="feather:tag" className="w-[15px] h-[15px]" />
                  </div>
                  <div className="text-white leading-[150%] whitespace-nowrap mt-1">
                    Categories
                  </div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full mt-2.5" />
                </div>
                <div className="w-full md:flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-[5px] gap-y-[5px]">
                    {master &&
                      Object.keys(master.blockspace_categories.main_categories)
                        .filter((categoryKey) =>
                          search.length > 0
                            ? master.blockspace_categories.main_categories[
                              categoryKey
                            ]
                              .toLowerCase()
                              .includes(search.toLowerCase()) ||
                            master.blockspace_categories.mapping[
                              categoryKey
                            ].some((subcategoryKey) =>
                              master.blockspace_categories.sub_categories[
                                subcategoryKey
                              ]
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                            )
                            : master.blockspace_categories.main_categories[
                            categoryKey
                            ],
                        )
                        .map((categoryKey) => (
                          <NestedSelection
                            key={categoryKey}
                            parent={
                              <Badge
                                key={categoryKey}
                                size="sm"
                                onClick={(e) => {
                                  handleFilter("category", categoryKey);
                                  e.stopPropagation();
                                }}
                                label={
                                  labelsAutocomplete.category.length > 0
                                    ? boldSearch(
                                      master.blockspace_categories
                                        .main_categories[categoryKey],
                                    )
                                    : master.blockspace_categories
                                      .main_categories[categoryKey]
                                }
                                leftIcon={undefined}
                                rightIconColor={
                                  labelsFilters.category.includes(categoryKey)
                                    ? "#FE5468"
                                    : "#5A6462"
                                }
                                rightIcon={
                                  labelsFilters.category.includes(categoryKey)
                                    ? "heroicons-solid:x-circle"
                                    : "heroicons-solid:plus-circle"
                                }
                                className={`w-fit h-fit justify-between bg-transparent rounded-l-[15px] ${search.length > 0
                                  ? labelsAutocomplete.category.includes(
                                    categoryKey,
                                  )
                                    ? "opacity-100"
                                    : "opacity-30"
                                  : "opacity-100"
                                  } transition-all duration-300`}
                              />
                            }
                          >
                            {master.blockspace_categories.mapping[categoryKey]
                              .sort((a, b) => a.localeCompare(b))
                              .filter((subcategoryKey) =>
                                search.length > 0
                                  ? master.blockspace_categories.sub_categories[
                                  subcategoryKey
                                  ] &&
                                  labelsAutocomplete.subcategory.includes(
                                    subcategoryKey,
                                  )
                                  : master.blockspace_categories.sub_categories[
                                  subcategoryKey
                                  ],
                              )
                              .map((subcategory, i) =>
                                subcategory === "unlabeled" ? null : (
                                  <Badge
                                    key={subcategory}
                                    size="sm"
                                    onClick={(e) => {
                                      handleFilter("subcategory", subcategory);
                                      e.stopPropagation();
                                    }}
                                    label={
                                      labelsAutocomplete.subcategory.length > 0
                                        ? boldSearch(
                                          master.blockspace_categories
                                            .sub_categories[subcategory],
                                        )
                                        : master.blockspace_categories
                                          .sub_categories[subcategory]
                                    }
                                    leftIcon={undefined}
                                    rightIconColor={
                                      labelsFilters.subcategory.includes(
                                        subcategory,
                                      )
                                        ? "#FE5468"
                                        : "#5A6462"
                                    }
                                    rightIcon={
                                      labelsFilters.subcategory.includes(
                                        subcategory,
                                      )
                                        ? "heroicons-solid:x-circle"
                                        : "heroicons-solid:plus-circle"
                                    }
                                    className={`w-fit h-fit ${search.length > 0
                                      ? labelsAutocomplete.subcategory.includes(
                                        subcategory,
                                      )
                                        ? "opacity-100"
                                        : "opacity-30"
                                      : "opacity-100"
                                      } transition-all`}
                                  />
                                ),
                              )}
                          </NestedSelection>
                        ))}
                  </div>
                </div>
              </div>
              {/* <div>
                {JSON.stringify(labelsFilters)}
              </div> */}
              <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start">
                <div className="flex gap-x-[10px] items-start">
                  <div className="w-[15px] h-[15px] mt-1">
                    <Icon icon="uil:layer-group" className="w-[15px] h-[15px]" />
                  </div>
                  <div className="text-white leading-[150%] whitespace-nowrap mt-1">
                    Owner Project
                  </div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full mt-2.5" />
                </div>
                <FilterSelectionContainer className="w-full md:flex-1">
                  {search.length > 0
                    ? labelsAutocomplete.owner_project.map(
                      (ownerProjectRow) => (
                        <Badge
                          key={ownerProjectRow.owner_project}
                          onClick={() =>
                            handleFilter("owner_project", ownerProjectRow)
                          }
                          label={
                            labelsAutocomplete.owner_project.length > 0
                              ? boldSearch(
                                ownerProjectRow.owner_project_clear,
                              )
                              : ownerProjectRow.owner_project_clear
                          }
                          leftIcon={"uil:layer-group"}
                          leftIconColor="#CDD8D3"
                          rightIcon={
                            labelsFilters.owner_project.find(
                              (f) =>
                                f.owner_project ===
                                ownerProjectRow.owner_project,
                            )
                              ? "heroicons-solid:x-circle"
                              : "heroicons-solid:plus-circle"
                          }
                          rightIconColor={
                            labelsFilters.owner_project.find(
                              (f) =>
                                f.owner_project ===
                                ownerProjectRow.owner_project,
                            )
                              ? "#FE5468"
                              : "#5A6462"
                          }
                          showLabel={true}
                        />
                      ),
                    )
                    : (
                      <>
                        {labelsOwnerProjects.slice(0, 100).map((ownerProjectRow) => (
                          <Badge
                            key={ownerProjectRow.owner_project}
                            onClick={() =>
                              handleFilter("owner_project", ownerProjectRow)
                            }
                            label={ownerProjectRow.owner_project_clear}
                            leftIcon={"uil:layer-group"}
                            leftIconColor="#CDD8D3"
                            rightIcon={
                              labelsFilters.owner_project.find(
                                (f) =>
                                  f.owner_project ===
                                  ownerProjectRow.owner_project,
                              )
                                ? "heroicons-solid:x-circle"
                                : "heroicons-solid:plus-circle"
                            }
                            rightIconColor={
                              labelsFilters.owner_project.find(
                                (f) =>
                                  f.owner_project ===
                                  ownerProjectRow.owner_project,
                              )
                                ? "#FE5468"
                                : "#5A6462"
                            }
                            showLabel={true}
                          />
                        ))}
                        {labelsOwnerProjects.length > 100 && (
                          <div className="flex items-center justify-center w-full whitespace-nowrap">
                            <div className="text-[10px] text-[#CDD8D3] font-medium cursor-pointer">{`+${labelsOwnerProjects.length - 10} more`}</div>
                          </div>
                        )}
                      </>
                    )}
                </FilterSelectionContainer>
              </div>
              {showDeployerAddress && <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start">
                <div className="flex gap-x-[10px] items-start">
                  <div className="w-[15px] h-[15px] mt-1">
                    <Icon icon="material-symbols:deployed-code-account-rounded" className="w-[15px] h-[15px]" />
                  </div>
                  <div className="text-white leading-[150%] whitespace-nowrap mt-1">
                    Deployer Address
                  </div>
                  <div className="w-[6px] h-[6px] bg-[#344240] rounded-full mt-2.5" />
                </div>
                <FilterSelectionContainer className="w-full md:flex-1">
                  {search.length > 0
                    ? search.length >= 4 ?
                      <>
                        {labelsAutocomplete.deployer_address && labelsAutocomplete.deployer_address.map(
                          (deployerAddress) => (
                            <Badge
                              key={deployerAddress}
                              truncateStyle="middle"
                              className="!max-w-[120px]"
                              onClick={() =>
                                handleFilter("deployer_address", deployerAddress)
                              }
                              label={
                                labelsAutocomplete.deployer_address.length > 0
                                  ? boldSearch(
                                    deployerAddress,
                                  )
                                  : deployerAddress
                              }
                              leftIcon={"material-symbols:deployed-code-account-rounded"}
                              leftIconColor="#CDD8D3"
                              rightIcon={
                                labelsFilters.deployer_address.includes(
                                  deployerAddress,
                                )
                                  ? "heroicons-solid:x-circle"
                                  : "heroicons-solid:plus-circle"
                              }
                              rightIconColor={
                                labelsFilters.deployer_address.includes(
                                  deployerAddress,
                                )
                                  ? "#FE5468"
                                  : "#5A6462"
                              }
                              showLabel={true}
                            />
                          ))}
                      </>
                      : <div className="flex items-center justify-start w-full whitespace-nowrap h-[25px]">
                        <div className="text-[10px] text-[#CDD8D3]/80 font-medium">Please enter at least 4 characters to search deployer addresses</div>
                      </div>


                    : (
                      <>
                        {labelsDeployerAddresses.slice(0, 100).map((deployerAddress) => (
                          <Badge
                            key={deployerAddress}
                            truncateStyle="middle"
                            className="!max-w-[120px]"
                            onClick={() =>
                              handleFilter("deployer_address", deployerAddress)
                            }
                            label={deployerAddress}
                            leftIcon={"material-symbols:deployed-code-account-rounded"}
                            leftIconColor="#CDD8D3"
                            rightIcon={
                              labelsFilters.deployer_address.includes(
                                deployerAddress,
                              )
                                ? "heroicons-solid:x-circle"
                                : "heroicons-solid:plus-circle"
                            }
                            rightIconColor={
                              labelsFilters.deployer_address.includes(
                                deployerAddress,
                              )
                                ? "#FE5468"
                                : "#5A6462"
                            }
                            showLabel={true}
                          />
                        ))}
                        {labelsDeployerAddresses.length > 100 && (
                          <div className="flex items-center justify-center w-full whitespace-nowrap">
                            <div className="text-[10px] text-[#CDD8D3] font-medium cursor-pointer">{`+${labelsDeployerAddresses.length - 10} more`}</div>
                          </div>
                        )}
                      </>
                    )}

                </FilterSelectionContainer>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const SearchIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_6590_27443)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.6 8.8C17.6 13.6601 13.6601 17.6 8.8 17.6C3.93989 17.6 0 13.6601 0 8.8C0 3.93989 3.93989 0 8.8 0C13.6601 0 17.6 3.93989 17.6 8.8ZM8.8 15.2C12.3346 15.2 15.2 12.3346 15.2 8.8C15.2 5.26538 12.3346 2.4 8.8 2.4C5.26538 2.4 2.4 5.26538 2.4 8.8C2.4 12.3346 5.26538 15.2 8.8 15.2Z"
        fill="url(#paint0_linear_6590_27443)"
      />
      <circle
        cx="8.75"
        cy="8.75"
        r="5.75"
        fill="url(#paint1_linear_6590_27443)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.1638 23.2927C22.7733 23.6833 22.1401 23.6833 21.7496 23.2927L13.707 15.2501C13.3164 14.8596 13.3164 14.2264 13.707 13.8359L13.8359 13.707C14.2264 13.3164 14.8596 13.3164 15.2501 13.707L23.2927 21.7496C23.6833 22.1401 23.6833 22.7733 23.2927 23.1638L23.1638 23.2927Z"
        fill="url(#paint2_linear_6590_27443)"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_6590_27443"
        x1="8.8"
        y1="0"
        x2="20.6644"
        y2="16.6802"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FE5468" />
        <stop offset="1" stopColor="#FFDF27" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_6590_27443"
        x1="8.75"
        y1="14.5"
        x2="8.75"
        y2="3"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#10808C" />
        <stop offset="1" stopColor="#1DF7EF" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_6590_27443"
        x1="18.4998"
        y1="13.4141"
        x2="25.3567"
        y2="23.054"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FE5468" />
        <stop offset="1" stopColor="#FFDF27" />
      </linearGradient>
      <clipPath id="clip0_6590_27443">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

type BadgeProps = {
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  label: string | React.ReactNode;
  leftIcon?: string | React.ReactNode;
  leftIconColor?: string;
  rightIcon: string;
  rightIconColor?: string;
  rightIconSize?: "sm" | "base";
  size?: "sm" | "base";
  className?: string;
  showLabel?: boolean;
  altColoring?: boolean;
  truncateStyle?: "start" | "end" | "middle";
};
export const Badge = ({
  onClick,
  label,
  leftIcon,
  leftIconColor = "#CDD8D3",
  rightIcon,
  rightIconColor = "#5A6462",
  rightIconSize = "base",
  size = "base",
  className,
  showLabel = true,
  altColoring = false,
  truncateStyle = "end",
}: BadgeProps) => {

  let labelSection = label;

  if (typeof label === "string") {
    labelSection = (
      <div className="flex items-center text-[#CDD8D3] text-[10px] truncate">
        {label}
      </div>
    );

    if (truncateStyle === "start") {
      labelSection = (
        <div className="flex items-center text-[#CDD8D3] text-[10px] truncate" style={{
          direction: "rtl",
        }}>
          {label}
        </div>
      );
    }

    if (truncateStyle === "middle") {
      labelSection = (
        <div className="flex items-center text-[#CDD8D3] text-[10px] truncate">
          <div className="truncate">
            {label.slice(0, Math.floor(label.length / 2))}
          </div>
          <div className="">
            {label.slice(-4)}
          </div>
        </div>
      );
    }
  }

  if (size === "sm")
    return (
      <div
        className={`flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} text-[10px] h-[20px] rounded-full pl-[5px] pr-[2px] py-[3px] gap-x-[4px] cursor-pointer max-w-full ${className}`}
        onClick={onClick}
      >
        {leftIcon ? typeof leftIcon === "string" ? (
          <div className="flex items-center justify-center w-[12px] h-[12px]">
            <Icon
              icon={leftIcon}
              className="text-[#CDD8D3] w-[12px] h-[12px]"
              style={{
                color: leftIconColor,
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-[12px] h-[12px]">
            {leftIcon}
          </div>
        ) : (
          <div className="w-[0px] h-[12px]" />
        )}
        {showLabel && (
          <div className="flex items-center text-[#CDD8D3] pr-0.5 truncate">
            {labelSection}
          </div>
        )}
        <div
          className={`flex items-center justify-center ${rightIconSize == "sm" ? "pr-[3px]" : "w-[14px] h-[14px]"
            }`}
        >
          <Icon
            icon={rightIcon}
            className={
              rightIconSize == "sm" ? "w-[10px] h-[10px]" : "w-[14px] h-[14px]"
            }
            style={{ color: rightIconColor }}
          />
        </div>
      </div>
    );

  return (
    <div
      className={`flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} h-[25px] text-[10px] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer max-w-full ${className}`}
      onClick={onClick}
    >
      {leftIcon ? typeof leftIcon === "string" ? (
        <div className="flex items-center justify-center pl-[5px] h-[15px]">
          <Icon
            icon={leftIcon}
            className="text-[#CDD8D3] w-[15px] h-[15px]"
            style={{
              color: leftIconColor,
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center pl-[5px] h-[15px]">
          {leftIcon}
        </div>
      ) : (
        <div className="w-[3px] h-[25px]" />
      )}
      {showLabel && (
        <div className="flex items-center text-[#CDD8D3] pr-0.5 truncate">
          {labelSection}
        </div>
      )}
      <div className="flex items-center justify-center w-[15px] h-[15px]">
        <Icon
          icon={rightIcon}
          className="w-[15px] h-[15px]"
          style={{ color: rightIconColor }}
        />
      </div>
    </div>
  );
};
type IconProps = {
  icon: string;
  className?: string;
  onClick?: () => void;
};
export const AddIcon = ({ className, onClick }: IconProps) => (
  <div
    className={`w-[15px] h-[15px] ${className} ${onClick && "cursor-pointer"}`}
    onClick={onClick}
  >
    <Icon
      icon="heroicons-solid:plus-circle"
      className="w-[15px] h-[15px]"
      style={{ color: "#5A6462" }}
    />
  </div>
);

export const RemoveIcon = ({ className, onClick }: IconProps) => (
  <div
    className={`w-[15px] h-[15px] ${className} ${onClick && "cursor-pointer"}`}
    onClick={onClick}
  >
    <Icon
      icon="heroicons-solid:x-circle"
      className="w-[15px] h-[15px]"
      style={{ color: "#FE5468" }}
    />
  </div>
);

type NestedSelectionProps = {
  parent: React.ReactNode;
  children: React.ReactNode;
};
const NestedSelection = ({ parent, children }: NestedSelectionProps) => (
  <div className="flex">
    <div
      className={`flex items-center justify-start gap-x-[0px] bg-gray-500/5 rounded-[15px] justify-items-start justify-self-start overflow-hidden`}
    >
      <div className="p-1 rounded-l-[15px]">{parent}</div>
      <FilterSelectionContainer className="px-1">
        {children}
      </FilterSelectionContainer>
    </div>
  </div>
);

type FilterSelectionContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const FilterSelectionContainer = ({
  children,
  className,
}: FilterSelectionContainerProps) => (
  <DraggableContainer
    className={`touch-none flex gap-x-[10px] items-center justify-start h-full ${className} overflow-x-hidden`}
    direction="horizontal"
  >
    {children}
  </DraggableContainer>
);

type DraggableContainerProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "horizontal" | "vertical";
};
export const DraggableContainer = ({
  children,
  className,
  direction,
}: DraggableContainerProps) => {
  const { containerRef, showLeftGradient, showRightGradient, updateGradients } =
    useDragScroll("horizontal");

  const [maskGradient, setMaskGradient] = useState<string>("");

  useEffect(() => {
    if (showLeftGradient && showRightGradient) {
      setMaskGradient(
        "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)",
      );
    } else if (showLeftGradient) {
      setMaskGradient(
        "linear-gradient(to right, transparent, black 50px, black)",
      );
    } else if (showRightGradient) {
      setMaskGradient(
        "linear-gradient(to left, transparent, black 50px, black)",
      );
    } else {
      setMaskGradient("");
    }
  }, [showLeftGradient, showRightGradient]);

  useEffect(() => {
    updateGradients();
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-x-[10px] items-center overflow-x-hidden h-full ${className}`}
      style={{
        maskClip: "padding-box",
        WebkitMaskClip: "padding-box",
        WebkitMaskImage: maskGradient,
        maskImage: maskGradient,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        transition: "all 0.3s",
      }}
    >
      {children}
    </div>
  );
};
