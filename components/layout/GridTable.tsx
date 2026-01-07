"use client";
import { useMaster } from "@/contexts/MasterContext";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import React from "react";
import { useWindowSize } from "usehooks-ts";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export type GridTableProps = {
  gridDefinitionColumns?: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bar?: {
    origin_key: string;
    width: number;
  };
};

// grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"
export const GridTableHeader = ({
  children,
  gridDefinitionColumns,
  className,
  style,
}: GridTableProps) => {
  return (
    <div
      className={`select-none gap-x-[10px] pl-[10px] pr-[32px] pt-[30px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns || ""} ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
};

export type GridTableRowProps = {
  gridDefinitionColumns?: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bar?: {
    origin_key?: string;
    color?: string;
    width: number;
    containerStyle: React.CSSProperties;
    transitionClass?: string;
  };
  onClick?: () => void;
};

// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
export const GridTableRow = ({
  children,
  gridDefinitionColumns,
  className,
  style,
  bar,
  onClick,
}: GridTableRowProps) => {
  const { AllChainsByKeys } = useMaster();

  const getBarColor = () => {
    if (bar && bar.origin_key) {
      return AllChainsByKeys[bar.origin_key].colors["dark"][1];
    }

    if (bar && bar.color) {
      return bar.color;
    }

    return "white";
  }


  if (bar) {
    if(!bar.transitionClass) {
      bar.transitionClass = "all 0.3s ease-in-out";
    }
    return (
      <div
        className={`select-text gap-x-[10px] pl-[10px] pr-[32px] py-[5px] text-xs items-center rounded-full border-[0.5px] border-[#5A6462] grid ${gridDefinitionColumns || ""} ${className || ""} ${onClick ? "cursor-pointer hover:bg-forest-500/10" : ""}`}
        style={style}
        onClick={onClick}
      >
        {children}
        <div
          className={`absolute flex flex-col items-start justify-end`}
          style={{
            ...bar.containerStyle,
          }}
        >
          <div
            className={`z-20 ${bar.transitionClass} duration-300`}
            style={{
              background: getBarColor(),
              width: bar.width * 100 + "%",
              height: "2px",
            }}
          ></div>
        </div>
      </div >
    );
  }

  return (
    <div
      className={`select-text gap-x-[10px] pl-[10px] pr-[32px] py-[5px] text-xs items-center rounded-full border-[0.5px] border-[#5A6462] grid ${gridDefinitionColumns} ${className} ${onClick ? "cursor-pointer hover:bg-forest-500/10" : ""}`}
      style={style}
      onClick={onClick}
    >
      {children}

    </div>
  );
};

export const GridTableChainIcon = ({ origin_key, className, color }: { origin_key: string, className?: string, color?: string}) => {
  const { AllChainsByKeys } = useMaster();

  return (
    <div className={`flex h-full items-center ${className || ""}`}>
      {AllChainsByKeys[origin_key] && (
        <GTPIcon
          icon={`${AllChainsByKeys[
            origin_key
          ].urlKey
            }-logo-monochrome` as GTPIconName}
          className="w-[15px] h-[15px]"
          size="sm"
          style={{
            color: color ||
              AllChainsByKeys[
                origin_key
              ].colors["dark"][0],
          }}
        />
      )}
    </div>
  );
};

type GridTableHeaderCellProps = {
  children: React.ReactNode;
  metric?: string;
  sort?: {
    metric: string;
    sortOrder: string;
  };
  setSort?: React.Dispatch<
    React.SetStateAction<{
      metric: string;
      sortOrder: string;
    }
  >>;
  onSort?: () => void;
  justify?: string;
  className?: string;
  extraRight?: React.ReactNode;
  extraLeft?: React.ReactNode;
};

export const GridTableHeaderCell = ({ children, className, justify, metric, sort, setSort, onSort, extraLeft, extraRight}: GridTableHeaderCellProps) => {
  let alignClass = "justify-start";
  if (justify === "end") alignClass = setSort ? "justify-end -mr-[12px]" : "justify-end";
  if (justify === "center") alignClass = "justify-center";

  if(extraLeft || extraRight) {
    return (
      <div className={`flex items-center ${alignClass || "justify-start"} gap-x-[12px]  ${className}`}>
        {extraLeft}
        <div
          className={`flex items-center gap-x-[2px] ${alignClass || "justify-start"} ${(onSort || setSort) && "cursor-pointer"}`}
          onClick={() => {
            if(onSort) onSort();
            (metric && sort && setSort) && setSort({
              metric: metric,
              sortOrder:
                sort.metric === metric
                  ? sort.sortOrder === "asc"
                    ? "desc"
                    : "asc"
                  : "desc",
            });
          }}
        >
          {children}
          {metric && sort && (
            <div className="size-[10px]">
            <Icon
              icon={
                sort.metric === metric && sort.sortOrder === "asc"
                  ? "feather:arrow-up"
                  : "feather:arrow-down"
              }
              className="w-[10px] h-[10px]"
              style={{
                opacity: sort.metric === metric ? 1 : 0.2,
              }}
            />
            </div>
          )}
        </div>
        {extraRight}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${alignClass || "justify-start"} ${(onSort || setSort) && "cursor-pointer"} ${className}`}
      onClick={() => {
        if(onSort) onSort();
        (metric && sort && setSort) && setSort({
          metric: metric,
          sortOrder:
            sort.metric === metric
              ? sort.sortOrder === "asc"
                ? "desc"
                : "asc"
              : "desc",
        });
      }}
    >
      {children}
      {metric && sort && (
        <div className="size-[10px]">
          <Icon
            icon={
              sort.metric === metric && sort.sortOrder === "asc"
                ? "feather:arrow-up"
                : "feather:arrow-down"
            }
            className="w-[10px] h-[10px]"
            style={{
              opacity: sort.metric === metric ? 1 : 0.2,
            }}
          />
        </div>
      )}
    </div>
  );
}

type HorizontalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  includeMargin?: boolean;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  forcedMinWidth?: number;
  header?: React.ReactNode;
  style?: React.CSSProperties;
  isMobile?: boolean;
};

export function GridTableContainer(
  {
    children,
    className,
    paddingRight = 0,
    paddingLeft = 0,
    paddingTop = 0,
    paddingBottom = 0,
    header,
    style,
    isMobile = false,
  }: HorizontalScrollContainerProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { width: windowWidth = 0, height: windowHeight = 0 } = useWindowSize();
  const [contentAreaRef, { width: contentAreaWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [windowHorizontalScroll, setWindowHorizontalScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setWindowHorizontalScroll(window.scrollX);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const [horizontalScrollPercentage, setHorizontalScrollPercentage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (contentAreaRef.current) {
      const scrollableWidth = contentAreaWidth - windowWidth;
      const scrollLeft = windowHorizontalScroll;
      setHorizontalScrollPercentage((scrollLeft / scrollableWidth) * 100);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollableWidth);
    }
  }, [contentAreaRef, contentAreaWidth, windowHorizontalScroll, windowWidth]);


  const showLeftGradient = useMemo(() => {
    return canScrollLeft;
  }, [canScrollLeft]);

  const showRightGradient = useMemo(() => {
    return canScrollRight;
  }, [canScrollRight]);

  return (
    <div
      className={`px-0 pb-[200px] md:pb-[150px] w-fit ${className}`}
      style={style}
    >
      <div
        className={`transition-all duration-300 ${showLeftGradient ? "opacity-100" : "opacity-0"
          } z-[2] fixed top-0 bottom-0 -left-[0px] w-[125px] bg-[linear-gradient(-90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div
        className={`transition-all duration-300 ${showRightGradient ? "opacity-100" : "opacity-0"
          } z-[2] fixed top-0 bottom-0 -right-[0px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div
        ref={contentAreaRef}
        style={{
          paddingRight: paddingRight ? `${paddingRight}px` : undefined,
          paddingLeft: paddingLeft ? `${paddingLeft}px` : undefined,
          paddingTop: paddingTop ? `${paddingTop}px` : undefined,
          paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
        }}
      >

        <div className="px-[20px] md:px-[60px] relative">
          <div className="sticky h-[54px] top-[0px] md:top-[0px] z-[1]">
            <div className="relative z-50">
              {header}
              <div className={`absolute pl-[60px] pr-[60px] top-[0px] md:top-[0px] h-[40px] z-[1]`}>
                <div
                  className="bg-color-ui-active z-50 fixed inset-0 pointer-events-none"
                  style={{
                    backgroundPosition: "top",
                    maskImage: isMobile ? `linear-gradient(to bottom, white 0, white 30px, transparent 40px` : `linear-gradient(to bottom, white 0, white 30px, transparent 40px`,
                  }}
                >
                  <div className="background-gradient-group">
                    <div className="background-gradient-yellow"></div>
                    <div className="background-gradient-green"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type GridTableAddressCellProps = {
  address: string;
  className?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  fontSize?: number;
  showCopyIcon?: boolean;
};
export const GridTableAddressCell = ({
  address,
  className,
  iconClassName,
  iconContainerClassName,
  fontSize = 12,
  showCopyIcon = true,
}: GridTableAddressCellProps) => {

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  };

  // size 10px font is 6px wide
  // size 20px font is 9px wide
  

  const fontWidth = useMemo(() => 0.3 * fontSize + 3, [fontSize]);

  const [addressRef, { width: addressWidth }] = useElementSizeObserver<HTMLDivElement>();

  const numAddressChars = useMemo(() => {
    return Math.min(Math.floor(addressWidth / fontWidth) - 9, 42 - 9);
  }, [addressWidth, fontWidth]);



  return (
    <div className={`flex items-center w-full font-semibold gap-x-[10px] ${className || ""}`}
      onClick={(e) => {
        e.stopPropagation();
        handleCopyAddress(address);
      }}
    >
      <span
        ref={addressRef}
        className="@container flex-1 flex h-full items-center hover:bg-transparent font-mono select-none"
        // onDoubleClick={(e) => {
        //   e.preventDefault(); // Prevent default double-click behavior
        //   const selection = window.getSelection();
        //   const range = document.createRange();
        //   range.selectNodeContents(e.currentTarget);
        //   selection?.removeAllRanges();
        //   selection?.addRange(range);
        // }}
        style={{
          fontSize: `${fontSize}px`,
          // fontFeatureSettings: "'tnum' on, 'lnum' on",
        }}
      >

        <div
          className={`flex transition-all duration-300 ${numAddressChars === 42 - 6 ? "!font-normal" : "bg-[linear-gradient(90deg,#CDD8D3_calc(100%-17px),transparent_100%)] bg-clip-text text-transparent backface-visibility-hidden"}  `}
          style={{ direction: 'ltr', textOverflow: ". !important", }}
          onClick={() => {
            navigator.clipboard.writeText(address)
          }}
        >
          {address.slice(0, numAddressChars)}
        </div>
        <div className={`relative h-full flex items-center text-[#CDD8D333] ${numAddressChars === 42 - 6 && "!hidden"}`}>
          &hellip;

        </div>
        <div className={`transition-all duration-300  ${numAddressChars === 42 - 6 ? "!font-normal" : "bg-[linear-gradient(-90deg,#CDD8D3_calc(100%-17px),transparent_100%)] bg-clip-text text-transparent backface-visibility-hidden"} `}>
          {address.slice(-6)}
        </div>

      </span>
      {showCopyIcon && (
        <div
          className={`flex items-center justify-center size-[15px] ${iconContainerClassName || ""}`}

        >
          <Icon
            icon={copiedAddress === address ? "feather:check-circle" : "feather:copy"}
            className={`size-[15px] cursor-pointer ${iconClassName || ""}`}

          />
        </div>
      )}
    </div>
  )
};