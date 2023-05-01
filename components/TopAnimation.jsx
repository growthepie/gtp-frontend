"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion"
import Image from "next/image";

function TopAnimation(){
  return(
    <div>
      <div className="w-[80rem] h-[125px] rounded-[99px] bg-[#2A343399] border-[2px] border-[#CDD8D3] flex justify-between items-center text-[#CDD8D3]" >
          <div className="ml-12 items-center flex">
            <div className="flex items-center pr-10">
              <Image
                  src="/eth-ani.png"
                  alt="eth logo"
                  width={58}
                  height={58}
                  className="fixed"
                />
              <Image
                src="/eth-ani2.png"
                alt="eth logo"
                width={25}
                height={40}
                className="relative left-[16px]"
              />
            </div>
            <h1 className="ml-4 font-bold text-[21px]">One Ecosystem</h1>
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex gap-x-4">
              <Image
                  src="/control-ani.svg"
                  alt="controller"
                  width={18}
                  height={26}
                  className=""
              />
              <h1>different use cases</h1>
            </div>
            <div className="flex gap-x-4">
              <Image
                  src="/arbitrum-ani.svg"
                  alt="arbitrum logo"
                  width={18}
                  height={26}
                  className=""
              />
              <h1>many chains and layers</h1>
            </div>
            <div className="flex gap-x-4">
              <Image
                    src="/emoji-ani.svg"
                    alt="user emoji"
                    width={18}
                    height={26}
                    className=""
                />
              <h1>all growing the total user base</h1>
            </div>
          </div>
          <div className="flex gap-x-4">
            <Image
              src="/emoji-pie-ani.svg"
              alt="pie emoji"
              width={69}
              height={52}
              className=""
            />
            <h1 className="w-[160px] font-bold text-[21px]">for a positive sum game.</h1>
          </div>
          <Image
              src="/logo-crop.svg"
              alt="pie slice"
              width={100}
              height={80}
              className="relative top-[18px] right-[4px] rounded-br-[50px]"
            />
      </div>    
    </div>
  )
}


export default TopAnimation;

