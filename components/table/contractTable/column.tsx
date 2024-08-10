"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@iconify/react";
import { ColumnDef } from "@tanstack/react-table";
import { Chains } from "@/types/api/ChainOverviewResponse";

export type Chain = {
  icon: string;
  address: number;
  name: string;
  category: string;
  subcategory: string;
  date_deployed: string;
};

export const columns: ColumnDef<Chains>[] = [
  // {
  //   accessorKey: "icon",
  //   header: "",
  // },
  {
    accessorKey: "Operator Address",
    header: "Operator Address",
    cell: ({ row }) => {
      const address = row.getValue("Operator Address") as string;

      return (
        <div className="flex items-center">
          {address}
          <Button
            variant="ghost"
            className="bg-transparent border-none p-0 ml-2"
            onClick={() => navigator.clipboard.writeText(address)}
            aria-label={"Copy completed"}
          >
            <Icon
              icon="feather:copy"
              className="w-5 h-5"
              aria-hidden="true"
            ></Icon>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "Operator Name",
    header: "Operator Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;

      return (
        <div className="flex items-center">
          {name}
          <Button
            variant="ghost"
            className="bg-transparent border-none p-0 ml-2"
            onClick={() => console.log("Copiado")}
            aria-label={"Copy completed"}
          >
            <Icon
              icon="feather:plus"
              className="w-5 h-5"
              aria-hidden="true"
            ></Icon>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "Market Share",
    header: ({ column }) => {
      return (
        <Button
          variant="outline"
          className="bg-transparent border-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={
            column.getIsSorted() === "desc"
              ? "Sorted descending. Click to sort ascending."
              : column.getIsSorted() === "asc"
              ? "Sorted ascending. Click to sort descending."
              : "Not sorted. Click to sort ascending."
          }
        >
          Market Shared
          <span className="ml-2">
            {column.getCanSort() && column.getIsSorted() === "desc" ? (
              <Icon
                icon="feather:arrow-down"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : column.getIsSorted() === "asc" ? (
              <Icon
                icon="feather:arrow-up"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : (
              // <Icon
              //   icon="feather:minus"
              //   className="w-5 h-5"
              //   aria-hidden="true"
              // />
              <></>
            )}
          </span>
        </Button>
      );
    },
    // cell: ({ row }) => {
    //   const value = row.getValue("market-shared") as string;

    //   return (
    //     <>
    //       <Button
    //         variant="ghost"
    //         className="bg-transparent border-none"
    //         onClick={() => console.log("Copiado")}
    //         aria-label={"Copy completed"}
    //       >
    //         <Icon
    //           icon="feather:circle"
    //           className="w-5 h-5 mr-2"
    //           aria-hidden="true"
    //         ></Icon>
    //         {value}
    //         <Icon
    //           icon="feather:plus"
    //           className="w-5 h-5 ml-2 color-[#36413F] bg-[#96A09C] rounded-full"
    //           aria-hidden="true"
    //         ></Icon>
    //       </Button>
    //     </>
    //   );
    // },
  },
  {
    accessorKey: "ETH Restaked",
    header: ({ column }) => {
      return (
        <Button
          variant="outline"
          className="bg-transparent border-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={
            column.getIsSorted() === "desc"
              ? "Sorted descending. Click to sort ascending."
              : column.getIsSorted() === "asc"
              ? "Sorted ascending. Click to sort descending."
              : "Not sorted. Click to sort ascending."
          }
        >
          ETH Restaked
          <span className="ml-2">
            {column.getCanSort() && column.getIsSorted() === "desc" ? (
              <Icon
                icon="feather:arrow-down"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : column.getIsSorted() === "asc" ? (
              <Icon
                icon="feather:arrow-up"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : (
              <></>
            )}
          </span>
        </Button>
      );
    },
    cell: ({ row }) => {
      const subcategory = row.getValue("ETH Restaked") as string;

      return (
        <>
          <div
            className="text-center"
            onClick={() => console.log("Copiado")}
            aria-label={"Copy completed"}
          >
            {subcategory}
            {/* <Icon
              icon="feather:plus"
              className="w-5 h-5 ml-2 color-[#36413F] bg-[#96A09C] rounded-full"
              aria-hidden="true"
            ></Icon> */}
          </div>
        </>
      );
    },
  },
  {
    accessorKey: "Number of Strategies",
    header: ({ column }) => {
      return (
        <Button
          variant="outline"
          className="bg-transparent border-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={
            column.getIsSorted() === "desc"
              ? "Sorted descending. Click to sort ascending."
              : column.getIsSorted() === "asc"
              ? "Sorted ascending. Click to sort descending."
              : "Not sorted. Click to sort ascending."
          }
        >
          Number of Strategies
          <span className="ml-2">
            {column.getCanSort() && column.getIsSorted() === "desc" ? (
              <Icon
                icon="feather:arrow-down"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : column.getIsSorted() === "asc" ? (
              <Icon
                icon="feather:arrow-up"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : (
              <></>
            )}
          </span>
        </Button>
      );
    },
  },
  {
    accessorKey: "Most Used Strategy",
    header: ({ column }) => {
      return (
        <Button
          variant="outline"
          className="bg-transparent border-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={
            column.getIsSorted() === "desc"
              ? "Sorted descending. Click to sort ascending."
              : column.getIsSorted() === "asc"
              ? "Sorted ascending. Click to sort descending."
              : "Not sorted. Click to sort ascending."
          }
        >
          Most Used Strategies
          <span className="ml-2">
            {column.getCanSort() && column.getIsSorted() === "desc" ? (
              <Icon
                icon="feather:arrow-down"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : column.getIsSorted() === "asc" ? (
              <Icon
                icon="feather:arrow-up"
                className="w-5 h-5"
                aria-hidden="true"
              />
            ) : (
              <></>
            )}
          </span>
        </Button>
      );
    },
  },
  // {
  //   accessorKey: "date_deployed",
  //   header: () => <div>Date Deployed</div>,
  //   cell: ({ row }) => {
  //     const date = row.getValue("date_deployed") as string;
  //     const dateFormated = new Date(date).toLocaleDateString("es-ES");

  //     return <div>{dateFormated}</div>;
  //   },
  // },
];
