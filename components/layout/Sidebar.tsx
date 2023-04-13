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
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR from "swr";
import { Router } from "next/router";
import Link from "next/link";
import Image from "next/image";

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
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  isMobile?: boolean;
};

export default function Sidebar({
  // items,
  trigger,
  className = "",
  open = true,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
  isOpen,
  setIsOpen,
  isMobile,
}: SidebarProps) {
  const { data: master } = useSWR<MasterResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_2/master.json"
  );

  // const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const items: SidebarItems = [
    {
      name: "Fundamentals",
      label: "Fundamentals",
      key: "metrics",
      icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="feather:crosshair" className="h-6 w-6 p-0.5 mx-auto " />
      ),
      options: [
        {
          label: "Total Value Locked",
          icon: <Icon icon="feather:star" className="h-4 w-4  mx-auto" />,
          key: "tvl",
          rootKey: "metricsTvl",
        },
        {
          label: "Transaction Count",
          icon: <Icon icon="feather:clock" className="h-4 w-4 mx-auto" />,
          key: "txcount",
          rootKey: "metricsTxCount",
        },
        {
          label: "Stablecoin Market Cap",
          icon: <Icon icon="feather:dollar" className="h-4 w-4 mx-auto" />,
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
          label: "Fees Paid by Users",
          icon: <Icon icon="feather:credit-card" className="h-4 w-4 mx-auto" />,
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
          icon: <Icon icon="feather:sunrise" className="h-4 w-4 mx-auto" />,
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
      name: "Blockspace",
      label: "Blockspace",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="feather:layers" className="h-6 w-6 p-0.5 mx-auto" />
      ),
      options: [],
    },
    {
      name: "Chains",
      label: "Chains",
      key: "chains",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="feather:link" className="h-6 w-6 p-0.5 mx-auto" />
      ),
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
      name: "Wiki",
      label: "Wiki",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="feather:book-open" className="h-6 w-6 p-0.5 pb-0 mx-auto" />
      ),
      options: [],
    },
    {
      name: "API Documentation",
      label: "API Documentation",
      icon: <LinkIcon className="h-5 w-5" />,
      sidebarIcon: (
        <Icon icon="feather:file-text" className="h-6 w-6 p-0.5 mx-auto" />
      ),
      options: [],
    },
  ];

  const contributors = {
    name: "Contributors",
    label: "Contributors",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: (
      <Icon icon="feather:users" className="h-6 w-6 p-0.5 mx-auto" />
    ),
    options: [],
  };

  useEffect(() => {
    setIsOpen(open);
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

  if (isMobile)
    return (
      <>
        {isOpen && (
          <>
            <div
              className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black/50 transition-all"
              onClick={() => {
                handleToggle();
              }}
            ></div>
            <div
              className={`absolute top-10 left-0 bg-forest-50 rounded-r-lg z-50 flex flex-col justify-items-start select-none ${
                isOpen ? "w-[13rem]" : "w-[2.5rem]"
              } overflow-hidden`}
            >
              <div className="text-forest-800 z-20 m-2 mt-6">
                <div className="">
                  {items.map((item) => (
                    <SidebarMenuGroup
                      key={item.name + "_item"}
                      item={item}
                      trigger={trigger}
                      sidebarOpen={isOpen}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={`text-forest-800 ${
            isOpen ? "bg-forest-50 rounded-t-lg z-50" : ""
          } p-2`}
        >
          <div onClick={handleToggle} className="w-6 h-6">
            {trigger}
          </div>
        </div>
      </>
    );

  return (
    <div
      className={`flex-1 flex flex-col justify-items-start select-none ${
        isOpen ? "w-[13rem]" : "w-[2.5rem]"
      } overflow-hidden`}
    >
      {/* trigger that opens the sidebar when clicked */}
      <div className="text-forest-800 z-20 mb-6">
        <div onClick={handleToggle} className="w-6 h-6">
          {trigger}
        </div>
      </div>
      <div className="">
        {items.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            trigger={trigger}
            sidebarOpen={isOpen}
          />
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-end pb-6">
        <SidebarMenuGroup
          key={contributors.name + "_item"}
          item={contributors}
          trigger={trigger}
          sidebarOpen={isOpen}
        />
        {isOpen && (
          <>
            <div className="text-[0.7rem] text-forest-600 leading-[1] my-2">
              © 2023 Grow The Pie 🥧
            </div>
            <div className="text-[0.7rem] flex justify-between w-48 text-forest-600 leading-[1]">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/imprint">Imprint</Link>
              <Link href="https://discord.gg/fxjJFe7QyN">Feedback</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
