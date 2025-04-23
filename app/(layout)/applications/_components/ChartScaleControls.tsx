"use client"
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useSort } from "../_contexts/SortContext";
import { useChartScale } from "../_contexts/ChartScaleContext";
import Container from "@/components/layout/Container";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Icon from "@/components/layout/Icon";

export default function ChartScaleControls({sources}: React.PropsWithChildren<{sources?: string[]}>) {
  const { scaleDefs, setSelectedScale, selectedScale } = useChartScale();

  return (
    <>
      <TopRowContainer className="!flex md:!rounded-[24px] !justify-end">
        <TopRowParent className="-py-[10px]">
          {Object.keys(scaleDefs).map((key) => (
                <TopRowChild
                  key={key}
                  className="flex items-center justify-center h-[28px] md:h-[34px]"
                  onClick={() => {
                    setSelectedScale(key);
                  }}
                  isSelected={selectedScale === key}
                >
                  {/* {selectedTimespan === key
                    ? timespans[key].label
                    : timespans[key].shortLabel} */}
                    {scaleDefs[key].label}
                </TopRowChild>
              )
          )}
          <Tooltip placement="left" allowInteract>
            <TooltipTrigger className="pl-[5px] md:pl-[15px]">
                <Icon icon="feather:info" className="size-[24px]" />
            </TooltipTrigger>
            <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
              <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[300px] md:w-[420px] h-[80px] flex items-center">
                <div className="flex flex-col space-y-1">
                  <div className="font-bold text-sm leading-snug">
                    Data Sources:
                  </div>
                  <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                    {sources}
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TopRowParent>
        
      </TopRowContainer>
      
      </>
  )
}