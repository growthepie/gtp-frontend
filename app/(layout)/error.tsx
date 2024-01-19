"use client"; // Error components must be Client Components

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { navigationItems } from "@/lib/navigation";

const Error = ({
  error,
  reset,
  message,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  message?: string | void;
}) => {
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [pageGroup, setPageGroup] = useState<string | null>(null);
  const [navIndex, setNavIndex] = useState<number | null>(null);
  const [randIndices, setRandIndices] = useState<number[] | null>(null);

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
    const getRandomInt = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
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
      {navIndex ? (
        <div className="flex flex-col items-center justify-center w-full h-[80vh] gap-y-[15px]">
          <div
            className={`flex flex-col w-[587px]  bg-[#1F2726] border-forest-400  rounded-[40px] p-[30px] gap-y-[15px] ${
              navIndex === 1 || navIndex === 3 ? "h-[579px]" : "h-[519px]"
            }`}
          >
            <div className="flex items-center gap-x-[10px]">
              <Icon icon="gtp:error" className="w-[24px] h-[25px]" />
              <div className="h-[32px] text-[24px] font-bold leading-[133%]">
                Something went wrong...
              </div>
            </div>
            <div className="text-[16px] leading-[150%]">
              The page you requested currently has some issues and our devs have
              been notified. We can recommend checking out one of these pages:
            </div>
            <div className="flex flex-col gap-y-[5px]">
              <Link
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`/`}
              >
                <Icon icon="gtp:house" className="w-[24px] h-[24px]" />
                <div className="text-[16px] leading-[150%]">Home</div>
              </Link>
              <div className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]">
                <Icon
                  icon={navigationItems[navIndex]["icon"]}
                  className="w-[24px] h-[24px]"
                />
                <div className="text-[16px] leading-[150%]">
                  {navigationItems[navIndex]["label"] +
                    (navIndex === 1 || navIndex === 3 ? " Metrics" : "")}
                </div>
              </div>
              {randIndices &&
                randIndices.map((index) => (
                  <Link
                    key={index}
                    className="flex self-center items-center p-[15px] w-[250px] ml-[49px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
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
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`https://docs.growthepie.xyz/`}
              >
                <Icon icon="gtp:book-open" className="w-[24px] h-[24px]" />
                <div className="text-[16px] leading-[150%]">Knowledge</div>
              </a>
              <Link
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`/optimism-retropgf-3`}
              >
                <Icon
                  icon="gtp:optimism-logo-monochrome"
                  className="w-[24px] h-[24px] text-[#FF0420] bg-white rounded-full"
                />
                <div className="text-[16px] leading-[150%]">RPGF3 Tracker</div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-[80vh] gap-y-[15px]">
          <div
            className={`flex flex-col w-[587px]  bg-[#1F2726] border-forest-400  rounded-[40px] p-[30px] gap-y-[15px] ${
              navIndex === 1 || navIndex === 3 ? "h-[579px]" : "h-[519px]"
            }`}
          >
            <div className="flex items-center gap-x-[10px]">
              <Icon icon="gtp:error" className="w-[24px] h-[25px]" />
              <div className="h-[32px] text-[24px] font-bold leading-[133%]">
                Something went wrong...
              </div>
            </div>
            <div className="text-[16px] leading-[150%]">
              The page you requested currently has some issues and our devs have
              been notified. We can recommend checking out one of these pages:
            </div>
            <div className="flex flex-col gap-y-[5px]">
              <Link
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`/`}
              >
                <Icon icon="gtp:house" className="w-[24px] h-[24px]" />
                <div className="text-[16px] leading-[150%]">Home</div>
              </Link>

              <a
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`https://docs.growthepie.xyz/`}
              >
                <Icon icon="gtp:book-open" className="w-[24px] h-[24px]" />
                <div className="text-[16px] leading-[150%]">Knowledge</div>
              </a>
              <a
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`https://mirror.xyz/blog.growthepie.eth`}
              >
                <Icon icon="gtp:blog" className="w-[25px] h-[25px]" />
                <div className="text-[16px] leading-[150%]">Blog</div>
              </a>

              <Link
                className="flex self-center items-center p-[15px] w-[299px] h-[54px] bg-[#5A6462] rounded-full gap-x-[10px]"
                href={`/optimism-retropgf-3`}
              >
                <Icon
                  icon="gtp:optimism-logo-monochrome"
                  className="w-[24px] h-[24px] text-[#FF0420] bg-white rounded-full"
                />
                <div className="text-[16px] leading-[150%]">RPGF3 Tracker</div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

Error.getInitialProps = ({ res, err, asPath }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, originalUrl: asPath };
};

export default Error;
