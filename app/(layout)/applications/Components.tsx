"use client";
import Image from "next/image";
import { useApplicationsData } from "./ApplicationsDataContext";
import { useRouter } from "next/navigation";
import Icon from "@/components/layout/Icon";
import { useUIContext } from "@/contexts/UIContext";
import { useState } from "react";
import { delay } from "lodash";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";


type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const ApplicationIcon = ({ owner_project, size }: ApplicationIconProps) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  const sizeClassMap = {
    sm: "w-[15px] h-[15px]",
    md: "w-[24px] h-[24px]",
    lg: "w-[36px] h-[36px]",
  };

  const sizePixelMap = {
    sm: 15,
    md: 24,
    lg: 36,
  };

  return (
    <div className={`select-none ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="rounded-full select-none"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`${sizeClassMap[size]} bg-forest-950 rounded-full`}></div>
      )}
    </div>
  );
}

export const ApplicationDisplayName = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project;
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].description : "";
}

export const BackButton = () => {
  const router = useRouter();
  return (
    <button className="size-[36px] bg-[#344240] rounded-full flex justify-center items-center" onClick={() => router.back()}>
      <Icon icon="feather:arrow-left" className="size-[26px]  text-[#CDD8D3]" />
    </button>
  );
}

export type MultipleSelectTopRowChildProps = {
  handleNext: () => void;
  handlePrev: () => void;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  options: {
    key: string;
    icon?: string;
    name: string;
  }[];
};
export const MultipleSelectTopRowChild = ({ handleNext, handlePrev, selected, setSelected, options }: MultipleSelectTopRowChildProps) => {
  const { isMobile } = useUIContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <div className="flex flex-col relative h-full lg:h-[54px] w-full lg:w-[271px] -my-[1px]">
      <div
        className={`relative flex rounded-full h-full w-full lg:z-[5] p-[5px] cursor-pointer ${isMobile ? "w-full" : "w-[271px]"}`}
        style={{
          backgroundColor: "#151A19",
        }}
      >
        <div
          className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[2] hover:cursor-pointer"
          onClick={handlePrev}
        >
          <Icon icon="feather:arrow-left" className="w-6 h-6" />
        </div>
        <div
          className="flex flex-1 flex-col items-center justify-center  gap-y-[1px]"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <div className={`flex font-[550] gap-x-[5px] justify-center items-center w-32`}>
            <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
              {selected.length > 1 ? "Multiple" : options.find((option) => option.key === selected[0])?.name}
            </div>
          </div>
        </div>
        <div
          className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[2] hover:cursor-pointer"
          onClick={handleNext}
          
        >
          <Icon icon="feather:arrow-right" className="w-6 h-6" />
        </div>
      </div>
      <div
        className={`flex flex-col relative lg:absolute lg:top-[27px] bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${
          isOpen
            ? `lg:z-[4] overflow-hidden border-transparent rounded-b-[30px] lg:border-forest-200 lg:dark:border-forest-500 lg:rounded-b-2xl lg:shadow-[0px_4px_46.2px_#00000066] lg:dark:shadow-[0px_4px_46.2px_#000000]`
            : "max-h-0 z-[3] overflow-hidden border-transparent rounded-b-[22px]"
        } `}
        style={{
          maxHeight: isOpen ? `${options.length * 34 + 70}px` : "0px",
        }}
      >
        <div className="pb-[20px] lg:pb-[10px]">
          <div className="h-[10px] lg:h-[28px]"></div>
          {options.map((opt, index) => (
            <div
              className="flex px-[25px] py-[5px] gap-x-[15px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
              onClick={() => {
                setIsOpen(false);

                setSelected((prev) => {
                  if (prev.includes(opt.key)) {
                    if(prev.length === 1) return prev;
                    return prev.filter((m) => m !== opt.key);
                  } else {
                    return [...prev, opt.key];
                  }
                });
              }}
              key={index}
            >
                <Icon
                  icon={selected.includes(opt.key) ? "feather:check-circle" : "feather:circle"}
                  className="size-[15px]"
                />
                {opt.icon && (
                  <GTPIcon
                  icon={(selected.includes(opt.key) ? `${opt.icon}` : `${opt.icon}-monochrome`) as GTPIconName}
                  className="size-[24px] text-[#5A6462]"
                />
                )}
              <div>{opt.name}</div>
            </div>
          ))}
        </div>
      </div>
      {isOpen && (
        <div
          className={`hidden lg:block lg:fixed inset-0 z-[3]`}
          onClick={() => {
            setIsOpen(false);
          }}
        />
      )}
    </div>
    </>
  )
}