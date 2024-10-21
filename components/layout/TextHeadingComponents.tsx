import Link from "next/link";
import { GTPIcon } from "./GTPIcon";
import Heading from "./Heading";
import { GTPIconName } from "@/icons/gtp-icon-names";

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
};

const titleSizeMap = {
  sm: "text-[24px]",
  md: "text-[30px]",
  lg: "text-[36px]"
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
}: TitleProps) => {
  if (!button) {
    return (
      <div
        id={id}
        className={`flex gap-x-[8px] items-center ${containerClassName}`}
      >
        <GTPIcon icon={icon} className={iconClassName} size={iconSize} />
        <Heading
          className={`leading-[120%] break-inside-avoid ${titleSizeMap[titleSize]} ${titleClassName}`}
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
        className={`flex gap-x-[8px] items-center ${containerClassName}`}
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


type TitleButtonProps = {
  href: string;
  newTab?: boolean;
  icon: GTPIconName;
  label: string;
  width?: string;
};

export const TitleButtonLink = ({
  href,
  newTab,
  icon,
  label,
  width,
}: TitleButtonProps) => {
  return (
    <div className="pl-[38px] md:pl-0">
      <Link
        href={href}
        rel={newTab ? "noreferrer" : ""}
        target={newTab ? "_blank" : ""}
      >
        <div className="flex items-center justify-center p-[1px] bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)] rounded-full">
          <div
            className="flex items-center pl-[5px] py-[4px] w-[205px] gap-x-[8px] font-semibold bg-forest-50 dark:bg-forest-900 rounded-full transition-all duration-300"
            style={{
              width: width,
            }}
          >
            <div className="w-[24px] h-[24px] bg-[#151A19] rounded-full flex items-center justify-center">
              <GTPIcon
                icon={icon}
                size="sm"
              />
            </div>
            <div className="transition-all duration-300 whitespace-nowrap overflow-hidden text-[14px] font-semibold">
              {label}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}