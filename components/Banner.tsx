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
    <Link
      href={
        isFirstText
          ? "https://vote.optimism.io/retropgf/3/application/0x849e164d1b8cc2b51bd3313d007ac58acb816660492336d2498615551ec75f02"
          : "https://explorer.gitcoin.co/#/round/424/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008/0xd4cc0dd193c7dc1d665ae244ce12d7fab337a008-70"
      }
      target="_blank"
      rel="noopener"
      className={`hidden overflow-hidden xl:flex absolute top-[50px] items-center dark:bg-[#FFE28A]  text-black bg-forest-100 p-1 justify-between rounded-full text-sm font-bold mr-auto ${
        isFirstText ? "dark:bg-[#FFE28A]" : "dark:bg-[#1DF7EF]"
      }`}
    >
      <div
        className="ml-3 mr-4 flex space-x-0.5 overflow-x-visible"
        style={{
          width: "500px", // Adjust the width as needed
          transition: "transform 1s ease-in-out", // Adjust the duration and easing as needed
          transform: `translateX(${isFirstText ? "0%" : "-665px"})`,
        }}
      >
        <div
          className="w-[800px] flex space-x-0.5 z-0"
          style={{ minWidth: 0, whiteSpace: "nowrap" }}
        >
          <div className="slide-text mr-[200px]">
            We are listed for Retroactive Public Goods Funding. Spread the word!{" "}
          </div>
          <div className="slide-text flex ">
            <div className="mr-1.5">We are part of Gitcoin Round 19!</div>
            <div className="animate-bounce text-sm"> 🎉</div>{" "}
            <div>Help us by donating to our project.</div>
          </div>
        </div>
      </div>

      <Icon
        icon="feather:arrow-right-circle"
        className={`h-6 w-6  bg-forest-100 z-10 ${
          isFirstText ? "dark:bg-[#FFE28A]" : "dark:bg-[#1DF7EF]"
        }`}
      />
    </Link>
  );
}
