import { QuickBiteData } from '@/lib/types/quickBites';

const polygonBurn: QuickBiteData = {
  title: "Polygon POL Burn Tracker",
  subtitle: "Tracking Polygon's EIP-1559 burn mechanism and the value of increased onchain activity",
  shortTitle: "Polygon POL Burn",
  content: [
    "> Work in Progress: This quick bite is preliminary and still under construction. KPI values are static snapshots and do not update automatically yet.",
    "# Introduction",
    "Polygon PoS adopted an EIP-1559-style fee mechanism that permanently burns a portion of every transaction fee. As onchain activity grows, gas throughput rises, and so does the rate at which POL is removed from the total supply forever.",
    "- **January 2022:** Polygon activated its EIP-1559 base-fee burn, removing MATIC (now POL) from every transaction.",
    "> How it works: every transaction on Polygon PoS includes a base fee that is burned rather than paid to validators. Higher network activity → higher gas throughput → more POL burned per second.",

    "# Burn Summary",
    "```kpi-cards", JSON.stringify([
      {
        title: "Total POL Burned",
        value: "114,366,447 POL",
        description: "since January 2022",
        icon: "gtp-realtime",
        info: "Cumulative amount of POL (formerly MATIC) permanently burned via the EIP-1559 base-fee mechanism since activation in January 2022.",
      },
      {
        title: "USD Value Burned",
        value: "$10.61M",
        description: "at $0.09281 per POL",
        icon: "gtp-metrics-onchainprofit",
        info: "USD value of the total POL burned, calculated at a fixed price of $0.09281 per POL.",
      },
      {
        title: " of Supply Burned",
        value: "1.08%",
        description: "of 10.62B total supply",
        icon: "gtp-metrics-chains-percentage",
        info: "Percentage of the total POL supply (10,616,892,534) that has been permanently removed from circulation via burning.",
      },
    ]),
    "```",

    "# Daily & Cumulative POL Burned",
    "Each bar represents the POL burned in a single day. The line tracks the running cumulative total, showing how sustained network usage steadily erodes the circulating supply over time.",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Daily & Cumulative POL Burned",
      subtitle: "Daily POL burned (bars) and cumulative total burned (line, right axis).",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Daily POL Burned",
            color: "#7B3FE4",
            type: "column",
            oppositeYAxis: false,
            xIndex: 0,
            yIndex: 1,
            suffix: " POL",
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/pol-burn/timeseries.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Cumulative POL Burned",
            color: "#FE5468",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 2,
            suffix: " POL",
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/pol-burn/timeseries.json",
            pathToData: "data.daily.values",
          },
        ],
      },
      height: 450,
      caption: "Daily POL burned via EIP-1559 base fees (left axis) and the running cumulative total (right axis).",
    }),
    "```",

    "# Network Throughput: Gas Per Second",
    "Gas per second measures how much computation the network processes daily. More activity means more transactions, higher base fees, and ultimately more POL burned. The chart below shows how the growth in Polygon's throughput directly drives the burn rate.",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Gas Throughput (Gas Per Second)",
      subtitle: "Daily average gas per second processed on Polygon PoS.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Gas Per Second",
            color: "#7B3FE4",
            type: "column",
            oppositeYAxis: false,
            xIndex: 0,
            yIndex: 3,
            suffix: " gas/s",
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/pol-burn/timeseries.json",
            pathToData: "data.daily.values",
          },
          {
            name: "Cumulative POL Burned",
            color: "#FE5468",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 2,
            suffix: " POL",
            prefix: null,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/pol-burn/timeseries.json",
            pathToData: "data.daily.values",
          },
        ],
      },
      height: 400,
      caption: "Daily gas throughput on Polygon PoS (left axis) vs. cumulative POL burned (right axis), showing how rising throughput drives the burn curve.",
    }),
    "```",

    "> Note: KPI values (total burned, USD value, % of supply) are calculated using static figures as of late March 2026 and a fixed POL price of $0.09281. They are not updated in real time.",
  ],
  image: "/quick-bites/polygon-burn.webp",
  og_image: "/quick-bites/polygon-burn.webp",
  date: "2026-03-30",
  related: [],
  author: [
    {
      name: "Lorenz Lehmann",
      xUsername: "LehmannLorenz",
    },
  ],
  topics: [
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics",
    },
    {
      name: "Polygon",
      url: "/chains/polygon",
    },
    {
      icon: "gtp-categories",
      name: "Token Burns",
      url: "",
    },
  ],
  icon: "polygon-logo-monochrome",
  showInMenu: false,
};

export default polygonBurn;
