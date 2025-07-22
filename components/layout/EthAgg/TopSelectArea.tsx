"use client";
import Container from "../Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useState } from "react";
import { IS_PRODUCTION } from "@/lib/helpers";

export default function TopSelectArea({
  selectedBreakdownGroup,
  setSelectedBreakdownGroup,
}: {
  selectedBreakdownGroup: string;
  setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
}) {
  return (
    <Container style={{marginTop: "45px"}} className="!px-0 overflow-y-visible">
        {/* allow hoizontal scroll if needed */}
        <div className="relative h-[48px] flex gap-x-[5px] items-center w-full overflow-y-visible overflow-x-auto px-[15px] md:px-[50px] scrollbar-none">

            {/* <div className="flex flex-row gap-x-[8px] w-full min-h-[44px] items-center"> */}
                <BreakdownButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Metrics" icon="gtp-realtime" />
                {/* <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Ethereum Ecosystem" icon="gtp-ethereumlogo" />
                
                <SelectionButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Builders & Apps" icon="gtp-project" /> */}
                <BreakdownButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Ethereum Ecosystem" icon="gtp-ethereumlogo" isComingSoon />
                <BreakdownButton selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} breakdownGroup="Builders & Apps" icon="gtp-project" isComingSoon />
            {/* </div> */}
            <div className="absolute left-[15px] md:left-[50px] w-[calc(100%-30px)] md:w-[calc(100%-100px)] bottom-0 h-[24px] z-[-1] rounded-bl-[54px] rounded-br-[54px] bg-[#1F2726]"></div>
        </div>
    </Container>
  );
}

// const ComingSoonButton = ( {
//     selectedBreakdownGroup,
//     setSelectedBreakdownGroup,
//     breakdownGroup,
//     icon,
// }: {
//     selectedBreakdownGroup: string;
//     setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
//     breakdownGroup: string;
//     icon: GTPIconName;
// }) => {

//     const IS_BREAKDOWN_GROUP_SELECTED = selectedBreakdownGroup === breakdownGroup;
//     const selectedBreakdownClass = "bg-active-black border-[0px] border-[#1F2726] h-[48px]";
//     const notSelectedBreakdownClass = !IS_PRODUCTION ? "bg-[#5A6462] h-[40px] group-hover:h-[48px]" : "bg-[#5A6462] h-[40px] group-hover:h-[48px] group-hover:pr-[15px]";
//     const selectedBreakdownGroupClass = IS_BREAKDOWN_GROUP_SELECTED ? selectedBreakdownClass : notSelectedBreakdownClass;
   
//     return (
//         <div className={`group flex ${IS_BREAKDOWN_GROUP_SELECTED && "flex-1"} items-center justify-between flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all text-[#344240] ${selectedBreakdownGroupClass}`}
//             onClick={() => !IS_PRODUCTION ? setSelectedBreakdownGroup(breakdownGroup) : null}
//         >
//             <div className="flex items-center gap-x-[15px]">
//                 <GTPIcon icon={icon} size={"md"} className={`transition-all relative ${breakdownGroup === "Builders & Apps" ? "bottom-[2px] " : ""}`}/>
//                 <div className={`${selectedBreakdownGroup === breakdownGroup && "!block" } hidden lg:block ${"heading-large-sm"} transition-all text-nowrap `}>{breakdownGroup}</div>
//             </div>
//             <div className="-ml-[5px] flex items-center py-[2px] px-[10px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full">
//                 <div className={`${"heading-large-sm"} transition-all text-nowrap heading-small-xxxs `}>SOON</div>
//             </div>
//         </div>
//     )
// }

// const SelectionButton = ({
//     selectedBreakdownGroup,
//     setSelectedBreakdownGroup,
//     breakdownGroup,
//     icon,
// }: {
//     selectedBreakdownGroup: string;
//     setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
//     breakdownGroup: string;
//     icon: GTPIconName;
// }) => {

//     // const [isHovered, setIsHovered] = useState(false);

//     const selectedBreakdownClass = "bg-active-black border-[3px] border-[#344240] h-[48px] hover:h-[48px] hover:pr-[15px]";
//     const notSelectedBreakdownClass = "bg-medium-background hover:bg-[#5A6462] hover:pr-[15px] h-[36px] hover:h-[48px]";
//     const selectedBreakdownGroupClass = selectedBreakdownGroup === breakdownGroup ? selectedBreakdownClass : notSelectedBreakdownClass;

//     const iconClass = selectedBreakdownGroup === breakdownGroup ? "scale-[122%]" : "scale-100 group-hover:scale-[122%] group-hover:pr-[5px]";

//     return (
//         <div className={`group flex ${selectedBreakdownGroup === breakdownGroup && "flex-1"} justify-start flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all cursor-pointer ${selectedBreakdownGroupClass}`}
//             onClick={() => setSelectedBreakdownGroup(breakdownGroup)}
//         >   
//             <div className={`flex items-center gap-x-[15px] ${iconClass} origin-left transition-all text-nowrap`}>
//                 <GTPIcon icon={icon} size="md" className={`transition-all relative ${breakdownGroup === "Builders & Apps" ? "bottom-[2px]" : ""}`}/>
//                 <div className={`${selectedBreakdownGroup === breakdownGroup && "!block pr-[30px]" } hidden lg:block lg:pr-[30px] heading-large-sm transition-all text-nowrap`}>{breakdownGroup}</div>
//             </div>
//         </div>
//     );
// }

interface BreakdownButtonProps {
    selectedBreakdownGroup: string;
    setSelectedBreakdownGroup: (selectedBreakdownGroup: string) => void;
    breakdownGroup: string;
    icon: GTPIconName;
    /**
     * If true, the button will render in the "Coming Soon" state.
     * It will display a "SOON" badge and have a different style and click behavior.
     * @default false
     */
    isComingSoon?: boolean;
}

const BreakdownButton = ({
    selectedBreakdownGroup,
    setSelectedBreakdownGroup,
    breakdownGroup,
    icon,
    isComingSoon = false,
}: BreakdownButtonProps) => {

    const IS_BREAKDOWN_GROUP_SELECTED = selectedBreakdownGroup === breakdownGroup;

    // --- Conditional Logic based on `isComingSoon` ---

    // 1. Determine the classes for selected and not-selected states
    const selectedBreakdownClass = isComingSoon
        ? "bg-active-black border-[3px] border-[#1F2726] h-[48px] text-[#344240]"
        : "bg-active-black border-[3px] border-[#344240] h-[48px] hover:h-[48px] hover:pr-[15px]";

    // NOTE: The original `ComingSoonButton` had a redundant ternary based on `IS_PRODUCTION`. 
    // This simplified version uses the more inclusive class.
    const notSelectedBreakdownClass = isComingSoon
        ? "bg-[#5A6462] h-[36px] group-hover:h-[48px] group-hover:pr-[15px] text-[#344240]"
        : "bg-medium-background hover:bg-[#5A6462] hover:pr-[15px] h-[36px] hover:h-[48px]";

    const selectedBreakdownGroupClass = IS_BREAKDOWN_GROUP_SELECTED
        ? selectedBreakdownClass
        : notSelectedBreakdownClass;

    // 2. Determine layout (justify-content)
    const justifyContentClass = isComingSoon ? 'justify-between' : 'justify-start';

    // 3. Determine icon/text container animation class (only for the selection button)
    const iconContainerClass = !isComingSoon && (IS_BREAKDOWN_GROUP_SELECTED
        ? "scale-[122%]"
        : "scale-100 group-hover:scale-[122%] group-hover:pr-[5px]");

    // 4. Define the onClick handler
    const handleClick = () => {
        if (isComingSoon && IS_PRODUCTION) {
            // Do nothing for "Coming Soon" buttons in production
            return;
        }
        setSelectedBreakdownGroup(breakdownGroup);
    };

    const IconName = isComingSoon ? `${icon}-monochrome` : icon;

    return (
        <div
            className={`group flex items-center flex-row gap-x-[15px] rounded-full px-[10px] py-[3px] transition-all lg:min-w-fit lg:w-1/3 ${IS_BREAKDOWN_GROUP_SELECTED && "flex-1 lg:flex-initial"} ${justifyContentClass} ${selectedBreakdownGroupClass} ${!isComingSoon && "cursor-pointer"}`}
            onClick={handleClick}
        >
            <div className={`flex items-center gap-x-[15px] text-nowrap origin-left transition-all ${iconContainerClass || ''}`}>
                <GTPIcon icon={IconName as GTPIconName} size="md" className={`transition-all relative`} />
                <div className={`${IS_BREAKDOWN_GROUP_SELECTED ? "!block" : "hidden"} lg:block ${IS_BREAKDOWN_GROUP_SELECTED && !isComingSoon ? "pr-[30px]" : ""} lg:pr-[30px] heading-large-sm transition-all`}>
                    {breakdownGroup}
                </div>
            </div>

            {/* 5. Conditionally render the "SOON" badge */}
            {isComingSoon && (
                <div className="-ml-[5px] flex items-center py-[2px] px-[10px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full">
                    <div className="heading-small-xxxs transition-all text-nowrap ">
                        SOON
                    </div>
                </div>
            )}
        </div>
    );
};