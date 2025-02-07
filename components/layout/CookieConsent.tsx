"use client";
import React, { useEffect, useState } from "react";
import { setCookie, hasCookie } from "cookies-next";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { track } from "@vercel/analytics/react";

export default function CookieConsent() {
  const [consent, setConsent] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setConsent(hasCookie("growthepieCookieConsent"));
  }, []);

  const acceptCookie = () => {
    setConsent(true);
    setCookie("growthepieCookieConsent", "true", {
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
    setCookie("growthepieCookieConsent", "false", {
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
      className={`flex md:flex-col flex-col-reverse items-center justify-between lg:space-y-0 lg:space-x-8 bg-[#1F2726] bg-opacity-[0.95] text-base text-forest-900 dark:text-forest-50  border-[0.5px] border-[#5A6462] bottom-0 mb-10 p-[15px] fixed z-50 w-[90%] sm:w-9/12 max-w-[884px] mx-auto rounded-3xl lg:rounded-[34px] left-[50%] transform -translate-x-1/2 shadow-2xl shadow-black/70 ${
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
          <div className="flex items-center space-x-8 text-xxs md:text-xxs">
            <div>
              Our website uses cookies to analyze how the site is used and to ensure your experience is consistent between visits. Find our{" "}
              <Link href="/privacy-policy" className="underline relative md:text-xxs">
                Privacy Policy here.
              </Link>
            </div>
          </div>

        </div>

        <div className="flex align-middle justify-between lg:pt-0 pt-[15px]">
          <div className="flex items-center justify-center w-full space-x-[15px]">
            <button
              onClick={() => {
                acceptCookie();
              }}
              className="bg-[#151A19] hover:bg-[#5A6462] dark:text-forest-50 text-sm md:text-base px-[15px] py-[8px] rounded-full text-center whitespace-nowrap w-full lg:w-auto "
            >
              Allow
            </button>
            <button
              onClick={(e) => denyCookie()}
              className="hover:bg-[#5A6462] dark:text-forest-50 text-sm md:text-base px-[15px] py-[8px] rounded-full text-center whitespace-nowrap w-full lg:w-auto "
            >
              Decline
            </button>
          </div>
        </div>
      </div>
      <div className="flex md:flex-row flex-col md:gap-x-[5px] lg:gap-x-[30px] lg:gap-y-[0px] gap-y-[10px] items-center justify-between w-full text-xs md:text-xxs md:pt-[15px] pr-[30px] pl-[10px]">
        <div className="flex-col gap-y-[10px] lg:max-w-[250px]">
          <div className="heading-large-xs pb-[10px]">Do you enjoy using growthepie?</div>
          <p className=" text-xxs md:text-xs ">Help us stay free for everyone, keeping data open and accessible! Also check out our impact&nbsp;   
          <Link href="/donate" className="underline">
            
            here
          </Link>.</p>
        </div>
        <div className="w-full group/qr flex border-[#CDD8D3] border-[2px] items-center gap-x-[15px]  rounded-[20px] py-[3px] sm:py-[5px] px-[5px] max-w-[500px]"
          onClick={(e) => {
            window.open("https://etherscan.io/address/0x9438b8B447179740cD97869997a2FCc9b4AA63a2", "_blank");
            track("clicked Donate QR Code", {
              location: "Ethereum",
              page: window.location.pathname,
            });
            e.stopPropagation();
          }}
        >
            <div className=" min-w-[55px] min-h-[60px] sm:min-w-[100px] sm:min-h-[100px] pl-[4px] top-[4px] relative ">
              <EthSVG />
              
              
             
            </div>
            <div className="flex flex-col  sm:pt-[2px] sm:pb-[2px] sm:min-h-[100px] sm:justify-between cursor-pointer ">
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
        
      </div>
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


const EthSVG = () => (
  <svg width="100" height="100" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
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

)

const EthereumSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 70 70">
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
        fill="#5A6462"
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
