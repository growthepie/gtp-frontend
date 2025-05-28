"use client";
import { Icon, getIcon } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names"; // array of strings that are the names of the icons
import { GetRankingColor } from "@/lib/chains";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Tooltip from "../tooltip/GTPTooltip";
import { useToast } from "../toast/GTPToast";
import { triggerDownload, convertSvgToPngBlob, triggerBlobDownload } from "@/lib/icon-library/clientSvgUtils";
import { useOutsideAlerter } from "@/hooks/useOutsideAlerter";
import { IconContextMenu } from "./IconContextMenu";

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

export const sizeClassMap = {
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
export const GTPIcon = ({ icon, className, containerClassName, showContextMenu = false, size = "md", style, ...props }: GTPIconProps) => {
  const iconPrefix = icon.includes(":") ? "" : "gtp:";
  const fullIconName = `${iconPrefix}${icon}`;
  const currentSizeClass = sizeClassMap[size] || sizeClassMap.md;

  // Define the getSVG function needed by IconContextMenu
  // Use useCallback to memoize the function if needed, especially if dependencies change often
  const getIconSvgData = useCallback(async (): Promise<{ svgString: string | null; width: number; height: number } | null> => {
    const iconData = getIcon(fullIconName); // Use the imported getIconData
    if (!iconData) {
      console.error("Icon data not found for:", fullIconName);
      return null;
    }

    const { left, top, width, height, body } = iconData;

    // Determine color from className or style
    let color: string | undefined = undefined;
    if (className?.includes("text-")) {
      const match = className.match(/text-(\S+)/);
      if (match) {
        // Handle hex like text-[#1F2726] or named colors like text-red-500
        const colorValue = match[1];
        if (colorValue.startsWith("[#") && colorValue.endsWith("]")) {
          color = colorValue.substring(2, colorValue.length - 1);
        } else {
          // This part is tricky without Tailwind's config. For simplicity,
          // we might only support hex or direct style colors.
          // Or you could pass the resolved color via `style` prop.
          // console.warn("Cannot reliably resolve Tailwind named colors for SVG export:", colorValue);
        }
      }
    }
    if (!color && style?.color) {
      color = style.color;
    }

    let bodyString = body;
    if (color) {
      // Replace instances of currentColor with the determined color
      // Make sure to handle potential fill/stroke attributes set to currentColor too
      bodyString = bodyString.replace(/currentColor/g, color);
    }

    // Construct the SVG string
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}" width="${width}" height="${height}" ${color ? `style="color: ${color};"` : ''}>${bodyString}</svg>`;

    return {
      svgString,
      width: width,
      height: height,
    };
  }, [fullIconName, className, style]); // Dependencies for the callback


  // The core Icon component
  const IconElement = (
    <Icon
      icon={fullIconName}
      className={`${currentSizeClass} ${className || ""}`}
      style={style}
      {...props} // Pass remaining props like onClick etc.
    />
  );


  if (showContextMenu) {
    // Wrap with the IconContextMenu component
    return (
      <IconContextMenu
        getSvgData={getIconSvgData}
        itemName={fullIconName.replace(/[:\/]/g, "_")} // Sanitize name for download
        wrapperClassName={`${currentSizeClass} ${containerClassName || ""}`} // Apply size/container classes to the wrapper
      >
        {IconElement}
      </IconContextMenu>
    );
  } else {
    // Render directly within a container div if no context menu
    return (
      <div className={`${currentSizeClass} ${containerClassName || ""}`}>
        {IconElement}
      </div>
    );
  }
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
  } else if (maturityKey === "10_foundational") {
    icon = ethIcon;
  } else {
    const split = maturityKey.split("_");
    const name = split.slice(1).join("-");
    icon = `gtp:gtp-layer2-maturity-${name}`;
  }

  if (maturityKey === "10_foundational" || maturityKey === "0_early_phase" || maturityKey === "NA") {
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
export const RankIcon = ({ colorScale, size = "md", children, isIcon = true }: RankIconProps) => {
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