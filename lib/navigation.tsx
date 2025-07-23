import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "./helpers";
import { MasterURL } from "./urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Icon from "@/components/layout/Icon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export type NavigationItem = {
  name: string;
  label: string;
  newChild?: boolean;
  page?: {
    title: string;
    description: string;
  };
  key?: string;
  icon: GTPIconName;
  options: {
    label: string;
    category?: string;
    page?: {
      title?: string;
      tags?: React.ReactNode[];
      description: string;
      note?: string | React.ReactNode;
      why?: string;
      icon?: GTPIconName;
      showGwei?: boolean;
      reversePerformer?: boolean;
    };
    icon: GTPIconName;
    key?: string;
    rootKey?: string;
    urlKey: string;
    excludeFromSitemap?: boolean;
    hide?: boolean;
    showNew?: boolean;
    url?: string;
  }[];
  href?: string;
};

export const navigationCategories = {
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
  business: {
    label: "Business",
    icon: "feather:briefcase",
    group: "fundamentals",
  },
  market: {
    label: "Market",
    icon: "feather:bar-chart-2",
    group: "fundamentals",
  },
  metrics: {
    label: "Metrics",
    icon: "feather:bar-chart-2",
    group: "fundamentals",
  },

  "blockspace-categories": {
    label: "Categories",
    icon: "package",
    group: "blockspace",
  },
  "blockspace-applications": {
    label: "Applications",
    icon: "gtp-project",
    group: "blockspace",
  },
  contracts: {
    label: "Contracts",
    icon: "package",
    group: "contracts",
  },
  developer: {
    label: "Developer",
    icon: "feather:code",
    group: "developer",
  },
  convenience: {
    label: "Convenience",
    icon: "transaction-costs",
    group: "fundamentals",
  },
  "public-goods-funding": {
    label: "Public Goods Funding",
    icon: "feather:sun",
    group: "trackers",
  },
  gtpmetrics: {
    label: "More from growthepie",
    icon: "gtp-pie-monochrome",
    group: "trackers",
  },
};

const dataAvailabilityGroup: NavigationItem = {
  name: "Data Availability",
  label: "Data Availability",
  key: "metrics",
  icon: "gtp-data-availability",
  // newChild: true,
  options: [
    {
      label: "Overview",
      page: {
        title: "Overview",
        description: `This page shows an overview of common Data Availability (DA) solutions that are used by Layer 2s. DA is becoming more and more important for the modular Layer 2 architecture. Different solutions have different trade-offs with regards to scalability, costs, and security assumptions.`,
        icon: "gtp-overview",
      },
      icon: "gtp-overview",
      key: "data-availability-overview",
      rootKey: "metricsDataAvailabilityOverview",
      urlKey: "overview",
      url: "/data-availability",
      showNew: true,
    },
    {
      label: "Blob Count",
      category: "metrics",
      page: {
        title: "Active Addresses",
        description:
          "The number of distinct addresses that interacted with a chain.",
        why: "Active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
        icon: "gtp-metrics-activeaddresses",
      },
      icon: "gtp-blobs-number",
      key: "blob_count",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "blob-count",
      url: "/data-availability/blob-count",
    },
    {
      label: "DA Consumers",
      category: "metrics",
      page: {
        title: "Active Addresses",
        description:
          "The number of distinct addresses that interacted with a chain.",
        why: "Active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
        icon: "gtp-blob-producers",
      },
      icon: "gtp-blob-producers",
      key: "blob_producers",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "da-consumers",
      url: "/data-availability/da-consumers",
    },
    {
      label: "Data Posted",
      category: "metrics",
      page: {
        title: "Active Addresses",
        description:
          "The number of distinct addresses that interacted with a chain.",
        why: "Active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
        icon: "gtp-metrics-activeaddresses",
      },
      icon: "gtp-data-posted",
      key: "data_posted",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "data-posted",
      url: "/data-availability/data-posted",
    },
    {
      label: "Fees Paid",
      category: "metrics",
      page: {
        title: "Transaction Count",
        description:
          "The number of daily transactions. We try to only count transactions that are executed by users/smart contracts - no system transactions.",
        why: "The number of transactions processed on a blockchain is a reliable metric for measuring its usage. However, it should be noted that this metric alone may not provide sufficient insight into the actual value of the transactions being conducted. For instance, while some chains may have a lower transaction count, the value of these transactions may be significantly higher due to their use in decentralized finance (DeFi) applications. On the other hand, certain chains may have a higher transaction count due to their use in gaming or other applications involving lower value transactions.",
        icon: "gtp-metrics-transactioncount",
      },
      icon: "gtp-da-fees-paid",
      key: "fees_paid",
      rootKey: "metricsTxCount",
      urlKey: "fees-paid",
      url: "/data-availability/fees-paid",
    },
    {
      label: "Fees Paid Per MB",
      category: "metrics",
      page: {
        title: "Throughput",
        description:
          "A chains throughput measured in gas per second. We only include EVM equivalent Layer 2 gas usage.",
        why: "Throughput is a crucial metric for assessing scalability, reflecting a blockchain's actual compute capacity more accurately than transaction counts, which can vary in complexity (i.e. 21,000 gas for an eth transfer vs 280,000 gas for a simple Uniswap swap). Similarly to how modern storage devices are marketed with specs on read/write speeds rather than the number of files they can process, throughput provides a direct measure of a blockchain's ability to handle compute effectively. Throughput also reveals how close a chain is to its operational limits. This metric is essential for app developers and Layer 2 teams to gauge growth potential, potential cost implications, and performance constraints.",
        icon: "gtp-metrics-throughput",
      },
      icon: "gtp-da-fees-paid-per-mb",
      key: "fees_per_mbyte",
      rootKey: "throughput",
      urlKey: "fees-paid-per-megabyte",
      url: "/data-availability/fees-paid-per-megabyte",
    },
  ],
};

    export const navigationItems: NavigationItem[] = [
      { 
        name: "Ecosystem",
        label: "Ecosystem",
        icon: "gtp-ethereumlogo",
        options: [
          {
            label: "Overview",
            page: {
              title: "Overview",
              description: `Applications are the lifeblood of any blockchain ecosystem. They drive user engagement, transaction volume, and overall network activity. By analyzing the top applications on a chain, we can gain insights into the most popular use cases and the types of users that are attracted to the platform. This information is crucial for developers, investors, and anyone interested in understanding the dynamics of a blockchain ecosystem.`,
              icon: "gtp-overview",
            },
            icon: "gtp-overview",
            key: "ethereum-ecosystem",
            rootKey: "ethereum-ecosystem",
            urlKey: "ethereum-ecosystem",
            url: "/ethereum-ecosystem",
            // showNew: true,
          },
        ],
        href: "/ethereum-ecosystem",
        newChild: true,
      },
    {
    name: "Fundamentals",
    label: "Fundamentals",
    key: "metrics",
    icon: "gtp-fundamentals",
    options: [
      {
        label: "Active Addresses",
        category: "activity",
        page: {
          title: "Active Addresses",
          description:
            "The number of distinct addresses that interacted with a chain. This only includes addresses that initiated a transaction or interacted with a smart contract.",
          why: "Active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
          icon: "gtp-metrics-activeaddresses",
        },
        icon: "gtp-metrics-activeaddresses",
        key: "daa",
        rootKey: "metricsDailyActiveAddresses",
        urlKey: "daily-active-addresses",
        url: "/fundamentals/daily-active-addresses",
      },
      {
        label: "Transaction Count",
        category: "activity",
        page: {
          title: "Transaction Count",
          description:
            "The number of daily transactions. We try to only count transactions that are executed by users/smart contracts - no system transactions.",
          why: "The number of transactions processed on a blockchain is a reliable metric for measuring its usage. However, it should be noted that this metric alone may not provide sufficient insight into the actual value of the transactions being conducted. For instance, while some chains may have a lower transaction count, the value of these transactions may be significantly higher due to their use in decentralized finance (DeFi) applications. On the other hand, certain chains may have a higher transaction count due to their use in gaming or other applications involving lower value transactions.",
          icon: "gtp-metrics-transactioncount",
        },
        icon: "gtp-metrics-transactioncount",
        key: "txcount",
        rootKey: "metricsTxCount",
        urlKey: "transaction-count",
        url: "/fundamentals/transaction-count",
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
        url: "/fundamentals/throughput",
      },
      {
        label: "Stablecoin Supply",
        category: "value-locked",
        page: {
          title: "Stablecoin Supply",
          description: "The value of all stablecoins that are secured by the chain. Stablecoins are cryptocurrencies that attempt to peg their market value to a fiat currency like the U.S. dollar or Euro.",
          why: "Stablecoin supply is a crucial metric for evaluating the growth and development of a blockchain's decentralized finance (DeFi) ecosystem. Stables are a popular choice for use in DeFi applications such as lending, borrowing, and trading. The supply of stablecoins on a particular chain can provide valuable insights into the level of adoption and usage of DeFi applications on the network. A high stablecoin supply is indicative of a robust and thriving DeFi ecosystem, where users are actively engaged in utilizing the various financial applications available on the chain.",
          icon: "gtp-metrics-stablecoinmarketcap",
        },
        icon: "gtp-metrics-stablecoinmarketcap",
        key: "stables_mcap",
        rootKey: "metricsStablesMcap",
        urlKey: "stablecoin-market-cap",
        url: "/fundamentals/stablecoin-market-cap",
      },
      {
        label: "Total Value Secured",
        category: "value-locked",
        page: {
          title: "Total Value Locked",
          description:
            "The sum of all assets secured by the chain, including canonically bridged, externally bridged, and natively issued tokens. Methodology and data is derived from L2Beat.com.",
          why: "TVL is a crucial metric for assessing the success of a blockchain. A high TVL indicates that users have significant trust in the chain's security and reliability, as well as confidence in the usefulness and functionality of the various applications available on the chain.",
          icon: "gtp-metrics-totalvaluelocked",
        },
        icon: "gtp-metrics-totalvaluelocked",
        key: "tvl",
        rootKey: "metricsTvl",
        urlKey: "total-value-secured",
        url: "/fundamentals/total-value-secured",
      },

      // // put navigation items that we want to hide in production here
      // ...(IS_PREVIEW
      //   ? [

      //     ]
      //   : []),

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
          why: "This is the amount that users pay per transaction. On EVM chains, transaction costs depend on the complexity of the transaction (which is measured in gas). A simple transaction, e.g. a native ETH transfer, uses less gas than a more complex transaction, e.g. an ERC20 swap. Hence, we calculated this metric by looking at the median transaction costs. IMX doesn't charge transaction costs.",
          icon: "transaction-costs",
          showGwei: true,
          reversePerformer: true,
        },
        icon: "gtp-metrics-transactioncosts",
        key: "txcosts",
        rootKey: "metricsTxCosts",
        urlKey: "transaction-costs",
        url: "/fundamentals/transaction-costs",
      },
    ],
  },
  {
    name: "Economics",
    label: "Economics",
    key: "economics",
    icon: "gtp-metrics-economics",
    // newChild: true,
    options: [
      {
        label: "Overview",
        page: {
          title: "Overview",
          description: `Our Onchain Economics page breaks down how profitable L2s operate.`,
          icon: "gtp-overview",
        },
        icon: "gtp-overview",
        key: "economics-overview",
        rootKey: "economics",
        urlKey: "economics",
        url: "/economics",
        // showNew: true,
      },
      {
        label: "App Revenue",
        category: "business",
        page: {
          title: "Application Revenue",
          description:
            "The amount of fees that users pay towards applications on the chain. This metric shows how much value applications capture from users. Data is sourced from DefiLlama.com.",
          why: "App Revenue is a key metric for assessing the financial health and success of applications on a blockchain. It reflects the total amount of fees generated by applications, which can be used to measure their popularity and effectiveness. A high App Revenue indicates that users find the applications valuable and are willing to pay for them, while a low App Revenue may suggest that the applications are not meeting user needs or expectations.",
          icon: "gtp-metrics-feespaidbyusers",
        },
        icon: "gtp-metrics-feespaidbyusers",
        key: "app_revenue",
        rootKey: "appRevenue",
        urlKey: "app-revenue",
        url: "/fundamentals/app-revenue",
      },
      {
        label: "Chain Revenue",
        category: "business",
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
        url: "/fundamentals/fees-paid-by-users",
      },
      {
        label: "Rent Paid to L1",
        category: "business",
        page: {
          title: "Rent Paid to L1",
          description:
            "The fees paid by Layer 2s to post transaction data & verification states onto Ethereum. For data availability: Ethereum calldata and blobs are tracked here.",
          why: "Rent paid to L1 quantifies the expenses associated with posting L2 transaction data and proofs onto the Ethereum blockchain. The term 'rent' signifies the gas fees L2s incur to leverage the security of the Ethereum blockchain. This metric provides valuable insights into the value accrual for ETH holders.",
          icon: "gtp-metrics-rentpaidtol1",
        },
        icon: "gtp-metrics-rentpaidtol1",
        key: "rent_paid",
        rootKey: "metricsRentPaid",
        urlKey: "rent-paid",
        url: "/fundamentals/rent-paid",
      },
      {
        label: "Onchain Profit",
        category: "business",
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
        url: "/fundamentals/profit",
      },
      {
        label: "Fully Diluted Valuation",
        category: "market",
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
        url: "/fundamentals/fully-diluted-valuation",
      },
      {
        label: "Market Cap",
        category: "market",
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
          icon: "transaction-costs",
          showGwei: false,
        },
        icon: "gtp-metrics-marketcap",
        key: "market_cap",
        rootKey: "marketCap",
        urlKey: "market-cap",
        url: "/fundamentals/market-cap",
      },
    ],
  },
  {
    name: "Applications",
    label: "Applications",
    icon: "gtp-project",
    options: [
      {
        label: "Overview",
        page: {
          title: "Overview",
          description: `Applications are the lifeblood of any blockchain ecosystem. They drive user engagement, transaction volume, and overall network activity. By analyzing the top applications on a chain, we can gain insights into the most popular use cases and the types of users that are attracted to the platform. This information is crucial for developers, investors, and anyone interested in understanding the dynamics of a blockchain ecosystem.`,
          icon: "gtp-overview",
        },
        icon: "gtp-overview",
        key: "applications-overview",
        rootKey: "applications",
        urlKey: "applications",
        url: "/applications",
        // showNew: true,
      },
    ],
    href: "/applications",
    newChild: true,
  },
  {
    name: "Blockspace",
    label: "Blockspace",
    icon: "gtp-blockspace",
    options: [
      {
        label: "Chain Overview",
        category: "blockspace-categories",
        page: {
          title: "Chain Overview",
          description: `We measure the gas fees spent and the number of transactions sent to smart contracts. We then map these smart contracts to distinct categories. The chart below breaks down the total blockspace of a chain into these categories. Each category is made up of multiple subcategories, which are listed in the mapping table below the chart.
            Toggling between the "Absolute" and "Share of Chain Usage" options shows either the absolute amount of gas fees/transactions, or the share of the chain's total blockspace.`,
          icon: "blockspace-chain-overview",
        },
        icon: "gtp-chain",
        key: "chain-overview",
        rootKey: "chainOverview",
        urlKey: "chain-overview",
        url: "/blockspace/chain-overview",
        excludeFromSitemap: true,
      },
      {
        label: "Category Comparison",
        category: "blockspace-categories",
        page: {
          title: "Category Comparison",
          description:
            "How are certain blockspace categories used on different chains? Explore the varied applications of blockspace categories across Ethereum Layer-2s.",
        },
        icon: "gtp-compare",
        key: "category-comparison",
        rootKey: "categoryComparison",
        urlKey: "category-comparison",
        url: "/blockspace/category-comparison",
      },
      // {
      //   label: "Applications",
      //   category: "blockspace-applications",
      //   page: {
      //     title: "Applications",
      //     description:
      //       "The top applications on a chain, ranked by the amount of gas fees spent and transactions sent to their smart contracts.",
      //   },
      //   icon: "gtp-project",
      //   key: "applications",
      //   rootKey: "applications",
      //   urlKey: "applications",
      //   url: "/applications",
      // },
      {
        label: "Contracts",
        category: "contracts",
        page: {
          title: "Contracts",
          description:
            "The number of contracts created in the last 24 hours. Methodology and data is derived from L2Beat.com.",
          icon: "gtp-labeled",
        },
        icon: "gtp-labeled",
        key: "contracts",
        rootKey: "contracts",
        urlKey: "contracts",
        url: "https://labels.growthepie.com/",
      },
    ],

    // href: "",
  },
  ...[dataAvailabilityGroup],
  {
    name: "Trackers",
    label: "Public Goods",
    icon: "tracker",
    options: [
      {
        label: "OP RetroPGF 3",
        icon: "optimism-logo-monochrome",
        category: "public-goods-funding",
        key: "rpgf3",
        rootKey: "rpgf3",
        urlKey: "optimism-retropgf-3",
        url: "/trackers/optimism-retropgf-3",
      },
      {
        label: "Octant",
        icon: "octant-monochrome",
        category: "public-goods-funding",
        key: "octant",
        rootKey: "octant",
        urlKey: "octant",
        url: "/trackers/octant",
        // showNew: false,
      },
      {
        label: "Glo Dollar",
        icon: "glo-dollar-monochrome",
        category: "public-goods-funding",
        key: "glodollar",
        rootKey: "glodollar",
        urlKey: "glodollar",
        url: "/trackers/glodollar",
      },
    ],
  },

  // // put navigation items that we want to hide in production here
  // ...(IS_PREVIEW
  //   ? [
  // {
  //   name: "Blog",
  //   label: "Blog",
  //   icon: "blog",
  //   options: [],
  //   href: "https://mirror.xyz/blog.growthepie.eth",
  // },

  //   ]
  // : []),
];

export const contributorsItem: NavigationItem = {
  name: "Contributors",
  label: "Contributors",
  icon: "compass",
  options: [],
  href: "/contributors",
};

export const getFundamentalsByKey = (() => {
  const fundamentalsByKey = {};

  // Loop through each item in navigationItems
  for (const item of navigationItems) {
    if (
      item.key &&
      ["metrics", "economics"].includes(item.key) &&
      item.options &&
      item.options.length > 0
    ) {
      // Loop through each option
      for (const option of item.options) {
        if (option.key) {
          fundamentalsByKey[option.key] = option;
        }
      }
    }
  }

  return fundamentalsByKey;
})();

export const apiDocsItem: NavigationItem = {
  name: "API Documentation",
  label: "API Documentation",
  icon: "file-text",
  options: [],
  href: "https://docs.growthepie.com/api",
};
