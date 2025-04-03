//@ts-nocheck
//@ts-ignore
//@ts-skip
"use client";
import { useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import Link from "next/link";

interface TooltipProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const TooltipSizeClassMap = {
  sm: "w-[245px]",
  md: "w-[350px]",
  lg: "w-[350px] md:w-[460px]",
}

const Tooltip = ({ content, children, title, icon, size = "sm" }: TooltipProps) => {

  return (

          <div className={`flex flex-col gap-y-[5px] ${TooltipSizeClassMap[size]} py-[15px] pr-[15px] rounded-[15px] bg-[#1F2726] text-[#CDD8D3] text-xs shadow-[0px_0px_4px_0px_rgba(0,_0,_0,_0.25)]`}>
            {children}
          </div>

  );
};

export default Tooltip;


export const ExampleTooltip = () => {
  return (
    <Tooltip size="lg">
      <TooltipHeader title="Total Ethereum Ecosystem" icon={<GTPIcon icon="gtp-metrics-ethereum-ecosystem" size="sm" />} />
      <TooltipBody>
        <div className="pl-[20px]">Network maturity as introduced by ethereum.org. We review the network’s progress towards Ethereum alignment (rollup stages 0-2), total value secured (TVS), time live in production, and risk considerations. These levels help track network development and provide a standardized way for the community to evaluate progress.</div>
      </TooltipBody>
      <TooltipFooter>
        <div className="pl-[20px]">Find out more <Link href="https://ethereum.org/en/networks/networks-maturity/" target="_blank" className="underline">here</Link>.</div>
      </TooltipFooter>
    </Tooltip>
  );
};

const TooltipHeader = ({ title, icon, className }: TooltipHeaderProps) => {
  return (
    <div className={`flex w-full gap-x-[10px] pl-[20px] h-[18px] items-center ${className}`}>
      {icon && <div className="size-[15px]">{icon}</div>}
      {title && <div className="heading-small-xs h-[18px] flex items-center">{title}</div>}
    </div>
  );
};

const TooltipBody = ({ children, className }: TooltipBodyProps) => {
  return <div className={`flex flex-col w-full ${className}`}>{children}</div>;
};

const TooltipFooter = ({ children, className }: TooltipFooterProps) => {
  return <div className={`flex flex-col w-full ${className}`}>{children}</div>;
};


