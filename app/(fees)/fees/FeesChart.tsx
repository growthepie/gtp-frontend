"use client";
import { AllChainsByKeys } from '@/lib/chains';
import { formatNumber, tooltipFormatter, tooltipPositioner } from '@/lib/chartUtils';
import Highcharts from 'highcharts/highstock';
import ReactJson from 'react-json-view';
import {
  HighchartsProvider, HighchartsChart, Chart, XAxis, YAxis, Title, Subtitle, Legend, LineSeries, Tooltip, PlotBand, PlotLine, withHighcharts
} from 'react-jsx-highcharts';
import useSWR from "swr";
import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';
import { useLocalStorage, useSessionStorage } from 'usehooks-ts';

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};


const plotOptions: Highcharts.PlotOptions = {

};

type FeesChartProps = {
  seriesKey: string;
  selectedTimeframe: string;
};

export default function FeesChart({ seriesKey, selectedTimeframe }: FeesChartProps) {
  const { theme } = useTheme();
  // const seriesKey = "txcosts_avg";
  const selectedScale: string = "absolute";

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees/linechart.json");

  const showGwei = false;

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      if (!data) return;
      const { x, points } = this;

      if (!points || !x) return;

      // const series = points[0].series;

      const date = new Date(x);

      // const prefix = prefixes[series.name] ?? "";

      const dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeString = date.toLocaleTimeString(undefined, {
        timeZone: "UTC",
        hour: "numeric",
        minute: "numeric",
      });

      const tooltip = `
      <div class="mt-3 mr-3 mb-3 w-52 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString} ${timeString}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = 0;
      if (selectedScale !== "percentage")
        pointsSum = points.reduce((acc: number, point: any) => {
          acc += point.y;
          return pointsSum;
        }, 0);

      let num = 0;
      const tooltipData = points
        .sort((a: any, b: any) => b.y - a.y)
        .map((point: any) => {
          num = num += 1;

          const { series, y } = point;
          const { name } = series;

          const dataTypes = data.chain_data[name][seriesKey]["24hrs"].types;
          const metricKey = seriesKey;
          const label = AllChainsByKeys[name].label;

          let prefix = "";
          let suffix = "";
          let digits = 2;
          let value = y;

          if (dataTypes?.includes("value_usd") || dataTypes?.includes("usd")) {
            if (showUsd) {
              prefix = "$";
              suffix = "";
              digits = 3;
            } else {
              if (showGwei) {
                prefix = "";
                suffix = " Gwei";
                digits = 0;
              } else {
                prefix = "Ξ";
                suffix = "";
                digits = 4;
              }
            }
          }



          // if (series.name === item.chain_name) {
          return `
                <div class="flex w-full space-x-2 items-center font-medium mb-1">
                  <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme][0]
            }"></div>
            <div class="tooltip-point-name">${label}</div>
            <div class="flex-1 text-right justify-end font-inter flex">
          <div class="opacity-70 mr-0.5 ${!prefix && "hidden"}">${prefix}</div>
          ${parseFloat(value).toLocaleString(undefined, {
              minimumFractionDigits: digits,
              maximumFractionDigits: digits,
            })}
          <div class="opacity-70 ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
        </div>
                  </div>
                </div>`;
          // } else {
          //   return "";
          // }
        })
        .join("");

      return tooltip + tooltipData + tooltipEnd;
    },
    [data, seriesKey, showUsd, theme, showGwei],
  );

  const dataIndex = useMemo(() => {
    if (!data) return;

    // array of strings of the types of data available for the selected series
    const types = data.chain_data["optimism"][seriesKey][selectedTimeframe].types;

    if (types.includes("value_usd")) {
      return showUsd ? types.indexOf("value_usd") : types.indexOf("value_eth");
    } else {
      return 1;
    }
  }, [data, seriesKey, selectedTimeframe, showUsd]);


  const positioner = useCallback(function (this, width, height, point) {
    const chart = this.chart;
    const plotLeft = chart.plotLeft;
    const plotTop = chart.plotTop;
    const plotWidth = chart.plotWidth;
    const plotHeight = chart.plotHeight;
    const pointX = point.plotX;

    let x = 0;
    let y = 0;

    x = pointX + (pointX < plotWidth / 2 ? 30 : -260)

    if (point.plotY + height > plotHeight) {
      y = plotTop + plotHeight - height;
    } else {
      y = point.plotY + plotTop;
    }

    return { x: x, y: y };
  }, []);

  return (
    <div>

      <HighchartsProvider Highcharts={Highcharts}>
        <HighchartsChart plotOptions={plotOptions}>
          <Chart
            backgroundColor={"transparent"}
            type='line'
            height={176}
            panning={{
              enabled: true,
            }}
            panKey='shift'
            zooming={{
              type: undefined,
            }}
            style={{
              borderRadius: 15,
            }}
            animation={{
              duration: 50,
            }}
          // marginBottom={0}
          // marginLeft={0}
          // marginRight={0}
          // paddingTop={0}
          // paddingBottom={0}
          // spacing={[0, 0, 0, 0]}

          />
          <Tooltip
            useHTML={true}
            shared={true}
            split={false}
            followPointer={true}
            followTouchMove={true}

            backgroundColor={"#2A3433EE"}
            padding={0}
            hideDelay={300}
            stickOnContact={true}
            shape="rect"
            borderRadius={17}
            borderWidth={0}
            outside={true}
            shadow={{
              color: "#000000",
              opacity: 0.015,
              offsetX: 2,
              offsetY: 2,
            }}
            style={{
              color: "rgb(215, 223, 222))"
            }}

            formatter={tooltipFormatter}
            // ensure tooltip is always above the chart
            positioner={positioner}
            valuePrefix={showUsd ? "$" : ""}
            valueSuffix={showUsd ? "" : " Gwei"}
          />
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
              //     return `<span style="">${date.toLocaleDateString(undefined, {
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
            tickmarkPlacement='on'
            tickWidth={1}
            tickLength={20}
            ordinal={false}
            minorTicks={false}
            minorTickLength={2}
            minorTickWidth={2}
            minorGridLineWidth={0}
            minorTickInterval={1000 * 60 * 60 * 24 * 7}
          >
            {/* <XAxis.Title>Time</XAxis.Title> */}

          </XAxis>
          <YAxis
            opposite={false}
            showFirstLabel={true}
            showLastLabel={true}
            type="linear"
            gridLineWidth={1}
            gridLineColor={theme === "dark"
              ? "rgba(215, 223, 222, 0.11)"
              : "rgba(41, 51, 50, 0.11)"
            }
            labels={{
              align: "left",
              y: 11,
              x: 2,
              style: {
                gridLineColor:
                  theme === "dark"
                    ? "rgba(215, 223, 222, 0.33)"
                    : "rgba(41, 51, 50, 0.33)",
                fontSize: "10px",
              },
            }}
            min={0}

          >
            {data && Object.keys(data.chain_data).map((chainKey) => {
              if (data.chain_data[chainKey][seriesKey][selectedTimeframe])
                return (
                  <LineSeries
                    key={`${chainKey}-${seriesKey}-${selectedTimeframe}`}
                    name={chainKey}
                    data={data.chain_data[chainKey][seriesKey][selectedTimeframe].data.map((d: any) => [d[0], d[dataIndex]])}
                    color={AllChainsByKeys[chainKey].colors[0]}
                    lineWidth={1}
                    shadow={{
                      color: AllChainsByKeys[chainKey].colors[0],
                      offsetX: 0,
                      offsetY: 0,
                      opacity: 1,
                      width: 2
                    }}
                    states={{
                      hover: {


                      },
                    }}
                    marker={{
                      lineColor: "white",
                      radius: 0,
                      symbol: "circle",
                    }}
                  />)
            })}
          </YAxis>
        </HighchartsChart>
      </HighchartsProvider>
      {/* <div className='bg-white'>
        {data && <ReactJson src={data.chain_data["optimism"][seriesKey]["24hrs"].data} collapsed={true} />}
      </div> */}
    </div>
  );

}