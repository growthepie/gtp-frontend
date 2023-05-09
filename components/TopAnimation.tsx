"use client";
import { useEffect, useMemo, useState } from "react";
import { useSpring, animated, config } from "react-spring";
import Image from "next/image";
import { delay, xor } from "lodash";

const TopAnimation = () => {
  const [topMounted, setTopMounted] = useState(false);
  const [middleMounted, setMiddleMounted] = useState(false);

  const LeftAnimate = (id) =>
    useSpring({
      delay: id === 0 ? 1000 : 1050,
      from: { y: 100 },
      to: { y: 0 },
      config: { tension: 200, friction: 20 },
    });

  const TopMiddle = (id) => {
    const [props, set] = useSpring(() => ({
      y: 150,
      scale: 1.4,
      x: id === 1 ? 40 : 0,
    }));

    useEffect(() => {
      const timeout1 = setTimeout(
        () => {
          set({
            y: 35,
            scale: 1.4,
            config: { tension: 200, friction: 20 },
            onRest: () => {
              const timeout2 = setTimeout(() => {
                set({
                  y: 0,
                  scale: 1.1,
                  x: id === 1 ? 10 : 0,
                  config: { tension: 200, friction: 20 },
                  onRest: () => {
                    const timeout3 = setTimeout(() => {
                      set({
                        y: 0,
                        x: id === 1 ? 0 : 0,
                        scale: 1.0,
                      });
                    }, 1000);
                  },
                });
                clearTimeout(timeout2);
              }, 1000);
            },
          });
          clearTimeout(timeout1);
        },
        id === 0 ? 2000 : 2050
      );

      return () => clearTimeout(timeout1);
    }, [id, set]);

    return props;
  };

  const CenterMiddle = (id) => {
    const [props, set] = useSpring(() => ({
      y: 150,
      scale: 1.4,
      x: id === 1 ? 40 : 0,
    }));

    useEffect(() => {
      const timeout1 = setTimeout(
        () => {
          set({
            y: 0,
            scale: 1.2,
            x: id === 1 ? 20 : 0,
            config: { tension: 200, friction: 20 },
            onRest: () => {
              const timeout2 = setTimeout(() => {
                set({
                  y: 0,
                  x: id === 1 ? 0 : 0,
                  scale: 1.0,
                });
                clearTimeout(timeout2);
              }, 1000);
            },
          });
          clearTimeout(timeout1);
        },
        id === 0 ? 3600 : 3650
      );
    }, [id, set]);

    return props;
  };

  const BottomMiddle = (id) => {
    const [props, set] = useSpring(() => ({
      y: 150,
      scale: 1.4,
      x: id === 1 ? 40 : 0,
    }));

    useEffect(() => {
      const timeout1 = setTimeout(
        () => {
          set({
            y: 0,
            scale: 1.2,
            x: id === 1 ? 20 : 0,
            config: { tension: 200, friction: 20 },
            onRest: () => {
              const timeout2 = setTimeout(() => {
                set({
                  y: 0,
                  x: id === 1 ? 0 : 0,
                  scale: 1.0,
                });
                clearTimeout(timeout2);
              }, 1000);
            },
          });
          clearTimeout(timeout1);
        },
        id === 0 ? 5200 : 5250
      );
    }, [id, set]);

    return props;
  };

  const RightAnimate = (id) =>
    useSpring({
      delay: id === 0 ? 6200 : 6250,
      from: { y: 100 },
      to: { y: 0 },
      config: { tension: 200, friction: 20 },
    });

  return (
    <div>
      <div className="w-[full] h-[125px] rounded-[99px] bg-[#2A343399] border-[2px] border-[#CDD8D3] flex justify-between items-center text-[#CDD8D3] overflow-hidden">
        <div className="ml-12 items-center flex">
          <animated.div
            className="flex items-center pr-10"
            style={LeftAnimate(0)}
          >
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
          </animated.div>
          <animated.h1
            className="relative right-[24px] font-bold text-[21px]"
            style={LeftAnimate(1)}
          >
            One Ecosystem
          </animated.h1>
        </div>
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-x-4 items-center">
            <animated.div style={TopMiddle(0)}>
              <Image
                src="/control-ani.svg"
                alt="controller"
                width={75}
                height={50}
                loading="eager"
                className=""
              />
            </animated.div>
            <animated.h1 style={TopMiddle(1)}>different use cases</animated.h1>
          </div>

          <div className="flex gap-x-4 items-center">
            <animated.div style={CenterMiddle(0)}>
              <Image
                src="/chains-ani.svg"
                alt="chain logos"
                width={75}
                height={50}
                loading="eager"
                className=""
              />
            </animated.div>
            <animated.h1 style={CenterMiddle(1)}>
              many chains and layers
            </animated.h1>
          </div>
          <div className="flex gap-x-4 items-center">
            <animated.div style={BottomMiddle(0)}>
              <Image
                src="/emoji-ani.svg"
                alt="user emoji"
                width={75}
                height={50}
                loading="eager"
                className=""
              />
            </animated.div>
            <animated.h1 style={BottomMiddle(1)}>
              all growing the total user base
            </animated.h1>
          </div>
        </div>
        <div className="flex gap-x-4 items-center">
          <animated.div style={RightAnimate(0)}>
            <Image
              src="/emoji-pie-ani.svg"
              alt="pie emoji"
              width={69}
              height={52}
              className=""
              loading="eager"
            />
          </animated.div>
          <animated.h1
            className="w-[160px] font-bold text-[21px]"
            style={RightAnimate(1)}
          >
            for a positive sum game.
          </animated.h1>
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
  );
};

export default TopAnimation;

/*
            <Image
                    src="/emoji-ani.svg"
                    alt="user emoji"
                  width={75}
                  height={50}
                  className=""
              />
              */

/*
              <Image
                  src="/chains-ani.svg"
                  alt="chain logos"
                  width={75}
                  height={50}
                  className=""
              />
              */
