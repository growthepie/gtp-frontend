import { IS_PREVIEW } from "./helpers";

export type NavigationItem = {
  name: string;
  label: string;
  page?: {
    title: string;
    description: string;
  };
  key?: string;
  icon: string;
  options: {
    label: string;
    page?: {
      title?: string;
      description: string;
      note?: string | React.ReactNode;
      why?: string;
      icon?: string;
      showGwei?: boolean;
      reversePerformer?: boolean;
    };
    icon: string;
    key?: string;
    rootKey?: string;
    urlKey: string;
  }[];
  href?: string;
};

export const navigationItems: NavigationItem[] = [
  {
    name: "Home",
    label: "Home",
    key: "home",
    icon: "gtp:house",
    options: [],
    href: "/",
  },
  {
    name: "Fundamentals",
    label: "Fundamentals",
    key: "metrics",
    icon: "gtp:fundamentals",
    options: [
      {
        label: "Transaction Count",
        page: {
          title: "Transaction Count",
          description: "The number of daily transactions.",
          why: "The number of transactions processed on a blockchain is a reliable metric for measuring its usage. However, it should be noted that this metric alone may not provide sufficient insight into the actual value of the transactions being conducted. For instance, while some chains may have a lower transaction count, the value of these transactions may be significantly higher due to their use in decentralized finance (DeFi) applications. On the other hand, certain chains may have a higher transaction count due to their use in gaming or other applications involving lower value transactions.",
          icon: "feather:clock",
        },
        icon: "feather:clock",
        key: "txcount",
        rootKey: "metricsTxCount",
        urlKey: "transaction-count",
      },
      {
        label: "Daily Active Addresses",
        page: {
          title: "Daily Active Addresses",
          description:
            "The number of unique daily addresses that interacted with a chain.",
          why: "Daily active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
          icon: "feather:sunrise",
        },
        icon: "feather:sunrise",
        key: "daa",
        rootKey: "metricsDailyActiveAddresses",
        urlKey: "daily-active-addresses",
      },
      {
        label: "Transaction Costs",
        page: {
          title: "Transaction Costs",
          description: "The median amount that is paid per transaction.",
          note: (
            <>
              1 Billion <b className="font-semibold">Gwei</b> equals 1{" "}
              <b className="font-semibold">ETH</b>.
            </>
          ),
          why: "This is the amount that users pay per transaction. On EVM chains, transaction costs depend on the complexity of the transaction (which is measured in gas). A simple transaction, e.g. a native ETH transfer, uses less gas than a more complex transaction, e.g. an ERC20 swap. Hence, we calculated this metric by looking at the median transaction costs. IMX doesn't charge transaction costs.",
          icon: "gtp:transaction-costs",
          showGwei: true,
          reversePerformer: true,
        },
        icon: "gtp:transaction-costs",
        key: "txcosts",
        rootKey: "metricsTxCosts",
        urlKey: "transaction-costs",
      },
      // // put navigation items that we want to hide in production here
      // ...(IS_PREVIEW
      //   ? [

      //     ]
      //   : []),
      {
        label: "Total Value Locked",
        page: {
          title: "TVL On-Chain",
          description:
            "The sum of all funds locked on the chain. Methodology and data is derived from L2Beat.com.",
          why: "TVL is a crucial metric for assessing the success of a blockchain. A high TVL indicates that users have significant trust in the chain's security and reliability, as well as confidence in the usefulness and functionality of the various applications available on the chain.",
          icon: "feather:star",
        },
        icon: "feather:star",
        key: "tvl",
        rootKey: "metricsTvl",
        urlKey: "total-value-locked",
      },
      {
        label: "Fees Paid by Users",
        page: {
          title: "Fees Paid by Users",
          description:
            "The sum of fees that were paid by users of the chain in gas fees or, in the case of chains like Immutable X,  the amount of fees that were paid to the protocol wallet.",
          why: "Fees paid by users is a critical metric for measuring a blockchain's adoption and revenue generation. A high fee revenue can be an indication that users find the chain's applications and security valuable, and are willing to pay for it. This metric is often referred to as a chain's revenue, as it reflects the total amount of income generated by the network.",
          icon: "feather:credit-card",
        },
        icon: "feather:credit-card",
        key: "fees",
        rootKey: "metricsFeesPaidToEthereum",
        urlKey: "fees-paid-by-users",
      },
      {
        label: "Stablecoin Market Cap",
        page: {
          title: "Stablecoin Market Cap",
          description: "The sum of stablecoins that are locked on the chain.",
          why: "Stablecoin market cap is a crucial metric for evaluating the growth and development of a blockchain's decentralized finance (DeFi) ecosystem.Stables are a popular choice for use in DeFi applications such as lending, borrowing, and trading. The market cap of stablecoins on a particular chain can provide valuable insights into the level of adoption and usage of DeFi applications on the network. A high stablecoin market cap is indicative of a robust and thriving DeFi ecosystem, where users are actively engaged in utilizing the various financial applications available on the chain.",
          icon: "feather:dollar-sign",
        },
        icon: "feather:dollar-sign",
        key: "stables_mcap",
        rootKey: "metricsStablesMcap",
        urlKey: "stablecoin-market-cap",
      },

      // {
      //   label: "24h Contract Usage",
      //   page: {
      //     title: "24h Contract Usage",
      //     description:
      //       "The number of contracts created in the last 24 hours. Methodology and data is derived from L2Beat.com.",
      //     why: "",
      //     icon: "ion:time-outline",
      //   },
      //   icon: "ion:time-outline",
      //   key: "24hcontractusage",
      //   rootKey: "metrics24hContractUsage",
      //   urlKey: "24h-contract-usage",
      // },
      // {
      //   label: "Transactions/Second",
      //   icon: "ant-design:transaction-outlined",
      //   key: "txpersecond",
      //   rootKey: "metricsTransactionsPerSecond",
      //   urlKey: "transactions-per-second",
      // },

      // {
      //   label: "New Addresses",
      //   icon: "bx:bx-user-plus",
      //   key: "newaddresses",
      //   rootKey: "metricsNewAddresses",
      //   urlKey: "new-addresses",
      // },
      // {
      //   label: "Total Addresses",
      //   icon: "ph:address-book",
      //   key: "totaladdresses",
      //   rootKey: "metricsTotalAddresses",
      //   urlKey: "total-addresses",
      // },
    ],
  },
  {
    name: "Blockspace",
    label: "Blockspace",
    icon: "gtp:package",
    options: [
      {
        label: "Chain Overview",
        page: {
          title: "Chain Overview",
          description:
            "An overview of chains' high-level blockspace usage. All expressed in shares of a chain's total blockspace.",
          icon: "gtp:blockspace-chain-overview",
        },
        icon: "gtp:blockspace-chain-overview",
        key: "chain-overview",
        rootKey: "chainOverview",
        urlKey: "chain-overview",
      },
      {
        label: "Category Comparison",
        page: {
          title: "Category Comparison",
          description:
            "How are certain blockspace categories used on different chains?",
        },
        icon: "gtp:blockspace-category-comparison",
        key: "category-comparison",
        rootKey: "categoryComparison",
        urlKey: "category-comparison",
      },
    ],
    // href: "",
  },
  {
    name: "Chains",
    label: "Single Chain",
    key: "chains",
    icon: "gtp:link",
    options: [
      {
        label: "Ethereum",
        page: {
          description:
            "Ethereum serves as the base layer (Layer 1 or L1) for various Layer 2 (L2) scaling solutions, which aim to improve transaction throughput and reduce costs. As the foundational layer, Ethereum anchors these L2 networks, ensuring they inherit its robust security and trustlessness.",
        },
        icon: "gtp:ethereum-logo-monochrome",
        key: "ethereum",
        rootKey: "chainsEthereum",
        urlKey: "ethereum",
      },
      {
        label: "Arbitrum",
        page: {
          description:
            "Arbitrum One is developed by Offchain Labs and its mainnet launched in September 2021. It uses an optimistic rollup approach and is fully compatible with the Ethereum Virtual Machine (EVM), making it developer-friendly.",
        },
        icon: "gtp:arbitrum-logo-monochrome",
        key: "arbitrum",
        rootKey: "chainsArbitrum",
        urlKey: "arbitrum",
      },
      {
        label: "Immutable X",
        page: {
          description:
            "Immutable X is an optimized game-specific zk rollup. It is designed to mint, transfer, and trade tokens and NFTs at higher volumes and zero gas fees. It is not EVM compatible but its easy-to-use APIs and SDKs aim to make development for game devs as easy as possible. It launched in April 2021.",
        },
        icon: "gtp:immutable-x-logo-monochrome",
        key: "imx",
        rootKey: "chainsImmutableX",
        urlKey: "immutable-x",
      },
      {
        label: "Polygon zkEVM",
        page: {
          description:
            "Polygon zkEVM uses zero-knowledge proofs to enable faster and cheaper transactions. It allows users to build and run EVM-compatible smart contracts, achieving up to 100x lower gas fees and up to 2,000x faster transaction speeds than the Ethereum mainnet. It's fully compatible with the Ethereum Virtual Machine, making it easy for developers to migrate their applications to the Polygon network. It launched in March 2023.",
        },
        icon: "gtp:polygon-zkevm-logo-monochrome",
        key: "polygon_zkevm",
        rootKey: "chainsPolygon",
        urlKey: "polygon-zkevm",
      },
      {
        label: "OP Mainnet",
        page: {
          description:
            "OP Mainnet (formerly Optimism) uses an optimistic rollup approach, where transactions are assumed to be valid unless proven otherwise, and only invalid transactions are rolled back. OP Mainnet launched in August 2021, making it one of the first rollups. It is fully compatible with the Ethereum Virtual Machine (EVM), making it easy for developers to migrate their applications to the OP Mainnet network.",
        },
        icon: "gtp:optimism-logo-monochrome",
        key: "optimism",
        rootKey: "chainsOptimism",
        urlKey: "optimism",
      },
      {
        label: "zkSync Era",
        page: {
          description: "",
        },
        icon: "gtp:zksync-era-logo-monochrome",
        key: "zksync_era",
        rootKey: "chainsOptimism",
        urlKey: "zksync-era",
      },
      // {
      //   label: "Loopring",
      //   page: {
      //     description: "",
      //   },
      //   icon: "gtp:loopring-logo-monochrome",
      //   key: "loopring",
      //   rootKey: "chainsLoopring",
      //   urlKey: "loopring",
      // },
      // {
      //   label: "Aztec V2",
      //   page: {
      //     description: "",
      //   },
      //   icon: "gtp:immutable-x-logo-monochrome",
      //   key: "aztecv2",
      //   rootKey: "chainsAztecV2",
      //   urlKey: "aztec-v2",
      // },
    ],
  },

  {
    name: "Wiki",
    label: "Wiki",
    icon: "gtp:book-open",
    options: [],
    href: "https://docs.growthepie.xyz/",
  },
  {
    name: "API Documentation",
    label: "API Documentation",
    icon: "gtp:file-text",
    options: [],
    href: "https://docs.growthepie.xyz/api",
  },
];

export const contributorsItem: NavigationItem = {
  name: "Contributors",
  label: "Contributors",
  icon: "gtp:compass",
  options: [],
  href: "/contributors",
};
