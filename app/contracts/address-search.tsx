"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { MasterURL } from "../../lib/urls";
import { MasterResponse } from "../../types/api/MasterResponse";
import { AllChainsByKeys } from "../../lib/chains";
import { ContractsURL } from "../../lib/urls";
import { ContractsResponse } from "../../types/api/ContractsResponse";
import debounce from "lodash/debounce";
import Image from "next/image";

export default function AddressSearch() {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: contracts,
    error: contractsError,
    isLoading: contractsLoading,
    isValidating: contractsValidating,
  } = useSWR<ContractsResponse>(ContractsURL);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;

  const [chainsOpen, setChainsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const [selectedChain, setSelectedChain] = useState("all");
  const [addressString, setAddressString] = useState("");
  const [projectNameString, setProjectNameString] = useState("");
  const [contractNameString, setContractNameString] = useState("");
  const [categoryArray, setCategoryArray] = useState<string[]>([]);

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (names: string[], values: any[]) => {
      const params = new URLSearchParams(searchParams);
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const value = values[i];
        if (value === null) {
          params.delete(name);
        } else {
          params.set(name, value);
        }
      }
      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    if (searchParams.size === 0) {
      router.push(
        pathname + "?" + createQueryString(["chain", "address"], ["all", null]),
        { scroll: false },
      );
      return;
    }
    if (searchParams.has("address")) {
      setAddressString(searchParams.get("address")!);
    }
    if (searchParams.has("chain") && searchParams.get("chain") !== "all") {
      setSelectedChain(searchParams.get("chain")!);
    }
    if (searchParams.has("project_name")) {
      setProjectNameString(searchParams.get("project_name")!);
    }
    if (searchParams.has("contract_name")) {
      setContractNameString(searchParams.get("contract_name")!);
    }
    if (searchParams.has("category")) {
      setCategoryArray(searchParams.get("category")!.split(","));
    }
  }, []);

  useEffect(() => {
    if (selectedChain !== searchParams.get("chain")) {
      router.push(
        pathname + "?" + createQueryString(["chain"], [selectedChain]),
        { scroll: false },
      );
    }
  }, [selectedChain, createQueryString, pathname, router, searchParams]);

  useEffect(() => {
    if (addressString !== searchParams.get("address")) {
      if (addressString === "") {
        router.push(pathname + "?" + createQueryString(["address"], [""]), {
          scroll: false,
        });
        return;
      } else {
        router.push(
          pathname + "?" + createQueryString(["address"], [addressString]),
          { scroll: false },
        );
      }
    }
  }, [addressString, createQueryString, pathname, router, searchParams]);

  useEffect(() => {
    if (projectNameString !== searchParams.get("project_name")) {
      if (projectNameString === "") {
        router.push(
          pathname + "?" + createQueryString(["project_name"], [""]),
          { scroll: false },
        );
        return;
      } else {
        router.push(
          pathname +
            "?" +
            createQueryString(["project_name"], [projectNameString]),
          { scroll: false },
        );
      }
    }
  }, [projectNameString, createQueryString, pathname, router, searchParams]);

  useEffect(() => {
    if (contractNameString !== searchParams.get("contract_name")) {
      if (contractNameString === "") {
        router.push(
          pathname + "?" + createQueryString(["contract_name"], [""]),
          {
            scroll: false,
          },
        );
        return;
      } else {
        router.push(
          pathname +
            "?" +
            createQueryString(["contract_name"], [contractNameString]),
          { scroll: false },
        );
      }
    }
  }, [contractNameString, createQueryString, pathname, router, searchParams]);

  useEffect(() => {
    if (!master) return;
    if (categoryArray !== searchParams.get("category")?.split(",")) {
      if (
        categoryArray.length === 0 ||
        categoryArray.length ===
          Object.keys(master.blockspace_categories.sub_categories).length
      ) {
        router.push(pathname + "?" + createQueryString(["category"], [""]), {
          scroll: false,
        });
        return;
      } else {
        router.push(
          pathname +
            "?" +
            createQueryString(["category"], [categoryArray.join(",")]),
          { scroll: false },
        );
      }
    }
  }, [
    categoryArray,
    createQueryString,
    master,
    pathname,
    router,
    searchParams,
  ]);

  const ContractsChains = useMemo(
    () =>
      contracts &&
      contracts.reduce((acc, contract) => {
        if (acc.includes(contract.origin_key)) return acc;
        acc.push(contract.origin_key);
        return acc;
      }, [] as string[]),
    [contracts],
  );

  const ContractsSubcategoryKeys = useMemo(
    () =>
      contracts &&
      contracts.reduce((acc, contract) => {
        if (acc.includes(contract.sub_category_key)) return acc;
        acc.push(contract.sub_category_key);
        return acc;
      }, [] as string[]),
    [contracts],
  );

  const getSubcategoryLabel = useCallback(
    (sub_category_key: string) => {
      if (!master) return sub_category_key;
      return sub_category_key
        ? master.blockspace_categories.sub_categories[sub_category_key]
        : sub_category_key;
    },
    [master],
  );

  const getMainCategoryLabel = useCallback(
    (sub_category_key: string) => {
      if (!master) return sub_category_key;

      const main_category_key = Object.keys(
        master.blockspace_categories.mapping,
      ).find((main_category) => {
        if (
          master.blockspace_categories.mapping[main_category].includes(
            sub_category_key,
          )
        )
          return main_category;
      });

      return main_category_key
        ? master.blockspace_categories.main_categories[main_category_key]
        : sub_category_key;
    },
    [master],
  );

  return (
    <div className="flex w-full justify-start space-x-2">
      <div className="flex relative w-[17%]">
        <div
          className="w-full rounded-3xl text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300 overflow-hidden z-10 flex justify-between items-center py-1.5 px-3 text-xs font-medium text-center space-x-2 cursor-pointer"
          onClick={() => setChainsOpen(!chainsOpen)}
        >
          {selectedChain === "all" ? (
            <div className="flex space-x-2 items-center">
              <Image
                src="/all-chains.svg"
                alt="All Chains"
                className="flex"
                height={16}
                width={16}
                quality={100}
              />
              <div className="flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                All Chains
              </div>
            </div>
          ) : (
            <div className="flex space-x-2 items-center">
              <Image
                src={AllChainsByKeys[selectedChain].icon}
                alt={AllChainsByKeys[selectedChain].label}
                className="flex"
                height={16}
                width={16}
                quality={100}
              />
              <div className="flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                {AllChainsByKeys[selectedChain].label}
              </div>
            </div>
          )}
          <div className="flex items-center">
            <Icon icon="feather:chevron-down" className="w-4 h-4" />
          </div>
        </div>
        <div className="fixed inset-0 z-0" hidden={!chainsOpen}>
          <div
            className="absolute inset-0 z-0"
            onClick={() => setChainsOpen(false)}
          />
        </div>
        <div
          className="z-50 divide-y divide-gray-100 rounded-lg bg-forest-100 dark:bg-forest-900 absolute top-full left-0 w-fit shadow-lg"
          hidden={!chainsOpen}
        >
          <ul className="py-2 text-xs text-gray-700 dark:text-gray-200">
            <li
              className="flex space-x-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
              onClick={() => {
                setSelectedChain("all");
                setChainsOpen(false);
              }}
            >
              <Image
                src="/all-chains.svg"
                alt="All Chains"
                className="flex"
                height={16}
                width={16}
                quality={100}
              />
              <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                All Chains
              </div>
            </li>
            {master &&
              contracts &&
              Object.keys(master.chains)
                .filter((chain) => ContractsChains?.includes(chain))
                .map((chain) => (
                  <li
                    key={chain}
                    className="flex space-x-2 w-full items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                    onClick={() => {
                      setSelectedChain(chain);
                      setChainsOpen(false);
                    }}
                  >
                    <Image
                      src={AllChainsByKeys[chain].icon}
                      alt={AllChainsByKeys[chain].label}
                      className="flex"
                      height={16}
                      width={16}
                      quality={100}
                    />
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {AllChainsByKeys[chain].label}
                    </div>
                  </li>
                ))}
          </ul>
        </div>
      </div>
      <div className="w-[29%]">
        <div className="relative">
          <input
            className="block rounded-full pl-6 pr-3 py-1.5 w-full z-20 text-xs text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300"
            placeholder="Address Filter"
            value={addressString}
            onChange={(e) => {
              setAddressString(e.target.value);
              // router.push("/contracts/" + e.target.value);
              // debouncedSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(
                  pathname +
                    "?" +
                    createQueryString(["address"], [addressString]),
                );
              }
            }}
          />
          <Icon
            icon="feather:search"
            className="w-4 h-4 absolute left-1.5 top-1.5"
          />
        </div>
      </div>
      <div className="w-[17%]">
        <div className="relative">
          <input
            className="block rounded-full pl-6 pr-3 py-1.5 w-full z-20 text-xs text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300"
            placeholder="Project Name"
            value={projectNameString}
            onChange={(e) => {
              setProjectNameString(e.target.value);
              // router.push("/contracts/" + e.target.value);
              // debouncedSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(
                  pathname +
                    "?" +
                    createQueryString(["project_name"], [projectNameString]),
                );
              }
            }}
          />
          <Icon
            icon="feather:package"
            className="w-4 h-4 absolute left-1.5 top-1.5"
          />
        </div>
      </div>
      <div className="w-[17%]">
        <div className="relative">
          <input
            className="block rounded-full pl-6 pr-3 py-1.5 w-full z-20 text-xs text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300"
            placeholder="Contract Name"
            value={contractNameString}
            onChange={(e) => {
              setContractNameString(e.target.value);
              // router.push("/contracts/" + e.target.value);
              // debouncedSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(
                  pathname +
                    "?" +
                    createQueryString(["contract_name"], [contractNameString]),
                );
              }
            }}
          />
          <Icon
            icon="feather:file-text"
            className="w-4 h-4 absolute left-1.5 top-1.5"
          />
        </div>
      </div>
      <div className="flex w-[20%] relative">
        {master && (
          <div
            className="w-full rounded-3xl text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300 overflow-hidden z-10 flex justify-between items-center py-1.5 px-3 text-xs font-medium text-center space-x-2 cursor-pointer"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            {categoryArray.length === 0 ||
            categoryArray.length ===
              Object.keys(master.blockspace_categories.sub_categories)
                .length ? (
              <div className="flex space-x-2 items-center">
                {/* <Image
                src="/all-chains.svg"
                alt="All Chains"
                className="flex"
                height={16}
                width={16}
                quality={100}
              /> */}
                <div className="flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                  All Categories
                </div>
              </div>
            ) : (
              <div className="flex space-x-2 items-center">
                {/* <Image
                src={AllChainsByKeys[selectedChain].icon}
                alt={AllChainsByKeys[selectedChain].label}
                className="flex"
                height={16}
                width={16}
                quality={100}
              /> */}
                {categoryArray.length > 0 && (
                  <div className="rounded-full bg-forest-500 text-forest-900 text-xs px-1 py-0.5">
                    {categoryArray.length}
                  </div>
                )}
                <div className="flex-grow whitespace-nowrap overflow-hidden text-ellipsis">
                  {categoryArray
                    .map((sck) => getSubcategoryLabel(sck))
                    .join(", ")}
                </div>
              </div>
            )}
            <div className="flex items-center">
              <Icon icon="feather:chevron-down" className="w-4 h-4" />
            </div>
          </div>
        )}
        <div className="fixed inset-0 z-0" hidden={!categoriesOpen}>
          <div
            className="absolute inset-0 z-0"
            onClick={() => setCategoriesOpen(false)}
          />
        </div>
        <div
          className="z-50 divide-y divide-gray-100 rounded-lg bg-forest-100 dark:bg-forest-900 absolute top-full left-0 right-0 shadow-lg h-[200px] overflow-y-scroll "
          hidden={!categoriesOpen}
        >
          <ul className="py-2 text-xs text-gray-700 dark:text-gray-200">
            {/* <li
              className="flex space-x-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer font-medium"
              onClick={() => {
                // setSelectedCategories([]);
                setCategoriesOpen(false);
              }}
            >
              <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                All Categories
              </div>
            </li> */}
            {master &&
              ContractsSubcategoryKeys &&
              Object.keys(master.blockspace_categories.mapping).map(
                (mainCategoryKey) => {
                  const subcategoryKeys =
                    master.blockspace_categories.mapping[mainCategoryKey];

                  return subcategoryKeys.map((subcategoryKey, i) => (
                    <>
                      {i === 0 && (
                        <li
                          key={mainCategoryKey}
                          className="flex space-x-2 w-full items-center px-8 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                          onClick={() => {
                            // check if any of the subcategories are already selected
                            const selectedScks = subcategoryKeys.filter((sck) =>
                              categoryArray.includes(sck),
                            );

                            // if none of the subcategories are selected, select all
                            if (selectedScks.length === 0) {
                              setCategoryArray([
                                ...categoryArray,
                                ...subcategoryKeys,
                              ]);
                            } else {
                              // if some of the subcategories are selected, deselect all
                              setCategoryArray(
                                categoryArray.filter(
                                  (sck) => !subcategoryKeys.includes(sck),
                                ),
                              );
                            }
                          }}
                        >
                          {subcategoryKeys.filter((sck) =>
                            categoryArray.includes(sck),
                          ).length === subcategoryKeys.length ||
                            (categoryArray.length === 0 && (
                              <Icon
                                icon="feather:check"
                                className="w-4 h-4 absolute left-2 block"
                              />
                            ))}
                          {getMainCategoryLabel(subcategoryKey)}
                        </li>
                      )}
                      <li
                        key={subcategoryKey}
                        className="block pl-12 space-x-2 w-full items-center px-8 py-2 font-normal hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer relative"
                        onClick={() => {
                          // check if this subcategory is already selected
                          const selectedSck =
                            categoryArray.includes(subcategoryKey);

                          // if this subcategory is not selected, select it

                          if (!selectedSck) {
                            setCategoryArray([
                              ...categoryArray,
                              subcategoryKey,
                            ]);
                          } else {
                            // if this subcategory is selected, deselect it
                            setCategoryArray(
                              categoryArray?.filter(
                                (sck) => sck !== subcategoryKey,
                              ),
                            );
                          }
                        }}
                      >
                        {categoryArray.includes(subcategoryKey) ||
                          (categoryArray.length === 0 && (
                            <Icon
                              icon="feather:check"
                              className="w-4 h-4 absolute left-8 block"
                            />
                          ))}
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {getSubcategoryLabel(subcategoryKey)}
                        </div>
                      </li>
                    </>
                  ));
                },
              )}
          </ul>
        </div>
      </div>
    </div>
  );
}
