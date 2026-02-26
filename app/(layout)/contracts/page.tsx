"use client";
import { useMemo, useCallback, useReducer, useState, useRef, useEffect, use } from "react";
import { ContractsURL, MasterURL } from "../../../lib/urls";
import { Contract } from "@/types/api/ContractsResponse";
import { ContractsResponse } from "@/types/api/ContractsResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { getExplorerAddressUrl } from "@/lib/helpers";
import ShowLoading from "@/components/layout/ShowLoading";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import Icon from "@/components/layout/Icon";
import Link from "next/link";
import { uniq } from "lodash";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";

// import { theme as customTheme } from "../../tailwind.config";

// const columnHelper = createColumnHelper<Contract>();

// const columns = [
//   columnHelper.accessor("address", {
//     cell: (info) => info.getValue(),
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor((row) => row.origin_key, {
//     id: "chain",
//     cell: (info) => <i>{info.getValue()}</i>,
//     header: () => <span>Chain</span>,
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("project_name", {
//     header: () => "Project Name",
//     cell: (info) => info.renderValue(),
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("contract_name", {
//     header: () => <span>Visits</span>,
//     footer: (info) => info.column.id,
//   }),
//   columnHelper.accessor("sub_category_key", {
//     header: "Status",
//     footer: (info) => info.column.id,
//   }),
// ];

export default function ContractsPage(props: { params: Promise<any> }) {
  const params = use(props.params);
  const { AllChainsByKeys } = useMaster();

  const {
    data: contracts,
    error: contractsError,
    isLoading: contractsLoading,
    isValidating: contractsValidating,
  } = useSWR<Contract[]>(ContractsURL);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const { theme } = useTheme();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      //@ts-ignore
      const params = new URLSearchParams(searchParams);
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const address = searchParams ? searchParams.get("address") : null;
  // const page = searchParams.get("page");
  const chain = searchParams ? searchParams.get("chain") : null;
  const projectName = searchParams ? searchParams.get("project_name") : null;
  const contractName = searchParams ? searchParams.get("contract_name") : null;
  const hasCategory = searchParams ? searchParams.has("category") : null;
  const category = searchParams ? searchParams.get("category") : null;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [data, setData] = useState(contracts ?? []);

  const categories = useMemo(() => {
    if (!master) return [];

    if (!hasCategory)
      return Object.keys(master.blockspace_categories.sub_categories);

    if (hasCategory && category && category.length > 0)
      return category.split(",");

    return [];
  }, [master, hasCategory, category]);

  const filterContracts = useCallback(
    (contracts: Contract[]) => {
      if (!contracts) return [];
      return contracts.filter((c) => {
        if (address && !c.address.toLowerCase().includes(address.toLowerCase()))
          return false;
        if (
          chain &&
          chain != "all" &&
          !c.origin_key.toLowerCase().includes(chain.toLowerCase())
        )
          return false;
        if (
          projectName &&
          (!c.project_name ||
            !c.project_name.toLowerCase().includes(projectName.toLowerCase()))
        )
          return false;
        if (
          contractName &&
          (!c.contract_name ||
            !c.contract_name.toLowerCase().includes(contractName.toLowerCase()))
        )
          return false;
        if (categories.length > 0) {
          if (
            c.sub_category_key &&
            !categories.includes(c.sub_category_key.toLowerCase())
          )
            return false;
          if (!c.sub_category_key && !categories.includes("unlabeled"))
            return false;
        } else {
          return false;
        }
        return true;
      });
    },
    [address, chain, projectName, contractName, categories],
  );

  useEffect(() => {
    if (contracts && contracts.length > 0) {
      setData(filterContracts(contracts));
    }
  }, [contracts, filterContracts]);

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

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        header: "Chain",
        accessorKey: "origin_key",
        size: 15,
        cell: (info: any) => {
          return (
            <div className="flex space-x-2 w-full items-center overflow-hidden whitespace-nowrap text-ellipsis">
              <Icon
                icon={`gtp:${info
                  .getValue()
                  .replace("_", "-")}-logo-monochrome`}
                style={{
                  color: AllChainsByKeys[info.getValue()].colors[theme ?? "dark"][1],
                }}
              />
              <div>{AllChainsByKeys[info.getValue()]?.label}</div>
            </div>
          );
        },
        meta: {
          headerStyle: { textAlign: "left" },
        },
      },
      {
        header: "Address",
        accessorKey: "address",
        cell: (info: any) => {
          return (
            <div className="w-full flex pr-5 justify-between items-center">
              <div className="overflow-hidden whitespace-nowrap text-ellipsis font-mono font-[300]">
                {info.getValue()}
              </div>
              {master?.chains[info.row.original.origin_key].block_explorer && (
                <Link
                  href={getExplorerAddressUrl(master?.chains[info.row.original.origin_key].block_explorer, info.getValue() as string)}
                  target="_blank"
                >
                  <Icon
                    icon="feather:link-2"
                    className="w-4 h-4 text-forest-900/80 dark:text-color-text-primary/80"
                  />
                </Link>
              )}
              {/* <div className="-left-8 absolute w-4 h-4 z-10">
                <Icon
                  icon="feather:copy"
                  className="w-4 h-4 cursor-pointer block"
                  onClick={() => {
                    navigator.clipboard.writeText(info.getValue());
                  }}
                />
              </div> */}
            </div>
          );
        },
        size: 35,
        meta: {
          headerStyle: { textAlign: "left" },
        },
        footer: (info) => info.column.id,
      },

      {
        header: `Project Name`,
        accessorKey: "project_name",
        cell: (info: any) => {
          return (
            <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
              {info.getValue()}
            </div>
          );
        },
        size: 15,
        meta: {
          headerStyle: { textAlign: "left" },
        },
      },
      {
        header: "Contract Name",
        accessorKey: "contract_name",
        cell: (info: any) => {
          return (
            <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
              {info.getValue()}
            </div>
          );
        },
        size: 15,
        meta: {
          headerStyle: { textAlign: "left" },
        },
      },
      // {
      //   id: "main_category",
      //   accessorKey: "sub_category_key",
      //   header: "Main Category",
      //   cell: (info: any) => {
      //     return (
      //       <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
      //         {getMainCategoryLabel(info.getValue())}
      //       </div>
      //     );
      //   },
      //   size: 40,
      //   meta: {
      //     style: { textAlign: "left" },
      //   },
      // },
      {
        id: "sub_category_key",
        accessorKey: "sub_category_key",
        header: "Category > Subcategory",
        cell: (info: any) => {
          return (
            <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis">
              {getMainCategoryLabel(info.getValue())} {" > "}{" "}
              {getSubcategoryLabel(info.getValue())}
            </div>
          );
        },
        size: 20,
        meta: {
          style: { textAlign: "left" },
        },
      },
    ],
    [getMainCategoryLabel, getSubcategoryLabel],
  );

  const contractsUniqueValues = useMemo(() => {
    if (!contracts) return null;
    const uniqueValues = {
      origin_key: uniq(contracts.map((d) => d.origin_key)).length,
      sub_category_key: uniq(contracts.map((d) => d.sub_category_key)).length,
      address: uniq(contracts.map((d) => d.address)).length,
      project_name: uniq(contracts.map((d) => d.project_name)).length,
      contract_name: uniq(contracts.map((d) => d.contract_name)).length,
    };

    return uniqueValues;
  }, [contracts]);

  const dataUniqueValues = useMemo(() => {
    if (!data) return null;
    const uniqueValues = {
      origin_key: uniq(data.map((d) => d.origin_key)).length,
      sub_category_key: uniq(data.map((d) => d.sub_category_key)).length,
      address: uniq(data.map((d) => d.address)).length,
      project_name: uniq(data.map((d) => d.project_name)).length,
      contract_name: uniq(data.map((d) => d.contract_name)).length,
    };

    return uniqueValues;
  }, [data]);

  const table = useReactTable<Contract>({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  });

  const exportCSV = useCallback(() => {
    const headers = Object.keys(data[0]);

    const rows = [
      headers,
      ...data.map((row) => {
        return headers.map((fieldName) => {
          return row[fieldName];
        });
      }),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);

    return encodedUri;
  }, [data]);

  const Style = useMemo(
    () => (
      <style>
        {`
        table {
            border-collapse:separate;
            border-spacing:0 5px;
            margin-top:-5px;
        }
        
        td {
            border-color: ${theme === "light" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.16)"
          };
            border-width:1px;
            border-style:solid none;
            padding:5px 10px;
        }
        
        td:first-child {
            border-left-style:solid;
            border-top-left-radius:999px;
            border-bottom-left-radius:999px;
        }
        
        td:last-child {
            border-right-style:solid;
            border-bottom-right-radius:999px;
            border-top-right-radius:999px;
        }
      `}
      </style>
    ),
    [theme ?? "dark"],
  );

  return (
    <div className="flex flex-col items-center justify-center w-full h-full pt-4 relative">
      <ShowLoading
        dataLoading={[contractsLoading, masterLoading]}
        dataValidating={[contractsValidating, masterValidating]}
      />
      {Style}
      <div className="pr-4">
        <table className="table-fixed w-full">
          {/* <thead className="sticky top-0 z-50"> */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, i) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        paddingLeft: i === 0 ? "20px" : "0px",
                        paddingRight: i === 0 ? "0px" : "0px",
                        ...(header.column.columnDef.meta as any)?.headerStyle,
                      }}
                      className="whitespace-nowrap relative"
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? `-mb-1 cursor-pointer select-none flex items-start text-forest-900 dark:text-color-text-primary text-xs font-bold ${i === 0 ? "pl-[10px]" : ""
                                }`
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: (
                                <Icon
                                  icon="feather:arrow-up"
                                  className="w-3 h-3"
                                />
                              ),
                              desc: (
                                <Icon
                                  icon="feather:arrow-down"
                                  className="w-3 h-3"
                                />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                            {contractsUniqueValues && dataUniqueValues && (
                              <div className="text-[11px] font-normal w-full text-right pr-3 font-inter">
                                {dataUniqueValues[header.id] ===
                                  contractsUniqueValues[header.id] ? (
                                  contractsUniqueValues[
                                    header.id
                                  ].toLocaleString("en-GB")
                                ) : (
                                  <>
                                    {dataUniqueValues[
                                      header.id
                                    ].toLocaleString("en-GB")}
                                    <span className="text-forest-900/30 dark:text-color-text-primary/30">
                                      {"/"}
                                      {contractsUniqueValues[
                                        header.id
                                      ].toLocaleString("en-GB")}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {contractsUniqueValues && dataUniqueValues && (
                            <div
                              className={`absolute -bottom-1.5 ${i === 0
                                ? "left-[30px] right-3"
                                : "left-0 right-3"
                                } text-xs font-normal text-right`}
                            >
                              <div
                                className="bg-forest-900 dark:bg-forest-500"
                                style={{
                                  height: "1px",
                                  width: `${(dataUniqueValues[header.id] /
                                    contractsUniqueValues[header.id]) *
                                    100.0
                                    }%`,
                                }}
                              />
                              <div
                                className="bg-forest-900/30 dark:bg-forest-500/30"
                                style={{
                                  height: "1px",
                                  width: `100%`,
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
        </table>
      </div>
      <div
        className={` 
        transition-[mask-size] duration-300 ease-in-out
         ${
          // if scroll is at top or bottom, don't show the fade
          parentRef.current &&
            (parentRef.current.scrollTop < 30 ||
              parentRef.current.scrollTop >
              parentRef.current.scrollHeight -
              parentRef.current.clientHeight -
              30)
            ? "fade-edge-div-vertical-hidden"
            : "fade-edge-div-vertical"
          }
      }`}
      >
        <div
          ref={parentRef}
          className="h-[500px] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
        >
          <div
            style={{ height: `${virtualizer.getTotalSize()}px` }}
            className="w-full"
          >
            {/* <div className="absolute top-10 left-0 right-0 h-5 z-10 bg-white dark:bg-color-ui-active" /> */}
            <table className="table-fixed w-full">
              {/* <thead className="sticky top-0 z-50"> */}
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, i) => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            height: "0px",
                            overflow: "hidden",
                            width: header.getSize(),
                            paddingLeft: i === 0 ? "20px" : "0px",
                            paddingRight: i === 0 ? "0px" : "0px",
                            ...(header.column.columnDef.meta as any)
                              ?.headerStyle,
                          }}
                          className={`${
                            // i === 0
                            //   ? "sticky top-0 z-20"
                            //   : "sticky top-0 left-0 z-30"
                            ""
                            } bg-white dark:bg-color-ui-active whitespace-nowrap`}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? `-mb-2 cursor-pointer select-none flex items-start text-forest-900 dark:text-color-text-primary text-xs font-bold h-0 ${i === 0 ? "pl-[10px]" : ""
                                  }`
                                  : "",
                                onClick:
                                  header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: (
                                  <Icon
                                    icon="feather:arrow-up"
                                    className="w-3 h-3"
                                  />
                                ),
                                desc: (
                                  <Icon
                                    icon="feather:arrow-down"
                                    className="w-3 h-3"
                                  />
                                ),
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="text-xs pb-4">
                {master &&
                  virtualizer.getVirtualItems().map((virtualRow, index) => {
                    const row = rows[virtualRow.index] as Row<Contract>;
                    return (
                      <tr
                        key={row.id}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start - index * virtualRow.size
                            }px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell, i) => {
                          return (
                            <td
                              key={cell.id}
                              style={{ paddingLeft: i === 0 ? "10px" : 0 }}
                              className={i === 0 ? "sticky left-0 z-10" : ""}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex justify-end w-full mt-4">
        <button
          className="flex items-center gap-x-2 underline text-sm"
          onClick={() => {
            window.open(exportCSV());
          }}
        >
          <Icon icon="feather:download" className="w-5 h-5" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
