import { Icon } from "@iconify/react";
import { useMemo, useEffect, useState, CSSProperties } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useContractContext } from "../layout/BlockspaceOverview/Contracts/ContractContext";
import {
  ContractContainerInterface,
  ContractInfo,
} from "../layout/BlockspaceOverview/Contracts/ContextInterface";
import ContractRow, {
  ContractRowItem,
} from "../layout/BlockspaceOverview/Contracts/ContractRow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropDownMenu";
import { Button } from "../ui/Button";
import { Checked } from "../types/common";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/Checkbox";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export default function ContractTableContainer({ columns, data }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Table>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            return (
              <TableHead key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
      {/* <TableHeader>
        <TableHeaderRow columns={columns} />
      </TableHeader>*/}
      <TableBody>
        <TableRow> Dorime</TableRow>
        {/* {(!sortOrder
          ? Object.keys(sortedContracts)
          : Object.keys(sortedContracts).reverse()
        )
          .slice(0, maxDisplayedContracts)
          .map((key, i) => (
            <ContractRowItem
              key={key}
              rowKey={key}
              i={i}
              selectedContract={selectedContract}
              sortedContracts={sortedContracts}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              setSelectedContract={setSelectedContract}
            />
          ))} */}
      </TableBody>
    </Table>
  );
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={
              column.getIsSorted() === "desc"
                ? "Sorted descending. Click to sort ascending."
                : column.getIsSorted() === "asc"
                ? "Sorted ascending. Click to sort descending."
                : "Not sorted. Click to sort ascending."
            }
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getCanSort() && column.getIsSorted() === "desc"
              ? "arrowdown"
              : column.getIsSorted() === "asc"
              ? "arrowup"
              : "caretsort"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start"></DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**TODO: Revisar antes de eliinar. Es la version v1 antes de la de arriba */
// export default function ContractTableContainer() {
//   const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
//   const { theme } = useTheme();
//   const [sortOrder, setSortOrder] = useState(true);
//   const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
//   const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(
//     null,
//   );
//   const [showMore, setShowMore] = useState(false);
//   const [contractCategory, setContractCategory] = useState("value");

//   const {
//     data,
//     selectedMode,
//     selectedCategory,
//     selectedChain,
//     selectedTimespan,
//     categories,
//     allCats,
//     timespans,
//     standardChainKey,
//     setAllCats,
//   } = useContractContext() as ContractContainerInterface;

//   const [sortedContracts, setSortedContracts] = useState<{
//     [key: string]: ContractInfo;
//   }>({});

//   const contracts = useMemo<{ [key: string]: ContractInfo }>(() => {
//     const result: { [key: string]: ContractInfo } = {};
//     for (const category of Object.keys(data)) {
//       if (data) {
//         const contractsData = allCats
//           ? (() => {
//               let contractArray = [];

//               for (const categoryKey in data[standardChainKey]["overview"][
//                 selectedTimespan
//               ]) {
//                 const categoryData =
//                   data[standardChainKey]["overview"][selectedTimespan][
//                     categoryKey
//                   ].contracts.data;

//                 // Concatenate and flatten data to the contractArray
//                 contractArray = contractArray.concat(categoryData);
//               }

//               return contractArray;
//             })()
//           : data[standardChainKey]["overview"][selectedTimespan][
//               selectedCategory
//             ].contracts.data;

//         const types =
//           data[standardChainKey]["overview"][selectedTimespan][selectedCategory]
//             .contracts.types;

//         for (const contract of Object.keys(contractsData)) {
//           const dataArray = contractsData[contract];
//           const key = dataArray[0] + dataArray[4] + dataArray[5];
//           const values = dataArray;

//           // Check if the key already exists in the result object
//           if (result.hasOwnProperty(key)) {
//             // If the key exists, update the values
//             result[key] = {
//               ...result[key],
//               address: values[types.indexOf("address")],
//               project_name: values[types.indexOf("project_name")],
//               name: values[types.indexOf("name")],
//               main_category_key: values[types.indexOf("main_category_key")],
//               sub_category_key: values[types.indexOf("sub_category_key")],
//               chain: values[types.indexOf("chain")],
//               gas_fees_absolute_eth:
//                 values[types.indexOf("gas_fees_absolute_eth")],
//               gas_fees_absolute_usd:
//                 values[types.indexOf("gas_fees_absolute_usd")],
//               gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
//               txcount_absolute: values[types.indexOf("txcount_absolute")],
//               txcount_share: values[types.indexOf("txcount_share")] ?? "",
//             };
//           } else {
//             // If the key doesn't exist, create a new entry
//             result[key] = {
//               address: values[types.indexOf("address")],
//               project_name: values[types.indexOf("project_name")],
//               name: values[types.indexOf("name")],
//               main_category_key: values[types.indexOf("main_category_key")],
//               sub_category_key: values[types.indexOf("sub_category_key")],
//               chain: values[types.indexOf("chain")],
//               gas_fees_absolute_eth:
//                 values[types.indexOf("gas_fees_absolute_eth")],
//               gas_fees_absolute_usd:
//                 values[types.indexOf("gas_fees_absolute_usd")],
//               gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
//               txcount_absolute: values[types.indexOf("txcount_absolute")],
//               txcount_share: values[types.indexOf("txcount_share")] ?? "",
//             };
//           }
//         }
//       }
//     }

//     // Update the contracts state with the new data
//     return result;
//   }, [data, selectedCategory, selectedTimespan, allCats]);

//   useEffect(() => {
//     if (!contracts) {
//       return;
//     }

//     const filteredContracts = Object.entries(contracts)
//       .filter(([key, contract]) => {
//         const isAllChainsSelected = selectedChain === null;
//         const isChainSelected =
//           isAllChainsSelected || contract.chain === selectedChain;
//         const isCategoryMatched = allCats
//           ? true
//           : contract.main_category_key === selectedCategory;
//         const isEcosystemSelected = Object.keys(data).includes(contract.chain);

//         return isChainSelected && isCategoryMatched && isEcosystemSelected;
//       })
//       .reduce((filtered, [key, contract]) => {
//         filtered[key] = contract;
//         return filtered;
//       }, {});

//     const sortFunction = (a, b) => {
//       const valueA = selectedMode.includes("gas_fees_")
//         ? showUsd
//           ? filteredContracts[a]?.gas_fees_absolute_usd
//           : filteredContracts[a]?.gas_fees_absolute_eth
//         : filteredContracts[a]?.txcount_absolute;

//       const valueB = selectedMode.includes("gas_fees_")
//         ? showUsd
//           ? filteredContracts[b]?.gas_fees_absolute_usd
//           : filteredContracts[b]?.gas_fees_absolute_eth
//         : filteredContracts[b]?.txcount_absolute;

//       // Compare the values
//       return valueA - valueB;
//     };

//     const sortedResult = Object.keys(filteredContracts).sort((a, b) => {
//       if (contractCategory === "contract") {
//         return (
//           filteredContracts[a]?.name || filteredContracts[a]?.address
//         ).localeCompare(
//           filteredContracts[b]?.name || filteredContracts[b]?.address,
//         );
//       } else if (contractCategory === "category") {
//         return filteredContracts[a]?.main_category_key.localeCompare(
//           filteredContracts[b]?.main_category_key,
//         );
//       } else if (
//         contractCategory === "subcategory" &&
//         selectedCategory !== "unlabeled"
//       ) {
//         return filteredContracts[a]?.sub_category_key.localeCompare(
//           filteredContracts[b]?.sub_category_key,
//         );
//       } else if (contractCategory === "chain") {
//         return filteredContracts[a]?.chain.localeCompare(
//           filteredContracts[b]?.chain,
//         );
//       } else if (contractCategory === "value" || contractCategory === "share") {
//         return sortFunction(a, b);
//       }
//     });

//     const sortedContractsObj = sortedResult.reduce((acc, key) => {
//       acc[key] = filteredContracts[key];
//       return acc;
//     }, {});

//     if (
//       selectedCategory === "unlabeled" &&
//       (contractCategory === "category" || contractCategory === "subcategory")
//     ) {
//       setSortedContracts(sortedContractsObj);
//     } else {
//       setSortedContracts(sortedContractsObj);
//     }
//   }, [
//     contractCategory,
//     contracts,
//     selectedCategory,
//     selectedChain,
//     selectedMode,
//     showUsd,
//   ]);

//   return (
//     <Table>
//       <TableHeader>
//         <TableRow>
//           <TableHead className="w-[38%]">Operator Address</TableHead>
//           <TableHead className="w-[15%]">Operator Name</TableHead>
//           <TableHead className="w-[20%]">
//             <CheckboxDropdownMenu
//               btnName={"Category"}
//               dropdownMenuLabel={"Category"}
//             />
//           </TableHead>
//           <TableHead className="w-[20%]">
//             <CheckboxDropdownMenu
//               btnName={"Subcategory"}
//               dropdownMenuLabel={"Subcategory"}
//             />
//           </TableHead>
//           <TableHead className="w-[15%]">Date Deployed</TableHead>
//           {/* <TableCell className="w-[20%]">
//             {selectedMode.includes("gas_fees")
//               ? "Gas Fees"
//               : "Transaction Count"}
//             <p className="font-normal">({timespans[selectedTimespan].label})</p>
//           </TableCell>
//           <TableCell>Block Explorer</TableCell> */}
//         </TableRow>
//       </TableHeader>
//       <TableBody>
//         {(!sortOrder
//           ? Object.keys(sortedContracts)
//           : Object.keys(sortedContracts).reverse()
//         )
//           .slice(0, maxDisplayedContracts)
//           .map((key, i) => (
//             <ContractRowItem
//               key={key}
//               rowKey={key}
//               i={i}
//               selectedContract={selectedContract}
//               sortedContracts={sortedContracts}
//               sortOrder={sortOrder}
//               setSortOrder={setSortOrder}
//               setSelectedContract={setSelectedContract}
//             />
//           ))}
//       </TableBody>
//     </Table>
//   );
// }
