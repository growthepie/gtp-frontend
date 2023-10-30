"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface ID {
  id: string; // Adjust the type according to your actual data structure
  // Add other properties if necessary
}

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [circleDisappear, setCircleDisappear] = useState(false);
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentTuple, setCurrentTuple] = useState<object | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<ID[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const leaveRef = useRef();

  function isoDateTimeToUnix(
    dateString: string,
    timeString: string,
  ): number | null {
    if (typeof dateString !== "string" || typeof timeString !== "string") {
      console.error("Invalid date or time type");
      return null;
    }

    const dateParts = dateString.split("-").map(Number);
    const timeParts = timeString.split(":").map(Number);

    if (dateParts.length !== 3 || timeParts.length !== 3) {
      console.error("Invalid date or time length");
      return null;
    }

    // Create a JavaScript Date object with the parsed date and time, and set it to the local time zone
    const localDate = new Date(
      dateParts[0],
      dateParts[1] - 1, // Month is 0-based in JavaScript
      dateParts[2],
      timeParts[0],
      timeParts[1],
      timeParts[2],
    );

    // Get the Unix timestamp (milliseconds since January 1, 1970)
    const unixTimestamp = localDate.getTime();

    return unixTimestamp;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/contracts", {
          method: "GET",
        });
        const result = await response.json();
        setData(result.records);

        // Determine whether to set isEnabled based on the data
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  const datePass = useMemo(() => {
    if (data) {
      const startDateTime = isoDateTimeToUnix(
        data[currentBannerIndex]["fields"]["Start Date"],
        data[currentBannerIndex]["fields"]["Start Time"],
      );
      const endDateTime = isoDateTimeToUnix(
        data[currentBannerIndex]["fields"]["End Date"],
        data[currentBannerIndex]["fields"]["End Time"],
      );

      if (endDateTime && startDateTime) {
        if (currentDateTime < endDateTime && currentDateTime > startDateTime) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }, [data, currentBannerIndex]);

  const isEnabled = useMemo(() => {
    if (data) {
      if (data[currentBannerIndex]["fields"]["Status"] === "Enabled") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }, [data, currentBannerIndex]);

  useEffect(() => {
    if (data && isEnabled && datePass) {
      const leaveDuration = 400;
      const currentItem = data[currentBannerIndex];
      const timer = setTimeout(() => {
        setCurrentBannerIndex((currentBannerIndex + 1) % data.length);
        setCircleDisappear(false);
        const leaveTimer = setTimeout(() => {
          setLoadedMessages((prevLoadedMessages) => [
            ...prevLoadedMessages,
            currentItem.id,
          ]);
        }, leaveDuration);
      }, 8000);
      console.log(currentBannerIndex);
      return () => {
        clearTimeout(timer);
      };
    } else if (data) {
      // If isEnabled is false, immediately move to the next banner
      setCurrentBannerIndex((currentBannerIndex + 1) % data.length);
      setCircleDisappear(false);
    }
  }, [data, isEnabled, currentBannerIndex]);

  useEffect(() => {
    const animationDuration = 8000; // Time to stay in position
    const leaveDuration = 400;

    if (isEnabled && !loadedMessages.includes(data[currentBannerIndex]["id"])) {
      const timer = setTimeout(() => {
        const currentItem = data[currentBannerIndex];

        setCurrentBannerIndex((currentBannerIndex + 1) % data.length);
        setCircleDisappear(false);
        const leaveTimer = setTimeout(() => {
          setLoadedMessages((prevLoadedMessages) => [
            ...prevLoadedMessages,
            currentItem.id,
          ]);
        }, leaveDuration);

        // Mark the current item as loaded
      }, animationDuration);

      // Clear the timer to leave after the animationDuration
      return () => {
        clearTimeout(timer);
        // Clear any pending leave animation on unmount
        clearTimeout(leaveRef.current);
      };
    }
  }, [currentBannerIndex, data, isEnabled, loadedMessages]);

  const transitions = useTransition(
    data ? (isEnabled ? [data[currentBannerIndex]] : []) : [],
    {
      from: { right: "0px", bottom: "120px", opacity: 1 },
      enter: { right: "120px", bottom: "120px", opacity: 1 },
      leave: { right: "120px", bottom: "200px", opacity: 0 }, // Leave in 200 milliseconds
      config: { duration: 500 }, // Custom duration for "from" and "enter"
    },
  );
  console.log(loadedMessages);
  return (
    <div className=" ">
      {transitions((props, item, key) => {
        if (loadedMessages.includes(item.id)) {
          return null;
        }
        return (
          <animated.div
            style={props}
            key={key}
            className="fixed right-[120px] bottom-[120px] z-999"
          >
            <div className="flex items-center dark:border-forest-400 border-b-[1px] dark:bg-[#1F2726] bg-white w-[500px] h-[50px] rounded-full px-[12px] relative">
              <div className="w-[90%] text-[16px]">
                {" "}
                {item["fields"]["Description"]}
              </div>
              <div
                className={`w-[10%] h-[90%] hover:bg-forest-700 rounded-full relative flex items-center justify-center ${
                  circleDisappear
                    ? "hover:cursor-default"
                    : "hover:cursor-pointer"
                }`}
                onClick={() => {
                  const leaveDuration = 400;

                  setCurrentBannerIndex((currentBannerIndex + 1) % data.length);
                  setCircleDisappear(false);
                  const leaveTimer = setTimeout(() => {
                    setLoadedMessages((prevLoadedMessages) => [
                      ...prevLoadedMessages,
                      item.id,
                    ]);
                  }, leaveDuration);
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
          </animated.div>
        );
      })}
    </div>
  );
};

export default Notification;
