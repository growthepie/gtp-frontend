// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const robinhoodStock: QuickBiteData = {
  title: "Robinhood Tokenized Stock Tracker",
  subtitle: "Tracking the adoption of Robinhood's tokenized stock on Arbitrum One",
  content: [

    "# Title1",
    "blablabla...",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Outstanding Tokenized Stock",
      subtitle: "test",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Total Tokenized Stock",
            color: "#00C805",
            xIndex: 1,
            yIndex: 0,
            suffix: null,
            prefix: '$',
            tooltipDecimals: 2,
            url: "https://api.growthepie.com/v1/quick-bites/robinhood_totals.json",
            pathToData: "data.total_market_value_sum.daily.values",
          }
        ],
      },
      height: 400,
      caption: "Outstanding tokenized stock USD value by Robinhood on Arbitrum One.",
    }),
    "```",

  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/timeboost.png",
  og_image: "",
  date: "2025-07-25",
  related: [],
  author: [{
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz",
  },
  {
    name: "ETH Wave",
    xUsername: "TrueWaveBreak"
  }],
  topics: [{
    icon: "gtp-metrics-economics",
    name: "Economics",
    url: "/economics"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default robinhoodStock;