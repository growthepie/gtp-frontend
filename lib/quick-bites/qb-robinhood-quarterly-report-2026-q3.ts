import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const ASSET_BASE_URL = "https://api.growthepie.com/v1/quick-bites/qr-robinhood-2026-q3";
const REPORT_URL = `${ASSET_BASE_URL}/growthepie_Robinhood_Chain_Q3_2026.pdf`;

const downloadButtonBlock = [
  "```titleButton",
  JSON.stringify({
    text: "Download now",
    url: REPORT_URL,
  }),
  "```",
];

const highlightsBlock = [
  "## Key Highlights",
  "- **Fast ramp-up:** Robinhood Chain processed **793.7M transactions** in its launch quarter. September averaged **9.49M transactions a day**, 56% above July, and daily active addresses averaged **402.7K**.",
  "- **Uniswap leads a broad app mix:** **Uniswap** accounted for **115.8M transactions** (14.6% of the chain total), ahead of **StonkPit**, **Relay**, **Infinitism (ERC-4337)** and **OpenSea**.",
  "- **Twelve days, three quarters of fees:** Between **30 Aug and 10 Sep**, users paid **$37.8M** in fees, **74%** of the quarter's **$51.0M** total. The median transaction cost peaked at **$0.248** on 4 Sep.",
  "- **Capital kept arriving:** Stablecoin supply grew **10.4x** to **$1.07B**, and total value secured reached **$2.76B** by 30 September.",
];

const imageBlock = [
  "```image",
  JSON.stringify({
    src: `${ASSET_BASE_URL}/qb-robinhood-2026-q3-preview.png`,
    alt: "Robinhood Chain Quarterly Report: Q3 2026",
    width: "943",
    height: "614",
    className: "w-3/5 lg:w-full mx-auto",
    caption: "Robinhood Chain Quarterly Report: Q3 2026",
  }),
  "```",
];

const highlightsAndImageBlock = [
  "```container",
  JSON.stringify({
    blocks: [highlightsBlock, imageBlock],
    className: "flex flex-col-reverse lg:gap-[45px] lg:grid lg:grid-cols-2 items-start",
  }),
  "```",
];

const robinhoodQuarterlyReport2026Q3: QuickBiteData = createQuickBite({
  title: "Robinhood Chain Quarterly Report: Q3 2026",
  subtitle: "A data-led review of Robinhood Chain's first quarter after its public mainnet launch, from 01 July to 30 September 2026.",
  shortTitle: "Report: HOOD Q3 2026",
  summary: "Robinhood Chain processed 793.7M transactions in its launch quarter, Uniswap led app activity, and a 12-day surge generated 74% of the quarter's fees.",
  showInMenu: true,
  content: [
    "```container",
    JSON.stringify({
      blocks: [
        ["# Executive Summary"],
        [...downloadButtonBlock],
      ],
      className: "w-full flex flex-col items-start md:flex-row md:justify-between md:items-center",
    }),
    "```",
    "Robinhood Chain, an Arbitrum Orbit rollup for financial services and tokenized real-world assets, launched its public mainnet on **1 July 2026**. Activity scaled within weeks: the chain passed its first 10M-transaction day on 4 August and processed **793.7M transactions** over the quarter. Users paid **$51.0M** in network fees, while apps on the chain generated **$591.4M** in revenue.",
    "Fees were heavily concentrated. A 12-day surge from **30 August to 10 September** pushed median costs to 31x their pre-surge average and accounted for **74%** of the quarter's fees, with **Relay** the largest tracked fee payer. Meanwhile, capital kept arriving: stablecoin supply rose from **$102.3M** at launch to **$1.07B**, passing $1B on 7 September.",
    ...highlightsAndImageBlock,
    "> (Download Full Report)[" + REPORT_URL + "]",
  ],
  image: `${ASSET_BASE_URL}/qb-robinhood-2026-q3.png`,
  og_image: `${ASSET_BASE_URL}/qb-robinhood-2026-q3.png`,
  date: "2026-10-09",
  related: [],
  author: [
    {
      name: "Matthias Seidl",
      xUsername: "web3_data",
    },
  ],
  topics: [
    { name: "Robinhood Chain", url: "/chains/robinhood" },
    { icon: "gtp-metrics-transactioncount", name: "Transaction Count", url: "/fundamentals/transaction-count" },
    { icon: "gtp-metrics-feespaidbyusers", name: "Fees Paid by Users", url: "/fundamentals/fees-paid-by-users" },
    { icon: "gtp-metrics-stablecoinmarketcap", name: "Stablecoin Supply", url: "/fundamentals/stablecoin-market-cap" },
  ],
  icon: "arbitrum-logo-monochrome",
});

export default robinhoodQuarterlyReport2026Q3;
