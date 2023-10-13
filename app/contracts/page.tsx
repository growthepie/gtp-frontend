"use client";
import { useMemo, useCallback } from "react";
import { ContractsURL } from "../../lib/urls";
import { Contract } from "../../types/api/ContractsResponse";
import { ContractsResponse } from "../../types/api/ContractsResponse";
import ShowLoading from "@/components/layout/ShowLoading";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function ContractsPage({ params }: { params: any }) {
  const {
    data: contracts,
    error: contractsError,
    isLoading: contractsLoading,
    isValidating: contractsValidating,
  } = useSWR<ContractsResponse>(ContractsURL);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const address = searchParams.get("address");
  const page = searchParams.get("page");
  const chain = searchParams.get("chain");

  const pageSize = 10;

  const queryPage = page ? parseInt(page) : 1;

  const queryAddress = address ? address.toString() : "";

  const queryChain = chain ? chain.toString() : "all";

  const results = useMemo(() => {
    if (!contracts) return [];
    if (address && chain && chain !== "all") {
      return contracts.filter((c) => {
        return (
          c.address.toLowerCase().includes(address.toLowerCase()) &&
          c.origin_key.toLowerCase().includes(chain.toLowerCase())
        );
      });
    }
    if (chain && chain !== "all") {
      return contracts.filter((c) => {
        return c.origin_key.toLowerCase().includes(chain.toLowerCase());
      });
    }
    if (address) {
      return contracts.filter((c) => {
        return c.address.toLowerCase().includes(address.toLowerCase());
      });
    }
    return contracts;
  }, [contracts, address, chain]);

  interface Contract {
    address: string;
    contract_name: string;
    project_name: string;
    sub_category_key: string;
    origin_key: string;
  }

  return (
    <>
      <ShowLoading
        dataLoading={[contractsLoading]}
        dataValidating={[contractsValidating]}
      />

      <table className="table-fixed w-full mt-4">
        <thead>
          <tr>
            <th className="pl-8 text-left w-[30%]">Address</th>
            <th className="pl-2 text-left w-[20%]">Contract Name</th>
            <th className="pl-2 text-left w-[20%]">Project Name</th>
            <th className="pl-2 text-left w-[20%]">Subcategory Key</th>
            <th className="pl-2 pr-8 text-left w-[10%]">Chain</th>
          </tr>
        </thead>
        <tbody>
          {contracts &&
            results
              .slice(
                (queryPage - 1) * pageSize,
                (queryPage - 1) * pageSize + pageSize,
              )
              .map((contract) => (
                <tr key={contract.address}>
                  <td className="px-0 pb-[5px] w-[30%]">
                    <div className="p-2 pl-8 rounded-l-full border-l border-t border-b border-forest-400 h-[42px] block w-full whitespace-nowrap overflow-hidden text-ellipsis">
                      {contract.address}
                    </div>
                  </td>
                  <td className="px-0 pb-[5px] w-[20%]">
                    <div className="p-2 border-t border-b border-forest-400 h-[42px] block w-full whitespace-nowrap overflow-hidden text-ellipsis">
                      {contract.contract_name}
                    </div>
                  </td>
                  <td className="px-0 pb-[5px] w-[20%]">
                    <div className="p-2 border-t border-b border-forest-400 h-[42px] block w-full whitespace-nowrap overflow-hidden text-ellipsis">
                      {contract.project_name}
                    </div>
                  </td>
                  <td className="px-0 pb-[5px] w-[20%]">
                    <div className="p-2 border-t border-b border-forest-400 h-[42px]">
                      {contract.sub_category_key}
                    </div>
                  </td>
                  <td className="px-0 pb-[5px] w-[10%]">
                    <div className="p-2 pr-8 rounded-r-full border-r border-t border-b border-forest-400 h-[42px]">
                      {contract.origin_key}
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>
              <div className="flex justify-center text-xs text-gray-400">
                {contracts && results.length > 0
                  ? `Showing ${queryPage * pageSize - pageSize + 1} to ${
                      queryPage * pageSize
                    } of ${results.length} results`
                  : "No results found for search"}
              </div>
              <div className="flex justify-center">
                <div className="flex rounded-md mt-2">
                  {contracts && (
                    <div className="flex items-center">
                      <button
                        disabled={queryPage <= 1}
                        className="px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        onClick={() => {
                          if (queryPage > 1) {
                            router.push(
                              pathname +
                                "?" +
                                createQueryString(
                                  "page",
                                  (queryPage - 1).toString(),
                                ),
                              { scroll: false },
                            );
                          }
                        }}
                      >
                        Previous
                      </button>
                      <div className="px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page{" "}
                        {results.length > 0
                          ? `${queryPage} of ${Math.ceil(
                              results.length / pageSize,
                            )}`
                          : "0 of 0"}
                      </div>
                      <button
                        disabled={queryPage >= results.length / pageSize}
                        className="px-3 py-2 border border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        onClick={() => {
                          if (queryPage < results.length / pageSize) {
                            router.push(
                              pathname +
                                "?" +
                                createQueryString(
                                  "page",
                                  (queryPage + 1).toString(),
                                ),
                              { scroll: false },
                            );
                          }
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}
