"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function Banner() {
  const [isFirstText, setIsFirstText] = useState(true);

  useEffect(() => {
    // Toggle between texts every 8 seconds
    const textSlideInterval = setInterval(() => {
      setIsFirstText((prevIsFirstText) => !prevIsFirstText);
    }, 8000);

    return () => {
      clearInterval(textSlideInterval);
    };
  }, []);

  return (
    <>
      <Link
        href={
          "https://vote.optimism.io/retropgf/3/application/0x849e164d1b8cc2b51bd3313d007ac58acb816660492336d2498615551ec75f02"
        }
        target="_blank"
        rel="noopener"
        className={`hidden overflow-hidden xl:flex absolute top-[50px] hard-shine items-center p-1 justify-between rounded-full text-sm font-semibold mr-auto text-white bg-[#FF0420] dark:bg-[#FF0420]`}
      >
        <Icon
          icon="fluent:megaphone-loud-32-filled"
          className={`h-[23px] w-[23px] z-10 ml-2.5`}
        />
        <div className="ml-3 mr-4 flex space-x-0.5 overflow-x-visible items-center">
          <div className="pr-[50px] leading-snug">
            We're listed on <span className="font-extrabold">RetroPGF 3</span> — Spread the word!{" "}
          </div>
        </div>

        <Icon
          icon="feather:arrow-right-circle"
          className={`h-[25px] w-[25px]`}
        />
      </Link>
    </>
  );
}
