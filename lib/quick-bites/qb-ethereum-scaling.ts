// In your quick bite data file (e.g., lib/quick-bites/arbitrum-timeboost.ts)
import { QuickBiteData } from '@/lib/types/quickBites';


const MainKPIs= ["```kpi-cards",JSON.stringify(
      [
        {
          title: "Current TPS",
          value: "{{ethereumCurrentTPS}} TPS",
          description: "This Months Average",
          icon: "gtp-realtime",
          info: "Total number of transactions per second on Ethereum. Assuming 100,000 gas per transaction (average transaction size).",
        },
        {
          title: "Scaling Goal",
          value: "10,000 TPS",
          description: "To Be Reached by 2031",
          icon: "gtp-realtime",
          info: "The scaling targets as outlined by Justin Drake and Dankrad Feist.",
        },
        {
          title: "We Will Scale By",
          value: "{{ethereumMultiplier}} x",
          description: "To Reach 10k TPS",
          icon: "gtp-realtime",
          info: "The factor by which Ethereum needs to scale its current throughput to reach 10,000 TPS.",
        },
      ]
    ),
    "```",
  ];

const HistoricalScaling = ["```chart",
    JSON.stringify({
      type: "column",
      title: "Ethereum Mainnet: Historical TPS Growth",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Ethereum Mainnet",
            color: "#A3B8D9",
            xIndex: 0,
            yIndex: 1,
            suffix: ' TPS',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
            pathToData: "data.historical_tps.monthly.values",
          }
        ],
      },
      height: 400,
      caption: "Ethereum Mainnet scaled over {{ethereumHistoricalScale}}x in the past 10 years. This scaling speed will increase significantly.",
    }),
    "```",
];

const ProjectedScaling = ["```chart",
    JSON.stringify({
      type: "area",
      title: "Ethereum Mainnet: Projected TPS Growth at 3x Yearly Increase",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Ethereum Mainnet",
            color: "#A3B8D9",
            xIndex: 0,
            yIndex: 1,
            suffix: ' TPS',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
            pathToData: "data.projected_tps.monthly.values",
          }
        ],
      },
      yAxisLine: [{
        xValue: 		1806591485000, //position on x-axis
        annotationPositionY: 10, //pixel offset Y
        annotationPositionX: -50, //pixel offset X
        annotationText: "100 TPS, Apr 2027",
        lineStyle: "Dash", //Dash, Dot, Solid, DashDot, LongDash, LongDashDot
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        
        backgroundColor: "#19D9D6",

        lineWidth: 1,

      },
    {
        xValue: 		1872341885000, //position on x-axis
        annotationPositionY: 10, //pixel offset Y
        annotationPositionX: -60, //pixel offset X
        annotationText: "1,000 TPS, May 2029",
        lineStyle: "Dash", //Dash, Dot, Solid, DashDot, LongDash, LongDashDot
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        
        backgroundColor: "#19D9D6",

        lineWidth: 1,

      },
    {
        xValue: 		1938092285000, //position on x-axis
        annotationPositionY: 10, //pixel offset Y
        annotationPositionX: -65, //pixel offset X
        annotationText: "10,000 TPS, Jun 2031",
        lineStyle: "Dash", //Dash, Dot, Solid, DashDot, LongDash, LongDashDot
        lineColor: "#19D9D6",
        textColor: "#19D9D6",
        textFontSize: "9px",
        
        backgroundColor: "#19D9D6",

        lineWidth: 1,

      }],
      height: 400,
      caption: "Ethereum Mainnet aims to scale another 500x in the next 6 years.",
    }),
    "```",
];

const L2Scaling = ["```chart",
    JSON.stringify({
      type: "area",
      title: "Ethereum Ecosystem: 1 Million TPS, Here We Come",
      showXAsDate: true,
      dataAsJson: {
        meta: [
          {
            name: "Layer 2s Combined",
            color: "#FFDF27",
            xIndex: 0,
            yIndex: 1,
            suffix: ' TPS',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
            pathToData: "data.l2_projected_tps.monthly.values",
          },
          {
            name: "Ethereum Mainnet",
            color: "#A3B8D9",
            xIndex: 0,
            yIndex: 1,
            suffix: ' TPS',
            prefix: null,
            tooltipDecimals: 2,
            stacking: "normal",
            url: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/data.json",
            pathToData: "data.projected_tps.monthly.values",
          },
           
        ],
      },
      height: 400,
      caption: "Ethereum Mainnet aims to scale another 500x in the next 6 years.",
    }),
    "```",
];


const ethereumScaling: QuickBiteData = {
  title: "Scaling Ethereum Mainnet to 10,000 TPS",
  subtitle: "The Road to 1 Ggas/s on Layer 1 and 1 Tgas/s with Layer 2s",
  content: [

    "The World Ledger continues to scale. Ethereum Mainnet is set to scale to 10,000 transactions per second (TPS), equivalent to 1 gigagas per second in EVM gas, in the next 6 years.",

    ...MainKPIs,

    "# How far we've come",
    "Over the past decade, Ethereum Mainnet has steadily increased its throughput without sacrificing decentralization or security. It went through several key upgrades, each contributing to incremental improvements in efficiency and capacity. You can read more about these on our [Ecosystem](https://www.growthepie.com/ethereum-ecosystem/metrics) page.",
    "> From its inception in 2015 to today, Ethereum has scaled from a mere 0.71 TPS to over {{ethereumCurrentTPS}} TPS now, marking a more than {{ethereumHistoricalScale}}x increase in capacity.",
    ...HistoricalScaling,

    "# Where we are going",
    "After years of steady, incremental growth, Ethereum's scaling pace is about to accelerate. With future upgrades it is set to triple each year - turning today's {{ethereumCurrentTPS}} TPS into thousands by the end of the decade.",
    ...ProjectedScaling,

    "## How is Ethereum Mainnet going to scale?",
    "Ethereum's scaling strategy is multi-faceted, focusing on both Layer 1 improvements and Layer 2 solutions (more on horizontal scaling through Layer 2s further below).",
    "Key components of scaling Layer 1 include:",
    "- **EIP-7938**: Dankrad proposes a default exponential gas limit growth schedule, where Ethereum clients automatically vote to increase the block gas limit ~100x over 4 years, unless overridden. More [here](https://eips.ethereum.org/EIPS/eip-7938).",
    "- **Lean Ethereum**: Justin Drake's vision of Lean Ethereum is about reimagining all three core layers - consensus, data, and execution — using minimal, modular, post-quantum cryptography to enable “beast mode” performance (1 gigagas on L1, teragas on L2) through real-time zkVMs and data availability sampling (DAS).  ",
    "- **Many more EIPs**: There are numerous other EIPs in the pipeline that contribute to Ethereum's scaling journey, focusing on various aspects of performance, efficiency, and capacity. More (here)[https://docs.google.com/presentation/d/1vDkFlUXJ6S94hOGjMkeIO-SP3ZB4ysKPNgu1mskf1No/edit?slide=id.g36e7baa00a1_0_1116#slide=id.g36e7baa00a1_0_1116].",

     "```image",
    JSON.stringify({
      src: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/scaling-goals2.png", // should allow link to our API
      alt: "How Ethereum is Scaling",
      width: "800",
      height: "400",
      caption: "How Ethereum Mainnet is scaling to 10,000 TPS through a combination of EIP-7938, Lean Ethereum, and other upgrades.",
    }),
    "```",

    "The goal isn't just higher TPS - it's sustainable, decentralized scaling. Every upgrade compounds efficiency while keeping Ethereum secure and verifiable for everyone.",

    "# Horizontal Scaling through Layer 2s",
    "While Layer 1 scaling is crucial, Layer 2 solutions play an equally important role in Ethereum's overall scalability strategy. Layer 2s, such as Optimistic Rollups and zk-Rollups, handle transactions off the main Ethereum chain, significantly increasing throughput and reducing costs.",
    
    "Ethereum isn't just scaling execution it is also scaling it's data availability offering (Blobs) through data availability sampling and other ways.",
    "> These upgrades will allow rollups to post more data to Ethereum and scale to 1 million TPS, or 1 teragas per second.",

    ...L2Scaling,


    // "```image",
    // JSON.stringify({
    //   src: "https://api.growthepie.com/v1/quick-bites/ethereum-scaling/horizontal-scaling.png", // should allow link to our API
    //   alt: "Horizontal Scaling through Layer 2s",
    //   width: "800",
    //   height: "400",
    //   caption: "Layer 2s allow for horizontal scaling of Ethereum's transaction throughput.",
    // }),
    // "```",

    "# Conclusion",
    "Ethereum's journey to 10,000 TPS on Layer 1 and 1 million TPS with Layer 2s is a testament to its robust design and the vibrant ecosystem driving its evolution. Through a combination of strategic upgrades and innovative solutions, Ethereum is poised to meet the demands of a growing user base while maintaining its core principles of decentralization and security.",
    "As we look to the future, the continued collaboration within the Ethereum community will be key to realizing these ambitious scaling goals.",
    
    "**Assumptions**: 100,000 gas per transaction on Ethereum Mainnet, 3x yearly increase in throughput on L1, 4x yearly increase on L2s.",
    "**Disclaimer**: This quick bite is for informational purposes only and does not constitute financial advice. Always do your own research before making investment decisions. All of these scaling targets are ambitious and depend on many factors including successful implementation of the proposed upgrades, community consensus, and broader market conditions. There are no guarantees that these targets will be met.",
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/hyperliquid.png",
  og_image: "",
  date: "2025-10-17",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  }],
  topics: [
    {
    name: "Ethereum",
    url: "/chains/ethereum"
  },
  {
    icon: "gtp-metrics-transactioncount",
    name: "Transaction Count",
    url: "/fundamentals/transaction-count"
  },
  {
    icon: "gtp-metrics-throughput",
    name: "Transaction Throughput",
    url: "/fundamentals/throughput"
  },
],
  icon: "ethereum-logo-monochrome",
  showInMenu: true
};

export default ethereumScaling;
