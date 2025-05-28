// components/layout/SharePopoverContent.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Icon from "@/components/layout/Icon";
import { usePathname } from "next/navigation";
import { BASE_URL, IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip"; // Assumes Tooltip.tsx is in components/layout/
import { EmbedData, useUIContext } from "@/contexts/UIContext";
import Link from "next/link";
import { track } from "@vercel/analytics/react";
import { useSessionStorage } from "usehooks-ts";

const mainEmbedPages = ["", "fundamentals"];
const feesEmbedPages = [];
const embedPages = BASE_URL.includes("fees.") ? feesEmbedPages : mainEmbedPages;

interface SharePopoverContentProps {
  onClose: () => void;
}

export default function SharePopoverContent({ onClose }: SharePopoverContentProps) {
  const pathname = usePathname();
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  type TopSelections = "social" | "embed";

  const defaultTopSelection: TopSelections = "social";
  const [topSelection, setTopSelection] = useSessionStorage<TopSelections>(
    "Share.topSelection",
    defaultTopSelection,
  );

  const isMobile = useMediaQuery("(max-width: 767px)");
  const { embedData, setEmbedData } = useUIContext();

  function copyText(entryText: string) {
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
      setCopied(false); // Resetting visual state immediately
    }
    setCopied(true);
    copyTimeout.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const [markdownCopied, setMarkdownCopied] = useState(false);
  const copyMarkdownTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { // Separate useEffect for markdown copy timeout
    return () => {
      if (copyMarkdownTimeout.current) {
        clearTimeout(copyMarkdownTimeout.current);
        copyMarkdownTimeout.current = null;
      }
    };
  }, []);

  const triggerCopyMarkdownEmbed = () => {
    if (copyMarkdownTimeout.current) {
      clearTimeout(copyMarkdownTimeout.current);
      setMarkdownCopied(false); // Resetting visual state
    }
    setMarkdownCopied(true);
    copyMarkdownTimeout.current = setTimeout(() => {
      setMarkdownCopied(false);
    }, 2000);
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

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    if (!isNaN(newValue)) {
      setEmbedData({ ...embedData, width: newValue });
    } else if (event.target.value === "") { // Allow clearing input
      setEmbedData({ ...embedData, width: 0 }); // Or a default min
    }
  };

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    if (!isNaN(newValue)) {
      setEmbedData({ ...embedData, height: newValue });
    } else if (event.target.value === "") { // Allow clearing input
      setEmbedData({ ...embedData, height: 0 }); // Or a default min
    }
  };

  const firstUrlPart = pathname.split("/")[1];

  const embedEnabled = useMemo(() => {
    return embedPages.includes(firstUrlPart);
  }, [firstUrlPart]);

  useEffect(() => {
    setcurrentURL(BASE_URL + pathname);
    if (!embedEnabled) {
      setTopSelection("social");
    }
  }, [embedEnabled, pathname, setTopSelection]);

  const embedDataString = useMemo(() => {
    return `width="${embedData.width}" height="${embedData.height}" src="${embedData.src}" title="${embedData.title}"`;
  }, [embedData]);

  const embedIframe = useMemo(() => {
    return `<iframe ${embedDataString}></iframe>`;
  }, [embedDataString]);

  const markdownEmbedIframe = useMemo(() => {
    const url = embedData.src;
    return `[${embedData.title}](${url}?display=iframe)`;
  }, [embedData]);

  return (
    <div
      className={`bg-forest-50 dark:bg-[#1F2726] rounded-[40px] shadow-[0px_0px_30px_0px_#000000BF] py-[30px] px-[20px] 
                 transition-all duration-300 select-none ${topSelection === "social"
          ? "w-[calc(100vw-40px)] xs:w-[calc(100vw-56px)] md:w-[453px]" // Adjusted for potential popover padding
          : "w-[calc(100vw-40px)] xs:w-[calc(100vw-56px)] md:w-[579px]"
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
            onClose();
            track("closed Share window with X button", {
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
              ? "bg-forest-200 border-forest-200 dark:bg-[#151A19] dark:border-[#151A19]"
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
                ? "bg-forest-200 border-forest-200 dark:bg-[#151A19] dark:border-[#151A19]"
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
        <div className="flex flex-col-reverse items-center mt-[30px] w-full text-[16px] leading-[150%] min-h-[234px] justify-between">
          <div className="flex flex-col w-full">
            <div
              className="group flex p-[15px] pr-[30px] gap-x-[10px] rounded-full w-full h-[54px] mt-[6px] relative border-[3px] items-center border-forest-500 dark:border-forest-800 hover:bg-forest-500 hover:dark:bg-[#5A6462] hover:cursor-pointer transition-colors"
              onClick={() => {
                copyText(currentURL ? currentURL : "");
                triggerCopy();
                track("copied URL in Share Social window", {
                  location: isMobile ? `mobile` : `desktop`,
                  page: window.location.pathname,
                });
              }}
            >
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
                  className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-forest-500  ${copied ? "opacity-0" : "opacity-100"
                    }`}
                  icon="feather:copy"
                />
                <Icon
                  className={`absolute right-[15px] w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-forest-500  ${copied ? "opacity-100" : "opacity-0"
                    }`}
                  icon="feather:check"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-[5px] w-full">
            <div
              className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-[#1F2726] hover:bg-forest-500 hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
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
              className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-[#1F2726] hover:bg-forest-500 hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
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
              className="flex items-center w-full h-[54px] border-forest-500 dark:border-[#5A6462] border-[3px] dark:bg-[#1F2726] hover:bg-forest-500 hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px] transition-colors"
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
              rel="noopener noreferrer"
              className="absolute -bottom-7 left-10 p-[5px] text-xs px-3 py-1 rounded-full border border-forest-500 dark:border-forest-800  hover:bg-forest-500 dark:hover:bg-[#5A6462] cursor-pointer"
            >
              Click here to test embed
            </Link>
          )}
          <textarea
            value={embedIframe}
            readOnly
            className="font-light font-mono p-[15px] rounded-[15px] md:rounded-[25px] border-forest-500 dark:border-forest-600 border-[1px] h-full min-h-[100px] w-full text-[12px] leading-[150%] bg-transparent select-all outline-none resize-none cursor-text selection:bg-forest-900 dark:selection:bg-forest-900 dark:bg-[#1F2726] dark:text-forest-100"
            onClick={(e) => {
              e.currentTarget.select();
              track("clicked Embed Code textarea in Share window", {
                location: isMobile ? `mobile` : `desktop`,
                page: window.location.pathname,
              });
            }}
            spellCheck="false"
          />
          <div className="flex flex-col h-full gap-y-[2px] w-full mt-4 md:mt-0">
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
                <TooltipContent className="z-global-search-tooltip flex items-center justify-center pr-[3px]">
                  <div className="flex flex-col px-3 py-4 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-md font-normal">
                    <div className="font-semibold">
                      Snapshot Timeframe
                    </div>
                    <div className="mb-1">
                      The embedded chart's time window will be
                      frozen to the current chart state.
                    </div>
                    <div className="font-semibold">
                      Updating Timeframe
                    </div>
                    <div>
                      The embedded chart's time window will
                      change depending on when the chart is viewed.
                      This option is disabled when the chart is zoomed
                      in to a custom timeframe.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col h-full gap-y-[5px] w-full select-none">
              <div
                className={`relative w-full rounded-full bg-[#CDD8D3] p-0.5 ${embedData.zoomed ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
                    className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full text-center transition-transform duration-300 flex items-center justify-center"
                    style={{
                      transform:
                        embedData.timeframe === "absolute" ||
                          embedData.zoomed
                          ? "translateX(0%)"
                          : "translateX(100%)",
                    }}
                  >
                    {embedData.timeframe === "absolute" || embedData.zoomed
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
                    className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-forest-800 ${embedData.width <= 450 && "opacity-30 pointer-events-none"
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
                      className="bg-transparent outline-none text-right w-full"
                      type="number"
                      size={3}
                      value={embedData.width}
                      onChange={handleWidthChange}
                      onBlur={() => {
                        if (embedData.width < 450) {
                          setEmbedData({ ...embedData, width: 450 });
                        }
                      }}
                      style={{
                        boxShadow: "none",
                      }}
                    />
                    <div className="text-xs text-forest-400 pr-1">
                      px
                    </div>
                  </div>
                  <div
                    className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-forest-800`}
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
                  <div className="flex-1 flex justify-center items-center text-forest-400 text-xs">
                    Width
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-x-[10px] h-[54px] rounded-full border-transparent border-[2px] px-[15px]">
                <div className="w-[24px] h-[24px]">
                  <Icon
                    className="w-[24px] h-[24px] font-semibold"
                    icon="fluent:arrow-autofit-height-24-regular"
                  />
                </div>
                <div className="flex items-center w-full gap-x-[5px]">
                  <div
                    className={`cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-forest-800 ${embedData.height <= 500 && "opacity-30 pointer-events-none"
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
                      className="bg-transparent outline-none text-right w-full"
                      type="number"
                      size={3}
                      value={embedData.height}
                      onChange={handleHeightChange}
                      onBlur={() => {
                        if (embedData.height < 500) {
                          setEmbedData({ ...embedData, height: 500 });
                        }
                      }}
                      style={{
                        boxShadow: "none",
                      }}
                    />
                    <div className="text-xs text-forest-400 pr-1">
                      px
                    </div>
                  </div>
                  <div className="cursor-pointer rounded-full p-0.5 text-forest-600 dark:text-forest-400 bg-forest-200 dark:bg-forest-900 transition-colors hover:bg-forest-300 dark:hover:bg-forest-800">
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
                  <div className="flex-1 flex justify-center items-center text-forest-400 text-xs">
                    Height
                  </div>
                </div>
              </div>

              <div
                className="group flex items-center gap-x-[10px] h-[54px] rounded-full bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-500 hover:dark:bg-[#5A6462] border-forest-500 dark:border-[#5A6462] border-[3px] px-[15px] cursor-pointer transition-colors"
                onClick={() => {
                  copyText(embedIframe);
                  triggerCopy();
                  track("copied Embed HTML in Share Embed window", {
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
                    className={`absolute w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-forest-500 ${copied ? "opacity-0" : "opacity-100"
                      }`}
                    icon="feather:copy"
                  />
                  <Icon
                    className={`absolute w-[24px] h-[24px] font-semibold transition-all duration-300 text-[#5A6462] group-hover:text-forest-700 dark:group-hover:text-forest-500 ${copied ? "opacity-100" : "opacity-0"
                      }`}
                    icon="feather:check"
                  />
                </div>
              </div>
              <div className="relative text-center text-xs text-forest-400 mt-1"> {/* Adjusted for spacing */}
                or{" "}
                <span
                  className="cursor-pointer underline text-forest-900 dark:text-forest-500 hover:text-black dark:hover:text-forest-50"
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
  );
}