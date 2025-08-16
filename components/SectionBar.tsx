"use client"
import { GTPIcon } from "./layout/GTPIcon"
import { GTPIconName } from "@/icons/gtp-icon-names"
import { useState } from "react"

const GRID_CSS_STATES = {
    "selected": "bg-[#151A19] border-[#1F2726] border-[2px] h-[44px] heading-large-md ",
    "not-selected": "bg-[#344240] h-[36px] border-[#1F2726] border-[0spx] w-full heading-large-sm",
    "hover": "bg-[#151A19] border-[#1F2726] border-[2px] h-[42px] heading-large-md"
}

export function SectionBar({ children }: { children: React.ReactNode }) {
    return(
        <div className="grid grid-flow-col auto-cols-max gap-[5px] w-full h-[24px] relative items-center ">
            <div className="bg-[#1F2726] rounded-full h-[24px] w-full absolute mx-[7px]"></div>
            {children}
        </div>
    )
}

export function SectionBarItem({ isSelected, header, icon, comingSoon, isLocked }: { isSelected: boolean, header: string, icon: string, comingSoon: boolean, isLocked: boolean }) {

    const [cssState, setCssState] = useState(GRID_CSS_STATES[isSelected ? "selected" : "not-selected"])

    return(
        <div className={`relative bottom-[20px] transition-all duration-300 flex items-center justify-between rounded-full min-w-[265px] max-[300px] ${cssState} ${!comingSoon && !isLocked ? "pl-[10px] pr-[35px]" : "px-[10px]"} `}
            onMouseEnter={() => !isSelected && setCssState(GRID_CSS_STATES["hover"])}
            onMouseLeave={() => setCssState(GRID_CSS_STATES[isSelected ? "selected" : "not-selected"])}
        >
            <div className={`flex items-center gap-x-[15px] ${isLocked ? "opacity-60" : ""}`}>
                <GTPIcon size={"md"} icon={`${icon}${isLocked ? "-monochrome" : ""}` as GTPIconName} />
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

