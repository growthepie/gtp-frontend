"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import { ShareIcon } from "./Icons";

export default function Footer({ downloadCSV, downloadJSON }) {
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
          <div className="flex h-14 w-28 items-center justify-center gap-4 rounded-full bg-[#344240] p-1">
            <div className="flex h-11 w-[109px] items-center gap-2.5 rounded-[40px] bg-[#1F2726] p-2.5">
              <div className="flex h-6 w-6 items-center justify-center text-[#CDD8D3]">
                <ShareIcon />
              </div>
              <span className="font-raleway text-sm font-bold text-[#CDD8D3]">
                Share
              </span>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}
