// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const highlightsBlock = [
  "## Key Highlights",
  "- **Leading stablecoin payments chain:** One year after its migration to an Ethereum Layer 2, Celo has established itself as a leading blockchain for real-world stablecoin payments across **Africa, Asia, and Latin America**.",
  "- **Real user adoption at scale:** Celo now has nearly **14 million verified phone numbers** registered and consistently records more than **300,000 Daily Verified Active Addresses (DVAA)**.",
  "- **MiniPay is driving usage:** Opera's MiniPay wallet accounts for roughly **45% of all transactions** and **93% of all stablecoin flow** on Celo, helped by phone-number onboarding, stablecoin gas payments, and a payments-first mobile UX.",
  "- **Ecosystem momentum:** The past year brought major protocol deployments including **Uniswap v4, Velodrome, and Morpho**, alongside deeper ties to the broader Ethereum ecosystem.",
  "- **Emerging agentic-economy infrastructure:** Nearly **4,000 AI agents and autonomous services** are registered onchain under **ERC-8004**, with developers using Celo as a settlement layer for machine-to-machine services.",
];

const imageBlock = ["```image",
  JSON.stringify({
    src: "/quick-bites/celo-report_full.webp",
    alt: "Celo: 1 Year as Ethereum Layer 2",
    width: "400",
    height: "400",
    className: "w-3/5 lg:w-full mx-auto",
    caption: "Celo: 1 Year as Ethereum Layer 2",
  }),
  "```",
];


const highlightsAndImageBlock = ["```container",
  JSON.stringify({
    blocks: [highlightsBlock, imageBlock],
    className: "flex flex-col-reverse lg:gap-[45px] lg:grid lg:grid-cols-2 items-start",
  }),
  "```",
];

const downloadButtonBlock = [
  "```titleButton",
  JSON.stringify({
    text: "Download now",
    url: "https://api.growthepie.com/v1/quick-bites/celo-l2-anniversary/Celo L2 Anniversary.pdf",
  }),
  "```",
];

const celoAnniversaryReport: QuickBiteData = createQuickBite({
  title: "Celo: 1 Year as Ethereum Layer 2",
  subtitle: "This report celebrates the 1 year anniversary of Celo's transition to an Ethereum Layer 2.",
  shortTitle: "Report: Celo L2",
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
    "One year after completing its migration to an Ethereum Layer 2, Celo has established itself as one of the leading blockchains for real-world stablecoin payments in emerging markets across **Africa, Asia, and Latin America**. The past year has been marked by significantly higher user activity, major new protocol deployments including **Uniswap v4, Velodrome, and Morpho**, and deeper ties to the broader Ethereum ecosystem.",
    "The clearest evidence of Celo's progress is its user base. With nearly **14 million verified phone numbers** registered and consistently more than **300,000 Daily Verified Active Addresses (DVAA)**, activity on the network appears to be driven by real-world adoption. Much of this growth comes from **MiniPay**, Opera's stablecoin-first mobile wallet, which accounts for approximately **45% of all transactions** and **93% of all stablecoin flow** on Celo. At the same time, Celo is emerging as an early infrastructure chain for the **agentic economy**, with nearly **4,000 AI agents and autonomous services** registered onchain under **ERC-8004**. The same stablecoin rails built for human payments are now being inherited by autonomous agents.",
    ...highlightsAndImageBlock,
    "> (Download Full Report)[https://api.growthepie.com/v1/quick-bites/celo-l2-anniversary/Celo L2 Anniversary.pdf]",
  ],
  image: "/quick-bites/celo-report.webp",
  og_image: "/quick-bites/celo-report_full.png",
  date: "2026-03-24",
  related: [],
  author: [
    {
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz"
   },
  {
    name: "Matthias Seidl",
    xUsername: "web3_data"
  },
],
  topics: [{
    name: "Celo",
    url: "/chains/celo"
  }],
  icon: "celo-logo-monochrome"
});

export default celoAnniversaryReport;
