import React, { Suspense } from "react";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ShowLoading from "@/components/layout/ShowLoading";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container>
        <div className="flex items-center gap-x-2 pb-[15px]">
          <svg className="w-10 h-10" data-test="Svg" viewBox="7 10 26 19">
            {/* 
          <g clip-path="url(#octant)">
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M40 20C40 5.244 34.78 0 20 0 5.263 0 0 5.312 0 20c0 14.632 5.35 20 20 20 14.693 0 20-5.3 20-20Zm-27.067 6.058a6.06 6.06 0 0 0 5.588-3.715 9.095 9.095 0 0 0 7.854 6.697c.78.08.929-.056.929-.9v-3.62c0-.707.239-1.491 1.371-1.491h2.172c.468 0 .487-.01.752-.385 0 0 1.139-1.59 1.365-1.928.226-.338.203-.426 0-.716S31.6 18.106 31.6 18.106c-.266-.37-.288-.378-.752-.378h-2.893c-.473 0-.65.252-.65.757v2.627c0 .64 0 1.16-.93 1.16-1.35 0-2.082-1.017-2.082-2.272 0-1.1.816-2.227 2.083-2.227.852 0 .929-.204.929-.613v-5.49c0-.72-.314-.773-.93-.71a9.095 9.095 0 0 0-7.852 6.696A6.06 6.06 0 0 0 6.874 20a6.058 6.058 0 0 0 6.058 6.058Zm0-4.039a2.02 2.02 0 1 0 0-4.039 2.02 2.02 0 0 0 0 4.04Z"
            clip-rule="evenodd"
          ></path> 
          </g>
          */}
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
          <Heading
            as="h1"
            className="text-2xl leading-snug text-[36px] break-inside-avoid"
          >
            Octant Tracker
          </Heading>
        </div>
        {/* 🟢💚 We staked 100,000 ETH & are on a mission to financially empower both public good projects and our community in a sustainable way. http://discord.gg/octant */}
        <Subheading className="text-[16px]">
          Octant, powered by the Golem Foundation, is a community-led platform
          that leverages staking rewards from 100,000 ETH to fund public goods.
        </Subheading>
      </Container>

      {/* Users stake GLM tokens to participate in governance, influencing how
        rewards are distributed. This approach not only empowers token holders
        but also enhances public goods funding through a reward matching system,
        providing valuable insights into decentralized governance methods
        suitable for the Web3 ecosystem. */}
      {/* <Subheading className="text-[12px] pt-[5px]">
        On the Octant platform, users can discover and support public good
        projects. Users stake GLM tokens to participate in governance,
        influencing how rewards are distributed. This approach not only empowers
        token holders but also enhances public goods funding through a reward
        matching system, providing valuable insights into decentralized
        governance methods suitable for the Web3 ecosystem.
      </Subheading> */}
      {/* <Heading as="h2" className="text-md">
        Epoch 3 Projects
      </Heading> */}
      {/* <Suspense
        fallback={
          <div className="w-full h-[calc(100vh-550px)] flex items-center justify-center">
            <ShowLoading
              dataLoading={[true]}
              dataValidating={[false]}
              fullScreen={false}
              section={true}
            />
          </div>
        }
      >
        {children}
      </Suspense> */}
      {children}
    </>
  );
}
