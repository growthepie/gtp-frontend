"use client";
import Highcharts from "highcharts/highstock";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  LineSeries,
  Tooltip,
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
} from "react-jsx-highcharts";
import { FeesBreakdown } from "@/types/api/EconomicsResponse";
import { useLocalStorage } from "usehooks-ts";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function EconHeadCharts({
  da_fees,
}: {
  da_fees: FeesBreakdown;
}) {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  return (
    <div className="flex gap-x-[15px]">
      {Object.keys(da_fees).map((key, i) => {
        let dataIndex = da_fees[key].daily.types.indexOf(
          showUsd ? "usd" : "eth",
        );
        return (
          <div
            className="relative w-[406px] h-[180px] pr-[15px] pt-[10px] bg-[#1F2726] rounded-2xl overflow-hidden"
            key={key}
          >
            <div className="absolute top-[12px] left-[15px] text-[16px] font-[650] ">
              {da_fees[key].metric_name}
            </div>

            <HighchartsProvider Highcharts={Highcharts}>
              <HighchartsChart
                containerProps={{ style: { height: "100%", width: "100%" } }}
                render={(chart) => {}}
              >
                <Chart
                  backgroundColor={"transparent"}
                  type="area"
                  panning={{ enabled: true }}
                  panKey="shift"
                  zooming={{ type: undefined }}
                  style={{ borderRadius: 15 }}
                  animation={{ duration: 50 }}
                  margin={[0, 0, 0, 0]} // Use the array form for margin
                />

                <Legend />
                <XAxis
                  title={undefined}
                  type="datetime"
                  labels={{
                    useHTML: true,
                    style: {
                      color: COLORS.LABEL,
                      fontSize: "10px",
                      fontFamily: "var(--font-raleway), sans-serif",
                      zIndex: 1000,
                    },
                    enabled: true,
                    // formatter: (item) => {
                    //   const date = new Date(item.value);
                    //   const isMonthStart = date.getDate() === 1;
                    //   const isYearStart = isMonthStart && date.getMonth() === 0;
                    //   if (isYearStart) {
                    //     return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                    //   } else {
                    //     return `<span style="">${date.toLocaleDateString("en-GB", {
                    //       month: "short",
                    //     })}</span>`;
                    //   }
                    // },
                  }}
                  crosshair={{
                    width: 0.5,
                    color: COLORS.PLOT_LINE,
                    snap: false,
                  }}
                  tickmarkPlacement="on"
                  tickWidth={1}
                  tickLength={20}
                  ordinal={false}
                  minorTicks={false}
                  minorTickLength={2}
                  minorTickWidth={2}
                  minorGridLineWidth={0}
                  minorTickInterval={1000 * 60 * 60 * 24 * 7}
                >
                  <XAxis.Title>X Axis</XAxis.Title>
                </XAxis>
                <YAxis
                  opposite={false}
                  // showFirstLabel={true}
                  // showLastLabel={true}
                  type="linear"
                  gridLineWidth={1}
                  gridLineColor={"#5A64624F"}
                  showFirstLabel={false}
                  showLastLabel={false}
                  labels={{
                    align: "left",
                    y: -2,
                    x: 3,
                    style: {
                      fontSize: "8px",
                      color: "#CDD8D3",
                    },
                  }}
                  min={0}
                >
                  <YAxis.Title>Y Axis</YAxis.Title>
                  <AreaSeries
                    showInLegend={false}
                    data={da_fees[key].daily.data.map((d: any) => [
                      d[0],
                      d[dataIndex],
                    ])}
                  ></AreaSeries>
                </YAxis>
              </HighchartsChart>
            </HighchartsProvider>
          </div>
        );
      })}
    </div>
  );
}
