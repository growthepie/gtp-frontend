"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSpring, animated, config, useTransition } from "react-spring";
import Image from "next/image";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BASE_URL } from "@/lib/helpers";
import { useTheme } from "next-themes";
import moment from "moment";
import { track } from "@vercel/analytics";
import useSWR from "swr";
import { Notification } from "@/app/api/notifications/route";

type NotificationType = {
  id: string;
  key: string;
};

const NOTICACHE = "NotificationCache";

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [hoverID, setHoverID] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const mobileRef = useRef(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();

  const isMobile = useMediaQuery("(max-width: 767px)");
  const currentPath = usePathname();

  const [seenNotifications, setSeenNotifications] = useLocalStorage<
    Notification[]
  >("seenNotifications", []);

  const { data, isLoading, isValidating, error } = useSWR(
    BASE_URL + "/api/notifications",
    {
      refreshInterval: 1000 * 60 * 5,
    },
  );

  const filteredData = useMemo(() => {
    if (!data) return null;

    // Filter out records that are not within the start and end timestamps
    const filtered = data.filter(
      (record) =>
        currentDateTime >= record.startTimestamp &&
        currentDateTime < record.endTimestamp,
    );

    return filtered;
  }, [data]);

  const hasUnseenNotifications = useMemo(() => {
    if (!filteredData) {
      return false;
    }
    return filteredData.some(
      (notification) =>
        !seenNotifications.map((n) => n.id).includes(notification.id),
    );
  }, [filteredData, seenNotifications]);

  useEffect(() => {
    if (!filteredData) return;
    const interval = setInterval(() => {
      // Increment the index to show the next item in the carousel
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredData.length);
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [filteredData]);

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
  }, [filteredData, hoverID, openNotif]);

  function updateSeenNotifications() {
    // Add the notification id to the seenNotifications array
    setSeenNotifications(filteredData);
  }

  const handleShowNotifications = (isMobile = false) => {
    if (isMobile) {
      // show immediately on mobile
      track("opened Notification Center", {
        location: "mobile header",
        page: currentPath,
      });
      setOpenNotif(true);
    } else {
      // show after a delay on desktop
      hoverTimeoutRef.current = setTimeout(() => {
        track("opened Notification Center", {
          location: "desktop header",
          page: currentPath,
        });
        setOpenNotif(true);
      }, 300);
    }
  };

  const handleHideNotifications = () => {
    clearTimeout(hoverTimeoutRef.current as NodeJS.Timeout);
    setOpenNotif(false);
    updateSeenNotifications();
  };

  // clear the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current)
        clearTimeout(hoverTimeoutRef.current as NodeJS.Timeout);
    };
  }, []);

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
                handleShowNotifications();
              }}
              onMouseLeave={() => {
                handleHideNotifications();
              }}
            >
              <button
                className={`hidden mb-[10px] lg:mb-0 md:flex items-center gap-x-[10px] overflow-hidden w-[305px] mdl:w-[343px] xl:w-[600px] border-[1px] h-[28px] rounded-full   px-[7px] relative z-30 ${
                  filteredData[currentIndex] &&
                  filteredData[currentIndex]["backgroundColor"]
                    ? openNotif
                      ? "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                      : `bg-[${filteredData[currentIndex]["backgroundColor"]}]`
                    : "dark:border-forest-50 border-black bg-white dark:bg-forest-900"
                }
                `}
              >
                {openNotif || filteredData.length === 0 ? (
                  <div className="w-full flex">
                    {!hasUnseenNotifications ? (
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
                        filteredData[currentIndex]["backgroundColor"]
                          ? `bg-[${filteredData[currentIndex]["backgroundColor"]}]`
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
                      ) : !hasUnseenNotifications ? (
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
                                        filteredData[currentIndex][
                                          "backgroundColor"
                                        ]
                                          ? `linear-gradient(90deg, ${filteredData[currentIndex]["backgroundColor"]}00 75%, ${filteredData[currentIndex]["backgroundColor"]}FF 97%)`
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
                        filteredData[currentIndex]["backgroundColor"]
                          ? `bg-[${filteredData[currentIndex]["backgroundColor"]}]`
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
                className={`relative flex md:hidden top-1.5 mr-10 justify-self-end hover:pointer cursor-pointer p-3 rounded-full ${
                  openNotif ? "dark:bg-forest-900 bg-forst-50 z-[110]" : ""
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
                {!hasUnseenNotifications ? (
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
