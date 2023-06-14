"use client";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";


export default function OverviewMetrics ({
    showEthereumMainnet,
    setShowEthereumMainnet,
    selectedTimespan,
    setSelectedTimespan,
    }: {
    showEthereumMainnet: boolean;
    setShowEthereumMainnet: (show: boolean) => void;
    selectedTimespan: string;
    setSelectedTimespan: (timespan: string) => void;
    }) {

    const [selectedScale, setSelectedScale] = useState("gasfees");
    const [nativeTransfer, setNativeTransfer] = useState(true)
    const { theme } = useTheme();
    const timespans = useMemo(() => {

    return {
        // "30d": {
        //   label: "30 days",
        //   value: 30,
        //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        //   xMax: Date.now(),
        // },
        "90d": {
        label: "90 days",
        value: 90,

        },
        "180d": {
        label: "180 days",
        value: 180,

        },
        "365d": {
        label: "1 year",
        value: 365,

        },
        max: {
        label: "Maximum",
        value: 0,

        },
    };
    }, []);

    return (
    <>
        <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 z-10">
            <div className="hidden md:flex justify-center items-center ml-0.5">
                {/* <Icon icon="gtp:chain" className="w-7 h-7 lg:w-9 lg:h-9" /> */}
                <button className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium 
                ${nativeTransfer
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"} `}
                onClick={() => {setNativeTransfer(!nativeTransfer)}}>
                <div className="flex items-center space-x-1">
                    <div>
                        <h1>Native Transfer</h1>
                    </div>
                    <div className="pt-1">
                        {nativeTransfer ? (
                            <Icon
                            icon="feather:chevron-down"
                            className="w-[13px] h-[13px] block"
                            />
                        ) : (
                            <Icon
                            icon="feather:chevron-left"
                            className="w-[13px] h-[13px] block"
                            />
                        )}
                    </div>
                </div>
                </button>
            </div>
            
            <div className="flex w-full md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
                {(
                Object.keys(timespans).map((timespan) => (
                    <button
                    key={timespan}
                    className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
                        selectedTimespan === timespan
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                        setSelectedTimespan(timespan);
                        // setXAxis();
                    }}
                    >
                    {timespans[timespan].label}
                    </button>
                ))
                )}
            </div>
        </div>
        <div className={`relative bottom-[14px] w-[97.5%] h-[65px] m-auto border-x-[1px] border-b-[1px] rounded-xl border-white overflow-hidden 
        ${nativeTransfer ? "flex" : "hidden"}`}>
            <div className="flex w-full h-full text-[12px]">
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#0000000f] items-center">
                    Native Transfer
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#00000014] items-center">
                    DeFi - DEX
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#00000029] items-center">
                    DeFi - Other
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />    
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#0000003d] items-center">
                    Stablecoin
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#0000005c] items-center">
                    ERC-20
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />    
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#0000007a] items-center">
                    NFT-20
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#000000a3] items-center">
                    L2 Rent
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#000000cc] items-center">
                    Bridge
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
                <div className="flex flex-col flex-grow h-full pt-2 justify-center bg-[#000000eb] items-center">
                    Arbitrage
                    <Image
                        src="/FiSmile.svg"
                        alt="Smiley Face"
                        className="object-contain"
                        width={10}
                        height={10}
                    />
                </div>
            </div>
        </div>

        <div className="flex w-full justify-between md:w-auto bg-forest-50 dark:bg-[#1F2726] rounded-full p-0.5 mt-8">
            <div className="flex justify-normal md:justify-start">
                {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
                {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
                {/* toggle ETH */}

                <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto ">
                    <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                        <button
                        className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                            "gasfees" === selectedScale
                            ? "bg-forest-500 dark:bg-forest-1000"
                            : "hover:bg-forest-500/10"
                        }`}
                        onClick={() => {
                            setSelectedScale("gasfees");
                        }}
                        >
                        Gas Fees
                        </button>
                        <button
                        className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                            "txcount" === selectedScale
                            ? "bg-forest-500 dark:bg-forest-1000"
                            : "hover:bg-forest-500/10"
                        }`}
                        onClick={() => {
                            setSelectedScale("txcount");
                        }}
                        >
                        Transaction Count
                        </button>

                    </div>
                </div>
            </div>
            <div className="flex -my-7 -mx-3  rounded-xl px-1.5 py-1.5 md:px-3 md:py-1.5 items-center">
                <div className="flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-5">
                    <Icon
                    icon="feather:users"
                    className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
                    />
                    <div className="flex flex-col items-center justify-center">
                    <div className="text-xs font-medium leading-tight">
                        Total Eth
                    </div>
                    <div className="text-3xl font-[650]">
                        X
                    </div>
                    <div className="text-xs font-medium leading-tight">
                        
                        <span
                            className="text-green-500 dark:text-green-400 font-semibold"
                            style={{
                            textShadow:
                                theme === "dark"
                                ? "1px 1px 4px #00000066"
                                : "1px 1px 4px #ffffff99",
                            }}
                        >
                            +%
                        </span>
                        
                            %

                        in last week
                    </div>
                    </div>
                </div>
                <div className="flex bg-forest-100 dark:bg-[#4B5553] rounded-xl px-3 py-1.5 items-center mr-5">
                    <Icon
                    icon="feather:layers"
                    className="w-8 h-8 lg:w-14 lg:h-14 mr-2"
                    />
                    <div className="flex flex-col items-center justify-center">
                    <div className="text-xs font-medium leading-tight">
                        Average Share
                    </div>
                    <div className="text-3xl font-[650]">
                        x
                    </div>
                    <div className="text-xs font-medium leading-tight">
                        
                        <span
                            className="text-green-500 dark:text-green-400 font-semibold"
                            style={{
                            textShadow:
                                theme === "dark"
                                ? "1px 1px 4px #00000066"
                                : "1px 1px 4px #ffffff99",
                            }}
                        >
                            +%
                            </span>
                            in last week
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
    );
};
