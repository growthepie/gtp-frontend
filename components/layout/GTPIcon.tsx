"use client";
import { Icon } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names"; // array of strings that are the names of the icons
import { GetRankingColor } from "@/lib/chains";

type GTPIconProps = {
  // should be one of the strings in GTPIconNames
  icon: GTPIconName;
  className?: string;
  size?: "sm" | "md" | "lg";
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
export const GTPIcon = ({ icon, className, ...props }: GTPIconProps) => {
  return (
    <div className={sizeClassMap[props.size || "md"]}>
      <Icon
        icon={`gtp:${icon}`}
        className={`${sizeClassMap[props.size || "md"] || "w-[24px] h-[24px]"} ${className}`}
        {...props}
      />
    </div>
  );
};


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
}
export const RankIcon = ({ colorScale, size = "md", children }: RankIconProps) => {
  const color = colorScale == -1 ? "#CDD8D322" : GetRankingColor(colorScale * 100);
  const borderColor = colorScale == -1 ? "#CDD8D333" : color + "22";
  // const borderColor = "#CDD8D322";

  const borderSizeClassMap = {
    sm: "size-[15px]",
    md: "size-[24px]",
    lg: "size-[36px]",
  };

  const bgSizeClassMap = {
    sm: "size-[11px]",
    md: "size-[20px]",
    lg: "size-[32px]",
  };

  return (
    <div className={`rounded-full flex items-center justify-center border-2 transition-colors text-forest-500 ${borderSizeClassMap[size]}`}
      style={{
        borderColor: borderColor,
      }}>
      <div className={`relative rounded-full flex items-center justify-center transition-colors ${bgSizeClassMap[size]}`}
        style={{
          background: color,
        }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}