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
  open = true,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
}: SidebarProps) {
  const { data: master } = useSWR<MasterResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_2/master.json"
  );

  const [isOpen, setIsOpen] = useState(open);

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
    setIsOpen((isOpen) => (open ? true : isOpen));
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
      className={`flex flex-col justify-items-start select-none ${
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
    </div>
  );
}
