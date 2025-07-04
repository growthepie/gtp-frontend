"use client";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_URLS } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";

const BASE_URL = BASE_URLS[
  process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.includes("dev-fees")
    ? "preview"
    : "production"
];

const pathToEmbed = (pathname: string) => {
  if (pathname === "/") return `${BASE_URL}/embed/user-base`;
  return `${BASE_URL}/embed${pathname}`;
};

const showEmbed = (pathname: string | null) => {
  if (!pathname) return false;

  if (BASE_URL.includes("fees.")) {
    if (pathname === "/") return false;
  } else {
    if (pathname === "/") return true;
    if (pathname.includes("fundamentals/")) return true;
  }

  return false;
};

export default function Embed() {
  const pathname = usePathname();
  const [openShare, setOpenShare] = useState(false);
  const [currentURL, setcurrentURL] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  function copyText(entryText) {
    navigator.clipboard.writeText(entryText);
  }

  const [isReadOnlyInput, setIsReadOnlyInput] = useState(true);

  //Initialize URL
  useEffect(() => {
    setcurrentURL(
      BASE_URL + pathname,
    );
  }, [pathname]);

  function triggerCopy() {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000); // 3000 milliseconds (3 seconds)
  }

  if (!showEmbed(pathname)) return null;

  return (
    <>
      <div>
        <button
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-[#1F2726] rounded-full px-4 py-2"
          onClick={() => {
            setOpenShare(true);
          }}
        >
          <div className="w-5 h-5">
            <Icon className="w-5 h-5 font-semibold" icon="feather:code" />
          </div>
          <div className="font-semibold">Embed</div>
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
              className="absolute -right-[5px] -bottom-[5px] w-96 max-w-lg bg-forest-50 dark:bg-[#1F2726] z-[110] rounded-[40px] shadow-lg p-[20px] 
          border-[5px] border-forest-500 dark:border-[#5A6462]"
            >
              <div className="flex w-full h-[32px] justify-between items-center justify-self-start ">
                <div className="flex items-center gap-x-[10px]">
                  <Icon
                    className="w-[24px] h-[24px] font-semibold"
                    icon="feather:code"
                  />
                  <div className="font-bold text-[24px]">Embed</div>
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
              <div className="flex flex-col mt-[15px] text-[16px] leading-[150%]">
                <div>
                  Use the code below to embed the chart on your own website.
                </div>
              </div>
              <div className="flex mt-[15px] text-[16px] leading-[150%] ">
                <textarea
                  readOnly
                  className="w-full rounded-2xl overflow-y-none h-32 resize-none p-3 focus:outline-none"
                >
                  {`<iframe width="950" height="950" src="${pathToEmbed(
                    pathname ?? "",
                  )}" title="growthepie.com"></iframe>`}
                </textarea>
              </div>
              <div className="flex mt-[15px]">
                <button
                  className="flex gap-x-2 items-center justify-center w-full rounded-full overflow-y-none h-12 resize-none p-3 bg-forest-500 dark:bg-[#5A6462] text-white hover:bg-forest-600 dark:hover:bg-[#6C7674]"
                  onClick={() => {
                    copyText(
                      `<iframe width="950" height="950" src="${pathToEmbed(
                        pathname ?? "",
                      )}" title="growthepie.com"></iframe>`,
                    );
                    triggerCopy();
                  }}
                >
                  <Icon
                    className="w-[24px] h-[24px] right-[15px] top-[15px] hover:cursor-pointer"
                    icon={copied ? "feather:check" : "feather:copy"}
                    onClick={() => {
                      copyText(currentURL ? currentURL : "");
                      triggerCopy();
                    }}
                  />
                  Copy Code
                </button>
              </div>

              {/*Top Row X */}
            </div>
          </>
        )}
      </div>
    </>
  );
}
