"use client"
import {useState} from "react"
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export default function WorkWithUs() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  }

  return (
    <div className="relative flex w-full h-full " onClick={handleClick}>
        <div className="absolute flex items-center justify-left bg-[#1F2726] shadow-xl -bottom-[22px] px-[15px] z-30 rounded-full w-full gap-x-[10px] h-[44px]"> 
            <GTPIcon icon="gtp-socials" size="md" />
            <div className="heading-small-sm">Work with us</div>
        </div>
        <div className="relative ml-auto transition-all duration-300" style={{
            width: !isOpen ? "170px" : "286px",
            transformOrigin: "right center",
        }}></div>
        <div className={`absolute flex items-center justify-center overflow-hidden transition-all duration-300  bg-[#151A19] w-full rounded-b-2xl rounded-t-[20px] z-20 
        ${isOpen ? "-top-[20px] right-[1px]" : "-top-[21px] right-[6px]"}`} 
        style={{
            height: !isOpen ? "36px" : "186px",
            width: !isOpen ? "130px" : "284px",
        
        }}>
            <div className="flex flex-col gap-y-[10px] px-[16px] pt-[55px] pb-[15px] min-h-[186px] w-full h-full">

                <div className="flex items-center gap-x-[10px] justify-start text-sm font-semibold">
                    <GTPIcon icon={"feather:linkedin" as GTPIconName} size="sm" />
                    <div className="flex items-center gap-x-[10px] justify-start text-sm">LinkedIn</div>
                </div>
                <div className="flex items-center gap-x-[10px] justify-start text-sm font-semibold">
                    <GTPIcon icon={"feather:discord" as GTPIconName} size="sm" />
                    <div className="flex items-center gap-x-[10px] justify-start text-sm">Join our Discord</div>
                </div>
                <div className="flex items-center gap-x-[10px] justify-start text-sm font-semibold">
                    <GTPIcon icon={"gtp-message-monochrome" as GTPIconName} size="sm" />
                    <div className="flex items-center gap-x-[10px] justify-start text-sm">Send us an email</div>
                </div>
                <div className="flex items-center gap-x-[10px] justify-start text-sm font-semibold">
                    <GTPIcon icon={"gtp-backgroundinformation-monochrome" as GTPIconName} size="sm" />
                    <div className="flex items-center gap-x-[10px] justify-start text-sm whitespace-nowrap">Want to get listed? Fill in the form.</div>
                </div>
            </div>
        </div>
    

        


    </div>
  );
}