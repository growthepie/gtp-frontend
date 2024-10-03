import React from "react";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";

import { OctantLinks, OctantLinksMobile } from "../octant/OctantLinks";
import { Metadata } from "next";
import Icon from "@/components/layout/Icon";
import { OctantSubheader } from "../octant/OctantSubheader";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Octant Epoch Tracker",
    description:
      "Track donations and rewards for the projects in current and past Octant epochs.",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-[45px] md:pt-[45px] min-h-[580px]">
      <Container className="pb-[15px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-x-[5px]">
            <div className="w-[36px] h-[36px]">
              <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M18.2939 0.5C31.596 0.5 36.2939 5.22001 36.2939 18.5C36.2939 31.7298 31.5177 36.5 18.2939 36.5C5.1091 36.5 0.293945 31.6686 0.293945 18.5C0.293945 5.28097 5.03057 0.5 18.2939 0.5Z" fill="black" />
                <path fillRule="evenodd" clipRule="evenodd" d="M16.9632 20.6096C16.1387 22.5735 14.1973 23.9528 11.9338 23.9528C8.92255 23.9528 6.48145 21.5117 6.48145 18.5004C6.48145 15.4891 8.92255 13.048 11.9338 13.048C14.1973 13.048 16.1387 14.4273 16.9632 16.3911C17.8241 13.1569 20.6174 10.7106 24.0313 10.364C24.5851 10.3078 24.8672 10.3563 24.8672 11.0034V15.9446C24.8672 16.3125 24.798 16.4958 24.0313 16.4958C22.891 16.4958 22.157 17.5098 22.157 18.5004C22.157 19.6296 22.8163 20.545 24.0313 20.545C24.8672 20.545 24.8672 20.0775 24.8672 19.5014V17.1373C24.8672 16.683 25.027 16.4557 25.453 16.4557H28.0567C28.4741 16.4557 28.4936 16.4636 28.7333 16.7962C28.7333 16.7962 29.7793 18.2395 29.9616 18.5004C30.1439 18.7613 30.1652 18.8412 29.9616 19.1451C29.758 19.449 28.7333 20.88 28.7333 20.88C28.4944 21.2175 28.4774 21.2266 28.0567 21.2266H26.1016C25.0823 21.2266 24.8672 21.9319 24.8672 22.5684V25.827C24.8672 26.5865 24.7328 26.708 24.0313 26.6367C20.6174 26.2902 17.8241 23.8439 16.9632 20.6096ZM13.7515 18.4993C13.7515 19.5031 12.9378 20.3168 11.934 20.3168C10.9303 20.3168 10.1166 19.5031 10.1166 18.4993C10.1166 17.4956 10.9303 16.6818 11.934 16.6818C12.9378 16.6818 13.7515 17.4956 13.7515 18.4993Z" fill="white" />
              </svg>


            </div>
            <Heading className="font-bold text-[36px] leading-[120%]" as="h1">
              Octant
            </Heading>
          </div>
          {/* <OctantLinks /> */}
        </div>
        {/* <OctantSubheader /> */}
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
        {/* <OctantLinksMobile /> */}
      </Container>
      {children}
    </div>
  );
}
