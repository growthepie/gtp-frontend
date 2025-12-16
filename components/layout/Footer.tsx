"use client";
import Link from "next/link";
import Icon from "./Icon";
import { track } from "@vercel/analytics/react";
import DiscordIcon from "@/icons/footer/Discord.svg";
import XIcon from "@/icons/footer/X.svg";
import LensIcon from "@/icons/footer/Lens.svg";
import FarcasterIcon from "@/icons/footer/Farcaster.svg";
import DonateIcon from "@/icons/footer/GTP-Donate.svg";
import BlogIcon from "@/icons/footer/GTP-Blog.svg";
import KnowledgeIcon from "@/icons/footer/GTP-Book-Open.svg";
import APIIcon from "@/icons/footer/GTP-File-Text.svg";
import GithubIcon from "@/icons/footer/Github.svg";
import ContributorsIcon from "@/icons/footer/GTP-Compass.svg";
import FeedbackIcon from "@/icons/footer/GTP-Donate-1.svg";
import Image from "next/image";
import { GTPIcon } from "./GTPIcon";

export default function Footer() {
  return (
    <div className="relative bottom-0 bg-forest-50  dark:bg-color-bg-default px-[20px] pt-[50px] pb-[150px] md:p-[50px] md:pb-[100px]">
      <div className="flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col md:justify-between md:flex-wrap min-[1270px]:h-[350px] md:basis-[361px]">
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              MORE CONTENT
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-quick-bites" size="md" />}
              label="Quick Bites"
              href="https://www.growthepie.com/quick-bites"
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
              href="https://docs.growthepie.com/api"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="github-monochrome" size="md" className="text-color-text-primary" />}
              label="Github"
              href="https://www.github.com/growthepie"
            />
          </div>
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              COMMUNITY
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<GTPIcon icon="x-monochrome" size="md" className="text-color-text-primary" />}
              label="X"
              href="https://x.com/growthepie_eth"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="farcaster-monochrome" size="md" className="!text-color-text-primary" />}
              label="Farcaster"
              href="https://warpcast.com/growthepie"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="lens-monochrome" size="md" className="text-color-text-primary" />}
              label="Lens"
              href="https://share.lens.xyz/u/growthepie.lens"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="discord-monochrome" size="md" className="text-color-text-primary" />}
              label="Discord"
              href="https://discord.gg/fxjJFe7QyN"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-y-[25px] md:gap-x-[30px]">
          <div className="flex flex-col md:w-[170px]">
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
              href="https://discord.gg/fxjJFe7QyN"
            />
            <FooterLink
              leftIcon={<GTPIcon icon="gtp-growthepie-logo" size="md" />}
              label="Brand Guide"
              href="https://api.growthepie.com/brand/growthepie_brand_guide.zip"
            />
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
            <div className="flex justify-between flex-col md:items-end lg:flex-row gap-y-[15px] md:w-full lg:justify-between text-xs leading-[1.5]">
              <Link href="/privacy-policy" className="block underline w-fit" onClick={() => {
                track("clicked Privacy Policy Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Privacy Policy
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


