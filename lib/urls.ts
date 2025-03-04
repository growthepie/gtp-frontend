export const MetricsURLs = {
  "daily-active-addresses": "https://api.growthepie.xyz/v1/metrics/daa.json",
  "fees-paid-by-users": "https://api.growthepie.xyz/v1/metrics/fees.json",
  "stablecoin-market-cap":
    "https://api.growthepie.xyz/v1/metrics/stables_mcap.json",
  "total-value-locked": "https://api.growthepie.xyz/v1/metrics/tvl.json",
  "total-value-secured": "https://api.growthepie.xyz/v1/metrics/tvl.json",
  "transaction-count": "https://api.growthepie.xyz/v1/metrics/txcount.json",
  "transaction-costs": "https://api.growthepie.xyz/v1/metrics/txcosts.json",
  "rent-paid": "https://api.growthepie.xyz/v1/metrics/rent_paid.json",
  profit: "https://api.growthepie.xyz/v1/metrics/profit.json",
  "fully-diluted-valuation": "https://api.growthepie.xyz/v1/metrics/fdv.json",
  "market-cap": "https://api.growthepie.xyz/v1/metrics/market_cap.json",
  throughput: "https://api.growthepie.xyz/v1/metrics/throughput.json",
};

export const DAMetricsURLs = {
  "blob-count": "https://api.growthepie.xyz/v1/da_metrics/blob_count.json",
  "blob-producers":
    "https://api.growthepie.xyz/v1/da_metrics/blob_producers.json",
  "da-consumers":
    "https://api.growthepie.xyz/v1/da_metrics/blob_producers.json",
  "data-posted": "https://api.growthepie.xyz/v1/da_metrics/data_posted.json",
  "fees-paid": "https://api.growthepie.xyz/v1/da_metrics/fees_paid.json",
  "fees-paid-per-megabyte":
    "https://api.growthepie.xyz/v1/da_metrics/fees_per_mbyte.json",
};

export const ChainsBaseURL = "https://api.growthepie.xyz/v1/chains/";

export const BlockspaceURLs = {
  "chain-overview": "https://api.growthepie.xyz/v1/blockspace/overview.json",
  "category-comparison":
    "https://api.growthepie.xyz/v1/blockspace/category_comparison.json",
};

export const DAOverviewURL = "https://api.growthepie.xyz/v1/da_overview.json";
export const DATimeseriesURL =
  "https://api.growthepie.xyz/v1/da_timeseries.json";

export const ChainBlockspaceURLs = {
  ethereum: "https://api.growthepie.xyz/v1/chains/blockspace/ethereum.json",
  arbitrum: "https://api.growthepie.xyz/v1/chains/blockspace/arbitrum.json",
  polygon_zkevm:
    "https://api.growthepie.xyz/v1/chains/blockspace/polygon_zkevm.json",
  optimism: "https://api.growthepie.xyz/v1/chains/blockspace/optimism.json",
  imx: "https://api.growthepie.xyz/v1/chains/blockspace/imx.json",
  zksync_era: "https://api.growthepie.xyz/v1/chains/blockspace/zksync_era.json",
  base: "https://api.growthepie.xyz/v1/chains/blockspace/base.json",
  swell: "https://api.growthepie.xyz/v1/chains/blockspace/swell.json",
  gitcoin_pgn:
    "https://api.growthepie.xyz/v1/chains/blockspace/gitcoin_pgn.json",
  zora: "https://api.growthepie.xyz/v1/chains/blockspace/zora.json",
  linea: "https://api.growthepie.xyz/v1/chains/blockspace/linea.json",
  scroll: "https://api.growthepie.xyz/v1/chains/blockspace/scroll.json",
  mantle: "https://api.growthepie.xyz/v1/chains/blockspace/mantle.json",
  starknet: "https://api.growthepie.xyz/v1/chains/blockspace/starknet.json",
  loopring: "https://api.growthepie.xyz/v1/chains/blockspace/loopring.json",
  rhino: "https://api.growthepie.xyz/v1/chains/blockspace/rhino.json",
  metis: "https://api.growthepie.xyz/v1/chains/blockspace/metis.json",
  manta: "https://api.growthepie.xyz/v1/chains/blockspace/manta.json",
  blast: "https://api.growthepie.xyz/v1/chains/blockspace/blast.json",
  mode: "https://api.growthepie.xyz/v1/chains/blockspace/mode.json",
  taiko: "https://api.growthepie.xyz/v1/chains/blockspace/taiko.json",
  swell: "https://api.growthepie.xyz/v1/chains/blockspace/swell.json",
  redstone: "https://api.growthepie.xyz/v1/chains/blockspace/redstone.json",
};

export const EconomicsURL = "https://api.growthepie.xyz/v1/economics.json";

export const LandingURL = "https://api.growthepie.xyz/v1/landing_page.json";

export const MasterURL = "https://api.growthepie.xyz/v1/master.json";

export const ContractsURL = "https://api.growthepie.xyz/v1/contracts.json";

export const GloHolderURL = "https://api.growthepie.xyz/v1/glo_dollar.json";

export const LabelsURLS = {
  quick: "https://api.growthepie.xyz/v1/labels/quick.json",
  full: "https://api.growthepie.xyz/v1/labels/full.json",
  sparkline: "https://api.growthepie.xyz/v1/labels/sparkline.json",
  projects: "https://api.growthepie.xyz/v1/labels/projects.json",
};
export const LabelsParquetURLS = {
  quick: "https://api.growthepie.xyz/v1/labels/quick.parquet",
  full: "https://api.growthepie.xyz/v1/labels/full.parquet",
  sparkline: "https://api.growthepie.xyz/v1/labels/sparkline.parquet",
  projects: "https://api.growthepie.xyz/v1/labels/projects.parquet",
};

export const ApplicationsURLs = {
  overview: "https://api.growthepie.xyz/v1/apps/app_overview_{timespan}.json",
  details: "https://api.growthepie.xyz/v1/apps/details/{owner_project}.json",
};
export const ApplicationsParquetURLs = {
  overview: "https://api.growthepie.xyz/v1/apps/app_overview_test.parquet",
};

export const FeesURLs = {
  table: "https://api.growthepie.xyz/v1/fees/table.json",
  linechart: "https://api.growthepie.xyz/v1/fees/linechart.json",
};

export const OctantURLs = {
  summary: "https://api.growthepie.xyz/v1/trackers/octant/summary.json",
  community: "https://api.growthepie.xyz/v1/trackers/octant/community.json",
  project_funding:
    "https://api.growthepie.xyz/v1/trackers/octant/project_funding.json",
  project_metadata:
    "https://api.growthepie.xyz/v1/trackers/octant/project_metadata.json",
  projects_by_website:
    "https://api.growthepie.xyz/v1/trackers/octant/projects_by_website.json",
};
