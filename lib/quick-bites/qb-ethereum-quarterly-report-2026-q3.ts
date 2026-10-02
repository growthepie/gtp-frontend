import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const REPORT_URL = "https://api.growthepie.com/v1/quick-bites/qr-ethereum-2026-q3/growthepie_Ethereum_Mainnet_Q3_2026-7.pdf";

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
  "- **Activity held up better than fees:** Mainnet processed **199.3M transactions** in Q3 (-2.2% QoQ) with a daily average of **530.6K active addresses** (-0.6% QoQ), while network fees fell **33.6%** to **$35.1M**.",
  "- **Blockspace demand returned late in the quarter:** The average daily median transaction cost rose from **$0.017 in July** to **$0.061 in September** (+267%), and user-paid fees climbed from **$8.4M** to **$16.0M**.",
  "- **Stablecoin issuers lead mapped app activity:** **Tether** and **Circle** accounted for **41.3M transactions** to mapped contracts during **3 July–30 September 2026**, equal to **21.2%** of all Mainnet transactions and **57.3%** of mapped app transactions in that same 90-day window.",
  "- **Robinhood Chain launched with scale:** The Arbitrum Nitro-based Layer 2 went live on **1 July** and processed **793.7M transactions** in Q3, about **4x Mainnet**, ending the quarter with **$1.07B** in stablecoin supply.",
  "- **Steady throughput:** Gas throughput averaged **2.519 Mgas/s**, almost unchanged from Q2 (+0.1%), even as fee demand varied sharply.",
];

const imageBlock = [
  "```image",
  JSON.stringify({
    src: "https://api.growthepie.com/v1/quick-bites/qr-ethereum-2026-q3/eth2026q3.png",
    alt: "Ethereum Mainnet Quarterly Report: Q3 2026",
    width: "738",
    height: "466",
    className: "w-3/5 lg:w-full mx-auto",
    caption: "Ethereum Mainnet Quarterly Report: Q3 2026",
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

const ethereumQuarterlyReport2026Q3: QuickBiteData = createQuickBite({
  title: "Ethereum Mainnet Quarterly Report: Q3 2026",
  subtitle: "A data-led review of Ethereum Mainnet activity, its most active applications, and the cost of L1 blockspace from 01 July to 30 September 2026.",
  shortTitle: "Report: ETH Q3 2026",
  summary: "Ethereum Mainnet activity held steady in Q3 2026 while fees fell 33.6% QoQ, stablecoin issuers led app activity, and Robinhood Chain launched with 793.7M transactions.",
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
    "Ethereum Mainnet usage was resilient in Q3 2026. Total transactions and average daily active addresses were almost flat compared with Q2, and average gas throughput was almost unchanged at **2.519 Mgas/s** (+0.1% QoQ). Fee generation fell much further: users paid **$35.1M** in network fees (-33.6% QoQ), or **15,690 ETH** (-36.8% QoQ).",
    "Despite the quarter-on-quarter decline in fees, average daily median transaction costs and total user-paid fees rose sharply from July to September as transactions eased. This is consistent with stronger demand for scarce L1 blockspace. On the application side, **Tether** and **Circle** led Mainnet's ranking by transactions to mapped application contracts during **3 July–30 September 2026**, ahead of **Uniswap**, **Relay** and **Infinitism (ERC-4337)**. This 90-day window differs from the calendar quarter.",
    "At the edge of the ecosystem, **Robinhood Chain** launched on 1 July. Built on Arbitrum Nitro for financial services and tokenized real-world assets, it processed nearly four times as many transactions as Mainnet in its first quarter. The report points to **121 active apps** as of 30 September and sharply rising gas fees, totaling **$51.0M** in Q3, as evidence of economic activity following the launch.",
    ...highlightsAndImageBlock,
    "> (Download Full Report)[" + REPORT_URL + "]",
  ],
  // TODO: replace with a dedicated banner once the Q3 report artwork is available
  image: "/quick-bites/ethereum-scaling.webp",
  og_image: "/quick-bites/ethereum-scaling.webp",
  date: "2026-10-01",
  related: [],
  author: [
    {
      name: "Matthias Seidl",
      xUsername: "web3_data",
    },
  ],
  topics: [
    { name: "Ethereum", url: "/chains/ethereum" },
    { name: "Robinhood Chain", url: "/chains/robinhood" },
    { icon: "gtp-metrics-transactioncount", name: "Transaction Count", url: "/fundamentals/transaction-count" },
    { icon: "gtp-metrics-transactioncosts", name: "Transaction Costs", url: "/fundamentals/transaction-costs" },
  ],
  icon: "ethereum-logo-monochrome",
});

export default ethereumQuarterlyReport2026Q3;
