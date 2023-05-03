"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useAnimation} from "framer-motion"
import Image from "next/image";
import { delay, xor } from "lodash";

const TopAnimation = () => {
  const topAnimation = useAnimation();
  const middleAnimation = useAnimation();
  const bottomAnimation = useAnimation();

  const topAnimation1 = useAnimation();
  const middleAnimation1 = useAnimation();
  const bottomAnimation1 = useAnimation();
  //hacky way of doing it but provide seperate animations for icons and text

  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [30, 0, 0];
      const scaleVal = [1.4, 1.0, 1.0]
      for (let i = 0; i < yValues.length; i++) {
        await topAnimation.start({ y: yValues[i], scale: scaleVal[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 2.1 : 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [topAnimation]);


  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [30, 0, 0];
      const scaleVal = [1.4, 1.0, 1.0]
      const xOffset = [45, 11, 0]

      for (let i = 0; i < yValues.length; i++) {
        await topAnimation1.start({ y: yValues[i], scale: scaleVal[i], x: xOffset[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 2.15 : 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [topAnimation1]);


  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [0, 0, 0];
      const scaleVal = [1.4, 1.1, 1.0]
      for (let i = 0; i < yValues.length; i++) {
        await middleAnimation.start({ y: yValues[i], scale: scaleVal[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 4.3: 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [middleAnimation]);

  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [0, 0, 0];
      const scaleVal = [1.4, 1.1, 1.0]
      const xOffset = [45, 10.25, 0]

      for (let i = 0; i < yValues.length; i++) {
        await middleAnimation1.start({ y: yValues[i], scale: scaleVal[i], x: xOffset[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 4.35 : 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [middleAnimation1]);



  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [0, 0];
      const scaleVal = [1.4, 1.0]
      for (let i = 0; i < yValues.length; i++) {
        await bottomAnimation.start({ y: yValues[i], scale: scaleVal[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 6.7 : 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [bottomAnimation]);


  useEffect(() => {
    const animateSequence = async () => {
      const yValues = [0, 0];
      const scaleVal = [1.4, 1.0]
      const xOffset = [45, 0]

      for (let i = 0; i < yValues.length; i++) {
        await bottomAnimation1.start({ y: yValues[i], scale: scaleVal[i], x: xOffset[i], transition: { type: "spring", stiffness: 100, damping: 13, delay: i === 0 ? 6.75 : 1.5, duration: 4}});
      }
    };

    animateSequence();
  }, [bottomAnimation1]);

  return(
    <div>
      <div className="w-[80rem] h-[125px] rounded-[99px] bg-[#2A343399] border-[2px] border-[#CDD8D3] flex justify-between items-center text-[#CDD8D3] overflow-hidden" >
          <div className="ml-12 items-center flex">
            <motion.div className="flex items-center pr-10"
            initial = {{y: 100}}
            animate = {{y: 0}}
            transition = {{type: "spring", stiffness: 100, damping: 13, delay: 0.6}}>
              <Image
                  src="/eth-ani.png"
                  alt="eth logo"
                  width={58}
                  height={58}
                  className="relative"
                />
              <Image
                src="/eth-ani2.png"
                alt="eth logo"
                width={25}
                height={40}
                className="relative right-[41px]"
              />
            </motion.div>
            <motion.h1 className="relative right-[24px] font-bold text-[21px]"
              initial = {{y: 100}}
              animate = {{y: 0}}
              transition = {{type: "spring", stiffness: 100, damping: 13, delay: 0.65}}>
                One Ecosystem</motion.h1>
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex gap-x-4 items-center">
              <motion.div             
              initial = {{y: 120}}
              animate={topAnimation}
              style={{ transformOrigin: "center center" }}>
              <Image
                  src="/control-ani.svg"
                  alt="controller"
                  width={75}
                  height={50}
                  className=""
              />
              </motion.div>
              <motion.h1 
                initial = {{y: 120}}
                animate={topAnimation1}
                style={{ transformOrigin: "center center" }}>
                  different use cases
                  </motion.h1>
            </div>
            <div className="flex gap-x-4 items-center">
              <motion.div             
              initial = {{y: 120}}
              animate={middleAnimation}
              style={{ transformOrigin: "center center" }}>
              <Image
                  src="/chains-ani.svg"
                  alt="chain logos"
                  width={75}
                  height={50}
                  className=""
              />
              </motion.div>
              <motion.h1 
                initial = {{y: 120}}
                animate={middleAnimation1}
                style={{ transformOrigin: "center center" }}>
                  many chains and layers
                  </motion.h1>
            </div>
            <div className="flex gap-x-4 items-center">
              <motion.div             
              initial = {{y: 120}}
              animate={bottomAnimation}
              style={{ transformOrigin: "center center" }}>
              <Image
                    src="/emoji-ani.svg"
                    alt="user emoji"
                  width={75}
                  height={50}
                  className=""
              />
              </motion.div>
              <motion.h1 
                initial = {{y: 120}}
                animate={bottomAnimation1}
                style={{ transformOrigin: "center center" }}>
                  all growing the total user base
                  </motion.h1>
            </div>
          </div>
          <div className="flex gap-x-4 items-center">
            <motion.div
              initial = {{y: 100}}
              animate = {{y: 0}}
              transition = {{type: "spring", stiffness: 100, damping: 13, delay: 9.4}}>
              <Image
                src="/emoji-pie-ani.svg"
                alt="pie emoji"
                width={69}
                height={52}
                className=""
              />
            </motion.div>
            <motion.h1 className="w-[160px] font-bold text-[21px]"
                initial = {{y: 100}}
                animate = {{y: 0}}
                transition = {{type: "spring", stiffness: 100, damping: 13, delay: 9.45}}>
                  for a positive sum game.
            </motion.h1>
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

