"use client";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function Share() {
  const [openShare, setOpenShare] = useState(false);
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  //Initialize URL
  useEffect(() => {
    setcurrentURL(window.location.href);
  }, []);

  return (
    <>
      <button
        className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
        onClick={() => {
          setOpenShare(true);
        }}
      >
        <Icon className="w-5 h-5 font-semibold" icon="fe:share" />
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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[579px] h-[436px] bg-forest-50 dark:bg-forest-900 z-[110] rounded-2xl shadow-lg py-[30px] px-[30px] 
          border-[5px] border-[#5A6462]"
          >
            <div className="flex w-full h-[32px] justify-between items-center justify-self-start ">
              <div className="flex items-center gap-x-[10px]">
                <Icon
                  className="w-[24px] h-[24px] font-semibold"
                  icon="fe:share"
                />
                <div className="font-bold text-[24px]">Share</div>
              </div>
              <div
                className="w-8 h-8 flex items-center justify-center hover:bg-forest-800 bg-transparent rounded-full hover:cursor-pointer"
                onClick={() => {
                  setOpenShare(false);
                }}
              >
                <Image
                  src="/FiCircleX.svg"
                  width={24}
                  height={24}
                  alt="Exit"
                  className="text-forest-900"
                />
              </div>
            </div>
            <div className="flex flex-col mt-[15px] text-[16px] leading-[150%]">
              <div>Share this page on your social media channels.</div>
            </div>
            <div className="flex mt-[15px] text-[16px] leading-[150%] ">
              <div className="flex flex-col w-[285px] items-center justify-center">
                <div className="w-[247px] h-[177px] flex items-center justify-center bg-white">
                  Image Goes Here
                </div>
                <div className="mt-[10px]">
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
                </div>
                <div className="mt-[15px]">
                  <div className="flex w-[285px] h-[54px] p-[15px] border-[1px] border-[#CDD8D3] rounded-full gap-x-[10px] items-center">
                    <input
                      type="text"
                      value={currentURL ? currentURL : ""}
                      className="w-[85%] bg-transparent border-none text-sm h-[24px] overflow-hidden whitespace-nowrap overflow-ellipsis"
                    />
                    {copied ? (
                      <Icon className="w-[24px] h-[24px] " icon="fe:check" />
                    ) : (
                      <Image
                        src="/FiCopy.svg"
                        width={24}
                        height={24}
                        alt="Exit"
                        className="text-forest-900 hover:cursor-pointer"
                        onClick={() => {
                          copyText(currentURL);
                          triggerCopy();
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col ml-[20px] gap-y-[5px] ">
                <div
                  className="flex w-[204px] h-[54px] bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
                  onClick={() => {
                    handleSendEmail();
                  }}
                >
                  <Icon className="w-[24px] h-[24px] " icon="gtp:email" />
                  <div className="h-[24px] leading-[150%] text-[16px]">
                    Share via Email
                  </div>
                </div>
                <div
                  className="flex w-[204px] h-[54px] bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
                  onClick={() => {
                    shareOnReddit();
                  }}
                >
                  <Icon className="w-[24px] h-[24px] " icon="gtp:reddit" />
                  <div className="h-[24px] leading-[150%] text-[16px]">
                    Share on Reddit
                  </div>
                </div>
                <div className="flex w-[204px] h-[54px] bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]">
                  <Icon className="w-[24px] h-[24px] " icon="gtp:lens" />
                  <div className="h-[24px] leading-[150%] text-[16px]">
                    Share on Lens
                  </div>
                </div>
                <div className="flex w-[204px] h-[54px] bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]">
                  <Icon className="w-[24px] h-[24px] " icon="gtp:farcaster" />
                  <div className="h-[24px] leading-[150%] text-[16px]">
                    Share on Farcaster
                  </div>
                </div>
                <div
                  className="flex w-[204px] h-[54px] bg-[#5A6462] p-[15px] rounded-full cursor-pointer gap-x-[10px]"
                  onClick={() => {
                    shareOnTwitter();
                  }}
                >
                  <Icon className="w-[24px] h-[24px] " icon="pajamas:twitter" />
                  <div className="h-[24px] leading-[150%] text-[16px]">
                    Share on X
                  </div>
                </div>
              </div>
            </div>

            {/*Top Row X */}
          </div>
        </>
      )}
    </>
  );
}
