"use client"
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useSort } from "../_contexts/SortContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Icon from "@/components/layout/Icon";

export default function Controls() {
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics, metricIcons } = useMetrics();
  const { selectedTimespan, setSelectedTimespan, timespans } = useTimespan();
  //https://prod.liveshare.vsengsaas.visualstudio.com/join?2CD982ABF7BB2901EBDA7347C47AD49E3A97

  return (
    <>
      <TopRowContainer className="gap-y-[10px] rounded-t-[15px] rounded-b-[24px] flex-col-reverse">
        <TopRowParent className="">

          <MultipleSelectTopRowChild 
          handleNext={() => {
            const metrics = Object.keys(metricsDef);
            const index = metrics.indexOf(selectedMetrics[0]);
            const newIndex = (index + 1) % metrics.length;
        
            // if(sort.metric === selectedMetrics[0]){
              setSort({...sort, metric: metrics[newIndex]});
            // }
        
            setSelectedMetrics([metrics[newIndex]]);
          }}
          handlePrev={() => {
            const metrics = Object.keys(metricsDef);
            const index = metrics.indexOf(selectedMetrics[0]);
            const newIndex = index === 0 ? metrics.length - 1 : index - 1;
        
            // if(sort.metric === selectedMetrics[0]){
              setSort({...sort, metric: metrics[newIndex]});
            // }
        
            setSelectedMetrics([metrics[newIndex]]);
          }}
          options={Object.keys(metricsDef).map((key) => {
            return {
              key,
              name: metricsDef[key].name,
              icon: metricIcons[key] ? metricIcons[key] : "",
            };
          })}
          selected={selectedMetrics}
          setSelected={setSelectedMetrics}
          onSelect={(selected) => {
            setSort({...sort, metric: selected[selected.length - 1]});
          }}
          />

        </TopRowParent>
        <TopRowParent className="-py-[10px]">
          <>
          {Object.keys(timespans).map((key) => (
                <TopRowChild
                  key={key}
                  className="flex items-center justify-center h-[28px] md:h-[44px]"
                  onClick={() => {
                    setSelectedTimespan(key);
                  }}
                  isSelected={selectedTimespan === key}
                >
                  {selectedTimespan === key
                    ? timespans[key].label
                    : timespans[key].shortLabel}
                    {/* {timespans[key].shortLabel} */}
                </TopRowChild>
              )
          )}
            </>
        </TopRowParent>
      </TopRowContainer>
      
    </>
  )
}