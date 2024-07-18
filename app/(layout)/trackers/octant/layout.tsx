import React from "react";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";

import { OctantLinks, OctantLinksMobile } from "./OctantLinks";
import { Metadata } from "next";
import Icon from "@/components/layout/Icon";
import { OctantSubheader } from "./OctantSubheader";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Octant Epoch Tracker",
    description:
      "Track donations and rewards for the projects in current and past Octant epochs.",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-[45px] md:pt-[45px]">
      <Container className="pb-[15px]">
        <div className="flex items-start justify-between pb-[15px]">
          <div className="flex items-center gap-x-2">
            <div className="w-10 h-10 -mt-[3px]">
              <svg className="w-10 h-10" data-test="Svg" viewBox="7 10 26 19">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M 40 20 Z Z m -27.067 6.058 a 6.06 6.06 0 0 0 5.588 -3.715 a 9.095 9.095 0 0 0 7.854 6.697 c 0.78 0.08 0.929 -0.056 0.929 -0.9 v -3.62 c 0 -0.707 0.239 -1.491 1.371 -1.491 h 2.172 c 0.468 0 0.487 -0.01 0.752 -0.385 c 0 0 1.139 -1.59 1.365 -1.928 c 0.226 -0.338 0.203 -0.426 0 -0.716 S 31.6 18.106 31.6 18.106 c -0.266 -0.37 -0.288 -0.378 -0.752 -0.378 h -2.893 c -0.473 0 -0.65 0.252 -0.65 0.757 v 2.627 c 0 0.64 0 1.16 -0.93 1.16 c -1.35 0 -2.082 -1.017 -2.082 -2.272 c 0 -1.1 0.816 -2.227 2.083 -2.227 c 0.852 0 0.929 -0.204 0.929 -0.613 v -5.49 c 0 -0.72 -0.314 -0.773 -0.93 -0.71 a 9.095 9.095 0 0 0 -7.852 6.696 A 6.06 6.06 0 0 0 6.874 20 a 6.058 6.058 0 0 0 6.058 6.058 Z m 0 -4.039 a 2.02 2.02 0 1 0 0 -4.039 a 2.02 2.02 0 0 0 0 4.04 Z"
                ></path>

                <defs>
                  <clipPath id="octant">
                    <path fill="#fff" d="M0 0h40v40H0z"></path>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <Heading className="font-bold text-[36px] leading-snug" as="h1">
              Octant Tracker
            </Heading>
          </div>
          <OctantLinks />
        </div>
        <OctantSubheader />
        {/* <div className="flex flex-col gap-2 pt-2 pb-5 text-xs font-medium">
          <div className="flex flex-row rounded-lg border border-forest-900/20 dark:border-forest-500/20 px-2 py-1  items-center justify-between gap-x-[15px]">
            <div className="flex gap-[5px] items-center whitespace-nowrap">
              <div className="w-5 h-5">
                <Icon
                  icon="ic:baseline-account-balance-wallet"
                  className="w-5 h-5"
                />
              </div>
              <h3 className="text-sm font-semibold">Golem Staking</h3>
            </div>
            <p className="">100,000 ETH staked</p>
          </div>

          <div className="flex flex-row rounded-lg border border-forest-900/20 dark:border-forest-500/20 px-2 py-1 items-center justify-between gap-x-[15px]">
            <div className="flex gap-[5px] items-center whitespace-nowrap">
              <div className="w-5 h-5">
                <Icon
                  icon="ic:baseline-currency-exchange"
                  className="w-5 h-5"
                />
              </div>
              <h3 className="text-sm font-semibold">Reward Distribution</h3>
            </div>
            <div className="relative pl-8 flex flex-col items-center text-xs w-full gap-y-1 pt-1">
              <div className="relative w-full h-4 border-0 border-forest-900/20 dark:border-forest-500/20 bg-forest-900/0 dark:bg-forest-1000/0 rounded-sm">
                <div className="absolute w-[5%] h-full bg-forest-900/10 dark:bg-forest-500/10 rounded-l-sm"></div>
                <div className="absolute inset-0 flex justify-between px-0.5 py-0 text-[11px] font-medium leading-4">
                  <div className="absolute -left-[20px] font-medium font-inter text-[12px]">
                    5%
                  </div>
                  <div className="absolute right-0 ">Community Fund</div>
                </div>
              </div>
              <div className="relative w-full h-4 border-0 border-forest-900/20 dark:border-forest-500/20 bg-forest-900/0 dark:bg-forest-1000/0 rounded-sm">
                <div className="absolute ml-[0%] w-[25%] h-full bg-forest-900/10 dark:bg-forest-500/10 rounded-none"></div>
                <div className="absolute ml-[0%] -inset-0 flex justify-between px-0.5 py-0 text-[11px] font-medium leading-4">
                  <div className="absolute -left-7 font-medium font-inter text-[12px]">
                    25%
                  </div>
                  <div className="absolute right-0 ">Golem Operations</div>
                </div>
              </div>
              <div className="relative w-full h-4 border-0 border-forest-900/20 dark:border-forest-500/20 bg-forest-900/0 dark:bg-forest-1000/0 rounded-sm">
                <div className="absolute ml-[0%] w-[70%] h-full bg-forest-900/10 dark:bg-forest-500/10 rounded-r-sm"></div>
                <div className="absolute ml-[0%] -inset-0 flex justify-between px-0.5 py-0 text-[11px] font-medium leading-4">
                  <div className="absolute -left-7 font-medium font-inter text-[12px]">
                    70%
                  </div>
                  <div className="absolute right-0 ">Users & Public Goods</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row rounded-lg border border-forest-900/20 dark:border-forest-500/20 px-2 py-1 items-center justify-between gap-x-[15px]">
            <div className="flex gap-[5px] items-center whitespace-nowrap">
              <div className="w-5 h-5">
                <Icon icon="ic:baseline-how-to-reg" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold">User Participation</h3>
            </div>
            <div className="">Lock GLM tokens</div>
            <div className="">Claim or donate rewards</div>
          </div>

          <div className="flex flex-row rounded-lg border border-forest-900/20 dark:border-forest-500/20 px-2 py-1 items-center justify-between gap-x-[15px]">
            <div className="flex gap-[5px] items-center whitespace-nowrap">
              <div className="w-5 h-5">
                <Icon icon="ic:baseline-calendar-today" className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-forest-900 dark:text-forest-500">
                Epochs & Governance
              </h3>
            </div>
            <div className="">90-day epochs</div>
            <div className="">Community-led funding</div>
          </div>
        </div> */}
        <OctantLinksMobile />
      </Container>
      {children}
    </div>
  );
}
