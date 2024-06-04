"use client";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <div className="flex flex-col justify-end fixed left-0 right-0 bottom-0 h-[120px] overflow-hidden"
      style={{
        maskImage: `linear-gradient(to top, white 0, white 80px, transparent 120px`,
      }}
    >
      <div className="background-container top-0 bottom-0">
        <div className="background-gradient-group">
          <div className="background-gradient-yellow"></div>
          <div className="background-gradient-green"></div>
        </div>
      </div>
      <Container className={"w-full mx-auto bottom-0"}>

        <Container className={`!px-0 flex items-center justify-start w-full pb-[37px] z-[10]`}>
          <div className="px-[15px]">
            <div className="flex gap-x-[15px] items-center text-xs text-[#CDD8D3] dark:text-[#CDD8D3]">
              <Link href="/privacy-policy" className="underline" passHref target="_blank" rel="noopener" aria-label="Privacy Policy" onClick={() => track("click", { location: "footer", link: "privacy-policy" })}>
                Privacy Policy
              </Link>
              <Link href="/imprint" className="underline" passHref target="_blank" rel="noopener" aria-label="Imprint" onClick={() => track("click", { location: "footer", link: "imprint" })}>
                Imprint
              </Link>
              <Link href="https://discord.com/channels/1070991734139531294/1095735245678067753" className="underline" passHref target="_blank" rel="noopener" aria-label="Feedback" onClick={() => track("click", { location: "footer", link: "feedback" })}>
                Feedback
              </Link>
              <div className="">
                © {new Date().getFullYear()} growthepie 🥧📏
              </div>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}