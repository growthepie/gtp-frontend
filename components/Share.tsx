"use client";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export default function Share() {
  const [openShare, setOpenShare] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  function copyText(entryText) {
    navigator.clipboard.writeText(entryText);
  }

  const handleSendEmail = () => {
    if (currentUrl !== null) {
      const mailtoLink = `mailto:${""}?subject=${encodeURIComponent(
        "GrowThePie",
      )}&body=${encodeURIComponent(currentUrl)}`;
      window.location.href = mailtoLink;
    }
  };

  const shareOnTwitter = () => {
    const text = "Share";
    if (currentUrl !== null) {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        currentUrl,
      )}&text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, "_blank");
    }
  };

  const shareOnReddit = () => {
    if (currentUrl !== null) {
      const title = "Share";
      const redditShareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
        currentUrl,
      )}&title=${encodeURIComponent(title)}`;
      window.open(redditShareUrl, "_blank");
    }
  };

  //Initialize URL
  useEffect(() => {
    setCurrentUrl(window.location.href);
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
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-forest-50 dark:bg-forest-900 z-[110] rounded-2xl py-6 px-6 shadow-lg">
            <div className="flex w-full h-[10px] justify-self-start justify-between items-center">
              <div className="font-semibold">Share</div>
              <Icon
                className="w-6 h-6 font-semibold hover:cursor-pointer"
                icon="fe:close"
                onClick={() => {
                  setOpenShare(false);
                }}
              />
            </div>

            <div className="mt-[7.5%] flex flex-col gap-y-4">
              <div className="flex justify-evenly">
                <div
                  className="flex flex-col justify-center items-center hover:cursor-pointer"
                  onClick={() => {
                    handleSendEmail();
                  }}
                >
                  <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-forest-50">
                    <Icon icon="fe:mail" className="w-8 h-8 text-forest-900" />
                  </div>
                  <div className="pt-1"> Email </div>
                </div>
                <div
                  className="flex flex-col justify-center items-center hover:cursor-pointer"
                  onClick={() => {
                    shareOnTwitter();
                  }}
                >
                  <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-black">
                    <Icon
                      icon="akar-icons:x-fill"
                      className="w-8 h-8 text-white"
                    />
                  </div>
                  <div className="pt-1"> Twitter </div>
                </div>

                <div
                  className="flex flex-col justify-center items-center hover:cursor-pointer"
                  onClick={() => {
                    shareOnReddit();
                  }}
                >
                  <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-[#FF5700]">
                    <Icon
                      icon="dashicons:reddit"
                      className="w-8 h-8 text-white"
                    />
                  </div>
                  <div className="pt-1"> Reddit </div>
                </div>

                <div className="w-[86px] h-[86px] rounded-full bg-red-400">
                  Link
                </div>
                <div className="w-[86px] h-[86px] rounded-full bg-red-400">
                  Link
                </div>
              </div>
              <div className="flex justify-evenly"></div>
            </div>
            {/*Top Row X */}
          </div>
        </>
      )}
    </>
  );
}
