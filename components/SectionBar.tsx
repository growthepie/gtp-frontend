"use client"
import { GTPIcon } from "./layout/GTPIcon"
import { GTPIconName } from "@/icons/gtp-icon-names"

export function SectionBar({ children }: { children: React.ReactNode }) {
    return(
        <div className="grid grid-flow-col auto-cols-fr gap-[5px] w-full h-[44px] relative items-center">
            <div className="absolute w-full h-full px-[7px]">
                <div className="bg-[#1F2726] rounded-full h-[24px] absolute w-[99%]"></div>
            </div>
            {children}
        </div>
    )
}

export function SectionBarItem({ isSelected, header, icon, comingSoon, isLocked, iconColor }: { isSelected: boolean, header: string, icon: string, comingSoon: boolean, isLocked: boolean, iconColor?: string }) {

    return(
        <div className={`relative bottom-[22px] transition-all duration-300 flex items-center justify-between rounded-full flex-1 ${isSelected ? "bg-[#151A19] border-[#1F2726] border-[2px] h-[44px] heading-large-md" : "bg-[#344240] h-[36px] border-[#1F2726] border-[0px] w-full heading-large-sm hover:bg-[#151A19] hover:border-[2px] hover:h-[42px] hover:heading-large-md"} ${!comingSoon && !isLocked ? "pl-[10px] pr-[35px]" : "px-[10px]"}`}>
            <div className={`flex items-center gap-x-[15px] h-full ${isLocked ? "opacity-60" : ""}`}>
                <GTPIcon 
                    size={isSelected ? "lg" : "md"} 
                    icon={`${icon}${isLocked ? "-monochrome" : ""}` as GTPIconName} 
                    style={{ color: iconColor }} 
                    className={`transition-all duration-300 ${isSelected ? "!size-[36px]" : "!size-[24px]"}`}
                    containerClassName={`flex items-center justify-center   `}
                />
                <div className="">{header}</div>
            </div>
            {comingSoon && (
                <div className="flex items-center py-[2px] px-[10px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full">
                    <div className="heading-small-xxxs transition-all text-nowrap text-background ">
                        SOON
                    </div>
                </div>
            )}
            {isLocked && (
                <div className="flex items-center py-[2px] px-[10px] bg-[#1F2726] rounded-full">
                    <div className="heading-small-xxxs transition-all text-nowrap text-inherit ">
                        <GTPIcon icon={"feather:lock" as GTPIconName} size="sm" className="!size-[15px]" containerClassName="!size-[15px]" />
                    </div>
                </div>
            )}
        </div>
    )
}

