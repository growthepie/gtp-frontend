import { QuickBiteData } from '@/lib/types/quickBites';

const testBite: QuickBiteData = {
  title: "This is a Test Quick Bite",
  subtitle: "Trying out different types of blocks",
  content: [
    "# Main Header",
    "Some Text",

    "## Subheader",
    "Some more text",

    "## Callout Block",
    "> Callout Block.",
    
    "## A list of items",
    "- **List Item 1**: Blaaaah",
    "- **List Item 2**: blab baablb abalas",

    "## Dynamic Values in Text",
    "This next value is dynamic and bold: **{{timeboostTotalETH}} ETH**.",
    
    "## Embedded Chart Block",
    "```iframe",
    JSON.stringify({
      src: "https://www.growthepie.xyz/embed/fundamentals/daily-active-addresses?showUsd=true&theme=dark&timespan=90d&scale=absolute&interval=daily&showMainnet=false&chains=arbitrum%2Cbase%2Ccelo%2Cunichain&zoomed=false&startTimestamp=&endTimestamp=1745712000000",
      width: "100%",
      height: "500px",
      caption: "Daily active addresses comparison across Layer 2 solutions. Source: growthepie.xyz"
    }),
    "```",
    
    "## Line Chart with different line types",
    "```chart",
    JSON.stringify({
      type: "line",
      title: "Submitted Blobs per Block",
      subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Blob Count",
          color: "#FFC300",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_count.daily.values",
          dashStyle: "solid" 
        },
        {
          name: "Target",
          color: "#19D9D6",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_target.daily.values",
          dashStyle: "Dash" 
        }
        ],
      },
      height: 400,
      caption: "Ethereum Blob Count per Block vs Target. Data updated daily.",
      seeMetricURL: "https://www.growthepie.xyz/data-availability"
    }),
    "```",

    "## Column Chart",
    "```chart",
    JSON.stringify({
      type: "column",
      title: "Transactions that trigger smart wallet upgrades and downgrades",
      subtitle: "The number of Set Code transactions on EVM chains (aka Type 4 transactions)",
      stacking: "normal",
      showXAsDate: true,

      dataAsJson: {
        meta: [{
          name: "Ethereum",
          color: "#94ABD3",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.ethereum.daily.values",
        },
        {
          name: "Base",
          color: "#2151F5",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.base.daily.values",
        },
        {
          name: "OP Mainnet",
          color: "#FE5468",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.optimism.daily.values",
        },
        {
          name: "Unichain",
          color: "#FF47BB",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.unichain.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The number of Set Code transactions on EVM chains (aka Type 4 transactions). Data updated daily.",
    }),
    "```",

    "## Code Example",
    "Here's a sample code block showing how to use the QuickBiteData type:",

    "```typescript",
    "interface QuickBiteData {",
    "  title: string;",
    "  subtitle: string;",
    "  content: string[];",
    "  related: string[];",
    "  author: {",
    "    name: string;",
    "    xUsername: string;",
    "  }[];",
    "}",
    "```",

    "## Sample Image",
    "Here's an example of how to include an image in your quick bite:",

    "```image",
    JSON.stringify({
      src: "https://pbs.twimg.com/media/GFGqJLuWUAACKYj?format=jpg&name=4096x4096", // should allow link to our API
      alt: "Sample chart showing transaction volume over time",
      width: "800",
      height: "400",
      caption: "Transaction volume trends across major L2 networks. Source: growthepie.xyz",
    }),
    "```",

    "The improved developer experience has also attracted hundreds of new projects to the platform, creating a rich ecosystem of applications across DeFi, gaming, and social platforms."
  ],
  image: "/images/quick-bites/arbitrum-nitro.png",
  date: "2025-01-15",
  icon: "arbitrum-logo-monochrome",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  }],
  topics: [{
    icon: "base-logo-monochrome",
    color: "#2151F5",
    name: "Base",
    url: "/chains/base"
  }]
};

export default testBite; 