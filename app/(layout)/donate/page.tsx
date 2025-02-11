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


  const QRCodes = [
    {
      key: "Ethereum",
      wallet: true,
      qrImage: <EthereumSVG />,
      icon: {
        path: "gtp:ethereum-logo-monochrome",
        color: "#CDD8D3",
      },
      url: "https://etherscan.io/address/0x7291a5Aa55886900C460Bf4366A46820F40476fB",
      address: "0x9438b8B447179740cD97869997a2FCc9b4AA63a2",
      fullSize: true,
    },
    {
      key: "Giveth",
      wallet: false,
      qrImage: <GivethSVG />,
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
        <div className="w-full pb-[30px] grid gap-[10px] grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 justify-items-stretch items-center">
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
      className={`group flex items-center  gap-x-[10px] p-[5px] pr-[15px] border-[2px] rounded-[17px] border-[#CDD8D3] cursor-pointer
        ${CardData.key !== "Ethereum" ? "h-[58px]  sm:h-[82px]" : "h-[74px] sm:h-[110px]"}`}
      onClick={() => {
        window.open(CardData.url, "_blank");
        track("clicked Donate QR Code", {
          location: CardData.key,
          page: window.location.pathname,
        });
      }}
      key={CardData.key}

    >
      <div className={`block ${
        CardData.key !== "Ethereum" ? "pt-0 w-[48px] h-[48px] sm:w-[72px] sm:h-[72px] " : " pl-[2px] pt-[2px] w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] "
      }`}>
        <div className={`block relative ${
          CardData.key !== "Ethereum" ? "pt-0 w-[48px] h-[48px] sm:w-[72px] sm:h-[72px] " : " pl-[2px] pt-[2px] w-[64px] h-[64px] sm:w-[96px] sm:h-[96px] "
        }`}>
          {/* <Image
        src={CardData.qrImage}
        alt="QR Code"
        width={64}
        height={64}
      /> */}
          {CardData.qrImage}
          {/* <div className="absolute top-0 left-0 w-[64px] h-[64px] bg-opacity-50 flex items-center justify-center" /> */}
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
      </div>
      <div className="h-full w-full flex flex-col-reverse justify-between items-start leading-[111%] py-[5px] sm:py-[5px]">
        {CardData.wallet ? (
          <>
            <div className="peer flex w-full items-center hover:bg-transparent select-none text-[9px] leading-[120%]">
              <GridTableAddressCell address={CardData.address} className="group/address w-full !gap-x-[10px]" fontSize={10} iconClassName="!size-[9px]" iconContainerClassName="!size-[9px] opacity-0 group-hover/address:opacity-100" />
            </div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
            <div className="w-full hidden xs:block text-[11px] md:text-[14px] truncate text-wrap group-hover:underline peer-hover:!no-underline">
              Donate to our <b className="">{CardData.key}</b> Wallet
            </div>
          </>
        ) : (
          <>
            <div></div>
            <div className="w-full block xs:hidden">
              <b>{CardData.key}</b>
            </div>
            <div className="w-full hidden xs:block text-[11px] md:text-[14px] truncate text-wrap group-hover:underline">
              Donate on our <b>{CardData.key}</b> Page
            </div>
          </>
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
  <svg  viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M29.2686 -0.000976562H26.8296V2.43805H29.2686V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M34.1461 -0.000976562H31.707V2.43805H34.1461V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M41.4634 -0.000976562H39.0244V2.43805H41.4634V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M48.7808 -0.000976562H46.3418V2.43805H48.7808V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M51.2198 -0.000976562H48.7808V2.43805H51.2198V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M56.0972 -0.000976562H53.6582V2.43805H56.0972V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M58.5364 -0.000976562H56.0974V2.43805H58.5364V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M65.8538 -0.000976562H63.4148V2.43805H65.8538V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M68.293 -0.000976562H65.854V2.43805H68.293V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M70.732 -0.000976562H68.293V2.43805H70.732V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M80.4879 -0.000976562H78.0488V2.43805H80.4879V-0.000976562Z" fill="#CDD8D3"/>
  <path d="M21.9512 2.44043H19.5122V4.87945H21.9512V2.44043Z" fill="#CDD8D3"/>
  <path d="M34.1461 2.44043H31.707V4.87945H34.1461V2.44043Z" fill="#CDD8D3"/>
  <path d="M36.585 2.44043H34.146V4.87945H36.585V2.44043Z" fill="#CDD8D3"/>
  <path d="M48.7808 2.44043H46.3418V4.87945H48.7808V2.44043Z" fill="#CDD8D3"/>
  <path d="M51.2198 2.44043H48.7808V4.87945H51.2198V2.44043Z" fill="#CDD8D3"/>
  <path d="M58.5364 2.44043H56.0974V4.87945H58.5364V2.44043Z" fill="#CDD8D3"/>
  <path d="M70.732 2.44043H68.293V4.87945H70.732V2.44043Z" fill="#CDD8D3"/>
  <path d="M75.6094 2.44043H73.1704V4.87945H75.6094V2.44043Z" fill="#CDD8D3"/>
  <path d="M78.0486 2.44043H75.6096V4.87945H78.0486V2.44043Z" fill="#CDD8D3"/>
  <path d="M24.3902 4.87598H21.9512V7.315H24.3902V4.87598Z" fill="#CDD8D3"/>
  <path d="M43.9024 4.87598H41.4634V7.315H43.9024V4.87598Z" fill="#CDD8D3"/>
  <path d="M46.3416 4.87598H43.9026V7.315H46.3416V4.87598Z" fill="#CDD8D3"/>
  <path d="M53.6583 4.87598H51.2192V7.315H53.6583V4.87598Z" fill="#CDD8D3"/>
  <path d="M56.0972 4.87598H53.6582V7.315H56.0972V4.87598Z" fill="#CDD8D3"/>
  <path d="M58.5364 4.87598H56.0974V7.315H58.5364V4.87598Z" fill="#CDD8D3"/>
  <path d="M63.4146 4.87598H60.9756V7.315H63.4146V4.87598Z" fill="#CDD8D3"/>
  <path d="M68.293 4.87598H65.854V7.315H68.293V4.87598Z" fill="#CDD8D3"/>
  <path d="M70.732 4.87598H68.293V7.315H70.732V4.87598Z" fill="#CDD8D3"/>
  <path d="M73.1705 4.87598H70.7314V7.315H73.1705V4.87598Z" fill="#CDD8D3"/>
  <path d="M75.6094 4.87598H73.1704V7.315H75.6094V4.87598Z" fill="#CDD8D3"/>
  <path d="M26.8294 7.31738H24.3904V9.75641H26.8294V7.31738Z" fill="#CDD8D3"/>
  <path d="M29.2686 7.31738H26.8296V9.75641H29.2686V7.31738Z" fill="#CDD8D3"/>
  <path d="M39.0242 7.31738H36.5852V9.75641H39.0242V7.31738Z" fill="#CDD8D3"/>
  <path d="M41.4634 7.31738H39.0244V9.75641H41.4634V7.31738Z" fill="#CDD8D3"/>
  <path d="M43.9024 7.31738H41.4634V9.75641H43.9024V7.31738Z" fill="#CDD8D3"/>
  <path d="M46.3416 7.31738H43.9026V9.75641H46.3416V7.31738Z" fill="#CDD8D3"/>
  <path d="M51.2198 7.31738H48.7808V9.75641H51.2198V7.31738Z" fill="#CDD8D3"/>
  <path d="M53.6583 7.31738H51.2192V9.75641H53.6583V7.31738Z" fill="#CDD8D3"/>
  <path d="M65.8538 7.31738H63.4148V9.75641H65.8538V7.31738Z" fill="#CDD8D3"/>
  <path d="M70.732 7.31738H68.293V9.75641H70.732V7.31738Z" fill="#CDD8D3"/>
  <path d="M73.1705 7.31738H70.7314V9.75641H73.1705V7.31738Z" fill="#CDD8D3"/>
  <path d="M80.4879 7.31738H78.0488V9.75641H80.4879V7.31738Z" fill="#CDD8D3"/>
  <path d="M26.8294 9.75244H24.3904V12.1915H26.8294V9.75244Z" fill="#CDD8D3"/>
  <path d="M29.2686 9.75244H26.8296V12.1915H29.2686V9.75244Z" fill="#CDD8D3"/>
  <path d="M31.7076 9.75244H29.2686V12.1915H31.7076V9.75244Z" fill="#CDD8D3"/>
  <path d="M39.0242 9.75244H36.5852V12.1915H39.0242V9.75244Z" fill="#CDD8D3"/>
  <path d="M41.4634 9.75244H39.0244V12.1915H41.4634V9.75244Z" fill="#CDD8D3"/>
  <path d="M43.9024 9.75244H41.4634V12.1915H43.9024V9.75244Z" fill="#CDD8D3"/>
  <path d="M46.3416 9.75244H43.9026V12.1915H46.3416V9.75244Z" fill="#CDD8D3"/>
  <path d="M53.6583 9.75244H51.2192V12.1915H53.6583V9.75244Z" fill="#CDD8D3"/>
  <path d="M56.0972 9.75244H53.6582V12.1915H56.0972V9.75244Z" fill="#CDD8D3"/>
  <path d="M58.5364 9.75244H56.0974V12.1915H58.5364V9.75244Z" fill="#CDD8D3"/>
  <path d="M65.8538 9.75244H63.4148V12.1915H65.8538V9.75244Z" fill="#CDD8D3"/>
  <path d="M70.732 9.75244H68.293V12.1915H70.732V9.75244Z" fill="#CDD8D3"/>
  <path d="M73.1705 9.75244H70.7314V12.1915H73.1705V9.75244Z" fill="#CDD8D3"/>
  <path d="M80.4879 9.75244H78.0488V12.1915H80.4879V9.75244Z" fill="#CDD8D3"/>
  <path d="M21.9512 12.1938H19.5122V14.6329H21.9512V12.1938Z" fill="#CDD8D3"/>
  <path d="M24.3902 12.1938H21.9512V14.6329H24.3902V12.1938Z" fill="#CDD8D3"/>
  <path d="M29.2686 12.1938H26.8296V14.6329H29.2686V12.1938Z" fill="#CDD8D3"/>
  <path d="M31.7076 12.1938H29.2686V14.6329H31.7076V12.1938Z" fill="#CDD8D3"/>
  <path d="M46.3416 12.1938H43.9026V14.6329H46.3416V12.1938Z" fill="#CDD8D3"/>
  <path d="M48.7808 12.1938H46.3418V14.6329H48.7808V12.1938Z" fill="#CDD8D3"/>
  <path d="M51.2198 12.1938H48.7808V14.6329H51.2198V12.1938Z" fill="#CDD8D3"/>
  <path d="M53.6583 12.1938H51.2192V14.6329H53.6583V12.1938Z" fill="#CDD8D3"/>
  <path d="M58.5364 12.1938H56.0974V14.6329H58.5364V12.1938Z" fill="#CDD8D3"/>
  <path d="M60.9756 12.1938H58.5366V14.6329H60.9756V12.1938Z" fill="#CDD8D3"/>
  <path d="M63.4146 12.1938H60.9756V14.6329H63.4146V12.1938Z" fill="#CDD8D3"/>
  <path d="M65.8538 12.1938H63.4148V14.6329H65.8538V12.1938Z" fill="#CDD8D3"/>
  <path d="M70.732 12.1938H68.293V14.6329H70.732V12.1938Z" fill="#CDD8D3"/>
  <path d="M73.1705 12.1938H70.7314V14.6329H73.1705V12.1938Z" fill="#CDD8D3"/>
  <path d="M75.6094 12.1938H73.1704V14.6329H75.6094V12.1938Z" fill="#CDD8D3"/>
  <path d="M78.0486 12.1938H75.6096V14.6329H78.0486V12.1938Z" fill="#CDD8D3"/>
  <path d="M4.87805 8.53561C4.87805 6.51505 6.51603 4.87707 8.53659 4.87707C10.5571 4.87707 12.1951 6.51505 12.1951 8.53561C12.1951 10.5562 10.5571 12.1941 8.53659 12.1941C6.51603 12.1941 4.87805 10.5562 4.87805 8.53561Z" fill="#CDD8D3"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.53659 -0.000976562C3.82196 -0.000976562 0 3.82098 0 8.53561C0 13.2502 3.82196 17.0722 8.53659 17.0722C13.2512 17.0722 17.0732 13.2502 17.0732 8.53561C17.0732 3.82098 13.2512 -0.000976562 8.53659 -0.000976562ZM14.6341 8.53561C14.6341 11.9032 11.9042 14.6332 8.53659 14.6332C5.16899 14.6332 2.43902 11.9032 2.43902 8.53561C2.43902 5.16802 5.16899 2.43805 8.53659 2.43805C11.9042 2.43805 14.6341 5.16802 14.6341 8.53561Z" fill="#CDD8D3"/>
  <path d="M21.9512 14.6353H19.5122V17.0743H21.9512V14.6353Z" fill="#CDD8D3"/>
  <path d="M26.8294 14.6353H24.3904V17.0743H26.8294V14.6353Z" fill="#CDD8D3"/>
  <path d="M31.7076 14.6353H29.2686V17.0743H31.7076V14.6353Z" fill="#CDD8D3"/>
  <path d="M36.585 14.6353H34.146V17.0743H36.585V14.6353Z" fill="#CDD8D3"/>
  <path d="M41.4634 14.6353H39.0244V17.0743H41.4634V14.6353Z" fill="#CDD8D3"/>
  <path d="M46.3416 14.6353H43.9026V17.0743H46.3416V14.6353Z" fill="#CDD8D3"/>
  <path d="M51.2198 14.6353H48.7808V17.0743H51.2198V14.6353Z" fill="#CDD8D3"/>
  <path d="M56.0972 14.6353H53.6582V17.0743H56.0972V14.6353Z" fill="#CDD8D3"/>
  <path d="M60.9756 14.6353H58.5366V17.0743H60.9756V14.6353Z" fill="#CDD8D3"/>
  <path d="M65.8538 14.6353H63.4148V17.0743H65.8538V14.6353Z" fill="#CDD8D3"/>
  <path d="M70.732 14.6353H68.293V17.0743H70.732V14.6353Z" fill="#CDD8D3"/>
  <path d="M75.6094 14.6353H73.1704V17.0743H75.6094V14.6353Z" fill="#CDD8D3"/>
  <path d="M80.4879 14.6353H78.0488V17.0743H80.4879V14.6353Z" fill="#CDD8D3"/>
  <path d="M87.8051 8.53561C87.8051 6.51505 89.443 4.87707 91.4636 4.87707C93.4841 4.87707 95.1221 6.51505 95.1221 8.53561C95.1221 10.5562 93.4841 12.1941 91.4636 12.1941C89.443 12.1941 87.8051 10.5562 87.8051 8.53561Z" fill="#CDD8D3"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M91.4636 -0.000976562C86.749 -0.000976562 82.927 3.82098 82.927 8.53561C82.927 13.2502 86.749 17.0722 91.4636 17.0722C96.1782 17.0722 100 13.2502 100 8.53561C100 3.82098 96.1782 -0.000976562 91.4636 -0.000976562ZM97.5611 8.53561C97.5611 11.9032 94.8312 14.6332 91.4636 14.6332C88.096 14.6332 85.366 11.9032 85.366 8.53561C85.366 5.16802 88.096 2.43805 91.4636 2.43805C94.8312 2.43805 97.5611 5.16802 97.5611 8.53561Z" fill="#CDD8D3"/>
  <path d="M21.9512 17.0703H19.5122V19.5093H21.9512V17.0703Z" fill="#CDD8D3"/>
  <path d="M24.3902 17.0703H21.9512V19.5093H24.3902V17.0703Z" fill="#CDD8D3"/>
  <path d="M34.1461 17.0703H31.707V19.5093H34.1461V17.0703Z" fill="#CDD8D3"/>
  <path d="M48.7808 17.0703H46.3418V19.5093H48.7808V17.0703Z" fill="#CDD8D3"/>
  <path d="M51.2198 17.0703H48.7808V19.5093H51.2198V17.0703Z" fill="#CDD8D3"/>
  <path d="M56.0972 17.0703H53.6582V19.5093H56.0972V17.0703Z" fill="#CDD8D3"/>
  <path d="M58.5364 17.0703H56.0974V19.5093H58.5364V17.0703Z" fill="#CDD8D3"/>
  <path d="M70.732 17.0703H68.293V19.5093H70.732V17.0703Z" fill="#CDD8D3"/>
  <path d="M73.1705 17.0703H70.7314V19.5093H73.1705V17.0703Z" fill="#CDD8D3"/>
  <path d="M78.0486 17.0703H75.6096V19.5093H78.0486V17.0703Z" fill="#CDD8D3"/>
  <path d="M80.4879 17.0703H78.0488V19.5093H80.4879V17.0703Z" fill="#CDD8D3"/>
  <path d="M12.1954 19.5117H9.75635V21.9507H12.1954V19.5117Z" fill="#CDD8D3"/>
  <path d="M14.6338 19.5117H12.1948V21.9507H14.6338V19.5117Z" fill="#CDD8D3"/>
  <path d="M17.0731 19.5117H14.634V21.9507H17.0731V19.5117Z" fill="#CDD8D3"/>
  <path d="M19.512 19.5117H17.073V21.9507H19.512V19.5117Z" fill="#CDD8D3"/>
  <path d="M24.3902 19.5117H21.9512V21.9507H24.3902V19.5117Z" fill="#CDD8D3"/>
  <path d="M29.2686 19.5117H26.8296V21.9507H29.2686V19.5117Z" fill="#CDD8D3"/>
  <path d="M31.7076 19.5117H29.2686V21.9507H31.7076V19.5117Z" fill="#CDD8D3"/>
  <path d="M34.1461 19.5117H31.707V21.9507H34.1461V19.5117Z" fill="#CDD8D3"/>
  <path d="M36.585 19.5117H34.146V21.9507H36.585V19.5117Z" fill="#CDD8D3"/>
  <path d="M39.0242 19.5117H36.5852V21.9507H39.0242V19.5117Z" fill="#CDD8D3"/>
  <path d="M43.9024 19.5117H41.4634V21.9507H43.9024V19.5117Z" fill="#CDD8D3"/>
  <path d="M46.3416 19.5117H43.9026V21.9507H46.3416V19.5117Z" fill="#CDD8D3"/>
  <path d="M51.2198 19.5117H48.7808V21.9507H51.2198V19.5117Z" fill="#CDD8D3"/>
  <path d="M53.6583 19.5117H51.2192V21.9507H53.6583V19.5117Z" fill="#CDD8D3"/>
  <path d="M56.0972 19.5117H53.6582V21.9507H56.0972V19.5117Z" fill="#CDD8D3"/>
  <path d="M60.9756 19.5117H58.5366V21.9507H60.9756V19.5117Z" fill="#CDD8D3"/>
  <path d="M63.4146 19.5117H60.9756V21.9507H63.4146V19.5117Z" fill="#CDD8D3"/>
  <path d="M70.732 19.5117H68.293V21.9507H70.732V19.5117Z" fill="#CDD8D3"/>
  <path d="M73.1705 19.5117H70.7314V21.9507H73.1705V19.5117Z" fill="#CDD8D3"/>
  <path d="M75.6094 19.5117H73.1704V21.9507H75.6094V19.5117Z" fill="#CDD8D3"/>
  <path d="M78.0486 19.5117H75.6096V21.9507H78.0486V19.5117Z" fill="#CDD8D3"/>
  <path d="M85.366 19.5117H82.927V21.9507H85.366V19.5117Z" fill="#CDD8D3"/>
  <path d="M87.805 19.5117H85.366V21.9507H87.805V19.5117Z" fill="#CDD8D3"/>
  <path d="M97.5609 19.5117H95.1218V21.9507H97.5609V19.5117Z" fill="#CDD8D3"/>
  <path d="M2.43902 21.9473H0V24.3863H2.43902V21.9473Z" fill="#CDD8D3"/>
  <path d="M7.3172 21.9473H4.87817V24.3863H7.3172V21.9473Z" fill="#CDD8D3"/>
  <path d="M9.75641 21.9473H7.31738V24.3863H9.75641V21.9473Z" fill="#CDD8D3"/>
  <path d="M12.1954 21.9473H9.75635V24.3863H12.1954V21.9473Z" fill="#CDD8D3"/>
  <path d="M19.512 21.9473H17.073V24.3863H19.512V21.9473Z" fill="#CDD8D3"/>
  <path d="M21.9512 21.9473H19.5122V24.3863H21.9512V21.9473Z" fill="#CDD8D3"/>
  <path d="M26.8294 21.9473H24.3904V24.3863H26.8294V21.9473Z" fill="#CDD8D3"/>
  <path d="M29.2686 21.9473H26.8296V24.3863H29.2686V21.9473Z" fill="#CDD8D3"/>
  <path d="M41.4634 21.9473H39.0244V24.3863H41.4634V21.9473Z" fill="#CDD8D3"/>
  <path d="M46.3416 21.9473H43.9026V24.3863H46.3416V21.9473Z" fill="#CDD8D3"/>
  <path d="M53.6583 21.9473H51.2192V24.3863H53.6583V21.9473Z" fill="#CDD8D3"/>
  <path d="M56.0972 21.9473H53.6582V24.3863H56.0972V21.9473Z" fill="#CDD8D3"/>
  <path d="M60.9756 21.9473H58.5366V24.3863H60.9756V21.9473Z" fill="#CDD8D3"/>
  <path d="M68.293 21.9473H65.854V24.3863H68.293V21.9473Z" fill="#CDD8D3"/>
  <path d="M73.1705 21.9473H70.7314V24.3863H73.1705V21.9473Z" fill="#CDD8D3"/>
  <path d="M80.4879 21.9473H78.0488V24.3863H80.4879V21.9473Z" fill="#CDD8D3"/>
  <path d="M82.9268 21.9473H80.4878V24.3863H82.9268V21.9473Z" fill="#CDD8D3"/>
  <path d="M85.366 21.9473H82.927V24.3863H85.366V21.9473Z" fill="#CDD8D3"/>
  <path d="M90.2442 21.9473H87.8052V24.3863H90.2442V21.9473Z" fill="#CDD8D3"/>
  <path d="M95.1216 21.9473H92.6826V24.3863H95.1216V21.9473Z" fill="#CDD8D3"/>
  <path d="M2.43902 24.3887H0V26.8277H2.43902V24.3887Z" fill="#CDD8D3"/>
  <path d="M7.3172 24.3887H4.87817V26.8277H7.3172V24.3887Z" fill="#CDD8D3"/>
  <path d="M14.6338 24.3887H12.1948V26.8277H14.6338V24.3887Z" fill="#CDD8D3"/>
  <path d="M17.0731 24.3887H14.634V26.8277H17.0731V24.3887Z" fill="#CDD8D3"/>
  <path d="M19.512 24.3887H17.073V26.8277H19.512V24.3887Z" fill="#CDD8D3"/>
  <path d="M21.9512 24.3887H19.5122V26.8277H21.9512V24.3887Z" fill="#CDD8D3"/>
  <path d="M24.3902 24.3887H21.9512V26.8277H24.3902V24.3887Z" fill="#CDD8D3"/>
  <path d="M26.8294 24.3887H24.3904V26.8277H26.8294V24.3887Z" fill="#CDD8D3"/>
  <path d="M29.2686 24.3887H26.8296V26.8277H29.2686V24.3887Z" fill="#CDD8D3"/>
  <path d="M43.9024 24.3887H41.4634V26.8277H43.9024V24.3887Z" fill="#CDD8D3"/>
  <path d="M46.3416 24.3887H43.9026V26.8277H46.3416V24.3887Z" fill="#CDD8D3"/>
  <path d="M48.7808 24.3887H46.3418V26.8277H48.7808V24.3887Z" fill="#CDD8D3"/>
  <path d="M56.0972 24.3887H53.6582V26.8277H56.0972V24.3887Z" fill="#CDD8D3"/>
  <path d="M58.5364 24.3887H56.0974V26.8277H58.5364V24.3887Z" fill="#CDD8D3"/>
  <path d="M63.4146 24.3887H60.9756V26.8277H63.4146V24.3887Z" fill="#CDD8D3"/>
  <path d="M65.8538 24.3887H63.4148V26.8277H65.8538V24.3887Z" fill="#CDD8D3"/>
  <path d="M68.293 24.3887H65.854V26.8277H68.293V24.3887Z" fill="#CDD8D3"/>
  <path d="M70.732 24.3887H68.293V26.8277H70.732V24.3887Z" fill="#CDD8D3"/>
  <path d="M73.1705 24.3887H70.7314V26.8277H73.1705V24.3887Z" fill="#CDD8D3"/>
  <path d="M80.4879 24.3887H78.0488V26.8277H80.4879V24.3887Z" fill="#CDD8D3"/>
  <path d="M82.9268 24.3887H80.4878V26.8277H82.9268V24.3887Z" fill="#CDD8D3"/>
  <path d="M85.366 24.3887H82.927V26.8277H85.366V24.3887Z" fill="#CDD8D3"/>
  <path d="M92.6827 24.3887H90.2437V26.8277H92.6827V24.3887Z" fill="#CDD8D3"/>
  <path d="M99.9998 24.3887H97.5608V26.8277H99.9998V24.3887Z" fill="#CDD8D3"/>
  <path d="M4.87823 26.8301H2.43921V29.2691H4.87823V26.8301Z" fill="#CDD8D3"/>
  <path d="M9.75641 26.8301H7.31738V29.2691H9.75641V26.8301Z" fill="#CDD8D3"/>
  <path d="M14.6338 26.8301H12.1948V29.2691H14.6338V26.8301Z" fill="#CDD8D3"/>
  <path d="M19.512 26.8301H17.073V29.2691H19.512V26.8301Z" fill="#CDD8D3"/>
  <path d="M24.3902 26.8301H21.9512V29.2691H24.3902V26.8301Z" fill="#CDD8D3"/>
  <path d="M26.8294 26.8301H24.3904V29.2691H26.8294V26.8301Z" fill="#CDD8D3"/>
  <path d="M36.585 26.8301H34.146V29.2691H36.585V26.8301Z" fill="#CDD8D3"/>
  <path d="M41.4634 26.8301H39.0244V29.2691H41.4634V26.8301Z" fill="#CDD8D3"/>
  <path d="M56.0972 26.8301H53.6582V29.2691H56.0972V26.8301Z" fill="#CDD8D3"/>
  <path d="M58.5364 26.8301H56.0974V29.2691H58.5364V26.8301Z" fill="#CDD8D3"/>
  <path d="M60.9756 26.8301H58.5366V29.2691H60.9756V26.8301Z" fill="#CDD8D3"/>
  <path d="M63.4146 26.8301H60.9756V29.2691H63.4146V26.8301Z" fill="#CDD8D3"/>
  <path d="M65.8538 26.8301H63.4148V29.2691H65.8538V26.8301Z" fill="#CDD8D3"/>
  <path d="M68.293 26.8301H65.854V29.2691H68.293V26.8301Z" fill="#CDD8D3"/>
  <path d="M73.1705 26.8301H70.7314V29.2691H73.1705V26.8301Z" fill="#CDD8D3"/>
  <path d="M75.6094 26.8301H73.1704V29.2691H75.6094V26.8301Z" fill="#CDD8D3"/>
  <path d="M80.4879 26.8301H78.0488V29.2691H80.4879V26.8301Z" fill="#CDD8D3"/>
  <path d="M87.805 26.8301H85.366V29.2691H87.805V26.8301Z" fill="#CDD8D3"/>
  <path d="M90.2442 26.8301H87.8052V29.2691H90.2442V26.8301Z" fill="#CDD8D3"/>
  <path d="M92.6827 26.8301H90.2437V29.2691H92.6827V26.8301Z" fill="#CDD8D3"/>
  <path d="M97.5609 26.8301H95.1218V29.2691H97.5609V26.8301Z" fill="#CDD8D3"/>
  <path d="M99.9998 26.8301H97.5608V29.2691H99.9998V26.8301Z" fill="#CDD8D3"/>
  <path d="M2.43902 29.2656H0V31.7046H2.43902V29.2656Z" fill="#CDD8D3"/>
  <path d="M4.87823 29.2656H2.43921V31.7046H4.87823V29.2656Z" fill="#CDD8D3"/>
  <path d="M7.3172 29.2656H4.87817V31.7046H7.3172V29.2656Z" fill="#CDD8D3"/>
  <path d="M12.1954 29.2656H9.75635V31.7046H12.1954V29.2656Z" fill="#CDD8D3"/>
  <path d="M17.0731 29.2656H14.634V31.7046H17.0731V29.2656Z" fill="#CDD8D3"/>
  <path d="M21.9512 29.2656H19.5122V31.7046H21.9512V29.2656Z" fill="#CDD8D3"/>
  <path d="M24.3902 29.2656H21.9512V31.7046H24.3902V29.2656Z" fill="#CDD8D3"/>
  <path d="M26.8294 29.2656H24.3904V31.7046H26.8294V29.2656Z" fill="#CDD8D3"/>
  <path d="M29.2686 29.2656H26.8296V31.7046H29.2686V29.2656Z" fill="#CDD8D3"/>
  <path d="M36.585 29.2656H34.146V31.7046H36.585V29.2656Z" fill="#CDD8D3"/>
  <path d="M46.3416 29.2656H43.9026V31.7046H46.3416V29.2656Z" fill="#CDD8D3"/>
  <path d="M58.5364 29.2656H56.0974V31.7046H58.5364V29.2656Z" fill="#CDD8D3"/>
  <path d="M65.8538 29.2656H63.4148V31.7046H65.8538V29.2656Z" fill="#CDD8D3"/>
  <path d="M70.732 29.2656H68.293V31.7046H70.732V29.2656Z" fill="#CDD8D3"/>
  <path d="M73.1705 29.2656H70.7314V31.7046H73.1705V29.2656Z" fill="#CDD8D3"/>
  <path d="M75.6094 29.2656H73.1704V31.7046H75.6094V29.2656Z" fill="#CDD8D3"/>
  <path d="M80.4879 29.2656H78.0488V31.7046H80.4879V29.2656Z" fill="#CDD8D3"/>
  <path d="M82.9268 29.2656H80.4878V31.7046H82.9268V29.2656Z" fill="#CDD8D3"/>
  <path d="M87.805 29.2656H85.366V31.7046H87.805V29.2656Z" fill="#CDD8D3"/>
  <path d="M97.5609 29.2656H95.1218V31.7046H97.5609V29.2656Z" fill="#CDD8D3"/>
  <path d="M2.43902 31.707H0V34.1461H2.43902V31.707Z" fill="#CDD8D3"/>
  <path d="M4.87823 31.707H2.43921V34.1461H4.87823V31.707Z" fill="#CDD8D3"/>
  <path d="M9.75641 31.707H7.31738V34.1461H9.75641V31.707Z" fill="#CDD8D3"/>
  <path d="M12.1954 31.707H9.75635V34.1461H12.1954V31.707Z" fill="#CDD8D3"/>
  <path d="M19.512 31.707H17.073V34.1461H19.512V31.707Z" fill="#CDD8D3"/>
  <path d="M21.9512 31.707H19.5122V34.1461H21.9512V31.707Z" fill="#CDD8D3"/>
  <path d="M26.8294 31.707H24.3904V34.1461H26.8294V31.707Z" fill="#CDD8D3"/>
  <path d="M39.0242 31.707H36.5852V34.1461H39.0242V31.707Z" fill="#CDD8D3"/>
  <path d="M43.9024 31.707H41.4634V34.1461H43.9024V31.707Z" fill="#CDD8D3"/>
  <path d="M51.2198 31.707H48.7808V34.1461H51.2198V31.707Z" fill="#CDD8D3"/>
  <path d="M53.6583 31.707H51.2192V34.1461H53.6583V31.707Z" fill="#CDD8D3"/>
  <path d="M58.5364 31.707H56.0974V34.1461H58.5364V31.707Z" fill="#CDD8D3"/>
  <path d="M63.4146 31.707H60.9756V34.1461H63.4146V31.707Z" fill="#CDD8D3"/>
  <path d="M78.0486 31.707H75.6096V34.1461H78.0486V31.707Z" fill="#CDD8D3"/>
  <path d="M85.366 31.707H82.927V34.1461H85.366V31.707Z" fill="#CDD8D3"/>
  <path d="M90.2442 31.707H87.8052V34.1461H90.2442V31.707Z" fill="#CDD8D3"/>
  <path d="M92.6827 31.707H90.2437V34.1461H92.6827V31.707Z" fill="#CDD8D3"/>
  <path d="M95.1216 31.707H92.6826V34.1461H95.1216V31.707Z" fill="#CDD8D3"/>
  <path d="M97.5609 31.707H95.1218V34.1461H97.5609V31.707Z" fill="#CDD8D3"/>
  <path d="M99.9998 31.707H97.5608V34.1461H99.9998V31.707Z" fill="#CDD8D3"/>
  <path d="M2.43902 34.1484H0V36.5875H2.43902V34.1484Z" fill="#CDD8D3"/>
  <path d="M7.3172 34.1484H4.87817V36.5875H7.3172V34.1484Z" fill="#CDD8D3"/>
  <path d="M9.75641 34.1484H7.31738V36.5875H9.75641V34.1484Z" fill="#CDD8D3"/>
  <path d="M12.1954 34.1484H9.75635V36.5875H12.1954V34.1484Z" fill="#CDD8D3"/>
  <path d="M17.0731 34.1484H14.634V36.5875H17.0731V34.1484Z" fill="#CDD8D3"/>
  <path d="M19.512 34.1484H17.073V36.5875H19.512V34.1484Z" fill="#CDD8D3"/>
  <path d="M21.9512 34.1484H19.5122V36.5875H21.9512V34.1484Z" fill="#CDD8D3"/>
  <path d="M29.2686 34.1484H26.8296V36.5875H29.2686V34.1484Z" fill="#CDD8D3"/>
  <path d="M31.7076 34.1484H29.2686V36.5875H31.7076V34.1484Z" fill="#CDD8D3"/>
  <path d="M78.0486 34.1484H75.6096V36.5875H78.0486V34.1484Z" fill="#CDD8D3"/>
  <path d="M82.9268 34.1484H80.4878V36.5875H82.9268V34.1484Z" fill="#CDD8D3"/>
  <path d="M85.366 34.1484H82.927V36.5875H85.366V34.1484Z" fill="#CDD8D3"/>
  <path d="M87.805 34.1484H85.366V36.5875H87.805V34.1484Z" fill="#CDD8D3"/>
  <path d="M95.1216 34.1484H92.6826V36.5875H95.1216V34.1484Z" fill="#CDD8D3"/>
  <path d="M97.5609 34.1484H95.1218V36.5875H97.5609V34.1484Z" fill="#CDD8D3"/>
  <path d="M99.9998 34.1484H97.5608V36.5875H99.9998V34.1484Z" fill="#CDD8D3"/>
  <path d="M7.3172 36.5835H4.87817V39.0225H7.3172V36.5835Z" fill="#CDD8D3"/>
  <path d="M9.75641 36.5835H7.31738V39.0225H9.75641V36.5835Z" fill="#CDD8D3"/>
  <path d="M12.1954 36.5835H9.75635V39.0225H12.1954V36.5835Z" fill="#CDD8D3"/>
  <path d="M14.6338 36.5835H12.1948V39.0225H14.6338V36.5835Z" fill="#CDD8D3"/>
  <path d="M29.2686 36.5835H26.8296V39.0225H29.2686V36.5835Z" fill="#CDD8D3"/>
  <path d="M31.7076 36.5835H29.2686V39.0225H31.7076V36.5835Z" fill="#CDD8D3"/>
  <path d="M34.1461 36.5835H31.707V39.0225H34.1461V36.5835Z" fill="#CDD8D3"/>
  <path d="M70.732 36.5835H68.293V39.0225H70.732V36.5835Z" fill="#CDD8D3"/>
  <path d="M73.1705 36.5835H70.7314V39.0225H73.1705V36.5835Z" fill="#CDD8D3"/>
  <path d="M78.0486 36.5835H75.6096V39.0225H78.0486V36.5835Z" fill="#CDD8D3"/>
  <path d="M80.4879 36.5835H78.0488V39.0225H80.4879V36.5835Z" fill="#CDD8D3"/>
  <path d="M82.9268 36.5835H80.4878V39.0225H82.9268V36.5835Z" fill="#CDD8D3"/>
  <path d="M99.9998 36.5835H97.5608V39.0225H99.9998V36.5835Z" fill="#CDD8D3"/>
  <path d="M2.43902 39.0249H0V41.4639H2.43902V39.0249Z" fill="#CDD8D3"/>
  <path d="M4.87823 39.0249H2.43921V41.4639H4.87823V39.0249Z" fill="#CDD8D3"/>
  <path d="M9.75641 39.0249H7.31738V41.4639H9.75641V39.0249Z" fill="#CDD8D3"/>
  <path d="M17.0731 39.0249H14.634V41.4639H17.0731V39.0249Z" fill="#CDD8D3"/>
  <path d="M19.512 39.0249H17.073V41.4639H19.512V39.0249Z" fill="#CDD8D3"/>
  <path d="M26.8294 39.0249H24.3904V41.4639H26.8294V39.0249Z" fill="#CDD8D3"/>
  <path d="M70.732 39.0249H68.293V41.4639H70.732V39.0249Z" fill="#CDD8D3"/>
  <path d="M80.4879 39.0249H78.0488V41.4639H80.4879V39.0249Z" fill="#CDD8D3"/>
  <path d="M82.9268 39.0249H80.4878V41.4639H82.9268V39.0249Z" fill="#CDD8D3"/>
  <path d="M87.805 39.0249H85.366V41.4639H87.805V39.0249Z" fill="#CDD8D3"/>
  <path d="M99.9998 39.0249H97.5608V41.4639H99.9998V39.0249Z" fill="#CDD8D3"/>
  <path d="M2.43902 41.46H0V43.899H2.43902V41.46Z" fill="#CDD8D3"/>
  <path d="M4.87823 41.46H2.43921V43.899H4.87823V41.46Z" fill="#CDD8D3"/>
  <path d="M7.3172 41.46H4.87817V43.899H7.3172V41.46Z" fill="#CDD8D3"/>
  <path d="M9.75641 41.46H7.31738V43.899H9.75641V41.46Z" fill="#CDD8D3"/>
  <path d="M12.1954 41.46H9.75635V43.899H12.1954V41.46Z" fill="#CDD8D3"/>
  <path d="M14.6338 41.46H12.1948V43.899H14.6338V41.46Z" fill="#CDD8D3"/>
  <path d="M24.3902 41.46H21.9512V43.899H24.3902V41.46Z" fill="#CDD8D3"/>
  <path d="M29.2686 41.46H26.8296V43.899H29.2686V41.46Z" fill="#CDD8D3"/>
  <path d="M31.7076 41.46H29.2686V43.899H31.7076V41.46Z" fill="#CDD8D3"/>
  <path d="M34.1461 41.46H31.707V43.899H34.1461V41.46Z" fill="#CDD8D3"/>
  <path d="M73.1705 41.46H70.7314V43.899H73.1705V41.46Z" fill="#CDD8D3"/>
  <path d="M75.6094 41.46H73.1704V43.899H75.6094V41.46Z" fill="#CDD8D3"/>
  <path d="M85.366 41.46H82.927V43.899H85.366V41.46Z" fill="#CDD8D3"/>
  <path d="M87.805 41.46H85.366V43.899H87.805V41.46Z" fill="#CDD8D3"/>
  <path d="M90.2442 41.46H87.8052V43.899H90.2442V41.46Z" fill="#CDD8D3"/>
  <path d="M95.1216 41.46H92.6826V43.899H95.1216V41.46Z" fill="#CDD8D3"/>
  <path d="M99.9998 41.46H97.5608V43.899H99.9998V41.46Z" fill="#CDD8D3"/>
  <path d="M2.43902 43.9014H0V46.3404H2.43902V43.9014Z" fill="#CDD8D3"/>
  <path d="M4.87823 43.9014H2.43921V46.3404H4.87823V43.9014Z" fill="#CDD8D3"/>
  <path d="M7.3172 43.9014H4.87817V46.3404H7.3172V43.9014Z" fill="#CDD8D3"/>
  <path d="M17.0731 43.9014H14.634V46.3404H17.0731V43.9014Z" fill="#CDD8D3"/>
  <path d="M21.9512 43.9014H19.5122V46.3404H21.9512V43.9014Z" fill="#CDD8D3"/>
  <path d="M24.3902 43.9014H21.9512V46.3404H24.3902V43.9014Z" fill="#CDD8D3"/>
  <path d="M26.8294 43.9014H24.3904V46.3404H26.8294V43.9014Z" fill="#CDD8D3"/>
  <path d="M29.2686 43.9014H26.8296V46.3404H29.2686V43.9014Z" fill="#CDD8D3"/>
  <path d="M31.7076 43.9014H29.2686V46.3404H31.7076V43.9014Z" fill="#CDD8D3"/>
  <path d="M75.6094 43.9014H73.1704V46.3404H75.6094V43.9014Z" fill="#CDD8D3"/>
  <path d="M80.4879 43.9014H78.0488V46.3404H80.4879V43.9014Z" fill="#CDD8D3"/>
  <path d="M85.366 43.9014H82.927V46.3404H85.366V43.9014Z" fill="#CDD8D3"/>
  <path d="M92.6827 43.9014H90.2437V46.3404H92.6827V43.9014Z" fill="#CDD8D3"/>
  <path d="M95.1216 43.9014H92.6826V46.3404H95.1216V43.9014Z" fill="#CDD8D3"/>
  <path d="M99.9998 43.9014H97.5608V46.3404H99.9998V43.9014Z" fill="#CDD8D3"/>
  <path d="M2.43902 46.3428H0V48.7818H2.43902V46.3428Z" fill="#CDD8D3"/>
  <path d="M4.87823 46.3428H2.43921V48.7818H4.87823V46.3428Z" fill="#CDD8D3"/>
  <path d="M12.1954 46.3428H9.75635V48.7818H12.1954V46.3428Z" fill="#CDD8D3"/>
  <path d="M14.6338 46.3428H12.1948V48.7818H14.6338V46.3428Z" fill="#CDD8D3"/>
  <path d="M19.512 46.3428H17.073V48.7818H19.512V46.3428Z" fill="#CDD8D3"/>
  <path d="M24.3902 46.3428H21.9512V48.7818H24.3902V46.3428Z" fill="#CDD8D3"/>
  <path d="M26.8294 46.3428H24.3904V48.7818H26.8294V46.3428Z" fill="#CDD8D3"/>
  <path d="M29.2686 46.3428H26.8296V48.7818H29.2686V46.3428Z" fill="#CDD8D3"/>
  <path d="M34.1461 46.3428H31.707V48.7818H34.1461V46.3428Z" fill="#CDD8D3"/>
  <path d="M70.732 46.3428H68.293V48.7818H70.732V46.3428Z" fill="#CDD8D3"/>
  <path d="M78.0486 46.3428H75.6096V48.7818H78.0486V46.3428Z" fill="#CDD8D3"/>
  <path d="M80.4879 46.3428H78.0488V48.7818H80.4879V46.3428Z" fill="#CDD8D3"/>
  <path d="M82.9268 46.3428H80.4878V48.7818H82.9268V46.3428Z" fill="#CDD8D3"/>
  <path d="M85.366 46.3428H82.927V48.7818H85.366V46.3428Z" fill="#CDD8D3"/>
  <path d="M97.5609 46.3428H95.1218V48.7818H97.5609V46.3428Z" fill="#CDD8D3"/>
  <path d="M99.9998 46.3428H97.5608V48.7818H99.9998V46.3428Z" fill="#CDD8D3"/>
  <path d="M2.43902 48.7783H0V51.2173H2.43902V48.7783Z" fill="#CDD8D3"/>
  <path d="M4.87823 48.7783H2.43921V51.2173H4.87823V48.7783Z" fill="#CDD8D3"/>
  <path d="M9.75641 48.7783H7.31738V51.2173H9.75641V48.7783Z" fill="#CDD8D3"/>
  <path d="M12.1954 48.7783H9.75635V51.2173H12.1954V48.7783Z" fill="#CDD8D3"/>
  <path d="M17.0731 48.7783H14.634V51.2173H17.0731V48.7783Z" fill="#CDD8D3"/>
  <path d="M21.9512 48.7783H19.5122V51.2173H21.9512V48.7783Z" fill="#CDD8D3"/>
  <path d="M24.3902 48.7783H21.9512V51.2173H24.3902V48.7783Z" fill="#CDD8D3"/>
  <path d="M26.8294 48.7783H24.3904V51.2173H26.8294V48.7783Z" fill="#CDD8D3"/>
  <path d="M29.2686 48.7783H26.8296V51.2173H29.2686V48.7783Z" fill="#CDD8D3"/>
  <path d="M31.7076 48.7783H29.2686V51.2173H31.7076V48.7783Z" fill="#CDD8D3"/>
  <path d="M34.1461 48.7783H31.707V51.2173H34.1461V48.7783Z" fill="#CDD8D3"/>
  <path d="M78.0486 48.7783H75.6096V51.2173H78.0486V48.7783Z" fill="#CDD8D3"/>
  <path d="M87.805 48.7783H85.366V51.2173H87.805V48.7783Z" fill="#CDD8D3"/>
  <path d="M99.9998 48.7783H97.5608V51.2173H99.9998V48.7783Z" fill="#CDD8D3"/>
  <path d="M2.43902 51.2197H0V53.6588H2.43902V51.2197Z" fill="#CDD8D3"/>
  <path d="M7.3172 51.2197H4.87817V53.6588H7.3172V51.2197Z" fill="#CDD8D3"/>
  <path d="M14.6338 51.2197H12.1948V53.6588H14.6338V51.2197Z" fill="#CDD8D3"/>
  <path d="M21.9512 51.2197H19.5122V53.6588H21.9512V51.2197Z" fill="#CDD8D3"/>
  <path d="M24.3902 51.2197H21.9512V53.6588H24.3902V51.2197Z" fill="#CDD8D3"/>
  <path d="M70.732 51.2197H68.293V53.6588H70.732V51.2197Z" fill="#CDD8D3"/>
  <path d="M75.6094 51.2197H73.1704V53.6588H75.6094V51.2197Z" fill="#CDD8D3"/>
  <path d="M80.4879 51.2197H78.0488V53.6588H80.4879V51.2197Z" fill="#CDD8D3"/>
  <path d="M82.9268 51.2197H80.4878V53.6588H82.9268V51.2197Z" fill="#CDD8D3"/>
  <path d="M85.366 51.2197H82.927V53.6588H85.366V51.2197Z" fill="#CDD8D3"/>
  <path d="M90.2442 51.2197H87.8052V53.6588H90.2442V51.2197Z" fill="#CDD8D3"/>
  <path d="M92.6827 51.2197H90.2437V53.6588H92.6827V51.2197Z" fill="#CDD8D3"/>
  <path d="M95.1216 51.2197H92.6826V53.6588H95.1216V51.2197Z" fill="#CDD8D3"/>
  <path d="M99.9998 51.2197H97.5608V53.6588H99.9998V51.2197Z" fill="#CDD8D3"/>
  <path d="M2.43902 53.6553H0V56.0943H2.43902V53.6553Z" fill="#CDD8D3"/>
  <path d="M7.3172 53.6553H4.87817V56.0943H7.3172V53.6553Z" fill="#CDD8D3"/>
  <path d="M14.6338 53.6553H12.1948V56.0943H14.6338V53.6553Z" fill="#CDD8D3"/>
  <path d="M17.0731 53.6553H14.634V56.0943H17.0731V53.6553Z" fill="#CDD8D3"/>
  <path d="M19.512 53.6553H17.073V56.0943H19.512V53.6553Z" fill="#CDD8D3"/>
  <path d="M21.9512 53.6553H19.5122V56.0943H21.9512V53.6553Z" fill="#CDD8D3"/>
  <path d="M24.3902 53.6553H21.9512V56.0943H24.3902V53.6553Z" fill="#CDD8D3"/>
  <path d="M29.2686 53.6553H26.8296V56.0943H29.2686V53.6553Z" fill="#CDD8D3"/>
  <path d="M31.7076 53.6553H29.2686V56.0943H31.7076V53.6553Z" fill="#CDD8D3"/>
  <path d="M70.732 53.6553H68.293V56.0943H70.732V53.6553Z" fill="#CDD8D3"/>
  <path d="M73.1705 53.6553H70.7314V56.0943H73.1705V53.6553Z" fill="#CDD8D3"/>
  <path d="M80.4879 53.6553H78.0488V56.0943H80.4879V53.6553Z" fill="#CDD8D3"/>
  <path d="M82.9268 53.6553H80.4878V56.0943H82.9268V53.6553Z" fill="#CDD8D3"/>
  <path d="M87.805 53.6553H85.366V56.0943H87.805V53.6553Z" fill="#CDD8D3"/>
  <path d="M90.2442 53.6553H87.8052V56.0943H90.2442V53.6553Z" fill="#CDD8D3"/>
  <path d="M92.6827 53.6553H90.2437V56.0943H92.6827V53.6553Z" fill="#CDD8D3"/>
  <path d="M99.9998 53.6553H97.5608V56.0943H99.9998V53.6553Z" fill="#CDD8D3"/>
  <path d="M7.3172 56.0967H4.87817V58.5357H7.3172V56.0967Z" fill="#CDD8D3"/>
  <path d="M9.75641 56.0967H7.31738V58.5357H9.75641V56.0967Z" fill="#CDD8D3"/>
  <path d="M14.6338 56.0967H12.1948V58.5357H14.6338V56.0967Z" fill="#CDD8D3"/>
  <path d="M24.3902 56.0967H21.9512V58.5357H24.3902V56.0967Z" fill="#CDD8D3"/>
  <path d="M26.8294 56.0967H24.3904V58.5357H26.8294V56.0967Z" fill="#CDD8D3"/>
  <path d="M29.2686 56.0967H26.8296V58.5357H29.2686V56.0967Z" fill="#CDD8D3"/>
  <path d="M31.7076 56.0967H29.2686V58.5357H31.7076V56.0967Z" fill="#CDD8D3"/>
  <path d="M34.1461 56.0967H31.707V58.5357H34.1461V56.0967Z" fill="#CDD8D3"/>
  <path d="M70.732 56.0967H68.293V58.5357H70.732V56.0967Z" fill="#CDD8D3"/>
  <path d="M73.1705 56.0967H70.7314V58.5357H73.1705V56.0967Z" fill="#CDD8D3"/>
  <path d="M85.366 56.0967H82.927V58.5357H85.366V56.0967Z" fill="#CDD8D3"/>
  <path d="M92.6827 56.0967H90.2437V58.5357H92.6827V56.0967Z" fill="#CDD8D3"/>
  <path d="M4.87823 58.5381H2.43921V60.9771H4.87823V58.5381Z" fill="#CDD8D3"/>
  <path d="M7.3172 58.5381H4.87817V60.9771H7.3172V58.5381Z" fill="#CDD8D3"/>
  <path d="M9.75641 58.5381H7.31738V60.9771H9.75641V58.5381Z" fill="#CDD8D3"/>
  <path d="M12.1954 58.5381H9.75635V60.9771H12.1954V58.5381Z" fill="#CDD8D3"/>
  <path d="M17.0731 58.5381H14.634V60.9771H17.0731V58.5381Z" fill="#CDD8D3"/>
  <path d="M21.9512 58.5381H19.5122V60.9771H21.9512V58.5381Z" fill="#CDD8D3"/>
  <path d="M26.8294 58.5381H24.3904V60.9771H26.8294V58.5381Z" fill="#CDD8D3"/>
  <path d="M70.732 58.5381H68.293V60.9771H70.732V58.5381Z" fill="#CDD8D3"/>
  <path d="M73.1705 58.5381H70.7314V60.9771H73.1705V58.5381Z" fill="#CDD8D3"/>
  <path d="M78.0486 58.5381H75.6096V60.9771H78.0486V58.5381Z" fill="#CDD8D3"/>
  <path d="M80.4879 58.5381H78.0488V60.9771H80.4879V58.5381Z" fill="#CDD8D3"/>
  <path d="M87.805 58.5381H85.366V60.9771H87.805V58.5381Z" fill="#CDD8D3"/>
  <path d="M92.6827 58.5381H90.2437V60.9771H92.6827V58.5381Z" fill="#CDD8D3"/>
  <path d="M95.1216 58.5381H92.6826V60.9771H95.1216V58.5381Z" fill="#CDD8D3"/>
  <path d="M12.1954 60.9731H9.75635V63.4122H12.1954V60.9731Z" fill="#CDD8D3"/>
  <path d="M19.512 60.9731H17.073V63.4122H19.512V60.9731Z" fill="#CDD8D3"/>
  <path d="M31.7076 60.9731H29.2686V63.4122H31.7076V60.9731Z" fill="#CDD8D3"/>
  <path d="M82.9268 60.9731H80.4878V63.4122H82.9268V60.9731Z" fill="#CDD8D3"/>
  <path d="M85.366 60.9731H82.927V63.4122H85.366V60.9731Z" fill="#CDD8D3"/>
  <path d="M90.2442 60.9731H87.8052V63.4122H90.2442V60.9731Z" fill="#CDD8D3"/>
  <path d="M95.1216 60.9731H92.6826V63.4122H95.1216V60.9731Z" fill="#CDD8D3"/>
  <path d="M97.5609 60.9731H95.1218V63.4122H97.5609V60.9731Z" fill="#CDD8D3"/>
  <path d="M99.9998 60.9731H97.5608V63.4122H99.9998V60.9731Z" fill="#CDD8D3"/>
  <path d="M4.87823 63.4146H2.43921V65.8536H4.87823V63.4146Z" fill="#CDD8D3"/>
  <path d="M7.3172 63.4146H4.87817V65.8536H7.3172V63.4146Z" fill="#CDD8D3"/>
  <path d="M9.75641 63.4146H7.31738V65.8536H9.75641V63.4146Z" fill="#CDD8D3"/>
  <path d="M12.1954 63.4146H9.75635V65.8536H12.1954V63.4146Z" fill="#CDD8D3"/>
  <path d="M14.6338 63.4146H12.1948V65.8536H14.6338V63.4146Z" fill="#CDD8D3"/>
  <path d="M17.0731 63.4146H14.634V65.8536H17.0731V63.4146Z" fill="#CDD8D3"/>
  <path d="M24.3902 63.4146H21.9512V65.8536H24.3902V63.4146Z" fill="#CDD8D3"/>
  <path d="M26.8294 63.4146H24.3904V65.8536H26.8294V63.4146Z" fill="#CDD8D3"/>
  <path d="M29.2686 63.4146H26.8296V65.8536H29.2686V63.4146Z" fill="#CDD8D3"/>
  <path d="M31.7076 63.4146H29.2686V65.8536H31.7076V63.4146Z" fill="#CDD8D3"/>
  <path d="M34.1461 63.4146H31.707V65.8536H34.1461V63.4146Z" fill="#CDD8D3"/>
  <path d="M75.6094 63.4146H73.1704V65.8536H75.6094V63.4146Z" fill="#CDD8D3"/>
  <path d="M80.4879 63.4146H78.0488V65.8536H80.4879V63.4146Z" fill="#CDD8D3"/>
  <path d="M82.9268 63.4146H80.4878V65.8536H82.9268V63.4146Z" fill="#CDD8D3"/>
  <path d="M85.366 63.4146H82.927V65.8536H85.366V63.4146Z" fill="#CDD8D3"/>
  <path d="M87.805 63.4146H85.366V65.8536H87.805V63.4146Z" fill="#CDD8D3"/>
  <path d="M90.2442 63.4146H87.8052V65.8536H90.2442V63.4146Z" fill="#CDD8D3"/>
  <path d="M97.5609 63.4146H95.1218V65.8536H97.5609V63.4146Z" fill="#CDD8D3"/>
  <path d="M99.9998 63.4146H97.5608V65.8536H99.9998V63.4146Z" fill="#CDD8D3"/>
  <path d="M4.87823 65.8496H2.43921V68.2886H4.87823V65.8496Z" fill="#CDD8D3"/>
  <path d="M12.1954 65.8496H9.75635V68.2886H12.1954V65.8496Z" fill="#CDD8D3"/>
  <path d="M14.6338 65.8496H12.1948V68.2886H14.6338V65.8496Z" fill="#CDD8D3"/>
  <path d="M19.512 65.8496H17.073V68.2886H19.512V65.8496Z" fill="#CDD8D3"/>
  <path d="M26.8294 65.8496H24.3904V68.2886H26.8294V65.8496Z" fill="#CDD8D3"/>
  <path d="M29.2686 65.8496H26.8296V68.2886H29.2686V65.8496Z" fill="#CDD8D3"/>
  <path d="M31.7076 65.8496H29.2686V68.2886H31.7076V65.8496Z" fill="#CDD8D3"/>
  <path d="M34.1461 65.8496H31.707V68.2886H34.1461V65.8496Z" fill="#CDD8D3"/>
  <path d="M70.732 65.8496H68.293V68.2886H70.732V65.8496Z" fill="#CDD8D3"/>
  <path d="M73.1705 65.8496H70.7314V68.2886H73.1705V65.8496Z" fill="#CDD8D3"/>
  <path d="M75.6094 65.8496H73.1704V68.2886H75.6094V65.8496Z" fill="#CDD8D3"/>
  <path d="M80.4879 65.8496H78.0488V68.2886H80.4879V65.8496Z" fill="#CDD8D3"/>
  <path d="M85.366 65.8496H82.927V68.2886H85.366V65.8496Z" fill="#CDD8D3"/>
  <path d="M92.6827 65.8496H90.2437V68.2886H92.6827V65.8496Z" fill="#CDD8D3"/>
  <path d="M97.5609 65.8496H95.1218V68.2886H97.5609V65.8496Z" fill="#CDD8D3"/>
  <path d="M2.43902 68.291H0V70.73H2.43902V68.291Z" fill="#CDD8D3"/>
  <path d="M4.87823 68.291H2.43921V70.73H4.87823V68.291Z" fill="#CDD8D3"/>
  <path d="M9.75641 68.291H7.31738V70.73H9.75641V68.291Z" fill="#CDD8D3"/>
  <path d="M12.1954 68.291H9.75635V70.73H12.1954V68.291Z" fill="#CDD8D3"/>
  <path d="M14.6338 68.291H12.1948V70.73H14.6338V68.291Z" fill="#CDD8D3"/>
  <path d="M17.0731 68.291H14.634V70.73H17.0731V68.291Z" fill="#CDD8D3"/>
  <path d="M21.9512 68.291H19.5122V70.73H21.9512V68.291Z" fill="#CDD8D3"/>
  <path d="M29.2686 68.291H26.8296V70.73H29.2686V68.291Z" fill="#CDD8D3"/>
  <path d="M31.7076 68.291H29.2686V70.73H31.7076V68.291Z" fill="#CDD8D3"/>
  <path d="M36.585 68.291H34.146V70.73H36.585V68.291Z" fill="#CDD8D3"/>
  <path d="M39.0242 68.291H36.5852V70.73H39.0242V68.291Z" fill="#CDD8D3"/>
  <path d="M41.4634 68.291H39.0244V70.73H41.4634V68.291Z" fill="#CDD8D3"/>
  <path d="M48.7808 68.291H46.3418V70.73H48.7808V68.291Z" fill="#CDD8D3"/>
  <path d="M53.6583 68.291H51.2192V70.73H53.6583V68.291Z" fill="#CDD8D3"/>
  <path d="M56.0972 68.291H53.6582V70.73H56.0972V68.291Z" fill="#CDD8D3"/>
  <path d="M58.5364 68.291H56.0974V70.73H58.5364V68.291Z" fill="#CDD8D3"/>
  <path d="M60.9756 68.291H58.5366V70.73H60.9756V68.291Z" fill="#CDD8D3"/>
  <path d="M63.4146 68.291H60.9756V70.73H63.4146V68.291Z" fill="#CDD8D3"/>
  <path d="M65.8538 68.291H63.4148V70.73H65.8538V68.291Z" fill="#CDD8D3"/>
  <path d="M68.293 68.291H65.854V70.73H68.293V68.291Z" fill="#CDD8D3"/>
  <path d="M73.1705 68.291H70.7314V70.73H73.1705V68.291Z" fill="#CDD8D3"/>
  <path d="M75.6094 68.291H73.1704V70.73H75.6094V68.291Z" fill="#CDD8D3"/>
  <path d="M78.0486 68.291H75.6096V70.73H78.0486V68.291Z" fill="#CDD8D3"/>
  <path d="M80.4879 68.291H78.0488V70.73H80.4879V68.291Z" fill="#CDD8D3"/>
  <path d="M87.805 68.291H85.366V70.73H87.805V68.291Z" fill="#CDD8D3"/>
  <path d="M92.6827 68.291H90.2437V70.73H92.6827V68.291Z" fill="#CDD8D3"/>
  <path d="M2.43902 70.7324H0V73.1714H2.43902V70.7324Z" fill="#CDD8D3"/>
  <path d="M12.1954 70.7324H9.75635V73.1714H12.1954V70.7324Z" fill="#CDD8D3"/>
  <path d="M24.3902 70.7324H21.9512V73.1714H24.3902V70.7324Z" fill="#CDD8D3"/>
  <path d="M29.2686 70.7324H26.8296V73.1714H29.2686V70.7324Z" fill="#CDD8D3"/>
  <path d="M31.7076 70.7324H29.2686V73.1714H31.7076V70.7324Z" fill="#CDD8D3"/>
  <path d="M36.585 70.7324H34.146V73.1714H36.585V70.7324Z" fill="#CDD8D3"/>
  <path d="M43.9024 70.7324H41.4634V73.1714H43.9024V70.7324Z" fill="#CDD8D3"/>
  <path d="M48.7808 70.7324H46.3418V73.1714H48.7808V70.7324Z" fill="#CDD8D3"/>
  <path d="M51.2198 70.7324H48.7808V73.1714H51.2198V70.7324Z" fill="#CDD8D3"/>
  <path d="M53.6583 70.7324H51.2192V73.1714H53.6583V70.7324Z" fill="#CDD8D3"/>
  <path d="M60.9756 70.7324H58.5366V73.1714H60.9756V70.7324Z" fill="#CDD8D3"/>
  <path d="M65.8538 70.7324H63.4148V73.1714H65.8538V70.7324Z" fill="#CDD8D3"/>
  <path d="M70.732 70.7324H68.293V73.1714H70.732V70.7324Z" fill="#CDD8D3"/>
  <path d="M78.0486 70.7324H75.6096V73.1714H78.0486V70.7324Z" fill="#CDD8D3"/>
  <path d="M80.4879 70.7324H78.0488V73.1714H80.4879V70.7324Z" fill="#CDD8D3"/>
  <path d="M82.9268 70.7324H80.4878V73.1714H82.9268V70.7324Z" fill="#CDD8D3"/>
  <path d="M85.366 70.7324H82.927V73.1714H85.366V70.7324Z" fill="#CDD8D3"/>
  <path d="M90.2442 70.7324H87.8052V73.1714H90.2442V70.7324Z" fill="#CDD8D3"/>
  <path d="M92.6827 70.7324H90.2437V73.1714H92.6827V70.7324Z" fill="#CDD8D3"/>
  <path d="M97.5609 70.7324H95.1218V73.1714H97.5609V70.7324Z" fill="#CDD8D3"/>
  <path d="M99.9998 70.7324H97.5608V73.1714H99.9998V70.7324Z" fill="#CDD8D3"/>
  <path d="M12.1954 73.168H9.75635V75.607H12.1954V73.168Z" fill="#CDD8D3"/>
  <path d="M17.0731 73.168H14.634V75.607H17.0731V73.168Z" fill="#CDD8D3"/>
  <path d="M19.512 73.168H17.073V75.607H19.512V73.168Z" fill="#CDD8D3"/>
  <path d="M21.9512 73.168H19.5122V75.607H21.9512V73.168Z" fill="#CDD8D3"/>
  <path d="M24.3902 73.168H21.9512V75.607H24.3902V73.168Z" fill="#CDD8D3"/>
  <path d="M29.2686 73.168H26.8296V75.607H29.2686V73.168Z" fill="#CDD8D3"/>
  <path d="M31.7076 73.168H29.2686V75.607H31.7076V73.168Z" fill="#CDD8D3"/>
  <path d="M34.1461 73.168H31.707V75.607H34.1461V73.168Z" fill="#CDD8D3"/>
  <path d="M36.585 73.168H34.146V75.607H36.585V73.168Z" fill="#CDD8D3"/>
  <path d="M39.0242 73.168H36.5852V75.607H39.0242V73.168Z" fill="#CDD8D3"/>
  <path d="M41.4634 73.168H39.0244V75.607H41.4634V73.168Z" fill="#CDD8D3"/>
  <path d="M46.3416 73.168H43.9026V75.607H46.3416V73.168Z" fill="#CDD8D3"/>
  <path d="M51.2198 73.168H48.7808V75.607H51.2198V73.168Z" fill="#CDD8D3"/>
  <path d="M53.6583 73.168H51.2192V75.607H53.6583V73.168Z" fill="#CDD8D3"/>
  <path d="M56.0972 73.168H53.6582V75.607H56.0972V73.168Z" fill="#CDD8D3"/>
  <path d="M58.5364 73.168H56.0974V75.607H58.5364V73.168Z" fill="#CDD8D3"/>
  <path d="M63.4146 73.168H60.9756V75.607H63.4146V73.168Z" fill="#CDD8D3"/>
  <path d="M70.732 73.168H68.293V75.607H70.732V73.168Z" fill="#CDD8D3"/>
  <path d="M75.6094 73.168H73.1704V75.607H75.6094V73.168Z" fill="#CDD8D3"/>
  <path d="M85.366 73.168H82.927V75.607H85.366V73.168Z" fill="#CDD8D3"/>
  <path d="M87.805 73.168H85.366V75.607H87.805V73.168Z" fill="#CDD8D3"/>
  <path d="M90.2442 73.168H87.8052V75.607H90.2442V73.168Z" fill="#CDD8D3"/>
  <path d="M97.5609 73.168H95.1218V75.607H97.5609V73.168Z" fill="#CDD8D3"/>
  <path d="M99.9998 73.168H97.5608V75.607H99.9998V73.168Z" fill="#CDD8D3"/>
  <path d="M9.75641 75.6094H7.31738V78.0484H9.75641V75.6094Z" fill="#CDD8D3"/>
  <path d="M24.3902 75.6094H21.9512V78.0484H24.3902V75.6094Z" fill="#CDD8D3"/>
  <path d="M31.7076 75.6094H29.2686V78.0484H31.7076V75.6094Z" fill="#CDD8D3"/>
  <path d="M41.4634 75.6094H39.0244V78.0484H41.4634V75.6094Z" fill="#CDD8D3"/>
  <path d="M48.7808 75.6094H46.3418V78.0484H48.7808V75.6094Z" fill="#CDD8D3"/>
  <path d="M51.2198 75.6094H48.7808V78.0484H51.2198V75.6094Z" fill="#CDD8D3"/>
  <path d="M56.0972 75.6094H53.6582V78.0484H56.0972V75.6094Z" fill="#CDD8D3"/>
  <path d="M58.5364 75.6094H56.0974V78.0484H58.5364V75.6094Z" fill="#CDD8D3"/>
  <path d="M63.4146 75.6094H60.9756V78.0484H63.4146V75.6094Z" fill="#CDD8D3"/>
  <path d="M73.1705 75.6094H70.7314V78.0484H73.1705V75.6094Z" fill="#CDD8D3"/>
  <path d="M78.0486 75.6094H75.6096V78.0484H78.0486V75.6094Z" fill="#CDD8D3"/>
  <path d="M85.366 75.6094H82.927V78.0484H85.366V75.6094Z" fill="#CDD8D3"/>
  <path d="M87.805 75.6094H85.366V78.0484H87.805V75.6094Z" fill="#CDD8D3"/>
  <path d="M92.6827 75.6094H90.2437V78.0484H92.6827V75.6094Z" fill="#CDD8D3"/>
  <path d="M97.5609 75.6094H95.1218V78.0484H97.5609V75.6094Z" fill="#CDD8D3"/>
  <path d="M99.9998 75.6094H97.5608V78.0484H99.9998V75.6094Z" fill="#CDD8D3"/>
  <path d="M2.43902 78.0508H0V80.4898H2.43902V78.0508Z" fill="#CDD8D3"/>
  <path d="M4.87823 78.0508H2.43921V80.4898H4.87823V78.0508Z" fill="#CDD8D3"/>
  <path d="M7.3172 78.0508H4.87817V80.4898H7.3172V78.0508Z" fill="#CDD8D3"/>
  <path d="M9.75641 78.0508H7.31738V80.4898H9.75641V78.0508Z" fill="#CDD8D3"/>
  <path d="M12.1954 78.0508H9.75635V80.4898H12.1954V78.0508Z" fill="#CDD8D3"/>
  <path d="M14.6338 78.0508H12.1948V80.4898H14.6338V78.0508Z" fill="#CDD8D3"/>
  <path d="M17.0731 78.0508H14.634V80.4898H17.0731V78.0508Z" fill="#CDD8D3"/>
  <path d="M19.512 78.0508H17.073V80.4898H19.512V78.0508Z" fill="#CDD8D3"/>
  <path d="M21.9512 78.0508H19.5122V80.4898H21.9512V78.0508Z" fill="#CDD8D3"/>
  <path d="M24.3902 78.0508H21.9512V80.4898H24.3902V78.0508Z" fill="#CDD8D3"/>
  <path d="M34.1461 78.0508H31.707V80.4898H34.1461V78.0508Z" fill="#CDD8D3"/>
  <path d="M46.3416 78.0508H43.9026V80.4898H46.3416V78.0508Z" fill="#CDD8D3"/>
  <path d="M53.6583 78.0508H51.2192V80.4898H53.6583V78.0508Z" fill="#CDD8D3"/>
  <path d="M63.4146 78.0508H60.9756V80.4898H63.4146V78.0508Z" fill="#CDD8D3"/>
  <path d="M65.8538 78.0508H63.4148V80.4898H65.8538V78.0508Z" fill="#CDD8D3"/>
  <path d="M68.293 78.0508H65.854V80.4898H68.293V78.0508Z" fill="#CDD8D3"/>
  <path d="M78.0486 78.0508H75.6096V80.4898H78.0486V78.0508Z" fill="#CDD8D3"/>
  <path d="M80.4879 78.0508H78.0488V80.4898H80.4879V78.0508Z" fill="#CDD8D3"/>
  <path d="M82.9268 78.0508H80.4878V80.4898H82.9268V78.0508Z" fill="#CDD8D3"/>
  <path d="M85.366 78.0508H82.927V80.4898H85.366V78.0508Z" fill="#CDD8D3"/>
  <path d="M87.805 78.0508H85.366V80.4898H87.805V78.0508Z" fill="#CDD8D3"/>
  <path d="M90.2442 78.0508H87.8052V80.4898H90.2442V78.0508Z" fill="#CDD8D3"/>
  <path d="M92.6827 78.0508H90.2437V80.4898H92.6827V78.0508Z" fill="#CDD8D3"/>
  <path d="M95.1216 78.0508H92.6826V80.4898H95.1216V78.0508Z" fill="#CDD8D3"/>
  <path d="M97.5609 78.0508H95.1218V80.4898H97.5609V78.0508Z" fill="#CDD8D3"/>
  <path d="M21.9512 80.4863H19.5122V82.9254H21.9512V80.4863Z" fill="#CDD8D3"/>
  <path d="M36.585 80.4863H34.146V82.9254H36.585V80.4863Z" fill="#CDD8D3"/>
  <path d="M53.6583 80.4863H51.2192V82.9254H53.6583V80.4863Z" fill="#CDD8D3"/>
  <path d="M56.0972 80.4863H53.6582V82.9254H56.0972V80.4863Z" fill="#CDD8D3"/>
  <path d="M65.8538 80.4863H63.4148V82.9254H65.8538V80.4863Z" fill="#CDD8D3"/>
  <path d="M68.293 80.4863H65.854V82.9254H68.293V80.4863Z" fill="#CDD8D3"/>
  <path d="M70.732 80.4863H68.293V82.9254H70.732V80.4863Z" fill="#CDD8D3"/>
  <path d="M75.6094 80.4863H73.1704V82.9254H75.6094V80.4863Z" fill="#CDD8D3"/>
  <path d="M80.4879 80.4863H78.0488V82.9254H80.4879V80.4863Z" fill="#CDD8D3"/>
  <path d="M90.2442 80.4863H87.8052V82.9254H90.2442V80.4863Z" fill="#CDD8D3"/>
  <path d="M92.6827 80.4863H90.2437V82.9254H92.6827V80.4863Z" fill="#CDD8D3"/>
  <path d="M97.5609 80.4863H95.1218V82.9254H97.5609V80.4863Z" fill="#CDD8D3"/>
  <path d="M99.9998 80.4863H97.5608V82.9254H99.9998V80.4863Z" fill="#CDD8D3"/>
  <path d="M21.9512 82.9277H19.5122V85.3668H21.9512V82.9277Z" fill="#CDD8D3"/>
  <path d="M24.3902 82.9277H21.9512V85.3668H24.3902V82.9277Z" fill="#CDD8D3"/>
  <path d="M29.2686 82.9277H26.8296V85.3668H29.2686V82.9277Z" fill="#CDD8D3"/>
  <path d="M31.7076 82.9277H29.2686V85.3668H31.7076V82.9277Z" fill="#CDD8D3"/>
  <path d="M39.0242 82.9277H36.5852V85.3668H39.0242V82.9277Z" fill="#CDD8D3"/>
  <path d="M41.4634 82.9277H39.0244V85.3668H41.4634V82.9277Z" fill="#CDD8D3"/>
  <path d="M43.9024 82.9277H41.4634V85.3668H43.9024V82.9277Z" fill="#CDD8D3"/>
  <path d="M46.3416 82.9277H43.9026V85.3668H46.3416V82.9277Z" fill="#CDD8D3"/>
  <path d="M51.2198 82.9277H48.7808V85.3668H51.2198V82.9277Z" fill="#CDD8D3"/>
  <path d="M56.0972 82.9277H53.6582V85.3668H56.0972V82.9277Z" fill="#CDD8D3"/>
  <path d="M68.293 82.9277H65.854V85.3668H68.293V82.9277Z" fill="#CDD8D3"/>
  <path d="M73.1705 82.9277H70.7314V85.3668H73.1705V82.9277Z" fill="#CDD8D3"/>
  <path d="M78.0486 82.9277H75.6096V85.3668H78.0486V82.9277Z" fill="#CDD8D3"/>
  <path d="M80.4879 82.9277H78.0488V85.3668H80.4879V82.9277Z" fill="#CDD8D3"/>
  <path d="M85.366 82.9277H82.927V85.3668H85.366V82.9277Z" fill="#CDD8D3"/>
  <path d="M90.2442 82.9277H87.8052V85.3668H90.2442V82.9277Z" fill="#CDD8D3"/>
  <path d="M97.5609 82.9277H95.1218V85.3668H97.5609V82.9277Z" fill="#CDD8D3"/>
  <path d="M99.9998 82.9277H97.5608V85.3668H99.9998V82.9277Z" fill="#CDD8D3"/>
  <path d="M21.9512 85.3628H19.5122V87.8018H21.9512V85.3628Z" fill="#CDD8D3"/>
  <path d="M26.8294 85.3628H24.3904V87.8018H26.8294V85.3628Z" fill="#CDD8D3"/>
  <path d="M41.4634 85.3628H39.0244V87.8018H41.4634V85.3628Z" fill="#CDD8D3"/>
  <path d="M43.9024 85.3628H41.4634V87.8018H43.9024V85.3628Z" fill="#CDD8D3"/>
  <path d="M51.2198 85.3628H48.7808V87.8018H51.2198V85.3628Z" fill="#CDD8D3"/>
  <path d="M53.6583 85.3628H51.2192V87.8018H53.6583V85.3628Z" fill="#CDD8D3"/>
  <path d="M56.0972 85.3628H53.6582V87.8018H56.0972V85.3628Z" fill="#CDD8D3"/>
  <path d="M58.5364 85.3628H56.0974V87.8018H58.5364V85.3628Z" fill="#CDD8D3"/>
  <path d="M65.8538 85.3628H63.4148V87.8018H65.8538V85.3628Z" fill="#CDD8D3"/>
  <path d="M70.732 85.3628H68.293V87.8018H70.732V85.3628Z" fill="#CDD8D3"/>
  <path d="M73.1705 85.3628H70.7314V87.8018H73.1705V85.3628Z" fill="#CDD8D3"/>
  <path d="M75.6094 85.3628H73.1704V87.8018H75.6094V85.3628Z" fill="#CDD8D3"/>
  <path d="M80.4879 85.3628H78.0488V87.8018H80.4879V85.3628Z" fill="#CDD8D3"/>
  <path d="M90.2442 85.3628H87.8052V87.8018H90.2442V85.3628Z" fill="#CDD8D3"/>
  <path d="M21.9512 87.8042H19.5122V90.2432H21.9512V87.8042Z" fill="#CDD8D3"/>
  <path d="M26.8294 87.8042H24.3904V90.2432H26.8294V87.8042Z" fill="#CDD8D3"/>
  <path d="M31.7076 87.8042H29.2686V90.2432H31.7076V87.8042Z" fill="#CDD8D3"/>
  <path d="M39.0242 87.8042H36.5852V90.2432H39.0242V87.8042Z" fill="#CDD8D3"/>
  <path d="M46.3416 87.8042H43.9026V90.2432H46.3416V87.8042Z" fill="#CDD8D3"/>
  <path d="M51.2198 87.8042H48.7808V90.2432H51.2198V87.8042Z" fill="#CDD8D3"/>
  <path d="M53.6583 87.8042H51.2192V90.2432H53.6583V87.8042Z" fill="#CDD8D3"/>
  <path d="M56.0972 87.8042H53.6582V90.2432H56.0972V87.8042Z" fill="#CDD8D3"/>
  <path d="M70.732 87.8042H68.293V90.2432H70.732V87.8042Z" fill="#CDD8D3"/>
  <path d="M75.6094 87.8042H73.1704V90.2432H75.6094V87.8042Z" fill="#CDD8D3"/>
  <path d="M78.0486 87.8042H75.6096V90.2432H78.0486V87.8042Z" fill="#CDD8D3"/>
  <path d="M80.4879 87.8042H78.0488V90.2432H80.4879V87.8042Z" fill="#CDD8D3"/>
  <path d="M82.9268 87.8042H80.4878V90.2432H82.9268V87.8042Z" fill="#CDD8D3"/>
  <path d="M85.366 87.8042H82.927V90.2432H85.366V87.8042Z" fill="#CDD8D3"/>
  <path d="M87.805 87.8042H85.366V90.2432H87.805V87.8042Z" fill="#CDD8D3"/>
  <path d="M90.2442 87.8042H87.8052V90.2432H90.2442V87.8042Z" fill="#CDD8D3"/>
  <path d="M26.8294 90.2456H24.3904V92.6846H26.8294V90.2456Z" fill="#CDD8D3"/>
  <path d="M29.2686 90.2456H26.8296V92.6846H29.2686V90.2456Z" fill="#CDD8D3"/>
  <path d="M34.1461 90.2456H31.707V92.6846H34.1461V90.2456Z" fill="#CDD8D3"/>
  <path d="M39.0242 90.2456H36.5852V92.6846H39.0242V90.2456Z" fill="#CDD8D3"/>
  <path d="M41.4634 90.2456H39.0244V92.6846H41.4634V90.2456Z" fill="#CDD8D3"/>
  <path d="M43.9024 90.2456H41.4634V92.6846H43.9024V90.2456Z" fill="#CDD8D3"/>
  <path d="M51.2198 90.2456H48.7808V92.6846H51.2198V90.2456Z" fill="#CDD8D3"/>
  <path d="M53.6583 90.2456H51.2192V92.6846H53.6583V90.2456Z" fill="#CDD8D3"/>
  <path d="M56.0972 90.2456H53.6582V92.6846H56.0972V90.2456Z" fill="#CDD8D3"/>
  <path d="M60.9756 90.2456H58.5366V92.6846H60.9756V90.2456Z" fill="#CDD8D3"/>
  <path d="M65.8538 90.2456H63.4148V92.6846H65.8538V90.2456Z" fill="#CDD8D3"/>
  <path d="M68.293 90.2456H65.854V92.6846H68.293V90.2456Z" fill="#CDD8D3"/>
  <path d="M73.1705 90.2456H70.7314V92.6846H73.1705V90.2456Z" fill="#CDD8D3"/>
  <path d="M80.4879 90.2456H78.0488V92.6846H80.4879V90.2456Z" fill="#CDD8D3"/>
  <path d="M82.9268 90.2456H80.4878V92.6846H82.9268V90.2456Z" fill="#CDD8D3"/>
  <path d="M92.6827 90.2456H90.2437V92.6846H92.6827V90.2456Z" fill="#CDD8D3"/>
  <path d="M95.1216 90.2456H92.6826V92.6846H95.1216V90.2456Z" fill="#CDD8D3"/>
  <path d="M97.5609 90.2456H95.1218V92.6846H97.5609V90.2456Z" fill="#CDD8D3"/>
  <path d="M99.9998 90.2456H97.5608V92.6846H99.9998V90.2456Z" fill="#CDD8D3"/>
  <path d="M24.3902 92.6807H21.9512V95.1197H24.3902V92.6807Z" fill="#CDD8D3"/>
  <path d="M29.2686 92.6807H26.8296V95.1197H29.2686V92.6807Z" fill="#CDD8D3"/>
  <path d="M31.7076 92.6807H29.2686V95.1197H31.7076V92.6807Z" fill="#CDD8D3"/>
  <path d="M34.1461 92.6807H31.707V95.1197H34.1461V92.6807Z" fill="#CDD8D3"/>
  <path d="M43.9024 92.6807H41.4634V95.1197H43.9024V92.6807Z" fill="#CDD8D3"/>
  <path d="M46.3416 92.6807H43.9026V95.1197H46.3416V92.6807Z" fill="#CDD8D3"/>
  <path d="M48.7808 92.6807H46.3418V95.1197H48.7808V92.6807Z" fill="#CDD8D3"/>
  <path d="M63.4146 92.6807H60.9756V95.1197H63.4146V92.6807Z" fill="#CDD8D3"/>
  <path d="M68.293 92.6807H65.854V95.1197H68.293V92.6807Z" fill="#CDD8D3"/>
  <path d="M70.732 92.6807H68.293V95.1197H70.732V92.6807Z" fill="#CDD8D3"/>
  <path d="M73.1705 92.6807H70.7314V95.1197H73.1705V92.6807Z" fill="#CDD8D3"/>
  <path d="M80.4879 92.6807H78.0488V95.1197H80.4879V92.6807Z" fill="#CDD8D3"/>
  <path d="M92.6827 92.6807H90.2437V95.1197H92.6827V92.6807Z" fill="#CDD8D3"/>
  <path d="M97.5609 92.6807H95.1218V95.1197H97.5609V92.6807Z" fill="#CDD8D3"/>
  <path d="M99.9998 92.6807H97.5608V95.1197H99.9998V92.6807Z" fill="#CDD8D3"/>
  <path d="M24.3902 95.1221H21.9512V97.5611H24.3902V95.1221Z" fill="#CDD8D3"/>
  <path d="M26.8294 95.1221H24.3904V97.5611H26.8294V95.1221Z" fill="#CDD8D3"/>
  <path d="M31.439 95H29V97.439H31.439V95Z" fill="#CDD8D3"/>
  <path d="M34.1461 95.1221H31.707V97.5611H34.1461V95.1221Z" fill="#CDD8D3"/>
  <path d="M36.585 95.1221H34.146V97.5611H36.585V95.1221Z" fill="#CDD8D3"/>
  <path d="M39.0242 95.1221H36.5852V97.5611H39.0242V95.1221Z" fill="#CDD8D3"/>
  <path d="M41.4634 95.1221H39.0244V97.5611H41.4634V95.1221Z" fill="#CDD8D3"/>
  <path d="M43.9024 95.1221H41.4634V97.5611H43.9024V95.1221Z" fill="#CDD8D3"/>
  <path d="M46.3416 95.1221H43.9026V97.5611H46.3416V95.1221Z" fill="#CDD8D3"/>
  <path d="M51.2198 95.1221H48.7808V97.5611H51.2198V95.1221Z" fill="#CDD8D3"/>
  <path d="M53.6583 95.1221H51.2192V97.5611H53.6583V95.1221Z" fill="#CDD8D3"/>
  <path d="M56.0972 95.1221H53.6582V97.5611H56.0972V95.1221Z" fill="#CDD8D3"/>
  <path d="M60.9756 95.1221H58.5366V97.5611H60.9756V95.1221Z" fill="#CDD8D3"/>
  <path d="M63.4146 95.1221H60.9756V97.5611H63.4146V95.1221Z" fill="#CDD8D3"/>
  <path d="M65.8538 95.1221H63.4148V97.5611H65.8538V95.1221Z" fill="#CDD8D3"/>
  <path d="M68.293 95.1221H65.854V97.5611H68.293V95.1221Z" fill="#CDD8D3"/>
  <path d="M73.1705 95.1221H70.7314V97.5611H73.1705V95.1221Z" fill="#CDD8D3"/>
  <path d="M78.0486 95.1221H75.6096V97.5611H78.0486V95.1221Z" fill="#CDD8D3"/>
  <path d="M80.4879 95.1221H78.0488V97.5611H80.4879V95.1221Z" fill="#CDD8D3"/>
  <path d="M85.366 95.1221H82.927V97.5611H85.366V95.1221Z" fill="#CDD8D3"/>
  <path d="M87.805 95.1221H85.366V97.5611H87.805V95.1221Z" fill="#CDD8D3"/>
  <path d="M97.5609 95.1221H95.1218V97.5611H97.5609V95.1221Z" fill="#CDD8D3"/>
  <path d="M99.9998 95.1221H97.5608V97.5611H99.9998V95.1221Z" fill="#CDD8D3"/>
  <path d="M4.87805 91.4643C4.87805 89.4438 6.51603 87.8058 8.53659 87.8058C10.5571 87.8058 12.1951 89.4438 12.1951 91.4643C12.1951 93.4849 10.5571 95.1229 8.53659 95.1229C6.51603 95.1229 4.87805 93.4849 4.87805 91.4643Z" fill="#CDD8D3"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.53659 82.9277C3.82196 82.9277 0 86.7497 0 91.4643C0 96.1789 3.82196 100.001 8.53659 100.001C13.2512 100.001 17.0732 96.1789 17.0732 91.4643C17.0732 86.7497 13.2512 82.9277 8.53659 82.9277ZM14.6341 91.4643C14.6341 94.8319 11.9042 97.5619 8.53659 97.5619C5.16899 97.5619 2.43902 94.8319 2.43902 91.4643C2.43902 88.0967 5.16899 85.3668 8.53659 85.3668C11.9042 85.3668 14.6341 88.0967 14.6341 91.4643Z" fill="#CDD8D3"/>
  <path d="M24.3902 97.5576H21.9512V99.9966H24.3902V97.5576Z" fill="#CDD8D3"/>
  <path d="M29.2686 97.5576H26.8296V99.9966H29.2686V97.5576Z" fill="#CDD8D3"/>
  <path d="M34.1461 97.5576H31.707V99.9966H34.1461V97.5576Z" fill="#CDD8D3"/>
  <path d="M41.4634 97.5576H39.0244V99.9966H41.4634V97.5576Z" fill="#CDD8D3"/>
  <path d="M43.9024 97.5576H41.4634V99.9966H43.9024V97.5576Z" fill="#CDD8D3"/>
  <path d="M46.3416 97.5576H43.9026V99.9966H46.3416V97.5576Z" fill="#CDD8D3"/>
  <path d="M53.6583 97.5576H51.2192V99.9966H53.6583V97.5576Z" fill="#CDD8D3"/>
  <path d="M56.0972 97.5576H53.6582V99.9966H56.0972V97.5576Z" fill="#CDD8D3"/>
  <path d="M58.5364 97.5576H56.0974V99.9966H58.5364V97.5576Z" fill="#CDD8D3"/>
  <path d="M70.732 97.5576H68.293V99.9966H70.732V97.5576Z" fill="#CDD8D3"/>
  <path d="M73.1705 97.5576H70.7314V99.9966H73.1705V97.5576Z" fill="#CDD8D3"/>
  <path d="M75.6094 97.5576H73.1704V99.9966H75.6094V97.5576Z" fill="#CDD8D3"/>
  <path d="M78.0486 97.5576H75.6096V99.9966H78.0486V97.5576Z" fill="#CDD8D3"/>
  <path d="M80.4879 97.5576H78.0488V99.9966H80.4879V97.5576Z" fill="#CDD8D3"/>
  <path d="M82.9268 97.5576H80.4878V99.9966H82.9268V97.5576Z" fill="#CDD8D3"/>
  <path d="M85.366 97.5576H82.927V99.9966H85.366V97.5576Z" fill="#CDD8D3"/>
  <path d="M97.5609 97.5576H95.1218V99.9966H97.5609V97.5576Z" fill="#CDD8D3"/>
  <path d="M50.9688 56.629L43.75 52.3794L50.9688 62.497L58.1878 52.3794L50.9688 56.629Z" fill="#CDD8D3"/>
  <path d="M50.9689 39.0615L58.1876 51.0122L50.9689 55.2735L43.75 51.0127L50.9689 39.0615Z" fill="#CDD8D3"/>
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


