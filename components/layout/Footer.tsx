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

export default function Footer() {
  return (
    <div className="relative bottom-0 bg-forest-50  dark:bg-[#1F2726] px-[20px] py-[50px] md:p-[50px] md:pb-[150px]">
      <div className="flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col md:justify-between md:flex-wrap min-[1270px]:h-[250px] md:basis-[361px]">
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              MORE CONTENT
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<Image src={KnowledgeIcon} alt="Knowledge" width={24} height={24} />}
              label="Knowledge"
              href="https://docs.growthepie.xyz/"
            />
            <FooterLink
              leftIcon={<Image src={BlogIcon} alt="Blog" width={24} height={24} />}
              label="Blog"
              href="https://mirror.xyz/blog.growthepie.eth"
            />
          </div>
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              TECHNICAL DOCS
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<Image src={APIIcon} alt="API" width={24} height={24} />}
              label="API"
              href="https://docs.growthepie.xyz/api"
            />
            <FooterLink
              leftIcon={<Image src={GithubIcon} alt="Github" width={24} height={24} />}
              label="Github"
              href="https://www.github.com/growthepie"
            />
          </div>
          <div className="flex flex-col w-[176px]">
            <FooterSectionHeader>
              COMMUNITY
            </FooterSectionHeader>
            <FooterLink
              leftIcon={<Image src={XIcon} alt="XIcon" width={24} height={24} />}
              label="X"
              href="https://x.com/growthepie_eth"
            />
            <FooterLink
              leftIcon={<Image src={FarcasterIcon} alt="Farcaster" width={24} height={24} />}
              label="Farcaster"
              href="https://warpcast.com/growthepie"
            />
            <FooterLink
              leftIcon={<Image src={LensIcon} alt="Lens" width={24} height={24} />}
              label="Lens"
              href="https://share.lens.xyz/u/growthepie.lens"
            />
            <FooterLink
              leftIcon={<Image src={DiscordIcon} alt="Discord" width={24} height={24} />}
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
              leftIcon={<Image src={ContributorsIcon} alt="Contributors" width={24} height={24} />}
              label="Contributors"
              href="/contributors"
            />

            <FooterLink
              leftIcon={<Image src={FeedbackIcon} alt="Feedback" width={24} height={24} />}
              label="Feedback"
              href="https://discord.gg/fxjJFe7QyN"
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
              <div className="text-[10px]">
                Being a public good, we rely on grants and public funding rounds, such as Gitcoin, Octant or Giveth. Please support us whenever a round is active. On Giveth you can also donate whenever you feel like it.
              </div>
              <div className="text-[10px]">
                Individual links contain affiliate links, like the “Bridge” button, which provide us with some additional income through a revenue-share program. For more, please check the following links:
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-y-[15px] w-[230.87px] md:w-[362px] justify-between text-xs leading-[1.5]">
              <Link href="/privacy-policy" className="underline" onClick={() => {
                track("clicked Privacy Policy Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Privacy Policy
              </Link>
              <Link href="/imprint" className="underline" onClick={() => {
                track("clicked Imprint Footer link", {
                  location: "desktop footer",
                  page: window.location.pathname,
                });
              }}>
                Imprint
              </Link>
              <div className="flex">
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


