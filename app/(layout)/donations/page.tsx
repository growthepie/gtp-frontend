"use client";
import Container from "@/components/layout/Container";
import Image from "next/image";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import { table } from "console";
import { useMemo } from "react";
import { json } from "stream/consumers";
import { BASE_URL } from "@/lib/helpers";
import useSWR from "swr";
import { centerImage } from "highcharts";
import path from "path";
import { url } from "inspector";
import { add } from "lodash";
import Link from "next/link";

export default function Donations() {
  const { isSidebarOpen } = useUIContext();
  const { AllChainsByKeys } = useMaster();

  const Supporters = [
    {
      name: "Ethereum Foundation",
      image: "/contributors/ef-logo.png",
      width: 207,
      height: 66,
      url: "https://ethereum.org",
    },
    {
      name: "Optimism",
      image: "/contributors/optimism-logo.png",
      width: 192,
      height: 27,
      url: "https://optimism.io",
    },
    {
      name: "Octant",
      image: "/contributors/octant-logo.png",
      width: 220,
      height: 48,
      url: "https://octant.build/",
    },
  ];

  const QRCodes = [
    {
      key: "Giveth",
      wallet: false,
      qrImage: "/GivethQR.png",
      icon: {
        path: "gtp:giveth-monochrome",
        color: "#CDD8D3",
      },
      url: "https://giveth.io/donate/",
      address: null,
    },
    {
      key: "Ethereum",
      wallet: true,
      qrImage: "/EthereumQR.png",
      icon: {
        path: "gtp:ethereum-logo-monochrome",
        color: "#CDD8D3",
      },
      url: "https://ethereum.org/en/donate/",
      address: "0x7291a5Aa55...20F40476fB",
    },
    {
      key: "Optimism",
      wallet: true,
      qrImage: "/OptimismQR.png",
      icon: {
        path: "gtp:optimism-logo-monochrome",
        color: "#FE5468",
      },
      url: "https://optimism.io/donate/",
      address: "0x7291a5Aa55...20F40476fB",
    },
    {
      key: "Arbitrum",
      wallet: true,
      qrImage: "/ArbitrumQR.png",
      icon: {
        path: "gtp:arbitrum-logo-monochrome",
        color: "#1DF7EF",
      },
      url: "https://arbitrum.io/donate/",
      address: "0x7291a5Aa55...20F40476fB",
    },
    {
      key: "Base",
      wallet: true,
      qrImage: "/BaseQR.png",
      icon: {
        path: "gtp:base-logo-monochrome",
        color: "#0052FF",
      },
      url: "https://baseledger.io/donate/",
      address: "0x7291a5Aa55...20F40476fB",
    },
  ];

  const {
    data: PGFData,
    isLoading,
    isValidating,
    error,
  } = useSWR(BASE_URL + "/api/donations/pgf", {
    refreshInterval: 1000 * 60 * 5,
  });

  const {
    data: impactData,
    isLoading: impactIsLoading,
    isValidating: impactIsValidating,
    error: impactError,
  } = useSWR(BASE_URL + "/api/donations/impactusers", {
    refreshInterval: 1000 * 60 * 5,
  });

  const {
    data: updateData,
    isLoading: updateLoading,
    isValidating: updateValidating,
    error: updateError,
  } = useSWR(BASE_URL + "/api/donations/updates", {
    refreshInterval: 1000 * 60 * 5,
  });

  const getDonateUntil = (endDate: string): string => {
    // Convert the endDate string to a Date object
    const utcDate = new Date(endDate);

    // Get the user's local time string in the desired format
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
      hour12: false, // Use 24-hour time format
    };

    // Format the date using toLocaleString with the user's locale
    return utcDate.toLocaleString(undefined, options).replace(",", "");
  };

  const getTimeLeft = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const timeDiff = end.getTime() - now.getTime();

    if (timeDiff < 0) {
      return "Time's up!";
    }

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `${years} Year${years > 1 ? "s" : ""}`;
    } else if (months > 0) {
      return `${months} Month${months > 1 ? "s" : ""}`;
    } else if (days > 0) {
      return `${days} Day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} Hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${minutes} Minute${minutes > 1 ? "s" : ""}`;
    }
  };

  return (
    PGFData &&
    impactData &&
    updateData && (
      <Container className="">
        <div className="flex flex-col gap-y-[15px]">
          <div className="text-[20px] font-bold ">Ways to Donate to Us</div>
          <div className="text-[14px]">
            You can donate anytime by sending tokens to one of our following
            wallets:
          </div>
          <div className="flex gap-x-[5px]">
            {QRCodes.map((CardData, index) => (
              <div
                className={`flex gap-x-[10px] p-[5px] border-[2px] rounded-[17px] border-[#CDD8D3] h-[82px] items-center ${
                  CardData.wallet ? "w-[215px]" : "w-[200px]"
                }`}
                key={CardData.key}
              >
                <div className="min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] relative">
                  <Image
                    src={CardData.qrImage}
                    alt="QR Code"
                    width={64}
                    height={64}
                  />
                  <div className="absolute top-0 left-0 w-[64px] h-[64px] bg-opacity-50 flex items-center justify-center" />
                  <div className="absolute top-[22px] left-[22px] w-[21px] h-[21px] flex items-center justify-center bg-[#1F2726] ">
                    <Icon
                      icon={CardData.icon.path}
                      color={CardData.icon.color}
                      className="w-[15px] h-[15px]"
                    />
                  </div>
                </div>
                <div className="w-full h-full">
                  {CardData.wallet ? (
                    <div className="flex flex-col justify-start text-[14px] w-full h-full items-center text-left pr-[5px]">
                      <div>
                        Donate to our <b>{CardData.key}</b> Wallet
                      </div>
                      <div className="w-full mt-[10px] text-[9px]">
                        {CardData.address}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[14px] w-full h-full flex items-center justify-center text-left pl-[5px]">
                      <div>
                        Donate to our <b>{CardData.key}</b> Page
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[20px] font-bold">
            Active Public Goods Funding Rounds
          </div>
          <div className="text-[14px]">
            These are the currently active public goods funding rounds that we
            participate in. Be fast and donate now, they usually run for a short
            time only.
          </div>
          <HorizontalScrollContainer
            includeMargin={false}
            forcedMinWidth={805}
            className="w-full flex flex-col "
          >
            <div className="relative w-full h-full px-[5px] -mb-[5px]">
              <div
                className={`grid pr-0.5 gap-x-[5px]  mb-[15px] text-[14px] font-bold ${
                  isSidebarOpen
                    ? " 2xl:grid-cols-[115px_294px_90px_auto_150px] grid-cols-[115px_294px_90px_auto_150px] "
                    : "xl:grid-cols-[115px_294px_90px_auto_150px] grid-cols-[115px_294px_90px_auto_150px] "
                } min-w-[805px]`}
              >
                <div className="w-full flex justify-center">Time Left</div>
                <div className="w-full justify-center pl-[5px]">Name</div>
                <div className="w-full ">Share</div>
                <div className="w-full ">Link</div>
                <div className="w-full text-right pr-[10px]">Donate Until</div>
              </div>
            </div>
            {PGFData.map((donation) => (
              <div
                className={`relative flex flex-col mb-[5px] justify-center z-0 transition-height duration-300 border-[1px] border-[#5A6462] rounded-full px-[5px]`}
                style={{ height: "34px" }}
                key={donation.name}
              >
                <div className="flex items-center ">
                  <div
                    className={`grid gap-x-[5px] relative rounded-full w-full min-h-[34px] text-[14px] items-center z-20 cursor-pointer pr-0.5
                    ${
                      isSidebarOpen
                        ? " 2xl:grid-cols-[115px_294px_90px_auto_220px] grid-cols-[115px_294px_90px_auto_220px] "
                        : "xl:grid-cols-[115px_294px_90px_auto_220px] grid-cols-[115px_294px_90px_auto_220px] "
                    } min-w-[805px]`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="w-full bg-[#1F2726] rounded-full flex justify-center text-[16px] font-bold">
                      {getTimeLeft(donation.endDate)}
                    </div>
                    <div className="w-full justify-center pl-[5px]">
                      {donation.name}
                    </div>
                    <div className="w-full flex gap-x-[10px]">
                      {" "}
                      {donation.twitterURL && (
                        <a href={donation.twitterURL} target="_blank">
                          <Icon
                            icon="ri:twitter-x-fill"
                            className="w-[15px] h-[15px]"
                          />
                        </a>
                      )}
                      {donation.farcasterURL && (
                        <a href={donation.farcasterURL} target="_blank">
                          <Icon
                            icon="gtp:farcaster"
                            className="h-[15px] w-[15px]"
                          />
                        </a>
                      )}
                      {donation.lensURL && (
                        <a href={donation.lensURL} target="_blank">
                          <Icon icon="gtp:lens" className="h-[15px] w-[15px]" />
                        </a>
                      )}
                    </div>
                    <a
                      href={donation.url}
                      target="_blank"
                      className="w-full hover:underline"
                    >
                      {donation.url}
                    </a>
                    <div className="w-full text-right pr-[5px]">
                      {getDonateUntil(donation.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScrollContainer>

          <div className="flex items-center h-[43px] gap-x-[8px] mt-[45px]">
            <Icon
              icon={"gtp:donate"}
              className="object-contain w-[36px] h-[36px]"
              height={36}
              width={36}
            />
            <Heading className="text-[36px] leading-snug " as="h1">
              {"Impact"}
            </Heading>
          </div>
          <div className="text-[14px] mb-[30px]">
            growthepie data and visualizations are used across many different
            sites, publishers and media. Our main focus is to cater towards end
            users and builders wanting to get the best overview of the entire
            Ethereum ecosystem. Therefore we support everyone who helps us
            achieve this mission.
          </div>
          <div className="text-[20px] font-bold">
            Publice use of our data and visualizations
          </div>
          <div className="text-[14px]">
            The following people and institutions mention us or use our data
            regularly, free of charge:
          </div>
          <HorizontalScrollContainer
            includeMargin={false}
            forcedMinWidth={805}
            className="w-full flex flex-col "
          >
            <div className="relative w-full h-full px-[15px] -mb-[10px] ">
              <div
                className={`grid pr-0.5 gap-x-[5px]  mb-[15px] text-[14px] font-bold ${
                  isSidebarOpen
                    ? " 2xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_100px] "
                    : "xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_100px] "
                } min-w-[805px]`}
              >
                <div className="w-full flex justify-start">Name</div>
                <div className="w-full flex justify-start">Link</div>
                <div className="w-full flex justify-end">Date</div>
              </div>
            </div>
            {impactData.map((impactRow) => (
              <div
                className={`relative flex flex-col mb-[5px] justify-center z-0 transition-height duration-300 border-[1px] border-[#5A6462] rounded-full px-[15px]`}
                style={{ height: "34px" }}
                key={impactRow.name}
              >
                <div className="flex items-center ">
                  <div
                    className={`grid gap-x-[5px] relative rounded-full w-full min-h-[34px] text-[12px] items-center z-20 cursor-pointer pr-0.5 
                    ${
                      isSidebarOpen
                        ? " 2xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_150px] "
                        : "xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_150px] "
                    } min-w-[805px]`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center w-full h-full">
                      {impactRow.name}
                    </div>
                    <div className="flex items-center w-full h-full">
                      {impactRow.url}
                    </div>
                    <div className="flex items-center justify-end w-full h-full gap-x-[3px]">
                      <div className="mb-[1px]">since</div>
                      <div> {impactRow.date.replace(/-/g, "/")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScrollContainer>
          <div className="text-[20px] font-bold">Platform Updates</div>
          <div className="text-[14px]">
            The following people and institutions mention us or use our data
            regularly, free of charge:
          </div>
          <HorizontalScrollContainer
            includeMargin={false}
            forcedMinWidth={805}
            className="w-full flex flex-col "
          >
            <div className="relative w-full h-full px-[15px] -mb-[10px] ">
              <div
                className={`grid pr-0.5 gap-x-[5px]  mb-[15px] text-[14px] font-bold ${
                  isSidebarOpen
                    ? " 2xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_100px] "
                    : "xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_100px] "
                } min-w-[805px]`}
              >
                <div className="w-full flex justify-start">Product Feature</div>
                <div className="w-full flex justify-start">
                  Announcement Link
                </div>
                <div className="w-full flex justify-end">Date Released</div>
              </div>
            </div>
            {updateData.map((updateRow) => (
              <div
                className={`relative flex flex-col mb-[5px] justify-center z-0 transition-height duration-300 border-[1px] border-[#5A6462] rounded-full px-[15px]`}
                style={{ height: "34px" }}
                key={updateRow.name}
              >
                <div className="flex items-center ">
                  <div
                    className={`grid gap-x-[5px] relative rounded-full w-full min-h-[34px] text-[12px] items-center z-20 cursor-pointer pr-0.5 
                    ${
                      isSidebarOpen
                        ? " 2xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_150px] "
                        : "xl:grid-cols-[400px_auto_100px] grid-cols-[400px_auto_150px] "
                    } min-w-[805px]`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center w-full h-full">
                      {updateRow.name}
                    </div>
                    <div className="flex items-center w-full h-full">
                      {updateRow.url}
                    </div>
                    <div className="flex items-center justify-end w-full h-full gap-x-[3px]">
                      <div> {updateRow.date.replace(/-/g, "/")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScrollContainer>
          <div className="flex items-center h-[43px] gap-x-[8px] mt-[45px]">
            <Icon
              icon={"gtp:gtp-support"}
              className="object-contain w-[36px] h-[36px]"
              height={36}
              width={36}
            />
            <Heading className="text-[36px] leading-snug " as="h1">
              {"Support"}
            </Heading>
          </div>
          <div className="text-[14px]">
            We received grants between 50k - 150k USD from the following
            partners, communities or foundations.
          </div>
          <div className="w-full flex items-center justify-between px-[23px] ">
            {Supporters.map((s) => (
              <Link
                key={s.name}
                target="_blank"
                rel="noopener noreferrer"
                href={s.url}
                className="relative text-center"
                // style={{
                //   width: s.width,
                //   height: s.height,
                // }}
              >
                <Image
                  src={s.image}
                  alt={s.name}
                  width={s.width}
                  height={s.height}
                  className="brightness-[.55] grayscale-100 dark:brightness-100 grayscale-0"
                  // fill
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    )
  );
}
