"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useMediaQuery } from "usehooks-ts";
import Share from "@/components/Share";

export default function Footer({
  showCents,
  setShowCents,
  hoverSettings,
  setHoverSettings,
}: {
  showCents: boolean;
  setShowCents: React.Dispatch<React.SetStateAction<boolean>>;
  hoverSettings: boolean;
  setHoverSettings: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return (
    <Container
      className={`fixed flex w-[calc(100vw-0px)] md:w-[945px] mx-auto  ${
        isMobile ? "flex-col-reverse bottom-1" : "flex-col bottom-0"
      }`}
    >
      <Container
        className={`!px-0 flex items-center justify-start w-full z-[10] ${
          isMobile ? "pb-[2px]" : "pb-[37px]"
        }`}
      >
        <div className="px-[15px]">
          <div
            className={`flex items-center text-xs text-[#CDD8D3] dark:text-[#CDD8D3] ${
              isMobile ? "gap-x-[5px]" : " gap-x-[15px]"
            }`}
          >
            <Link
              href="/privacy-policy"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Privacy Policy"
              onClick={() =>
                track("click", { location: "footer", link: "privacy-policy" })
              }
            >
              Privacy Policy
            </Link>
            <Link
              href="/imprint"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Imprint"
              onClick={() =>
                track("click", { location: "footer", link: "imprint" })
              }
            >
              Imprint
            </Link>
            <Link
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Feedback"
              onClick={() =>
                track("click", { location: "footer", link: "feedback" })
              }
            >
              Feedback
            </Link>
            <div className="">© {new Date().getFullYear()} growthepie 🥧📏</div>
          </div>
        </div>
      </Container>
      {isMobile && (
        <div className={`w-[100%] px-1 mb-2`}>
          <div className="relative flex p-[5px] items-center w-[100%] justify-between rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
            <a
              className="flex items-center w-[44px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
              href="https://www.growthepie.xyz/"
              target="_blank"
            >
              <div className="w-6 h-6">
                <Icon icon="gtp:house" className="h-6 w-6" />
              </div>
            </a>
            <div className="flex items-center  gap-x-[10px]">
              <div
                className={`flex items-center relative w-[44px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-[10px] py-[10px] gap transition-all z-20 duration-300 ${
                  hoverSettings
                    ? "w-[308px] justify-start"
                    : "w-[128px] justify-start"
                }`}
                onClick={() => {
                  setHoverSettings(!hoverSettings);
                }}
              >
                <Icon
                  icon="gtp:gtp-settings"
                  className={`h-6 w-6 ${hoverSettings ? "text-sm" : ""}`}
                />
              </div>

              <Share />
            </div>

            <div
              className={`absolute bottom-6 bg-[#151A19] right-[125px] rounded-2xl z-10 transition-all duration-[290ms] overflow-hidden px-2 ${
                hoverSettings
                  ? "w-[208px] h-[83px] shadow-[0px_4px_46.2px_0px_#000000] "
                  : "w-[0px] h-[10px] shadow-transparent"
              }`}
              onMouseEnter={() => {
                setHoverSettings(true);
              }}
              onMouseLeave={() => {
                setHoverSettings(false);
              }}
            >
              <div className={`mt-[20px] flex flex-col relative `}>
                <div className="flex flex-col items-center mx-2 w-full gap-x-[5px] absolute min-w-[280px]">
                  <div className="flex gap-x-[10px] w-full items-center">
                    <Icon
                      icon="gtp:gtp-dollar"
                      className={`h-[15px] w-[15px] mt-1 font-[900] text-[#CDD8D3] relative -top-[3px] ${
                        hoverSettings ? "text-sm" : ""
                      }`}
                    />
                    <div className="text-[10px] text-white">Denominates in</div>
                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                  </div>
                  <div className="w-full ">
                    <div
                      className="relative w-[143px] h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                      onClick={() => {
                        setShowCents(!showCents);
                      }}
                    >
                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px] ">
                        <div className="w-full flex items-start justify-center">
                          Full Dollar
                        </div>
                        <div
                          className={`w-full text-center ${
                            !showCents && "opacity-50"
                          }`}
                        >
                          USD cents
                        </div>
                      </div>
                      <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                        <div
                          className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                          style={{
                            transform: !showCents
                              ? "translateX(0%)"
                              : "translateX(100%)",
                          }}
                        >
                          {!showCents ? "Full Dollar" : "USD cents"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
