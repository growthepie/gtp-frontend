"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Icon from "@/components/layout/Icon";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_URL, IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./layout/Tooltip";
import { EmbedData, useUIContext } from "@/contexts/UIContext";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import { useSessionStorage } from "usehooks-ts";
import useCookieChange from "./layout/CookieChange";
import { GrayOverlay } from "./layout/Backgrounds";

const mainEmbedPages = ["", "fundamentals"];
const feesEmbedPages = [];
const embedPages = BASE_URL.includes("fees.") ? feesEmbedPages : mainEmbedPages;

export default function Share() {
  const pathname = usePathname();
  const [openShare, setOpenShare] = useState(false);
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  type TopSelections = "social" | "embed";

  const defaultTopSelection: TopSelections = "social";
  const cookieConsentValue = useCookieChange("gtpCookieConsent");
  const [topSelection, setTopSelection] = useSessionStorage<TopSelections>(
    "Share.topSelection",
    defaultTopSelection,
  );

  //const [widthValue, setWidthValue] = useState("960px");
  //const [heightValue, setHeightValue] = useState("480px");
  const [isAbsolute, setIsAbsolute] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  
  const { embedData, setEmbedData } = useUIContext();

  function copyText(entryText) {
    navigator.clipboard.writeText(entryText);
  }

  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
        copyTimeout.current = null;
      }
    };
  }, []);

  const triggerCopy = () => {
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
      copyTimeout.current = null;
      setCopied(false);
    } else {
      copyTimeout.current = setTimeout(() => {
        setCopied(false);
      }, 2000); // 3000 milliseconds (3 seconds)
    }
    setCopied(true);
  };
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const copyMarkdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const triggerCopyMarkdownEmbed = () => {
    if (copyMarkdownTimeout.current) {
      clearTimeout(copyMarkdownTimeout.current);
      copyMarkdownTimeout.current = null;
      setMarkdownCopied(false);
    } else {
      copyMarkdownTimeout.current = setTimeout(() => {
        setMarkdownCopied(false);
      }, 2000); // 3000 milliseconds (3 seconds)
    }
    setMarkdownCopied(true);
  };

  const handleSendEmail = () => {
    if (currentURL !== null) {
      const mailtoLink = `mailto:${""}?subject=${encodeURIComponent(
        "Check out what I found on growthepie.com!",
      )}&body=${encodeURIComponent(currentURL)}`;
      window.location.href = mailtoLink;
    }
  };

  const shareOnTwitter = () => {
    const text = "Check out what I found on growthepie.com!";
    if (currentURL !== null) {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        currentURL,
      )}&text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  const shareOnReddit = () => {
    if (currentURL !== null) {
      const title = "Check out what I found on growthepie.com!";
      const redditShareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
        currentURL,
      )}&title=${encodeURIComponent(title)}`;
      window.open(redditShareUrl, "_blank");
    }
  };

  const [isReadOnlyInput, setIsReadOnlyInput] = useState(true);

  const handleWidthChange = (event) => {
    const newValue = parseInt(event.target.value);
    if (!isNaN(newValue)) {
      //setWidthValue(newValue.toString()); // Convert newValue to string
      setEmbedData({ ...embedData, width: newValue });
    }
  };

  const handleHeightChange = (event) => {
    const newValue = parseInt(event.target.value);
    if (!isNaN(newValue)) {
      //setHeightValue(newValue.toString()); // Convert newValue to string
      setEmbedData({ ...embedData, height: newValue });
    }
  };

  const firstUrlPart = pathname.split("/")[1];

  const embedEnabled = useMemo(() => {
    return embedPages.includes(firstUrlPart);
  }, [firstUrlPart]);

  //Initialize URL
  useEffect(() => {
    setcurrentURL(BASE_URL + pathname);

    if (!embedEnabled) {
      setTopSelection("social");
    }
  }, [embedEnabled, pathname]);

  const embedDataString = useMemo(() => {
    return `width="${embedData.width}" height="${embedData.height}" src="${embedData.src}" title="${embedData.title}"`;
  }, [embedData]);

  const embedIframe = useMemo(() => {
    return `<iframe ${embedDataString}></iframe>`;
  }, [embedDataString]);

  // [Layer 2 Transaction Costs past EIP4844](https://www.growthepie.com/embed/fundamentals/transaction-costs?showUsd=true&theme=dark&timespan=180d&scale=absolute&interval=daily&showMainnet=false&chains=zora%2Cstarknet%2Coptimism%2Carbitrum%2Cmantle%2Cbase&zoomed=true&startTimestamp=1707978691244.2397&endTimestamp=1713744000000?display=iframe)
  const markdownEmbedIframe = useMemo(() => {
    const url = embedData.src;
    return `[${embedData.title}](${url}?display=iframe)`;
  }, [embedData]);

  return (
    <>
      <div className={`relative z-50 flex gap-x-[15px] rounded-full bg-forest-500 p-[5px] shadow-[0px_0px_50px_0px_#00000033] dark:bg-color-bg-medium dark:shadow-[0px_0px_50px_0px_#000000] ${cookieConsentValue ? "block" : "hidden"}`}>
        <div>
          <div className="absolute inset-0 z-40 w-full h-full overflow-hidden pointer-events-none rounded-full">
            {/* Glint effect */}
            <div className="w-full h-full"></div>
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 transform -skew-x-20 animate-glint blur-sm"></div>
          </div>
          <button
            className="select-none flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-color-bg-default rounded-full px-4 py-2"
            onClick={() => {
              setOpenShare(true);
              track("opened Share window", {
                location: isMobile ? `mobile` : `desktop`,
                page: window.location.pathname,
              });
            }}
          >
            <div className="w-5 h-5">
              <Icon className="w-5 h-5 font-semibold" icon="feather:share-2" />
              {/* <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M19 2C17.8954 2 17 2.89543 17 4C17 5.10457 17.8954 6 19 6C20.1046 6 21 5.10457 21 4C21 2.89543 20.1046 2 19 2ZM15 4C15 1.79086 16.7909 0 19 0C21.2091 0 23 1.79086 23 4C23 6.20914 21.2091 8 19 8C16.7909 8 15 6.20914 15 4Z"
                  fill="url(#paint0_linear_5844_24875)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M19 18C17.8954 18 17 18.8954 17 20C17 21.1046 17.8954 22 19 22C20.1046 22 21 21.1046 21 20C21 18.8954 20.1046 18 19 18ZM15 20C15 17.7909 16.7909 16 19 16C21.2091 16 23 17.7909 23 20C23 22.2091 21.2091 24 19 24C16.7909 24 15 22.2091 15 20Z"
                  fill="url(#paint1_linear_5844_24875)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.14301 13.5238C8.43509 13.0206 9.07818 12.8504 9.5794 13.1436L16.4783 17.0342C16.9795 17.3274 17.1491 17.973 16.857 18.4762C16.5649 18.9794 15.9218 19.1496 15.4206 18.8564L8.52171 14.9658C8.02049 14.6726 7.85094 14.027 8.14301 13.5238Z"
                  fill="url(#paint2_linear_5844_24875)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.8607 5.49777C17.1448 5.97634 16.9805 6.5907 16.4938 6.86998L9.53483 10.8631C9.04811 11.1424 8.42329 10.9808 8.13926 10.5022C7.85522 10.0237 8.01952 9.4093 8.50624 9.13002L15.4652 5.13692C15.9519 4.85764 16.5767 5.0192 16.8607 5.49777Z"
                  fill="url(#paint3_linear_5844_24875)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6 9.5C4.61929 9.5 3.5 10.6193 3.5 12C3.5 13.3807 4.61929 14.5 6 14.5C7.38071 14.5 8.5 13.3807 8.5 12C8.5 10.6193 7.38071 9.5 6 9.5ZM1 12C1 9.23858 3.23858 7 6 7C8.76142 7 11 9.23858 11 12C11 14.7614 8.76142 17 6 17C3.23858 17 1 14.7614 1 12Z"
                  fill="url(#paint4_linear_5844_24875)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_5844_24875"
                    x1="19"
                    y1="0"
                    x2="24.3929"
                    y2="7.5819"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FE5468" />
                    <stop offset="1" stopColor="#FFDF27" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_5844_24875"
                    x1="19"
                    y1="16"
                    x2="24.3929"
                    y2="23.5819"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FE5468" />
                    <stop offset="1" stopColor="#FFDF27" />
                  </linearGradient>
                  <linearGradient
                    id="paint2_linear_5844_24875"
                    x1="12.5"
                    y1="13"
                    x2="12.5"
                    y2="19"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#10808C" />
                    <stop offset="1" stopColor="#1DF7EF" />
                  </linearGradient>
                  <linearGradient
                    id="paint3_linear_5844_24875"
                    x1="12.5"
                    y1="5"
                    x2="12.5"
                    y2="11"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#10808C" />
                    <stop offset="1" stopColor="#1DF7EF" />
                  </linearGradient>
                  <linearGradient
                    id="paint4_linear_5844_24875"
                    x1="6"
                    y1="7"
                    x2="12.7412"
                    y2="16.4774"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FE5468" />
                    <stop offset="1" stopColor="#FFDF27" />
                  </linearGradient>
                </defs>
              </svg> */}
            </div>
            <div className="font-semibold">Share</div>
          </button>
          {openShare && (
            <>
              <GrayOverlay 
                onClick={() => {
                  setOpenShare(!openShare)
                  track("closed Share window", {
                    location: isMobile ? `mobile` : `desktop`,
                    page: window.location.pathname,
                  });
                }} 
              />
              <div
                className={`absolute -right-[5px] -bottom-[5px] bg-forest-50 dark:bg-color-bg-default z-[101] rounded-[40px] shadow-[0px_0px_30px_0px_#000000BF] py-[30px] px-[20px] 
                  border-[5px] border-forest-500 dark:border-[#5A6462] transition-all duration-300 select-none ${topSelection === "social"
                    ? "w-[calc(100vw-30px)] xs:w-[calc(100vw-46px)] md:w-[453px]"
                    : "w-[calc(100vw-30px)] xs:w-[calc(100vw-46px)] md:w-[579px]"
                  }`}
              >

                <div className="flex w-full h-[32px] justify-between items-center justify-self-start ">
                  <div className="flex items-center gap-x-[10px]">
                    <Icon
                      className="w-[24px] h-[24px] font-semibold"
                      icon="feather:share-2"
                    />
                    <div className="font-bold text-[24px]">Share</div>
                  </div>
                  <div
                    className="w-8 h-8 flex items-center justify-center hover:bg-forest-500 dark:hover:bg-forest-700 bg-transparent rounded-full hover:cursor-pointer transition-colors"
                    onClick={() => {
                      setOpenShare(false);
                      track("closed Share window", {
                        location: isMobile ? `mobile` : `desktop`,
                        page: window.location.pathname,
                      });
                    }}
                  >
                    <Icon
                      className="w-[24px] h-[24px] font-semibold"
                      icon="gtp:in-button-close-monochrome"
                    />
                  </div>
                </div>
                <div className="flex flex-col mt-[15px] text-[16px] leading-[125%]">
                  <div>Share this page through one of the following ways:</div>
                </div>
                <div className="flex gap-x-[5px] mt-[15px]">
                  <div
                    className={`flex items-center justify-center border px-[16px] py-[2px] text-[14px] leading-[20px] rounded-full hover:cursor-pointer transition ${topSelection === "social"
                        ? "bg-forest-200 border-forest-200 dark:bg-color-ui-active dark:border-[#151A19]"
                        : "border-forest-500 dark:border-[#5A6462] hover:bg-forest-500 hover:border-forest-500 dark:hover:bg-forest-900 dark:hover:border-forest-900"
                      }`}
                    onClick={() => {
                      setTopSelection("social");
                      track("clicked Social in Share window", {
                        location: isMobile ? `mobile` : `desktop`,
                        page: window.location.pathname,
                      });
                    }}
                  >
                    Social Media
                  </div>
                  {embedEnabled && (
                    <div
                      className={`flex items-center justify-center border px-[16px] py-[2px] text-[14px] leading-[20px] rounded-full hover:cursor-pointer transition ${topSelection === "embed"
                          ? "bg-forest-200 border-forest-200 dark:bg-color-ui-active dark:border-[#151A19]"
                          : "border-forest-500 dark:border-[#5A6462] hover:bg-forest-500 hover:border-forest-500 dark:hover:bg-forest-900 dark:hover:border-forest-900"
                        }`}
                      onClick={() => {
                        setTopSelection("embed");
                        track("clicked Embed in Share window", {
                          location: isMobile ? `mobile` : `desktop`,
                          page: window.location.pathname,
                        });
                      }}
                    >
                      Embed
                    </div>
                  )}
                </div>
                {topSelection === "social" && (
                  <div className="flex flex-col-reverse items-center mt-[30px] w-full text-[16px] leading-[150%] h-[234px]">
                    <div className="flex flex-col w-full">
                      {/* <div className="w-[251px] h-[181px]  flex items-center justify-center p-0.5 bg-forest-500 dark:bg-color-ui-hover rounded-[6px]">
                    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-color-ui-active rounded-[5px] text-[#5A6462] text-xs">
                      Image Goes Here
                    </div>
                  </div> */}
                      {/* <div className="">
                        <label className="flex items-center cursor-pointer">
                      <div className="flex items-center relative">
                        <input
                          type="checkbox"
                          checked={true}
                          className="hidden"
                        />
                        <div className="toggle__line w-[50px] h-[28px] bg-[#CDD8D3] rounded-full shadow-inner"></div>
                        <div
                          className={`toggle__dot absolute w-6 h-6 bg-color-bg-default rounded-full shadow inset-y-.5 mx-0.5 left-0 `}
                        ></div>
                      </div>
                      <div className="ml-3 text-[14px] leading-[150%] font-medium">
                        Include Screenshot
                      </div>
                    </label>
                      </div> */}
                      <div
                        className="group flex p-[15px] pr-[30px] gap-x-[10px] rounded-full w-full h-[54px]  mt-[6px] relative border-[3px] items-center border-forest-500 dark:border-forest-800 hover:bg-forest-500 hover:dark:bg-color-ui-hover hover:cursor-pointer transition-colors"
                        onClick={() => {
                          copyText(currentURL ? currentURL : "");
                          triggerCopy();
                          track("copied URL in Share Social window", {
                            location: isMobile ? `mobile` : `desktop`,
                            page: window.location.pathname,
                          });
                        }}
                      >
                        {/* <div className="flex w-[285px] h-[54px] p-[15px] border-[1px] border-[#CDD8D3] gap-x-[10px] items-center"> */}
                        <div className="w-[24px] h-[24px]">
                          <Icon
                            className="w-[24px] h-[24px] font-semibold"
                            icon="feather:link"
                          />
                        </div>
                        <div className="whitespace-nowrap text-ellipsis overflow-hidden max-w-full select-none text-xs xs:text-base">
                          {copied ? "Copied to clipboard" : currentURL}
                        </div>

                        <div className="ml-auto flex items-center">
                          <Icon
                            className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-color-text-primary  ${copied ? "opacity-0" : "opacity-100"
                              }`}
                            icon="feather:copy"
                          />
                          <Icon
                            className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-color-text-primary  ${copied ? "opacity-100" : "opacity-0"
                              }`}
                            icon="feather:check"
                          />
                        </div>
                        {/* </div> */}
                      </div>
                    </div>
                    <div className="flex flex-col gap-y-[5px] w-full">
                      <div
                        className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-color-bg-default hover:bg-forest-500 hover:dark:bg-color-ui-hover p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
                        onClick={() => {
                          handleSendEmail();
                          track("clicked Email in Share Social window", {
                            location: isMobile ? `mobile` : `desktop`,
                            page: window.location.pathname,
                          });
                        }}
                      >
                        <Icon className="w-[24px] h-[24px] " icon="gtp:email" />
                        <div className="h-[24px] leading-[150%] text-[16px]">
                          Share via Email
                        </div>
                      </div>
                      <div
                        className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-color-bg-default hover:bg-forest-500 hover:dark:bg-color-ui-hover p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
                        onClick={() => {
                          shareOnReddit();
                          track("clicked Reddit in Share Social window", {
                            location: isMobile ? `mobile` : `desktop`,
                            page: window.location.pathname,
                          });
                        }}
                      >
                        <Icon
                          className="w-[24px] h-[24px] "
                          icon="gtp:reddit"
                        />
                        <div className="h-[24px] leading-[150%] text-[16px]">
                          Share on Reddit
                        </div>
                      </div>

                      <div
                        className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-color-bg-default hover:bg-forest-500 hover:dark:bg-color-ui-hover p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
                        onClick={() => {
                          shareOnTwitter();
                          track("clicked Twitter in Share Social window", {
                            location: isMobile ? `mobile` : `desktop`,
                            page: window.location.pathname,
                          });
                        }}
                      >
                        <Icon
                          className="w-[24px] h-[24px] "
                          icon="pajamas:twitter"
                        />
                        <div className="h-[24px] leading-[150%] text-[16px]">
                          Share on X
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {topSelection === "embed" && (
                  <div className="relative flex flex-col md:flex-row gap-x-[30px] mt-[30px] w-full">
                    {(IS_DEVELOPMENT || IS_PREVIEW) && (
                      <Link
                        href={`${BASE_URL}/embed/test?url=${encodeURIComponent(
                          `${embedData.src}`,
                        )}&width=${embedData.width}&height=${embedData.height
                          }&title=${embedData.title}`}
                        target="_blank"
                        rel="noopener"
                        className="absolute -bottom-7 left-10 p-[5px] text-xs px-3 py-1 rounded-full border border-forest-500 dark:border-forest-800  hover:bg-forest-500 dark:hover:bg-color-ui-hover cursor-pointer"
                      >
                        Click here to test embed
                      </Link>
                    )}
                    <textarea
                      value={`<iframe
width="${embedData.width}" height="${embedData.height}" src="${embedData.src}" title="${embedData.title}">
</iframe>`}
                      className="font-light font-mono p-[15px] rounded-[25px] border-forest-500 dark:border-forest-600 border-[1px] h-full min-h-[231px] w-full text-[12px] leading-[150%] bg-transparent select-all outline-none resize-none cursor-text selection:bg-forest-900 dark:selection:bg-forest-900 dark:bg-color-bg-default dark:text-forest-100"
                      onClick={(e) => {
                        e.currentTarget.select();
                        track("clicked Embed Code textarea in Share window", {
                          location: isMobile ? `mobile` : `desktop`,
                          page: window.location.pathname,
                        });
                      }}
                      spellCheck="false"
                    />
                    <div className="flex flex-col h-full gap-y-[2px] w-full">
                      <div className="flex w-full justify-between items-center">
                        <div className="text-medium leading-[120%]">
                          Timeframe
                        </div>
                        <Tooltip placement="left" allowInteract>
                          <TooltipTrigger>
                            <div className="w-6 h-6">
                              <Icon icon="feather:info" className="w-6 h-6" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                            <div className="flex flex-col px-3 py-4 text-xs bg-color-bg-default dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-md font-normal">
                              <div className="font-semibold">
                                Snapshot Timeframe
                              </div>
                              <div className="mb-1">
                                The embedded chart&apos;s time window will be
                                frozen to the current chart state.
                              </div>
                              <div className="font-semibold">
                                Updating Timeframe
                              </div>
                              <div>
                                The embedded chart&apos;s time window will
                                change depending on when the chart is viewed.
                                This option is disabled when the chart is zoomed
                                in to a custom timeframe.
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* <div className="flex h-[28px] px-[2px] w-full bg-[#CDD8D3] justify-between items-center rounded-full">
                        <label className="inline-flex items-center cursor-pointer w-full">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer w-full"
                            checked={isAbsolute}
                            onChange={() => {
                              setIsAbsolute(!isAbsolute);
                            }}
                          />
                          <div
                            className={`flex items-center text-[16px] leading-snug justify-between pl-[18px] pr-5 relative w-full h-6 bg-[#CDD8D3] peer-focus:outline-none rounded-full peer ${isAbsolute
                              ? "peer-checked:after:right-[98.5px] "
                              : ""
                              } after:content-[''] after:absolute after:-top-[0.5px] after:-right-[0.5px] after:bg-forest-900  after:border after:rounded-full after:h-[25px] after:w-[102.5px] after:transition-all dark:border-gray-600 peer-checked:after:border-none`}
                          >
                            <div
                              className={`border-0 z-20 transition select-none ${isAbsolute
                                ? "text-forest-50"
                                : " text-[#2D3748]"
                                }`}
                            >
                              Absolute
                            </div>
                            <div
                              className={`z-20 transition select-none ${!isAbsolute
                                ? "text-forest-50"
                                : " text-[#2D3748]"
                                }`}
                            >
                              Relative
                            </div>
                          </div>
                        </label>
                      </div> */}
                      <div className="flex flex-col h-full gap-y-[5px] w-full select-none">
                        <div
                          className="relative w-full rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer"
                          onClick={() => {
                            if (embedData.zoomed) return;

                            const newTimeframe =
                              embedData.timeframe === "absolute"
                                ? "relative"
                                : "absolute";
                            setEmbedData((prev) => ({
                              ...prev,
                              timeframe: newTimeframe,
                            }));
                            track(
                              "selected Timeframe in Share Embed window: " +
                              newTimeframe,
                              {
                                location: isMobile ? `mobile` : `desktop`,
                                page: window.location.pathname,
                              },
                            );
                          }}
                        >
                          <div className="w-full flex justify-between text-[#2D3748]">
                            <div className="w-full text-center">Snapshot</div>
                            <div
                              className={`w-full text-center ${embedData.zoomed && "opacity-50"
                                }`}
                            >
                              Updating
                            </div>
                          </div>
                          <div className="absolute inset-0 w-full p-0.5 rounded-full text-center">
                            <div
                              className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full text-center transition-transform duration-300"
                              style={{
                                transform:
                                  embedData.timeframe === "absolute" ||
                                    embedData.zoomed
                                    ? "translateX(0%)"
                                    : "translateX(100%)",
                              }}
                            >
                              {embedData.timeframe === "absolute"
                                ? "Snapshot"
                                : "Updating"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-x-[10px] h-[54px] rounded-full border-transparent border-[2px] px-[15px]">
                          <div className="w-[24px] h-[24px]">
                            <Icon
                              className="w-[24px] h-[24px] font-semibold"
                              icon="fluent:arrow-autofit-width-24-regular"
                            />
                          </div>
                          <div className="flex items-center w-full gap-x-[5px]">
                            <div
                              className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-color-ui-hover ${embedData.width <= 450 && "opacity-30"
                                }`}
                            >
                              <div
                                className="w-[24px] h-[24px]"
                                onClick={() => {
                                  setEmbedData({
                                    ...embedData,
                                    width: Math.max(450, embedData.width - 1),
                                  });
                                }}
                              >
                                <Icon
                                  className="w-[24px] h-[24px]"
                                  icon="feather:minus"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-x-[2px] border-b border-dashed border-forest-400 w-20 justify-center">
                              <input
                                className="bg-transparent outline-none text-right"
                                size={3}
                                value={embedData.width}
                                onChange={handleWidthChange}
                                onBlur={() => {
                                  if (embedData.width < 450) {
                                    setEmbedData({ ...embedData, width: 450 });
                                  }
                                }}
                                style={{
                                  boxShadow: "none", // Remove default focus box shadow
                                }}
                              />
                              {/* {embedData.width}
                              </div> */}
                              <div className="text-xs text-forest-400 pr-4">
                                px
                              </div>
                            </div>
                            <div
                              className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-color-ui-hover`}
                            >
                              <div
                                className="w-[24px] h-[24px] cursor-pointer"
                                onClick={() => {
                                  setEmbedData({
                                    ...embedData,
                                    width: embedData.width + 1,
                                  });
                                }}
                              >
                                <Icon
                                  className="w-[24px] h-[24px]"
                                  icon="feather:plus"
                                />
                              </div>
                            </div>
                            <div className="flex-1 flex justify-center items-center left-44 text-forest-400 text-xs">
                              Width
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-[10px] h-[54px] rounded-full border-transparent border-[2px] px-[15px]">
                          {/* <div className="absolute top-0 bottom-0 flex items-center left-44 text-[#5A6462] text-xs">
                            height
                          </div> */}
                          <div className="w-[24px] h-[24px]">
                            <Icon
                              className="w-[24px] h-[24px] font-semibold"
                              icon="fluent:arrow-autofit-height-24-regular"
                            />
                          </div>
                          <div className="flex items-center w-full gap-x-[5px]">
                            <div
                              className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-color-ui-hover ${embedData.height <= 500 && "opacity-30"
                                }`}
                            >
                              <div
                                className="w-[24px] h-[24px]"
                                onClick={() => {
                                  setEmbedData({
                                    ...embedData,
                                    height: Math.max(500, embedData.height - 1),
                                  });
                                }}
                              >
                                <Icon
                                  className="w-[24px] h-[24px]"
                                  icon="feather:minus"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-x-[2px] border-b border-dashed border-forest-400 w-20 justify-center">
                              <input
                                className="bg-transparent outline-none text-right"
                                size={3}
                                value={embedData.height}
                                onChange={handleHeightChange}
                                onBlur={() => {
                                  if (embedData.height < 500) {
                                    setEmbedData({ ...embedData, height: 500 });
                                  }
                                }}
                                style={{
                                  boxShadow: "none", // Remove default focus box shadow
                                }}
                              />
                              {/* {embedData.height}
                              </div> */}
                              <div className="text-xs text-forest-400 pr-4">
                                px
                              </div>
                            </div>
                            <div className="cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-color-ui-hover">
                              <div
                                className="w-[24px] h-[24px] cursor-pointer"
                                onClick={() => {
                                  setEmbedData({
                                    ...embedData,
                                    height: embedData.height + 1,
                                  });
                                }}
                              >
                                <Icon
                                  className="w-[24px] h-[24px]"
                                  icon="feather:plus"
                                />
                              </div>
                            </div>
                            <div className="flex-1 flex justify-center items-center left-44 text-forest-400 text-xs">
                              Height
                            </div>
                          </div>
                        </div>

                        <div
                          className="group flex items-center gap-x-[10px] h-[54px] rounded-full bg-forest-50 dark:bg-color-bg-default hover:bg-forest-500 hover:dark:bg-color-ui-hover border-forest-500 dark:border-[#5A6462] border-[3px] px-[15px] cursor-pointer transition-colors"
                          onClick={() => {
                            copyText(embedIframe);
                            triggerCopy();
                            track("copied URL in Share Embed window", {
                              location: isMobile ? `mobile` : `desktop`,
                              page: window.location.pathname,
                            });
                          }}
                        >
                          <Icon
                            className="w-[24px] h-[24px] font-semibold"
                            icon="gtp:code-slash"
                          />
                          <div>
                            {copied ? "HTML Code Copied" : "Copy HTML Code"}
                          </div>
                          <div className="flex ml-auto relative w-[24px] h-[24px]">
                            <Icon
                              className={`absolute  w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-color-text-primary ${copied ? "opacity-0" : "opacity-100"
                                }`}
                              icon="feather:copy"
                            />
                            <Icon
                              className={`absolute w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-color-text-primary ${copied ? "opacity-100" : "opacity-0"
                                }`}
                              icon="feather:check"
                            />
                          </div>
                        </div>
                        <div className="absolute -bottom-[22px] right-0 left-1/2 text-center text-xs text-forest-400">
                          or{" "}
                          <span
                            className="cursor-pointer underline text-forest-900 dark:text-color-text-primary hover:text-black dark:hover:text-forest-50"
                            onClick={() => {
                              copyText(markdownEmbedIframe);
                              triggerCopyMarkdownEmbed();
                              track(
                                "copied Markdown URL in Share Embed window",
                                {
                                  location: isMobile ? `mobile` : `desktop`,
                                  page: window.location.pathname,
                                },
                              );
                            }}
                          >
                            {markdownCopied
                              ? "Markdown Code Copied"
                              : "Copy Markdown Code"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
