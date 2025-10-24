"use client"
import { useMediaQuery } from "usehooks-ts";
import { GTPIcon } from "./layout/GTPIcon"
import { GTPIconName } from "@/icons/gtp-icon-names"
import HorizontalScrollContainer from "./HorizontalScrollContainer";
import { GTPTooltipNew } from "./tooltip/GTPTooltip";

export function SectionBar({ children }: { children: React.ReactNode }) {
    const isMobile = useMediaQuery("(max-width: 1440px)");
    
    return(
        <HorizontalScrollContainer includeMargin={false} className="w-full h-[46px] relative items-center overflow-y-hidden !px-0">
            <div className={`${isMobile ? "flex gap-[5px] justify-start overflow-clip" : "grid grid-flow-col auto-cols-fr gap-[5px]"} w-full h-[46px] relative items-center`}>
            <div className="absolute -bottom-[22px] left-0 w-full h-full px-[7px]">
                <div className="bg-color-bg-default rounded-full h-[24px] absolute w-[99%] overflow-clip"
                style={{
                    height: isMobile ? "0px" : "24px",
                    opacity: isMobile ? 0 : 1,
                }}
                ></div>
            </div>
            {children}
            </div>
        </HorizontalScrollContainer>
    )
}

export function SectionBarItem({ isSelected, header, icon, comingSoon, isLocked, iconColor, index, isHovered }: { isSelected: boolean, header: string, icon: string, comingSoon: boolean, isLocked: boolean, iconColor?: string, index: number, isHovered: boolean }) {
    const isMobile = useMediaQuery("(max-width: 1440px)");
    const mobileWidth = 10 * header.length + 30;

    return(
        <>
        {isLocked || comingSoon ? (
                <GTPTooltipNew
                    placement="bottom-start"
                    allowInteract={true}
                    trigger={
                        <div className={`relative  transition-all  duration-300 flex items-center justify-between rounded-full
                            ${isLocked || comingSoon ? "" : "hover:bg-color-ui-hover h-[36px]"}
                            ${!isLocked &&  "cursor-pointer"}
                            ${isSelected ? "bg-color-ui-active border-2 border-[#344240] h-[46px] heading-large-sm md:heading-large-md" : "border-2 bg-color-bg-medium h-[38px] border-color-bg-medium w-full  hover:border-2  hover:heading-large-md  hover:h-[42px]"} 
                            ${(!isMobile && (isSelected || isHovered)) ? !comingSoon && !isLocked ? "pl-[10px] pr-[35px]" : "px-[10px]" : "px-[10px]"} 
                            ${!isMobile ? isHovered || isSelected ? "min-w-fit" : "!min-w-[165px]" : "w-auto max-w-fit"}
                            ${!isSelected ? "heading-large-xs lg:heading-large-sm" : ""}
                            ${isMobile ? "flex-shrink flex-grow-0 basis-auto bottom-[0px]" : "flex-1"}`}
                            
                            style={{
                                zIndex: !isSelected && !isHovered ? 10 * index : isHovered ? 110 : 100,
                                fontSize: !isSelected ? 'clamp(14px, 2vw, 16px)' : undefined
                            }}
                        >
                            <div className={`flex items-center justify-center h-full ${isLocked || comingSoon ? "opacity-60" : ""} ${isMobile && !(isSelected || isHovered) ? "gap-x-0" : "gap-x-[15px]"}`}>
                                <GTPIcon 
                                    icon={`${icon}${isLocked || comingSoon ? "-monochrome" : ""}` as GTPIconName} 
                                    style={{ color: iconColor }} 
                                    className={`transition-all duration-300 ${isSelected ? "!size-[36px]" : "lg:!size-[24px]"} ${isMobile && (isLocked || comingSoon) ? "" : ""}`}
                                    containerClassName={`flex items-center justify-center w-fit h-fit   `}
                                />
                                <div 
                                    className={`transition-all duration-300 overflow-hidden whitespace-nowrap`}
                                    style={{
                                        width: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `${mobileWidth}px` : "auto"
                                    }}
                                >
                                    {header}
                                </div>
                                
                            </div>
                            {comingSoon && (
                                <div className="flex items-center py-[2px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full overflow-hidden" style={{ width: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `50px` : "50px" }}>
                                    <div className="heading-small-xxxs transition-all text-nowrap text-background w-full text-center">
                                        SOON
                                    </div>
                                </div>
                            )}
                            {isLocked && (
                                <div className="flex items-center py-[2px] bg-color-bg-default rounded-full overflow-hidden" style={{ maxWidth: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `30px` : "auto" }}>
                                    <div className="heading-small-xxxs transition-all text-nowrap text-inherit ">
                                        <GTPIcon icon={"feather:lock" as GTPIconName} size="sm" className="!size-[15px]" containerClassName="!size-[15px]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    containerClass="flex flex-col gap-y-[10px]"
                    positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                >
                {comingSoon && <div className="px-[15px] py-[5px]">SOON Text</div>}
                {isLocked && <div className="px-[15px] py-[5px]">Locked Text</div>}
                </GTPTooltipNew>
            ) : (
            <div className={`relative  transition-all  duration-300 flex items-center justify-between rounded-full
                ${isLocked || comingSoon ? "" : "hover:bg-color-ui-hover h-[36px]"}
                ${!isLocked &&  "cursor-pointer"}
                ${isSelected ? "bg-color-ui-active border-2 border-[#344240] h-[46px] heading-large-sm md:heading-large-md" : "border-2 bg-color-bg-medium h-[38px] border-color-bg-medium w-full  hover:border-2  hover:heading-large-md  hover:h-[42px]"} 
                ${(!isMobile && (isSelected || isHovered)) ? !comingSoon && !isLocked ? "pl-[10px] pr-[35px]" : "px-[10px]" : "px-[10px]"} 
                ${!isMobile ? isHovered || isSelected ? "min-w-fit" : "!min-w-[165px]" : "w-auto max-w-fit"}
                ${!isSelected ? "heading-large-xs lg:heading-large-sm" : ""}
                ${isMobile ? "flex-shrink flex-grow-0 basis-auto bottom-[0px]" : "flex-1"}`}
                
                style={{
                    zIndex: !isSelected && !isHovered ? 10 * index : isHovered ? 110 : 100,
                    fontSize: !isSelected ? 'clamp(14px, 2vw, 16px)' : undefined
                }}
            >
                <div className={`flex items-center justify-center h-full ${isLocked || comingSoon ? "opacity-60" : ""} ${isMobile && !(isSelected || isHovered) ? "gap-x-0" : "gap-x-[15px]"}`}>
                    <GTPIcon 
                        icon={`${icon}${isLocked || comingSoon ? "-monochrome" : ""}` as GTPIconName} 
                        style={{ color: iconColor }} 
                        className={`transition-all duration-300 ${isSelected ? "!size-[36px]" : "lg:!size-[24px]"} ${isMobile && (isLocked || comingSoon) ? "" : ""}`}
                        containerClassName={`flex items-center justify-center w-fit h-fit   `}
                    />
                    <div 
                        className={`transition-all duration-300 overflow-hidden whitespace-nowrap`}
                        style={{
                            width: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `${mobileWidth}px` : "auto"
                        }}
                    >
                        {header}
                    </div>
                    
                </div>
                {comingSoon && (
                    <div className="flex items-center py-[2px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full overflow-hidden" style={{ width: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `50px` : "50px" }}>
                        <div className="heading-small-xxxs transition-all text-nowrap text-background w-full text-center">
                            SOON
                        </div>
                    </div>
                )}
                {isLocked && (
                    <div className="flex items-center py-[2px] bg-color-bg-default rounded-full overflow-hidden" style={{ maxWidth: isMobile && !isSelected && !isHovered ? "0px" : isMobile ? `30px` : "auto" }}>
                        <div className="heading-small-xxxs transition-all text-nowrap text-inherit ">
                            <GTPIcon icon={"feather:lock" as GTPIconName} size="sm" className="!size-[15px]" containerClassName="!size-[15px]" />
                        </div>
                    </div>
                )}
            </div>
        )}
        </>
    )
}

