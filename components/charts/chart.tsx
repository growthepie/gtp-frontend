"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";

import { useTheme } from "next-themes";
import {
  baseOptions,
  getTimespans,
  getTickPositions,
  getXAxisLabels,
} from "@/lib/chartUtils";
import ChartWatermark from "../layout/ChartWatermark";
import { Icon } from "@iconify/react";
import { AllChainsByKeys } from "@/lib/chains";

export const Chart = ({
  data,
  types,
  timespan,
  series,
  yScale = "linear",
}: {
  data: { [chain: string]: number[][] };
  types: string[];
  timespan: string;
  series: { chain: string; unixKey: string; dataKey: string }[];
  yScale?: "linear" | "logarithmic" | "percentage";
}) => {
  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const timespans = useMemo(() => getTimespans(Object.values(data)[0]), [data]);
  const tickPositions = useMemo(
    () =>
      getTickPositions(
        timespans.max.xMin,
        timespans.max.xMax,
        timespan === "max",
      ),
    [timespan, timespans.max.xMax, timespans.max.xMin],
  );

  const { theme } = useTheme();

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);

    setHighchartsLoaded(true);
  }, []);

  return (
    <>
      {Object.values(data)[0].length > 0 && timespans && highchartsLoaded ? (
        <div className="w-full py-4 rounded-xl">
          {/* <div>{JSON.stringify(timespans[timespan])}</div>
          <div>
            {JSON.stringify(
              Object.keys(data).map((chain) => ({
                chain,
                unixKey: series[0].unixKey,
                dataKey: series[0].dataKey,
                dataFirst: data[chain][0],
                dataLast: data[chain][data[chain].length - 1],
              })),
            )}
          </div> */}
          <div className="w-full h-[16rem] md:h-[26rem] relative rounded-xl">
            <div className="absolute w-full h-[24rem] top-1 md:top-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  ...baseOptions,
                  series: series.map((s, i) => ({
                    name: s.chain,
                    data: data[s.chain].map((d) => [
                      d[types.indexOf(s.unixKey)],
                      d[types.indexOf(s.dataKey)],
                    ]),
                    type: "area",
                    borderColor: "transparent",
                    shadow: {
                      color: "#CDD8D3" + "FF",
                      offsetX: 0,
                      offsetY: 0,
                      width: 2,
                    },
                    color: {
                      linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                      },
                      stops: [
                        [
                          0,
                          AllChainsByKeys[s.chain]?.colors[theme ?? "dark"][0] +
                            "FF",
                        ],
                        [
                          0.349,
                          AllChainsByKeys[s.chain]?.colors[theme ?? "dark"][0] +
                            "88",
                        ],
                        [
                          1,
                          AllChainsByKeys[s.chain]?.colors[theme ?? "dark"][0] +
                            "00",
                        ],
                      ],
                    },
                  })),
                  xAxis: {
                    ...baseOptions.xAxis,
                    min: timespans[timespan].xMin,
                    max: timespans[timespan].xMax,
                    minorTicks: true,
                    minorTickLength: 2,
                    minorTickWidth: 2,
                    minorGridLineWidth: 0,
                    minorTickInterval: ["7d", "30d"].includes(timespan)
                      ? 1000 * 60 * 60 * 24 * 1
                      : 1000 * 60 * 60 * 24 * 7,
                    tickPositions: tickPositions,
                    labels: getXAxisLabels(),
                  },
                  yAxis: {
                    ...baseOptions.yAxis,
                    type: yScale,
                    min: 0,
                    max: 1,
                    labels: {
                      formatter: function (
                        this: AxisLabelsFormatterContextObject,
                      ) {
                        const { value } = this;
                        return `${((value as number) * 100).toFixed(0)}%`;
                      },
                    },
                  },
                }}
                constructorType={"stockChart"}
                ref={(chart) => {
                  chartComponent.current = chart?.chart;
                }}
              />
            </div>
            <div className="absolute bottom-[20%] right-[5%] md:bottom-14 md:right-10 pointer-events-none z-0 opacity-50 mix-blend-lighten">
              <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px]" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[26rem] my-4 flex justify-center items-center">
          <div className="w-10 h-10 animate-spin">
            <Icon icon="feather:loader" className="w-10 h-10 text-forest-500" />
          </div>
        </div>
      )}
    </>
  );
};
