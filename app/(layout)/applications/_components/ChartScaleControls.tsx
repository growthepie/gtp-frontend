"use client"
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { useSort } from "../_contexts/SortContext";
import { useChartScale } from "../_contexts/ChartScaleContext";
import Container from "@/components/layout/Container";

export default function ChartScaleControls() {
  const { scaleDefs, setSelectedScale, selectedScale } = useChartScale();


  return (
    <Container>
      <TopRowContainer className="md:!rounded-[24px] !justify-end">
        <TopRowParent className="-py-[10px]">
          {Object.keys(scaleDefs).map((key) => (
                <TopRowChild
                  key={key}
                  className="flex items-center justify-center h-[28px] md:h-[44px]"
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
        </TopRowParent>
      </TopRowContainer>
      
      </Container>
  )
}