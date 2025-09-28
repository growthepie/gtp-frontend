"use client";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
import Search from "./Search";
import FloatingBar from "./FloatingBar";
import LabelsContainer from "@/components/layout/LabelsContainer";
import OLIIcon from "@/public/logo-open-labels-initiative.svg";
import Image from "next/image";

export default function Footer({
  downloadCSV,
  downloadJSON,
}: {
  downloadCSV: () => void;
  downloadJSON: () => void;
}) {
  const { isMobile } = useUIContext();
  return (
    <div className="fixed z-50 flex flex-col justify-end top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
      <div className="relative">
        <div
          className="bg-color-ui-active -z-10 fixed inset-0 pointer-events-none"
          style={{
            backgroundPosition: "bottom",
            maskImage: isMobile ? `linear-gradient(to top, white 0, white 150px, transparent 215px` : `linear-gradient(to top, white 0, white 80px, transparent 120px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <LabelsContainer className={`absolute bottom-[105px] w-full block z-[60]`}>
        {isMobile && <FloatingBar downloadCSV={downloadCSV} downloadJSON={downloadJSON} />}
      </LabelsContainer>
      <Container className={"w-full mx-auto bottom-0 pointer-events-auto"}>
        <Container className={`!px-0 flex items-center justify-start w-full pb-[20px] md:pb-[37px] z-[10]`}>
          <div className="flex justify-center md:justify-start px-[15px] w-full">
            <div className="flex flex-col md:flex-row gap-x-[15px] gap-y-[10px] items-center text-[10px] text-color-text-primary dark:text-color-text-primary">
              <div className="flex gap-x-[15px] items-center text-[10px] text-color-text-primary dark:text-color-text-primary">
                <Link href="/privacy-policy" className="underline" passHref target="_blank" rel="noopener" aria-label="Privacy Policy" onClick={() => track("click", { location: "footer", link: "privacy-policy" })}>
                  Privacy Policy
                </Link>
                <Link href="/imprint" className="underline" passHref target="_blank" rel="noopener" aria-label="Imprint" onClick={() => track("click", { location: "footer", link: "imprint" })}>
                  Imprint
                </Link>
                <Link href="https://discord.com/channels/1070991734139531294/1095735245678067753" className="underline" passHref target="_blank" rel="noopener" aria-label="Feedback" onClick={() => track("click", { location: "footer", link: "feedback" })}>
                  Feedback
                </Link>
              </div>
              <div className="">
                © {new Date().getFullYear()} growthepie 🥧📏
              </div>
              <Link href="https://github.com/openlabelsinitiative/OLI" passHref target="_blank" rel="noopener" aria-label="Feedback" onClick={() => track("click", { location: "footer", link: "feedback" })} className="relative flex text-[8px] gap-x-1 items-center">
                powered by
                {/* <OLIIcon /> */}
                <Image src={OLIIcon.src} alt="OLI" width="105" height="15"  />
              </Link>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}
