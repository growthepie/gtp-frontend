"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import { ShareIcon } from "./Icons";

export default function Footer({ downloadCSV, downloadJSON }) {
  const { isMobile } = useUIContext();

  return (
    <div className="fixed z-50 flex flex-col justify-end top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
      <div className="relative">
        <div
          className="bg-[#151a19] -z-10 fixed inset-0 pointer-events-none"
          style={{
            backgroundPosition: "bottom",
            maskImage: isMobile
              ? "linear-gradient(to top, white 0, white 150px, transparent 215px)"
              : "linear-gradient(to top, white 0, white 80px, transparent 120px)",
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>

      <Container className="w-full mx-auto bottom-0 pointer-events-auto">
        <Container className="!px-0 flex items-center justify-between w-full pb-5 md:pb-9 z-10">
          {/* Left Side Links */}
          <div className="flex justify-center md:justify-start px-4">
            <div className="flex flex-col md:flex-row gap-x-4 gap-y-2 items-center text-xs text-[#CDD8D3]">
              <Link
                href="/privacy-policy"
                className="underline"
                target="_blank"
                rel="noopener"
                aria-label="Privacy Policy"
                onClick={() => track("click", { location: "footer", link: "privacy-policy" })}
              >
                Privacy Policy
              </Link>
              <Link
                href="/imprint"
                className="underline"
                target="_blank"
                rel="noopener"
                aria-label="Imprint"
                onClick={() => track("click", { location: "footer", link: "imprint" })}
              >
                Imprint
              </Link>
              <Link
                href="https://discord.com/channels/1070991734139531294/1095735245678067753"
                className="underline"
                target="_blank"
                rel="noopener"
                aria-label="Feedback"
                onClick={() => track("click", { location: "footer", link: "feedback" })}
              >
                Feedback
              </Link>
              <div>© {new Date().getFullYear()} growthepie 🥧📏</div>
            </div>
          </div>

          {/* Right Side Share Button */}
          <div className="flex items-center justify-center w-28 h-14 rounded-full p-1 gap-4 bg-[#344240]">
            <div className="flex items-center w-[109px] h-11 rounded-[40px] p-2.5 gap-2.5 bg-[#1F2726]">
              <div className="w-6 h-6 flex items-center justify-center text-[#CDD8D3]">
                <ShareIcon />
              </div>
              <span className="font-raleway font-bold text-sm text-[#CDD8D3]">Share</span>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}
