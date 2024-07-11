"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/layout/Icon";
import useSWR from "swr";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChainsByKeys, Get_SupportedChainKeys } from "@/lib/chains";
import { useSessionStorage } from "usehooks-ts";
import useDragScroll from "@/hooks/useDragScroll";
import { useProjectData } from "../useProjectData";
import { update } from "lodash";

export default function Search() {
  const {
    data: filteredLabelsData,
    isLoading,
    error,
    filters,
    sort,
    updateFilters,
    updateSort,
  } = useProjectData();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const { data: master } = useSWR<MasterResponse>(MasterURL);

  // const [labelsCategoriesFilter, setLabelsCategoriesFilter] = useSessionStorage<string[]>('labelsCategoriesFilter', []);
  // const [labelsSubcategoriesFilter, setLabelsSubcategoriesFilter] = useSessionStorage<string[]>('labelsSubcategoriesFilter', []);
  // const [labelsChainsFilter, setLabelsChainsFilter] = useSessionStorage<string[]>('labelsChainsFilter', []);
  const [labelsNumberFiltered, setLabelsNumberFiltered] =
    useSessionStorage<number>("labelsNumberFiltered", 0);

  const [labelsFilters, setLabelsFilters] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: string[];
    category: string[];
    subcategory: string[];
    txcount: number[];
    txcount_change: number[];
    gas_fees_usd: number[];
    gas_fees_usd_change: number[];
    daa: number[];
    daa_change: number[];
  }>("labelsFilters", {
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
  });

  const handleFilter = useCallback(
    (key: string, value: string | number) => {
      setLabelsFilters({
        ...labelsFilters,
        [key]: labelsFilters[key].includes(value)
          ? labelsFilters[key].filter((f) => f !== value)
          : [...labelsFilters[key], value],
      });
      // updateFilters((prevFilters) => ({
      //   ...prevFilters,
      //   [key]: filters[key].includes(value)
      //     ? filters[key].filter((f) => f !== value)
      //     : [...filters[key], value],
      // }));
      setSearch("");
    },
    [labelsFilters, setLabelsFilters],
  );

  const [search, setSearch] = useState<string>("");

  const [labelsAutocomplete, setLabelsAutocomplete] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: string[];
    category: string[];
    subcategory: string[];
  }>("labelsAutocomplete", {
    address: [],
    origin_key: [],
    name: [],
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
    string[]
  >("labelsOwnerProjects", []);

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
        leftIcon="feather:tag"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
      />
    ));

    const chainFilters = labelsFilters.origin_key.map((chainKey) => (
      <Badge
        key={chainKey}
        onClick={() => handleFilter("origin_key", chainKey)}
        label={master.chains[chainKey].name}
        leftIcon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
        leftIconColor={AllChainsByKeys[chainKey].colors["dark"][0]}
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={isOpen}
      />
    ));

    const categoryFilters = labelsFilters.category.map((category) => (
      <Badge
        key={category}
        onClick={() => handleFilter("category", category)}
        label={master.blockspace_categories.main_categories[category]}
        leftIcon="feather:tag"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
      />
    ));

    const subcategoryFilters = labelsFilters.subcategory.map((subcategory) => (
      <Badge
        key={subcategory}
        onClick={() => handleFilter("subcategory", subcategory)}
        label={master.blockspace_categories.sub_categories[subcategory]}
        leftIcon="feather:tag"
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
      />
    ));

    const ownerProjectFilters = labelsFilters.owner_project.map(
      (ownerProject) => (
        <Badge
          key={ownerProject}
          onClick={() => handleFilter("owner_project", ownerProject)}
          label={ownerProject}
          leftIcon="feather:tag"
          leftIconColor="#CDD8D3"
          rightIcon="heroicons-solid:x-circle"
          rightIconColor="#FE5468"
          showLabel={true}
        />
      ),
    );

    const nameFilters = labelsFilters.name.map((name) => (
      <Badge
        key={name}
        onClick={() => handleFilter("name", name)}
        label={name}
        leftIcon={undefined}
        leftIconColor="#CDD8D3"
        rightIcon="heroicons-solid:x-circle"
        rightIconColor="#FE5468"
        showLabel={true}
      />
    ));

    return [
      ...addressFilters,
      ...chainFilters,
      ...categoryFilters,
      ...subcategoryFilters,
      ...ownerProjectFilters,
      ...nameFilters,
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
    master,
  ]);

  useEffect(() => {
    if (!master || labelsOwnerProjects.length === 0) return;

    if (search.length === 0) {
      setLabelsAutocomplete({
        address: [],
        name: [],
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
    const ownerProjectAutocomplete = labelsOwnerProjects.filter(
      (ownerProject) =>
        ownerProject.toLowerCase().includes(search.toLowerCase()),
    );

    setLabelsAutocomplete({
      address: [],
      name: [],
      owner_project: ownerProjectAutocomplete,
      category: categoryAutocomplete,
      subcategory: subcategoryAutocomplete,
      origin_key: chainAutocomplete,
    });
  }, [labelsOwnerProjects, master, search, setLabelsAutocomplete]);

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
        className="absolute left-0 right-0 -top-[22px]"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-full max-w-full">
          <div className="relative w-full min-h-[44px] z-10 flex items-center bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px]">
            <div
              className={`relative flex justify-center ${
                isOpen ? "w-[24px] h-[24px]" : "w-[24px] h-[24px]"
              }`}
            >
              <div
                className={`absolute top-0 left-[10px] ${
                  isOpen ? "opacity-0" : "opacity-100 delay-0"
                } transition-all duration-300`}
              >
                <SearchIcon />
              </div>
              <div
                className={`absolute top-[4px] left-[16px] ${
                  isOpen ? "opacity-100 delay-0" : "opacity-0"
                } transition-all duration-300`}
              >
                <Icon
                  icon="feather:chevron-down"
                  className="w-[16px] h-[16px]"
                />
              </div>
            </div>
            {Filters.length > 0 && (
              <div
                className={`flex flex-shrink gap-x-[10px] items-center pl-[15px] py-[10px] gap-y-[5px] max-w-[400px] ${
                  isOpen ? "flex-wrap " : ""
                }`}
              >
                {isOpen ? (
                  Filters
                ) : (
                  <div className="flex gap-x-[10px] items-center">
                    <div className="flex gap-x-[10px] items-center">
                      {Filters.slice(0, 2)}{" "}
                    </div>
                    {Filters.length > 2 && (
                      <div className="flex gap-x-[4px] items-center">
                        <div className="flex items-center text-sm text-[#CDD8D399] font-medium rounded-full bg-[#344240] px-[6px] h-[25px] leading-tight">
                          {" "}
                          +{Filters.length - 2} more
                        </div>
                        {/* <div className='text-xs text-[#5A6462] font-bold'>more</div> */}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-x-[10px] flex-1 grow-1 shrink-1">
              <input
                ref={inputRef}
                className="px-[11px] h-full flex-1 bg-transparent text-white placeholder-[#CDD8D3] border-none outline-none"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-x-[10px] shrink-0 ">
                {labelsNumberFiltered && (
                  <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full">
                    <div className="text-[8px] text-[#CDD8D3] font-medium">
                      {labelsNumberFiltered.toLocaleString("en-GB")} contracts
                    </div>
                  </div>
                )}
                {Object.values(labelsFilters).flat().length > 0 && (
                  <div
                    className="flex items-center justify-center bg-[linear-gradient(-9deg,#FE5468,#FFDF27)] rounded-full w-[24px] h-[24px] cursor-pointer"
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
                    <div className="flex items-center justify-center bg-[#1F2726] rounded-full w-[22px] h-[22px]">
                      <Icon
                        icon="heroicons-solid:x-circle"
                        className="w-[14px] h-[14px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className={`absolute rounded-b-[22px] bg-[#151A19] left-0 right-0 top-[calc(100%-22px)] shadow-[0px_0px_50px_0px_#000000] transition-all duration-300 ${
              isOpen ? "max-h-[500px]" : "max-h-0"
            } overflow-hidden overflow-y-auto lg:overflow-y-hidden scrollbar-thin scrollbar-thumb-forest-700 scrollbar-track-transparent`}
          >
            <div className="flex flex-col pl-[12px] pr-[25px] pb-[15px] pt-[29px] gap-y-[10px] text-[10px]">
              <div className="flex gap-x-[10px] items-center">
                <div className="w-[15px] h-[15px]">
                  <Icon
                    icon="heroicons-solid:qrcode"
                    className="w-[15px] h-[15px]"
                  />
                </div>
                <div className="text-white leading-[150%]">Address</div>
                <div className="w-[6px] h-[6px] bg-[#344240] rounded-full" />
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

              <div className="flex gap-x-[10px] items-start">
                <div className="w-[15px] h-[15px]">
                  <Icon
                    icon="gtp:gtp-chain-alt"
                    className="w-[15px] h-[15px] text-white"
                  />
                </div>
                <div className="text-white leading-[150%]">Chain</div>
                <div className="w-[6px] h-[6px] mt-1.5 bg-[#344240] rounded-full" />
                {master && (
                  <div className="flex flex-1 flex-wrap gap-x-[10px] gap-y-[5px] transition-all">
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
                          className={`${
                            search.length > 0
                              ? labelsAutocomplete.origin_key.includes(chainKey)
                                ? "opacity-100"
                                : "opacity-30"
                              : "opacity-100"
                          } transition-all`}
                        />
                      ))}
                  </div>
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
              <div className="flex gap-x-[10px] items-start w-full">
                <div className="w-[15px] h-[15px] mt-1">
                  <Icon icon="feather:tag" className="w-[15px] h-[15px]" />
                </div>
                <div className="text-white leading-[150%] whitespace-nowrap mt-1">
                  Categories
                </div>
                <div className="w-[6px] h-[6px] bg-[#344240] rounded-full mt-2.5" />
                <div className="flex-1">
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
                                className={`w-fit h-fit justify-between bg-transparent rounded-l-[15px] ${
                                  search.length > 0
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
                                    className={`w-fit h-fit ${
                                      search.length > 0
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
              <div className="flex gap-x-[10px] items-start">
                <div className="w-[15px] h-[15px] mt-1">
                  <Icon icon="feather:tag" className="w-[15px] h-[15px]" />
                </div>
                <div className="text-white leading-[150%] whitespace-nowrap mt-1">
                  Owner Project
                </div>
                <div className="w-[6px] h-[6px] bg-[#344240] rounded-full mt-2.5" />
                <FilterSelectionContainer className="flex-1">
                  {search.length > 0
                    ? labelsAutocomplete.owner_project.map((ownerProject) => (
                        <Badge
                          key={ownerProject}
                          onClick={() =>
                            handleFilter("owner_project", ownerProject)
                          }
                          label={
                            labelsAutocomplete.owner_project.length > 0
                              ? boldSearch(ownerProject)
                              : ownerProject
                          }
                          leftIcon="feather:tag"
                          leftIconColor="#CDD8D3"
                          rightIcon={
                            labelsFilters.owner_project.includes(ownerProject)
                              ? "heroicons-solid:x-circle"
                              : "heroicons-solid:plus-circle"
                          }
                          rightIconColor={
                            labelsFilters.owner_project.includes(ownerProject)
                              ? "#FE5468"
                              : "#5A6462"
                          }
                          showLabel={true}
                        />
                      ))
                    : labelsOwnerProjects.map((ownerProject) => (
                        <Badge
                          key={ownerProject}
                          onClick={() =>
                            handleFilter("owner_project", ownerProject)
                          }
                          label={ownerProject}
                          leftIcon="feather:tag"
                          leftIconColor="#CDD8D3"
                          rightIcon={
                            labelsFilters.owner_project.includes(ownerProject)
                              ? "heroicons-solid:x-circle"
                              : "heroicons-solid:plus-circle"
                          }
                          rightIconColor={
                            labelsFilters.owner_project.includes(ownerProject)
                              ? "#FE5468"
                              : "#5A6462"
                          }
                          showLabel={true}
                        />
                      ))}
                </FilterSelectionContainer>
              </div>
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
  leftIcon?: string;
  leftIconColor?: string;
  rightIcon: string;
  rightIconColor?: string;
  rightIconSize?: "sm" | "base";
  size?: "sm" | "base";
  className?: string;
  showLabel?: boolean;
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
}: BadgeProps) => {
  if (size === "sm")
    return (
      <div
        className={`flex items-center bg-[#344240] text-[10px] rounded-full pl-[5px] pr-[2px] py-[3px] gap-x-[4px] cursor-pointer max-w-full ${className}`}
        onClick={onClick}
      >
        {leftIcon ? (
          <div className="flex items-center justify-center w-[12px] h-[12px]">
            {leftIcon}
          </div>
        ) : (
          <div className="w-[0px] h-[12px]" />
        )}
        <div className="text-[#CDD8D3] leading-[120%] text-[10px] truncate">
          {label}
        </div>
        <div
          className={`flex items-center justify-center ${
            rightIconSize == "sm" ? "pr-[3px]" : "w-[14px] h-[14px]"
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
      className={`flex items-center bg-[#344240] text-[10px] rounded-full pl-[2px] pr-[5px] gap-x-[5px] cursor-pointer ${className}`}
      onClick={onClick}
    >
      {leftIcon ? (
        <div className="flex items-center justify-center w-[25px] h-[25px]">
          <Icon
            icon={leftIcon}
            className="text-[#CDD8D3] w-[15px] h-[15px]"
            style={{
              color: leftIconColor,
            }}
          />
        </div>
      ) : (
        <div className="w-[3px] h-[25px]" />
      )}
      {showLabel && (
        <div className="text-[#CDD8D3] leading-[150%] pr-0.5 truncate">
          {label}
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
    className={`flex gap-x-[10px] items-center justify-start h-full ${className} overflow-x-hidden`}
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
  const { containerRef, showLeftGradient, showRightGradient } =
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
