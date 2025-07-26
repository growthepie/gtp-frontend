"use client";
import { useMemo } from "react";
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
import { Description } from "@/components/layout/TextComponents";
import "@splidejs/react-splide/css";
import {
  GridTableAddressCell,
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { Supporters } from "@/lib/contributors";
import { useSearchParams } from "next/navigation";
import ShowLoading from "@/components/layout/ShowLoading";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { track } from "@vercel/analytics/react";
import { DonationPGFRow } from "@/app/api/donations/pgf/route";
import { DonationImpactRow } from "@/app/api/donations/impactusers/route";
import { DonationUpdateRow } from "@/app/api/donations/updates/route";
import moment from "moment";
import Image from "next/image";
import { checkIsOnDemandRevalidate } from "next/dist/server/api-utils";
import EthereumSVG from "@/public/donate/ethereum.svg";
import GivethSVG from "@/public/donate/giveth.svg";


export default function Donations() {
  const {
    data: PGFData,
    isLoading: PFGIsLoading,
    isValidating: PFGIsValidating,
    error: PFGError,
  } = useSWR<DonationPGFRow[]>(BASE_URL + "/api/donations/pgf", {
    refreshInterval: 1000 * 60 * 5,
  });

  const {
    data: impactData,
    isLoading: impactIsLoading,
    isValidating: impactIsValidating,
    error: impactError,
  } = useSWR<DonationImpactRow[]>(BASE_URL + "/api/donations/impactusers", {
    refreshInterval: 1000 * 60 * 5,
  });

  const {
    data: updateData,
    isLoading: updateLoading,
    isValidating: updateValidating,
    error: updateError,
  } = useSWR<DonationUpdateRow[]>(BASE_URL + "/api/donations/updates", {
    refreshInterval: 1000 * 60 * 5,
  });

  const { isSidebarOpen } = useUIContext();
  const { AllChainsByKeys } = useMaster();

  const searchParams = useSearchParams();
  const forceNoPublicGoods = searchParams.get("forceNoPublicGoods") === "true";


  type QRCodes = {
    key: string;
    wallet: boolean;
    // qrImage: React.ReactNode;
    qrImagePath: string;
    icon: {
      path: string;
      color: string;
    };
    url: string;
    address: string | null;
    fullSize: boolean;
  };

  const QRCodes = [
    {
      key: "Ethereum",
      wallet: true,
      qrImage: EthereumSVG,
      icon: {
        path: "gtp:ethereum-logo-monochrome",
        color: "#CDD8D3",
      },
      url: "https://etherscan.io/address/0x9438b8B447179740cD97869997a2FCc9b4AA63a2",
      address: "0x9438b8B447179740cD97869997a2FCc9b4AA63a2",
      fullSize: true,
    },
    {
      key: "Giveth",
      wallet: false,
      qrImage: GivethSVG,
      icon: {
        path: "gtp:giveth-monochrome",
        color: "#CDD8D3",
      },
      url: "https://giveth.io/project/growthepie-analytics-for-ethereum-scaling-solutions",
      address: null,
      fullSize: false,
    },
  ];

  const getDonateUntil = (row: DonationPGFRow) => {
    // Get the user's local time string in the desired format
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    const start = new Date(row.startDate);
    const end = new Date(row.endDate);
    const now = new Date();
    const day = moment.utc(end).format("ddd");

    // Format the date using toLocaleString with the user's locale
    return (
      <>
        <div className="flex items-center justify-end gap-x-[5px]">
          <div className="font-medium">{day},</div>
          <div className="font-medium">
            {start.toLocaleDateString("en-GB", options)}
          </div>
          <div className="font-light">thru</div>
          <div className="font-medium">{day},</div>
          <div className="font-medium">
            {end.toLocaleDateString("en-GB", options)}
          </div>
        </div>
      </>
    );

  };

  type PGFStatus = "Active" | "Upcoming" | "Ended";

  const getPGFStatus = (row: DonationPGFRow): PGFStatus => {
    const start = new Date(row.startDate);
    const end = new Date(row.endDate);
    const now = new Date();

    if (start.getTime() < now.getTime() && end.getTime() > now.getTime()) {
      return "Active";
    }

    if (start.getTime() > now.getTime()) {
      return "Upcoming";
    }

    if (end.getTime() < now.getTime()) {
      return "Ended";
    }

    return "Ended";
  };

  const getTimeLeft = (row: DonationPGFRow) => {
    const now = new Date();
    const start = new Date(row.startDate);
    const end = new Date(row.endDate);

    const isCurrent = start.getTime() < now.getTime() && end.getTime() > now.getTime();
    const isFuture = start.getTime() > now.getTime();
    const isPast = end.getTime() < now.getTime();

    if (isCurrent) {
      const daysLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return "Ends in " + daysLeft + " days";
    }

    if (isFuture) {
      const daysLeft = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return "Starts in " + daysLeft + " days";
    }

    if (isPast) {
      const daysAgo = Math.floor((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
      return "Ended " + daysAgo + " days ago";
    }
  };

  const formatLinkText = (url: string) => {
    const urlParts = url.split("/");
    let domain = url.includes("://") ? urlParts[2] : urlParts[0];
    const rest = urlParts.slice(3).join("/");

    // replace www. with nothing
    domain = domain.replace("www.", "");


    return (
      <span className="text-forest-500">
        <span className="group-hover:underline">{domain}</span>
        <span className="text-forest-800 group-hover:underline">/{rest}</span>
      </span>
    )

  };

  return (
    <>
      <ShowLoading dataLoading={[PFGIsLoading, impactIsLoading, updateLoading]} dataValidating={[PFGIsValidating, impactIsValidating, updateValidating]} />
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
        <div className="w-full pb-[30px] flex md:flex-row flex-col md:gap-y-[0px] gap-y-[10px] gap-x-[10px] justify-items-stretch items-start md:items-center ">
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
          gridDefinitionColumns="grid-cols-[150px_270px_90px_minmax(100px,2000px)_320px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] !pt-[15px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="center">Status</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Name</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Share</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Dates</GridTableHeaderCell>
        </GridTableHeader>
        <div className="flex flex-col gap-y-[5px]">
          {PGFData && !forceNoPublicGoods &&
            PGFData.filter((donation) => {
              const endDate = new Date(donation.endDate);
              const twoWeeksAgo = new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 14,
              );
              return endDate.getTime() > twoWeeksAgo.getTime();
            }).length > 0 ?
            PGFData.filter((donation) => {
              const endDate = new Date(donation.endDate);
              const twoWeeksAgo = new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 14,
              );
              return endDate.getTime() > twoWeeksAgo.getTime();
            }).map((donation) => (
              <GridTableRow
                gridDefinitionColumns="grid-cols-[150px_270px_90px_minmax(100px,2000px)_320px]"
                key={donation.name}
                className={`group text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[15px] h-[34px] !pb-0 !pt-0 flex items-center select-none ${getPGFStatus(donation) === "Ended" && "opacity-40"}`}
                onClick={() => {
                  window.open(donation.url, "_blank");
                  track("clicked Donate PGF Row", {
                    location: donation.name,
                    page: window.location.pathname,
                  });
                }}
              >
                <div className="bg-[#1F2726] h-[24px] rounded-full flex items-center justify-center text-[14px] font-bold">
                  {getPGFStatus(donation) === "Active" &&
                    <CountdownTimer targetDate={new Date(donation.endDate)} prefixString={getPGFStatus(donation) === "Active" ? "Ends in " : "Starts in "} />
                  }
                  {getPGFStatus(donation) === "Upcoming" &&
                    <div className="text-[12px] font-semibold">{getTimeLeft(donation)}</div>
                  }
                  {getPGFStatus(donation) === "Ended" &&
                    <div className="text-[12px] font-semibold">{getTimeLeft(donation)}</div>
                  }
                </div>
                <div className="justify-center truncate w-full">{donation.name}</div>
                <div className="peer/icons flex gap-x-[10px]">
                  {donation.twitterURL && (
                    <Link href={donation.twitterURL} target="_blank">
                      <Icon
                        icon="ri:twitter-x-fill"
                        className="w-[15px] h-[15px]"
                      />
                    </Link>
                  )}
                  {donation.farcasterURL && (
                    <Link href={donation.farcasterURL} target="_blank">
                      <Icon
                        icon="gtp:farcaster"
                        className="h-[15px] w-[15px]"
                      />
                    </Link>
                  )}
                  {donation.lensURL && (
                    <Link href={donation.lensURL} target="_blank">
                      <Icon icon="gtp:lens" className="h-[15px] w-[15px]" />
                    </Link>
                  )}
                </div>
                <Link
                  href={donation.url}
                  target="_blank"
                  className="peer-hover/icons:!no-underline truncate w-full text-forest-800"
                >
                  {formatLinkText(donation.url)}
                </Link>
                <div className="text-right">
                  {getDonateUntil(donation)}
                </div>
              </GridTableRow>
            )) : (
              <GridTableRow
                gridDefinitionColumns="grid-cols-[100%] justify-items-stretch"
                className="text-[14px] gap-x-[15px] z-[2] !pl-[5px] !pr-[5px] h-[34px] !pb-0 !pt-0 flex items-center select-none"
              >
                <div className="bg-[#1F2726] h-[24px] rounded-full flex items-center justify-center text-[16px] font-bold">
                  Currently no active rounds, please check back later.
                </div>
              </GridTableRow>
            )}
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
          gridDefinitionColumns="grid-cols-[425px_minmax(100px,2000px)_120px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[48px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">Name</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date</GridTableHeaderCell>
        </GridTableHeader>
        <VerticalScrollContainer height={39 * 9}>
          <div className="flex flex-col gap-y-[5px]">
            {impactData &&
              impactData.map((impactRow) => (
                <GridTableRow
                  gridDefinitionColumns="grid-cols-[425px_minmax(100px,2000px)_120px] justify-items-stretch"
                  key={impactRow.name}
                  className="group text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
                  onClick={() => {
                    window.open(impactRow.url, "_blank");
                    track("clicked Donate Impact Row", {
                      location: impactRow.name,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <div className="justify-center w-full truncate">{impactRow.name}</div>
                  <div className="flex gap-x-[10px]">
                    {impactRow.url && (
                      <Link
                        href={impactRow.url}
                        target="_blank"
                        className="w-full truncate text-forest-800"
                      >
                        {formatLinkText(impactRow.url)}
                      </Link>
                    )}
                  </div>
                  <div className="text-right">
                    {`${impactRow.date.replace(/-/g, "/")}`}
                  </div>
                </GridTableRow>
              ))}
          </div>
        </VerticalScrollContainer>
      </HorizontalScrollContainer>
      <Container className="pt-[30px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="text-[20px] font-bold">Platform Updates</div>
          <div className="text-[14px]">
            Our public change log. A list with bigger feature releases and their
            announcements. We keep building!
          </div>
        </div>
      </Container>
      <HorizontalScrollContainer className="">
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[425px_minmax(100px,2000px)_120px]"
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[48px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">
            Product Feature
          </GridTableHeaderCell>
          <GridTableHeaderCell justify="start">
            Announcement Link
          </GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date Released</GridTableHeaderCell>
        </GridTableHeader>
        <VerticalScrollContainer height={39 * 9}>
          <div className="flex flex-col gap-y-[5px]">
            {updateData &&
              updateData.map((updateRow) => (
                <GridTableRow
                  gridDefinitionColumns="grid-cols-[425px_minmax(100px,2000px)_120px] justify-items-stretch"
                  key={updateRow.name}
                  className="group text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
                  onClick={() => {
                    window.open(updateRow.url, "_blank");
                    track("clicked Donate Update Row", {
                      location: updateRow.name,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <div className="flex items-center w-full h-full">
                    {updateRow.name}
                  </div>
                  <div className="flex ">
                    <Link
                      href={updateRow.url}
                      target="_blank"
                      className="w-full truncate text-forest-800"
                    >
                      {formatLinkText(updateRow.url)}
                    </Link>
                  </div>
                  <div className="flex items-center justify-end w-full h-full gap-x-[3px]">
                    {updateRow.date.replace(/-/g, "/")}
                  </div>
                </GridTableRow>
              ))}
          </div>
        </VerticalScrollContainer>
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
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 items-center gap-[30px] pt-[16px] pb-[16px] px-[23px]">
          {Supporters.map((s) => (
            <Link
              key={s.name}
              target="_blank"
              rel="noopener noreferrer"
              href={s.url}
              className="relative text-center"
            >
              <s.svg />
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}

const QRCodeCard = ({ CardData, index }) => {
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [copied, setCopied] = useState(false);

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


  function triggerCopy() {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500); // 3000 milliseconds (3 seconds)
  }


  return (
    <div
      className={`group flex items-center w-auto gap-x-[10px] p-[5px] sm:p-[5px] pr-[15px] border-[2px] rounded-[17px] border-[#CDD8D3] cursor-pointer
        ${CardData.key !== "Ethereum" ? "h-[80px] sm:h-[82px] sm:max-w-[200px]" : "h-[100px] sm:h-[120px] max-w-[460px]"}`}
      onClick={() => {
        window.open(CardData.url, "_blank");
        track("clicked Donate QR Code", {
          location: CardData.key,
          page: window.location.pathname,
        });
      }}
      key={CardData.key}
    >
      <div className="block h-full aspect-square relative">
        <Image src={CardData.qrImage.src} alt="QR Code" fill />
        <div className="absolute inset-0 flex items-center justify-center">
          {CardData.key !== "Ethereum" && (
            <Icon
              icon={CardData.icon.path}
              color={CardData.icon.color}
              className="w-[15px] h-[15px]"
            />
          )}
        </div>
      </div>
      <div className="h-full w-full flex flex-col-reverse justify-between items-start leading-[111%] py-[5px] sm:py-[5px] ">
        {CardData.wallet ? (
          <>
            <div className="peer flex w-full items-center hover:bg-transparent select-none numbers-xxs md:numbers-xs  leading-[120%] pb-[2px]">
              <div className="flex gap-x-[5px] items-center group " onClick={(e) => {

                const text = "0x9438b8B447179740cD97869997a2FCc9b4AA63a2";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).catch((err) => console.error("Copy failed:", err));
                } else {
                  const tempInput = document.createElement("input");
                  tempInput.value = text;
                  document.body.appendChild(tempInput);
                  tempInput.select();
                  document.execCommand("copy");
                  document.body.removeChild(tempInput);

                }
                triggerCopy();
                e.stopPropagation();
              }}
              >
                <div className=" numbers-xxs md:numbers-xs  "><TruncatedAddress address="0x9438b8B447179740cD97869997a2FCc9b4AA63a2" /></div>
                <div>
                  <Icon
                    className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] hover:cursor-pointer group-hover:visible invisible"
                    icon={copied ? "feather:check-circle" : "feather:copy"}

                  />
                </div>
              </div>
            </div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
            <div className="w-full hidden xs:block text-xs truncate text-wrap group-hover:underline peer-hover:!no-underline">
              Scan it with your wallet app!
            </div>
            <div className="w-full hidden xs:block heading-small-xs truncate text-wrap group-hover:underline peer-hover:!no-underline">
              Donate to our wall on any {CardData.key} compatible wallet.
            </div>
          </>
        ) : (
          <>
            <div></div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
            <div className="w-full hidden xs:block heading-small-xs  truncate text-wrap group-hover:underline">
              Donate on our {CardData.key} page
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TruncatedAddress = ({ address, minLength = 12 }) => {
  return (
    <div className="flex items-center overflow-hidden">
      <div className="truncate">
        {address.length > minLength ? (
          <>
            <span className="hidden lg:inline">{address}</span>
            <span className="lg:hidden">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          </>
        ) : (
          address
        )}
      </div>
    </div>
  );
};



const CountdownTimer = ({ targetDate, prefixString }: { targetDate: Date, prefixString?: string }) => {
  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    let timeLeft: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    } | null = null;

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = null; // Countdown has ended
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Update the countdown every second
    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft();
      setTimeLeft(updatedTimeLeft);

      // If the countdown is over, clear the interval
      if (!updatedTimeLeft) {
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, [targetDate]);

  const timerComponents = [];

  if (timeLeft) {
    return (
      <>
        <div className="flex items-center justify-evenly gap-x-[5px] w-full px-[8px] h-full -mt-[2px]">
          {prefixString &&
            <div>{prefixString}</div>
          }
          <div className="flex items-center justify-end gap-x-[5px] leading-[120%] text-[11px] pt-[4px] h-[20px]">
            <div className="flex flex-col items-center space-y-[-3px]">
              <div>{timeLeft.days}</div>
              <div className="font-normal text-[8px] text-forest-400">days</div>
            </div>
            <div className="flex items-center justify-cnter gap-x-[1px] leading-[120%]">
              <div className="flex flex-col items-center space-y-[-3px]">
                <div>{timeLeft.hours < 10 ? `0${timeLeft.hours}` : timeLeft.hours}</div>
                <div className="font-normal text-[8px] text-forest-400">hrs</div>
              </div>
              <div className="flex flex-col items-center space-y-[-3px]">
                <div>:</div>
                <div>&nbsp;</div>
              </div>
              <div className="flex flex-col items-center space-y-[-3px]">
                <div>{timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}</div>
                <div className="font-normal text-[8px] text-forest-400">min</div>
              </div>
              <div className="flex flex-col items-center space-y-[-3px]">
                <div>:</div>
                <div>&nbsp;</div>
              </div>
              <div className="flex flex-col items-center space-y-[-3px]">
                <div>{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}</div>
                < div className="font-normal text-[8px] text-forest-400">sec</div>
              </div>
            </div>
          </div>

        </div>
      </>
    )
  } else {
    return <div>Time&apos;s up!</div>;
  }
};