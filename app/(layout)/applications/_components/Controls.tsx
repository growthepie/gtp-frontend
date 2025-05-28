"use client"
import { memo, useCallback } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useSort } from "../_contexts/SortContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Icon from "@/components/layout/Icon";

const Controls = memo(() => {
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, metricIcons } = useMetrics();
  const { selectedTimespan, setSelectedTimespan, timespans } = useTimespan();

  // Memoize handlers to prevent recreating functions on each render
  const handleNextMetric = useCallback(() => {
    const metrics = Object.keys(metricsDef);
    const index = metrics.indexOf(selectedMetrics[0]);
    const newIndex = (index + 1) % metrics.length;

    setSort({...sort, metric: metrics[newIndex]});
    setSelectedMetrics([metrics[newIndex]]);
  }, [metricsDef, selectedMetrics, setSort, sort, setSelectedMetrics]);

  const handlePrevMetric = useCallback(() => {
    const metrics = Object.keys(metricsDef);
    const index = metrics.indexOf(selectedMetrics[0]);
    const newIndex = index === 0 ? metrics.length - 1 : index - 1;

    setSort({...sort, metric: metrics[newIndex]});
    setSelectedMetrics([metrics[newIndex]]);
  }, [metricsDef, selectedMetrics, setSort, sort, setSelectedMetrics]);

  const handleMetricSelect = useCallback((selected: string[]) => {
    setSort({...sort, metric: selected[selected.length - 1]});
  }, [setSort, sort]);

  return (
    <>
      <TopRowContainer className="gap-y-[10px] rounded-t-[15px] rounded-b-[24px] flex-col-reverse">
        <TopRowParent className="">
          <MultipleSelectTopRowChild 
            handleNext={handleNextMetric}
            handlePrev={handlePrevMetric}
            options={Object.keys(metricsDef).map((key) => ({
              key,
              name: metricsDef[key].name,
              icon: metricIcons[key] ? metricIcons[key] : "",
            }))}
            selected={selectedMetrics}
            setSelected={setSelectedMetrics}
            onSelect={handleMetricSelect}
          />
        </TopRowParent>
        
        <TopRowParent className="-py-[10px]">
          {Object.keys(timespans).map((key) => (
            <TopRowChild
              key={key}
              className="flex items-center justify-center h-[28px] md:h-[44px]"
              onClick={() => {
                  setSelectedTimespan(key);
              }}
              isSelected={selectedTimespan === key}
            >
              {selectedTimespan === key ? (
                  <>
                    <div className="hidden md:block">{timespans[key].label}</div>
                    <div className="block md:hidden">{timespans[key].shortLabel}</div>
                  </>
                ) : (
                  timespans[key].shortLabel
                )
              }
            </TopRowChild>
          ))}
        </TopRowParent>
      </TopRowContainer>
    </>
  );
});

Controls.displayName = 'Controls';

export default Controls;