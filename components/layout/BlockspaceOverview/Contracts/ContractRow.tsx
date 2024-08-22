import { useContractContext } from "./ContractContext";
import { Icon } from "@iconify/react";
import { useMemo, useEffect, useState, CSSProperties } from "react";
import { AllChainsByKeys } from "@/lib/chains";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { ContractRowInterface } from "./ContextInterface";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../Tooltip";
import ContractLabelModal from "../../ContractLabelModal";
import { ContractInfo } from "./ContextInterface";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropDownMenu";
import { Button } from "@/components/ui/Button";
import { Checked } from "@/components/types/common";

export default function ContractRow({
  rowKey,
  i,
  selectedContract,
  sortedContracts,
  sortOrder,
  setSortOrder,
  setSelectedContract,
}: {
  rowKey: string;
  i: number;
  selectedContract: ContractInfo | null;
  sortedContracts: Object;
  sortOrder: boolean;
  setSortOrder: (order: boolean) => void;
  setSelectedContract: (contract: ContractInfo | null) => void;
}) {
  const [copyContract, setCopyContract] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("nft");
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const {
    data,
    master,
    selectedMode,
    selectedCategory,
    selectedTimespan,
    selectedValue,
    setSelectedCategory,
    formatSubcategories,
  } = useContractContext() as ContractRowInterface;

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    for (const contract of Object.values(sortedContracts)) {
      const value = selectedMode.includes("gas_fees_")
        ? showUsd
          ? contract.gas_fees_absolute_usd
          : contract.gas_fees_absolute_eth
        : contract.txcount_absolute;

      retValue = Math.max(retValue, value);
    }

    return retValue;
  }, [selectedMode, sortedContracts, showUsd]);

  // Usage: largestChainValue["optimism"] will give you the largest value for the "optimism" chain

  function getWidth(x) {
    let retValue = "0%";

    if (selectedMode.includes("gas_fees")) {
      if (showUsd) {
        retValue =
          String(
            (
              (x.gas_fees_absolute_usd.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      } else {
        retValue =
          String(
            (
              (x.gas_fees_absolute_eth.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      }
    } else {
      retValue =
        String(((x.txcount_absolute / largestContractValue) * 100).toFixed(1)) +
        "%";
    }

    return retValue;
  }

  return (
    <>
      {selectedContract &&
        selectedContract.address === sortedContracts[rowKey].address && (
          <div key={rowKey + "" + sortOrder}>
            <div className="flex rounded-[27px] bg-forest-50 dark:bg-[#1F2726] border-forest-200 dark:border-forest-500 border mt-[7.5px] group relative z-[100]">
              <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
                <div className="w-full h-full rounded-[27px] overflow-clip">
                  <div className="relative w-full h-full">
                    <div
                      className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                      style={{
                        background:
                          AllChainsByKeys[sortedContracts[rowKey].chain].colors[
                            theme ?? "dark"
                          ][1],
                        width: getWidth(sortedContracts[rowKey]),
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center w-full h-full pl-[15px] pr-[30px] py-[10px] space-y-[15px]">
                <div className="flex space-x-[26px] items-center w-full">
                  <div>
                    <Icon icon="gtp:add-tag" className="w-[34px] h-[34px]" />
                  </div>
                  <div className="text-[16px]">
                    Suggested label for contract{" "}
                    <i>{selectedContract.address}</i>
                  </div>
                </div>
                <form
                  className="flex flex-col space-y-[5px] items-start justify-center w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as any);

                    setIsFormSubmitting(true);

                    const res = fetch("/api/contracts", {
                      method: "POST",
                      body: formData,
                    })
                      .then((res) => res.json())
                      .finally(() => {
                        setIsFormSubmitting(false);
                        setSelectedContract(null);
                      });
                  }}
                >
                  <input
                    type="hidden"
                    name="address"
                    value={selectedContract.address}
                  />
                  <input
                    type="hidden"
                    name="chain"
                    value={selectedContract.chain}
                  />
                  <div className="flex space-x-[26px] items-center w-full">
                    <Icon
                      icon={`gtp:${selectedContract.chain.replace(
                        "_",
                        "-",
                      )}-logo-monochrome`}
                      className="w-[34px] h-[34px]"
                      style={{
                        color:
                          AllChainsByKeys[selectedContract.chain].colors[
                            theme ?? "dark"
                          ][1],
                      }}
                    />
                    <div className="flex space-x-[15px] items-center w-full">
                      <div className="relative w-[33%]">
                        <input
                          type="text"
                          className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                          placeholder="Contract Name"
                          name="name"
                        />
                        <div className="absolute right-0.5 top-0.5">
                          <Tooltip placement="top">
                            <TooltipTrigger>
                              <Icon
                                icon="feather:info"
                                className="w-6 h-6 text-forest-900 dark:text-forest-500"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="z-[110]">
                              <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                <div className="font-medium">
                                  This is the Contract name.
                                </div>
                                <div>
                                  It should be the name of the contract, not the
                                  name of the project.
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="relative w-[33%]">
                        <input
                          type="text"
                          className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                          placeholder="Project Name"
                          name="project_name"
                        />
                        <div className="absolute right-0.5 top-0.5">
                          <Tooltip placement="top">
                            <TooltipTrigger>
                              <Icon
                                icon="feather:info"
                                className="w-6 h-6 text-forest-900 dark:text-forest-500"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="z-[110]">
                              <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                <div className="font-medium">
                                  This is the Project name.
                                </div>
                                <div>
                                  It should be the name of the project, not the
                                  name of the contract.
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="relative w-[16%]">
                        <select
                          className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                          name="main_category_key"
                          onChange={(e) => {
                            setLabelFormMainCategoryKey(e.target.value);
                          }}
                        >
                          <option value="" disabled selected>
                            Category
                          </option>
                          {master &&
                            Object.keys(
                              master.blockspace_categories.main_categories,
                            ).map((key) => (
                              <option
                                key={key}
                                value={key}
                                className="bg-forest-50 dark:bg-[#1F2726]"
                              >
                                {
                                  master.blockspace_categories.main_categories[
                                    key
                                  ]
                                }
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="relative w-[16%]">
                        <select
                          className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                          name="sub_category_key"
                        >
                          <option value="" disabled selected>
                            Category
                          </option>
                          {labelFormMainCategoryKey &&
                            master &&
                            master.blockspace_categories["mapping"][
                              labelFormMainCategoryKey
                            ].map((key) => (
                              <option
                                key={key}
                                value={key}
                                className="bg-forest-50 dark:bg-[#1F2726]"
                              >
                                {formatSubcategories(key)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="pl-[50px] flex flex-col space-y-[5px] text-[14px] items-start justify-center w-full ml-2 pt-[15px]">
                    <div>Please add your details to participate in ...</div>
                    <div className="flex space-x-[15px] items-center w-full">
                      <input
                        type="text"
                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                        placeholder="X Handle (formerly Twitter)"
                        name="twitter_handle"
                      />
                      <input
                        type="text"
                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                        placeholder="Source (optional)"
                        name="source"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-[15px] items-start justify-center w-full font-medium pt-[15px]">
                    <button
                      className="px-[16px] py-[6px] rounded-full border border-forest-900 dark:border-forest-500 text-forest-900 dark:text-forest-500"
                      onClick={() => setSelectedContract(null)}
                      disabled={isFormSubmitting}
                    >
                      Cancel
                    </button>
                    <button className="px-[16px] py-[6px] rounded-full bg-[#F0995A] text-forest-900">
                      {isFormSubmitting ? (
                        <Icon
                          icon="feather:loader"
                          className="w-4 h-4 animate-spin"
                        />
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      <div key={rowKey + "" + sortOrder}>
        <div className="flex rounded-full border-forest-200 dark:border-forest-500 border h-[60px] mt-[7.5px] group hover:bg-forest-300 hover:dark:bg-forest-800 relative">
          <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
            <div className="w-full h-full rounded-full overflow-clip">
              <div className="relative w-full h-full">
                <div
                  className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                  style={{
                    background:
                      AllChainsByKeys[sortedContracts[rowKey].chain].colors[
                        theme ?? "dark"
                      ][1],
                    width: getWidth(sortedContracts[rowKey]),
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex w-[100%] items-center ml-4 mr-8">
            <div className="flex items-center h-10 !w-[40%] relative">
              <div className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-4 bg-gradient-to-r from-transparent to-forest-300 dark:to-forest-800 z-10"></div>
              <div className="flex-none mr-[36px]">
                <Icon
                  icon={`gtp:${sortedContracts[rowKey].chain.replace(
                    "_",
                    "-",
                  )}-logo-monochrome`}
                  className="w-[29px] h-[29px]"
                  style={{
                    color:
                      AllChainsByKeys[sortedContracts[rowKey].chain].colors[
                        theme ?? "dark"
                      ][1],
                  }}
                />
              </div>
              <div className="flex flex-grow">
                <div
                  className={`flex flex-none items-center space-x-2 w-0 ${
                    copyContract ? " delay-1000" : ""
                  } overflow-clip transition-all duration-200 ease-in-out ${
                    sortedContracts[rowKey].name &&
                    sortedContracts[rowKey].project_name
                      ? "group-hover:w-[48px]"
                      : "group-hover:w-[96px]"
                  }`}
                >
                  {!(
                    sortedContracts[rowKey].name &&
                    sortedContracts[rowKey].project_name
                  ) && (
                    <div
                      className="rounded-full p-2 bg-forest-50 dark:bg-forest-1000 text-black dark:text-white cursor-pointer"
                      onClick={() => {
                        setSelectedContract(sortedContracts[rowKey]);
                        setIsContractLabelModalOpen(true);
                      }}
                    >
                      <Icon icon="gtp:add-tag" className="w-6 h-6" />
                    </div>
                  )}
                  <div
                    className={`rounded-full p-2 ${
                      copyContract
                        ? "bg-forest-50/60 dark:bg-forest-1000/60"
                        : "bg-forest-50 dark:bg-forest-1000"
                    } text-white cursor-pointer`}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        sortedContracts[rowKey].address,
                      );
                      setCopyContract(true);
                      setTimeout(() => {
                        setCopyContract(false);
                      }, 1000);
                    }}
                  >
                    {!copyContract && (
                      <Icon icon="feather:copy" className="w-5 h-5" />
                    )}
                    {copyContract && (
                      <Icon icon="feather:check" className="w-5 h-5" />
                    )}
                  </div>
                </div>
                <div
                  className={`flex flex-col flex-grow h-full justify-start text-ellipsis overflow-hidden whitespace-nowrap `}
                >
                  {sortedContracts[rowKey].name ||
                  sortedContracts[rowKey].project_name ? (
                    <>
                      <div
                        className={`min-w-full max-w-full text-base ${
                          sortedContracts[rowKey].project_name
                            ? "font-bold"
                            : "opacity-30 italic"
                        }`}
                      >
                        {sortedContracts[rowKey].project_name
                          ? sortedContracts[rowKey].project_name
                          : "Project Label Missing"}
                      </div>

                      <div
                        className={`min-w-full max-w-full text-sm ${
                          sortedContracts[rowKey].name
                            ? ""
                            : "opacity-30 italic"
                        }`}
                      >
                        {sortedContracts[rowKey].name
                          ? sortedContracts[rowKey].name
                          : "Contract Label Missing"}
                      </div>
                    </>
                  ) : (
                    <div className="min-w-full max-w-full text-base opacity-30 italic">
                      {sortedContracts[rowKey].address.substring(0, 6) +
                        "..." +
                        sortedContracts[rowKey].address.substring(36, 42)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center text-[14px] !w-[15%] justify-start h-full z-10">
              <div className="flex w-[40%]">
                {master &&
                  master.blockspace_categories.main_categories[
                    sortedContracts[rowKey].main_category_key
                  ]}
              </div>
              <div className="flex">
                {master &&
                master.blockspace_categories.sub_categories[
                  sortedContracts[rowKey].sub_category_key
                ]
                  ? master.blockspace_categories.sub_categories[
                      sortedContracts[rowKey].sub_category_key
                    ]
                  : "Unlabeled"}
              </div>
            </div>
            <div className="flex items-center !w-[20%]  mr-4">
              <div className="flex flex-col w-[38%] items-end ">
                <div className="flex gap-x-1 w-[110px] justify-end  ">
                  <div className="flex">
                    {selectedMode.includes("gas_fees_")
                      ? showUsd
                        ? `$`
                        : `Ξ`
                      : ""}
                  </div>
                  {selectedMode.includes("gas_fees_")
                    ? showUsd
                      ? Number(
                          sortedContracts[rowKey].gas_fees_absolute_usd.toFixed(
                            0,
                          ),
                        ).toLocaleString("en-GB")
                      : Number(
                          sortedContracts[rowKey].gas_fees_absolute_eth.toFixed(
                            2,
                          ),
                        ).toLocaleString("en-GB")
                    : Number(
                        sortedContracts[rowKey].txcount_absolute.toFixed(0),
                      ).toLocaleString("en-GB")}
                </div>
              </div>

              <div className="flex items-center w-[57%] justify-end ">
                {master && (
                  <Link
                    href={
                      master.chains[sortedContracts[rowKey].chain]
                        .block_explorer +
                      "address/" +
                      sortedContracts[rowKey].address
                    }
                    target="_blank"
                  >
                    <Icon
                      icon="material-symbols:link"
                      className="w-[30px] h-[30px]"
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ContractRowItem({
  rowKey,
  i,
  selectedContract,
  sortedContracts,
  sortOrder,
  setSortOrder,
  setSelectedContract,
}: {
  rowKey: string;
  i: number;
  selectedContract: ContractInfo | null;
  sortedContracts: Object;
  sortOrder: boolean;
  setSortOrder: (order: boolean) => void;
  setSelectedContract: (contract: ContractInfo | null) => void;
}) {
  const [copyContract, setCopyContract] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("nft");
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const {
    data,
    master,
    selectedMode,
    selectedCategory,
    selectedTimespan,
    selectedValue,
    setSelectedCategory,
    formatSubcategories,
  } = useContractContext() as ContractRowInterface;

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    for (const contract of Object.values(sortedContracts)) {
      const value = selectedMode.includes("gas_fees_")
        ? showUsd
          ? contract.gas_fees_absolute_usd
          : contract.gas_fees_absolute_eth
        : contract.txcount_absolute;

      retValue = Math.max(retValue, value);
    }

    return retValue;
  }, [selectedMode, sortedContracts, showUsd]);

  function getWidth(x) {
    let retValue = "0%";

    if (selectedMode.includes("gas_fees")) {
      if (showUsd) {
        retValue =
          String(
            (
              (x.gas_fees_absolute_usd.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      } else {
        retValue =
          String(
            (
              (x.gas_fees_absolute_eth.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      }
    } else {
      retValue =
        String(((x.txcount_absolute / largestContractValue) * 100).toFixed(1)) +
        "%";
    }

    return retValue;
  }

  return (
    <TableRow key={rowKey}>
      {/* Operator Address */}
      <TableCell className="flex items-center">
        <span className="flex gap-8">
          <Icon
            icon={`gtp:${sortedContracts[rowKey].chain.replace(
              "_",
              "-",
            )}-logo-monochrome`}
            className="w-[29px] h-[29px]"
            style={{
              color:
                AllChainsByKeys[sortedContracts[rowKey].chain].colors[
                  theme ?? "dark"
                ][1],
            }}
          />
          0x0000000000000000000000000000000000000066
        </span>
        <div
          className={`rounded-full p-2 ${
            copyContract
              ? "bg-forest-50/60 dark:bg-forest-1000/60"
              : "bg-forest-50 dark:bg-forest-1000"
          } text-white cursor-pointer`}
          onClick={() => {
            navigator.clipboard.writeText(sortedContracts[rowKey].address);
            setCopyContract(true);
            setTimeout(() => {
              setCopyContract(false);
            }, 1000);
          }}
        >
          {!copyContract && <Icon icon="feather:copy" className="w-5 h-5" />}
          {copyContract && <Icon icon="feather:check" className="w-5 h-5" />}
        </div>
      </TableCell>

      {/* Operator Name */}
      <TableCell>
        {sortedContracts[rowKey].name ||
        sortedContracts[rowKey].project_name ? (
          <>
            <div
              className={`flex items-center min-w-full max-w-full text-base ${
                sortedContracts[rowKey].project_name
                  ? "font-bold"
                  : "opacity-30 italic"
              }`}
            >
              {sortedContracts[rowKey].project_name
                ? sortedContracts[rowKey].project_name
                : "Project Label Missing"}
              <div
                className={`rounded-full p-2 ${
                  copyContract
                    ? "bg-forest-50/60 dark:bg-forest-1000/60"
                    : "bg-forest-50 dark:bg-forest-1000"
                } text-white cursor-pointer`}
                onClick={() => {
                  navigator.clipboard.writeText(
                    sortedContracts[rowKey].address,
                  );
                  setCopyContract(true);
                  setTimeout(() => {
                    setCopyContract(false);
                  }, 1000);
                }}
              >
                <Icon icon="feather:plus" className="w-5 h-5" />
              </div>
            </div>
          </>
        ) : (
          <div className="min-w-full max-w-full text-base opacity-30 italic">
            {sortedContracts[rowKey].address.substring(0, 6) +
              "..." +
              sortedContracts[rowKey].address.substring(36, 42)}
          </div>
        )}
      </TableCell>

      {/* Category */}
      <TableCell className="flex items-center">
        <CheckboxDropdownMenu />
      </TableCell>

      {/* Subcategory */}
      <TableCell className="">
        <CheckboxDropdownMenu />
      </TableCell>

      {/* Date Deployed */}
      <TableCell className="">15 Mar 2024</TableCell>

      <TableCell className=""></TableCell>
    </TableRow>
  );
}

const CheckboxDropdownMenu = () => {
  const [showStatusBar, setShowStatusBar] = useState<Checked>(true);
  const [showPanel, setShowPanel] = useState<Checked>(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Open
          <Icon icon="feather:plus" className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[black]">
        <DropdownMenuLabel>Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
        >
          Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showPanel}
          onCheckedChange={setShowPanel}
        >
          Panel
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
