"use client";
import { Icon } from "@iconify/react";
import { GTPIconName } from "@/icons/gtp-icon-names"; // array of strings that are the names of the icons

type GTPIconProps = {
  // should be one of the strings in GTPIconNames
  icon: GTPIconName;
} & React.ComponentProps<typeof Icon>;

const GTPIcon = ({ icon, ...props }: GTPIconProps) => {
  return <Icon icon={`gtp:${icon}`} {...props} />;
};

export default GTPIcon;