import { AllChainsByKeys } from "@/lib/chains";
import { HighchartsChart, LineSeries, HighchartsSparkline, Tooltip, Chart, XAxis, YAxis } from "react-jsx-highcharts"
// import "../../highcharts.axis.css";
// height = 20,
// width = 120,
// margin = DEFAULT_MARGIN,
// style = EMPTY_OBJECT,
// series,
// children,
// plotOptions = defaultSparklinePlotOptions,
export default function Sparkline({ chainKey, data }) {
  const isNegative = data[0][1] > data[data.length - 1][1];
  return (
    <div className="w-[100px] h-[20px] relative">
      <HighchartsChart plotOptions={{
        series: {
          enableMouseTracking: false,
          states: {
            inactive: {
              opacity: 1
            }
          },
          events: {
            legendItemClick: function () {
              return false;
            }
          }
        },
        line: {
          lineWidth: 1,
          marker: {
            lineColor: "white",
            radius: 0,
            symbol: "circle",
          },
          // fillOpacity: 0,
          // fillColor: {
          //   linearGradient: {
          //     x1: 0,
          //     y1: 0,
          //     x2: 0,
          //     y2: 1,
          //   },
          //   stops: [
          //     [
          //       0,
          //       AllChainsByKeys[chainKey].colors["dark"][0] +
          //       "33",
          //     ],
          //     [
          //       1,
          //       AllChainsByKeys[chainKey].colors["dark"][1] +
          //       "33",
          //     ],
          //   ],
          // },
          color: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: isNegative ? 1 : 0,
              y2: 1,
            },
            stops: [
              [0, isNegative ? "#FE5468" : "#10808C"],
              [1, isNegative ? "#FFDF27" : "#1DF7EF"],
            ],
          },
        }
      }}>
        <Chart
          type="line"
          height={20}
          width={100}
          animation={false}
          // backgroundColor={null}
          margin={[0, 0, 0, 0]}
          spacingBottom={0}
          spacingTop={0}
          spacingLeft={0}
          spacingRight={0}


        />
        <Tooltip
          shape="rect"
          borderRadius={4}
          borderWidth={0}
          outside={true}
          shared={true}
          shadow={{
            color: "black",
            opacity: 0.015,
            offsetX: 2,
            offsetY: 2,
          }}
          style={{
            color: "rgb(215, 223, 222)",
          }}
          className="text-[12px] bg-[#1A1A1A] border-[#1A1A1A] shadow-md font-raleway"
          // outside
          // borderWidth={0}
          backgroundColor={"#1A1A1A"}
          // shadow={false}
          hideDelay={0}
          padding={4}
          headerFormat={``}
        // headerFormat={`<b>${chainKey}:</b> `}
        // pointFormat={'{point.y:,.0f}'}

        />
        <XAxis
          labels={{ enabled: false }}
          startOnTick={false}
          endOnTick={false}
          tickPositions={[]}
          min={data[0][0]}
          max={data[data.length - 1][0]}
        // crosshair={{ enabled: true }}
        />
        <YAxis
          labels={{ enabled: false }}
          startOnTick={false}
          endOnTick={false}
          tickPositions={[]}
        >
          <LineSeries
            id={chainKey}
            name={chainKey}
            data={data}
            // color={AllChainsByKeys[chainKey].colors["dark"][0]}
            animation={false}
          />
        </YAxis>
      </HighchartsChart>
    </div>
  );
}