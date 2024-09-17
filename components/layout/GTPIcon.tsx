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

export default GTPIcon;