"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useEffect, useState, useCallback } from "react";
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

  const [selectedChain, setSelectedChain] = useState("all");
  const [addressString, setAddressString] = useState("");

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
        pathname +
          "?" +
          createQueryString(["chain", "address", "page"], ["all", "", null]),
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
  }, []);

  useEffect(() => {
    if (selectedChain !== searchParams.get("chain")) {
      router.push(
        pathname +
          "?" +
          createQueryString(["chain", "page"], [selectedChain, ""]),
        { scroll: false },
      );
    }
  }, [selectedChain, createQueryString, pathname, router, searchParams]);

  useEffect(() => {
    if (addressString !== searchParams.get("address")) {
      if (addressString === "") {
        router.push(
          pathname + "?" + createQueryString(["address", "page"], ["", ""]),
          { scroll: false },
        );
        return;
      } else {
        router.push(
          pathname +
            "?" +
            createQueryString(["address", "page"], [addressString, ""]),
          { scroll: false },
        );
      }
    }
  }, [addressString, createQueryString, pathname, router, searchParams]);

  // const debouncedSearch = debounce(() => {
  //   console.log("debouncedSearch", addressString);

  //   router.push(
  //     pathname +
  //       "?" +
  //       createQueryString(["address", "page"], [addressString, ""]),
  //   );
  // }, 500);

  return (
    <div className="flex w-full justify-between space-x-8">
      <div className="flex-1 ">
        <div className="relative">
          <input
            className="block rounded-full pl-11 pr-5 py-2.5 w-full z-20 text-lg text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300"
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
                    createQueryString(["address", "page"], [addressString, ""]),
                );
              }
            }}
          />
          <Icon
            icon="feather:search"
            className="w-6 h-6 absolute left-3 top-3"
          />
        </div>
      </div>
      <div className="flex relative">
        <div
          className="w-[300px] rounded-3xl border border-forest-400 overflow-hidden z-10 flex justify-between items-center py-2.5 px-4 text-sm font-medium text-center cursor-pointer"
          onClick={() => setChainsOpen(!chainsOpen)}
        >
          {selectedChain === "all" ? (
            <div className="flex space-x-2 items-center">
              <Image
                src="/all-chains.svg"
                alt="All Chains"
                className="flex"
                height={22}
                width={22}
                quality={100}
              />
              <div>All Chains</div>
            </div>
          ) : (
            <div className="flex space-x-2 items-center">
              <Image
                src={AllChainsByKeys[selectedChain].icon}
                alt={AllChainsByKeys[selectedChain].label}
                className="flex"
                height={22}
                width={22}
                quality={100}
              />
              <div>{AllChainsByKeys[selectedChain].label}</div>
            </div>
          )}
          <Icon icon="feather:chevron-down" className="w-4 h-4 ml-1" />
        </div>
        <div className="fixed inset-0 z-0" hidden={!chainsOpen}>
          <div
            className="absolute inset-0 z-0"
            onClick={() => setChainsOpen(false)}
          />
        </div>
        <div
          className="z-10 divide-y divide-gray-100 rounded-lg bg-forest-100 dark:bg-forest-900 absolute top-full left-0 right-0 shadow-lg"
          hidden={!chainsOpen}
        >
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
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
                height={22}
                width={22}
                quality={100}
              />
              <div>All Chains</div>
            </li>
            {master &&
              Object.keys(master.chains).map((chain) => (
                <li
                  key={chain}
                  className="flex space-x-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                  onClick={() => {
                    setSelectedChain(chain);
                    setChainsOpen(false);
                  }}
                >
                  <Image
                    src={AllChainsByKeys[chain].icon}
                    alt={AllChainsByKeys[chain].label}
                    className="flex"
                    height={22}
                    width={22}
                    quality={100}
                  />
                  <div>{AllChainsByKeys[chain].label}</div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
