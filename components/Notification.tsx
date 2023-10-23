"use client";
import { useEffect, useMemo, useState } from "react";
import { useSpring, animated, config } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";

const Notification = () => {
  const [circleDisappear, setCircleDisappear] = useState(false);
  useEffect(() => {
    // Trigger the circle disappearance after a delay (e.g., 5 seconds)
    const timer = setTimeout(() => {
      setCircleDisappear(true);
    }, 7500);

    return () => {
      clearTimeout(timer);
    };
  }, []);
  return (
    <div
      className={`w-full z-999 ${
        circleDisappear ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center dark:border-forest-200 border-[1px] dark:bg-forest-900 bg-white w-[500px] h-[50px] rounded-full px-[12px] relative">
        <div className="w-[90%]">Message Here</div>
        <div
          className={`w-[10%] h-[90%] relative flex items-center justify-center  ${
            circleDisappear ? "hover:cursor-default" : "hover:cursor-pointer"
          }`}
        >
          <Icon icon="ph:x" className="absolute w-[30px] h-[30px]" />

          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 124 124"
          >
            <circle
              cx="62"
              cy="62"
              r="50"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray="392" // Adjusted to fully cover the circle
              strokeDashoffset="392"
              className="animate-circle-disappear"
            />
          </svg>
          <style>
            {`
              @keyframes circleDisappear {
                0% {
                  stroke-dashoffset: 0;
                }
                100% {
                  stroke-dashoffset: 392; // Matched to the strokeDasharray
                }
              }

              .animate-circle-disappear {
                animation: circleDisappear 8s linear;
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default Notification;
