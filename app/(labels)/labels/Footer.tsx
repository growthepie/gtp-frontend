"use client";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <Container className={"fixed w-[calc(100vw-0px)] md:w-[945px] mx-auto bottom-0"}>
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
  );
}