"use client";
import { useContractContext } from "./ContractContext";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";
import { getExplorerAddressUrl } from "@/lib/helpers";

import { GridTableChainIcon, GridTableRow } from "@/components/layout/GridTable";
import { GTPApplicationTooltip, GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { Category } from "@/app/(layout)/applications/_components/Components";

export default function ContractRow({
  rowKey,
  i,
  sortedContracts,
}: {
  rowKey: string;
  i: number;
  sortedContracts: Object;
}) {
  const { projectNameToProjectData } = useProjectsMetadata();
  const [copyContract, setCopyContract] = useState(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const {
    master,
    selectedMode,
  } = useContractContext();

  return (
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
            hoverOpenDelay={300}
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
            hoverOpenDelay={300}
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
  );
}
