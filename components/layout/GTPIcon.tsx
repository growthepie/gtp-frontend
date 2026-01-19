"use client";
import { Icon, getIcon, iconExists } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GetRankingColor } from "@/lib/chains";
import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { IconContextMenu } from "./IconContextMenu";
import { useGTPIconsLoader } from "@/utils/gtp-icons-loader";

type GTPIconProps = {
  icon?: GTPIconName;
  className?: string;
  containerClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showContextMenu?: boolean;
  showLoadingPlaceholder?: boolean; // New prop to control loading placeholder
  contextMenuOptions?: {
    isLink: boolean;
  };
} & React.ComponentProps<typeof Icon>;

type sizes = "sm" | "md" | "lg" | "xl";

export const GTPIconSize: { [key in sizes]: string } = {
  sm: "15px",
  md: "24px",
  lg: "36px",
  xl: "64px",
};

export const sizeClassMap = {
  sm: "w-[15px] h-[15px]",
  md: "w-[24px] h-[24px]",
  lg: "w-[36px] h-[36px]",
  xl: "w-[64px] h-[64px]",
};

/**
 * GTPIcon
 * @param icon - the name of the icon
 * @param size - the size of the icon (sm, md, lg, xl)
 * @param showLoadingPlaceholder - whether to show a loading placeholder while icons load
 * @returns the icon with the specified size (with a container div that has the same size)
 * @example
 * <GTPIcon icon="donate" size="lg" showLoadingPlaceholder />
 */
const GTPIconBase = ({ 
  icon, 
  className, 
  containerClassName, 
  showContextMenu = false, 
  size = "md", 
  style, 
  contextMenuOptions = { isLink: false }, 
  showLoadingPlaceholder = false,
  ...props 
}: GTPIconProps) => {
  const isIconsLoaded = useGTPIconsLoader();
  const [renderKey, setRenderKey] = useState(0);

  // Memoize expensive calculations
  const { iconPrefix, fullIconName, currentSizeClass, isGTPIcon } = useMemo(() => {
    const iconPrefix = icon?.includes(":") ? "" : "gtp:";
    const fullIconName = icon ? `${iconPrefix}${icon}` : "";
    const isGTPIcon = fullIconName.startsWith("gtp:");
    return {
      iconPrefix,
      fullIconName,
      currentSizeClass: sizeClassMap[size] || sizeClassMap.md,
      isGTPIcon,
    };
  }, [icon, size]);

  // Force re-render when icons are loaded
  useEffect(() => {
    if (isIconsLoaded) {
      setRenderKey(prev => prev + 1);
    }
  }, [isIconsLoaded]);

  // Check if the specific icon exists (only after icons are loaded)
  const isIconAvailable = useMemo(() => {
    return fullIconName && isIconsLoaded ? iconExists(fullIconName) : false;
  }, [fullIconName, isIconsLoaded]);

  // Memoize the SVG data function
  const getIconSvgData = useCallback(async (): Promise<{ svgString: string | null; width: number; height: number } | null> => {
    if (!fullIconName || !isIconAvailable) return null;
    
    const iconData = getIcon(fullIconName);
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
        const colorValue = match[1];
        if (colorValue.startsWith("[#") && colorValue.endsWith("]")) {
          color = colorValue.substring(2, colorValue.length - 1);
        }
      }
    }
    if (!color && style?.color) {
      color = style.color as string;
    }

    let bodyString = body;
    if (color) {
      bodyString = bodyString.replace(/currentColor/g, color);
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}" width="${width}" height="${height}" ${color ? `style="color: ${color};"` : ''}>${bodyString}</svg>`;

    return {
      svgString,
      width: width,
      height: height,
    };
  }, [fullIconName, className, style, isIconAvailable]);

  // Early return after all hooks
  if (!icon) {
    return <div className={`${currentSizeClass} ${containerClassName || ""}`} />;
  }

    // For GTP icons that aren't loaded yet, show loading placeholder or empty div
    if (isGTPIcon && !isIconsLoaded) {
      if (showLoadingPlaceholder) {
        return (
          <div className={`${currentSizeClass} ${containerClassName || ""} flex items-center justify-center`}>
            <div className={`${currentSizeClass} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
          </div>
        );
      } else {
        return <div className={`${currentSizeClass} ${containerClassName || ""}`} />;
      }
    }
  
    // For GTP icons that are loaded but don't exist, show warning and empty div
    if (isGTPIcon && isIconsLoaded && !isIconAvailable) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`GTP Icon "${fullIconName}" not found in loaded collections`);
      }
      return <div className={`${currentSizeClass} ${containerClassName || ""}`} />;
    }
  
    // For GTP icons, only render if available locally (prevents API calls)
    // For non-GTP icons, render normally (allows Iconify's API fallback)
    const shouldRender = isGTPIcon ? isIconAvailable : true;
  
    if (!shouldRender) {
      return <div className={`${currentSizeClass} ${containerClassName || ""}`} />;
    }
  
    // The core Icon component with render key for forced updates
    const IconElement = (
      <Icon
        key={renderKey}
        icon={fullIconName}
        className={`${currentSizeClass} ${className || ""}`}
        style={style}
        {...props}
      />
    );
  
    if (showContextMenu) {
      return (
        <IconContextMenu
          getSvgData={getIconSvgData}
          itemName={fullIconName.replace(/[:\/]/g, "_")}
          wrapperClassName={`${currentSizeClass} ${containerClassName || ""}`}
          contextMenuOptions={contextMenuOptions}
        >
          {IconElement}
        </IconContextMenu>
      );
    } else {
      return (
        <div className={`${currentSizeClass} ${containerClassName || ""}`}>
          {IconElement}
        </div>
      );
    }
  };

// Memoize the component to prevent unnecessary re-renders
export const GTPIcon = memo(GTPIconBase, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these props change
  return (
    prevProps.icon === nextProps.icon &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className &&
    prevProps.containerClassName === nextProps.containerClassName &&
    prevProps.showContextMenu === nextProps.showContextMenu &&
    prevProps.showLoadingPlaceholder === nextProps.showLoadingPlaceholder &&
    prevProps.style?.color === nextProps.style?.color
  );
});

GTPIcon.displayName = "GTPIcon";

type GTPMaturityIconProps = {
  maturityKey: string;
  className?: string;
  containerClassName?: string;
  size?: "sm" | "md" | "lg";
  showLoadingPlaceholder?: boolean;
};

const ethIcon = "gtp:gtp-ethereumlogo";
const GTPMaturityIconBase = ({ maturityKey, className, containerClassName, showLoadingPlaceholder = false, ...props }: GTPMaturityIconProps) => {
  const isIconsLoaded = useGTPIconsLoader();

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
    return (
      null
    )
  }

  // Show loading placeholder if requested and icons aren't loaded
  if (!isIconsLoaded && showLoadingPlaceholder) {
    return (
      <div className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""} flex items-center justify-center`}>
        <div className={`${sizeClass} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClassMap[props.size || "md"]} ${containerClassName || ""} flex items-center justify-center`}>
      <Icon 
        icon={icon} 
        className={`${sizeClass} ${className || ""} ${opacityClass}`} 
        {...props} 
      />
    </div>
  );
};

export const GTPMaturityIcon = memo(GTPMaturityIconBase);
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
  icon: keyof typeof MetricIconMap | string;
  size?: sizes;
  showLoadingPlaceholder?: boolean;
} & React.ComponentProps<typeof Icon>;

/**
 * GTPMetricIcon
 * @param icon - the key of the metric_key of the icon
 * @param size - the size of the icon (sm, md, lg)
 * @returns the icon with the specified size
 * @example
 * <GTPMetricIcon icon="stables_mcap" size="lg" showLoadingPlaceholder />
 */
const GTPMetricIconBase = ({ icon, showLoadingPlaceholder = false, ...props }: GTPMetricIconProps) => {
  const isIconsLoaded = useGTPIconsLoader();
  const iconName = `gtp:${MetricIconMap[icon]}`;
  const fontSize = GTPIconSize[props.size || "md"];

  // Show loading placeholder if requested and icons aren't loaded

  if (!isIconsLoaded && showLoadingPlaceholder) {
    return (
      <div 
        className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        style={{ 
          fontSize, 
          display: "block",
          width: fontSize,
          height: fontSize 
        }}
      />
    );
  }

  return (
    <Icon
      icon={iconName}
      style={{ fontSize, display: "block" }}
      {...props}
    />
  );
};

export const GTPMetricIcon = memo(GTPMetricIconBase);
GTPMetricIcon.displayName = "GTPMetricIcon";

type RankIconProps = {
  colorScale: number;
  size?: sizes;
  children?: React.ReactNode;
  isIcon?: boolean;
}

export const RankIcon = memo(({ colorScale, size = "md", children, isIcon = true }: RankIconProps) => {
  const { theme } = useTheme();
  const color = colorScale == -1 ? `#CDD8D3${theme === "dark" ? "22" : "88"}` : GetRankingColor(colorScale * 100, false, theme as "dark" | "light" ?? "dark");
  const borderColor = colorScale == -1 ? `#CDD8D3${theme === "dark" ? "22" : "88"}` : color + "AA";

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

  const fontSizeClassMap = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-[14px]",
  };

  const svgSizeMap = {
    sm: 12,
    md: 20,
    lg: 32,
  };

  const rankNumber = children?.toString() || "";

  return (
    <div
      className={`rounded-full flex items-center justify-center border-[1px] transition-all duration-100 text-color-bg-default ${borderSizeClassMap[size]}`}
      style={{ borderColor }}
    >
      <div
        className={`relative rounded-full flex items-center justify-center transition-all duration-100 ${bgSizeClassMap[size]}`}
        style={{ backgroundColor: color }}
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
                className={`flex items-center justify-center h-full w-full font-extrabold text-color-bg-default font-source-code-pro ${fontSizeClassMap[size]}`}
              >
                {rankNumber}
              </div>
            </foreignObject>
          </svg>
        )}
      </div>
    </div>
  );
});

RankIcon.displayName = "RankIcon";