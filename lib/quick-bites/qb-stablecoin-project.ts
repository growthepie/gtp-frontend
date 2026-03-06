import { QuickBiteData } from '@/lib/types/quickBites';

const StablecoinProject: QuickBiteData = {
  title: "Stablecoin Breakdown by Project",
  shortTitle: "Stablecoins",
  subtitle: "Analyzing the composition and trends of stablecoins across different projects.",
  content: [

    "```dropdown",
    JSON.stringify({
      label: "Select a Project",
      placeholder: "Choose a project...",
      searchable: true,
      stateKey: "selectedProject",
      defaultValue: "circlefin",
      allowEmpty: false,
      readFromJSON: true,
      jsonData: {
        url: "https://api.growthepie.com/v1/quick-bites/stablecoins/dropdown-projects.json",
        pathToOptions: "dropdown_values",
        valueField: "owner_project",
        labelField: "display_name"
      }
    }),
    "```",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Stablecoin Breakdown",
      subtitle: "Stacked circulating supply of top stablecoins.",
      showXAsDate: true,
      showZeroTooltip: false,
      showTotalTooltip: true,
      dataAsJson: {
        dynamicSeries: {
          url: "https://api.growthepie.com/v1/quick-bites/stablecoins/projects/{{selectedProject}}.json",
          pathToData: "data.timeseries.values",
          ystartIndex: 1,
          names: "data.symbols",
          colors: "data.colors",
          stacking: "normal",
          prefix: '$',
          xIndex: 0,
          tooltipDecimals: 2
        },
      },
      height: 500,
      caption: "Stacked area chart showing the circulating supply of top stablecoins for the selected project. Data is updated daily.",
    }),
    "```",

    "> Ethereum ecosystem only: We only track stablecoins within the Ethereum ecosystem. Supply on other L1s is not included, so totals will be lower than a project's full global market cap.",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/fusaka.png",
  og_image: "",
  date: "2026-03-06",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  }],
  topics: [
    {
      icon: "gtp-metrics-stablecoinmarketcap",
      name: "Stablecoin Supply",
      url: "/fundamentals/stablecoin-market-cap"
    },
  ],
  icon: "",
  showInMenu: false
};

export default StablecoinProject;
