"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Markdown from "react-markdown";
import { useMediaQuery } from "usehooks-ts";
import { usePathname } from "next/navigation";

type AirtableRow = {
  id: string;
  body: string;
};

type NotificationType = {
  id: string;
  key: string;
};

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [circleDisappear, setCircleDisappear] = useState(false);
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentTuple, setCurrentTuple] = useState<object | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<string[]>([]);
  const [circleStart, setCircleStart] = useState(false);
  const [exitAnimation, setExitAnimation] = useState<string | null>(null);
  const [dataLength, setDataLength] = useState(0);
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string | null>(null);
  const [sessionArray, setSessionArray] = useState<NotificationType[] | null>(
    null,
  );

  const isMobile = useMediaQuery("(max-width: 767px)");
  const currentPath = usePathname();

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
    setPathname(window.location.pathname);
    const storedArray = JSON.parse(
      window.sessionStorage.getItem("mySessionArray") || "[]",
    ) as NotificationType[];
    setSessionArray(storedArray);
  }, [currentPath]);

  const baseURL =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
      ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;

  useEffect(() => {
    const fetchData = async () => {
      if (
        process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
      ) {
        try {
          const response = await fetch(baseURL + "/api/notifications", {
            method: "GET",
          });
          const result = await response.json();

          setData(result.records);
        } catch (error) {
          console.error("Error fetching data: ", error);
        }
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

    if (url !== "" && url[0] !== "all" && currentURL && pathname) {
      if (!(pathname === "/") && url[0] === "home") {
        if (!currentURL.includes(url[0])) {
          retValue = false;
        }
      } else if (!currentURL.includes(url[0]) && url[0] !== "home") {
        retValue = false;
      }
    }
    return retValue;
  }

  const addItemToArray = (newData: string) => {
    if (newData.trim() !== "") {
      const newItem: NotificationType = {
        id: "LoadedNotifications",
        key: newData,
      };

      setSessionArray((prevArray) => [...(prevArray || []), newItem]);
    }
  };

  const filteredData = useMemo(() => {
    const returnArray: AirtableRow[] = [];

    if (data && sessionArray) {
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

        let prevLoaded = true;
        //defaults to true if we find a prevLoaded value we set false

        Object.keys(sessionArray).forEach((index) => {
          if (sessionArray[index].key === data[item].id) {
            prevLoaded = false;
          }
        });

        //Check if notification is enabled, available/current date range and selected url

        if (enabled && passingDate && passingURL && prevLoaded) {
          let newEntry: AirtableRow = {
            id: data[item]["id"],
            body: data[item]["fields"]["Body"],
          };

          returnArray.push(newEntry);
        }
      });
    }

    return returnArray;
  }, [data, currentURL]);

  useEffect(() => {
    if (Object.keys(filteredData).length > 0) {
      const animationDuration = 7900; // Time to stay in position
      const leaveDuration = 400;

      setCircleStart(true);
      const timer = setTimeout(() => {
        const currentItem = filteredData[currentBannerIndex];

        setCurrentBannerIndex((currentBannerIndex + 1) % filteredData.length);
        setCircleStart(false);
        setExitAnimation(currentItem.id);
        const leaveTimer = setTimeout(() => {
          addItemToArray(currentItem.id);
          setLoadedMessages((prevLoadedMessages) => [
            ...prevLoadedMessages,
            currentItem.id,
          ]);
        }, leaveDuration);
      }, animationDuration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [data, filteredData, currentBannerIndex, loadedMessages]);

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
              className={`fixed ${
                !isMobile ? "bottom-12" : "bottom-[100px]"
              } z-50`}
              style={{
                right:
                  item.id !== filteredData[currentBannerIndex]["id"] &&
                  exitAnimation !== item.id
                    ? "-500px"
                    : !isMobile
                    ? "100px"
                    : "10px", // Adjust the values as needed
                transform:
                  exitAnimation === item.id
                    ? "translateY(-100px)"
                    : "translateY(0)",
                opacity: exitAnimation === item.id ? 0 : 1, // Transition from 1 to 0 opacity
                transition:
                  "right 400ms ease-in-out, transform 300ms ease-in-out, opacity 400ms ease-in-out", // Adjust duration and easing as needed
              }}
            >
              <div
                className={`flex items-center dark:border-forest-400 border-b-[1px] dark:bg-[#1F2726] bg-white min-h-[50px] max-h-[75px] rounded-full px-[12px] relative ${
                  isMobile ? "w-[400px]" : "w-[500px]"
                }`}
              >
                <div className="w-[85%] text-[16px]">
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
                    addItemToArray(item.id);
                    setExitAnimation(item.id);
                    const leaveTimer = setTimeout(() => {
                      setLoadedMessages((prevLoadedMessages) => [
                        ...prevLoadedMessages,
                        item["id"],
                      ]);
                    }, leaveDuration);
                  }}
                >
                  <Icon
                    icon="ph:x"
                    className={`absolute  ${
                      !isMobile ? "w-[30px] h-[30px]" : "w-[25px] h-[25px]"
                    }`}
                  />
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
                        item.id === filteredData[currentBannerIndex]["id"] &&
                        circleStart
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
