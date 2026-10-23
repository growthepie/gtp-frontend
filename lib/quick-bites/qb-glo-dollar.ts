import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

// Replaces the former /trackers/glodollar page (redirected here in next.config.js).
const GLO_DOLLAR_URL = "https://api.growthepie.com/v1/glo_dollar.json";

const gloDollar: QuickBiteData = createQuickBite({
  title: "Glo Dollar: The Stablecoin That Funds Public Goods",
  subtitle: "Tracking Glo Dollar's market cap and the wallets that hold it",
  shortTitle: "Glo Dollar",
  themes: ["stablecoins"],
  kind: "tracker",
  content: [
    "Glo Dollar is a fiat-backed stablecoin that funds public goods: by holding it, you help fund public goods and charitable causes, a donationless form of philanthropy. This tracker follows how much Glo Dollar is in circulation and who holds it.",

    "```kpi-cards",
    JSON.stringify([
      {
        title: "Market Cap",
        value: "{{glo_market_cap}}",
        description: "current",
        icon: "gtp-realtime",
        info: "Total value of Glo Dollar in circulation, in USD.",
      },
      {
        title: "Change (30d)",
        value: "{{glo_market_cap_change_30d}}",
        description: "last 30 days",
        icon: "gtp-realtime",
        info: "Change in Glo Dollar's market cap over the last 30 days.",
      },
      {
        title: "Largest Holder",
        value: "{{glo_top_holder_share}}",
        description: "of supply",
        icon: "gtp-realtime",
        info: "Share of all Glo Dollar held by the single largest wallet.",
      },
    ]),
    "```",

    "## Market cap over time",

    "```chart",
    JSON.stringify({
      type: "area",
      title: "Glo Dollar Market Cap",
      subtitle: "Total value of Glo Dollar in circulation (USD).",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Market Cap",
            color: "#24E5DF",
            stacking: "normal",
            type: "area",
            xIndex: 0,
            yIndex: 2,
            prefix: "$",
            tooltipDecimals: 0,
            url: GLO_DOLLAR_URL,
            pathToData: "chart.data",
          },
        ],
      },
      height: 400,
      caption: "Glo Dollar market cap in USD, daily. Source: Dune.",
    }),
    "```",

    "## Top holders",
    "The 30 largest Glo Dollar holders. Named holders link to their website and X account; the rest are shown by address.",

    "```table",
    JSON.stringify({
      readFromJSON: true,
      jsonData: {
        url: GLO_DOLLAR_URL,
        pathToRowData: "holders_table",
        // holders_table is an object keyed by holder name or address.
        recordKeyColumn: "holder",
      },
      columnDefinitions: {
        holder: {
          label: "Holder",
          type: "string",
          expand: true,
          minWidth: 220,
          isNumeric: false,
          sortByValue: true,
          copyable: true,
        },
        balance: {
          label: "Amount",
          type: "number",
          minWidth: 110,
          isNumeric: true,
          sortByValue: true,
          units: { usd: { prefix: "$", decimals: 0 } },
        },
        share: {
          label: "Share",
          type: "number",
          minWidth: 80,
          isNumeric: true,
          sortByValue: true,
          units: { percent: { suffix: "%", decimals: 1, multiplier: 100 } },
        },
        website: {
          label: "Website",
          type: "link",
          minWidth: 150,
          isNumeric: false,
          sortByValue: false,
        },
        twitter: {
          label: "X",
          type: "link",
          minWidth: 130,
          isNumeric: false,
          sortByValue: false,
        },
      },
      columnOrder: ["holder", "balance", "share", "website", "twitter"],
      columnSortBy: "value",
      rowBar: { valueColumn: "balance", color: "#24E5DF" },
      maxHeight: 520,
    }),
    "```",

    "> More about Glo Dollar on [glodollar.org](https://www.glodollar.org/).",

    "> This page is a data tracker for informational and educational purposes only. It is not investment advice. Data may be delayed or inaccurate. Do your own research.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/placeholder.png",
  // Dated to when the Glo Dollar tracker first went live (its data starts Jan 2024), so
  // it sorts as the oldest Quick Bite rather than the newest.
  date: "2024-02-01",
  related: [],
  author: [{
    name: "Glo Dollar Foundation",
    xUsername: "glodollar",
  }],
  topics: [
    {
      icon: "gtp-metrics-stablecoinmarketcap",
      name: "Stablecoin Supply",
      url: "/fundamentals/stablecoin-market-cap",
      wikipedia: "https://en.wikipedia.org/wiki/Stablecoin",
      wikidata: "https://www.wikidata.org/wiki/Q56241176",
    },
    {
      icon: "gtp-categories",
      name: "Public Goods",
      url: "",
    },
  ],
  icon: "glo-dollar-monochrome",
  showInMenu: true,
});

export default gloDollar;
