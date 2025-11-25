"use client";
import React, { useEffect, useState } from "react";
import { setCookie, hasCookie } from "cookies-next";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { track } from "@vercel/analytics/react";
import EthereumSVG from "@/public/donate/ethereum.svg";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function CookieConsent() {
  const searchParams = useSearchParams();
  const isOgMode = searchParams?.get("is_og") === "true";
  const [consent, setConsent] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (isOgMode) {
      setConsent(true);
      return;
    }

    setConsent(hasCookie("gtpCookieConsent"));
  }, [isOgMode]);

  const acceptCookie = () => {
    setConsent(true);
    setCookie("gtpCookieConsent", "true", {
      maxAge: 60 * 60 * 24 * 365,
    });

    gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
    });

    console.log("accepting cookies");
  };

  const closeP = () => {
    setConsent(true);
    console.log("closing");
  };

  const denyCookie = () => {
    setConsent(true);
    setCookie("gtpCookieConsent", "false", {
      maxAge: 60 * 60 * 24 * 365,
    });
    console.log("denying cookies");
  };

  if (consent === true) {
    return null;
  }

  function triggerCopy() {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500); // 3000 milliseconds (3 seconds)
  }

  return (
    <div
      className={`flex md:flex-col flex-col-reverse items-center justify-between lg:space-y-0 lg:space-x-8 bg-color-bg-default bg-opacity-[0.95] text-base text-forest-900 dark:text-forest-50  border-[0.5px] border-[#5A6462] bottom-0 mb-[30px] md:mb-[10px] p-[15px] fixed z-loading-screen w-[90%] sm:w-9/12 max-w-[884px] mx-auto rounded-3xl lg:rounded-[34px] left-[50%] transform -translate-x-1/2 shadow-2xl shadow-black/70 ${
        consent ? "hidden" : ""
      }`}
    >
      <div className=" flex-col flex md:flex-row md:gap-x-[5px] items-center justify-between w-full ">
        <div className="flex items-center justify-center space-x-[18px] md:space-x-[15px] lg:pt-0 pt-[15px]">
          <div>
            <Icon
              icon="gtp:shield"
              className="w-8 h-8 md:w-[36px] md:h-[36px] lg:w-[36px] lg:h-[36px]"
            />
          </div>
          <div className="flex items-center space-x-8 text-xs md:text-xs">
            <div>
              Our website uses cookies to analyze how the site is used and to ensure your experience is consistent between visits. Find our{" "}
              <Link href="/privacy-policy" className="underline relative md:text-xs text-nowrap">
                privacy policy
              </Link> here.
            </div>
          </div>

        </div>

        <div className="flex align-middle justify-between lg:pt-0 pt-[15px]">
          <div className="flex items-center justify-center w-full space-x-[15px]">
            <button
              onClick={() => {
                acceptCookie();
              }}
              className="bg-color-ui-active hover:bg-color-ui-hover dark:text-forest-50 text-sm md:text-base px-[15px] py-[8px] rounded-full text-center whitespace-nowrap w-full lg:w-auto "
            >
              Allow
            </button>
            <button
              onClick={(e) => denyCookie()}
              className="hover:bg-color-ui-hover dark:text-forest-50 text-sm md:text-base px-[15px] py-[8px] rounded-full text-center whitespace-nowrap w-full lg:w-auto "
            >
              Decline
            </button>
          </div>
        </div>
      </div>
      {/* <div className="flex md:flex-row flex-col md:gap-x-[5px] lg:gap-x-[30px] lg:gap-y-[0px] gap-y-[10px] items-center justify-between w-full text-xs md:text-xxs md:pt-[15px] pr-[30px] pl-[10px]">
        <div className="flex-col gap-y-[10px] lg:max-w-[250px]">
          <div className="heading-large-xs pb-[10px]">Do you enjoy using growthepie?</div>
          <p className=" text-xxs md:text-xs ">Help us stay free for everyone, keeping data open and accessible! Also check out our impact&nbsp;   
          <Link href="/donate" className="underline">
            
            here
          </Link>.</p>
        </div>
        <div className="w-full group/qr flex border-[#CDD8D3] border-[2px] items-center gap-x-[15px] rounded-[20px] p-[5px] sm:p-[10px] max-w-[500px]"
          onClick={(e) => {
            window.open("https://etherscan.io/address/0x9438b8B447179740cD97869997a2FCc9b4AA63a2", "_blank");
            track("clicked Donate QR Code", {
              location: "Ethereum",
              page: window.location.pathname,
            });
            e.stopPropagation();
          }}
        >
            <div className="min-w-[65px] sm:min-w-[100px] aspect-square relative ">
              <Image src={EthereumSVG} alt="Ethereum" fill className="object-contain" />
            </div>
            <div className="flex flex-col  sm:pt-[1px] sm:pb-[4px] sm:min-h-[98px] sm:justify-between cursor-pointer ">
              <div>
                <div className="heading-small-xxxs sm:heading-small-xxs lg:heading-small-xs group-hover/qr:underline">Donate to our wallet on any Ethereum compatible wallet.</div>
                <div className=" text-xxs md:text-xs sm:mt-[10px] pb-[2px]">Scan it with your wallet app!</div>
              </div>
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
        </div>
        
      </div> */}
      {/* <button
          className="self-start"
          onClick={(e) => {
            closeP();
          }}
        >
          <Icon icon="feather:x" className="w-8 h-8" />
        </button> */}
    </div>
  );
}

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