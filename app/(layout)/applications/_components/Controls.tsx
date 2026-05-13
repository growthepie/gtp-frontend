"use client"
import { memo, useCallback } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useSort } from "../_contexts/SortContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Icon from "@/components/layout/Icon";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { useMediaQuery } from "@react-hook/media-query";

const Controls = memo(() => {
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, metricIcons } = useMetrics();
  const { selectedTimespan, setSelectedTimespan, timespans } = useTimespan();
  const isMobile = useMediaQuery("(max-width: 1024px)");

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
      <GTPButtonContainer className="relative z-[20]" style={{ flexWrap: 'wrap-reverse', }}

      >
        <GTPButtonRow 
          className="flex-nowrap"
          style={{width: isMobile ? "100%" : "auto"}}
        >
          <MultipleSelectTopRowChild 
            handleNext={handleNextMetric}
            handlePrev={handlePrevMetric}
            options={Object.keys(metricsDef).filter((key) => metricsDef[key].fundamental).map((key) => ({
              key,
              name: metricsDef[key].name,
              icon: metricIcons[key] ? metricIcons[key] : "",
            }))}
            selected={selectedMetrics}
            setSelected={setSelectedMetrics}
            onSelect={handleMetricSelect}
          />
        </GTPButtonRow>
        
        <GTPButtonRow className="flex-nowrap" style={{width: isMobile ? "100%" : "auto"}} wrap={isMobile ? true : false}>
          {Object.keys(timespans).map((key) => (
            <GTPButton
              key={key}
              className="w-full justify-center" 
              innerStyle={{ width: "100%" }}
              clickHandler={() => {
                  setSelectedTimespan(key);
              }}
              isSelected={selectedTimespan === key}
              label={isMobile ? timespans[key].shortLabel : timespans[key].label}
              size="md"
              variant="primary"
            />
          ))}
        </GTPButtonRow>
      </GTPButtonContainer>
    </>
  );
});

Controls.displayName = 'Controls';

export default Controls;