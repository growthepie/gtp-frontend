"use client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR from "swr";
import { Router } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";

export type SidebarItems = {
  name: string;
  label: string;
  page?: {
    title: string;
    description: string;
  };
  key?: string;
  icon: ReactNode;
  sidebarIcon: ReactNode;
  options: {
    // name?: string;
    label: string;
    page?: {
      title: string;
      description: string;
      icon?: string;
    };
    icon: ReactNode;
    key?: string;
    rootKey?: string;
  }[];
}[];

export const items: SidebarItems = [
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
        page: {
          title: "TVL On-Chain",
          description:
            "The sum of all funds locked on the chain. Methodology and data is derived from L2Beat.com.",
          icon: "feather:star",
        },
        icon: <Icon icon="feather:star" className="h-4 w-4 mx-auto" />,
        key: "tvl",
        rootKey: "metricsTvl",
      },
      {
        label: "Transaction Count",
        page: {
          title: "Transaction Count",
          description: "The number of daily transactions.",
          icon: "feather:clock",
        },
        icon: <Icon icon="feather:clock" className="h-4 w-4 mx-auto" />,
        key: "txcount",
        rootKey: "metricsTxCount",
      },
      {
        label: "Stablecoin Market Cap",
        page: {
          title: "Stablecoin Market Cap",
          description: "The sum of stablecoins that are locked on the chain.",
          icon: "feather:dollar-sign",
        },
        icon: <Icon icon="feather:dollar-sign" className="h-4 w-4 mx-auto" />,
        key: "stables_mcap",
        rootKey: "metricsStablesMcap",
      },
      {
        label: "24h Contract Usage",
        page: {
          title: "24h Contract Usage",
          description:
            "The number of contracts created in the last 24 hours. Methodology and data is derived from L2Beat.com.",
          icon: "ion:time-outline",
        },
        icon: <Icon icon="ion:time-outline" className="h-4 w-4 mx-auto" />,
        key: "24hcontractusage",
        rootKey: "metrics24hContractUsage",
      },
      {
        label: "Fees Paid to L2",
        page: {
          title: "Fees Paid to L2",
          description:
            "The sum of fees that were paid by users of the chain in gas fees or, in the case of chains like Immutable X,  the amount of fees that were paid to the protocol wallet.",
          icon: "feather:credit-card",
        },
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
        page: {
          title: "Daily Active Addresses",
          description:
            "The number of unique daily addresses that interacted with a chain.",
          icon: "feather:sunrise",
        },
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
    sidebarIcon: <Icon icon="feather:link" className="h-6 w-6 p-0.5 mx-auto" />,
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
        key: "imx",
        rootKey: "chainsImmutableX",
      },
      {
        label: "Loopring",
        icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
        key: "loopring",
        rootKey: "chainsLoopring",
      },
      {
        label: "Polygon zkEVM",
        icon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
        key: "polygon_zkevm",
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
    "https://d2cfnw27176mbd.cloudfront.net/v0_3/master.json"
  );

  // const [isOpen, setIsOpen] = useState(open);

  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const isLargerScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!isLargerScreen) {
      setIsOpen(false);
    }
  }, [isLargerScreen, isLargeScreen, setIsOpen]);

  // useEffect(() => {
  //   setIsOpen(open);
  // }, [open]);

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
              className={`absolute top-20 left-0 bg-forest-50 rounded-r-lg z-50 flex flex-col justify-items-start select-none overflow-hidden`}
            >
              <div className="text-forest-800 z-20 m-2 mt-10">
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
            isOpen ? "bg-forest-50 rounded-lg z-50" : ""
          } p-2`}
        >
          <div onClick={handleToggle} className="w-8 h-8">
            {trigger}
          </div>
        </div>
      </>
    );

  return (
    <div
      className={`flex-1 flex flex-col justify-items-start select-none ${
        isOpen ? "w-[14rem]" : "w-[3rem]"
      } overflow-hidden`}
    >
      {/* trigger that opens the sidebar when clicked */}
      <div className="text-forest-800 z-20 mb-6 pl-3">
        <div onClick={handleToggle} className="w-6 h-6">
          {trigger}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800 scrollbar-track-forest-800/30 relative">
        {items.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            trigger={trigger}
            sidebarOpen={isOpen}
          />
        ))}
      </div>
      <div className="flex flex-col justify-end py-6 relative">
        <SidebarMenuGroup
          key={contributors.name + "_item"}
          item={contributors}
          trigger={trigger}
          sidebarOpen={isOpen}
        />
        {isOpen && (
          <>
            <div className="text-[0.7rem] text-forest-600 leading-[1] my-2 ml-3">
              © 2023 Grow The Pie 🥧
            </div>
            <div className="text-[0.7rem] flex justify-between w-48 text-forest-600 leading-[1]  ml-3">
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
