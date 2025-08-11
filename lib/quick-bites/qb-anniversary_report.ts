// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';

const anniversaryReport: QuickBiteData = {
  title: "Building the World Ledger",
  subtitle: "This report celebrates the 10th anniversary of Ethereum, highlighting its evolution and impact.",
  content: [

    "By growthepie and Onchain Foundation. Written and published in August 2025.",
    "> (Download the Full Report)[https://api.growthepie.com/v1/quick-bites/anniversary-report/Building the World Ledger.pdf]",

    "# Executive Summary",
    "Since its inception in 2015, Ethereum has transitioned from a pioneering blockchain experiment to the dominant smart-contract platform underpinning an expansive digital economy. Over the past decade, Ethereum facilitated the creation of entirely new sectors, including decentralized finance (DeFi), NFTs, decentralized autonomous organizations (DAOs), and tokenized real-world assets (RWA), and established itself as a critical infrastructure layer for global financial activity. This decade of foundational work has now set the stage for the next wave of scaling and mass adoption and for Ethereum to become **“a really valuable part of global infrastructure that helps make the internet and the economy a more free and open place” (Vitalik Buterin)**.",

    "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/anniversary-report/cover-image.png",
      alt: "Building the World Ledger",
      width: "1920",
      height: "1073",
      caption: "Building the World Ledger",
    }),
    "```",

   '## Key Highlights',
    "- **Iterative progress:** Ethereum Mainnet sustained **uninterrupted operation through 16 major upgrades** over the past 10 years. These upgrades dramatically reduced the network's energy consumption, improved the network's economic sustainability by improving its issuance model, enabled parallel scaling through Layer 2s with sub-cent transaction costs, and set it up for further scaling improvements in the future.",
    "- **Economic significance:** The Ethereum ecosystem now secures **$154.2 billion in stablecoins** ($140B on Ethereum Mainnet, $14.2B on Layer 2s), reinforcing its role as the preferred ledger for onchain finance.",
    "- **Network maturity:** Cumulatively, Ethereum has executed over 2.9 billion transactions across 330 million addresses and generated over $20 billion in revenue through transaction fees. The broader Ethereum ecosystem (including Layer 2s) executed over 14 billion transactions.",
    "- **Innovation catalyst:** Ethereum’s programmable blockchain infrastructure has spawned markets and applications that did not exist five years ago, including zero-knowledge privacy solutions, AI-driven agents, and yield-bearing digital assets.",
    "- **Established companies are choosing Ethereum:** Robinhood, JP Morgan, Stripe, PayPal, BlackRock, Sony, Deutsche Bank, Shopify, eToro, and many more are building businesses and services on top of the Ethereum ecosystem.",

    "(Read More)[https://api.growthepie.com/v1/quick-bites/anniversary-report/Building the World Ledger.pdf]"
    
  ],
  image: "https://api.growthepie.com/v1/quick-bites/anniversary-report/cover-image.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/anniversary-report.png",
  date: "2025-08-12",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  },
  {
    name: "Leon Waidmann",
    xUsername: "LeonWaidmann"
  },
  {
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz"
  }],
  topics: [{
    name: "Ethereum Mainnet",
    url: "/chains/ethereum"
  }],
  icon: "arbitrum-logo-monochrome"
};

export default anniversaryReport;