"use client";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useMaster } from "@/contexts/MasterContext";

type ContractInfo = {
  address: string;
  project_name: string;
  name: string;
  main_category_key: string;
  sub_category_key: string;
  chain: string;
  gas_fees_absolute_eth: number;
  gas_fees_absolute_usd: number;
  gas_fees_share: number;
  txcount_absolute: number;
  txcount_share: number;
};

type ContractLabelModalProps = {
  isOpen?: boolean;
  onClose: () => void;
  contract: ContractInfo;
};
export default function ContractLabelModal({
  isOpen,
  onClose,
  contract,
}: ContractLabelModalProps) {
  const { theme } = useTheme();

  const { AllChainsByKeys } = useMaster();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-white dark:bg-black opacity-80"
        onClick={onClose}
      ></div>
      <div className="relative bg-forest-50 dark:bg-[#1F2726] border-forest-200 dark:border-forest-500 border rounded-[27px] w-[90%] md:w-[80%] lg:w-[60%]">
        <div className="flex flex-col items-center justify-center w-full h-full pl-[15px] pr-[30px] py-[10px] space-y-[15px]">
          <div className="flex space-x-[26px] items-center w-full">
            <div>
              <Icon icon="gtp:add-tag" className="w-[34px] h-[34px]" />
            </div>
            <div>Suggested label for contract {contract.address}</div>
          </div>
          <div className="flex space-x-[26px] items-center w-full">
            <Icon
              icon={`gtp:${contract.chain.replace("_", "-")}-logo-monochrome`}
              className="w-[34px] h-[34px]"
              style={{
                color: AllChainsByKeys[contract.chain].colors[theme ?? "dark"][1],
              }}
            />
            <div className="flex space-x-[15px] items-center w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                  placeholder="Contract Name"
                />
                <div className="absolute right-0.5 top-0.5">
                  <Tooltip placement="right" allowInteract>
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
                          It should be the name of the contract, not the name of
                          the project.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="relative w-full">
                <input
                  type="text"
                  className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                  placeholder="Project Name"
                />
                <div className="absolute right-0.5 top-0.5">
                  <Tooltip placement="right" allowInteract>
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
                          It should be the name of the project, not the name of
                          the contract.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="relative w-full">
                <select className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]">
                  <option value="" disabled selected>
                    Category
                  </option>
                  <option value="1">1</option>
                </select>
              </div>
              <div className="relative w-full">
                <select className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]">
                  <option value="" disabled selected>
                    Subcategory
                  </option>
                  <option value="1">1</option>
                </select>
              </div>
            </div>
          </div>
          <div className="pl-[50px] flex flex-col space-y-[5px] items-start justify-center w-full">
            <div>Please add your details to participate in ...</div>
            <div className="flex space-x-[15px] items-center w-full">
              <input
                type="text"
                className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                placeholder="X Handle (formerly Twitter)"
              />
              <input
                type="text"
                className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                placeholder="Source (optional)"
              />
            </div>
          </div>
          <div className="flex space-x-[15px] items-start justify-center w-full font-medium">
            <button className="px-[16px] py-[6px] rounded-full border border-forest-900 dark:border-forest-500 text-forest-900 dark:text-forest-500">
              Cancel
            </button>
            <button className="px-[16px] py-[6px] rounded-full bg-[#F0995A] text-forest-900">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
