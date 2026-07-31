"use client";
import Link from "next/link";
import Icon from "./Icon";
import { track } from "@/lib/tracking";
import XIcon from "@/icons/footer/X.svg";
import DonateIcon from "@/icons/footer/GTP-Donate.svg";
import BlogIcon from "@/icons/footer/GTP-Blog.svg";
import KnowledgeIcon from "@/icons/footer/GTP-Book-Open.svg";
import APIIcon from "@/icons/footer/GTP-File-Text.svg";
import GithubIcon from "@/icons/footer/Github.svg";
import ContributorsIcon from "@/icons/footer/GTP-Compass.svg";
import FeedbackIcon from "@/icons/footer/GTP-Donate-1.svg";
import Image from "next/image";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export default function Footer() {
  return (
    <div className="relative bottom-0 bg-color-bg-default px-[20px] pt-[50px] pb-[150px] md:p-[50px] md:pb-[100px]">
      <div className="flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col md:justify-start md:gap-y-[25px] md:flex-wrap min-[1270px]:h-[350px] min-[1270px]:gap-y-[14px] md:basis-[176px] min-[1270px]:basis-[361px]">
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              MORE CONTENT
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-quick-bites" size="md" />}
              label="Quick Bites"
              href="/quick-bites"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-book-open" size="md" />}
              label="Knowledge"
              href="https://docs.growthepie.com/"
            />
            {/* <FooterLink
              leftIcon={<Image src={BlogIcon} alt="Blog" width={24} height={24} />}
              label="Blog"
              href="https://mirror.xyz/blog.growthepie.eth"
            /> */}
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-growthepie-fees" size="md" />}
              label="Fees"
              href="https://fees.growthepie.com/"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-growthepie-labels" size="md" />}
              label="Labels"
              href="https://labels.growthepie.com/"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-growthepie-icons" size="md" />}
              label="Icons"
              href="https://icons.growthepie.com/"
            />
          </div>
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              TECHNICAL DOCS
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<Image src={APIIcon} alt="API" width={24} height={24} />}
              label="API"
              href="https://docs.growthepie.com/api-reference/api"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="github-monochrome" size="md" className="text-color-text-primary" />}
              label="Github"
              href="https://www.github.com/growthepie"
            />
          </div>
          {/* single column (<md) and 3 column (>=1270px) layouts: Community sits with the other link sections */}
          <CommunitySection className="flex w-[176px] md:hidden min-[1270px]:flex" />
        </div>
        {/* 2 column layout (md to 1270px): grow and pad-left so the auto margins below can centre the About column between More Content and the text block */}
        <div className="flex flex-col md:flex-row gap-y-[25px] md:gap-x-[30px] md:flex-1 md:pl-[30px] min-[1270px]:flex-initial min-[1270px]:pl-0">
          <div className="flex flex-col md:w-[170px] md:mx-auto min-[1270px]:mx-0">
            <FooterSectionHeader>
              ABOUT
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-compass" size="md" />}
              label="Contributors"
              href="/contributors"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-donate" size="md" />}
              label="Donate"
              href="/donate"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-feedback" size="md" />}
              label="Feedback"
              href="mailto:contact@growthepie.com"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-growthepie-logo" size="md" />}
              label="Brand Guide"
              href="https://api.growthepie.com/brand/growthepie_brand_guide.zip"
            />
            {/* 2 column layout (md to 1270px): Community moves under About */}
            <CommunitySection className="hidden md:flex md:w-full md:mt-[69px] min-[1270px]:hidden" />
          </div>
          <div className="md:pt-[35px] flex flex-col gap-y-[15px] justify-between md:max-w-[400px]">
            <div className="flex flex-col gap-y-[15px]">
              <div className="flex items-center gap-x-[10px] text-[14px]">
                <Icon icon="gtp:logo" className="w-[26px] h-[26px]" />
                <div className="text-sm leading-[1.5]">
                  We are a public goods funded analytics platform.
                </div>
              </div>
              {/*desktop text*/}
              <div className="text-xs">
              As a public good, we rely on grants and funding rounds like Gitcoin, Octant, and Giveth. Support us during active rounds—or donate anytime via Giveth. More info on our <Link href="/donate" className="underline" onClick={() => {
                track("clicked Donate Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>donate page</Link>.
              </div>
              <div className="text-xs">
              Some links on our platform are affiliate links and may generate a commission for us.
              </div>
              <div className="text-xs">
              Disclaimer: Information on growthepie is for educational purposes only and not investment advice. Data may be inaccurate or delayed.
              </div>
            </div>
            <div className="flex flex-col gap-y-[15px] md:w-full md:items-end lg:flex-row lg:flex-wrap lg:justify-between lg:gap-x-[15px] text-xs leading-[1.5]">
              <Link href="/privacy-policy" className="block underline w-fit" onClick={() => {
                track("clicked Privacy Policy Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Privacy Policy
              </Link>
              <Link href="/data-terms" className="block underline w-fit" onClick={() => {
                track("clicked Data Terms Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Data Terms
              </Link>
              <Link href="/imprint" className="block underline w-fit" onClick={() => {
                track("clicked Imprint Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Imprint
              </Link>
              <div className="block whitespace-nowrap w-fit">
                © {new Date().getFullYear()} growthepie 🥧📏
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CommunitySection = ({ className }: { className?: string }) => {
  return (
    <div className={`flex-col ${className || ""}`}>
      <FooterSectionHeader>
        COMMUNITY
      </FooterSectionHeader>
      <FooterLink
        leftIcon={<GTPIcon icon="x-monochrome" size="md" className="text-color-text-primary" />}
        label="X"
        href="https://x.com/growthepie_eth"
      />
      <FooterLink
        leftIcon={<GTPIcon icon={"feather:linkedin" as GTPIconName} size="md" className="text-color-text-primary" />}
        label="LinkedIn"
        href="https://www.linkedin.com/company/growthepie/"
      />
    </div>
  );
}

const FooterSectionHeader = ({ children }: { children: string }) => {
  return (
    <div className="p-[5px] text-[#5A6462] text-[17px] font-bold leading-[120%]" style={{ fontVariant: 'all-small-caps' }}>{children}</div>
  );
}

const FooterLink = ({ leftIcon, label, href }: { leftIcon: React.ReactNode, label: string, href: string }) => {
  return (
    <Link
      href={href}
      rel={href.startsWith("http") ? "noopener" : undefined}
      target={href.startsWith("http") ? "_blank" : undefined}
      className="flex gap-x-[5px] items-center p-[3px]" onClick={() => {
        track(`clicked ${label} Footer link`, {
          location: "desktop footer",
          page: window.location.pathname,
          label,
        });
      }}>
      <div className="flex items-center justify-center w-[38px] h-[38px]">{leftIcon}</div>
      <div className="text-[20px] font-semibold leading-[120%]">{label}</div>
    </Link>
  );
}
