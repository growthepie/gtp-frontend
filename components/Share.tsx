"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/layout/Icon";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_URLS } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./layout/Tooltip";

export default function Share() {
  const pathname = usePathname();
  const [openShare, setOpenShare] = useState(false);
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [topSelection, setTopSelection] = useState("social");
  const [widthValue, setWidthValue] = useState("960px");
  const [heightValue, setHeightValue] = useState("480px");
  const [isAbsolute, setIsAbsolute] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  function copyText(entryText) {
    navigator.clipboard.writeText(entryText);
  }

  function triggerCopy() {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000); // 3000 milliseconds (3 seconds)
  }

  const handleSendEmail = () => {
    if (currentURL !== null) {
      const mailtoLink = `mailto:${""}?subject=${encodeURIComponent(
        "GrowThePie",
      )}&body=${encodeURIComponent(currentURL)}`;
      window.location.href = mailtoLink;
    }
  };

  const shareOnTwitter = () => {
    const text = "Share";
    if (currentURL !== null) {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        currentURL,
      )}&text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  const shareOnReddit = () => {
    if (currentURL !== null) {
      const title = "Share";
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
      setWidthValue(newValue.toString()); // Convert newValue to string
    }
  };

  const handleHeightChange = (event) => {
    const newValue = parseInt(event.target.value);
    if (!isNaN(newValue)) {
      setHeightValue(newValue.toString()); // Convert newValue to string
    }
  };

  //Initialize URL
  useEffect(() => {
    setcurrentURL(
      BASE_URLS[process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production"] + pathname,
    );
  }, [pathname]);

  return (
    <>
      {" "}
      {!isMobile && (
        <div className="relative flex gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#5A6462] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
          <div>
            <button
              className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
              onClick={() => {
                setOpenShare(true);
              }}
            >
              <div className="w-5 h-5">
                <Icon
                  className="w-5 h-5 font-semibold"
                  icon="feather:share-2"
                />
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
                  }}
                />
                <div
                  className={`absolute -right-[5px] -bottom-[5px]  bg-forest-50 dark:bg-[#1F2726] z-[110] rounded-[40px] shadow-lg py-[30px] px-[20px] 
                  border-[5px] border-forest-500 dark:border-[#5A6462] transition-all duration-300 ${
                    topSelection === "social" ? "w-[453px]" : "w-[579px]"
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
                      }}
                    >
                      <Icon
                        className="w-[24px] h-[24px] font-semibold"
                        icon="feather:x-circle"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col mt-[15px] text-[16px] leading-[125%]">
                    <div>
                      Share this page on through one of the following ways:
                    </div>
                  </div>
                  {/* <div className="flex gap-x-[10px] mt-[15px]">
                    <div
                      className={`flex items-center justify-center px-[16px] py-[2px] text-[14px] rounded-full hover:cursor-pointer transition ${
                        topSelection === "social"
                          ? "bg-[#151A19] border-[#151A19] border-[2px]"
                          : "border-forest-500 border-[1px] "
                      }`}
                      onClick={() => {
                        setTopSelection("social");
                      }}
                    >
                      Social Media
                    </div>
                    <div
                      className={`flex items-center justify-center px-[16px] py-[2px] text-[14px] rounded-full hover:cursor-pointer transition ${
                        topSelection === "embed"
                          ? "bg-[#151A19] border-[#151A19] border-[2px]"
                          : "border-forest-500 border-[1px] "
                      }`}
                      onClick={() => {
                        setTopSelection("embed");
                      }}
                    >
                      Embed Code
                    </div>
                  </div> */}
                  {topSelection === "social" ? (
                    <div className="flex flex-col-reverse items-center mt-[30px]  text-[16px] leading-[150%] h-[234px]">
                      <div className="flex flex-col w-[285px] items-center justify-center">
                        {/* <div className="w-[251px] h-[181px]  flex items-center justify-center p-0.5 bg-forest-500 dark:bg-[#5A6462] rounded-[6px]">
                    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-forest-1000 rounded-[5px] text-[#5A6462] text-xs">
                      Image Goes Here
                    </div>
                  </div> */}
                        <div className="">
                          {/* <label className="flex items-center cursor-pointer">
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
                    </label> */}
                        </div>
                        <div className="flex p-[15px] gap-x-[10px] rounded-full w-[393px] h-[54px]  mt-[6px] relative border-[3px] items-center border-forest-500 dark:border-forest-800">
                          {/* <div className="flex w-[285px] h-[54px] p-[15px] border-[1px] border-[#CDD8D3] gap-x-[10px] items-center"> */}
                          <Icon
                            className="w-[24px] h-[24px] font-semibold"
                            icon="feather:link"
                          />
                          <div
                            className="whitespace-nowrap text-ellipsis overflow-hidden max-w-[300px] select-none"
                            onDoubleClick={() => {
                              triggerCopy();
                            }}
                          >
                            {currentURL}
                          </div>

                          <div className="ml-auto ">
                            <Icon
                              className={`absolute right-3 top-[14px] w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${
                                copied ? "opacity-0" : "opacity-100"
                              }`}
                              icon="feather:copy"
                              onClick={() => {
                                copyText(currentURL ? currentURL : "");
                                triggerCopy();
                              }}
                            />
                            <Icon
                              className={`absolute right-3 top-[14px] w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${
                                copied ? "opacity-100" : "opacity-0"
                              }`}
                              icon="feather:check"
                              onClick={() => {
                                copyText(currentURL ? currentURL : "");
                                triggerCopy();
                              }}
                            />
                          </div>
                          {/* </div> */}
                        </div>
                      </div>
                      <div className="flex flex-col gap-y-[5px]">
                        <div
                          className="flex items-center w-[393px] h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px] "
                          onClick={() => {
                            handleSendEmail();
                          }}
                        >
                          <Icon
                            className="w-[24px] h-[24px] "
                            icon="gtp:email"
                          />
                          <div className="h-[24px] leading-[150%] text-[16px]">
                            Share via Email
                          </div>
                        </div>
                        <div
                          className="flex items-center w-[393px] h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
                          onClick={() => {
                            shareOnReddit();
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
                          className="flex items-center w-[393px] h-[54px] bg-forest-500 dark:border-[#5A6462] dark:border-[3px] dark:bg-[#1F2726] hover:dark:bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
                          onClick={() => {
                            shareOnTwitter();
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
                    <div className="flex gap-x-[36px] mt-[30px] h-[234px]">
                      <div className=" p-[10px] rounded-3xl border-forest-600 border-[1px] w-[285px] h-full">
                        Embed Link Here
                      </div>
                      <div className="flex flex-col w-[204px] h-full gap-y-[5px]">
                        <div className="flex w-full justify-between">
                          <div className="text-medium">Timeframe</div>
                          <Tooltip placement="left" allowInteract>
                            <TooltipTrigger>
                              <div className="p-1 z-10 mr-0 md:-mr-0.5">
                                <Icon icon="feather:info" className="w-6 h-6" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                              <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                                <div className="flex flex-col space-y-1">
                                  <div className="font-bold text-sm leading-snug"></div>
                                  <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug"></div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex h-[28px] px-[2px] w-full bg-forest-50 justify-between items-center rounded-full">
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
                              className={`flex items-center  text-[16px] justify-between pl-[18px] pr-5 relative w-full h-6 bg-gray-200 peer-focus:outline-none rounded-full peer ${
                                isAbsolute
                                  ? "peer-checked:after:right-[98.5px] peer-checked:after:border-white"
                                  : ""
                              } after:content-[''] after:absolute after:-top-[0.5px] after:-right-[0.5px] after:bg-forest-900  after:border after:rounded-full after:h-[25px] after:w-[102.5px] after:transition-all dark:border-gray-600 `}
                            >
                              <div
                                className={`z-20 transition select-none ${
                                  isAbsolute
                                    ? "text-forest-50"
                                    : " text-forest-800"
                                }`}
                              >
                                Absolute
                              </div>
                              <div
                                className={`z-20 transition select-none ${
                                  !isAbsolute
                                    ? "text-forest-50"
                                    : " text-forest-800"
                                }`}
                              >
                                Relative
                              </div>
                            </div>
                          </label>
                        </div>

                        <div className="flex items-center gap-x-[10px] h-[54px] w-[204px] rounded-full border-[#5A6462] border-[2px] px-[15px]">
                          <Icon
                            className="w-[24px] h-[24px] font-semibold"
                            icon="gtp:arrowleftright"
                          />
                          <div className="flex items-center underline decoration-dotted decoration-2 underline-offset-[5px] ">
                            <div
                              className="outline-none"
                              contentEditable
                              onBlur={handleWidthChange}
                              style={{
                                border: "none", // Remove default border
                                boxShadow: "none", // Remove default focus box shadow
                              }}
                            >
                              {widthValue}
                              {"   "}
                            </div>
                            <span className="ml-[0.5px] italic text-[#5A6462]">
                              {" "}
                              Width
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-[10px] h-[54px] w-[204px] rounded-full border-[#5A6462] border-[2px] px-[15px]">
                          <Icon
                            className="w-[24px] h-[24px] font-semibold"
                            icon="gtp:arrowupdown"
                          />
                          <div className="flex items-center underline decoration-dotted decoration-2  underline-offset-[5px] ">
                            <div
                              className="outline-none"
                              contentEditable
                              onBlur={handleHeightChange}
                              style={{
                                border: "none", // Remove default border
                                boxShadow: "none", // Remove default focus box shadow
                              }}
                            >
                              {heightValue}
                              {"   "}
                            </div>
                            <span className="ml-[1px] italic text-[#5A6462]">
                              {" "}
                              Height
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-[10px] h-[54px] w-[204px] rounded-full border-[#5A6462] border-[3px] px-[15px]">
                          <Icon
                            className={`  w-[24px] h-[24px] font-semibold `}
                            icon="gtp:code-slash"
                          />
                          <div>{copied ? "Copied" : "Copy Code"}</div>
                          <div className="flex ml-auto relative w-[24px] -top-[10px]">
                            <Icon
                              className={`absolute  w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${
                                copied ? "opacity-0" : "opacity-100"
                              }`}
                              icon="feather:copy"
                              onClick={() => {
                                copyText(currentURL ? currentURL : "");
                                triggerCopy();
                              }}
                            />
                            <Icon
                              className={`absolute w-[22px] h-[22px] font-semibold transition-opacity duration-300 text-[#5A6462] ${
                                copied ? "opacity-100" : "opacity-0"
                              }`}
                              icon="feather:check"
                              onClick={() => {
                                copyText(currentURL ? currentURL : "");
                                triggerCopy();
                              }}
                            />
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
        </div>
      )}
    </>
  );
}
