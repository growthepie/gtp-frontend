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
        "https://vote.optimism.io/retropgf/3/application/0x849e164d1b8cc2b51bd3313d007ac58acb816660492336d2498615551ec75f02"
      }
      target="_blank"
      rel="noopener"
      className={`hidden overflow-hidden xl:flex absolute top-[50px] items-center text-black bg-forest-100 p-1 justify-between rounded-full text-sm font-bold mr-auto dark:bg-[#FFE28A] `}
    >
      <div
        className="ml-3 mr-4 flex space-x-0.5 overflow-x-visible "
        style={{
          width: "500px", // Adjust the width as needed
        }}
      >
        <div
          className="w-[800px] flex space-x-0.5 z-0"
          style={{ minWidth: 0, whiteSpace: "nowrap" }}
        >
          <div className="mr-[200px]">
            We are listed for Retroactive Public Goods Funding. Spread the word!{" "}
          </div>
        </div>
      </div>

      <Icon
        icon="feather:arrow-right-circle"
        className={`h-6 w-6  bg-forest-100 z-10 dark:bg-[#FFE28A] `}
      />
    </Link>
  );
}
