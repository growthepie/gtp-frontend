"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

export default function SupportUsBanner() {
  const [isFirstText, setIsFirstText] = useState(true);

  // useEffect(() => {
  //   // Toggle between texts every 8 seconds
  //   const textSlideInterval = setInterval(() => {
  //     setIsFirstText((prevIsFirstText) => !prevIsFirstText);
  //   }, 8000);

  //   return () => {
  //     clearInterval(textSlideInterval);
  //   };
  // }, [isFirstText]);

  return (
    <Link
      href={
        isFirstText
          ? "https://vote.optimism.io/retropgf/3/application/0x849e164d1b8cc2b51bd3313d007ac58acb816660492336d2498615551ec75f02"
          : "https://explorer.gitcoin.co/#/round/424/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008-70"
      }
      target="_blank"
      rel="noopener"
      className={`relative flex overflow-hidden xl:hidden hard-shine items-center justify-between px-1 py-1 rounded-full text-[10px] sm:text-sm font-semibold mr-auto w-[375px] sm:w-[560px] mt-6 z-0 ${isFirstText ? "text-white bg-[#FF0420] dark:bg-[#FF0420]" : "text-black bg-color-bg-default dark:bg-[#1DF7EF]"
        }`}
    >
      <div
        className={`ml-3 mr-4 flex space-x-0.5 absolute overflow-x-visible items-center ${isFirstText
          ? "translate-x-0"
          : "translate-x-[-535px] sm:translate-x-[-665px]"
          } `}
        style={{
          transition: "transform 1s ease-in-out", // Adjust the duration and easing as needed
        }}
      >
        <Icon
          icon="fluent:megaphone-loud-32-filled"
          className={`w-4 h-4 sm:h-[23px] sm:w-[23px] z-10 mr-2`}
        />
        <div
          className="w-[800px] flex space-x-0.5 z-0 items-center"
          style={{ minWidth: 0, whiteSpace: "nowrap" }}
        >
          <div className="slide-text flex items-center pr-[200px] leading-snug">
            We&apos;re listed on Optimism&apos;s <div className="font-extrabold mx-1">RetroPGF 3</div> — Spread the word!{" "}
          </div>
          <div className="slide-text flex items-center">
            <div className="mr-0.5">We are part of Gitcoin Round 19!</div>
            <div className="animate-bounce text-sm"> 🎉</div>{" "}
            <div>Help us by donating to our project.</div>
          </div>
        </div>
      </div>
      <div className="flex-grow"></div>
      <Icon
        icon="feather:arrow-right-circle"
        className={`w-4 h-4 sm:h-[25px] sm:w-[25px] z-10`}
      />
    </Link>
  );
}
