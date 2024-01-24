"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import { useMediaQuery } from "usehooks-ts";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BASE_URL } from "@/lib/helpers";
import { useTheme } from "next-themes";
import moment from "moment";
import { track } from "@vercel/analytics";

type AirtableRow = {
  id: string;
  body: string;
  desc: string;
  url?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  branch: boolean;
};

type NotificationType = {
  id: string;
  key: string;
};

const NOTICACHE = "NotificationCache";

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [data, setData] = useState<Array<object> | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState<string[]>([]);
  const [circleStart, setCircleStart] = useState(false);
  const [currentURL, setCurrentURL] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string | null>(null);
  const [sessionArray, setSessionArray] = useState<NotificationType[] | null>(
    null,
  );
  const [cachedNotifications, setCachedNotifications] = useState<string[]>([]);

  const [hoverID, setHoverID] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const mobileRef = useRef(null);
  const { theme } = useTheme();

  const isMobile = useMediaQuery("(max-width: 767px)");
  const currentPath = usePathname();

  // function isoDateTimeToUnix(
  //   dateString: string,
  //   timeString: string,
  // ): number | null {
  //   if (typeof dateString !== "string" || typeof timeString !== "string") {
  //     console.error("Invalid date or time type");
  //     return null;
  //   }

  //   const dateParts = dateString.split("-").map(Number);
  //   const timeParts = timeString.split(":").map(Number);

  //   if (dateParts.length !== 3 || timeParts.length !== 3) {
  //     console.error("Invalid date or time length");
  //     return null;
  //   }

  //   // Create a JavaScript Date object with the parsed date and time, and set it to the local time zone
  //   const localDate = new Date(
  //     dateParts[0],
  //     dateParts[1] - 1, // Month is 0-based in JavaScript
  //     dateParts[2],
  //     timeParts[0],
  //     timeParts[1],
  //     timeParts[2],
  //   );

  //   // Get the Unix timestamp (milliseconds since January 1, 1970)
  //   const unixTimestamp = localDate.getTime();

  //   return unixTimestamp;
  // }

  useEffect(() => {
    setCurrentURL(window.location.href);
    setPathname(window.location.pathname);
    const storedArray = JSON.parse(
      window.sessionStorage.getItem("mySessionArray") || "[]",
    ) as NotificationType[];
    setSessionArray(storedArray);
  }, [currentPath]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(BASE_URL + "/api/notifications", {
          method: "GET",
        });
        const result = await response.json();

        setData(result.records);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();

    const notiArray = localStorage.getItem(NOTICACHE);

    if (notiArray) {
      const testArray = JSON.parse(notiArray);
      const newNotifications = Array.isArray(testArray)
        ? testArray
        : [testArray];

      // Update cachedNotifications by appending new notifications
      setCachedNotifications(newNotifications);
    }
  }, []);

  // useEffect(() => {
  //   // Attach event listener when the component mounts
  //   document.addEventListener("mousedown", handleClickOutside);

  //   // Detach event listener when the component unmounts
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  function DateEnabled(startTime, startDate, endTime, endDate) {
    const startDateTime = moment.utc(`${startDate}T${startTime}Z`).valueOf();
    const endDateTime = moment.utc(`${endDate}T${endTime}Z`).valueOf();

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

  // const handleClickOutside = (event: MouseEvent) => {
  //   if (
  //     mobileRef.current &&
  //     "contains" in mobileRef.current &&
  //     !(mobileRef.current as Element).contains(event.target as Node)
  //   ) {
  //     setOpenNotif(false);
  //   }
  // };

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
            desc: data[item]["fields"]["Head"],
            url: data[item]["fields"]["URL"]
              ? data[item]["fields"]["URL"]
              : null,
            icon: data[item]["fields"]["Icon"]
              ? data[item]["fields"]["Icon"]
              : null,
            color: data[item]["fields"]["Color"]
              ? data[item]["fields"]["Color"]
              : null,
            textColor: data[item]["fields"]["Text Color"]
              ? data[item]["fields"]["Text Color"]
              : null,
            branch: data[item]["fields"]["Branch"]
              ? data[item]["fields"]["Branch"] === "Development" &&
                (process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ||
                  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview")
                ? true
                : data[item]["fields"]["Branch"] === "Production" &&
                  process.env.NEXT_PUBLIC_VERCEL_ENV !== "development" &&
                  process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"
                ? true
                : false
              : false,
          };
          if (newEntry.branch) {
            returnArray.push(newEntry);
          }
        }
      });
    }

    return returnArray;
  }, [data, currentURL]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Increment the index to show the next item in the carousel

      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredData.length);
    }, 5000); // Adjust the interval as needed

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [filteredData]); // Remove currentIndex from the dependency array

  const Items = useMemo(() => {
    if (!filteredData) {
      return null;
    }
    return (
      <>
        {filteredData.map((item, i) => {
          return (
            <div
              key={item.id + item.url}
              className={`hover:bg-forest-500/10 z-10`}
              onClick={() => {
                if (item.url) {
                  window.open(item.url, "_blank");
                }
              }}
              onMouseEnter={() => {
                setHoverID((prevHoverID) => {
                  return item.id;
                });
              }}
              onMouseLeave={() => {
                setHoverID((prevHoverID) => {
                  return null; // Return the new value for the state
                });
              }}
            >
              <div
                key={item.id + item.url}
                className={`relative pb-1 pt-[6px] ${
                  i >= filteredData.length - 1
                    ? "pb-1"
                    : "pb-0 border-b border-forest-50 border-dashed"
                } ${
                  openNotif ? "w-auto" : "w-[305px] mdl:w-[343px] xl:w-[600px]"
                } ${item.url ? "cursor-pointer" : "cursor-normal"} flex`}
                onMouseEnter={() => {
                  setHoverID(item.id);
                }}
                onMouseLeave={() => {
                  setHoverID(null);
                }}
              >
                <div className="flex items-center w-[34px] justify-center   ">
                  {item.icon && (
                    <Icon
                      icon={item.icon || "default-icon"}
                      className={`w-[12px] h-[12px] text-forest-50  ${
                        item.icon ? "visible" : "invisible"
                      } ${
                        hoverID === item.id
                          ? "text-forest-200"
                          : "text-forest-800"
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`flex w-full flex-col  pb-[8px] gap-y-[5px] z-20 `}
                >
                  <div className="h-[17px] font-bold text-[14px] ">
                    {item.desc}
                  </div>
                  <div className="h-auto text-[12px] leading-[.75rem] ">
                    <ReactMarkdown>{item.body}</ReactMarkdown>
                  </div>
                </div>
                <div
                  className={`w-[24px] h-[24px] pr-[19px] my-auto ml-auto  ${
                    item.url ? "visible" : "invisible"
                  }`}
                >
                  <Icon icon="ci:chevron-right" className="relative top-1" />
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }, [filteredData, hoverID]);

  function hexToRgba(hexColor) {
    // This function will always set the alpha to 0
    const cleanHexColor = hexColor.replace("#", "");

    const hexValue = parseInt(cleanHexColor, 16);
    const red = (hexValue >> 16) & 255;
    const green = (hexValue >> 8) & 255;
    const blue = hexValue & 255;

    return `rgba(${red}, ${green}, ${blue}, 0)`;
  }

  function storeLocalNotifications() {
    filteredData.forEach((element, index) => {
      let arrSearch = cachedNotifications.indexOf(element["id"]);
      if (arrSearch === -1) {
        cachedNotifications.push(element["id"]);
      }
    });
    //Search local storage for notification. If not stored push it onto array and store locally.

    localStorage.setItem(NOTICACHE, JSON.stringify(cachedNotifications));
  }

  // console.log(cachedNotifications);
  return (
    <div className="relative">
      {filteredData && (
        <>
          {!isMobile ? (
            <div
              className={`flex w-full relative ${
                openNotif ? "z-[110]" : "z-10"
              }`}
              onMouseEnter={() => {
                track("hovered Notification Center", {
                  location: "desktop header",
                  page: window.location.pathname,
                });
                setOpenNotif(true);
              }}
              onMouseLeave={() => {
                setOpenNotif(false);
                storeLocalNotifications();
              }}
            >
              <button
                className={`hidden mb-[10px] lg:mb-0 md:flex items-center gap-x-[10px] overflow-hidden w-[305px] mdl:w-[343px] xl:w-[600px] border-[1px] h-[28px] rounded-full   px-[7px] relative z-30 ${
                  filteredData[currentIndex] &&
                  filteredData[currentIndex]["color"]
                    ? openNotif
                      ? "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                      : `bg-[${filteredData[currentIndex]["color"]}]`
                    : "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                }
                `}
              >
                {openNotif || filteredData.length === 0 ? (
                  <div className="w-full flex">
                    {filteredData.every((notification) =>
                      cachedNotifications.includes(notification["id"]),
                    ) ? (
                      <Image
                        src="/FiBellRead.svg"
                        width={16}
                        height={16}
                        alt="Bell image"
                        className="text-forest-900"
                      />
                    ) : (
                      <Image
                        src="/FiBell.svg"
                        width={16}
                        height={16}
                        alt="Bell image"
                        className="text-forest-900"
                      />
                    )}
                    <p className="text-[12px] font-[500] pl-[7px]">
                      Notification Center
                    </p>{" "}
                    <div className="absolute right-2">
                      <Icon
                        icon={`${
                          openNotif ? "ci:chevron-down" : "ci:chevron-right"
                        }`}
                        className="w-[16px] h-[16px]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`px-[0px] relative w-[16px] h-[16px] rounded-full z-30 ${
                        filteredData[currentIndex] &&
                        filteredData[currentIndex]["color"]
                          ? `bg-[${filteredData[currentIndex]["color"]}]`
                          : "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                      }`}
                    >
                      {filteredData[currentIndex] &&
                      filteredData[currentIndex]["icon"] ? (
                        <Icon
                          icon={
                            filteredData[currentIndex]["icon"] || "default-icon"
                          }
                          className={`w-[16px] h-[16px] text-forest-50`}
                        />
                      ) : filteredData.every((notification) =>
                          cachedNotifications.includes(notification["id"]),
                        ) ? (
                        <Image
                          src="/FiBellRead.svg"
                          width={16}
                          height={16}
                          alt="Bell image"
                          className="text-forest-900"
                        />
                      ) : (
                        <Image
                          src="/FiBell.svg"
                          width={16}
                          height={16}
                          alt="Bell image"
                          className="text-forest-900"
                        />
                      )}
                    </div>
                    <div
                      className="flex absolute transition-transform duration-500 h-full"
                      style={{
                        transform: `translateX(-${
                          (100 / filteredData.length) * currentIndex
                        }%)`,
                      }}
                    >
                      {filteredData.map((item, i) => {
                        return (
                          <div
                            className={`hover:pointer ml-[25px]`}
                            onClick={() => {
                              if (item.url) {
                                window.open(item.url, "_blank");
                              }
                            }}
                            key={item.id + item.desc}
                          >
                            <div
                              key={item.id}
                              className={`flex border-b-white border-dashed w-full items-center mr-[10px] xl:mr-0 overflow-hidden h-full ${
                                openNotif
                                  ? "w-auto"
                                  : "w-[305px] mdl:w-[343px] xl:w-[600px] "
                              } relative`}
                            >
                              <div
                                className={`flex  w-[255px] mdl:w-[293px] xl:w-[550px] items-center whitespace-nowrap gap-x-2 overflow-hidden relative`}
                              >
                                <div
                                  className="font-bold text-[14px]"
                                  style={{
                                    color: item.textColor || "inherit",
                                  }}
                                >
                                  {item.desc}
                                </div>
                                <div
                                  className="-px-1"
                                  style={{
                                    color: item.textColor || "inherit",
                                  }}
                                >
                                  -
                                </div>
                                <div className="flex text-[12px] leading-[.75rem] whitespace-nowrap relative w-full overflow-hidden">
                                  <div
                                    className={`absolute top-0 bottom-0 left-0 right-0 `}
                                    style={{
                                      color: item.textColor || "inherit",

                                      backgroundImage:
                                        filteredData[currentIndex] &&
                                        filteredData[currentIndex]["color"]
                                          ? `linear-gradient(90deg, ${filteredData[currentIndex]["color"]}00 75%, ${filteredData[currentIndex]["color"]}FF 97%)`
                                          : theme === "dark"
                                          ? "linear-gradient(90deg, #2a343300 75%, #2a3433FF 97%)"
                                          : "linear-gradient(90deg, #FFFFFF00 75%, #FFFFFFFF 97%)",
                                    }}
                                  ></div>
                                  <ReactMarkdown
                                    components={{
                                      p: ({ node, ...props }) => (
                                        <p
                                          style={{
                                            color: item.textColor || "inherit",
                                          }}
                                          {...props}
                                        />
                                      ),
                                    }}
                                  >
                                    {item.body}
                                  </ReactMarkdown>
                                  {/* Pseudo-element for gradient fade effect */}
                                  {/* Mask for gradient fade effect */}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className={`px-[0px] absolute right-2 w-[16px] h-[16px]  z-30 ${
                        filteredData[currentIndex] &&
                        filteredData[currentIndex]["color"]
                          ? `bg-[${filteredData[currentIndex]["color"]}]`
                          : "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                      }`}
                    >
                      <Icon
                        icon="ci:chevron-right"
                        style={{
                          width: "16px",
                          height: "16px",
                          color:
                            filteredData[currentIndex] &&
                            filteredData[currentIndex]["textColor"]
                              ? filteredData[currentIndex]["textColor"]
                              : "inherit",
                        }}
                        onClick={() => {
                          track("clicked Notification Center", {
                            location: "desktop header",
                            page: window.location.pathname,
                          });
                          setOpenNotif(!openNotif);
                        }}
                      />
                    </div>
                  </>
                )}
              </button>
              <div
                className={`absolute hidden mb-[10px] lg:mb-0 md:flex flex-col w-[305px] mdl:w-[343px] xl:w-[600px]  top-[1px] dark:bg-forest-900 bg-forest-50 border-forest-50 rounded-b-xl rounded-t-xl z-1 overflow-hidden transition-max-height ${
                  openNotif
                    ? "max-h-screen duration-300 ease-in-out border-[1px]"
                    : "max-h-[24px] duration-300 ease-in-out border-[0px]"
                }`}
                // style={{
                //   maxHeight: openNotif ? "fit-content duration-400 ease-in" : "0px duration-200 ease-out",
                // }}
              >
                <div className="h-[28px]  "></div>
                <div>
                  {filteredData.length === 0 ? (
                    <div
                      className={`flex border-b-white border-dashed w-full mt-[8px]`}
                    >
                      <div className="flex flex-col w-full pl-[32px] pb-[8px] gap-y-[5px]">
                        <div className="h-[17px] font-semibold text-[15px]">
                          There are currently no notifications.
                        </div>
                        <div className="h-auto text-[12px] leading-[.75rem]"></div>
                      </div>
                    </div>
                  ) : (
                    Items
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`relative flex md:hidden mt-[2px] mr-10 justify-self-end hover:pointer cursor-pointer p-3 rounded-full ${
                  openNotif ? "dark:bg-forest-900 bg-forest-50 z-[110]" : ""
                }
            `}
                onClick={() => {
                  track("clicked Notification Center", {
                    location: "mobile header",
                    page: window.location.pathname,
                  });
                  setOpenNotif(!openNotif);
                }}
              >
                {" "}
                {filteredData.every((notification) =>
                  cachedNotifications.includes(notification["id"]),
                ) ? (
                  <Image
                    src="/FiBellRead.svg"
                    width={16}
                    height={16}
                    alt="Bell image"
                    className="text-forest-900"
                  />
                ) : (
                  <Image
                    src="/FiBell.svg"
                    width={16}
                    height={16}
                    alt="Bell image"
                    className="text-forest-900"
                  />
                )}
              </div>

              <div
                className={`fixed top-[80px] left-0 right-0 w-[95%] h-auto bg-forest-900 rounded-2xl transition-max-height border-forest-50  overflow-hidden break-inside-avoid z-[110] ${
                  openNotif
                    ? "bg-blend-darken duration-300 ease-in-out z-[110] border-[1px]"
                    : "bg-blend-normal duration-300 ease-in-out z-50 border-[0px] "
                }`}
                style={{
                  maxHeight: openNotif ? "100vh" : "0",
                  margin: "auto",
                }}
                ref={mobileRef}
              >
                {filteredData.length === 0 ? (
                  <div className="flex flex-col w-full pl-[32px] pt-[3px] pb-2  gap-y-[5px] justify-center">
                    <div className="h-[17px] font-semibold text-[15px]">
                      There are currently no notifications.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col w-[100%] pl-[0px] py-[8px] gap-y-[5px] ">
                    {filteredData.map((item, index) => (
                      <div key={item.id}>
                        {item.url ? (
                          <Link
                            className={`flex border-b-white border-dashed w-full mt-[8px] hover:cursor-pointer  ${
                              index < filteredData.length - 1
                                ? "border-b-[1px] pb-1"
                                : "border-b-[0px] pb-1"
                            }`}
                            href={item.url}
                          >
                            <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[8px]">
                              <div className="h-[17px] font-bold text-[16px]">
                                {item.desc}
                              </div>
                              <div className="h-auto text-[14px] leading-snug">
                                <ReactMarkdown>{item.body}</ReactMarkdown>
                              </div>
                            </div>
                            <div className="w-[35px] pr-[20px] self-center">
                              <Icon icon="ci:chevron-right" />
                            </div>
                          </Link>
                        ) : (
                          <div
                            className={`flex border-b-white border-dashed w-full mt-[8px] ${
                              index < filteredData.length - 1
                                ? "border-b-[1px] pb-1"
                                : "border-b-[0px] pb-1"
                            }`}
                          >
                            <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[8px] ">
                              <div className="h-[17px] font-bold text-[16px]">
                                {item.desc}
                              </div>
                              <div className="h-auto text-[14px] leading-[.75rem]">
                                <ReactMarkdown>{item.body}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {openNotif && (
        <div
          className="fixed inset-0 bg-black opacity-0 transition-opacity duration-500 z-[100]"
          style={{ opacity: 0.3 }}
          onClick={() => {
            setOpenNotif(!openNotif);
          }}
        />
      )}
    </div>
  );
};

export default Notification;
