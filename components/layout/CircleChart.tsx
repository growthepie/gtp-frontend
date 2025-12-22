"use client";
import React, { useCallback, useEffect } from 'react';
import Highcharts from "highcharts/highstock";
import { Chart, HighchartsChart, HighchartsProvider, PieSeries, Tooltip } from 'react-jsx-highcharts';
import "@/app/highcharts.axis.css";

export type CircleChartProps = {
  title?: string | string[];
  data: {
    label: string;
    value: number;
    className?: string;
  }[];
  size?: number;
  strokeWidth?: number;
  // colors: (string | Highcharts.GradientColorObject | Highcharts.PatternObject)[];
  valuePrefix?: string;
};

export const CircleChart = ({ title, data, valuePrefix = "", size = 250, strokeWidth = 15 }: CircleChartProps) => {


  // useEffect(() => {

  //   // Set the colors for the chart
  //   if (colors)
  //     Highcharts.setOptions({
  //       colors: colors,
  //     });

  // }, []);

  // useEffect(() => {

  //   // Set the colors for the chart
  //   if (colors)
  //     Highcharts.setOptions({
  //       colors: colors,
  //     });

  // }, [colors]);

  const titleRef = React.useRef<Highcharts.SVGElement | null>(null);

  function alignTitle() {
    if (!title)
      return;
    const chart: Highcharts.Chart = this;


    // const existingTitle = chart

    if (titleRef.current) {
      titleRef.current.destroy();
    }

    const newX = chart.plotWidth / 2 + chart.plotLeft;
    const newY = chart.plotHeight / 2 + chart.plotTop - 4;



    if (Array.isArray(title)) {
      titleRef.current = chart.renderer.g().add();
      let y = newY - 10 * title.length;
      title.forEach((t, i) => {
        if (titleRef.current)
          chart.renderer.text(t, newX, y += 20)
            .attr({
              dominantBaseline: 'middle',
              textAnchor: 'middle',
              verticalAlign: 'middle',
              align: 'center',
              id: 'chart-title',
              class: 'highcharts-title',
            })
            .css({
              color: "#CDD8D3",
              fontSize: '12px',
              fontWeight: 'bold',
              // fontFamily: 'var(--font-raleway), sans-serif !important',
            }).add(titleRef.current);
      });
    }
    else {
      titleRef.current = chart.renderer.text(title, newX, newY + 8)
        .attr({

          dominantBaseline: 'middle',
          textAnchor: 'middle',
          verticalAlign: 'middle',
          align: 'center',
          id: 'chart-title',
          class: 'highcharts-title',
        })
        .css({
          color: "#CDD8D3",
          fontSize: '12px',
          fontWeight: 'bold',
        }).add();
    }

  }


  // const valuePrefix = "Ξ";
  // const valueSuffix = "Ξ";

  // find largest slice and put that first, otherwise keep the order of the data
  const largest = [...data].sort((a, b) => b.value - a.value)[0];
  const sortedData = [largest, ...data.filter((d) => d !== largest)];


  // Calculate the angle offset to center the largest slice
  const percentageLargest = sortedData[0].value / sortedData.reduce((acc, d) => acc + d.value, 0);
  const percentageLeft = 1 - percentageLargest;
  const percentageLeftDegrees = percentageLeft * 360;
  const angleOffset = percentageLeftDegrees / 2;

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      const { point, series } = this;
      // const date = new Date(x);
      // let dateString = date.toLocaleDateString("en-GB", {
      //   month: "short",
      //   day: "numeric",
      //   year: "numeric",
      // });

      // // check if data steps are less than 1 day
      // // if so, add the time to the tooltip
      // const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      // if (timeDiff < 1000 * 60 * 60 * 24) {
      //   dateString +=
      //     " " +
      //     date.toLocaleTimeString("en-GB", {
      //       hour: "numeric",
      //       minute: "2-digit",
      //     });
      // }

      const tooltip = `<div class="mt-3 mr-3 mb-3 text-xs font-raleway text-color-text-primary">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-8 mb-2 ">${""}</div>`;
      const tooltipEnd = `</div>`;

      const tooltipPoints = [point]
        .sort((a: any, b: any) => {


          return b.y - a.y;
        })
        .map((point: any) => {
          const { series, y, percentage, color } = point;
          // const { name } = series;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;
          let displayValue = y;
          // let color = colors ? colors[point.index] : point.color;

          const svgLegend = `
          <svg width="16" height="6">
            <rect width="16" height="6" class="${point.className}" />
          </svg>
          `;

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full">${svgLegend}</div>
            
            <div class="tooltip-point-name text-md">${point.name}</div>
            <div class="flex-1 text-right font-inter flex">
                <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
            }">${prefix}</div>
                ${parseFloat(displayValue).toLocaleString("en-GB", {
              minimumFractionDigits: valuePrefix ? 2 : 0,
              maximumFractionDigits: valuePrefix ? 2 : 0,
            })}
                <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          `;
        })
        .join("");



      return tooltip + tooltipPoints + tooltipEnd;
    },
    [valuePrefix],
  );

  return (
    <>
      {/* {percentageLargest} ||
      {percentageLeft} ||
      {percentageLeftDegrees} || {angleOffset} */}
      <HighchartsProvider Highcharts={Highcharts}>
        <HighchartsChart
          containerProps={{
            style: {
              height: "100%",
              // margin: [0, 0, 0, 0],
              // padding: [0, 0, 0, 0],
              width: undefined,
              overflow: "visible",
            },
          }}

          plotOptions={{
            pie: {
              borderRadius: 0,
              dataLabels: {
                // useHTML: true,
                // position: ""
                // staggerLines: 1,
                // alignTo: "plotEdges",
                position: "center",

                overflow: "justify",
                enabled: true,
                connectorWidth: 0,
                distance: -size / 7,
                style: {
                  fontSize: "9px",
                  fontWeight: "semibold",
                  color: "rgb(215, 223, 222)",
                  textOutline: "0px contrast",
                  textAlign: "center",
                  dominantBaseline: "middle",
                },
              },
              allowPointSelect: false,

            }
          }}
        >
          <Chart

            events={
              {
                load: alignTitle,
                redraw: alignTitle,
              }
            }
            margin={[0, 0, 0, 0]}
            padding={[0, 0, 0, 0]}
            width={size + 50}
            height={size + 50}
            title={undefined}
            backgroundColor={"transparent"}
            type="area"
            panning={{
              enabled: false,
            }}
            panKey="shift"
            zooming={{
              type: undefined,
            }}
            style={{
              borderRadius: 15,
            }}
            animation={{
              duration: 50,
            }}
          // marginBottom={38}
          // marginLeft={30}
          // marginRight={0}
          // marginTop={4}

          />
          <Tooltip
            useHTML={true}
            shared={true}
            split={false}
            followPointer={true}
            followTouchMove={true}
            backgroundColor={"rgb(var(--bg-default))"}
            padding={0}
            hideDelay={300}
            stickOnContact={true}
            shape="rect"
            borderRadius={17}
            borderWidth={0}
            outside={true}
            shadow={{
              color: "black",
              opacity: 0.015,
              offsetX: 2,
              offsetY: 2,
            }}
            style={{
              color: "rgb(215, 223, 222)",
            }}
            formatter={tooltipFormatter}
            // ensure tooltip is always above the chart
            // positioner={tooltipPositioner}
            valuePrefix={"$"}
            valueSuffix={""}
          />
          {/* {data.map((d) => (
          <PieSeries
            key={d.label}
            name={d.label}
            innerSize={size - strokeWidth}
            borderWidth={0}
            fillColor={d.color}
            data={{ y: d.value }}
          ></PieSeries>
        ))} */}
          <PieSeries
            name={""}
            size={size}
            showInLegend={false}
            innerSize={((1 - ((strokeWidth + 3) / size)) * 100) + "%"}
            borderWidth={2}
            borderColor={"rgb(21, 26, 25)"}
            startAngle={180 + angleOffset}
            endAngle={180 - angleOffset}


            data={sortedData.map((d) => ({
              name: d.label,
              y: d.value,
              className: d.className,
              // sliced: true,
              // color: d.color,
              // gradientForSides: true,
              // gradientForSides: true,
            }))}
          ></PieSeries>
        </HighchartsChart>
      </HighchartsProvider>
    </>
  );
};

export default CircleChart;