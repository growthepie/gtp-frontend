"use client";
import Link from "next/link";

import { track } from "@vercel/analytics";
import Icon from "@/components/layout/Icon";

export default function BottomBanner() {
  return (
    <div className="relative bottom-0 bg-forest-50  dark:bg-color-bg-default">
      <div className="p-[20px] md:p-[50px] flex gap-x-[10px] items-start justify-between">
        <div className="flex flex-col gap-y-[10px] w-full md:w-auto">
          <div className="flex items-center gap-x-[10px]">
            {/* <Image
              src="/logo_pie_only.png"
              alt="GTP Pie"
              className="object-contain w-[22px] h-[24px]"
              height={24}
              width={24}
            /> */}
            <Icon icon="gtp:logo" className="w-[24px] h-[24px]" />
            <div className="text-sm leading-[1.5]">
              We are a public goods funded analytics platform.
            </div>
          </div>
          {/*desktop text*/}
          <div className="hidden md:block text-[10px] w-full leading-[1.5]">
            <div>
              If you would like to donate, please visit our{" "}
              <a
                href="https://giveth.io/project/growthepiexyz-layer-2-metrics-blockspace-analysis"
                target="_blank"
                className="underline cursor-pointer"
              >
                Giveth
              </a>{" "}
              project page.
            </div>
            <div>
              Individual links contain affiliate links, like the “Bridge”
              button, which provide us with some
            </div>
            <div>
              additional income through a revenue-share program. For more,
              please check the following links:
            </div>
          </div>
          {/*mobile text*/}
          <div className="block md:hidden text-[10px] w-full leading-[1.5]">
            <div>
              If you would like to donate, please visit our{" "}
              <a
                href="https://giveth.io/project/growthepiexyz-layer-2-metrics-blockspace-analysis"
                target="_blank"
                className="underline cursor-pointer"
              >
                Giveth
              </a>{" "}
              project page.
            </div>
            <div>
              Individual links contain affiliate links, like the “Bridge”
              button, which provide us with some additional income through a
              revenue-share program. For more, please check the following links:
            </div>
          </div>
          <div className="w-[230.87px] md:w-[362px] flex justify-between text-xs leading-[1.5]">
            <Link href="/privacy-policy" className="md:underline">
              Privacy Policy
            </Link>
            <Link href="/imprint" className="md:underline">
              Imprint
            </Link>
            <Link
              rel="noopener"
              target="_blank"
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
              onClick={() => {
                track("clicked Feedback link", {
                  location: "desktop sidebar",
                  page: window.location.pathname,
                });
              }}
              className="md:underline"
            >
              Feedback
            </Link>
            <div className="hidden md:flex">
              © {new Date().getFullYear()} growthepie 🥧📏
            </div>
          </div>
          <div className="md:hidden pt-[30px] text-xs text-center w-full">
            © {new Date().getFullYear()} growthepie 🥧📏
          </div>
        </div>
        <div className="hidden md:flex justify-end"></div>
      </div>
    </div>
  );
}
