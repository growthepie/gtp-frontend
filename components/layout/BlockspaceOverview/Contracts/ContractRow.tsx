"use client";
import { useContractContext } from "./ContractContext";
import { Icon } from "@iconify/react";
import { useMemo, useEffect, useState, CSSProperties } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../Tooltip";
import ContractLabelModal from "../../ContractLabelModal";
import { ContractInfo } from "./ContextInterface";
import { LabelsProjectsResponse } from "@/types/Labels/ProjectsResponse";
import useSWR from "swr";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { getExplorerAddressUrl } from "@/lib/helpers";
import { LabelsURLS, LandingURL, MasterURL } from "@/lib/urls";

import {
  GridTableChainIcon,
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { GTPApplicationTooltip, GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { Category } from "@/app/(layout)/applications/_components/Components";

export default function ContractRow({
  rowKey,
  i,
  selectedContract,
  sortedContracts,
  setSelectedContract,
}: {
  rowKey: string;
  i: number;
  selectedContract: ContractInfo | null;
  sortedContracts: Object;
  setSelectedContract: (contract: ContractInfo | null) => void;
}) {
  const { AllChainsByKeys } = useMaster();
  const { projectNameToProjectData } = useProjectsMetadata();
  const [copyContract, setCopyContract] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("collectibles");
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const {
    master,
    selectedMode,
    formatSubcategories,
  } = useContractContext();


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

  const { data: projectsData } = useSWR<LabelsProjectsResponse>(
    LabelsURLS.projects,
  );

  const ownerProjectDisplayNameToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let displayNameIndex = projectsData.data.types.indexOf("display_name");

    if (displayNameIndex === -1) return {};

    let d = {};

    projectsData.data.data.forEach((project) => {
      if (project[displayNameIndex] !== null)
        d[project[displayNameIndex]] = project;
    });

    return d;
  }, [projectsData]);

  return (
    <>
      {selectedContract &&
        selectedContract.address === sortedContracts[rowKey].address && (
          <div key={rowKey + "-labelform"}>
            <div className="flex rounded-[27px]  mt-[7.5px] group relative z-[100]">
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
                                className="w-6 h-6 text-forest-900 dark:text-color-text-primary"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="z-[110]">
                              <div className="p-3 text-sm bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
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
                                className="w-6 h-6 text-forest-900 dark:text-color-text-primary"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="z-[110]">
                              <div className="p-3 text-sm bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
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
                                className="bg-forest-50 dark:bg-color-bg-default"
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
                                className="bg-forest-50 dark:bg-color-bg-default"
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
                      className="px-[16px] py-[6px] rounded-full border border-forest-900 dark:border-forest-500 text-forest-900 dark:text-color-text-primary"
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

      <GridTableRow
        key={rowKey}
        gridDefinitionColumns="grid-cols-[20px,280px,150px,115px,minmax(195px,800px),130px] relative"
        className="group text-[12px] h-[34px] inline-grid transition-all duration-300 gap-x-[15px] mb-[3px] !py-0"
      >
        <GridTableChainIcon origin_key={sortedContracts[rowKey].chain} />

        {/* Contract Name and Address */}
        <div className="flex justify-between gap-x-[10px]">
          {sortedContracts[rowKey].name ? (
            <div className="truncate">{sortedContracts[rowKey].name}</div>
          ) : (
            <div className="truncate font-mono">
              {sortedContracts[rowKey].address}
            </div>
          )}
          <div className="flex items-center gap-x-[5px]">
            <div className="h-[15px] w-[15px]">
              <div
                className="group flex items-center cursor-pointer gap-x-[5px] text-xs"
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
                <Icon
                  icon={copyContract ? "feather:check" : "feather:copy"}
                  className="w-[14px] h-[14px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                />
              </div>
            </div>
            <Link
              href={getExplorerAddressUrl(master.chains[sortedContracts[rowKey].chain].block_explorer, sortedContracts[rowKey].address)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon
                icon="gtp:gtp-block-explorer-alt"
                className="w-[14px] h-[14px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              />
            </Link>
          </div>
        </div>

        {/* Application Name */}
        <div className="flex justify-between min-w-0 items-center h-full">
          {sortedContracts[rowKey].project_name ? (
            <GTPTooltipNew
              placement="bottom-start"
              allowInteract={true}
              trigger={
                projectNameToProjectData[sortedContracts[rowKey].project_name] && projectNameToProjectData[sortedContracts[rowKey].project_name].on_apps_page ? (
                  <Link
                    href={`/applications/${projectNameToProjectData[sortedContracts[rowKey].project_name].owner_project}`}
                    // Link handles layout, inner span handles truncation
                    className="flex h-[30px] items-center hover:underline cursor-pointer select-none min-w-0" // Keep flex items-center, add min-w-0
                  >
                    <span className="block w-full truncate"> {/* Apply truncate here */}
                      {sortedContracts[rowKey].project_name}
                    </span>
                  </Link>
                ) : (
                  <div className="flex h-[30px] items-center cursor-normal select-none min-w-0"> {/* Keep flex items-center, add min-w-0 */}
                    <span className="block w-full truncate"> {/* Apply truncate here */}
                      {sortedContracts[rowKey].project_name}
                    </span>
                  </div>
                )
              }
              containerClass="flex flex-col gap-y-[10px]"
              positionOffset={{ mainAxis: 0, crossAxis: 20 }}
            >
              <GTPApplicationTooltip project_name={sortedContracts[rowKey].project_name} />
            </GTPTooltipNew>
          ) : (
            <GTPTooltipNew
              placement="bottom-start"
              allowInteract={true}
              trigger={
                <div className="flex h-[30px] items-center gap-x-[3px] text-[#5A6462] text-[10px] cursor-pointer select-none min-w-0">
                  <span className="block w-full truncate">
                    Not Available
                  </span>
                </div>
              }
              containerClass="flex flex-col gap-y-[10px]"
              positionOffset={{ mainAxis: 0, crossAxis: 20 }}
            >
              <OLIContractTooltip 
                icon="gtp-project-monochrome" 
                iconClassName="text-[#5A6462]" 
                project_name="Not Available" 
                message="Project information not available."
                contractAddress={sortedContracts[rowKey].address}
                chain={sortedContracts[rowKey].chain}
              />
            </GTPTooltipNew>
          )}
        </div>
        
        {/* Main Category */}  
        <div className="truncate">
          <Category
            category={
              master.blockspace_categories.main_categories[
                sortedContracts[rowKey].main_category_key
              ]
            }
          />
        </div>

        {/* Sub Category */}
        <div className="truncate">
          {
            master.blockspace_categories.sub_categories[
            sortedContracts[rowKey].sub_category_key
            ]
          }
        </div>

        {/* Metric Value */}
        <div className="flex items-center justify-end numbers-xs">
          {selectedMode.includes("gas_fees_")
            ? showUsd
              ? `$${Number(
                sortedContracts[rowKey].gas_fees_absolute_usd.toFixed(0),
              ).toLocaleString("en-GB")}`
              : `Ξ${Number(
                sortedContracts[rowKey].gas_fees_absolute_eth.toFixed(0),
              ).toLocaleString("en-GB")}`
            : Number(sortedContracts[rowKey].txcount_absolute).toLocaleString(
              "en-GB",
            )}
        </div>
      </GridTableRow>
    </>
  );
}
