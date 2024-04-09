"use client";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_URLS } from "@/lib/helpers";
import { useMediaQuery } from "usehooks-ts";

const BASE_URL = BASE_URLS[process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production"];

const pathToEmbed = (pathname: string) => {
  if (pathname === "/") return `${BASE_URL}/embed/user-base`;
  return `${BASE_URL}/embed${pathname}`;
};

const showEmbed = (pathname: string | null) => {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname.includes("fundamentals/")) return true;
  return false;
};

export default function Details() {
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
      BASE_URLS[process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production"] + pathname,
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
      <div >
        <button
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-[#1F2726] rounded-full px-4 py-2"
          onClick={() => {
            setOpenShare(true);
          }}
        >
          <div className="w-5 h-5">
            <Icon className="w-5 h-5 font-semibold" icon="feather:book-open" />
          </div>
          <div className="font-semibold">Details</div>
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

            </div>
          </>
        )}
      </div>
    </>
  );
}
