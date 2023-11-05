"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Markdown from "react-markdown";

type AirtableRow = {
  id: string;
  body: string;
};

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [circleDisappear, setCircleDisappear] = useState(false);
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentTuple, setCurrentTuple] = useState<object | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<string[]>([]);

  const [exitAnimation, setExitAnimation] = useState<string | null>(null);
  const [dataLength, setDataLength] = useState(0);
  const [currentURL, setCurrentURL] = useState<string | null>(null);

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
    setCurrentURL(window.location.href);
  }, []);

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

  function DateEnabled(startTime, startDate, endTime, endDate) {
    const startDateTime = isoDateTimeToUnix(startDate, startTime);
    const endDateTime = isoDateTimeToUnix(endDate, endTime);
    if (endDateTime && startDateTime) {
      if (currentDateTime < endDateTime && currentDateTime > startDateTime) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  function urlEnabled(url) {
    let retValue = true;

    if (url !== "" && currentURL) {
      if (!currentURL.includes(url[0])) {
        retValue = false;
      }
    }

    return retValue;
  }

  const filteredData = useMemo(() => {
    const returnArray: AirtableRow[] = [];

    if (data) {
      Object.keys(data).forEach((item) => {
        let passingDate = DateEnabled(
          data[item]["fields"]["Start Time"],
          data[item]["fields"]["Start Date"],
          data[item]["fields"]["End Time"],
          data[item]["fields"]["End Date"],
        );
        let enabled = data[item]["fields"]["Status"] === "Enabled";
        let passingURL = urlEnabled(
          data[item]["fields"]["Display Page"]
            ? data[item]["fields"]["Display Page"]
            : "",
        );
        //Check if notification is enabled, available/current date range and selected url

        if (enabled && passingDate && passingURL) {
          let newEntry: AirtableRow = {
            id: data[item]["id"],
            body: data[item]["fields"]["Body"],
          };

          returnArray.push(newEntry);
        }
      });
    }

    return returnArray;
  }, [data]);

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
    const animationDuration = 7900; // Time to stay in position
    const leaveDuration = 400;

    const timer = setTimeout(() => {
      const currentItem = filteredData[currentBannerIndex];

      setCurrentBannerIndex((currentBannerIndex + 1) % filteredData.length);
      setCircleDisappear(false);
      setExitAnimation(currentItem.id);
      const leaveTimer = setTimeout(() => {
        setLoadedMessages((prevLoadedMessages) => [
          ...prevLoadedMessages,
          currentItem.id,
        ]);
      }, leaveDuration);
    }, animationDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [data, isEnabled, datePass, currentBannerIndex, loadedMessages]);

  return (
    filteredData && (
      <div className="">
        {filteredData.map((item) => {
          if (loadedMessages.includes(item.id)) {
            return null;
          }

          return (
            <div
              key={item.id}
              className={`fixed bottom-12 z-50`}
              style={{
                right:
                  item.id !== filteredData[currentBannerIndex]["id"] &&
                  exitAnimation !== item.id
                    ? "-500px"
                    : "100px", // Adjust the values as needed
                transform:
                  exitAnimation === item.id
                    ? "translateY(-100px)"
                    : "translateY(0)",
                opacity: exitAnimation === item.id ? 0 : 1, // Transition from 1 to 0 opacity
                transition:
                  "right 400ms ease-in-out, transform 300ms ease-in-out, opacity 400ms ease-in-out", // Adjust duration and easing as needed
              }}
            >
              <div className="flex items-center dark:border-forest-400 border-b-[1px] dark:bg-[#1F2726] bg-white w-[500px] h-[50px] rounded-full px-[12px] relative">
                <div className="w-[90%] text-[16px]">
                  <Markdown>{item.body}</Markdown>
                </div>
                <div
                  className={`w-[10%] h-[90%] hover:bg-forest-700 rounded-full relative flex items-center justify-center ${
                    circleDisappear
                      ? "hover:cursor-default"
                      : "hover:cursor-pointer"
                  }`}
                  onClick={() => {
                    const leaveDuration = 400;

                    setCurrentBannerIndex(
                      (currentBannerIndex + 1) % filteredData.length,
                    );
                    setExitAnimation(item.id);
                    const leaveTimer = setTimeout(() => {
                      setLoadedMessages((prevLoadedMessages) => [
                        ...prevLoadedMessages,
                        item["id"],
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
                      className={`
                      ${
                        item.id === filteredData[currentBannerIndex]["id"]
                          ? "animate-circle-disappear"
                          : ""
                      } `}
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
