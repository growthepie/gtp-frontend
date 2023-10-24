"use client";
import { useEffect, useMemo, useState } from "react";
import { useSpring, animated, config } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";

const Notification = () => {
  const [circleDisappear, setCircleDisappear] = useState(false);
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentTuple, setCurrentTuple] = useState<object | null>(null);
  const [loadedMessages, setLoadedMessages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contracts", {
          method: "GET",
        });
        const result = await response.json();
        setData(result.records);

        // Determine whether to set isEnabled based on the data
        const shouldEnable = result.records.some(
          (tuple) => tuple.fields.Status === "Enabled",
        );
        setIsEnabled(shouldEnable);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data && isEnabled) {
      const timer = setTimeout(() => {
        setCurrentBannerIndex((currentBannerIndex + 1) % data.length);
        setCircleDisappear(false);
        setLoadedMessages([...loadedMessages, data[currentBannerIndex]["id"]]);
      }, 8000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [data, isEnabled, currentBannerIndex]);
  console.log(data ? data : "No Data");
  console.log(loadedMessages ? loadedMessages : "No messages");
  console.log(currentBannerIndex);
  return (
    data && (
      <div>
        {data.map((tuple, index) => {
          // Only render the current banner

          if (
            index !== currentBannerIndex ||
            loadedMessages.includes(data[index]["id"])
          ) {
            return null;
          }

          return (
            <div
              key={index}
              className={`w-full z-999 ${
                circleDisappear ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex items-center dark:border-forest-200 border-[1px] dark:bg-forest-900 bg-white w-[500px] h-[50px] rounded-full px-[12px] relative">
                <div className="w-[90%]"> {tuple["fields"]["Description"]}</div>
                <div
                  className={`w-[10%] h-[90%] relative flex items-center justify-center  ${
                    circleDisappear
                      ? "hover:cursor-default"
                      : "hover:cursor-pointer"
                  }`}
                  onClick={() => {
                    // Check if there are more items in the queue
                    setLoadedMessages([...loadedMessages, data[index]["id"]]);
                    if (currentBannerIndex < data.length - 1) {
                      // Increment the current banner index to move to the next item
                      setCurrentBannerIndex(currentBannerIndex + 1);
                      // Reset the animation
                      setCircleDisappear(false);
                    } else {
                      // If this is the last item, close the current banner
                      setCircleDisappear(true);
                    }
                  }}
                >
                  <Icon icon="ph:x" className="absolute w-[30px] h-[30px]" />
                  <svg
                    id="circle-svg"
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
                      strokeDasharray="392"
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
        })}
      </div>
    )
  );
};

export default Notification;
