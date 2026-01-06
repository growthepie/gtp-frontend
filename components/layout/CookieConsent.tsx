"use client";
import React, { useEffect, useState } from "react";
import { setCookie, getCookie } from "cookies-next";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ANALYTICS_CONFIG, getConsentUpdate } from '@/lib/analyticsConfig';

export default function CookieConsent() {
  const searchParams = useSearchParams();
  const isOgMode = searchParams?.get("is_og") === "true";
  const [consent, setConsent] = useState(true);

  useEffect(() => {
    if (isOgMode) {
      setConsent(true);
      return;
    }

    const cookieValue = getCookie("gtpCookieConsent");

    if (cookieValue !== undefined) {
      setConsent(true); // Hide banner

      // Sync consent state with GTM for returning users
      const hasGranted = cookieValue === "true";
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag("consent", "update", getConsentUpdate(hasGranted));
      }
    } else {
      setConsent(false); // Show banner
    }
  }, [isOgMode]);

  const acceptCookie = () => {
    setConsent(true);
    setCookie("gtpCookieConsent", "true", {
      maxAge: 60 * 60 * 24 * 365,
    });
    setCookie("gtpConsentVersion", "2", {
      maxAge: 60 * 60 * 24 * 365,
    });
  
    gtag("consent", "update", getConsentUpdate(true));
    
    console.log("[CookieConsent] Accepting cookies");
  };
  
  const denyCookie = () => {
    setConsent(true);
    setCookie("gtpCookieConsent", "false", {
      maxAge: 60 * 60 * 24 * 365,
    });
    setCookie("gtpConsentVersion", "2", {
      maxAge: 60 * 60 * 24 * 365,
    });
    
    gtag("consent", "update", getConsentUpdate(false));
    
    console.log("[CookieConsent] Denying cookies");
  };

  if (consent === true) {
    return null;
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