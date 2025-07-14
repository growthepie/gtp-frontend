"use client";
import Link from "next/link";
import Icon from "./Icon";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { track } from "@vercel/analytics";
import { useEffect, useState } from "react";

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  icon?: GTPIconName;
  iconClassName?: string;
}

export const LinkButton = ({ href, children, icon, iconClassName }: LinkButtonProps) => {
  // remove special characters, spaces with hyphens, replace spaces with hyphens
  const trackingLabel = children?.toString().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replace(/\s+/g, '-');

  const [page, setPage] = useState<string>("");

  useEffect(() => {
    if(typeof window !== "undefined") {
      setPage(window.location.pathname);
    }
  }, []);

  const handleClick = () => {
    track(`clicked ${trackingLabel} link button`, {
      location: page,
      page,
    });
  };

  if(icon) {
    return (
      <Link className="flex py-[2px] px-[3px] bg-[#344240] rounded-full items-center gap-x-[5px] relative top-[1px]" href={href} target={href.includes("http") ? "_blank" : "_self"} onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}>
        <GTPIcon icon={icon} size="sm" className={iconClassName} />
        <div className="text-xxs text-nowrap">{children}</div>
        <GTPIcon icon={"feather:arrow-right" as GTPIconName} size="sm" className="!size-[11px]" containerClassName="!size-[11px]" />
      </Link>
    );
  }

  return (
    <Link className="flex py-[2px] pl-[5px] pr-[3px] bg-[#344240] rounded-full items-center gap-x-[5px] relative top-[1px]" href={href} target={href.includes("http") ? "_blank" : "_self"} onClick={(e) => {
      e.stopPropagation();
      handleClick();
    }}>
      <div className="text-xxs text-nowrap">{children}</div>
      <GTPIcon icon={"feather:arrow-right" as GTPIconName} size="sm" className="!size-[11px]" containerClassName="!size-[11px]" />
    </Link>
  );
};
