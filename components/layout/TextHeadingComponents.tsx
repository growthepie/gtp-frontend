import Link from "next/link";
import type React from "react";
import type { MouseEventHandler } from "react";
import { GTPIcon } from "./GTPIcon";
import Heading from "./Heading";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Icon from "./Icon";

type TitleProps = {
  icon: GTPIconName;
  iconSize?: "sm" | "md" | "lg";
  title: string;
  titleSize?: "sm" | "md" | "lg";
  containerClassName?: string;
  titleClassName?: string;
  iconClassName?: string;
  id?: string;
  button?: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  backArrow?: boolean;
  backArrowLink?: string;
};

const titleSizeMap = {
  sm: "heading-md",
  md: "heading-lg",
  lg: "heading-large-xl"
};

export const Title = ({
  icon,
  iconSize = "lg",
  title,
  titleSize = "lg",
  containerClassName,
  titleClassName,
  iconClassName,
  id,
  button,
  as = "h1",
  backArrow = false,
  backArrowLink = ""
}: TitleProps) => {
  if (!button) {
    return (
      <div
        id={id}
        className={`flex items-center h-[43px] gap-x-[8px]  ${containerClassName}`}
      >
        {backArrow && (
          <Link className="flex items-center justify-center rounded-full w-[36px] h-[36px] bg-color-bg-medium" href={backArrowLink}>
            <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
          </Link>
        )}
        <GTPIcon icon={icon} className={`object-contain w-[36px] h-[36px] ${iconClassName}`} size={iconSize} />
        <Heading
          className={`leading-snug ${titleSizeMap[titleSize]} ${titleClassName}`}
          as={as}
        >
          {title}
        </Heading>
      </div>
    );
  }

  // with button
  return (
    <div id={id} className={`flex flex-col md:flex-row items-start md:items-center gap-y-[10px] md:gap-x-[15px] ${containerClassName}`}>
      <div
        id={id}
        className={`flex gap-x-[8px] items-center`}
      >
        <GTPIcon icon={icon} className={iconClassName} size={iconSize} />
        <Heading
          className="leading-[120%] text-[36px] md:text-[36px] break-inside-avoid"
          as={as}
        >
          {title}
        </Heading>
      </div>
      {button}
    </div>
  );
}

export const SectionTitle = ({
  icon,
  iconSize = "lg",
  title,
  titleSize = "md",
  containerClassName,
  titleClassName,
  iconClassName,
  id,
  as = "h2",
}: TitleProps) => {
  return (
    <div
      id={id}
      className={`flex items-center gap-x-[8px]  ${containerClassName}`}
    >
      <GTPIcon icon={icon} className={`${iconClassName}`} size={iconSize} />
      <Heading
        className={`leading-snug ${titleSizeMap[titleSize]} ${titleClassName}`}
        as={as}
      >
        {title}
      </Heading>
    </div>
  );
}

type SectionDescriptionProps = {
  children: React.ReactNode;
  className?: string;
}
export const SectionDescription = ({
  children,
  className,
}: SectionDescriptionProps) => {
  return <div className={`text-md ${className}`}>{children}</div>;
}


  type TitleButtonProps = {
    href: string;
    newTab?: boolean;
    icon?: GTPIconName;
    iconSize?: "sm" | "md" | "lg";
    iconBackground?: string;
    leftIcon?: GTPIconName;
    rightIcon?: GTPIconName;
    label: string | React.ReactNode;
    shortLabel?: string;
    width?: string;
    gradientClass?: string;
    className?: string;
    containerClassName?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  };

  export const TitleButtonLink = ({
    href,
    newTab,
    icon,
    iconSize="sm",
    iconBackground="bg-color-ui-active",
    leftIcon,
    rightIcon,
    label,
    width,
    gradientClass="bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)]",
    className,
    containerClassName="pl-[38px] md:pl-0",
    onClick,
  }: TitleButtonProps) => {
    return (
      <div className={`${containerClassName} select-none`}>
        <Link
          href={href}
          rel={newTab ? "noreferrer" : ""}
          target={newTab ? "_blank" : ""}
          onClick={onClick}
        >
          <div className={`flex items-center justify-center p-[1px] rounded-full ${gradientClass} ${className}`}>
            <div
              className={`flex items-center pl-[5px] py-[4px] w-[205px] gap-x-[8px]  bg-forest-50 dark:bg-forest-900 rounded-full transition-all duration-300 ${rightIcon ? "pr-[5px]" : "!pr-[15px]"} ${leftIcon ? "pl-[5px]" : "!pl-[15px]"}`}
              style={{
                width: width || "fit-content",
              }}
            >
              {(icon || leftIcon) && (<div className={`w-[24px] h-[24px] ${iconBackground} rounded-full flex items-center justify-center`}>
                {leftIcon && <GTPIcon icon={leftIcon} size={iconSize} />}
                {icon && <GTPIcon
                  icon={icon}
                  size={iconSize}
                />}
              </div>
              )}
              <div className="transition-all duration-300 whitespace-nowrap overflow-hidden heading-small-xs">
                {label}
              </div>
              {rightIcon && (<div className="size-[24px] bg-color-bg-medium rounded-full flex items-center justify-center">
                <div className="size-[24px] flex items-center justify-center">
                  <GTPIcon icon={rightIcon} size="sm" />
                </div>
              </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

export const SectionButtonLink = ({
  href,
  newTab,
  label,
  shortLabel,
  width,
  onClick,
}: TitleButtonProps) => {
  return (
    <Link
      href={href}
      rel={newTab ? "noreferrer" : ""}
      target={newTab ? "_blank" : ""}
      onClick={onClick}
    >
      <div className="select-none flex items-center justify-center p-[1px] bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)] rounded-full h-[34px]">
        <div
          className="flex items-center justify-center gap-x-[8px] font-semibold bg-[#263130] hover:bg-color-ui-hover rounded-full transition-colors duration-300 h-full px-[12px]"
          style={{
            width: width,
          }}
        >
          {shortLabel ? (
            <>
              <div className="hidden md:block heading-small-xs whitespace-nowrap overflow-hidden">
                {label}
              </div>
              <div className="block md:hidden heading-small-xs whitespace-nowrap overflow-hidden">
                {shortLabel}
              </div>
            </>
          ) : (
            <div className="heading-small-xs whitespace-nowrap overflow-hidden">
              {label}
            </div>
          )}
          <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!w-[16px] !h-[16px]" />
        </div>
      </div>
    </Link>
  );
}
