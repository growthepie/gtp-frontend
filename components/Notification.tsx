"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import { useLocalStorage } from "usehooks-ts";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BASE_URL } from "@/lib/helpers";
import { useTheme } from "next-themes";
import { track } from "@vercel/analytics";
import useSWR from "swr";
import type { NotificationType } from "@/app/api/notifications/route";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

const currentDateTime = new Date().getTime();

const Notification = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const mobileRef = useRef(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const currentPath = usePathname();
  const [seenNotifications, setSeenNotifications] = useLocalStorage<
    NotificationType[]
  >("seenNotifications", []);

  const { data, isLoading, isValidating, error } = useSWR(
    BASE_URL + "/api/notifications",
    {
      refreshInterval: 1000 * 60 * 5,
    },
  );

  const urlEnabled = useCallback(
    (url: string[] | string) => {
      let retValue = true;

      if (url !== "" && url[0] !== "all") {
        if (!(currentPath === "/") && url[0] === "home") {
          if (!currentPath.includes(url[0])) {
            retValue = false;
          }
        } else if (!currentPath.includes(url[0]) && url[0] !== "home") {
          retValue = false;
        }
      }
      return retValue;
    },
    [currentPath],
  );

  const filteredData = useMemo(() => {
    if (!data) return null;

    // Filter out records that are not within the start and end timestamps
    const filtered = data.filter(
      (record) =>
        currentDateTime >= record.startTimestamp &&
        currentDateTime < record.endTimestamp &&
        urlEnabled(record.displayPages ? record.displayPages : ""),
    );

    return filtered;
  }, [data, urlEnabled]);

  const hasUnseenNotifications = useMemo(() => {
    if (!filteredData) {
      return false;
    }
    return filteredData.some(
      (notification) =>
        !seenNotifications.map((n) => n.id).includes(notification.id),
    );
  }, [filteredData, seenNotifications]);

  const [hideText, setHideText] = useState(false);

  const TEXT_ROTATION_INTERVAL = 6000;
  const TEXT_FADE_INTERVAL = 300;

  useEffect(() => {
    if (!filteredData) return;

    let showTextTimeout;

    let hideTextTimeout = setTimeout(() => {
      setHideText(true);

      showTextTimeout = setTimeout(() => {
        setHideText(false);
      }, TEXT_FADE_INTERVAL);
    }, TEXT_ROTATION_INTERVAL - TEXT_FADE_INTERVAL);

    const interval = setInterval(() => {
      // Increment the index to show the next item in the carousel
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredData.length);

      hideTextTimeout = setTimeout(() => {
        setHideText(true);

        showTextTimeout = setTimeout(() => {
          setHideText(false);
        }, TEXT_FADE_INTERVAL);
      }, TEXT_ROTATION_INTERVAL - TEXT_FADE_INTERVAL);
    }, TEXT_ROTATION_INTERVAL);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
      clearTimeout(hideTextTimeout);
      clearTimeout(showTextTimeout);
    };
  }, [filteredData]);

  const Items = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return null;
    }
    return (
      <>
        {filteredData.map((item, i) => {
          return (
            <div
              key={item.id + item.url}
              className={`group hover:bg-forest-500/10 z-10`}
              onClick={() => {
                if (item.url) {
                  window.open(item.url, "_blank");
                }
              }}
            >
              <div
                key={item.id + item.url}
                className={`flex items-center pl-[12px] pr-[10px] relative pt-[10px] gap-x-[12px] ${i >= filteredData.length - 1
                  ? "pb-[10px]"
                  : "pb-[10px] border-b border-dashed border-forest-1000 dark:border-forest-500"
                  } w-auto ${item.url ? "cursor-pointer" : "cursor-normal"} flex`}
              >
                <div className="w-[12px] h-[12px]">
                  <Icon
                    icon={item.icon ? item.icon : "feather:bell"}
                    className={`w-[12px] h-[12px] text-forest-1000 dark:text-forest-800 dark:group-hover:text-forest-200  ${item.icon ? "visible" : "invisible"
                      }`}
                  />
                </div>
                <div className={`flex w-full flex-col z-20`}>
                  <div className="h-[17px] font-bold text-[14px] leading-[1.2]">
                    {item.desc}
                  </div>
                  <div className="h-auto text-[12px] leading-[1.5]">
                    <ReactMarkdown>{item.body}</ReactMarkdown>
                  </div>
                </div>
                <div
                  className={`w-[24px] h-[24px]  ${item.url ? "visible" : "invisible"
                    }`}
                >
                  <Icon
                    icon="feather:chevron-right"
                    className="relative w-[24px] h-[24px]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }, [filteredData]);

  function updateSeenNotifications() {
    // Add the notification id to the seenNotifications array
    setSeenNotifications(filteredData);
  }

  const handleShowNotifications = (isMobile = false) => {
    if (isMobile) {
      // show immediately on mobile
      // track("opened Notification Center", {
      //   location: "mobile header",
      //   page: currentPath,
      // });
      setOpenNotif(true);
      updateSeenNotifications();
    } else {
      // show after a delay on desktop
      hoverTimeoutRef.current = setTimeout(() => {
        // track("opened Notification Center", {
        //   location: "desktop header",
        //   page: currentPath,
        // });
        setOpenNotif(true);
        updateSeenNotifications();
      }, 300);
    }
  };

  const handleHideNotifications = () => {
    clearTimeout(hoverTimeoutRef.current as NodeJS.Timeout);
    setOpenNotif(false);
  };

  // clear the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current)
        clearTimeout(hoverTimeoutRef.current as NodeJS.Timeout);
    };
  }, []);

  const currentItemBackgroundColor = useMemo(() => {
    if (!filteredData) return null;

    if (
      !filteredData[currentIndex] ||
      !filteredData[currentIndex].backgroundColor
    ) {
      return theme === "dark" ? "#1F2726" : "#FFFFFF";
    }

    return filteredData[currentIndex].backgroundColor;
  }, [filteredData, currentIndex, theme]);

  const currentItemTextColor = useMemo(() => {
    if (!filteredData) return null;

    if (!filteredData[currentIndex] || !filteredData[currentIndex].textColor) {
      return theme === "dark" ? "#CDD8D3" : "#151A19";
    }

    return filteredData[currentIndex].textColor;
  }, [filteredData, currentIndex, theme]);

  const [ref, width] = useElementSizeObserver<HTMLDivElement>();

  if (!filteredData || filteredData.length === 0) return null;

  return (
    <div className="relative">
      {filteredData && (
        <>
          <div
            className={`hidden md:flex w-full relative ${openNotif ? "z-[110]" : "z-10"
              }`}
            onMouseEnter={() => {
              handleShowNotifications();
            }}
            onMouseLeave={() => {
              handleHideNotifications();
            }}
          >
            <div
              className={`hidden mb-[10px] lg:mb-0 md:flex items-center gap-x-[10px] overflow-hidden w-[305px] mdl:w-[343px] xl:w-[600px] 2xl:w-[770px] border-[1px] h-[36px] rounded-full px-[10px] relative z-30 border-forest-1000 dark:border-forest-500 hover:dark:!bg-[#1F2726] hover:!bg-[#FFFFFF] hover:dark:!border-[#CDD8D3] hover:!border-[#151A19] tansition-all duration-300`}
              style={{
                borderColor: currentItemTextColor,
                backgroundColor: currentItemBackgroundColor,
              }}
              ref={ref}
            >
              <div
                className={`w-full flex items-center justify-between ${openNotif || filteredData.length === 0 ? "block" : "hidden"
                  }`}
              >
                <div className="flex items-center gap-x-[10px]">
                  <div className="w-[16px] h-[16px] relative">
                    <Icon icon="feather:bell" className="w-[16px] h-[16px]" />
                  </div>
                  <p className="text-[12px] font-[500]">Notification Center</p>
                </div>
              </div>
              {filteredData.length > 0 && (
                <div
                  className={`${!openNotif && filteredData.length > 0
                    ? "relative flex items-center gap-x-[10px] text-[12px] leading-[1.5] w-full overflow-hidden transition-opacity duration-300"
                    : "hidden"
                    } ${hideText ? "opacity-0" : "opacity-100"}`}
                  style={{
                    color: currentItemTextColor,
                  }}
                >
                  <div
                    className={`relative w-[16px] h-[16px] rounded-full z-20`}
                  >
                    {hasUnseenNotifications && (
                      <div
                        className={`w-[6px] h-[6px] bg-red-500 rounded-full absolute -top-0 right-[1px] border tansition-colors duration-300 ${(!filteredData[currentIndex] ||
                          !filteredData[currentIndex]["backgroundColor"]) &&
                          "border-white dark:border-[#1F2726]"
                          }`}
                        style={{
                          borderColor:
                            filteredData[currentIndex] &&
                              filteredData[currentIndex]["backgroundColor"]
                              ? filteredData[currentIndex]["backgroundColor"]
                              : undefined,
                        }}
                      ></div>
                    )}
                    <Icon
                      icon={
                        filteredData[currentIndex] &&
                          filteredData[currentIndex].icon
                          ? filteredData[currentIndex].icon
                          : "feather:bell"
                      }
                      className={`w-[16px] h-[16px] light:text-[#1F2726]`}
                    />
                  </div>
                  <div
                    className="flex gap-x-[5px] whitespace-nowrap overflow-hidden w-full"
                    style={{
                      maskImage:
                        "linear-gradient(to right, black 90%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to right, black 90%, transparent 100%)",
                    }}
                  >
                    <div className="font-semibold">
                      {filteredData[currentIndex] &&
                        filteredData[currentIndex].desc
                        ? filteredData[currentIndex].desc
                        : ""}
                    </div>
                    <div>-</div>
                    <ReactMarkdown>
                      {filteredData[currentIndex] &&
                        filteredData[currentIndex].body
                        ? filteredData[currentIndex].body
                        : ""}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              <div className={`w-[24px] h-[24px] z-30`}>
                <Icon
                  icon="feather:chevron-right"
                  className={`w-[24px] h-[24px] transition-transform duration-300 ${openNotif ? "rotate-90" : "rotate-0"
                    }`}
                  onClick={() => {
                    // track("clicked Notification Center", {
                    //   location: "desktop header",
                    //   page: window.location.pathname,
                    // });
                    setOpenNotif(!openNotif);
                  }}
                  style={{
                    color:
                      (filteredData[currentIndex] &&
                        filteredData[currentIndex]["textColor"]) ||
                      "inherit",
                  }}
                />
              </div>
            </div>
            <div
              className={`absolute top-[18px] hidden mb-[10px] lg:mb-0 md:flex flex-col w-[305px] mdl:w-[343px] xl:w-[600px] 2xl:w-[770px] dark:bg-[#1F2726] bg-white border-forest-1000 dark:border-forest-500 rounded-b-xl z-1 overflow-hidden transition-all duration-300 ease-in-out ${openNotif ? "border" : "border-0"
                }`}
              style={{
                maxHeight: openNotif ? filteredData.length * 200 + "px" : "0",
              }}
            >
              <div className="h-[14px]"></div>
              <div>
                {filteredData.length === 0 ? (
                  <div
                    className={`flex border-b-forest-1000 dark:border-b-forest-500 border-dashed w-full mt-[8px]`}
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
          <div className="md:hidden">
            <div
              className={`relative flex md:hidden top-0.5 mr-10 justify-self-end hover:pointer cursor-pointer p-3 rounded-full ${openNotif ? "dark:bg-[#1F2726] bg-forst-50 z-40" : ""
                }
                `}
              onClick={() => {
                handleShowNotifications(true);
              }}
            >
              <div className="w-[24px] h-[24px] relative">
                {hasUnseenNotifications && (
                  <div className="w-[10px] h-[10px] bg-red-500 rounded-full absolute top-0 right-0.5 border-2 border-white dark:border-forest-1000"></div>
                )}
                <Icon icon="feather:bell" className="w-[24px] h-[24px]" />
              </div>
            </div>

            <div
              className={`fixed top-[80px] left-0 right-0 w-[95%] h-auto bg-white dark:bg-[#1F2726] rounded-2xl transition-max-height border-forest-1000 dark:border-forest-500 overflow-hidden break-inside-avoid ${openNotif
                ? "bg-blend-darken duration-300 ease-in-out z-40 border-[1px]"
                : "bg-blend-normal duration-300 ease-in-out border-[0px] "
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
                          className={`flex border-forest-1000 dark:border-forest-500 border-dashed w-full mt-[8px] hover:cursor-pointer  ${index < filteredData.length - 1
                            ? "border-b pb-1"
                            : "border-b-0 pb-1"
                            }`}
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <div className="flex flex-col w-full pl-[35px] pb-[8px] gap-y-[8px]">
                            <div className="min-h-[17px] font-bold text-[16px]">
                              {item.desc}
                            </div>
                            <div className="h-auto text-[14px] leading-snug">
                              <ReactMarkdown>{item.body}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="w-[35px] pr-[20px] self-center">
                            <Icon icon="feather:chevron-right" />
                          </div>
                        </Link>
                      ) : (
                        <div
                          className={`flex border-forest-1000 dark:border-forest-500 border-dashed w-full mt-[8px] ${index < filteredData.length - 1
                            ? "border-b pb-1"
                            : "border-b-0 pb-1"
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
          </div>
        </>
      )}

      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${openNotif ? "opacity-30  z-30" : "opacity-0 pointer-events-none"
          }`}
        // style={{ opacity: 0.3 }}
        onClick={() => {
          setOpenNotif(!openNotif);
        }}
      />
    </div>
  );
};

export default Notification;
