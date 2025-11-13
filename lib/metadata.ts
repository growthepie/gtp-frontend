type RawMetadataRecord = {
  Path: string;
  "Title Template": string;
  "Description Template": string;
  Status?: string;
  Canonical?: string;
  "No Index"?: boolean;
};

const hardcodedMetadataArray: RawMetadataRecord[] = [
  {
    "Path": "/",
    "Title Template": "growthepie - Ethereum Ecosystem Analytics",
    "Description Template": "The open analytics platform for the Ethereum ecosystem - empowering builders with actionable insights to grow the pie. From Mainnet to Layer 2s and onchain applications, explore open data on usage, growth, and adoption",
    "Status": "Published"
  },
  {
    "Path": "/applications",
    "Title Template": "Ethereum Ecosystem Applications | growthepie",
    "Description Template": "Discover the most active Ethereum and Layer 2 applications. Compare transactions, users, and on-chain revenue over time.",
    "Status": "Published"
  },
  {
    "Path": "/contributors",
    "Title Template": "growthepie Contributors | growthepie",
    "Description Template": "Meet the contributors and builders behind growthepie — the open analytics platform for the Ethereum ecosystem.",
    "Status": "Published"
  },
  {
    "Path": "/economics",
    "Title Template": "Ethereum Onchain Economics | Revenue, Costs, Profits | growthepie",
    "Description Template": "Explore protocol revenue, fees, and profit across Ethereum and its scaling layers. Analyze network health through economic metrics and profit margins.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability",
    "Title Template": "Data Availability Comparison | Ethereum Blobs & Alt DA Layers | growthepie",
    "Description Template": "Compare how Ethereum layer 2s use Data Availability layers like Ethereum Blobs, EigenDA, Celestia. Analyze blob usage, posting costs, and scalability trends.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/daily-active-addresses",
    "Title Template": "Daily Active Addresses | Ethereum Ecosystem | growthepie",
    "Description Template": "Track daily active addresses on Ethereum and major Layer 2s to measure adoption, retention, and ecosystem growth.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/fees-paid-by-users",
    "Title Template": "Chain Revenue | Ethereum Ecosystem | growthepie",
    "Description Template": "Compare fees paid by users across Ethereum and its Layer 2s. Understand cost efficiency and user demand trends.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/fully-diluted-valuation",
    "Title Template": "Fully Diluted Valuation | Ethereum Ecosystem | growthepie",
    "Description Template": "Analyze token valuations across Ethereum ecosystems. See how value is distributed between L1 and major L2s.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/market-cap",
    "Title Template": "Market Cap | Ethereum Ecosystem | growthepie",
    "Description Template": "Monitor market capitalization of Ethereum and L2-native tokens with historical and real-time charts.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/profit",
    "Title Template": "Onchain Profit | Ethereum Ecosystem | growthepie",
    "Description Template": "Explore a how much onchain profit is generated across Layer 2s.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/rent-paid",
    "Title Template": "Rent Paid to Ethereum | Ethereum Ecosystem | growthepie",
    "Description Template": "View how much each layer 2 pays Ethereum for security and data availability — the backbone of Ethereum’s rollup-centric model.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/stablecoin-market-cap",
    "Title Template": "Stablecoin Market Cap | Ethereum Ecosystem | growthepie",
    "Description Template": "Track stablecoin supply (like USDC and USDT) and growth across Ethereum and its Layer 2s.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/throughput",
    "Title Template": "Throughput | Ethereum Ecosystem | growthepie",
    "Description Template": "Measure gas per second across Ethereum and major Layer 2 chains. Benchmark scalability and performance.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/app-revenue",
    "Title Template": "Application Revenue | Ethereum Ecosystem | growthepie",
    "Description Template": "See how much revenue apps generate across Ethereum and its Layer 2s. Compare trends across chains and timeframes.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/total-value-secured",
    "Title Template": "Total Value Secured (TVS) | Ethereum Ecosystem | growthepie",
    "Description Template": "Understand the total value secured by each Ethereum chain — a measure of network trust and importance.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/transaction-costs",
    "Title Template": "Transaction Costs | Ethereum Ecosystem | growthepie",
    "Description Template": "Compare how much it costs users to transact across Ethereum and its Layer 2 networks.",
    "Status": "Published"
  },
  {
    "Path": "/fundamentals/transaction-count",
    "Title Template": "Transaction Count | Ethereum Ecosystem | growthepie",
    "Description Template": "Analyze transaction activity across Ethereum and L2s. Track adoption and throughput growth over time.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/blob-count",
    "Title Template": "Blob Count | Ethereum Ecosystem | growthepie",
    "Description Template": "Monitor blob posting activity across Ethereum and DA providers — key insight into rollup scalability.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/da-consumers",
    "Title Template": "Data Availability Consumers | Ethereum Ecosystem | growthepie",
    "Description Template": "See how many users different DA providers serve for rollups and layer 2s over time.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/data-posted",
    "Title Template": "Data Posted by L2s | Ethereum Ecosystem | growthepie",
    "Description Template": "Compare the data posted by layer 2s to different data availability layers like Ethereum Blobs and EigenDA.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/fees-paid",
    "Title Template": "Data Availability Fees | Ethereum Ecosystem | growthepie",
    "Description Template": "Explore how much DA providers charge layer 2s for data posting and availability services.",
    "Status": "Published"
  },
  {
    "Path": "/data-availability/fees-paid-per-megabyte",
    "Title Template": "Cost per Megabyte | Ethereum Ecosystem | growthepie",
    "Description Template": "Compare how much different DA providers charge layer 2s per megabyte of data posted.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/glodollar",
    "Title Template": "Glo Dollar (GLO) Stablecoin Analytics | growthepie",
    "Description Template": "Track the growth of the Glo Dollar stablecoin across Ethereum and Layer 2s.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/octant",
    "Title Template": "Octant Participation Metrics | growthepie",
    "Description Template": "Track ongoing Octant epochs - a public goods funding initiative for Ethereum.",
    "Status": "Published"
  },
  {
    "Path": "/trackers/optimism-retropgf-3",
    "Title Template": "Optimism RetroPGF 3 Dashboard | Project Insights | growthepie",
    "Description Template": "Track the Optimism RetroPGF 3 project funding round.",
    "Status": "Published"
  },
  {
    "Path": "/blockspace/category-comparison",
    "Title Template": "Blockspace Usage by Category | growthepie",
    "Description Template": "Compare how different chains in the Ethereum ecosystem are used across major categories like DeFi, NFTs, and DA.",
    "Status": "Published"
  },
  {
    "Path": "/blockspace/chain-overview",
    "Title Template": "Blockspace Usage Overview | growthepie",
    "Description Template": "Compare how different chains in the Ethereum ecosystem are used across major categories like DeFi, NFTs, and DA.",
    "Status": "Published"
  },
  {
    "Path": "/donate",
    "Title Template": "Support growthepie | Fund Open Ethereum Analytics | growthepie",
    "Description Template": "Help growthepie remain open and independent. Your support funds transparent analytics for the Ethereum community.",
    "Status": "Published"
  },
  {
    "Path": "/privacy-policy",
    "Title Template": "Privacy Policy | growthepie",
    "Description Template": "Learn how growthepie handles, processes, and protects your data in accordance with privacy regulations.",
    "Status": "Published"
  },
  {
    "Path": "/imprint",
    "Title Template": "Imprint | growthepie",
    "Description Template": "Legal and publishing details for growthepie — the open Ethereum analytics platform.",
    "Status": "Published"
  },
  {
    "Path": "/icons",
    "Title Template": "Icons | growthepie",
    "Description Template": "Access the open-source icon set powering growthepie’s data dashboards.",
    "Status": "Published"
  },
  {
    "Path": "/applications/[slug]",
    "Title Template": "{{name}} | Ethereum Application Analytics | growthepie",
    "Description Template": "Explore {{name}}’s onchain activity across Ethereum L1 and L2s — including transactions, users, and fees paid.",
    "Status": "Published"
  },
  {
    "Path": "/chains/[slug]",
    "Title Template": "{{chainName}} Metrics | Ethereum Layer 2 Analytics | growthepie",
    "Description Template": "Analyze {{chainName}}’s realtime TPS, onchain metrics, application usage, and many more insights.",
    "Status": "Published"
  },
  {
    "Path": "/ethereum-ecosystem/metrics",
    "Title Template": "Ethereum Ecosystem Metrics | growthepie",
    "Description Template": "View real-time Ethereum ecosystem metrics — TPS, uptime, stablecoin supply, and more - across the whole ecosystem.",
    "Status": "Published"
  },
  {
    "Path": "/quick-bites",
    "Title Template": "Quick Bites | Ethereum Data Stories | growthepie",
    "Description Template": "Data-driven articles, updating daily with insights and stories from the Ethereum ecosystem.",
    "Status": "Published"
  }
];

const SITE_NAME = "growthepie";
const SITE_ORIGIN = "https://www.growthepie.com";
const BRAND_SEPARATOR = " | ";
const DEFAULT_TITLE = `${SITE_NAME} – Ethereum Ecosystem Analytics`;
const DEFAULT_DESCRIPTION =
  "Comprehensive analytics across Ethereum Layer 1 and Layer 2 networks.";
const MAX_DESCRIPTION_LENGTH = 158;
const PLACEHOLDER_PATTERN = /\{\{([\w.-]+)\}\}/g;

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const ensureBrand = (title: string): string => {
  const normalized = normalizeText(title || "");
  if (!normalized) return SITE_NAME;
  if (normalized.toLowerCase().includes(SITE_NAME)) return normalized;
  const separator = normalized.includes("|") ? " " : BRAND_SEPARATOR;
  return `${normalized}${separator}${SITE_NAME}`;
};

const clampDescription = (description: string): string => {
  const normalized = normalizeText(description || "");
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }

  const truncated = normalized.slice(0, MAX_DESCRIPTION_LENGTH - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeCut = lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeCut}...`;
};

const computeCanonical = (path: string, explicit?: string): string | undefined => {
  if (explicit) return explicit;
  if (!path || path.includes("[") || path.includes("{")) return undefined;
  return `${SITE_ORIGIN}${path}`;
};

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  noIndex?: boolean;
}

type MetadataTemplate = {
  titleTemplate: string;
  descriptionTemplate: string;
  canonical?: string;
  noIndex?: boolean;
};

type MetadataMap = Map<string, MetadataTemplate>;

// --- Process Hardcoded Data into a Map (Done once on module load) ---
const allMetadataMap: MetadataMap = new Map();

hardcodedMetadataArray.forEach((record) => {
  const status = (record.Status ?? "published").toLowerCase();
  const includeEntry = status === "published" || status === "noindex";
  if (!includeEntry) return;

  const path = normalizeText(record.Path ?? "");
  const rawTitle = record["Title Template"] ?? "";
  const rawDescription = record["Description Template"] ?? DEFAULT_DESCRIPTION;
  if (!path || !rawTitle || !rawDescription) return;

  const titleTemplate = ensureBrand(rawTitle);
  const descriptionTemplate = clampDescription(rawDescription);

  allMetadataMap.set(path, {
    titleTemplate,
    descriptionTemplate,
    canonical: computeCanonical(path, record.Canonical?.trim()),
    noIndex: status === "noindex" || record["No Index"] === true,
  });
});


// --- Function to Get the Processed Map ---
export async function getAllMetadata(): Promise<MetadataMap> {
    return allMetadataMap;
}


// --- Helper Function to Get Metadata for a Specific Page ---

// Interface for dynamic data needed to fill placeholders
type DynamicData = Record<string, string | number | undefined>;

// Helper to replace placeholders like {{variableName}}
function replacePlaceholders(template: string, data: DynamicData): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, key) => {
    const value = data[key];
    if (value === undefined || value === null) {
      return "";
    }
    return normalizeText(String(value));
  });
}

export async function getPageMetadata(
  pathTemplate: string, // e.g., '/', '/applications', '/chains/[slug]'
  dynamicData: DynamicData = {} // Data to fill placeholders, e.g., { name: 'App Name' }
): Promise<PageMetadata> {
  // Get the map (this is now very fast as it returns the pre-processed map)
  const normalizedPath = normalizeText(pathTemplate);
  const allMetadata = await getAllMetadata();
  const templateMetadata = allMetadata.get(normalizedPath);

  const defaultMetadata: PageMetadata = {
    title: ensureBrand(DEFAULT_TITLE),
    description: clampDescription(DEFAULT_DESCRIPTION),
    canonical: computeCanonical(normalizedPath),
  };

  if (!templateMetadata) {
    // console.warn(`No metadata found in hardcoded data for path template: ${pathTemplate}`);
    return defaultMetadata;
  }

  // Replace placeholders if dynamic data is provided
  const finalTitle = ensureBrand(
    replacePlaceholders(templateMetadata.titleTemplate, dynamicData)
  );
  const finalDescription = clampDescription(
    replacePlaceholders(templateMetadata.descriptionTemplate, dynamicData)
  );

  return {
    title: finalTitle,
    description: finalDescription,
    canonical:
      templateMetadata.canonical ?? computeCanonical(normalizedPath),
    noIndex: templateMetadata.noIndex,
  };
}
