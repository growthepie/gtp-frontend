import Icon from "@/components/layout/Icon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { url } from "inspector";

export type MetricItem = {
  label: string;
  category?: string;
  page?: {
    title?: string;
    tags?: React.ReactNode[];
    description: string;
    note?: string | React.ReactNode;
    why?: string;
    icon?: string;
    showGwei?: boolean;
    reversePerformer?: boolean;
  };
  icon: GTPIconName;
  key?: string;
  rootKey?: string;
  urlKey: string;
};

export const metricCategories = {
  activity: {
    label: "Activity",
    icon: "feather:clock",
    group: "fundamentals",
  },
  "value-locked": {
    label: "Value Secured",
    icon: "feather:star",
    group: "fundamentals",
  },
  economics: {
    label: "Economics",
    icon: "feather:credit-card",
    group: "fundamentals",
  },

  convenience: {
    label: "Convenience",
    icon: "transaction-costs",
    group: "fundamentals",
  },
};

export const metricItems: MetricItem[] = [
  {
    label: "Active Addresses",
    category: "activity",
    page: {
      title: "Active Addresses",
      description:
        "The number of distinct addresses that interacted with a chain. This only includes addresses that initiated a transaction or interacted with a smart contract.",
      why: "Active addresses is a widely used metric for estimating the engagement on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall activity of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
      icon: "gtp-metrics-activeaddresses",
    },
    icon: "gtp-metrics-activeaddresses",
    key: "daa",
    rootKey: "metricsDailyActiveAddresses",
    urlKey: "daily-active-addresses",
  },
  {
    label: "Transaction Count",
    category: "activity",
    page: {
      title: "Transaction Count",
      description:
        "The number of transactions on the network. We only count transactions that are executed by users/smart contracts - no system transactions.",
      why: "The number of transactions processed on a blockchain is a reliable metric for measuring its usage. However, it should be noted that this metric alone may not provide sufficient insight into the actual value of the transactions being conducted. For instance, while some chains may have a lower transaction count, the value of these transactions may be significantly higher due to their use in decentralized finance (DeFi) applications. On the other hand, certain chains may have a higher transaction count due to their use in gaming or other applications involving lower value transactions.",
      icon: "gtp-metrics-transactioncount",
    },
    icon: "gtp-metrics-transactioncount",
    key: "txcount",
    rootKey: "metricsTxCount",
    urlKey: "transaction-count",
  },
  {
    label: "Throughput",
    category: "activity",
    page: {
      title: "Throughput",
      description:
        "Throughput is the amount of gas used per second, reflecting how much computational work the network is handling. We only include EVM equivalent Layer 2 gas usage.",
      why: "Throughput is a crucial metric for assessing scalability, reflecting a blockchain's actual compute capacity more accurately than transaction counts, which can vary in complexity (i.e. 21,000 gas for an eth transfer vs 280,000 gas for a simple Uniswap swap). Similarly to how modern storage devices are marketed with specs on read/write speeds rather than the number of files they can process, throughput provides a direct measure of a blockchain's ability to handle compute effectively. Throughput also reveals how close a chain is to its operational limits. This metric is essential for app developers and Layer 2 teams to gauge growth potential, potential cost implications, and performance constraints.",
      icon: "gtp-metrics-throughput",
    },
    icon: "gtp-metrics-throughput",
    key: "throughput",
    rootKey: "throughput",
    urlKey: "throughput",
  },
  {
    label: "Stablecoin Supply",
    category: "value-locked",
    page: {
      title: "Stablecoin Supply",
      description:
        "The value of all stablecoins that are secured by the chain. Stablecoins are cryptocurrencies that attempt to peg their market value to a fiat currency like the U.S. dollar or Euro.",
      why: "Stablecoin supply is a crucial metric for evaluating the growth and development of a blockchain's use-cases. Stablecoins are a popular choice for use in DeFi applications such as lending, borrowing, and trading as well as payments. Since stablecoins are usually 1:1 backed by real-world assets, this metric is harder to inflate than Total Value Secured which includes all types of tokens.",
      icon: "gtp-metrics-stablecoinmarketcap",
    },
    icon: "gtp-metrics-stablecoinmarketcap",
    key: "stables_mcap",
    rootKey: "metricsStablesMcap",
    urlKey: "stablecoin-market-cap",
  },
  {
    label: "Total Value Secured",
    category: "value-locked",
    page: {
      title: "Total Value Secured",
      description:
        "The sum of all assets secured by the chain, including canonically bridged, externally bridged, and natively issued tokens. Methodology and data is derived from L2Beat.com.",
      why: "Total Value Secured is a crucial metric for assessing the success in a blockchain. High TVS indicates that users have significant trust in the chain's security and reliability, as well as confidence in the usefulness and functionality of the various applications available on the chain.",
      icon: "gtp-metrics-totalvaluelocked",
    },
    icon: "gtp-metrics-totalvaluelocked",
    key: "tvl",
    rootKey: "metricsTvl",
    urlKey: "total-value-secured",
  },

  {
    label: "Transaction Costs",
    category: "convenience",
    page: {
      title: "Transaction Costs",
      description: "The median amount that a user pays to execute a transaction on a chain. This metric can be influenced by the complexity of the transaction, which is measured in gas.",
      note: (
        <>
          1 Billion <b className="font-semibold">Gwei</b> equals 1{" "}
          <b className="font-semibold">ETH</b>.
        </>
      ),
      why: "This is the amount that users pay per transaction. On EVM chains, transaction costs depend on the complexity of the transaction (which is measured in gas). A simple transaction, e.g. a native ETH transfer, uses less gas than a more complex transaction, e.g. an ERC20 swap. Hence, we calculated this metric by looking at the median transaction costs.",
      icon: "gtp-metrics-transactioncosts",
      showGwei: true,
      reversePerformer: true,
    },
    icon: "gtp-metrics-transactioncosts",
    key: "txcosts",
    rootKey: "metricsTxCosts",
    urlKey: "transaction-costs",
  },

  {
    label: "Revenue",
    category: "economics",
    page: {
      title: "Chain Revenue",
      description:
        "The total amount of network fees that were paid by users of the chain to execute transactions. These fees are collected by the chain's sequencers.",
      why: "Revenue is a critical metric for measuring a blockchain's adoption and is the sum of all gas fees paid by users. A high fee revenue can be an indication that users find the chain's applications and security valuable, and are willing to pay for it. The Revenue metric reflects the total amount of onchain income generated by the network.",
      icon: "gtp-metrics-feespaidbyusers",
    },
    icon: "gtp-metrics-feespaidbyusers",
    key: "fees",
    rootKey: "metricsFeesPaidToEthereum",
    urlKey: "fees-paid-by-users",
  },
  {
    label: "Rent Paid to L1",
    category: "economics",
    page: {
      title: "Rent Paid to L1",
      description:
        "The fees paid by Layer 2s to post transaction data & verification states onto Ethereum. For data availability: Ethereum Calldata and Ethereum Blobs are tracked here.",
      why: "Rent paid to L1 quantifies the expenses associated with posting L2 transaction data and proofs onto the Ethereum blockchain. The term 'rent' signifies the gas fees L2s incur to leverage the security of the Ethereum blockchain. This metric provides valuable insights into the value accrual for ETH holders.",
      icon: "gtp-metrics-rentpaidtol1",
    },
    icon: "gtp-metrics-rentpaidtol1",
    key: "rent_paid",
    rootKey: "metricsRentPaid",
    urlKey: "rent-paid",
  },
  {
    label: "Onchain Profit",
    category: "economics",
    page: {
      title: "Onchain Profit",
      description:
        "The net profit of L2s, accounting for revenues as L2 gas fees collected and expenses as posting transaction data & verification states onto Ethereum.",
      why: "Onchain Profit is a key metric for assessing the financial viability of scaling solutions. It quantifies profitability by comparing the revenue generated from L2 gas fees collected to the costs associated with data & proof posting onto the Ethereum blockchain. L2 profitability can increases for two reasons: firstly, when there is high demand for L2 blockspace, enabling an auction of the available blockspace for a premium. Secondly, if the operator (who controls the sequencer) increases the base fee scalar. This metric can be used to gauge the health and success of Layer 2 solutions.",
      icon: "gtp-metrics-onchainprofit",
    },
    icon: "gtp-metrics-onchainprofit",
    key: "profit",
    rootKey: "metricsEarnings",
    urlKey: "profit",
  },
  {
    label: "Fully Diluted Valuation",
    category: "economics",
    page: {
      title: "Fully Diluted Valuation",
      description:
        "The Fully Diluted Valuation is the theoretical market cap of a token if all its planned tokens (total supply) were issued at the current price.",
      tags: [
        <div
          className="flex items-center space-x-1 font-inter text-lg"
          key="fdv-title-tags"
        >
          <span className="rounded bg-forest-900 px-1.5 py-0.5 font-inter text-xs font-medium text-white dark:bg-forest-500 dark:text-forest-1000">
            FDV
          </span>
          <div>=</div>
          <span className="rounded border border-forest-900 px-1.5 py-[1px] font-inter text-xs font-medium dark:border-forest-500">
            Total Token Supply
          </span>
          <Icon
            className="text-base text-forest-900 dark:text-forest-500"
            icon="feather:x"
          />
          <span className="rounded border border-forest-900 px-1.5 py-[1px] font-inter text-xs font-medium dark:border-forest-500">
            Token Price
          </span>
        </div>,
      ],
      why: "FDV helps investors understand the potential size and value of a token, which can be useful for comparing similar assets and assessing the risk of dilution. Note: A token can be related to multiple chains (i.e. MATIC is connected to Polygon zkEVM and Polygon PoS)",
      icon: "gtp-metrics-fdv",
      showGwei: false,
    },
    icon: "gtp-metrics-fdv",
    key: "fdv",
    rootKey: "metricsFullyDilutedValuation",
    urlKey: "fully-diluted-valuation",
  },
  {
    label: "Market Cap",
    category: "economics",
    page: {
      title: "Market Cap",
      tags: [
        <div
          className="flex items-center space-x-1 font-inter text-lg"
          key="market-cap-title-tags"
        >
          <span className="rounded bg-forest-900 px-1.5 py-0.5 font-inter text-xs font-medium text-white dark:bg-forest-500 dark:text-forest-1000">
            MC
          </span>
          <div>=</div>
          <span className="rounded border border-forest-900 px-1.5 py-[1px] font-inter text-xs font-medium dark:border-forest-500">
            Circulating Token Supply
          </span>
          <Icon
            className="text-base text-forest-900 dark:text-forest-500"
            icon="feather:x"
          />

          <span className="rounded border border-forest-900 px-1.5 py-[1px] font-inter text-xs font-medium dark:border-forest-500">
            Token Price
          </span>
        </div>,
      ],
      description:
        "The Market Cap is the total value of all circulating tokens, calculated by multiplying the current price of a single token by the total number of tokens in circulation.",

      why: "Market cap is an important metric because it provides a quick snapshot of a token's market dominance, helping investors assess its popularity. It is important though to also consider a tokens issuance rate (Circulating supply / Total supply) to paint a full picture. Note: A token can be related to multiple chains (i.e. MATIC is connected to Polygon zkEVM and Polygon PoS).",
      icon: "gtp-metrics-marketcap",
      showGwei: false,
    },
    icon: "gtp-metrics-marketcap",
    key: "market_cap",
    rootKey: "marketCap",
    urlKey: "market-cap",
  },
  {
    label: "App Revenue",
    category: "economics",
    page: {
      title: "Application Revenue",
      description:
        "The amount of fees that users pay towards applications on the chain. This metric shows how much value applications capture from users. Data is sourced from DefiLlama.com.",
      why: "App Revenue is a key metric for assessing the financial health and success of applications on a blockchain. It reflects the total amount of fees generated by applications, which can be used to measure their popularity and effectiveness. A high App Revenue indicates that users find the applications valuable and are willing to pay for them, while a low App Revenue may suggest that the applications are not meeting user needs or expectations.",
      icon: "gtp-metrics-feespaidbyusers",
    },
    icon: "gtp-metrics-feespaidbyusers",
    key: "app_revenue",
    rootKey: "metricsAppRevenue",
    urlKey: "app-revenue",
  },
];

export const daMetricItems: MetricItem[] = [
  {
    label: "Blob Count",
    icon: "gtp-blobs-number",
    page: {
      title: "Blob Count",
      description:
        "Blob Count tracks the total number of data blobs submitted to a given Data Availability layer. A blob is a piece of data that contains transaction information necessary for recreating the state of the rollup.",
      why: "Monitoring the Blob Count is essential for assessing the data throughput and scalability of the DA layer. A higher blob count indicates increased usage and demand for data availability services, reflecting the network's capacity to handle more transactions and maintain security.",
      icon: "gtp-blobs-number",
      showGwei: false,
    },
    key: "blob_count",
    urlKey: "blob-count",
  },
  {
    label: "DA Consumers",
    icon: "gtp-blob-producers",
    page: {
      title: "DA Consumers",
      description:
        "DA Consumers refers to the number of unique entities that submit data blobs to the Data Availability layer. In the context of layer 2s, these are generally the sequencers who ensure data is available for transaction or state verification. However, this metric tracks all entities acting on the Data Availability layer, so there may be other entities apart from rollups that utilize the DA solution.",
      why: "Tracking the number of DA Consumers provides insights into the diversity of usage of the DA layer. A diverse and growing number of consumers shows that more layer 2s or other entities are posting data to this DA layer.",
      icon: "gtp-blob-producers",
      showGwei: false,
    },
    key: "blob_producers",
    urlKey: "da-consumers",
  },
  {
    label: "Data Posted",
    icon: "gtp-data-posted",
    page: {
      title: "Data Posted",
      description:
        "Data Posted measures the total data size submitted to the Data Availability layer. In the context of layer 2s, this includes transactions or state changes, often compressed using various compression techniques.",
      why: "Understanding the volume of Data Posted is crucial for evaluating the network's usage patterns and scalability. High data volumes may indicate increased network activity and demand for data availability services.",
      icon: "gtp-data-posted",
      showGwei: false,
    },
    key: "data_posted",
    urlKey: "data-posted",
  },
  {
    label: "DA Fees Paid",
    icon: "gtp-da-fees-paid",
    page: {
      title: "DA Fees Paid",
      description:
        "DA Fees Paid refers to the fees collected by the Data Availability layer for processing and storing data blobs.",
      why: "Analyzing Fees Paid helps in understanding the economic sustainability of the DA layer. It reflects the cost associated with data availability services and can indicate the financial health of the network. Additionally, it provides insights into the demand for data posting and the efficiency of fee structures.",
      icon: "gtp-da-fees-paid",
      showGwei: false,
    },
    key: "fees_paid",
    urlKey: "fees-paid",
  },
  {
    label: "Fees Paid per MB",
    icon: "gtp-da-fees-paid-per-mb",
    page: {
      title: "Fees Paid per MB",
      description:
        "Fees Paid per MB (1024 KiB) measures the average fees paid for each megabyte of data posted to the Data Availability layer. This metric provides a standardized view of the cost efficiency of data posting.",
      why: "Evaluating Fees Paid Per Mbyte is important for assessing the cost-effectiveness of data availability services. It helps users and developers understand the financial implications of their data usage and can guide decisions. The volatility of this metric is also an important datapoint.",
      icon: "gtp-da-fees-paid-per-mb",
      showGwei: false,
      reversePerformer: true,
    },
    key: "fees_per_mbyte",
    urlKey: "fees-paid-per-megabyte",
  },
];

export const getFundamentalsByKey = (() => {
  const fundamentalsByKey = {};

  // Loop through each item in navigationItems
  for (const item of metricItems) {
    // Loop through each option

    if (item.key) {
      fundamentalsByKey[item.key] = metricItems.find(
        (metricItem) => metricItem.key === item.key,
      );
    }
  }

  return fundamentalsByKey;
})();
