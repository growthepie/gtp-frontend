"use client";
import Highcharts, { chart } from "highcharts";
import highchartsXrange from "highcharts/modules/xrange";
import highchartsSankey from "highcharts/modules/sankey";
import { useCallback, useEffect } from "react";
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
  VariwideSeries,
  XRangeSeries,
  SankeySeries,
} from "react-jsx-highcharts";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

var data = [
  {
    "epoch": 1,
    "toTs": "1697731200",
    "fromTs": "1691510400",
    "decisionWindow": "1209600",
    "info": {
      "stakingProceeds": "412042049081445321216",
      "totalEffectiveDeposit": "94755727584613854218098688",
      "totalRewards": "329633639265156268032",
      "vanillaIndividualRewards": "101469205666663117330",
      "operationalCost": "82408409816289053184",
      "totalWithdrawals": "320096281600650694595",
      "patronsRewards": "16050223937523865304",
      "matchedRewards": "244214657536017016006",
      "leftover": "9537357664505573437",
      "ppf": null,
      "communityFund": null
    }
  },
  {
    "epoch": 2,
    "toTs": "1705507200",
    "fromTs": "1697731200",
    "decisionWindow": "1209600",
    "info": {
      "stakingProceeds": "966657119479408821563",
      "totalEffectiveDeposit": "143000608744890669292589348",
      "totalRewards": "365545462174813064230",
      "vanillaIndividualRewards": "138232556533137973669",
      "operationalCost": "241664279869852205390",
      "totalWithdrawals": "365233091278490434580",
      "patronsRewards": "8695859401745522",
      "matchedRewards": "227321601501076836083",
      "leftover": "359759748331066181593",
      "ppf": null,
      "communityFund": null
    }

  },
  {
    "epoch": 3,
    "toTs": "1713283200",
    "fromTs": "1705507200",
    "decisionWindow": "1209600",
    "info": {
      "stakingProceeds": "959848624830407629247",
      "totalEffectiveDeposit": "152790615666562307080359072",
      "totalRewards": "671894037381285340472",
      "vanillaIndividualRewards": "146655862334541166188",
      "operationalCost": "239962156207601907311",
      "totalWithdrawals": "573393994156646120813",
      "patronsRewards": "25889892012297588",
      "matchedRewards": "335972908582654967824",
      "leftover": "3854465046588467390",
      "ppf": "189291156356101504048",
      "communityFund": "47992431241520381462"
    }
  },
  {
    "epoch": 4,
    "toTs": "1721059200",
    "fromTs": "1713283200",
    "decisionWindow": "1209600",
    "info": {
      "stakingProceeds": "850133917361881760113",
      "totalEffectiveDeposit": "155200359957012122820085802",
      "totalRewards": "595093742153317232079",
      "vanillaIndividualRewards": "131941089986228847020",
      "operationalCost": "212533479340470440028",
      "totalWithdrawals": null,
      "patronsRewards": "25348317168816085",
      "matchedRewards": "297572219393827432124",
      "leftover": "191810598168683746956",
      "ppf": "165605781090429769019",
      "communityFund": "42506695868094088005"
    }
  },
  {
    "epoch": 5,
    "toTs": "1728835200",
    "fromTs": "1721059200",
    "decisionWindow": "1209600",
    "info": {
      "stakingProceeds": "936986301369862848512",
      "totalEffectiveDeposit": "156492756054822350065702805",
      "totalRewards": "655890410958903993958",
      "vanillaIndividualRewards": "146631568686984203526",
      "operationalCost": "234246575342465712128",
      "totalWithdrawals": null,
      "patronsRewards": null,
      "matchedRewards": null,
      "leftover": null,
      "ppf": "181313636792467793453",
      "communityFund": "46849315068493142425"
    }
  }
]




export const EpochChart = () => {
  useEffect(() => {
    highchartsXrange(Highcharts);
    highchartsSankey(Highcharts);
  }, []);

  // const d: Highcharts.XrangePointOptionsObject[] = data.map((d) => ({
  //   x: parseInt(d.fromTs) * 1000,
  //   x2: parseInt(d.toTs) * 1000,
  //   y: 0,
  // }));

  const d: Highcharts.PointOptionsObject[] = data.map((d) => [
    [
      parseInt(d.fromTs) * 1000,
      0,
      "#FF0000",
    ],
    [
      parseInt(d.fromTs) * 1000,
      parseInt(d.info.operationalCost) / 10 ** 18,
      "#FF0000",
    ],
    [
      (parseInt(d.toTs)) * 1000,
      parseInt(d.info.operationalCost) / 10 ** 18,
      "#FF0000",
    ],
    [
      (parseInt(d.toTs)) * 1000,
      0,
      "#FF0000",
    ]]).flat()

  const getRandomColorFromString = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const seriesData = useCallback((metric) => {
    return data.map((d, i) => ([
      [(parseInt(d.fromTs) + 10000) * 1000, parseInt(d.info[metric]) / 10 ** 18],
      [(parseInt(d.fromTs) + (parseInt(d.toTs) - parseInt(d.fromTs)) / 2) * 1000, parseInt(d.info[metric]) / 10 ** 18],
      [(parseInt(d.toTs) - 10000) * 1000, parseInt(d.info[metric]) / 10 ** 18],
    ]))
  }
    , [])
  const metrics = [
    "stakingProceeds",
    "totalEffectiveDeposit",
    "totalRewards",
    "vanillaIndividualRewards",
    "operationalCost",
    "totalWithdrawals",
    "patronsRewards",
    "matchedRewards",
    "leftover",
    "ppf",
    "communityFund",
  ]
  return (
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart type="sankey">
        <Chart inverted={false} />
        <XAxis >

        </XAxis>
        <YAxis >
          <SankeySeries
            // nodes={[
            //   {
            //     id: "stakingProceeds",
            //     color: getRandomColorFromString("stakingProceeds")
            //   },
            //   {
            //     id: "totalEffectiveDeposit",
            //     color: getRandomColorFromString("totalEffectiveDeposit")
            //   },
            //   {
            //     id: "totalRewards",
            //     color: getRandomColorFromString("totalRewards")
            //   },
            //   {
            //     id: "vanillaIndividualRewards",
            //     color: getRandomColorFromString("vanillaIndividualRewards")
            //   },
            //   {
            //     id: "operationalCost",
            //     color: getRandomColorFromString("operationalCost")
            //   },
            //   {
            //     id: "totalWithdrawals",
            //     color: getRandomColorFromString("totalWithdrawals")
            //   },
            //   {
            //     id: "patronsRewards",
            //     color: getRandomColorFromString("patronsRewards")
            //   },
            //   {
            //     id: "matchedRewards",
            //     color: getRandomColorFromString("matchedRewards")
            //   },
            //   {
            //     id: "leftover",
            //     color: getRandomColorFromString("leftover")
            //   },
            //   {
            //     id: "ppf",
            //     color: getRandomColorFromString("ppf")
            //   },
            //   {
            //     id: "communityFund",
            //     color: getRandomColorFromString("communityFund")
            //   }
            // ]}
            data={[
              ['stakingProceeds', "operationalCost", parseInt(data[2].info.operationalCost) / 10 ** 18],
              ['stakingProceeds', "communityFund", parseInt(data[2].info.communityFund || "0") / 10 ** 18],
              ['stakingProceeds', "totalRewards", parseInt(data[2].info.totalRewards || "0") / 10 ** 18],
              ['totalRewards', "matchedRewards", parseInt(data[2].info.matchedRewards || "0") / 10 ** 18],
              ['totalRewards', "ppf", parseInt(data[2].info.ppf || "0") / 10 ** 18],
              ['totalRewards', "vanillaIndividualRewards", parseInt(data[2].info.vanillaIndividualRewards || "0") / 10 ** 18],
              ['totalRewards', "patronsRewards", parseInt(data[2].info.patronsRewards || "0") / 10 ** 18],
              ['totalRewards', "leftover", parseInt(data[2].info.leftover || "0") / 10 ** 18],
            ]} keys={['from', 'to', 'weight']}
          />
        </YAxis>
      </HighchartsChart>
      {metrics.map(metric => (
        <HighchartsChart key={metric} chart={{

          animation: true,
          height: 150,
          backgroundColor: "transparent",
          plotBorderColor: "transparent",
          showAxes: false,
          panning: { enabled: false },
          panKey: "shift",
          zooming: {
            mouseWheel: {
              enabled: false,
            },
            resetButton: {
              theme: {
                zIndex: -10,
                fill: "transparent",
                stroke: "transparent",
                style: {
                  color: "transparent",
                  height: 0,
                  width: 0,
                },
                states: {
                  hover: {
                    fill: "transparent",
                    stroke: "transparent",
                    style: {
                      color: "transparent",
                      height: 0,
                      width: 0,
                    },
                  },
                },
              },
            },
          },
        }} plotOptions={{
          area: {
            lineWidth: 0,
            lineColor: "transparent",
            // zoneAxis: 'x',
            // zones:
            //   [
            //     {
            //       value: 0,
            //       color: getRandomColorFromString("0")
            //     },
            //     ...data.map((d) => ({
            //       value: parseInt(d.fromTs) * 1000,
            //       color: getRandomColorFromString(d.info.totalRewards)
            //     }))
            //   ]
          },
          series: {
            stacking: undefined,
            events: {
              legendItemClick: function () {
                return false;
              },
            },
            marker: {
              // lineColor: "white",
              radius: 0,
              // symbol: "circle",
            },
            states: {
              hover: {
                enabled: false
              }
            },
            shadow: false,
            animation: false,
          },
        }}>
          <Chart />

          {/* <Legend layout="vertical" align="right" verticalAlign="middle" /> */}
          <Tooltip
            useHTML={true}
            // shared={true}
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
              color: "black",
              opacity: 0.015,
              offsetX: 2,
              offsetY: 2,
            }}
            style={{
              color: "rgb(215, 223, 222)"
            }}

            // formatter={tooltipFormatter}
            // // ensure tooltip is always above the chart
            // positioner={tooltipPositioner}
            valuePrefix={"Ξ"}
            valueSuffix={""}
          />

          <XAxis title={undefined}
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
              formatter: (item) => {
                const date = new Date(item.value);
                const isMonthStart = date.getDate() === 1;
                const isYearStart = isMonthStart && date.getMonth() === 0;
                if (isYearStart) {
                  return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                } else {
                  return `<span style="">${date.toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}</span>`;
                }
              },
            }}
            crosshair={{
              width: 0.5,
              color: COLORS.PLOT_LINE,
              snap: false,

            }}
            tickPositions={[...data.map((d) => parseInt(d.fromTs) * 1000), parseInt(data[data.length - 1].toTs) * 1000]}
            tickmarkPlacement='on'
            tickWidth={1}
            tickLength={20}
            ordinal={false}
            minorTicks={false}
            minorTickLength={2}
            minorTickWidth={2}
            minorGridLineWidth={0}

          >
          </XAxis>

          <YAxis opposite={false}
            // showFirstLabel={true}
            // showLastLabel={true}
            type="linear"
            gridLineWidth={1}
            gridLineColor={"#5A64624D"
            }
            showFirstLabel={false}
            showLastLabel={false}
            labels={{
              align: "left",
              y: 11,
              x: 3,
              style: {
                fontSize: "10px",
                color: "#CDD8D34D",
              },

            }}
            min={0}>

            {d.map((d, i) => (
              <AreaSeries key={i} data={seriesData(metric)[i]} />
            ))}
          </YAxis>
        </HighchartsChart>))}
    </HighchartsProvider>

  )
}
