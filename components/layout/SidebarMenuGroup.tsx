"use client";
import { useEffect, useState, ReactNode, useMemo, useRef, memo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import {
  MasterURL,
} from "@/lib/urls";
import { NavigationItem } from "@/lib/navigation";
import { navigationCategories } from "@/lib/navigation";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  Get_AllChainsNavigationItems,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { GTPIcon, GTPIconSize } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";

type SidebarProps = {
  item: NavigationItem;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  sidebarOpen: boolean;
};

export const SidebarMenuLink = memo(({
  item,
  sidebarOpen,
}: SidebarProps) => {
  const { isMobile } = useUIContext();
  const pathname = usePathname();

  const isActive = useMemo(() => {
    if (item.href) return pathname.startsWith(item.href);
    return false;
  }, [item.href, pathname]);

  return (
    <>
    <Accordion
      icon={item.icon as GTPIconName}
      size="lg"
      background="none"
      iconBackground="none"
      label={item.label}
      link={item.href}
      hideLabel={!sidebarOpen && !isMobile}
      isActive={isActive}
      onToggle={() => {}}
      rightContent={
        item.newChild && (
          <div className="pointer-events-none absolute bottom-[8px] right-[0px] top-[8px] flex items-center justify-center overflow-hidden text-xs font-bold transition-all duration-300 md:right-[20px]">
            <div
              className={`h-full w-[50px] rounded-full bg-gradient-to-t from-[#FFDF27] to-[#FE5468] transition-all duration-300 md:rounded-br-none md:rounded-tr-none ${
                (!sidebarOpen && !isMobile) || isActive
                  ? "translate-x-[60px] opacity-0 ease-in-out"
                  : "translate-x-0 opacity-100 delay-300 ease-in-out"
              }`}
            >
              <div className="hard-shine-2 absolute inset-0 flex items-center justify-end rounded-full pr-[8px] text-xs font-bold text-forest-900 transition-all duration-300 md:rounded-br-none md:rounded-tr-none">
                NEW!
              </div>
            </div>
          </div>
        )
      }
    />
    <div className="mb-[10px]"/>
    </>
  );
});

SidebarMenuLink.displayName = "SidebarMenuLink";

export const SidebarMenuGroup = memo(({
  item,
  onOpen,
  onClose,
  sidebarOpen,
}: SidebarProps) => {
  const { isMobile } = useUIContext();
  const { data: master } = useSWR<MasterResponse>(MasterURL);

  const ChainGroups = useMemo(() => {
    if (!master) return {};

    // const chainGroups = {};

    const chainItemsByKey = Get_AllChainsNavigationItems(master)
      .options.filter((option) => option.hide !== true)
      .filter(
        (option) =>
          option.key && Get_SupportedChainKeys(master).includes(option.key),
      )
      .reduce((acc, option) => {
        if (option.key) acc[option.key] = option;
        return acc;
      }, {});

    // group master.chains by bucket
    const chainsByBucket = Object.entries(master.chains).reduce(
      (acc, [chainKey, chainInfo]) => {
        if (!acc[chainInfo.bucket]) {
          acc[chainInfo.bucket] = [];
        }

        if (chainItemsByKey[chainKey])
          acc[chainInfo.bucket].push(chainItemsByKey[chainKey]);

        return acc;
      },
      {},
    );

    // sort each bucket in alphabetical order
    Object.keys(chainsByBucket).forEach((bucket) => {
      chainsByBucket[bucket].sort((a, b) => a.label.localeCompare(b.label));
    });

    return chainsByBucket;
  }, [master]);

  const { AllChainsByKeys } = useMaster();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const urlParts = useMemo(() => {
    if (!pathname) {
      return ["", ""];
    }

    const parts = pathname.slice(1).split("/");
    switch (parts.length) {
      case 0:
        return ["", ""];
      case 1:
        return [parts[0], ""];
      case 2:
        return [parts[0], parts[1]];
      default:
        return parts;
    }
  }, [pathname]);

  useEffect(() => {
    let openState = false;

    const optionURLs = item.options.map((o) => o.url);

    if (optionURLs.includes(pathname)) {
      openState = true;
    } else {
      if (pathname === "/" && item.name === "Fundamentals") {
        openState = true;
      } else {
        openState = false;
      }
    }

    setIsOpen(openState);
  }, [item.name, item.options, pathname, urlParts]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpen && onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose && onClose();
  };

  return (
    <Accordion
      icon={item.icon as GTPIconName}
      iconBackground="none"
      size="lg"
      background="none"
      label={item.label}
      onToggle={handleToggle}
      isOpen={isOpen}
      hideLabel={!sidebarOpen && !isMobile}
      className=""
      accordionClassName="mb-[10px]"
      rightContent={
        item.newChild && (
          <div className="pointer-events-none absolute bottom-[8px] right-[0px] top-[8px] flex items-center justify-center overflow-hidden text-xs font-bold transition-all duration-300 md:right-[20px]">
            <div
              className={`h-full w-[50px] rounded-full bg-gradient-to-t from-[#FFDF27] to-[#FE5468] transition-all duration-300 md:rounded-br-none md:rounded-tr-none ${
                !sidebarOpen || isOpen
                  ? "translate-x-[60px] opacity-0 ease-in-out"
                  : "translate-x-0 opacity-100 delay-300 ease-in-out"
              }`}
            >
              <div className="hard-shine-2 absolute inset-0 flex items-center justify-end rounded-full pr-[8px] text-xs font-bold text-forest-900 transition-all duration-300 md:rounded-br-none md:rounded-tr-none">
                NEW!
              </div>
            </div>
          </div>
        )
      }
    >
      {item.label === "Chains" ? (
        <div className="gap-y-[5px] pl-[9px]">
          {Object.keys(ChainGroups).length > 0 &&
            Object.entries(ChainGroups).map(([bucket, chains]: any) => {
              if (chains.length === 0) return <div key={bucket}></div>;

              return (
                <div key={bucket} className="flex w-full flex-col">
                  <div
                    className="px-[5px] py-[5px] text-[14px] font-bold text-[#5A6462]"
                    style={{ fontVariant: "all-small-caps" }}
                  >
                    {sidebarOpen ? bucket.toUpperCase() : <span>&nbsp;</span>}
                  </div>
                  {chains.map((option) => (
                    <Accordion
                      key={option.key}
                      size={"sm"}
                      background="none"
                      icon={option.icon as GTPIconName}
                      iconBackground="dark"
                      iconColor={
                        option.url && pathname.localeCompare(option.url) === 0
                          ? AllChainsByKeys[option.key].colors["dark"][1]
                          : "#5A6462"
                      }
                      iconHoverColor={
                        AllChainsByKeys[option.key].colors["dark"][1]
                      }
                      label={option.label}
                      hideLabel={!sidebarOpen && !isMobile}
                      link={option.url}
                      isActive={
                        option.url
                          ? pathname.localeCompare(option.url) === 0
                          : false
                      }
                      rightContent={
                        option.showNew && (
                          <div className="absolute bottom-1 right-[2px] top-1 flex items-center justify-center overflow-hidden text-xs font-bold transition-all duration-300 md:right-[16px]">
                            <div
                              className={`h-full w-[50px] rounded-full bg-gradient-to-t from-[#FFDF27] to-[#FE5468] transition-all duration-300 md:rounded-br-none md:rounded-tr-none ${
                                sidebarOpen && isOpen
                                  ? "translate-x-[0px] opacity-100 delay-300 ease-in-out"
                                  : "translate-x-[60px] opacity-0 ease-in-out"
                              }`}
                            >
                              <div className="hard-shine-2 absolute inset-0 flex items-center justify-end rounded-full pr-[8px] text-xs font-bold text-forest-900 transition-all duration-300 md:rounded-br-none md:rounded-tr-none">
                                NEW!
                              </div>
                            </div>
                          </div>
                        )
                      }
                    />
                  ))}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="w-full gap-y-[-5px] px-[3px]">
          {item.options
            .filter((o) => o.hide !== true)
            .map((option, i) => {
              let label = <></>;

              if (option.category) {
                // Check if this is the first item in the category
                if (
                  // Assuming `i` is defined correctly
                  i === 0 ||
                  option.category !== item.options[i - 1].category
                ) {
                  label = (
                    <div
                      className="p-[5px] text-[14px] font-bold text-[#5A6462]"
                      style={{ fontVariant: "all-small-caps" }}
                    >
                      {!sidebarOpen && !isMobile ? (
                        <span>&nbsp;</span>
                      ) : (
                        navigationCategories[
                          option.category
                        ].label.toUpperCase()
                      )}
                    </div>
                  );
                }
              }

              return (
                <div
                  key={option.key}
                  className="flex w-full flex-col gap-y-[-5px]"
                >
                  {label}
                  <Accordion
                    key={option.key}
                    size={"md"}
                    background="none"
                    icon={option.icon as GTPIconName}
                    iconBackground="dark"
                    label={option.label}
                    hideLabel={!sidebarOpen && !isMobile}
                    link={option.url}
                    isActive={
                      option.url
                        ? pathname.localeCompare(option.url) === 0
                        : false
                    }
                    rightContent={
                      option.showNew && (
                        <div className="absolute bottom-1 right-[2px] top-1 flex items-center justify-center overflow-hidden text-xs font-bold transition-all duration-300 md:right-[16px]">
                          <div
                            className={`h-full w-[50px] rounded-full bg-gradient-to-t from-[#FFDF27] to-[#FE5468] transition-all duration-300 md:rounded-br-none md:rounded-tr-none ${
                              sidebarOpen && isOpen
                                ? "translate-x-[0px] opacity-100 delay-300 ease-in-out"
                                : "translate-x-[60px] opacity-0 ease-in-out"
                            }`}
                          >
                            <div className="hard-shine-2 absolute inset-0 flex items-center justify-end rounded-full pr-[8px] text-xs font-bold text-forest-900 transition-all duration-300 md:rounded-br-none md:rounded-tr-none">
                              NEW!
                            </div>
                          </div>
                        </div>
                      )
                    }
                  />
                </div>
              );
            })}
        </div>
      )}
    </Accordion>
  );
});

SidebarMenuGroup.displayName = "SidebarMenuGroup";

type AccordionProps = {
  className?: string;
  accordionClassName?: string;
  icon: GTPIconName;
  iconColor?: string;
  iconHoverColor?: string;
  label: string;
  link?: string;
  background: "none" | "medium" | "dark-border";
  iconBackground?: "none" | "dark";
  size: "sm" | "md" | "lg";
  children?: ReactNode;
  maxHeight?: number;
  isOpen?: boolean;
  hideLabel?: boolean;
  isActive?: boolean;
  onToggle?: () => void;
  width?: string | undefined;
  rightContent?: ReactNode;
};

export const Accordion = memo(({
  className = "",
  accordionClassName = "",
  icon,
  iconColor = "#5A6462",
  iconHoverColor = undefined,
  label,
  link,
  background,
  iconBackground = "dark",
  size,
  children,
  maxHeight = 1000,
  isOpen = false,
  hideLabel = false,
  isActive = false,
  onToggle = () => {},
  width = undefined,
  rightContent,
}: AccordionProps) => {
  // const [isOpen, setIsOpen] = useState(open);

  const iconBgSize = {
    sm: "26px",
    md: "26px",
    lg: "38px",
  };

  const iconSize = {
    sm: "15px",
    md: "15px",
    lg: "24px",
  };

  const height = {
    sm: "26px",
    md: "36px",
    lg: "44px",
  };

  const padding = {
    sm: "3px 16px 3px 0px",
    md: "3px 15px 3px 5px",
    lg: "3px 13px 3px 2px",
  };

  const gap = {
    sm: "0 15px",
    md: "0 15px",
    lg: "0 5px",
  };

  const bg = {
    none: "transparent",
    medium: "#1F2726",
    "dark-border": "#1F2726",
  };

  const border = {
    none: "none",
    medium: "none",
    "dark-border": "2px solid #151A19",
  };

  const fontSize = {
    sm: "14px",
    md: "14px",
    lg: "20px",
  };

  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [childrenHeight, setChildrenHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setChildrenHeight(ref.current.clientHeight);
    }
  }, [children]);

  return (
    <>
      <Tooltip placement="top-start">
        <TooltipTrigger className="w-full">
          <Link
            className={`relative flex w-full flex-col overflow-visible ${className}`}
            href={link ? link : ""}
            target={link && link.startsWith("http") ? "_blank" : undefined}
            rel={
              link && link.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            style={{
              width: width,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={`flex w-full items-center justify-between ${
                hideLabel ? "rounded-full" : "rounded-full"
              } ${children ? "cursor-pointer" : ""} ${
                isActive && "!bg-[#151A19]"
              } ${link && !hideLabel && "hover:!bg-[#5A6462]"}`}
              onClick={() => {
                onToggle && onToggle();
              }}
              style={{
                padding: padding[size],
                gap: gap[size],
                height: height[size],
                background: bg[background],
                border: border[background],
              }}
            >
              <DropdownIcon
                size={size}
                icon={icon}
                iconBackground={iconBackground}
                showArrow={children ? true : false}
                isOpen={isOpen}
                iconColor={
                  isHovered && iconHoverColor ? iconHoverColor : iconColor
                }
              />
              <div
                className="flex flex-1 items-start justify-start truncate font-semibold transition-all duration-300"
                style={{
                  fontSize: fontSize[size],
                  opacity: hideLabel ? 0 : 1,
                }}
              >
                {label}
              </div>
            </div>
            {rightContent}
          </Link>
        </TooltipTrigger>
        {hideLabel && (
          <TooltipContent
            className={`${hideLabel ? "z-50" : ""} pointer-events-none`}
          >
            <div
              className="pointer-events-none absolute"
              style={{ top: 5, left: 0 }}
            >
              <div
                className={`flex items-center justify-between ${
                  hideLabel ? "rounded-full" : "rounded-full"
                }`}
                style={{
                  padding: padding[size],
                  gap: gap[size],
                  height: height[size],
                  background: "#5A6462",
                  border: border[background],
                  width: hideLabel ? undefined : width,
                }}
              >
                <DropdownIcon
                  size={size}
                  icon={icon}
                  iconBackground={iconBackground}
                  showArrow={children ? true : false}
                  isOpen={isOpen}
                  iconColor={
                    isHovered && iconHoverColor ? iconHoverColor : iconColor
                  }
                />
                <div
                  className="flex flex-1 items-start justify-start truncate font-semibold transition-all duration-300"
                  style={{
                    fontSize: fontSize[size],
                    // opacity: hideLabel ? 0 : 1,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
      {children && (
        <div
          className={`overflow-hidden transition-[max-height] duration-300 ${accordionClassName}`}
          style={{
            maxHeight: isOpen ? childrenHeight : "0",
          }}
        >
          <div className="w-full" ref={ref}>
            {children}
          </div>
        </div>
      )}
    </>
  );
});

Accordion.displayName = "Accordion";

type DropdownIconProps = {
  size: "sm" | "md" | "lg";
  icon: GTPIconName;
  iconColor?: string;
  iconBackground: "none" | "dark";
  showArrow: boolean;
  isOpen?: boolean;
};

export const DropdownIcon = memo(({
  size,
  icon,
  iconColor,
  iconBackground,
  showArrow = false,
  isOpen = false,
}: DropdownIconProps) => {
  const iconBgSize = {
    sm: "26px",
    md: "26px",
    lg: "38px",
  };

  // const iconSize = {
  //   sm: "15px",
  //   md: "15px",
  //   lg: "24px",
  // };

  // if our dropdownSize is sm, then the iconSize will be sm
  // if our dropdownSize is md, then the iconSize will be sm
  // if our dropdownSize is lg, then the iconSize will be md
  const iconSizeMap: { [key: string]: "sm" | "md" | "lg" } = {
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  const iconBg = {
    none: "transparent",
    dark: "#151A19",
  };

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: iconBgSize[size],
        height: iconBgSize[size],
        background: iconBg[iconBackground],
      }}
    >
      <div className="relative flex h-full items-center justify-center px-[5px]">
        <GTPIcon
          icon={icon}
          size={iconSizeMap[size]}
          style={{
            color: iconColor,
          }}
          showContextMenu={true}
        />

        {showArrow && (
          <DropdownArrow isOpen={isOpen} size={size} />
        )}
      </div>
    </div>
  );
});


export const DropdownArrow = ({isOpen, size}: {isOpen: boolean; size: "sm" | "md" | "lg"}) => {
  const iconSizeMap: { [key: string]: "sm" | "md" | "lg" } = {
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  return (
    <div
      className={`absolute right-0 h-[10px] w-[5px] transition-all duration-300`}
      style={{
        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
        transformOrigin: `calc(-${GTPIconSize[iconSizeMap[size]]}/2) 50%`,
      }}
    >
      <svg
        width="5"
        height="10"
        viewBox="0 0 5 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.32446 1.07129L3.32446 5.07129L1.32446 9.07129"
          stroke="#CDD8D3"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

DropdownIcon.displayName = "DropdownIcon";
