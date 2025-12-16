// In your quick bite data file (e.g., lib/quick-bites/linea-token-burn.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const Fusaka: QuickBiteData = {
  title: "Fusaka Upgrade Overview",
  subtitle: "Understanding the Fusaka upgrade.",
  content: [
    "# Introduction:",
    "The Fusaka fork continues Ethereum's blob scaling roadmap. Use the chart below to compare blob usage and fee pressure across recent upgrade windows.",

    "## Totals to Date",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Total Blobs",
        value: "{{fusaka_total_blobs}}",
        description: "since Dencun (128 KB each)",
        icon: "gtp-da-blobs-number",
        info: "Each blob can store up to 128 KB; cumulative blobs posted since Dencun.",
      },
      {
        title: "Blob Fees Paid",
        value: "{{fusaka_total_blob_fees_eth}} ETH",
        description: "cumulative blob base fees",
        icon: "gtp-realtime",
        info: "Total blob base fees paid across the tracked upgrade windows.",
      },
    ]),
    "```",

    "Select timeframe for the chart.",
    "```dropdown",
    JSON.stringify({
      label: "Timeframe",
      placeholder: "Choose since Fusaka, Pectra, Dencun or BPO1",
      searchable: true,
      stateKey: "selectedFusakaSeries",
      defaultValue: "Dencun",
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries/dropdown.json",
        pathToOptions: "dropdown_values",
        valueField: "label",
        labelField: "label",
      },
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Blob Usage & Fees Since {{selectedFusakaSeries}}",
      subtitle: "Average blobs per block vs target and blob fees in ETH.",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Avg blob count",
            color: "#FFC300",
            type: "line",
            xIndex: 0,
            yIndex: 1,
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries/{{selectedFusakaSeries}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Target blob count",
            color: "#19D9D6",
            type: "line",
            dashStyle: "Dash",
            xIndex: 0,
            yIndex: 5,
            tooltipDecimals: 0,
            url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries/{{selectedFusakaSeries}}.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Total blob fees",
            color: "#FE5468",
            type: "line",
            oppositeYAxis: true,
            xIndex: 0,
            yIndex: 4,
            tooltipDecimals: 4,
            suffix: " ETH",
            url: "https://api.growthepie.com/v1/quick-bites/fusaka/timeseries/{{selectedFusakaSeries}}.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 500,
      caption: "Data: growthepie.com quick-bite fusaka timeseries; target and fees update when you change the dropdown.",
    }),
    "```",

    "# EIP-7918",
    "EIP-7918 introduces a new blob fee path. Track how it impacts median blob gas fees on a log scale, and compare cumulative fees with/without the upgrade.",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Blob Fees",
        value: "{{fusaka_total_blob_fee_eth_with7918}} ETH",
        description: "since Pectra",
        icon: "gtp-realtime",
        info: "Total blob base fees paid under the 7918 blob fee path.",
      },
      {
        title: "Blob Fees without EIP-7918",
        value: "{{fusaka_total_blob_fee_eth_without7918}} ETH",
        description: "since Pectra",
        icon: "gtp-realtime",
        info: "Estimated blob base fees if 7918 were not active.",
      }
    ]),
    "```",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Median Blob Gas Fee",
      subtitle: "Comparing the new EIP-7918 excess blob gas calculation vs. the old blob gas path.",
      showXAsDate: true,
      options: {
        yAxis: [{ type: "logarithmic" }],
      },
      dataAsJson: {
        meta: [
          {
            name: "With EIP-7918",
            color: "#00c805",
            type: "line",
            xIndex: 0,
            yIndex: 1,
            suffix: " gwei",
            tooltipDecimals: 9,
            url: "https://api.growthepie.com/v1/quick-bites/fusaka/eip7918_timeseries.json",
            pathToData: "data.timeseries.values",
          },
          {
            name: "Without EIP-7918",
            color: "#FE5468",
            type: "line",
            dashStyle: "Dash",
            xIndex: 0,
            yIndex: 3,
            suffix: " gwei",
            tooltipDecimals: 9,
            url: "https://api.growthepie.com/v1/quick-bites/fusaka/eip7918_timeseries.json",
            pathToData: "data.timeseries.values",
          },
        ],
      },
      height: 420,
      caption: "Median blob base fee with (index 1) and without (index 3) EIP-7918; log y-axis.",
    }),
    "```",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice or a recommendation to buy or sell any security or token.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/fusaka.png",
  og_image: "",
  date: "2025-12-16",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  },
  {
    name: "ETH Wave",
    xUsername: "TrueWaveBreak"
  }],
  topics: [
    {
      icon: "gtp-metrics-economics",
      name: "Economics",
      url: "/economics"
    },
  ],
  icon: "",
  showInMenu: false
};

export default Fusaka;
