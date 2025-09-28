"use client"; // Error components must be Client Components

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { navigationItems as navItemsWithoutChains } from "@/lib/navigation";
import { useMediaQuery } from "usehooks-ts";
import { track } from "@vercel/analytics";
import { useMaster } from "@/contexts/MasterContext";

const Error = ({
  header,
  subheader,
}: {
  header: string;
  subheader: string;
}) => {
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [pageGroup, setPageGroup] = useState<string | null>(null);
  const [navIndex, setNavIndex] = useState<number | null>(null);
  const [randIndices, setRandIndices] = useState<number[] | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { ChainsNavigationItems } = useMaster();

  const [navigationItems, setNavigationItems] = useState<any[]>([]);

  useEffect(() => {
    if (ChainsNavigationItems) {
      // insert chains navigation items as item 3 in the navigation items array
      const navItems = [...navItemsWithoutChains];
      navItems.splice(3, 0, ChainsNavigationItems);
      setNavigationItems(navItems);
    }
  }, [ChainsNavigationItems]);

  function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randIntegers(
    length: number,
    range: [number, number],
    rerollIndices: number[] = [],
  ): number[] {
    let indices: number[] = [];

    while (indices.length < length) {
      const randomIndex = getRandomInt(range[0], range[1]);

      if (
        !indices.includes(randomIndex) &&
        !rerollIndices.includes(randomIndex)
      ) {
        indices.push(randomIndex);
      }
    }

    return indices.sort((a, b) => a - b);
  }

  useEffect(() => {
    setCurrentURL(window.location.href);
    let url = window.location.href;

    track("500 Error", {
      location: "500 Error",
      page: window.location.pathname,
    });

    if (url.includes("fundamentals")) {
      setPageGroup("fundamentals");
      setNavIndex(1);
      setRandIndices(randIntegers(3, [0, 7]));
    } else if (url.includes("chains")) {
      setPageGroup("chains");
      setNavIndex(3);
      setRandIndices(randIntegers(3, [0, 13], [10, 11, 12]));
    } else if (url.includes("blockspace")) {
      setPageGroup("blockspace");
      setNavIndex(2);
      setRandIndices([0, 1]);
    } else {
      setPageGroup("Other");
    }
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full mt-[85px] md:mt-[125px] -mb-[100px] gap-y-[15px]">
        <div
          className={`flex flex-col bg-color-bg-default border-forest-400 rounded-[40px] p-[30px] gap-y-[15px] 
          ${navIndex === 1 || navIndex === 3 ? "h-[579px]" : "h-[519px]"} ${
            isMobile ? "w-[95%]" : "w-[587px]"
          }`}
        >
          <div className="flex items-center gap-x-[10px]">
            <Icon icon="gtp:error" className="w-[24px] h-[25px]" />
            <div
              className={` font-bold leading-[133%] ${
                isMobile ? "h-[28px] text-[20px]" : "h-[32px] text-[24px]"
              }`}
            >
              {header}
            </div>
          </div>
          <div className="text-[15px] leading-[150%]">{subheader}</div>
          <div className="flex flex-col gap-y-[5px]">
            <Link
              className={`flex self-center items-center p-[15px] w-[299px]  bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px]
              ${isMobile ? "h-[50px]" : "h-[54px]"}`}
              href={`/`}
            >
              <Icon icon="gtp:house" className="w-[24px] h-[24px]" />
              <div className="text-[16px] leading-[150%]">Home</div>
            </Link>
            {randIndices && navIndex && (
              <Link
                className={`flex self-center items-center p-[15px] w-[299px]  bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px] hover:cursor-pointer ${
                  isMobile ? "h-[50px]" : "h-[54px]"
                }`}
                href={`/${pageGroup}/${
                  navigationItems[navIndex]["options"][randIndices[0]]["urlKey"]
                }`}
              >
                <Icon
                  icon={navigationItems[navIndex]["icon"]}
                  className="w-[24px] h-[24px]"
                />
                <div className="text-[16px] leading-[150%]">
                  {navigationItems[navIndex]["label"] +
                    (navIndex === 1 || navIndex === 3 ? " Metrics" : "")}
                </div>
              </Link>
            )}
            {randIndices &&
              navIndex &&
              randIndices.map((index) => (
                <Link
                  key={index}
                  className={`flex self-center items-center p-[15px] w-[250px]  bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px] ${
                    isMobile ? "h-[50px]" : "h-[54px]"
                  }`}
                  href={`/${pageGroup}/${navigationItems[navIndex]["options"][index]["urlKey"]}`}
                >
                  <Icon
                    icon={navigationItems[navIndex]["options"][index]["icon"]}
                    className="w-[24px] h-[24px]"
                  />
                  {navigationItems[navIndex]["options"][index]["label"]}
                </Link>
              ))}
            <a
              className={`flex self-center items-center p-[15px] w-[299px] bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px] ${
                isMobile ? "h-[50px]" : "h-[54px]"
              }`}
              href={`https://docs.growthepie.xyz/`}
            >
              <Icon icon="gtp:book-open" className="w-[24px] h-[24px]" />
              <div className="text-[16px] leading-[150%]">Knowledge</div>
            </a>
            {!navIndex && (
              <a
                className={`flex self-center items-center p-[15px] w-[299px]  bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px] ${
                  isMobile ? "h-[50px]" : "h-[54px]"
                }`}
                href={`https://mirror.xyz/blog.growthepie.eth`}
              >
                <Icon icon="gtp:blog" className="w-[25px] h-[25px]" />
                <div className="text-[16px] leading-[150%]">Blog</div>
              </a>
            )}
            <Link
              className={`flex self-center items-center p-[15px] w-[299px]  bg-color-bg-default hover:bg-color-ui-hover border-[3px] border-[#5A6462] rounded-full gap-x-[10px] ${
                isMobile ? "h-[50px]" : "h-[54px]"
              }`}
              href={`/trackers/optimism-retropgf-3`}
            >
              <Icon
                icon="gtp:optimism-logo-monochrome"
                className={` text-[#FF0420] bg-white rounded-full 
                 h-[24px] w-[24px]
                `}
              />
              <div className="text-[16px] leading-[150%]">RPGF3 Tracker</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

Error.getInitialProps = ({ res, err, asPath }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, originalUrl: asPath };
};

export default Error;
