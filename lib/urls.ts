// Legacy URLs - kept for backwards compatibility during migration
export const MetricsURLs = {
  "daily-active-addresses": "https://api.growthepie.com/v1/metrics/daa.json",
  "fees-paid-by-users": "https://api.growthepie.com/v1/metrics/fees.json",
  "stablecoin-market-cap":
    "https://api.growthepie.com/v1/metrics/stables_mcap.json",
  "total-value-locked": "https://api.growthepie.com/v1/metrics/tvl.json",
  "total-value-secured": "https://api.growthepie.com/v1/metrics/tvl.json",
  "transaction-count": "https://api.growthepie.com/v1/metrics/txcount.json",
  "transaction-costs": "https://api.growthepie.com/v1/metrics/txcosts.json",
  "rent-paid": "https://api.growthepie.com/v1/metrics/rent_paid.json",
  profit: "https://api.growthepie.com/v1/metrics/profit.json",
  "fully-diluted-valuation": "https://api.growthepie.com/v1/metrics/fdv.json",
  "market-cap": "https://api.growthepie.com/v1/metrics/market_cap.json",
  throughput: "https://api.growthepie.com/v1/metrics/throughput.json",
  "app-revenue": "https://api.growthepie.com/v1/metrics/app_revenue.json",
};

// Map URL keys to API metric IDs
export const MetricURLKeyToAPIKey: { [key: string]: string } = {
  "daily-active-addresses": "daa",
  "fees-paid-by-users": "fees",
  "stablecoin-market-cap": "stables_mcap",
  "total-value-locked": "tvl",
  "total-value-secured": "tvl",
  "transaction-count": "txcount",
  "transaction-costs": "txcosts",
  "rent-paid": "rent_paid",
  "profit": "profit",
  "fully-diluted-valuation": "fdv",
  "market-cap": "market_cap",
  "throughput": "throughput",
  "app-revenue": "app_revenue",
};

// New per-chain metric URL builder
export const getChainMetricURL = (chain: string, metricURLKey: string): string => {
  const metricApiKey = MetricURLKeyToAPIKey[metricURLKey];
  if (!metricApiKey) {
    throw new Error(`Unknown metric URL key: ${metricURLKey}`);
  }
  return `https://api.growthepie.com/v1/metrics/chains/${chain}/${metricApiKey}.json`;
};

// Map DA metric URL keys to API metric IDs
export const DAMetricURLKeyToAPIKey: { [key: string]: string } = {
  "blob-count": "blob_count",
  "da-consumers": "blob_producers",
  "data-posted": "data_posted",
  "fees-paid": "fees_paid",
  "fees-paid-per-megabyte": "fees_per_mbyte",
};

// New per-DA-layer metric URL builder
export const getDALayerMetricURL = (daLayer: string, metricURLKey: string): string => {
  const metricApiKey = DAMetricURLKeyToAPIKey[metricURLKey];
  if (!metricApiKey) {
    throw new Error(`Unknown DA metric URL key: ${metricURLKey}`);
  }
  return `https://api.growthepie.com/v1/metrics/data_availability/${daLayer}/${metricApiKey}.json`;
};

// Legacy DA Metrics URLs - kept for backwards compatibility during migration
export const DAMetricsURLs = {
  "blob-count": "https://api.growthepie.com/v1/da_metrics/blob_count.json",
  "blob-producers":
    "https://api.growthepie.com/v1/da_metrics/blob_producers.json",
  "da-consumers":
    "https://api.growthepie.com/v1/da_metrics/blob_producers.json",
  "data-posted": "https://api.growthepie.com/v1/da_metrics/data_posted.json",
  "fees-paid": "https://api.growthepie.com/v1/da_metrics/fees_paid.json",
  "fees-paid-per-megabyte":
    "https://api.growthepie.com/v1/da_metrics/fees_per_mbyte.json",
};

export const ChainsBaseURL = "https://api.growthepie.com/v1/chains/";

export const BlockspaceURLs = {
  "chain-overview": "https://api.growthepie.com/v1/blockspace/overview.json",
  "category-comparison":
    "https://api.growthepie.com/v1/blockspace/category_comparison.json",
  "tree-map": "https://api.growthepie.com/v1/blockspace/tree_map.json",
};

export const DAOverviewURL = "https://api.growthepie.com/v1/da_overview.json";
export const DATimeseriesURL =
  "https://api.growthepie.com/v1/da_timeseries.json";

export const EconomicsURL = "https://api.growthepie.com/v1/economics.json";

export const LandingURL = "https://api.growthepie.com/v1/landing_page.json";

export const MasterURL = "https://api.growthepie.com/v1/master.json";

export const ContractsURL = "https://api.growthepie.com/v1/contracts.json";

export const GloHolderURL = "https://api.growthepie.com/v1/glo_dollar.json";

export const EthAggURL = "https://api.growthepie.com/v1/ecosystem/overview.json";

export const LabelsURLS = {
  quick: "https://api.growthepie.com/v1/labels/quick.json",
  full: "https://api.growthepie.com/v1/labels/full.json",
  sparkline: "https://api.growthepie.com/v1/labels/sparkline.json",
  projects: "https://api.growthepie.com/v1/labels/projects.json",
  projectsFiltered: "https://api.growthepie.com/v1/labels/projects_filtered.json",
};
export const LabelsParquetURLS = {
  quick: "https://api.growthepie.com/v1/labels/quick.parquet",
  full: "https://api.growthepie.com/v1/labels/full.parquet",
  sparkline: "https://api.growthepie.com/v1/labels/sparkline.parquet",
  projects: "https://api.growthepie.com/v1/labels/projects.parquet",
};

export const ApplicationsURLs = {
  overview: "https://api.growthepie.com/v1/apps/app_overview_{timespan}.json",
  details: "https://api.growthepie.com/v1/apps/details/{owner_project}.json",
};
export const ApplicationsParquetURLs = {
  overview: "https://api.growthepie.com/v1/apps/app_overview_test.parquet",
};

export const FeesURLs = {
  table: "https://api.growthepie.com/v1/fees/table.json",
  linechart: "https://api.growthepie.com/v1/fees/linechart.json",
};

export const OctantURLs = {
  summary: "https://api.growthepie.com/v1/trackers/octant/summary.json",
  community: "https://api.growthepie.com/v1/trackers/octant/community.json",
  project_funding:
    "https://api.growthepie.com/v1/trackers/octant/project_funding.json",
  project_metadata:
    "https://api.growthepie.com/v1/trackers/octant/project_metadata.json",
  projects_by_website:
    "https://api.growthepie.com/v1/trackers/octant/projects_by_website.json",
};

export const IconLibraryURLs = {
  index: "https://api.growthepie.com/v1/icon-library/index.json",
  base: "https://api.growthepie.com/v1/icon-library/",
};
