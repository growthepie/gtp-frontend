"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import { GTPIcon } from "@/components/layout/GTPIcon";

export default function Footer({ }) {
  const { isMobile } = useUIContext();

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-50 flex flex-col justify-end overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-[#151a19]"
          style={{
            backgroundPosition: "bottom",
            maskImage: isMobile
              ? `linear-gradient(to top, white 0, white 150px, transparent 215px)`
              : `linear-gradient(to top, white 0, white 100px, transparent 180px)`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>

      <Container className="pointer-events-auto bottom-0 mx-auto w-full">
        <Container className="z-10 flex w-full items-center justify-between !px-0 pb-5 md:pb-9">
          {/* Left Side Links */}
          <div className="flex justify-center px-4 md:justify-start">
            <div className="flex flex-col items-center gap-x-4 gap-y-2 text-xs text-[#CDD8D3] md:flex-row">
              <Link
                href="/privacy-policy"
                className="underline"
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
                target="_blank"
                rel="noopener"
                aria-label="Feedback"
                onClick={() =>
                  track("click", { location: "footer", link: "feedback" })
                }
              >
                Feedback
              </Link>
              <div>© {new Date().getFullYear()} growthepie 🥧📏</div>
            </div>
          </div>

          {/* Right Side Share Button */}
          <div className="relative h-14 p-1 bg-[#33413f] rounded-[40px] flex items-center gap-4">
            <div className="absolute inset-0 z-40 w-full h-full overflow-hidden pointer-events-none rounded-full">
              <div className="w-full h-full"></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 transform -skew-x-20 animate-glint blur-sm"></div>
            </div>
            <div className="h-11 px-[15px] py-2.5 bg-[#1f2726] rounded-[40px] flex justify-start items-start gap-2.5">
              <div className="self-stretch justify-start items-center gap-2.5 inline-flex">
                <GTPIcon
                  icon="gtp-share-monochrome"
                  size="sm"
                  className="w-6 h-6 relative"
                />
                <div className="text-[#cdd8d3] text-[16px] font-['Raleway'] leading-[19.2px] text-left">
                  Share
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}
