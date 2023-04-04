"use client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "@react-hook/media-query";
import SidebarMenuGroup from "./SidebarMenuGroup";

export type SidebarItems = {
  name: string;
  label: string;
  key?: string;
  icon: ReactNode;
  sidebarIcon: ReactNode;
  options: {
    // name?: string;
    label: string;
    icon: ReactNode;
    key?: string;
    rootKey?: string;
  }[];
}[];

type SidebarProps = {
  // items: SidebarItems;
  trigger: ReactNode;
  className?: string;
  open?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
};

export default function Sidebar({
  // items,
  trigger,
  className = "",
  open = false,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(open);

  const items: SidebarItems = [
    {
      name: "Fundamentals",
      label: "Fundamentals",
      key: "metrics",
      icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="ic:round-compare-arrows" className="h-6 w-6 mx-auto " />
      ),
      options: [
        {
          label: "Total Value Locked",
          icon: <Icon icon="ep:money" className="h-4 w-4  mx-auto" />,
          key: "tvl",
          rootKey: "metricsTvl",
        },
        {
          label: "Transaction Count",
          icon: <Icon icon="mdi:text" className="h-4 w-4 mx-auto" />,
          key: "txcount",
          rootKey: "metricsTxCount",
        },
        {
          label: "Market Cap",
          icon: <Icon icon="carbon:mountain" className="h-4 w-4 mx-auto" />,
          key: "marketcap",
          rootKey: "metricsMarketCap",
        },
        {
          label: "24h Contract Usage",
          icon: <Icon icon="ion:time-outline" className="h-4 w-4 mx-auto" />,
          key: "24hcontractusage",
          rootKey: "metrics24hContractUsage",
        },
        {
          label: "Fees Paid to Ethereum",
          icon: <Icon icon="ion:ticket-outline" className="h-4 w-4 mx-auto" />,
          key: "fees",
          rootKey: "metricsFeesPaidToEthereum",
        },
        {
          label: "Transactions/Second",
          icon: (
            <Icon
              icon="ant-design:transaction-outlined"
              className="h-4 w-4 mx-auto"
            />
          ),
          key: "txpersecond",
          rootKey: "metricsTransactionsPerSecond",
        },
        {
          label: "Daily Active Addresses",
          icon: <Icon icon="bx:bx-user" className="h-4 w-4 mx-auto" />,
          key: "daa",
          rootKey: "metricsDailyActiveAddresses",
        },
        {
          label: "New Addresses",
          icon: <Icon icon="bx:bx-user-plus" className="h-4 w-4 mx-auto" />,
          key: "newaddresses",
          rootKey: "metricsNewAddresses",
        },
        {
          label: "Total Addresses",
          icon: <Icon icon="ph:address-book" className="h-4 w-4 mx-auto" />,
          key: "totaladdresses",
          rootKey: "metricsTotalAddresses",
        },
      ],
    },
    {
      name: "chains",
      label: "chains",
      key: "chains",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: <LinkIcon className="h-6 w-6 mx-auto" />,
      options: [
        {
          label: "Ethereum",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "ethereum",
          rootKey: "chainsEthereum",
        },
        {
          label: "Arbitrum",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "arbitrum",
          rootKey: "chainsArbitrum",
        },
        {
          label: "Aztec V2",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "aztecv2",
          rootKey: "chainsAztecV2",
        },
        {
          label: "Immutable X",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "immutablex",
          rootKey: "chainsImmutableX",
        },
        {
          label: "Loopring",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "loopring",
          rootKey: "chainsLoopring",
        },
        {
          label: "Polygon",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "polygon",
          rootKey: "chainsPolygon",
        },
        {
          label: "Optimism",
          icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
          key: "optimism",
          rootKey: "chainsOptimism",
        },
      ],
    },
    {
      name: "Blockspace",
      label: "Blockspace",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: <Icon icon="bxl:react" className="h-6 w-6 mx-auto" />,
      options: [],
    },
    {
      name: "Wiki",
      label: "Wiki",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: <Icon icon="bxl:react" className="h-6 w-6 mx-auto" />,
      options: [],
    },
    {
      name: "API Documentation",
      label: "API Documentation",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
      options: [],
    },
  ];

  useEffect(() => {
    setIsOpen(isOpen);
  }, [open]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div
      className={`flex flex-col justify-items-start select-none  dark:text-slate-300 ${
        isOpen ? "w-[13rem]" : "w-[3.5rem]"
      } overflow-hidden`}
    >
      {/* trigger that opens the sidebar when clicked */}
      <div className="text-slate-600 dark:text-slate-100 z-20 mb-6">
        <div onClick={handleToggle} className="w-6 h-6">
          {trigger}
        </div>
      </div>
      <div>
        {items.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            trigger={trigger}
          />
        ))}
      </div>

      {/* <div className="flex h-full">
        <div className="w-8 bg-white dark:bg-black z-20" />
        <div className="overflow-y-auto">
          <div className="flex flex-col">
            <div className="text-slate-400 dark:bg-black dark:text-slate-400 z-20">
              <div onClick={handleToggle} className="w-6 mx-auto">
                {trigger}
              </div>
            </div>
            <div className={`transition-width ${isOpen ? "w-40" : "w-8"}`}>
              test
            </div>
            {items.map((item) => (
              <div key={item.name + "_item"}> */}
      {/* <div className="flex items-center">
                  <div className="w-[2.25rem] pl-[0.5rem] p-3 bg-white dark:bg-black z-20">
                    <div className="text-white bg-slate-400 dark:text-black dark:bg-slate-400 rounded-md w-6 mx-auto">
                      {item.sidebarIcon}
                    </div>
                  </div>
                  <div
                    className={`-left-[6.5rem] absolute ${
                      isOpen
                        ? "transition-transform ease-in-out duration-300 transform translate-x-[10.75rem]"
                        : "transition-transform ease-in-out duration-300 transform translate-x-0"
                    } w-[10.75rem] bg-white dark:bg-black z-10 `}
                  >
                    <div className="text-sm font-medium py-3 px-2 w-[10.75rem] z-10 bg-white dark:bg-black">
                      {item.label}
                    </div>
                  </div>
                </div>
                {item.options.map((option) => (
                  <div
                    key={option.label + "_opt"}
                    className="flex items-center"
                  >
                    <div className="w-[2.25rem] p-3 bg-white text-slate-400 dark:bg-black dark:text-slate-400 z-20 rounded-l-full">
                      {option.icon != null ? (
                        option.icon
                      ) : (
                        <Icon icon="bxl:react" className="h-4 w-4 mx-auto" />
                      )}
                    </div>

                    <div
                      className={`-left-[6.5rem] absolute ${
                        isOpen
                          ? "transition-transform ease-in-out duration-300 transform translate-x-[10.75rem]"
                          : "transition-transform ease-in-out duration-300 transform translate-x-0"
                      } w-[10.75rem] bg-white dark:bg-black z-10 `}

                      // onClick={() => {
                      // 	setSelectedFilter({
                      // 		name: filter.name,
                      // 	});
                      // 	setSelectedFilterOption(option);
                      // }}
                    >
                      <div className="text-sm font-normal py-3 px-2  w-[10.75rem] z-10 bg-white dark:bg-black">
                        {option.label}
                      </div>
                    </div>
                  </div>
                ))} */}
      {/* </div>
            ))} */}
      {/* {items.map((item) => (
              <div key={item.name + "_item"}>
                <div className="flex items-center">
                  <div className="w-[2.25rem] pl-[0.5rem] p-3 bg-white dark:bg-black z-20">
                    <div className="text-white bg-slate-400 dark:text-black dark:bg-slate-400 rounded-md w-6 mx-auto">
                      {item.sidebarIcon}
                    </div>
                  </div>
                  <div
                    className={`-left-[6.5rem] absolute ${
                      isOpen
                        ? "transition-transform ease-in-out duration-300 transform translate-x-[10.75rem]"
                        : "transition-transform ease-in-out duration-300 transform translate-x-0"
                    } w-[10.75rem] bg-white dark:bg-black z-10 `}
                  >
                    <div className="text-sm font-medium py-3 px-2 w-[10.75rem] z-10 bg-white dark:bg-black">
                      {item.label}
                    </div>
                  </div>
                </div>
                {item.options.map((option) => (
                  <div
                    key={option.label + "_opt"}
                    className="flex items-center"
                  >
                    <div className="w-[2.25rem] p-3 bg-white text-slate-400 dark:bg-black dark:text-slate-400 z-20 rounded-l-full">
                      {option.icon != null ? (
                        option.icon
                      ) : (
                        <Icon icon="bxl:react" className="h-4 w-4 mx-auto" />
                      )}
                    </div>

                    <div
                      className={`-left-[6.5rem] absolute ${
                        isOpen
                          ? "transition-transform ease-in-out duration-300 transform translate-x-[10.75rem]"
                          : "transition-transform ease-in-out duration-300 transform translate-x-0"
                      } w-[10.75rem] bg-white dark:bg-black z-10 `}

                      // onClick={() => {
                      // 	setSelectedFilter({
                      // 		name: filter.name,
                      // 	});
                      // 	setSelectedFilterOption(option);
                      // }}
                    >
                      <div className="text-sm font-normal py-3 px-2  w-[10.75rem] z-10 bg-white dark:bg-black">
                        {option.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))} */}
      {/* </div>
        </div>
        <div className="w-1 flex ml-3">
          <div
            className={`flex-1 bg-gray-100 dark:bg-gray-100 ${
              isOpen
                ? "transition-transform ease-in-out duration-300 transform translate-x-[10rem]"
                : "transition-transform ease-in-out duration-300 transform translate-x-0"
            }`}
          ></div>
        </div>
      </div> */}
    </div>
  );
}
