"use client";
import Container from "@/components/layout/Container";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/lib/helpers";
import useSWR from "swr";
import Link from "next/link";
import Description from "@/components/layout/Description";
import "@splidejs/react-splide/css";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { Supporters } from "@/lib/contributors";

export default function Donations() {
  const { isSidebarOpen } = useUIContext();
  const { AllChainsByKeys } = useMaster();

  const QRCodes = [
    {
      key: "Giveth",
      wallet: false,
      qrImage: <GivethSVG />,
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
      qrImage: <EthereumSVG />,
      icon: {
        path: "gtp:ethereum-logo-monochrome",
        color: "#CDD8D3",
      },
      url: "https://ethereum.org/en/donate/",
      address: "0x7291a5Aa55886900C460Bf4366A46820F40476fB",
    },
    {
      key: "Optimism",
      wallet: true,
      qrImage: <OptimismSVG />,
      icon: {
        path: "gtp:optimism-logo-monochrome",
        color: "#FE5468",
      },
      url: "https://optimism.io/donate/",
      address: "0x7291a5Aa55886900C460Bf4366A46820F40476fB",
    },
    {
      key: "Arbitrum",
      wallet: true,
      qrImage: <ArbitrumSVG />,
      icon: {
        path: "gtp:arbitrum-logo-monochrome",
        color: "#1DF7EF",
      },
      url: "https://arbitrum.io/donate/",
      address: "0x7291a5Aa55886900C460Bf4366A46820F40476fB",
    },
    {
      key: "Base",
      wallet: true,
      qrImage: <BaseSVG />,
      icon: {
        path: "gtp:base-logo-monochrome",
        color: "#0052FF",
      },
      url: "https://baseledger.io/donate/",
      address: "0x7291a5Aa55886900C460Bf4366A46820F40476fB",
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
    <>
      <Container className="pb-[15px]">
        <div className="flex flex-col gap-y-[15px]">
          <Heading
            as="h3"
            className="leading-[120%] text-[20px] md:text-[20px] break-inside-avoid"
          >
            Ways to Donate to Us
          </Heading>
          <Description className="!pb-[15px]">
            You can donate anytime by sending tokens to one of our following
            wallets:
          </Description>
        </div>
        <div className="w-full pb-[30px] grid gap-[10px] grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 justify-items-stretch">
          {QRCodes.map((CardData, index) => (
            <QRCodeCard key={index} CardData={CardData} index={index} />
          ))}
        </div>
        <div className="flex flex-col gap-y-[15px]">
          <div className="text-[20px] font-bold">
            Active Public Goods Funding Rounds
          </div>
          <div className="text-[14px]">
            These are the currently active public goods funding rounds that we
            participate in. Be fast and donate now, they usually run for a short
            time only.
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer className="">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[115px_200px_90px_minmax(100px,800px)_200px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] !pt-[15px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="center">Time Left</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Name</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Share</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Donate Until</GridTableHeaderCell>
        </GridTableHeader>
        <div className="flex flex-col gap-y-[3px]">
          {PGFData &&
            PGFData.map((donation) => (
              <GridTableRow
                gridDefinitionColumns="grid-cols-[115px_200px_90px_minmax(100px,800px)_200px] justify-items-stretch"
                key={donation.name}
                className="text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] h-[34px] select-none"
              >
                <div className="bg-[#1F2726] h-full rounded-full flex items-center justify-center text-[16px] font-bold">
                  {getTimeLeft(donation.endDate)}
                </div>
                <div className="justify-center pl-[5px]">{donation.name}</div>
                <div className="flex gap-x-[10px]">
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
                <Link
                  href={donation.url}
                  target="_blank"
                  className="hover:underline"
                >
                  {donation.url}
                </Link>
                <div className="text-right">
                  {getDonateUntil(donation.endDate)}
                </div>
              </GridTableRow>
            ))}
        </div>
      </HorizontalScrollContainer>
      <Container className="flex flex-col gap-y-[15px] pt-[60px]">
        <div className="flex gap-x-[8px] items-center pb-[15px]" id="Community">
          <div className="w-[36px] h-[36px]">
            <Icon icon="gtp:gtp-donate" className="w-[36px] h-[36px]" />
          </div>
          <Heading
            className="leading-[120%] text-[36px] md:text-[36px] break-inside-avoid "
            as="h2"
          >
            Impact
          </Heading>
        </div>
        <Description className="!pb-[15px]">
          growthepie data and visualizations are used across many different
          sites, publishers and media. Our main focus is to cater towards end
          users and builders wanting to get the best overview of the entire
          Ethereum ecosystem. Therefore we support everyone who helps us achieve
          this mission.
        </Description>
        <div className="flex flex-col gap-y-[10px]">
          <div className="text-[20px] font-bold">
            Public use of our data and visualizations
          </div>
          <div className="text-[14px]">
            The following people and institutions mention us or use our data
            regularly, free of charge:
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer className="">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[425px_minmax(100px,800px)_120px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">Name</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date</GridTableHeaderCell>
        </GridTableHeader>
        <div className="flex flex-col gap-y-[3px]">
          {impactData &&
            impactData.map((impactRow) => (
              <GridTableRow
                gridDefinitionColumns="grid-cols-[425px_minmax(100px,800px)_120px] justify-items-stretch"
                key={impactRow.name}
                className="text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
              >
                <div className="justify-center">{impactRow.name}</div>
                <div className="flex gap-x-[10px]">
                  {impactRow.url && (
                    <Link
                      href={impactRow.url}
                      target="_blank"
                      className="w-full  truncate"
                    >
                      {impactRow.url}
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  {`since ${impactRow.date.replace(/-/g, "/")}`}
                </div>
              </GridTableRow>
            ))}
        </div>
      </HorizontalScrollContainer>
      <Container className="pt-[30px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="text-[20px] font-bold">Platform Updates</div>
          <div className="text-[14px]">
            The following people and institutions mention us or use our data
            regularly, free of charge:
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer className="">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[425px_minmax(100px,800px)_120px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">
            Product Feature
          </GridTableHeaderCell>
          <GridTableHeaderCell justify="start">
            Announcement Link
          </GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date Released</GridTableHeaderCell>
        </GridTableHeader>
        <div className="flex flex-col gap-y-[3px]">
          {updateData &&
            updateData.map((updateRow) => (
              <GridTableRow
                gridDefinitionColumns="grid-cols-[425px_minmax(100px,800px)_120px] justify-items-stretch"
                key={updateRow.name}
                className="text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
              >
                <div className="flex items-center w-full h-full">
                  {updateRow.name}
                </div>
                <div className="flex ">
                  <Link
                    href={updateRow.url}
                    target="_blank"
                    className="w-full truncate"
                  >
                    {updateRow.url}
                  </Link>
                </div>
                <div className="flex items-center justify-end w-full h-full gap-x-[3px]">
                  {updateRow.date.replace(/-/g, "/")}
                </div>
              </GridTableRow>
            ))}
        </div>
      </HorizontalScrollContainer>
      <Container className="pt-[65px]">
        <div className="flex gap-x-[8px] items-center pb-[15px]">
          <div className="w-[36px] h-[36px]">
            <Icon icon="gtp:gtp-support" className="w-[36px] h-[36px]" />
          </div>
          <Heading
            className="leading-[120%] text-[36px] md:text-[36px] break-inside-avoid "
            as="h2"
          >
            Support
          </Heading>
        </div>
        <Description className="!pb-[15px]">
          We received grants between 50k - 150k USD from the following partners,
          communities or foundations.
        </Description>
        <div className="grid gap-x-[15px] grid-flow-col">
          {Supporters.map((s) => (
            <Link
              key={s.name}
              target="_blank"
              rel="noopener noreferrer"
              href={s.url}
              className="relative flex items-center justify-center h-[98px] md:h-[98px] cursor-pointer"
            >
              <div className="w-full xl:w-3/5">
                <s.svg />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}

const QRCodeCard = ({ CardData, index }) => {
  const [copiedAddress, setCopiedAddress] = useState(null);
  const copyAddressTimeout = useRef<NodeJS.Timeout>();

  const handleCopyAddress = (address) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Use clipboard API if available
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setCopiedAddress(address);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    } else {
      // Fallback method for environments without clipboard API
      const tempInput = document.createElement("input");
      tempInput.value = address;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopiedAddress(address);
    }

    if (copyAddressTimeout.current) {
      clearTimeout(copyAddressTimeout.current);
    }

    copyAddressTimeout.current = setTimeout(() => {
      setCopiedAddress(null);
    }, 3000);
  };
  return (
    <div
      className={`group flex items-center gap-x-[10px] p-[5px] pr-[15px] border-[2px] rounded-[17px] border-[#CDD8D3] cursor-pointer`}
      onClick={() => {
        if (CardData.wallet) {
          handleCopyAddress(CardData.address);
        } else {
          window.open(CardData.url, "_blank");
        }
      }}
      key={CardData.key}
    >
      <div className="w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] block">
        <div className="w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] block relative">
          {/* <Image
        src={CardData.qrImage}
        alt="QR Code"
        width={64}
        height={64}
      /> */}
          {CardData.qrImage}
          {/* <div className="absolute top-0 left-0 w-[64px] h-[64px] bg-opacity-50 flex items-center justify-center" /> */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              icon={CardData.icon.path}
              color={CardData.icon.color}
              className="w-[15px] h-[15px]"
            />
          </div>
        </div>
      </div>
      <div className="h-full w-full flex flex-col justify-between items-start leading-[111%] py-[5px] sm:py-[5px]">
        {CardData.wallet ? (
          <>
            <div className="w-full hidden xs:block text-[11px] md:text-[14px] truncate text-wrap">
              Donate to our <b>{CardData.key}</b> Wallet
            </div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
            <div className="@container flex w-full items-center hover:bg-transparent select-none text-[9px] leading-[120%]">
              <span
                className="@container flex-1 flex items-center hover:bg-transparent"
                style={{
                  fontFeatureSettings: "'pnum' on, 'lnum' on",
                }}
              >
                <div
                  className="truncate transition-all duration-300"
                  style={{ direction: "ltr" }}
                  onClick={() => {
                    navigator.clipboard.writeText(CardData.address);
                  }}
                >
                  {CardData.address.slice(0, CardData.address.length - 5)}
                </div>
                <div className="transition-all duration-300">
                  {CardData.address.slice(-5)}
                </div>
                <div className="pl-[5px]">
                  <Icon
                    icon={
                      copiedAddress === CardData.address
                        ? "feather:check-circle"
                        : "feather:copy"
                    }
                    className="w-[9px] h-[9px] cursor-pointer z-[10] opacity-0 group-hover:opacity-100"
                    // onClick={(e) => {
                    //   e.stopPropagation();
                    //   handleCopyAddress(CardData.address);
                    // }}
                  />
                </div>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-full hidden xs:block text-[11px] md:text-[14px] truncate text-wrap">
              Donate on our <b>{CardData.key}</b> Page
            </div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const GivethSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 73 72">
    <path
      fill="#CDD8D3"
      d="M21.4 4.15a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H44.6a.82.82 0 0 0 0 1.64h1.12V4.15h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 0 0 0 1.64h1.13V4.15h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 4.15h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64ZM22.27 6.1h-1.02a.82.82 0 1 0 0 1.64h1.14V6.09h-.11Z"
    />
    <path fill="#CDD8D3" d="M23.35 6.1h-.97v1.64h1.95V6.09h-.98Z" />
    <path
      fill="#CDD8D3"
      d="M25.45 6.1h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm9.73 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V6.09h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.8 6.1h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65ZM21.4 8.04a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.85 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.02a.82.82 0 1 0 0 1.65h1.13V8.04H32Zm1.08 0h-.97v1.65h1.95V8.04h-.98Zm1.95 0h-.97v1.65H36V8.04h-.97Zm1.94 0H36v1.65h1.95V8.04h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13V8.04h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.65 8.04h-.97v1.65h1.94V8.04h-.97Zm1.95 0h-.98v1.65h1.95V8.04h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 8.04h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65ZM23.35 9.98a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.14 9.98h-.98v1.65h1.95V9.98h-.97Zm1.94 0h-.97v1.65h1.95V9.98h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.87 9.98h-.98v1.65h1.95V9.98h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.54 0h-1a.82.82 0 1 0 0 1.65h1.12V9.98h-.11Zm1.1 0h-.98v1.65h1.95V9.98h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 9.98h-1.14v1.65h1.12a.82.82 0 1 0 0-1.65Zm-26.54 1.95h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.8 11.93h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-26.53 1.95h-1.02a.82.82 0 1 0 0 1.64h1.14v-1.64h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M23.5 13.88h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm10.44 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.91 13.88h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm4.59 0h-1a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.1 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 13.88h-1.14v1.64h1.12a.82.82 0 1 0 0-1.64Zm-31.3 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM21.4 17.77a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.97Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm-40.16 1.94H9.58a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.02a.82.82 0 1 0 0 1.65h1.14v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M23.35 19.71h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M27.25 19.71h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.1 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.54 19.71h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.53 19.71h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm6.55 0h-1.02a.82.82 0 0 0 0 1.65h1.14v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M66.17 19.71h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM8.64 21.66H7.63a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0H10.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M41.02 21.66h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M56.59 21.66h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M64.22 21.66h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM5.84 23.6a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.8 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65H36v-1.64h-.11Zm1.23 0H36v1.65h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.64h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M64.22 23.6h-.97v1.65h1.94v-1.64h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm-55.73 1.95H9.58a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0H10.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm12.53 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M29.34 25.55h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0H44.6a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.08 0h-.97v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.65 25.55h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M56.59 25.55h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm8.49 0h-1.02a.82.82 0 0 0 0 1.65h1.14v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M66.17 25.55h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM6.7 27.5H5.69a.82.82 0 0 0 0 1.64h1.12V27.5H6.7Z"
    />
    <path
      fill="#CDD8D3"
      d="M7.79 27.5H6.8v1.64h1.95V27.5h-.97Zm2.09 0H8.76v1.64h1.12a.82.82 0 1 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Zm1.09 0h-.97v1.64h1.94V27.5h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm6.54 0H23.2a.82.82 0 1 0 0 1.64h1.13V27.5h-.12Zm1.09 0h-.97v1.64h1.94V27.5h-.97Zm1.95 0h-.98v1.64h1.95V27.5h-.97Zm1.95 0h-.98v1.64h1.95V27.5h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.14 27.5h-.98v1.64h1.95V27.5h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.54 27.5h-.97v1.64h1.95V27.5h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM5.84 29.45a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.59 0H19.3a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.08 0h-.96v1.64h1.94v-1.64h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.55 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M56.44 29.45h-.98v1.64h1.95v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM16.43 31.4H15.4a.82.82 0 0 0 0 1.64h1.15v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M17.67 31.4h-1.13v1.64h1.13a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.65h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64H36v-1.65h-.11Zm1.23 0H36v1.64h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.76 0h-1.02a.82.82 0 0 0 0 1.64h1.13v-1.65h-.12Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94v-1.65h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.65ZM7.79 33.34a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.83 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0H19.3a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.08 0h-.96v1.64h1.94v-1.64h-.97Zm1.95 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.55 0H44.6a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.08 0h-.97v1.64h1.95v-1.64h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M64.22 33.34h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64ZM8.64 35.28H7.63a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H8.76v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.02a.82.82 0 1 0 0 1.65h1.14v-1.65h-.11Z"
    />
    <path fill="#CDD8D3" d="M23.35 35.28h-.97v1.65h1.95v-1.65h-.98Z" />
    <path
      fill="#CDD8D3"
      d="M25.45 35.28h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.02a.82.82 0 1 0 0 1.65h1.13v-1.65H32Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.87 35.28h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H61.3v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM6.7 37.23H5.69a.82.82 0 0 0 0 1.64h1.12v-1.64H6.7Z"
    />
    <path
      fill="#CDD8D3"
      d="M7.94 37.23H6.8v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm8.5 0h-1.02a.82.82 0 1 0 0 1.64h1.14v-1.64h-.11Z"
    />
    <path fill="#CDD8D3" d="M23.35 37.23h-.97v1.64h1.95v-1.64h-.98Z" />
    <path
      fill="#CDD8D3"
      d="M25.45 37.23h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64H36v-1.64h-.97Zm1.94 0H36v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M41.02 37.23h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.6 0H44.6a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.54 37.23h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm11.52 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM6.7 39.18H5.69a.82.82 0 1 0 0 1.64h1.12v-1.64H6.7Z"
    />
    <path
      fill="#CDD8D3"
      d="M7.79 39.18H6.8v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm13.47 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64H36v-1.64h-.11Zm1.08 0H36v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M56.44 39.18h-.98v1.64h1.95v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64ZM5.84 41.12a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm16.43 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm1.95 0h-.98v1.65h1.94v-1.65h-.97Zm2.09 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm14.33 0H44.6a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 41.12h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.02a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.08 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-56.43 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H15.4a.82.82 0 0 0 0 1.64h1.15v-1.64h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M17.67 43.07h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.85 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64H36v-1.64h-.11Zm1.08 0H36v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0H61.3v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM6.7 45.01H5.69a.82.82 0 1 0 0 1.65h1.12v-1.65H6.7Z"
    />
    <path
      fill="#CDD8D3"
      d="M7.79 45.01H6.8v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0H10.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path fill="#CDD8D3" d="M29.2 45.01h-.98v1.65h1.95v-1.65h-.98Z" />
    <path
      fill="#CDD8D3"
      d="M31.29 45.01h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.84 46.96a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H44.6a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm13.47 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.84 48.9a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M15.72 48.9H14.6v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0H19.3a.82.82 0 1 0 0 1.65h1.12V48.9h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.67 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0H44.6a.82.82 0 1 0 0 1.65h1.12V48.9h-.11Zm1.08 0h-.97v1.65h1.95V48.9h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.8 48.9h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Zm1.09 0h-.97v1.65h1.95V48.9h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M64.22 48.9h-.97v1.65h1.94V48.9h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM5.84 50.85a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H9.58a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0H10.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0H15.4a.82.82 0 1 0 0 1.65h1.15v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M17.52 50.85h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.96v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.45 50.85h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65H36v-1.65h-.11Zm1.23 0H36v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM21.4 52.8a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.65 0h-1.01a.82.82 0 1 0 0 1.64h1.12V52.8h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13V52.8h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M62.42 52.8H61.3v1.64h1.12a.82.82 0 1 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-44.76 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.1 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 54.74h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-41.95 1.95H23.2a.82.82 0 1 0 0 1.64h1.13V56.7h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm12.38 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm13.47 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.95V56.7h-.98Zm1.95 0h-.97v1.64h1.94V56.7h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm-45.99 1.94h-1.02a.82.82 0 1 0 0 1.65h1.14v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M23.5 58.63h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.8 58.63h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M62.42 58.63H61.3v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM21.4 60.58a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.76 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.14 60.58h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M41.02 60.58h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm9.73 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M64.22 60.58h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm-44.05 1.95h-1.02a.82.82 0 1 0 0 1.64h1.14v-1.64h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M23.35 62.53h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M27.25 62.53h-.98v1.64h1.95v-1.64h-.97Zm1.95 0h-.98v1.64h1.94v-1.64h-.97Zm2.09 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M56.59 62.53h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-40.87 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm12.54 0h-1.01a.82.82 0 1 0 0 1.65H36v-1.65h-.11Zm1.23 0H36v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm-41.02 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M29.34 66.42h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm6.55 0h-1.01a.82.82 0 1 0 0 1.64H36v-1.64h-.11Zm1.23 0H36v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H44.6a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.08 0h-.97v1.64h1.95v-1.64h-.97Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.7 66.42h-1.14v1.64h1.12a.82.82 0 1 0 0-1.64Zm13.46 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM13.84 4H9.52a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.6c0-2.54-2.09-4.6-4.65-4.6Zm2.6 9.02c0 1.4-1.16 2.56-2.6 2.56H9.52a2.58 2.58 0 0 1-2.6-2.56V8.6a2.5 2.5 0 0 1 1.1-2.1c.43-.29.94-.46 1.5-.46h4.32c1.44 0 2.6 1.15 2.6 2.56v4.42ZM64.43 4h-4.32a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.6C69.08 6.06 67 4 64.43 4Zm2.61 9.02a2.6 2.6 0 0 1-2.6 2.56H60.1a2.58 2.58 0 0 1-2.6-2.56V8.6a2.5 2.5 0 0 1 1.1-2.1c.43-.29.95-.46 1.5-.46h4.32a2.59 2.59 0 0 1 2.61 2.56v4.42ZM13.84 54.6H9.52a4.65 4.65 0 0 0-4.65 4.6v4.41c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V59.2c0-2.53-2.09-4.6-4.65-4.6Zm2.6 9.01a2.58 2.58 0 0 1-2.6 2.56H9.52a2.58 2.58 0 0 1-2.6-2.56V59.2a2.5 2.5 0 0 1 1.1-2.09c.43-.3.94-.46 1.5-.46h4.32c1.44 0 2.6 1.14 2.6 2.55v4.42Z"
    />
    <path
      fill="#CDD8D3"
      d="M10.35 13.72c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .69-1.29c.26-.18.57-.28.91-.28H13c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56h-2.65Zm50.6 0c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.18.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56h-2.64Zm-50.6 50.6c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .69-1.29c.26-.18.57-.28.91-.28H13c.88 0 1.6.7 1.6 1.56v2.7c0 .87-.72 1.57-1.6 1.57h-2.65Z"
    />
    <g clip-path="url(#a)">
      <path
        fill="#1F2726"
        d="M44.9 25.3H28.83a2.68 2.68 0 0 0-2.68 2.67v16.06c0 1.47 1.2 2.67 2.68 2.67H44.9c1.48 0 2.68-1.2 2.68-2.67V27.97c0-1.48-1.2-2.67-2.68-2.67Z"
      />
      {/* <path fill="#CDD8D3" d="M43.87 35.7c-.02.22-.02.43-.05.64a7.4 7.4 0 0 1-3.13 5.32 7.2 7.2 0 0 1-4.56 1.38 7.37 7.37 0 0 1-5-2.13v-.08l5.24-5.24c.04-.04.1-.06.15-.06h7.35v.18ZM36.55 28c.2.02.41.02.62.05a7.42 7.42 0 0 1 3.34 1.2l-.64.65-.42.42a.06.06 0 0 1-.06 0 5.98 5.98 0 0 0-8.84 3.72 5.98 5.98 0 0 0 .63 4.52v.05l-1.05 1.05-.02.02-.1-.16a7.5 7.5 0 0 1 5.06-11.4c.34-.06.7-.08 1.04-.11l.07-.01h.37Zm3.8 4.54a1.36 1.36 0 0 1 1.09-1.32 1.35 1.35 0 0 1 1.55 1.71 1.35 1.35 0 0 1-2.24.57 1.35 1.35 0 0 1-.4-.96Z" /> */}
    </g>
    <defs>
      <clipPath id="a">
        <path
          fill="#fff"
          d="M0 0h21.41v21.41H0z"
          transform="translate(26.16 25.3)"
        />
      </clipPath>
    </defs>
  </svg>
);

const EthereumSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 73 72">
    <path
      fill="#CDD8D3"
      d="M26.53 4.15a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12V4.15h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13V4.15h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.3 4.15h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13V4.15h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM24.58 6.1a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V6.09h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13V6.09h-.12Zm1.23 0h-1.1v1.64h1.12a.82.82 0 0 0 0-1.65Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65ZM20.7 8.04a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.12V8.04h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM20.7 9.98a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Zm1.09 0h-.97v1.65h1.94V9.98h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12V9.98h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm-26.54 1.95h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.58 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M47.93 11.93h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM23.5 13.88h-1.02a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm8.49 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64ZM20.7 15.82a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM23.5 17.77h-1.02a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.08 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm17.52 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-40.01 1.94H10.8a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm10.43 0H61.4a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM9.87 21.66H8.86a.82.82 0 1 0 0 1.65H10v-1.65h-.12Zm1.09 0H10v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M13.06 21.66h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm23.35 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M47.93 21.66h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.61 21.66h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.5 21.66h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM5.12 23.6a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0H8.86a.82.82 0 0 0 0 1.65H10v-1.64h-.12Zm1.24 0H10v1.65h1.12a.82.82 0 0 0 0-1.64Zm4.59 0h-1a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.1 0h-.97v1.65h1.94v-1.64h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.64h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm4.59 0H36.1a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M38.36 23.6h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm10.43 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.64h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.64h-.11Zm1.09 0h-.97v1.65h1.94v-1.64h-.97Zm2.09 0H56.7v1.65h1.12a.82.82 0 0 0 0-1.64Zm6.55 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.09 0h-.97v1.65h1.94v-1.64h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64ZM9.02 25.55a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.6 0h-1.02a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.08 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.23 0h-1.1v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.5 25.55h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM5.12 27.5a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 0 0 0 1.64h1.12V27.5h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M18.9 27.5h-1.14v1.64h1.12a.82.82 0 1 0 0-1.64Zm9.57 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13V27.5h-.12Zm1.09 0h-.97v1.64h1.95V27.5h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1.01a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Zm1.24 0H56.7v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM5.98 29.45H4.97a.82.82 0 1 0 0 1.64H6.1v-1.64h-.12Zm1.09 0H6.1v1.64h1.94v-1.64h-.97Zm2.09 0H8.04v1.64h1.12a.82.82 0 0 0 0-1.64Zm9.59 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.02a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64ZM5.12 31.4a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.76 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.65h-.11Zm1.09 0h-.98v1.64h1.95v-1.65h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M32.37 31.4h-.98v1.64h1.95v-1.65h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94v-1.65h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.65h-.11Zm1.09 0h-.98v1.64h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.65 31.4h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65ZM5.12 33.34a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.83 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.79 33.34h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm12.53 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.65 33.34h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-53.64 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.67 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm12.53 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM9.02 37.23a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.83 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm15.57 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.67 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.09 0h-1.12v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.7 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM5.98 39.18H4.97a.82.82 0 1 0 0 1.64H6.1v-1.64h-.12Zm1.24 0H6.1v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0H27.5v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64H46Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M57.66 39.18h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.65 39.18h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM7.07 41.12a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H10.8a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm6.54 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path fill="#CDD8D3" d="M20.7 41.12h-.98v1.65h1.95v-1.65h-.98Z" />
    <path
      fill="#CDD8D3"
      d="M22.64 41.12h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.5 41.12h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-53.78 1.95H10.8a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.08 0h-.97v1.64h1.95v-1.64h-.97Zm1.95 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M18.9 43.07h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.02a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.2 43.07h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm9.73 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM5.98 45.01H4.97a.82.82 0 1 0 0 1.65H6.1v-1.65h-.12Zm1.24 0H6.1v1.65h1.12a.82.82 0 1 0 0-1.65Zm14.33 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.64 45.01h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65H46Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.76 45.01h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.12 46.96a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.02a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.6 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M67.54 46.96h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM5.12 48.9a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0H10.8a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm6.54 0h-1a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M20.84 48.9h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Zm1.09 0h-.97v1.65h1.94V48.9h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0H36.1a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M38.36 48.9h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm11.52 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12V48.9h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM5.98 50.85H4.97a.82.82 0 1 0 0 1.65H6.1v-1.65h-.12Zm1.24 0H6.1v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0H10.8a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.79 50.85h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0H27.5v1.65h1.13a.82.82 0 0 0 0-1.65Zm22.11 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.13a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM20.7 52.8a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm9.72 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0H36.1a.82.82 0 1 0 0 1.64h1.13V52.8h-.12Zm1.09 0h-.97v1.64h1.95V52.8h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.15 52.8h-.97v1.64h1.94V52.8h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm9.58 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.12V52.8h-.11Zm1.23 0h-1.12v1.64h1.13a.82.82 0 1 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-43.9 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.64 54.74h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M32.37 54.74h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm10.44 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65H46Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-35.03 1.95a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V56.7h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.64h1.95V56.7h-.97Zm1.94 0h-.97v1.64h1.95V56.7h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm-44.9 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.04 58.63h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-43.9 1.95h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.64 60.58h-.98v1.64h1.95v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.79 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-44.76 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.83 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.26 62.53h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.59 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M63.5 62.53h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm-44.9 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0H36.1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M38.36 64.47h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm9.57 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0H61.4a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm-44.9 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M47.93 66.42h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.92 66.42H52.8v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM13.12 4H8.8a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.6c0-2.54-2.08-4.6-4.65-4.6Zm2.61 9.02a2.6 2.6 0 0 1-2.6 2.56H8.8a2.58 2.58 0 0 1-2.6-2.56V8.6a2.5 2.5 0 0 1 1.1-2.1c.43-.29.95-.46 1.5-.46h4.32a2.59 2.59 0 0 1 2.61 2.56v4.42ZM63.72 4H59.4a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.54 2.08 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.6c0-2.54-2.09-4.6-4.65-4.6Zm2.6 9.02a2.6 2.6 0 0 1-2.6 2.56H59.4a2.58 2.58 0 0 1-2.61-2.56V8.6a2.5 2.5 0 0 1 1.11-2.1c.42-.29.94-.46 1.5-.46h4.32c1.43 0 2.6 1.15 2.6 2.56v4.42ZM13.12 54.6H8.8a4.65 4.65 0 0 0-4.65 4.6v4.41c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V59.2c0-2.53-2.08-4.6-4.65-4.6Zm2.61 9.01a2.59 2.59 0 0 1-2.6 2.56H8.8a2.58 2.58 0 0 1-2.6-2.56V59.2a2.5 2.5 0 0 1 1.1-2.09c.43-.3.95-.46 1.5-.46h4.32a2.58 2.58 0 0 1 2.61 2.55v4.42Z"
    />
    <path
      fill="#CDD8D3"
      d="M9.64 13.72c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.18.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56H9.64Zm50.59 0c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .69-1.29c.25-.18.57-.28.91-.28h2.65c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56h-2.65ZM9.64 64.32c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.18.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.56v2.7c0 .87-.72 1.57-1.6 1.57H9.64Z"
    />
    <g clip-path="url(#a)">
      <path
        fill="#1F2726"
        d="M44.18 25.3H28.12a2.68 2.68 0 0 0-2.67 2.67v16.06c0 1.47 1.2 2.67 2.67 2.67h16.06c1.48 0 2.67-1.2 2.67-2.67V27.97c0-1.48-1.2-2.67-2.67-2.67Z"
      />
      <g clip-path="url(#b)">
        <g fill="#C1C1C1" clip-path="url(#c)">
          {/* <path d="m35.65 39.13-4.48-2.64 4.48 6.28 4.48-6.28-4.48 2.64Z" />
          <path d="m35.65 28.23 4.48 7.41-4.48 2.65-4.48-2.65 4.48-7.41Z" /> */}
        </g>
      </g>
    </g>
    <defs>
      <clipPath id="a">
        <path
          fill="#fff"
          d="M0 0h21.41v21.41H0z"
          transform="translate(25.45 25.3)"
        />
      </clipPath>
      <clipPath id="b">
        <path fill="#fff" d="M0 0h15v15H0z" transform="translate(28.15 28)" />
      </clipPath>
      <clipPath id="c">
        <path
          fill="#fff"
          d="M0 0h15v14.54H0z"
          transform="translate(28.15 28.23)"
        />
      </clipPath>
    </defs>
  </svg>
);

const OptimismSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    fill="none"
    viewBox="0 0 73 72"
  >
    <defs>
      <path id="d" fill="#fff" d="M0 0h15v15H0z" />
    </defs>
    <path
      fill="#CDD8D3"
      d="M26.81 4.15a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V4.15h-.12Zm1.09 0h-.97v1.64h1.94V4.15h-.97Zm1.95 0h-.98v1.64h1.95V4.15h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.54 4.15h-.97v1.64h1.94V4.15h-.97Zm1.95 0h-.97v1.64h1.94V4.15h-.97Zm1.94 0h-.97v1.64h1.95V4.15h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 4.15H41.4v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12V4.15h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM25.72 6.1h-1.01a.82.82 0 1 0 0 1.64h1.13V6.09h-.12Zm1.09 0h-.97v1.64h1.95V6.09h-.98Zm1.95 0h-.97v1.64h1.94V6.09h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm8.63 0h-1.01a.82.82 0 1 0 0 1.64h1.14V6.09h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.48 6.1h-1.13v1.64h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65ZM20.97 8.04a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.63 0h-1a.82.82 0 1 0 0 1.65h1.12V8.04h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13V8.04h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.26 8.04h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM20.97 9.98a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0H28.6a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.98h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-26.54 1.95h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 11.93H41.4v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0H49.2v1.65h1.12a.82.82 0 0 0 0-1.65Zm-26.53 1.95h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-31.14 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-28.33 1.95h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.64 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM12.1 19.71h-1a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M13.34 19.71h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.1 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.7 19.71h-1.14v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 19.71H41.4v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.26 19.71h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm10.44 0h-1.02a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.23 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm-53.78 1.95H9.14a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H49.2v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 21.66h-.98v1.65h1.95v-1.65h-.98Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65ZM5.4 23.6a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm10.6 0h-1.02a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.64h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0H53.9a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.09 0h-.97v1.65h1.94v-1.64H56Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.09 0h-.97v1.65h1.94v-1.64h-.97Zm2.1 0H66.7v1.65h1.13a.82.82 0 0 0 0-1.64Zm-57.68 1.95H9.14a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 0 0 0 1.65H20v-1.65h-.12Zm1.09 0H20v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M28.76 25.55h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.54 25.55h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm16.27 0H53.9a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65H56Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 25.55h-.98v1.65h1.95v-1.65h-.98Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0H66.7v1.65h1.13a.82.82 0 0 0 0-1.65ZM5.4 27.5a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H9.14a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M11.4 27.5h-1.14v1.64h1.12a.82.82 0 1 0 0-1.64Zm6.54 0h-1.01a.82.82 0 0 0 0 1.64h1.13V27.5h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M19.03 27.5h-.98v1.64H20V27.5h-.97Zm2.09 0H20v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13V27.5h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.43 27.5h-.97v1.64h1.95V27.5h-.98Zm1.95 0h-.97v1.64h1.94V27.5h-.97Zm1.95 0h-.98v1.64h1.95V27.5h-.97Zm1.94 0h-.97v1.64h1.94V27.5h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12V27.5h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM6.26 29.45H5.25a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path fill="#CDD8D3" d="M9.3 29.45h-.98v1.64h1.95v-1.64H9.3Z" />
    <path
      fill="#CDD8D3"
      d="M11.4 29.45h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.67 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H49.2v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M65.88 29.45h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64ZM5.4 31.4a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm7.8 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.64h1.12v-1.65h-.11Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 31.4H41.4v1.64h1.12a.82.82 0 0 0 0-1.65Zm10.44 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.65h-.11Zm1.08 0h-.97v1.64h1.95v-1.65h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94v-1.65h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65ZM5.4 33.34a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm9.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1.01a.82.82 0 1 0 0 1.64H20v-1.64h-.12Zm1.24 0H20v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm14.47 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.05 33.34h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64H56Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 33.34h-.98v1.64h1.95v-1.64h-.98Zm1.94 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm-51.83 1.94h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm10.44 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M28.9 35.28h-1.12v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.14v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.48 35.28h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm10.43 0H53.9a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.4 37.23a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm10.44 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M28.76 37.23h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm8.48 0h-1.01a.82.82 0 0 0 0 1.64h1.14v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.48 37.23h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.08 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64H56Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 37.23h-.98v1.64h1.95v-1.64h-.98Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM7.35 39.18a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H49.2v1.64h1.12a.82.82 0 0 0 0-1.64Zm8.49 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 39.18h-.98v1.64h1.95v-1.64h-.98Zm1.94 0h-.97v1.64h1.94v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM5.4 41.12a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M13.19 41.12h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65H20v-1.65h-.12Zm1.09 0H20v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M28.9 41.12h-1.12v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm18.37 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M65.88 41.12h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM6.26 43.07H5.25a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0H6.38v1.64H7.5a.82.82 0 0 0 0-1.64Zm4.6 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M13.19 43.07h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M19.18 43.07h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0H28.6a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.79 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm9.73 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM6.26 45.01H5.25a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H6.38v1.65H7.5a.82.82 0 1 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.02 45.01h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm4.59 0H28.6a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.43 45.01h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M60.04 45.01h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.4 46.96a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M50.16 46.96h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0H66.7v1.65h1.13a.82.82 0 0 0 0-1.65ZM5.4 48.9a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65H20V48.9h-.12Zm1.24 0H20v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Zm1.09 0h-.97v1.65h1.94V48.9h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M30.7 48.9h-.97v1.65h1.95V48.9h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.9h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M65.88 48.9h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM6.26 50.85H5.25a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H6.38v1.65H7.5a.82.82 0 1 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm16.42 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.08 0h-.96v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65H56Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M59.9 50.85h-.98v1.65h1.95v-1.65h-.98Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-43.9 1.95h-1.01a.82.82 0 1 0 0 1.64h1.13V52.8h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm13.47 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V52.8h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 52.8H41.4v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13V52.8h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-43.9 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.02 54.74h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.58 54.74h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M52.26 54.74h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-30.29 1.95H28.6a.82.82 0 1 0 0 1.64h1.13V56.7h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94V56.7h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.64h1.94V56.7h-.97Zm1.94 0h-.97v1.64h1.95V56.7h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M65.88 56.69h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm-44.05 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.43 58.63h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M50.16 58.63h-.97v1.65h1.95v-1.65h-.98Zm1.94 0h-.96v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65H56Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M60.04 58.63h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-43.9 1.95h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.02 60.58h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm4.59 0H28.6a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H49.2v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M65.88 60.58h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm-36.27 1.95H28.6a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.7 62.53h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M42.53 62.53H41.4v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H49.2v1.64h1.12a.82.82 0 0 0 0-1.64Zm10.44 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0H66.7v1.64h1.13a.82.82 0 0 0 0-1.64ZM37.4 64.47h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.02a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.08 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0H66.7v1.65h1.13a.82.82 0 1 0 0-1.65Zm-40.16 1.95h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M30.7 66.42h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M36.54 66.42h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.14v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.48 66.42h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.95v-1.64h-.98Zm1.94 0h-.96v1.64h1.94v-1.64h-.97Zm2.1 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.7 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM13.4 4H9.1a4.65 4.65 0 0 0-4.66 4.6v4.42c0 2.54 2.1 4.6 4.66 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.6c0-2.54-2.1-4.6-4.65-4.6Zm2.61 9.02a2.6 2.6 0 0 1-2.6 2.56H9.09a2.58 2.58 0 0 1-2.61-2.56V8.6a2.5 2.5 0 0 1 1.1-2.1c.43-.29.95-.46 1.5-.46h4.33c1.43 0 2.6 1.15 2.6 2.56v4.42ZM64 4h-4.32a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.54 2.09 4.6 4.65 4.6H64a4.63 4.63 0 0 0 4.65-4.6V8.6C68.65 6.06 66.56 4 64 4Zm2.6 9.02c0 1.4-1.16 2.56-2.6 2.56h-4.32a2.58 2.58 0 0 1-2.6-2.56V8.6a2.5 2.5 0 0 1 1.1-2.1c.43-.29.94-.46 1.5-.46H64c1.44 0 2.6 1.15 2.6 2.56v4.42ZM13.4 54.6H9.1a4.65 4.65 0 0 0-4.66 4.6v4.41c0 2.54 2.1 4.6 4.66 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V59.2c0-2.53-2.1-4.6-4.65-4.6Zm2.61 9.01a2.59 2.59 0 0 1-2.6 2.56H9.09a2.58 2.58 0 0 1-2.61-2.56V59.2a2.5 2.5 0 0 1 1.1-2.09c.43-.3.95-.46 1.5-.46h4.33c1.43 0 2.6 1.14 2.6 2.55v4.42Z"
    />
    <path
      fill="#CDD8D3"
      d="M9.92 13.72c-.88 0-1.6-.7-1.6-1.56v-2.7A1.53 1.53 0 0 1 9 8.16c.26-.18.58-.28.92-.28h2.65c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56H9.92Zm50.6 0c-.89 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.18.57-.28.91-.28h2.65c.88 0 1.6.7 1.6 1.56v2.71c0 .86-.72 1.56-1.6 1.56h-2.65Zm-50.6 50.6c-.88 0-1.6-.7-1.6-1.56v-2.7a1.53 1.53 0 0 1 .68-1.3c.26-.18.58-.28.92-.28h2.65c.88 0 1.6.7 1.6 1.56v2.7c0 .87-.72 1.57-1.6 1.57H9.92Z"
    />
    <g clip-path="url(#a)">
      <path
        fill="#1F2726"
        d="M44.46 25.3H28.41a2.68 2.68 0 0 0-2.68 2.67v16.06c0 1.47 1.2 2.67 2.68 2.67h16.05c1.48 0 2.68-1.2 2.68-2.67V27.97c0-1.48-1.2-2.67-2.68-2.67Z"
      />
      <g clip-path="url(#b)">
        <g fill="#FE5468" clip-path="url(#c)">
          {/* <path d="M33.83 36.68a.8.8 0 0 0 .53-.18c.15-.13.26-.32.32-.57a13.33 13.33 0 0 0 .23-1.17c0-.34-.18-.51-.54-.51a.83.83 0 0 0-.54.18c-.15.13-.25.31-.31.57a12.05 12.05 0 0 0-.23 1.16c0 .35.18.52.54.52Zm4.37-1.39c.16 0 .3-.04.42-.13s.2-.21.23-.37a.92.92 0 0 0 .02-.17c0-.11-.03-.2-.1-.25-.06-.06-.17-.1-.32-.1h-.68l-.21 1.02h.65Z" /> */}
          {/* <path fill-rule="evenodd" d="M43.43 35.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Zm-9.68 2a1.8 1.8 0 0 1-1.1-.32 1.08 1.08 0 0 1-.42-.91c0-.09 0-.19.02-.3l.21-.98c.26-1.03.92-1.55 1.98-1.55.29 0 .55.05.77.15a1.15 1.15 0 0 1 .74 1.1c0 .08 0 .18-.02.3l-.2.97c-.14.52-.37.9-.69 1.16-.32.25-.75.37-1.3.37Zm2.46-.06a.13.13 0 0 1-.1-.04.15.15 0 0 1-.01-.1l.78-3.66c0-.04.02-.08.06-.1a.17.17 0 0 1 .1-.04h1.5c.42 0 .75.08 1 .25.26.18.39.43.39.75l-.03.3c-.1.43-.28.75-.57.96-.28.2-.67.3-1.16.3h-.76l-.26 1.24a.2.2 0 0 1-.06.1.17.17 0 0 1-.11.04h-.77Z" clip-rule="evenodd" /> */}
        </g>
      </g>
    </g>
    <defs>
      <clipPath id="a">
        <path
          fill="#fff"
          d="M0 0h21.41v21.41H0z"
          transform="translate(25.73 25.3)"
        />
      </clipPath>
      <clipPath id="b">
        <use xlinkHref="#d" transform="translate(28.43 28)" />
      </clipPath>
      <clipPath id="c">
        <use xlinkHref="#d" transform="translate(28.43 28)" />
      </clipPath>
    </defs>
  </svg>
);

const ArbitrumSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 73 72">
    <path
      fill="#CDD8D3"
      d="M26.99 4.04a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12V4.04h-.11Zm1.24 0h-1.13V5.7h1.13a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13V4.04h-.12Zm1.24 0h-1.12V5.7h1.12a.82.82 0 0 0 0-1.65Zm6.54 0h-1a.82.82 0 1 0 0 1.65h1.13V4.04h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.54 4.04h-1.12V5.7h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM25.04 5.99a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V6h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.03 5.99H29.9v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12V6h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM21.15 7.93a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.12V7.93h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM21.15 9.88a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.88h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.03 9.88H29.9v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.88h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.6 9.88h-.96v1.65h1.94V9.88h-.97Zm2.1 0h-1.12v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.12V9.88h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-27.39 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 11.82h-.98v1.65h1.95v-1.65h-.98Zm1.94 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-28.48 1.95h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65H26v-1.65h-.97Zm2.1 0H26v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.77 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-31.28 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-28.33 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 17.66h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm11.52 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65ZM12.28 19.6h-1.01a.82.82 0 1 0 0 1.66h1.12V19.6h-.11Zm1.24 0h-1.13v1.66h1.13a.82.82 0 1 0 0-1.65Zm4.59 0H17.1a.82.82 0 1 0 0 1.66h1.13V19.6h-.12Zm1.24 0h-1.12v1.66h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.66h1.13V19.6h-.12Zm1.09 0h-.97v1.66h1.94V19.6h-.97Zm2.1 0h-1.13v1.66h1.13a.82.82 0 1 0 0-1.65Zm3.73 0a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm10.59 0h-1.01a.82.82 0 1 0 0 1.66H63V19.6h-.12Zm1.24 0H63v1.66h1.12a.82.82 0 1 0 0-1.65Zm-53.78 1.95H9.32a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 21.55h-.98v1.65h1.95v-1.65h-.98Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65H63v-1.65h-1Zm1.94 0H63v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M66.06 21.55h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM5.58 23.5a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H9.32a.82.82 0 1 0 0 1.65h1.13V23.5h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12V23.5h-.11Zm1.09 0h-.97v1.65h1.94V23.5h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M19.35 23.5h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12V23.5h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M27.14 23.5H26v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.65 0h-1.01a.82.82 0 1 0 0 1.65h1.13V23.5h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12V23.5h-.11Zm1.09 0h-.98v1.65h1.95V23.5h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0H63.8a.82.82 0 1 0 0 1.65h1.12V23.5h-.11Zm1.08 0h-.97v1.65h1.95V23.5h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M68 23.5h-1.12v1.65H68a.82.82 0 0 0 0-1.65ZM9.47 25.45a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64H26v-1.64h-.97Zm1.95 0H26v1.64h1.95v-1.64H27Zm1.94 0h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M32.83 25.45h-.98v1.64h1.95v-1.64h-.97Zm1.94 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M38.66 25.45h-.97v1.64h1.95v-1.64h-.98Zm2.1 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm6.54 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.54 25.45h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm6.55 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 25.45h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64H63v-1.64h-1Zm1.94 0H63v1.64h1.94v-1.64h-.97Z"
    />
    <path fill="#CDD8D3" d="M65.9 25.45h-.97v1.64h1.95v-1.64h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M68 25.45h-1.12v1.64H68a.82.82 0 1 0 0-1.64ZM5.58 27.4a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0H9.32a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.65Zm6.54 0H17.1a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.03 27.4H29.9v1.64h1.12a.82.82 0 1 0 0-1.65Zm8.49 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.6 27.4h-.96v1.64h1.94v-1.65h-.97Zm1.96 0h-.98v1.64h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.5 27.4h-.97v1.64h1.94v-1.65h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65ZM6.44 29.34H5.43a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0H6.56v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 29.34h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.03 29.34H29.9v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.63 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0H63.8a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64ZM5.58 31.29a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H9.32a.82.82 0 1 0 0 1.64h1.13V31.3h-.12Zm1.09 0h-.97v1.64h1.94V31.3h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V31.3h-.12Zm1.09 0h-.97v1.64h1.94V31.3h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M32.83 31.29h-.98v1.64h1.95V31.3h-.97Zm2.09 0H33.8v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0h-1.01a.82.82 0 1 0 0 1.64h1.13V31.3h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.23 31.29h-.97v1.64h1.94V31.3h-.97Zm2.1 0H55.2v1.64h1.13a.82.82 0 1 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13V31.3h-.12Zm1.1 0h-.98v1.64H63V31.3h-1Zm2.09 0H63v1.64h1.12a.82.82 0 1 0 0-1.64ZM5.58 33.23a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm12.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.23 33.23h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 33.23h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65H63v-1.65h-1Zm2.09 0H63v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM9.47 35.18a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M19.35 35.18h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.67 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm12.53 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0H55.2v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM9.47 37.12a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm15.42 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm11.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.23 37.12h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 37.12h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.58 39.07a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M26.99 39.07H26v1.64h1.95v-1.64H27Zm2.09 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.58 0H42.4a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 39.07h-.98v1.64h1.95v-1.64h-.98Zm2.09 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 39.07h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64H63v-1.64h-1Zm2.09 0H63v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM7.53 41.01a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm6.54 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 41.01h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M34.92 41.01H33.8v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.1 0h-.98v1.65H63v-1.65h-1Zm1.94 0H63v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M66.06 41.01h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm-54.64 1.95a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0H17.1a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 42.96h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H37.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0H42.4a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.58 44.9a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm9.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm6.69 0h-1a.82.82 0 0 0 0 1.65h1.12v-1.64h-.11Zm1.1 0h-.98v1.65h1.95v-1.64h-.97Zm1.94 0h-.97v1.65H26v-1.64h-.97Zm1.95 0H26v1.65h1.95v-1.64H27Zm1.94 0h-.97v1.65h1.95v-1.64h-.98Zm1.95 0h-.97v1.65h1.94v-1.64h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M38.66 44.9h-.97v1.65h1.95v-1.64h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.64h-.11Zm1.09 0h-.98v1.65h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 44.9h-.98v1.65h1.95v-1.64h-.98Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Zm1.24 0H59.1v1.65h1.12a.82.82 0 1 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64ZM5.58 46.85a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 46.85h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.48 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M34.92 46.85H33.8v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.65 46.85h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M62.16 46.85h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65H68a.82.82 0 1 0 0-1.65ZM5.58 48.8a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 0 0 0 1.65h1.12V48.8h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 0 0 0 1.65h1.13V48.8h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12V48.8h-.11Zm1.09 0h-.98v1.65h1.95V48.8h-.97Zm2.09 0H33.8v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.72 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0H63.8a.82.82 0 0 0 0 1.65h1.12V48.8h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM6.44 50.74H5.43a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H6.56v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm22.27 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.08 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.23 50.74h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 50.74h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM22 52.69h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.25 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.13a.82.82 0 1 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-44.75 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M31.03 54.64H29.9v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 54.64h-.98v1.64h1.95v-1.64h-.98Zm1.94 0h-.97v1.64h1.94v-1.64h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-35.03 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0H33.8v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.1 0h-.98v1.65H63v-1.65h-1Zm1.94 0H63v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M66.06 56.58h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM22 58.53h-1a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.25 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm18.22 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M44.5 58.53h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.08 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M54.23 58.53h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M58.12 58.53h-.97v1.64h1.95v-1.64h-.98Zm2.1 0H59.1v1.64h1.12a.82.82 0 1 0 0-1.64Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM22 60.47h-1a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.1 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M25.2 60.47h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM23.1 62.42a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0H37.7v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.58 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.1 0h-.98v1.65H63v-1.65h-1Zm1.94 0H63v1.65h1.94v-1.65h-.97Z"
    />
    <path fill="#CDD8D3" d="M65.9 62.42h-.97v1.65h1.95v-1.65h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M68 62.42h-1.12v1.65H68a.82.82 0 0 0 0-1.65Zm-44.9 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13V66h1.13a.82.82 0 0 0 0-1.64Zm4.59 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0H37.7V66h1.12a.82.82 0 0 0 0-1.64Zm9.59 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 0 0 0 1.64H63v-1.64h-.12Zm1.09 0H63V66h1.94v-1.64h-.97Z"
    />
    <path fill="#CDD8D3" d="M65.9 64.37h-.97V66h1.95v-1.64h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M68 64.37h-1.12V66H68a.82.82 0 0 0 0-1.64Zm-44.9 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1a.82.82 0 1 0 0 1.65h1.13V66.3h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M48.4 66.31h-.98v1.65h1.95V66.3h-.98Zm1.94 0h-.97v1.65h1.94V66.3h-.97Zm1.94 0h-.97v1.65h1.95V66.3h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM13.58 3.9H9.26a4.65 4.65 0 0 0-4.65 4.59v4.42c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.5c0-2.54-2.09-4.6-4.65-4.6Zm2.6 9.01a2.58 2.58 0 0 1-2.6 2.56H9.26a2.58 2.58 0 0 1-2.6-2.56V8.5a2.5 2.5 0 0 1 1.1-2.1c.43-.28.94-.45 1.5-.45h4.32c1.44 0 2.6 1.14 2.6 2.55v4.42Zm48-9.01h-4.33a4.65 4.65 0 0 0-4.65 4.59v4.42c0 2.54 2.1 4.6 4.65 4.6h4.33a4.63 4.63 0 0 0 4.65-4.6V8.5c0-2.54-2.1-4.6-4.65-4.6Zm2.6 9.01a2.59 2.59 0 0 1-2.6 2.56h-4.32a2.58 2.58 0 0 1-2.61-2.56V8.5a2.5 2.5 0 0 1 1.1-2.1c.43-.28.95-.45 1.5-.45h4.33c1.43 0 2.6 1.14 2.6 2.55v4.42Zm-53.2 41.58H9.26a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.53 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6v-4.43c0-2.53-2.09-4.6-4.65-4.6Zm2.6 9.02c0 1.4-1.16 2.55-2.6 2.55H9.26a2.58 2.58 0 0 1-2.6-2.55v-4.43A2.5 2.5 0 0 1 7.75 57c.43-.29.94-.46 1.5-.46h4.32c1.44 0 2.6 1.15 2.6 2.55v4.43Z"
    />
    <path
      fill="#CDD8D3"
      d="M10.1 13.62c-.88 0-1.6-.7-1.6-1.56V9.35a1.53 1.53 0 0 1 .68-1.28c.26-.18.58-.29.92-.29h2.64c.88 0 1.6.7 1.6 1.57v2.7c0 .87-.72 1.57-1.6 1.57H10.1Zm50.6 0c-.89 0-1.6-.7-1.6-1.56V9.35a1.54 1.54 0 0 1 .68-1.28c.26-.18.57-.29.91-.29h2.65c.88 0 1.6.7 1.6 1.57v2.7c0 .87-.72 1.57-1.6 1.57h-2.65Zm-50.6 50.6c-.88 0-1.6-.7-1.6-1.57v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.18.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.56v2.71a1.6 1.6 0 0 1-1.6 1.57H10.1Z"
    />
    <g clip-path="url(#a)">
      <path
        fill="#1F2726"
        d="M44.74 25.3H28.7a2.68 2.68 0 0 0-2.68 2.67v16.06c0 1.47 1.2 2.67 2.68 2.67h16.05c1.48 0 2.68-1.2 2.68-2.67V27.97c0-1.48-1.2-2.67-2.68-2.67Z"
      />
      {/* <path fill="#1DF7EF" fill-rule="evenodd" d="M36.22 28.25c-.19 0-.38.05-.54.15l-5.23 3.07c-.34.2-.54.56-.54.95v6.15c0 .4.2.76.54.96l.93.55 2.85-7.94c.03-.1.12-.16.22-.16h1.33c.08 0 .14.09.1.17l-3.12 8.73 2.92 1.72a1.07 1.07 0 0 0 1.08 0l5.23-3.07c.33-.2.54-.56.54-.96v-6.15c0-.39-.2-.75-.54-.95l-5.23-3.07c-.17-.1-.36-.15-.54-.15Zm2.21 5.11c.04-.1.19-.1.22 0l2.13 5.9-1.37.81-1.67-4.62a.25.25 0 0 1 0-.16l.7-1.93Zm-1.85 5.17.7-1.93c.03-.1.18-.1.21 0l1.37 3.79-1.37.8-.9-2.5a.25.25 0 0 1 0-.16Zm.19-6.55h1.33c.08 0 .14.09.1.17L34.68 42l-1.37-.8 3.25-9.07c.03-.1.12-.16.22-.16Z" clip-rule="evenodd" /> */}
    </g>
    <defs>
      <clipPath id="a">
        <path
          fill="#fff"
          d="M0 0h21.41v21.41H0z"
          transform="translate(26.01 25.3)"
        />
      </clipPath>
    </defs>
  </svg>
);

const BaseSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    fill="none"
    viewBox="0 0 72 72"
  >
    <defs>
      <path id="c" fill="#fff" d="M0 0h21.41v21.41H0z" />
    </defs>
    <path
      fill="#CDD8D3"
      d="M27.13 4.04h-1.01a.82.82 0 1 0 0 1.65h1.12V4.04h-.11Zm1.09 0h-.98V5.7h1.95V4.04h-.97Zm2.09 0H29.2V5.7h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.12V4.04h-.11Zm1.09 0h-.98V5.7h1.95V4.04h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.04 4.04h-1.12V5.7h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13V4.04h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M45.73 4.04h-.97V5.7h1.94V4.04h-.97Zm2.1 0H46.7V5.7h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM20.43 5.99a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13V6h-.12Zm1.09 0h-.97v1.64h1.94V6h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.73 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64A.82.82 0 0 1 36 6Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12V6h-.11Zm1.24 0h-1.13v1.64H42a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM20.43 7.93a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13V7.93h-.12Zm1.09 0h-.97v1.65h1.94V7.93h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM20.43 9.88a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13V9.88h-.12Zm1.09 0h-.97v1.65h1.94V9.88h-.97Zm1.94 0h-.96v1.65h1.94V9.88h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12V9.88h-.11Zm1.09 0h-.98v1.65h1.95V9.88h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-29.34 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm6.54 0H33.9a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.83 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-24.44 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.53 13.77H21.4v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-31.14 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-28.34 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0H25.3v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0H30a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.64 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.72 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM8.76 19.6a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.66h1.13V19.6h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M16.54 19.6h-.97v1.66h1.94V19.6h-.97Zm1.95 0h-.98v1.66h1.95V19.6h-.97Zm1.94 0h-.97v1.66h1.95V19.6h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.53 19.6H21.4v1.66h1.12a.82.82 0 1 0 0-1.65Zm12.38 0H33.9a.82.82 0 1 0 0 1.66h1.13V19.6h-.12Zm1.09 0h-.97v1.66h1.94V19.6H36Zm1.95 0h-.98v1.66h1.95V19.6h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.04 19.6h-1.12v1.66h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.66.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.66h1.12V19.6h-.11Zm1.09 0h-.98v1.66h1.95V19.6h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.66 19.6h-1.12v1.66h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.66h1.13V19.6h-.12Zm1.09 0h-.97v1.66h1.95V19.6h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.3 19.6h-.98v1.66h1.95V19.6h-.97Zm1.94 0h-.97v1.66h1.95V19.6h-.98Zm2.1 0h-1.12v1.66h1.12a.82.82 0 1 0 0-1.65ZM5.72 21.55H4.71a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H5.84v1.65h1.12a.82.82 0 0 0 0-1.65Zm12.38 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M43.93 21.55h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path fill="#CDD8D3" d="M51.57 21.55h-.98v1.65h1.95v-1.65h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M53.51 21.55h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65ZM5.72 23.5H4.71a.82.82 0 1 0 0 1.65h1.13V23.5h-.12Zm1.24 0H5.84v1.65h1.12a.82.82 0 1 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13V23.5h-.12Zm1.09 0h-.97v1.65h1.94V23.5h-.97Zm1.95 0h-.98v1.65h1.95V23.5h-.98Zm1.94 0h-.97v1.65h1.94V23.5h-.97Zm1.95 0h-.98v1.65h1.95V23.5h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13V23.5h-.12Zm1.24 0H25.3v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0H55.3a.82.82 0 1 0 0 1.65h1.12V23.5h-.11Zm1.08 0h-.97v1.65h1.95V23.5h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM4.86 25.45a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.04 25.45h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm8.49 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M49.62 25.45h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.51 25.45h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm8.49 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.23 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64ZM4.86 27.4a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M18.64 27.4H17.5v1.64h1.13a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.24 0H29.2v1.64h1.12a.82.82 0 1 0 0-1.65Zm12.39 0h-1.02a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.08 0h-.97v1.64h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M45.73 27.4h-.97v1.64h1.94v-1.65h-.97Zm2.1 0H46.7v1.64h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm4.75 0H55.3a.82.82 0 1 0 0 1.64h1.12v-1.65h-.11Zm1.23 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65ZM8.76 29.34a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm23.34 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm9.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.51 29.34h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM4.86 31.29a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0H8.6a.82.82 0 1 0 0 1.64h1.13V31.3H9.6Z"
    />
    <path
      fill="#CDD8D3"
      d="M10.7 31.29h-.97v1.64h1.95V31.3h-.98Zm1.95 0h-.97v1.64h1.94V31.3h-.97Zm1.95 0h-.98v1.64h1.95V31.3h-.98Zm1.94 0h-.97v1.64h1.94V31.3h-.97Zm1.95 0h-.98v1.64h1.95V31.3h-.97Zm1.94 0h-.97v1.64h1.95V31.3h-.98Zm1.95 0h-.97v1.64h1.94V31.3h-.97Zm1.94 0h-.97v1.64h1.95V31.3h-.98Zm1.95 0h-.97v1.64h1.94V31.3h-.97Zm2.1 0h-1.13v1.64h1.13a.82.82 0 1 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1a.82.82 0 1 0 0 1.64h1.13V31.3h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M39.9 31.29h-.98v1.64h1.94V31.3h-.97Zm1.94 0h-.98v1.64h1.95V31.3h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 1 0 0-1.64Zm6.55 0h-1.01a.82.82 0 1 0 0 1.64h1.12V31.3h-.11Zm1.09 0h-.98v1.64h1.95V31.3h-.97Zm2.09 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM13.5 33.23h-1a.82.82 0 0 0 0 1.65h1.13v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M14.74 33.23h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65H36Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM7.67 35.18H6.66a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.23 0H7.79v1.64h1.13a.82.82 0 0 0 0-1.64Zm6.55 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M16.7 35.18h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm9.57 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm12.53 0h-1a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.04 35.18h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm10.59 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.23 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64ZM8.76 37.12a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm16.42 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.96v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65H36Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm5.68 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.72 39.07H4.71a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H5.84v1.65h1.12a.82.82 0 0 0 0-1.65Zm8.49 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M16.7 39.07h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.73 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm2.1 0h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.59 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path fill="#CDD8D3" d="M61.3 39.07h-.98v1.65h1.95v-1.65h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M63.4 39.07h-1.14v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.72 41.02H4.71a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H9.73v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.63 0h-1.01a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm6.69 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M43.93 41.02h-1.12v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 41.02h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64ZM9.61 42.96H8.6a.82.82 0 0 0 0 1.65h1.13v-1.65H9.6Zm1.24 0H9.73v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.55 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M24.47 42.96h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.96v1.65h1.94v-1.65h-.97Zm1.95 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.63 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM8.76 44.9a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.79 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M51.72 44.9h-1.13v1.65h1.13a.82.82 0 0 0 0-1.64Zm4.6 0H55.3a.82.82 0 1 0 0 1.65h1.12v-1.64h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.64Zm9.59 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.64ZM5.72 46.85H4.71a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H5.84v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Z"
    />
    <path
      fill="#CDD8D3"
      d="M18.64 46.85H17.5v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H30a.82.82 0 0 0 0 1.65h1.12v-1.65h-.11Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm7.64 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM11.56 48.8h-1.01a.82.82 0 1 0 0 1.65h1.13V48.8h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 0 0 0 1.65h1.13V48.8h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 0 0 0 1.65h1.13V48.8h-.12Zm1.09 0h-.97v1.65h1.94V48.8h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M28.22 48.8h-.98v1.65h1.95V48.8h-.97Zm1.94 0h-.97v1.65h1.94V48.8h-.97Zm1.94 0h-.96v1.65h1.94V48.8h-.97Zm1.95 0h-.97v1.65h1.95V48.8h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12V48.8h-.11Zm1.09 0h-.98v1.65h1.95V48.8h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M43.93 48.8h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm3.75 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.58 0h-1.01a.82.82 0 1 0 0 1.65h1.13V48.8h-.12Zm1.09 0h-.97v1.65h1.95V48.8h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 48.8h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM5.72 50.75H4.71a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.24 0H5.84v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97v1.64h1.94v-1.64h-.97Zm1.95 0h-.98v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M16.7 50.75h-1.14v1.64h1.12a.82.82 0 0 0 0-1.64Zm5.68 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm7.78 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path fill="#CDD8D3" d="M51.57 50.75h-.98v1.64h1.95v-1.64h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M53.51 50.75h-.97v1.64h1.95v-1.64h-.98Zm1.95 0h-.97v1.64h1.94v-1.64h-.97Zm1.94 0h-.97v1.64h1.95v-1.64h-.97Zm1.95 0h-.97v1.64h1.95v-1.64h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 50.75h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-43.9 1.95h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.53 52.7H21.4v1.64h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.65h-.12Zm1.24 0h-1.12v1.64h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm8.63 0h-1a.82.82 0 0 0 0 1.64h1.13v-1.65h-.12Z"
    />
    <path fill="#CDD8D3" d="M61.3 52.7h-.98v1.64h1.95v-1.65h-.97Z" />
    <path
      fill="#CDD8D3"
      d="M63.4 52.7h-1.14v1.64h1.12a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.65Zm-45.85 1.94h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.53 54.64H21.4v1.64h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 1 0 0 1.64h1.12v-1.64h-.11Zm1.09 0h-.98v1.64h1.95v-1.64h-.97Zm2.09 0H29.2v1.64h1.12a.82.82 0 0 0 0-1.64Zm3.75 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.84 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm11.67 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.89 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.74 0h-1a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 54.64h-1.13v1.64h1.13a.82.82 0 0 0 0-1.64Zm5.69 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-46.71 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.9 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.63 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm9.58 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.63 0h-1a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 56.58h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.23 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-37.12 1.95a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm6.7 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M40.04 58.53h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.12v-1.65h-.11Zm1.09 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.51 58.53h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.97Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-33.23 1.94a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.83 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm7.8 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.88 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm8.64 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.66 60.47h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.95v-1.65h-.98Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 60.47h-1.13v1.65h1.13a.82.82 0 1 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm-45.85 1.95h-1.01a.82.82 0 1 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M22.53 62.42H21.4v1.65h1.12a.82.82 0 0 0 0-1.65Zm6.54 0h-1.01a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.24 0H29.2v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.6 0H33.9a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Zm1.09 0h-.97v1.65h1.94v-1.65H36Zm1.95 0h-.98v1.65h1.95v-1.65h-.97Z"
    />
    <path
      fill="#CDD8D3"
      d="M39.9 62.42h-.98v1.65h1.94v-1.65h-.97Zm2.09 0h-1.13v1.65H42a.82.82 0 0 0 0-1.65Zm3.74 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm3.89 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm10.58 0h-1a.82.82 0 0 0 0 1.65h1.13v-1.65h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.3 62.42h-.98v1.65h1.95v-1.65h-.97Zm1.94 0h-.97v1.65h1.95v-1.65h-.98Zm1.95 0h-.97v1.65h1.94v-1.65h-.97Zm2.09 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm-42.96 1.95a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.75 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Zm1.09 0h-.97V66h1.94v-1.64h-.97Zm2.1 0h-1.12V66h1.12a.82.82 0 0 0 0-1.64Zm4.6 0h-1.01a.82.82 0 0 0 0 1.64h1.12v-1.64h-.11Zm1.24 0h-1.13V66h1.13a.82.82 0 0 0 0-1.64Zm4.6 0h-1.02a.82.82 0 0 0 0 1.64h1.13v-1.64h-.12Zm1.08 0h-.97V66h1.95v-1.64h-.98Zm2.1 0h-1.12V66h1.12a.82.82 0 0 0 0-1.64Zm6.54 0h-1.01a.82.82 0 1 0 0 1.64h1.13v-1.64h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M53.66 64.37h-1.12V66h1.12a.82.82 0 0 0 0-1.64Zm7.64 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm-38.07 1.94h-1.01a.82.82 0 1 0 0 1.65h1.13V66.3h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.75 0H33.9a.82.82 0 1 0 0 1.65h1.13V66.3h-.12Zm1.24 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm5.84 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65Zm4.74 0h-1.01a.82.82 0 1 0 0 1.65h1.13V66.3h-.12Zm1.09 0h-.97v1.65h1.95V66.3h-.98Zm2.1 0h-1.12v1.65h1.12a.82.82 0 0 0 0-1.65Zm4.59 0h-1a.82.82 0 1 0 0 1.65h1.13V66.3h-.12Z"
    />
    <path
      fill="#CDD8D3"
      d="M61.45 66.31h-1.13v1.65h1.13a.82.82 0 0 0 0-1.65Zm5.69 0a.82.82 0 1 1 0 1.65.82.82 0 0 1 0-1.65ZM12.86 3.9H8.54A4.65 4.65 0 0 0 3.9 8.5v4.41c0 2.54 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.5c0-2.53-2.08-4.6-4.65-4.6Zm2.61 9.01a2.59 2.59 0 0 1-2.6 2.56H8.53a2.58 2.58 0 0 1-2.6-2.56V8.5a2.5 2.5 0 0 1 1.1-2.09c.43-.3.95-.46 1.5-.46h4.32a2.58 2.58 0 0 1 2.61 2.55v4.42ZM63.46 3.9h-4.32a4.65 4.65 0 0 0-4.65 4.6v4.41c0 2.54 2.08 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6V8.5c0-2.53-2.09-4.6-4.65-4.6Zm2.6 9.01a2.58 2.58 0 0 1-2.6 2.56h-4.32a2.58 2.58 0 0 1-2.6-2.56V8.5a2.5 2.5 0 0 1 1.1-2.09c.43-.3.94-.46 1.5-.46h4.32c1.44 0 2.6 1.14 2.6 2.55v4.42Zm-53.2 41.58H8.54a4.65 4.65 0 0 0-4.65 4.6v4.42c0 2.53 2.09 4.6 4.65 4.6h4.32a4.63 4.63 0 0 0 4.65-4.6v-4.42c0-2.54-2.08-4.6-4.65-4.6Zm2.61 9.02c0 1.4-1.17 2.55-2.6 2.55H8.53a2.58 2.58 0 0 1-2.6-2.55v-4.42a2.5 2.5 0 0 1 1.1-2.1c.43-.29.95-.46 1.5-.46h4.32a2.59 2.59 0 0 1 2.61 2.56v4.42Z"
    />
    <path
      fill="#CDD8D3"
      d="M9.38 13.62c-.88 0-1.6-.7-1.6-1.57v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.17.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.57v2.7c0 .87-.72 1.57-1.6 1.57H9.38Zm50.59 0c-.88 0-1.6-.7-1.6-1.57v-2.7a1.53 1.53 0 0 1 .69-1.29c.26-.17.57-.28.91-.28h2.65c.88 0 1.6.7 1.6 1.57v2.7c0 .87-.72 1.57-1.6 1.57h-2.65ZM9.38 64.22c-.88 0-1.6-.7-1.6-1.57v-2.7a1.53 1.53 0 0 1 .68-1.29c.26-.17.58-.28.92-.28h2.64c.88 0 1.6.7 1.6 1.56v2.71c0 .87-.72 1.57-1.6 1.57H9.38Z"
    />
    <g clip-path="url(#a)">
      <path
        fill="#1F2726"
        d="M44.18 25.3H28.12a2.68 2.68 0 0 0-2.67 2.67v16.06c0 1.47 1.2 2.67 2.67 2.67h16.06c1.48 0 2.67-1.2 2.67-2.67V27.97c0-1.48-1.2-2.67-2.67-2.67Z"
      />
      {/* <path fill="#4086CD" d="M44.03 25.3H27.97a2.68 2.68 0 0 0-2.67 2.67v16.06c0 1.48 1.2 2.67 2.67 2.67h16.06c1.48 0 2.67-1.2 2.67-2.67V27.97c0-1.47-1.2-2.67-2.67-2.67Z" />
      <path fill="#fff" d="M35.54 30.53h-.02c-.3.15.64 2.12.95 2.86.32.73 1.54 3.56 1.79 3.68.25.13.34.06.5-.01.17-.07.46-.3.31-.57v-.02c-.07-.1-.2-.38-.4-.74v-.01l-.05-.08a1.24 1.24 0 0 1-.03-.07l-.03-.05-.05-.1-.01-.03a38.1 38.1 0 0 0-.08-.14 44 44 0 0 0-1.31-2.35c-.57-.9-1.32-2.38-1.57-2.37Zm-.64 2.37a.24.24 0 0 0-.19.12l-.94 1.64-1.04 1.8-.86 1.52a.24.24 0 0 0 .08.32l.62.35c.11.07.25.03.32-.09l1.2-2.1.78-1.35.86-1.5a.24.24 0 0 0-.08-.32l-.62-.36a.24.24 0 0 0-.13-.03Zm-4 1.76c-.13 0-.22.1-.22.21v1.38c0 .12.1.22.21.22h1.35l1.04-1.8h-2.39Zm4.72 0-1.04 1.8h2.82c-.2-.4-.47-.97-.84-1.8h-.94Zm2.97 0 .63 1.2.23.43.07.18h1.14c.12 0 .22-.1.22-.22v-1.38c0-.11-.1-.2-.22-.2H38.6Zm.64 2.58a.24.24 0 0 0-.1.03l-.35.18a.23.23 0 0 0-.09.34l.38.58c.07.12.23.16.35.09l.25-.15a.28.28 0 0 0 .1-.36l-.29-.56a.27.27 0 0 0-.25-.15Zm-7.58 1.3c-.07 0-.12.06-.13.15l-.1.92c-.02.13.06.18.16.1l.8-.54c.1-.07.1-.18-.01-.25l-.62-.35a.18.18 0 0 0-.1-.03Zm8.41.1c-.1 0-.23.04-.38.12-.09.09-.3.28-.04.65s.85.4.93.64c0 0 .14-1.4-.5-1.4Z" />
      <path fill="#fff" d="M35.95 27.64a8.36 8.36 0 0 0-8 6.13l-.02.07a8.36 8.36 0 1 0 8.02-6.2Zm0 .5a7.87 7.87 0 1 1-7.54 5.83l.02-.07a7.87 7.87 0 0 1 7.52-5.76Z" /> */}
    </g>
    <g clip-path="url(#b)">
      <path
        fill="#1F2726"
        d="M44.03 25.3H27.97a2.68 2.68 0 0 0-2.67 2.67v16.06c0 1.47 1.2 2.67 2.67 2.67h16.06c1.47 0 2.67-1.2 2.67-2.67V27.97c0-1.48-1.2-2.67-2.67-2.67Z"
      />
      {/* <path fill="#2151F5" d="M35.49 43A7.5 7.5 0 1 0 28 34.87h9.93v1.26H28A7.5 7.5 0 0 0 35.49 43Z" /> */}
    </g>
    <defs>
      <clipPath id="a">
        <use xlinkHref="#c" transform="translate(25.3 25.3)" />
      </clipPath>
      <clipPath id="b">
        <use xlinkHref="#c" transform="translate(25.3 25.3)" />
      </clipPath>
    </defs>
  </svg>
);
