const hardcodedMetadataArray = [
  {
    "Path": "/",
    "Title Template": "growthepie – Ethereum Ecosystem Analytics",
    "Description Template": "Comprehensive data and insights across Ethereum Layer 1 and Layer 2 networks. Visualize usage, economics, and growth of the entire Ethereum ecosystem.",
    "Status": "Published"
  },
  {
    "Path": "/applications",
    "Title Template": "Ethereum Applications Dashboard | growthepie",
    "Description Template": "Track the top applications across Ethereum L1 and L2s. See app metrics such as transaction count, active addresses and fees paid.",
    "Status": "Published"
  },
  {
    "Path": "/contributors",
    "Title Template": "growthepie Contributors | Ethereum Ecosystem Builders",
    "Description Template": "Get to know growthepie's contributors and team members.",
    "Status": "Published"
  },
  {
    "Path": "/economics",
    "Title Template": "Ethereum Onchain Economics Dashboard | growthepie",
    "Description Template": "Explore fees, profit, and economic activity across Ethereum Layer 1 and 2s. Understand protocol health with core metrics.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability",
    "Title Template": "Data Availability Layer Comparison | Ethereum Rollups",
    "Description Template": "Compare Ethereum rollups and their data availability solutions like Celestia, looking at DA consumers cost, blob data posted, and blob count.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/daily-active-addresses",
    "Title Template": "Daily Active Addresses | growthepie",
    "Description Template": "Track daily active addresses across Ethereum L1 and major L2s to measure user engagement and growth.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/fees-paid-by-users",
    "Title Template": "Fees Paid by Users | growthepie",
    "Description Template": "Compare transaction fees paid by users across Ethereum and its L2s over time.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/fully-diluted-valuation",
    "Title Template": "Fully Diluted Valuation (FDV) | growthepie",
    "Description Template": "Analyze the FDV of Ethereum-based tokens and how value is distributed across ecosystems.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/market-cap",
    "Title Template": "Market Capitalization Overview | growthepie",
    "Description Template": "Explore the market cap of Ethereum and L2-native tokens with historical views and daily aggregations.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/profit",
    "Title Template": "Protocol Profitability | growthepie",
    "Description Template": "Compare revenue vs. costs to evaluate profitability across Ethereum L1 and Layer 2s.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/rent-paid",
    "Title Template": "Rent Paid to Ethereum | growthepie",
    "Description Template": "View rent paid by rollups to Ethereum Mainnet for security and data availability.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/stablecoin-market-cap",
    "Title Template": "Stablecoin Supply | growthepie",
    "Description Template": "Analyze the distribution and growth of stablecoins across Ethereum and its scaling layers.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/throughput",
    "Title Template": "Ethereum Ecosystem Throughput | growthepie",
    "Description Template": "Measure transaction throughput across Ethereum and major Layer 2 networks.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/total-value-secured",
    "Title Template": "Total Value Secured (TVS) | growthepie",
    "Description Template": "Understand how much value each chain secures — a metric of chain security and importance.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/transaction-costs",
    "Title Template": "Transaction Costs | growthepie",
    "Description Template": "Compare the average cost of transacting across Ethereum L1 and L2s.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/transaction-count",
    "Title Template": "Transaction Count | growthepie",
    "Description Template": "Analyze raw transaction count across Ethereum and its Layer 2 networks.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/blob-count",
    "Title Template": "Blob Count Analysis | growthepie",
    "Description Template": "View the total blobs posted to Ethereum and other DA providers for data availability — across rollups and chains.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/da-consumers",
    "Title Template": "Data Availability Consumers | growthepie",
    "Description Template": "Track which chains consume Ethereum's data availability layer as well as other DA providers, and how much.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/data-posted",
    "Title Template": "Data Posted by Rollups | growthepie",
    "Description Template": "Compare total data posted per chain over time, measured in bytes.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/fees-paid",
    "Title Template": "DA Fees Paid | growthepie",
    "Description Template": "See which rollups pay the most for data availability on Ethereum and other Data Availability providers such as Celestia.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/fees-paid-per-megabyte",
    "Title Template": "Cost per Megabyte | growthepie",
    "Description Template": "Compare DA cost efficiency by measuring fees paid per megabyte of data.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/glodollar",
    "Title Template": "Glo Dollar Dashboard | growthepie",
    "Description Template": "Track adoption and onchain activity of the Glo Dollar stablecoin across Ethereum L1 and L2s.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/octant",
    "Title Template": "Octant Metrics Dashboard | growthepie",
    "Description Template": "View engagement, deposits, and matching amounts from Octant onchain participation during different Epochs.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/optimism-retropgf-3",
    "Title Template": "Optimism RetroPGF 3 Tracker | growthepie",
    "Description Template": "Analyze project visibility and impact in Optimism’s RetroPGF 3 funding round.",
    "Status": "Published"
  },
  {
    "Path": "/blockspace/category-comparison",
    "Title Template": "Blockspace Usage by Category | growthepie",
    "Description Template": "Compare how different application categories utilize Ethereum L1 and L2 blockspace. Analyze usage trends over time through subcategories.",
    "Status": "Published"
  },
  {
    "Path": "/blockspace/chain-overview",
    "Title Template": "Ethereum Chain Overview | growthepie",
    "Description Template": "Visualize and compare how different chains are being use across Ethereum L1 and Layer 2s. Understand each chain's role in the ecosystem.",
    "Status": "Published"
  },
  {
    "Path": "/donate",
    "Title Template": "Support growthepie",
    "Description Template": "Fund open analytics for Ethereum. Help maintain and grow an independent, public goods platform tracking the Ethereum ecosystem.",
    "Status": "Published"
  },
  {
    "Path": "/privacy-policy",
    "Title Template": "Privacy Policy",
    "Description Template": "Review how growthepie collects, processes, and protects your data across the platform.",
    "Status": "Published"
  },
  {
    "Path": "/imprint",
    "Title Template": "Imprint",
    "Description Template": "Official legal and publishing information for growthepie, the Ethereum analytics platform.",
    "Status": "Published"
  },
  {
    "Path": "/icons",
    "Title Template": "growthepie Icons",
    "Description Template": "Access the icon set used across growthepie’s dashboards.",
    "Status": "Published"
  },
  {
    "Path": "/applications/[slug]",
    "Title Template": "{{name}} Metrics | growthepie",
    "Description Template": "Track {{name}} usage across Ethereum L1 and L2s. See app metrics such as transaction count, active addresses and fees paid.",
    "Status": "Published"
  },
  {
    "Path": "/chains/[slug]",
    "Title Template": "{{chainName}} Metrics | growthepie",
    "Description Template": "Get to know {{chainName}} and learn about the chain's usage using fundamental and economic metrics as well as its tracked applications.",
    "Status": "Published"
  },
  {
    "Path": "/ethereum-ecosystem/metrics",
    "Title Template": "Ethereum Ecosystem Metrics | growthepie",
    "Description Template": "Explore real-time metrics for the Ethereum Ecosystem (Mainnet & Layer 2s): Track uptime, TPS, fees, and analyze its growth.",
    "Status": "Published"
  }
];

export interface PageMetadata {
  title: string;
  description: string;
}

type MetadataMap = Map<string, PageMetadata>;

// --- Process Hardcoded Data into a Map (Done once on module load) ---
const allMetadataMap: MetadataMap = new Map();

hardcodedMetadataArray.forEach((record) => {
  // Optional: Filter by Status if needed
  if (record.Status === 'Published') {
    const path = record.Path;
    const title = record['Title Template']; // Access using bracket notation due to space
    const description = record['Description Template']; // Access using bracket notation

    if (path && title && description) {
      allMetadataMap.set(path, { title, description });
    }
  }
});


// --- Function to Get the Processed Map ---
export async function getAllMetadata(): Promise<MetadataMap> {
    return allMetadataMap;
}


// --- Helper Function to Get Metadata for a Specific Page ---

// Interface for dynamic data needed to fill placeholders
interface DynamicData {
  [key: string]: string | number | undefined; // e.g., { name: 'Uniswap', chainName: 'Optimism' }
}

// Helper to replace placeholders like {{variableName}}
function replacePlaceholders(template: string, data: DynamicData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // Use String() to handle potential numbers, provide default empty string if undefined/null
    return String(data[key] ?? '');
  });
}

export async function getPageMetadata(
  pathTemplate: string, // e.g., '/', '/applications', '/chains/[slug]'
  dynamicData: DynamicData = {} // Data to fill placeholders, e.g., { name: 'App Name' }
): Promise<PageMetadata> {
  // Get the map (this is now very fast as it returns the pre-processed map)
  const allMetadata = await getAllMetadata();
  const templateMetadata = allMetadata.get(pathTemplate);

  const defaultMetadata: PageMetadata = {
    title: 'growthepie', // Your site-wide default title
    description: 'Ethereum Ecosystem Analytics', // Your site-wide default description
  };

  if (!templateMetadata) {
    console.warn(`No metadata found in hardcoded data for path template: ${pathTemplate}`);
    return defaultMetadata;
  }

  // Replace placeholders if dynamic data is provided
  const finalTitle = replacePlaceholders(templateMetadata.title, dynamicData);
  const finalDescription = replacePlaceholders(templateMetadata.description, dynamicData);

  return {
    title: finalTitle,
    description: finalDescription,
  };
}
