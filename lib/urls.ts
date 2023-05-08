export const MetricsURLs = {
  "daily-active-addresses":
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/metrics/daa.json",
  "fees-paid-by-users":
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/metrics/fees.json",
  "stablecoin-market-cap":
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/metrics/stables_mcap.json",
  "total-value-locked":
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/metrics/tvl.json",
  "transaction-count":
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/metrics/txcount.json",
};

// const { data: Arbitrum, error: arbError } = useSWR<ArbitrumChainResponse>(
//   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/arbitrum.json"
// );

// const { data: Optimism, error: optError } = useSWR<ArbitrumChainResponse>(
//   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/optimism.json"
// );

// const { data: Polygon, error: polyError } = useSWR<ArbitrumChainResponse>(
//   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/polygon_zkevm.json"
// );

// const { data: Imx, error: imxError } = useSWR<ArbitrumChainResponse>(
//   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/imx.json"
// );

export const ChainURLs = {
  ethereum: "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/ethereum.json",
  arbitrum: "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/arbitrum.json",
  polygon_zkevm:
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/polygon_zkevm.json",
  optimism: "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/optimism.json",
  imx: "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/imx.json",
};

export const LandingURL =
  "https://d2cfnw27176mbd.cloudfront.net/v0_4/landing_page.json";

export const MasterURL =
  "https://d2cfnw27176mbd.cloudfront.net/v0_4/master.json";
