"use client";
import { Icon } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names"; // array of strings that are the names of the icons
import { GetRankingColor } from "@/lib/chains";
import { memo, useEffect, useRef, useState } from "react";
import Tooltip from "../tooltip/GTPTooltip";
import { getIcon } from "@iconify/react"
import { useToast } from "../toast/GTPToast";
import { triggerDownload, convertSvgToPngBlob, triggerBlobDownload } from "@/lib/icon-library/clientSvgUtils";
import { useOutsideAlerter } from "@/hooks/useOutsideAlerter";

// custom right-click menu to copy, download, or go to the icon page
const CustomContextMenuWrapper = ({ fullIconName, children, className, size, style }: { fullIconName: string, children: React.ReactNode, className?: string, size?: "sm" | "md" | "lg", style?: React.CSSProperties }) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideAlerter(menuRef, () => {
    setIsOpen(false);
  });

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOpen(true);
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const getSVG = () => {
    console.log(fullIconName);
    const iconData = getIcon(fullIconName);
    console.log(iconData);
    if(!iconData){
      return null;
    }
    const {left, top, width, height, body} = iconData;
    // get color / text-color className
    let color: string | undefined = undefined;
    if(className?.includes("text-")){
      const split = className.split(" ");
      const textColorClass = split.find((className) => className.includes("text-"));
      if(textColorClass){
        // example text-[#1F2726]
        color = textColorClass.replace("text-", "").replace("]", "").replace("[", "");
        
      }
    }

    if(!color){
      // check the style object
      if(style?.color){
        color = style.color;
      }
    }

    let bodyString = body;
    if(color){
      // replace instances of currentColor with the color
      bodyString = bodyString.replace(/currentColor/g, color);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}" ${color ? `style="color: ${color}"` : ""}>${bodyString}</svg>`;
  }

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const iconSVG = getSVG();
    console.log(iconSVG);
    if(!iconSVG){
      toast.addToast({
        title: "Error",
        message: "Icon not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    navigator.clipboard.writeText(iconSVG);
    toast.addToast({
      title: "Success",
      message: "Icon copied to clipboard",
      type: "success",
    });
    setIsOpen(false);
  };

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const iconSVG = getSVG();
    if(!iconSVG){
      toast.addToast({
        title: "Error",
        message: "Icon not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    const blob = await convertSvgToPngBlob(iconSVG, 15, 15);
    if(!blob){
      toast.addToast({
        title: "Error",
        message: "Failed to convert icon to PNG",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    triggerBlobDownload(`${fullIconName}.png`, blob);
    setIsOpen(false);
  };

  const handleGoToIconsPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    window.open("https://icons.growthepie.xyz", "_blank");
  };  

  // CMD icon: material-symbols:keyboard-command-key
  const CMDIcon = <Icon icon="lucide:command" />;
  const CTRLIcon = <div className="font-inter">Ctrl</div>
  const PlusIcon = <div className="font-inter">+</div>
  const XIcon = <div className="font-inter">X</div>
  const SIcon = <div className="font-inter">S</div>
  const CIcon = <div className="font-inter">C</div>
  const options = [
    {
      icon: "gtp-copy",
      label: "Copy",
      // shortcut: <div className="flex items-center gap-x-[5px]">
      //   {CMDIcon} / {CTRLIcon}
      //   {PlusIcon}
      //   {CIcon}
      // </div>,
      onClick: handleCopy,
    },
    {
      icon: "gtp-download",
      label: "Download",
      // shortcut: <div className="flex items-center gap-x-[5px]">
      //   {CMDIcon} / {CTRLIcon}
      //   {PlusIcon}
      //   {SIcon}
      // </div>,
      onClick: handleDownload,
    },
    {
      icon: "gtp-growthepie-icons",
      label: "See more icons",
      onClick: handleGoToIconsPage,
    },
  ];


  return (
    <div className={`relative ${className}`} onContextMenu={handleContextMenu}>
      {children}
      {isOpen && (
        <div ref={menuRef} className={`fixed z-[999] flex flex-col w-fit gap-y-[5px] rounded-[15px] overflow-hidden bg-[#1F2726] text-[#CDD8D3] text-xs shadow-[0px_0px_8px_0px_rgba(0,_0,_0,_0.66)]`} style={{ left: position.x, top: position.y }}>
          <div className="flex flex-col gap-y-[5px] w-full py-[10px]">
            {options.map((option) => (
              <button key={option.label} onClick={(e) => option.onClick(e)} className="flex w-full items-center justify-between gap-x-[30px] pl-[20px] pr-[25px] py-[5px] cursor-pointer hover:bg-[#5A6462]/50">
                <div className="flex justify-start items-center gap-x-[10px] text-[12px]">
                  <GTPIcon icon={option.icon as GTPIconName} size="sm" className="!size-[12px]" />
                  <span>{option.label}</span>
                </div>
                {/* <div className="flex justify-end items-center gap-x-[5px] text-[10px] text-[#5A6462]">
                  {option.shortcut}
                </div> */}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type GTPIconProps = {
  // should be one of the strings in GTPIconNames
  icon: GTPIconName;
  className?: string;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
  showContextMenu?: boolean;
} & React.ComponentProps<typeof Icon>;
type sizes = "sm" | "md" | "lg";

export const GTPIconSize: { [key in sizes]: string } = {
  sm: "15px",
  md: "24px",
  lg: "36px",
};

const sizeClassMap = {
  sm: "w-[15px] h-[15px]",
  md: "w-[24px] h-[24px]",
  lg: "w-[36px] h-[36px]",
};

/**
  * GTPIcon
  * @param icon - the name of the icon
  * @param size - the size of the icon (sm, md, lg)
  * @returns the icon with the specified size (with a container div that has the same size)
  * @example
  * <GTPIcon icon="gtp:donate" size="lg" />
 */
export const GTPIcon = ({ icon, className, containerClassName, showContextMenu = false, ...props }: GTPIconProps) => {
  let iconPrefix = "gtp:";
  if(icon.includes(":")){
    iconPrefix = "";
  }
  if(showContextMenu){
      return (
        <CustomContextMenuWrapper fullIconName={`${iconPrefix}${icon}`} size={props.size} className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""}`} style={{color: props.style?.color}}>
          <Icon
          icon={`${iconPrefix}${icon}`}
          className={`${sizeClassMap[props.size || "md"] || "w-[24px] h-[24px]"} ${className || ""}`}
          {...props}
        />
      </CustomContextMenuWrapper>
    );
  }
  return (
    <div className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""}`}>
        <Icon
          icon={`${iconPrefix}${icon}`}
          className={`${sizeClassMap[props.size || "md"] || "w-[24px] h-[24px]"} ${className || ""}`}
          {...props}
      />
    </div>
  );
};

type GTPMaturityIconProps = {
  maturityKey: string;
  className?: string;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
};

const ethIcon = "gtp:gtp-ethereumlogo";
export const GTPMaturityIcon = memo(({ maturityKey, className, containerClassName, ...props }: GTPMaturityIconProps) => {
  
  let icon = `gtp:gtp-layer2-maturity-${maturityKey}`;
  let opacityClass = "";
  let sizeClass = sizeClassMap[props.size || "md"];

  if (maturityKey === "0_early_phase") {
    icon = "feather:circle";
    opacityClass = "opacity-[0.05]";
    sizeClass = "w-[15px] h-[15px]";
  }else if (maturityKey === "10_foundational") {
    icon = ethIcon;
  }else{
    const split = maturityKey.split("_");
    const name = split.slice(1).join("-");  
    icon = `gtp:gtp-layer2-maturity-${name}`;
  }

  if(maturityKey === "10_foundational" || maturityKey === "0_early_phase" || maturityKey === "NA"){
    // return N/A text
   return (
    <div className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""} flex items-center justify-center`}>
      <div className="text-xs text-[#5A6462]">N/A</div>
    </div>
   )
  }

  return (
    <div className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""} flex items-center justify-center`}>
      <Icon icon={icon} className={`${sizeClass} ${className || ""} ${opacityClass}`} {...props} />
    </div>
  );
});

GTPMaturityIcon.displayName = "GTPMaturityIcon";

// map metric keys to icon names
const MetricIconMap = {
  daa: "gtp-metrics-activeaddresses",
  txcount: "gtp-metrics-transactioncount",
  throughput: "gtp-metrics-throughput",
  stables_mcap: "gtp-metrics-stablecoinmarketcap",
  tvl: "gtp-metrics-totalvaluelocked",
  txcosts: "gtp-metrics-transactioncosts",
  fees: "gtp-metrics-feespaidbyusers",
  rent_paid: "gtp-metrics-rentpaidtol1",
  profit: "gtp-metrics-onchainprofit",
  fdv: "gtp-metrics-fdv",
  market_cap: "gtp-metrics-marketcap",
};


type GTPMetricIconProps = {
  // should be one of the keys in MetricIconMap
  icon: keyof typeof MetricIconMap | string;
  size?: sizes;
} & React.ComponentProps<typeof Icon>;

/**
 * GTPMetricIcon
 * @param icon - the key of the metric_key of the icon
 * @param size - the size of the icon (sm, md, lg)
 * @returns the icon with the specified size
 * @example
 * <GTPMetricIcon icon="stables_mcap" size="lg" />
 */

export const GTPMetricIcon = ({ icon, ...props }: GTPMetricIconProps) => {

  return (
    <Icon
      icon={`gtp:${MetricIconMap[icon]}`}
      style={{ fontSize: GTPIconSize[props.size || "md"], display: "block" }}
      {...props}
    />
  );
};


type RankIconProps = {
  colorScale: number;
  size?: sizes;
  children?: React.ReactNode;
  isIcon?: boolean;
}
export const RankIcon = ({ colorScale, size = "md", children, isIcon = true}: RankIconProps) => {
  const color = colorScale == -1 ? "#CDD8D322" : GetRankingColor(colorScale * 100);
  const borderColor = colorScale == -1 ? "#CDD8D333" : color + "AA";
  // const borderColor = "#CDD8D322";

  const borderSizeClassMap = {
    sm: "size-[18px]",
    md: "size-[24px]",
    lg: "size-[36px]",
  };

  const bgSizeClassMap = {
    sm: "size-[14px]",
    md: "size-[20px]",
    lg: "size-[32px]",
  };

  // Font size mapping for rank numbers to ensure readability
  const fontSizeClassMap = {
    sm: "text-[9px]",  // Small numbers look nice with slight adjustment
    md: "text-[10px]",
    lg: "text-[14px]",
  };

  // SVG size matches background size
  const svgSizeMap = {
    sm: 12,
    md: 20,
    lg: 32,
  };

  const svgFontSizeMap = {
    sm: 9,
    md: 10,
    lg: 14,
  };

  // Convert children to a string (e.g., rank number)
  const rankNumber = children?.toString() || "";

  return (
    <div
      className={`rounded-full flex items-center justify-center border-[1px] transition-all duration-100 text-forest-500 ${borderSizeClassMap[size]}`}
      style={{ borderColor }}
    >
      <div
        className={`relative rounded-full flex items-center justify-center transition-all duration-100 ${bgSizeClassMap[size]}`}
        style={{ background: color }}
      >
        {isIcon ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        ) : (
          <svg
            width={svgSizeMap[size]}
            height={svgSizeMap[size]}
            viewBox={`0 0 ${svgSizeMap[size]} ${svgSizeMap[size]}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"

          >
            <foreignObject x="0" y="0" width={svgSizeMap[size]} height={svgSizeMap[size]}>
              <div
                className={`flex items-center justify-center h-full w-full font-extrabold text-[#1F2726] font-source-code-pro ${fontSizeClassMap[size]}`}
              >
                {rankNumber}
              </div>
            </foreignObject>
          </svg>
        )}
      </div>
    </div>
  );
};