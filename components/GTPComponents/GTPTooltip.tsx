"use client";

import { Fragment } from "react";
import { escapeHtml } from "@/lib/echarts-utils";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";


export type DataRows = {
  name: string;
  value: number | string;
  color: string;
  barWidth?: number;
}


export function GTPTooltipChart({ width = 230, metricName, dateLabel, dataRows, totalRow }: { width?: number, metricName: string, dateLabel: string, dataRows: DataRows[], totalRow?: string}) {
  return (
    <div
      className="flex flex-col py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default"
      style={{ 
        boxShadow: "var(--bp-xs, 0) var(--bp-xs, 0) 27px 0 var(--color-ui-shadow, #151A19)",
        width: `${width}px`,
      }}
    >
      <div className="flex w-full justify-between h-[20px] items-center text-center pl-[20px] " >
        <div className="heading-large-xs pb-[1px]" style={{fontWeight: 700}}>{dateLabel}</div>
        <div className="text-xs">{metricName}</div>
      </div>
      <div className="flex flex-col w-full pt-[5px]">
        {dataRows.map((row) => (
          <div key={row.name + "GTPTooltipChart"}>
            <div className="flex w-full justify-between items-center">
              <div className="flex items-center gap-x-[5px]">
                <div className="w-[15px] h-[10px] rounded-r-full" style={{ backgroundColor: row.color }}></div>
                <div className="tooltip-point-name text-xs">{escapeHtml(row.name)}</div>
              </div>
              <div className="flex-1 text-right justify-end flex numbers-xs">{row.value}</div>
            </div>
            <div className="ml-[18px] mr-[1px] h-[2px] relative mb-[2px] overflow-hidden">
              <div className="h-[2px] rounded-none absolute right-0 top-0" style={{ width: `${row.barWidth || 0}%`, backgroundColor: row.color }}></div>
            </div>
          </div>
        ))}

        {totalRow && (
          <div className="flex w-full justify-between items-center pl-[20px]">
            <div className="tooltip-point-name heading-small-xxs">Total:</div>
            <div className="flex-1 text-right justify-end flex numbers-xs">{totalRow}</div>
          </div>
        )}

      </div>
    </div>
  );
}

export function GTPTooltipGeneral({ width = 230, headerText, headerIcon }: { width?: number, headerText: string, headerIcon?: GTPIconName}) {
  return (
    <div
      className="flex flex-col py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default"
      style={{ 
        boxShadow: "var(--bp-xs, 0) var(--bp-xs, 0) 27px 0 var(--color-ui-shadow, #151A19)",
        width: `${width}px`,
      }}
    >
      <div className="flex w-full justify-between items-center text-center pl-[20px] " >
        {headerIcon && <>{<GTPIcon icon={headerIcon} size='md' className='pointer-events-auto' style={{ color: "rgb(var(--text-secondary))" }} />}</>}
        <div className="heading-large-xs pb-[1px]" style={{fontWeight: 700}}>{headerText}</div>
       
      </div>

    </div>
  );
}