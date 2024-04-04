"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Icon from "@/components/layout/Icon";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_URL, BASE_URLS } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./layout/Tooltip";
import { EmbedData, useUIContext } from "@/contexts/UIContext";
import Link from "next/link";
import { track } from "@vercel/analytics/react";

const embedPages = ["", "fundamentals"];

export default function Share() {
  const pathname = usePathname();
  const [openShare, setOpenShare] = useState(false);
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [topSelection, setTopSelection] = useState("social");
  //const [widthValue, setWidthValue] = useState("960px");
  //const [heightValue, setHeightValue] = useState("480px");
  const [isAbsolute, setIsAbsolute] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const { embedData, setEmbedData } = useUIContext();

  function copyText(entryText) {
    navigator.clipboard.writeText(entryText);
  }

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
    setCopied(true);
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
      copyTimeout.current = null;
      setCopied(false);
    } else {
      copyTimeout.current = setTimeout(() => {
        setCopied(false);
      }, 3000); // 3000 milliseconds (3 seconds)
    }
  };

  const handleSendEmail = () => {
    if (currentURL !== null) {
      const mailtoLink = `mailto:${""}?subject=${encodeURIComponent(
        "Check out what I found on growthepie.xyz!",
      )}&body=${encodeURIComponent(currentURL)}`;
      window.location.href = mailtoLink;
    }
  };

  const shareOnTwitter = () => {
    const text = "Check out what I found on growthepie.xyz!";
    if (currentURL !== null) {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        currentURL,
      )}&text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  const shareOnReddit = () => {
    if (currentURL !== null) {
      const title = "Check out what I found on growthepie.xyz!";
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
    setcurrentURL(
      BASE_URLS[process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production"] + pathname,
    );

    if (!embedEnabled) {
      setTopSelection("social");
    }
  }, [pathname]);

  return (
    <>
      <div>
        <div>
          <button
            className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-[#1F2726] rounded-full px-4 py-2"
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
            </div>
            <div className="font-semibold">Share</div>
          </button>
          {openShare && (
            <>
              <div
                className="fixed inset-0 bg-black opacity-0 transition-opacity duration-500 z-[100]"
                style={{ opacity: 0.3 }}
                onClick={() => {
                  setOpenShare(!openShare);
                  track("closed Share window", {
                    location: isMobile ? `mobile` : `desktop`,
                    page: window.location.pathname,
                  });
                }}
              />
              <div
                className={`absolute -right-[5px] -bottom-[5px] bg-forest-50 dark:bg-[#1F2726] z-[110] rounded-[40px] shadow-lg py-[30px] px-[20px] 
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
                    className="w-8 h-8 flex items-center justify-center hover:bg-forest-800 bg-transparent rounded-full hover:cursor-pointer"
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
                      icon="feather:x-circle"
                    />
                  </div>
                </div>
                <div className="flex flex-col mt-[15px] text-[16px] leading-[125%]">
                  <div>Share this page through one of the following ways:</div>
                </div>
                <div className="flex gap-x-[5px] mt-[15px]">
                  <div
                    className={`flex items-center justify-center border px-[16px] py-[2px] text-[14px] leading-[20px] rounded-full hover:cursor-pointer transition ${topSelection === "social"
                      ? "bg-[#151A19] border-[#151A19]"
                      : "border-[#5A6462]"
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
                  {embedEnabled && (<div
                    className={`flex items-center justify-center border px-[16px] py-[2px] text-[14px] leading-[20px] rounded-full hover:cursor-pointer transition ${topSelection === "embed"
                      ? "bg-[#151A19] border-[#151A19]"
                      : "border-[#5A6462]"
                      }`}
                    onClick={() => {
                      setTopSelection("embed");
                      track("clicked Embed in Share window", {
                        location: isMobile ? `mobile` : `desktop`,
                        page: window.location.pathname,
                      });
                    }}
                  >
                    Embed Code
                  </div>)}
                </div>
                {topSelection === "social" ? (
                  <div className="flex flex-col-reverse items-center mt-[30px] w-full text-[16px] leading-[150%] h-[234px]">
                    <div className="flex flex-col w-full">
                      {/* <div className="w-[251px] h-[181px]  flex items-center justify-center p-0.5 bg-forest-500 dark:bg-[#5A6462] rounded-[6px]">
                    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-forest-1000 rounded-[5px] text-[#5A6462] text-xs">
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
                          className={`toggle__dot absolute w-6 h-6 bg-[#1F2726] rounded-full shadow inset-y-.5 mx-0.5 left-0 `}
                        ></div>
                      </div>
                      <div className="ml-3 text-[14px] leading-[150%] font-medium">
                        Include Screenshot
                      </div>
                    </label>
                      </div> */}
                      <div
                        className="group flex p-[15px] pr-[30px] gap-x-[10px] rounded-full w-full h-[54px]  mt-[6px] relative border-[3px] items-center border-forest-500 dark:border-forest-800 hover:dark:bg-[#5A6462] hover:cursor-pointer"
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
                        <Icon
                          className="w-[24px] h-[24px] font-semibold"
                          icon="feather:link"
                        />
                        <div className="whitespace-nowrap text-ellipsis overflow-hidden max-w-full select-none text-xs xs:text-base">
                          {copied ? "Copied to clipboard" : currentURL}
                        </div>

                        <div className="ml-auto flex items-center">
                          <Icon
                            className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-opacity duration-300 text-[#5A6462] group-hover:text-forest-900  ${copied ? "opacity-0" : "opacity-100"
                              }`}
                            icon="feather:copy"
                          // onClick={() => {
                          //   copyText(currentURL ? currentURL : "");
                          //   triggerCopy();
                          // }}
                          />
                          <Icon
                            className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-opacity duration-300 text-[#5A6462] group-hover:text-forest-900 ${copied ? "opacity-100" : "opacity-0"
                              }`}
                            icon="feather:check"
                          // onClick={() => {
                          //   copyText(currentURL ? currentURL : "");
                          //   triggerCopy();
                          // }}
                          />
                        </div>
                        {/* </div> */}
                      </div>
                    </div>
                    <div className="flex flex-col gap-y-[5px] w-full">
                      <div
                        className="flex items-center w-full h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px] "
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
                        className="flex items-center w-full h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
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
                        className="flex items-center w-full h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
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
                ) : (
                  <div className="relative flex flex-col md:flex-row gap-x-[30px] mt-[30px] w-full">
                    <Link href={`${BASE_URL}/embed/test?url=${encodeURIComponent(`${embedData.src}`)}&width=${embedData.width}&height=${embedData.height}&title=${embedData.title}`} target="_blank" rel="noopener" className="absolute -top-6 left-0 p-[5px] text-xs text-forest-400">
                      Test
                    </Link>
                    <textarea
                      value={
                        `<iframe
width="${embedData.width}" height="${embedData.height}" src="${embedData.src}" title="${embedData.title}">
</iframe>`
                      }
                      className="font-light font-mono p-[15px] rounded-[25px] border-forest-600 border-[1px] h-full min-h-[231px] w-full text-[12px] leading-[150%] bg-transparent select-all outline-none resize-none cursor-text selection:bg-forest-900 dark:selection:bg-forest-900 dark:bg-[#1F2726] dark:text-forest-100"
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
                        <div className="text-medium leading-[120%]">Timeframe</div>
                        <Tooltip placement="left" allowInteract>
                          <TooltipTrigger>
                            <div className="w-6 h-6">
                              <Icon icon="feather:info" className="w-6 h-6" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                            <div className="flex flex-col px-3 py-4 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto font-normal">
                              <div className="font-semibold">Absolute Timeframe</div>
                              <div className="mb-1">The embedded chart&apos;s time window will be frozen to the current chart state.</div>
                              <div className="font-semibold">Relative Timeframe</div>
                              <div>The embedded chart&apos;s time window will change depending on when the chart is viewed.</div>
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
                            const newTimeframe = embedData.timeframe === "absolute" ? "relative" : "absolute";
                            setEmbedData(prev => ({ ...prev, timeframe: newTimeframe }))
                            track("selected Timeframe in Share Embed window: " + newTimeframe, {
                              location: isMobile ? `mobile` : `desktop`,
                              page: window.location.pathname,
                            });
                          }}>
                          <div className="w-full flex justify-between text-[#2D3748]">
                            <div className="w-full text-center">Absolute</div>
                            <div className="w-full text-center">Relative</div>
                          </div>
                          <div className="absolute inset-0 w-full p-0.5 rounded-full text-center">
                            <div className="w-1/2 h-full bg-forest-900 rounded-full text-center transition-transform duration-300" style={{ transform: embedData.timeframe === "absolute" ? "translateX(0%)" : "translateX(100%)" }}>
                              {
                                embedData.timeframe === "absolute" ?
                                  "Absolute"
                                  : "Relative"
                              }
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
                            <div className="cursor-pointer bg-forest-900 rounded-full p-0.5 text-forest-400">
                              <div className="w-[24px] h-[24px]" onClick={() => {
                                setEmbedData({ ...embedData, width: embedData.width - 1 });
                              }}>
                                <Icon className="w-[24px] h-[24px]" icon="feather:minus" />
                              </div>
                            </div>
                            <div className="flex items-center gap-x-[2px] border-b border-dashed border-forest-400 w-20 justify-center">
                              <input
                                className="bg-transparent outline-none text-right"
                                size={3}
                                value={embedData.width}
                                onChange={handleWidthChange}
                                style={{
                                  boxShadow: "none", // Remove default focus box shadow
                                }}

                              />
                              {/* {embedData.width}
                              </div> */}
                              <div className="text-xs text-forest-400 pr-4">px</div>
                            </div>
                            <div className="cursor-pointer bg-forest-900 rounded-full p-0.5 text-forest-400">
                              <div className="w-[24px] h-[24px] cursor-pointer" onClick={() => {
                                setEmbedData({ ...embedData, width: embedData.width + 1 });
                              }}>
                                <Icon className="w-[24px] h-[24px]" icon="feather:plus" />
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
                            <div className="cursor-pointer bg-forest-900 rounded-full p-0.5 text-forest-400">
                              <div className="w-[24px] h-[24px]" onClick={() => {
                                setEmbedData({ ...embedData, height: embedData.height - 1 });
                              }}>
                                <Icon className="w-[24px] h-[24px]" icon="feather:minus" />
                              </div>
                            </div>
                            <div className="flex items-center gap-x-[2px] border-b border-dashed border-forest-400 w-20 justify-center">
                              <input
                                className="bg-transparent outline-none text-right"
                                size={3}
                                value={embedData.height}
                                onChange={handleHeightChange}
                                style={{
                                  boxShadow: "none", // Remove default focus box shadow
                                }}

                              />
                              {/* {embedData.height}
                              </div> */}
                              <div className="text-xs text-forest-400 pr-4">px</div>
                            </div>
                            <div className="cursor-pointer bg-forest-900 rounded-full p-0.5 text-forest-400">
                              <div className="w-[24px] h-[24px] cursor-pointer" onClick={() => {
                                setEmbedData({ ...embedData, height: embedData.height + 1 });
                              }}>
                                <Icon className="w-[24px] h-[24px]" icon="feather:plus" />
                              </div>
                            </div>
                            <div className="flex-1 flex justify-center items-center left-44 text-forest-400 text-xs">
                              Height
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-x-[10px] h-[54px] rounded-full border-[#5A6462] border-[3px] px-[15px] cursor-pointer" onClick={() => {
                          copyText(currentURL ? currentURL : "");
                          triggerCopy();
                          track("copied URL in Share Embed window", {
                            location: isMobile ? `mobile` : `desktop`,
                            page: window.location.pathname,
                          });
                        }}>
                          <Icon
                            className={`  w-[24px] h-[24px] font-semibold `}
                            icon="gtp:code-slash"
                          />
                          <div>{copied ? "Copied" : "Copy Code"}</div>
                          <div className="flex ml-auto relative w-[24px] -top-[10px]">
                            <Icon
                              className={`absolute  w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${copied ? "opacity-0" : "opacity-100"
                                }`}
                              icon="feather:copy"

                            />
                            <Icon
                              className={`absolute w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${copied ? "opacity-100" : "opacity-0"
                                }`}
                              icon="feather:check"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/*Top Row X */}
              </div>
            </>
          )}
        </div>
      </div >
    </>
  );
}
