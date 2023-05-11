"use client";
import React, { useEffect, useState } from "react";
import { setCookie, hasCookie } from "cookies-next";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function CookieConsent() {
  const [consent, setConsent] = useState(true);
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

  return (
    <div
      className={`flex flex-col lg:flex-row items-center justify-between px-[35px] py-8  space-y-4 lg:space-y-0 lg:space-x-8 bg-forest-50 text-base text-forest-900 border-forest-500 border-[0.5px] bottom-0 mb-10 fixed z-50 w-9/12 max-w-[884px] mx-auto rounded-3xl lg:rounded-full left-[50%] transform -translate-x-1/2 shadow-2xl shadow-black/70 ${
        consent ? "hidden" : ""
      }`}
    >
      <div className="flex items-center justify-center space-x-[36px]">
        <div>
          <Icon icon="feather:shield" className="w-24 h-24 lg:w-16 lg:h-16" />
        </div>
        <div className="flex items-center space-x-8">
          <div className="">
            Our website uses cookies to analyze how the site is used and to
            ensure your experience is consistent between visits.
            <br />
            Find our{" "}
            <Link href="/privacy-policy" className="underline relative">
              Privacy Policy here.
            </Link>
          </div>
        </div>
      </div>

      <div className="flex align-middle justify-between">
        <div className="flex items-center justify-center w-full space-x-[36px]">
          <button
            onClick={() => {
              acceptCookie();
            }}
            className="bg-white/70 dark:bg-black/40 text-forest-900 px-5 py-2 lg:py-3 rounded-full text-center whitespace-nowrap w-full lg:w-auto hover:bg-white"
          >
            Allow All
          </button>
          <button
            onClick={(e) => denyCookie()}
            className="bg-white/70 dark:bg-black/40 text-forest-900 px-5 py-2 lg:py-3 rounded-full text-center whitespace-nowrap w-full lg:w-auto hover:bg-white"
          >
            Decline
          </button>
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
