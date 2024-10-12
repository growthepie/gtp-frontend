"use client";
import { Icon } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names"; // array of strings that are the names of the icons

type GTPIconProps = {
  // should be one of the strings in GTPIconNames
  icon: GTPIconName;
  size?: "sm" | "md" | "lg";
} & React.ComponentProps<typeof Icon>;

const sizeMap = {
  sm: "15px",
  md: "24px",
  lg: "36px",
};

const GTPIcon = ({ icon, ...props }: GTPIconProps) => {
  return (
    <Icon
      icon={`gtp:${icon}`}
      style={{ fontSize: sizeMap[props.size || "md"], display: "block" }}
      {...props}
    />
  );
};

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
  marketcap: "gtp-metrics-marketcap",
};
type GTPMetricIconProps = {
  // should be one of the keys in MetricIconMap
  icon: keyof typeof MetricIconMap | string;
  size?: "sm" | "md" | "lg";
} & React.ComponentProps<typeof Icon>;

export const GTPMetricIcon = ({ icon, ...props }: GTPMetricIconProps) => {

  return (
    <Icon
      icon={`gtp:${MetricIconMap[icon]}`}
      style={{ fontSize: sizeMap[props.size || "md"], display: "block" }}
      {...props}
    />
  );
};


export default GTPIcon;