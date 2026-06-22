import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "./helpers";
import { MasterURL } from "./urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import QUICK_BITES_DATA from "@/lib/quick-bites/index";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { metricPagesByKey, type MetricItem } from "@/lib/metrics";

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
    // Page content for metric options is sourced from `metricPagesByKey` in
    // `lib/metrics.tsx` (single source of truth). Non-metric options (overviews,
    // blockspace, etc.) still declare their `page` inline.
    page?: MetricItem["page"];
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
  latest: {
    label: "Latest",
    icon: "feather:clock",
    group: "quick-bites",
  },
  "public-funding": {
    label: "Public Funding",
    icon: "feather:sun",
    group: "quick-bites",
  }

};

const dataAvailabilityGroup: NavigationItem = {
  name: "Data Availability",
  label: "Data Availability",
  key: "metrics",
  icon: "gtp-data-availability",
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
    },
    {
      label: "Blob Count",
      category: "metrics",
      page: metricPagesByKey["blob_count"],
      icon: "gtp-blobs-number",
      key: "blob_count",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "blob-count",
      url: "/data-availability/blob-count",
    },
    {
      label: "DA Consumers",
      category: "metrics",
      page: metricPagesByKey["blob_producers"],
      icon: "gtp-blob-producers",
      key: "blob_producers",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "da-consumers",
      url: "/data-availability/da-consumers",
    },
    {
      label: "Data Posted",
      category: "metrics",
      page: metricPagesByKey["data_posted"],
      icon: "gtp-data-posted",
      key: "data_posted",
      rootKey: "metricsDailyActiveAddresses",
      urlKey: "data-posted",
      url: "/data-availability/data-posted",
    },
    {
      label: "Fees Paid",
      category: "metrics",
      page: metricPagesByKey["fees_paid"],
      icon: "gtp-da-fees-paid",
      key: "fees_paid",
      rootKey: "metricsTxCount",
      urlKey: "fees-paid",
      url: "/data-availability/fees-paid",
    },
    {
      label: "Fees Paid Per MB",
      category: "metrics",
      page: metricPagesByKey["fees_per_mbyte"],
      icon: "gtp-da-fees-paid-per-mb",
      key: "fees_per_mbyte",
      rootKey: "throughput",
      urlKey: "fees-paid-per-megabyte",
      url: "/data-availability/fees-paid-per-megabyte",
    },
  ],
};

const quickBitesGroup: NavigationItem = {
  name: "Quick Bites",
  label: "Quick Bites",
  icon: "gtp-quick-bites",
  newChild: false,
  options: [
    {
      label: "All Quick Bites",
      page: {
        title: "All Quick Bites",
        description: `An overview of all available articles and research released by the growthepie team.`,
        icon: "gtp-overview",
      },
      icon: "gtp-overview",
      key: "quick-bites-overview",
      rootKey: "quick-bites",
      urlKey: "quick-bites",
      url: "/quick-bites",
    },
    ...Object.entries(QUICK_BITES_DATA)
      .reverse()
      .filter(([slug]) => QUICK_BITES_DATA[slug].showInMenu === true)
      .slice(0, 5)
      .map(([slug, data], index) => ({
        label: data.shortTitle,
        icon: "gtp-chevronright" as GTPIconName,
        category: "latest",
        key: slug,
        rootKey: slug,
        urlKey: slug,
        url: `/quick-bites/${slug}`,
        group: "latest",
        // showNew: index === 0,
      })),
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
        showNew: false,
      },
    ],
    href: "/ethereum-ecosystem/metrics",
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
      },
    ],
    href: "/applications",
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
        page: metricPagesByKey["daa"],
        icon: "gtp-metrics-activeaddresses",
        key: "daa",
        rootKey: "metricsDailyActiveAddresses",
        urlKey: "daily-active-addresses",
        url: "/fundamentals/daily-active-addresses",
      },
      {
        label: "Transaction Count",
        category: "activity",
        page: metricPagesByKey["txcount"],
        icon: "gtp-metrics-transactioncount",
        key: "txcount",
        rootKey: "metricsTxCount",
        urlKey: "transaction-count",
        url: "/fundamentals/transaction-count",
      },
      {
        label: "Throughput",
        category: "activity",
        page: metricPagesByKey["throughput"],
        icon: "gtp-metrics-throughput",
        key: "throughput",
        rootKey: "throughput",
        urlKey: "throughput",
        url: "/fundamentals/throughput",
      },
      {
        label: "Stablecoin Supply",
        category: "value-locked",
        page: metricPagesByKey["stables_mcap"],
        icon: "gtp-metrics-stablecoinmarketcap",
        key: "stables_mcap",
        rootKey: "metricsStablesMcap",
        urlKey: "stablecoin-market-cap",
        url: "/fundamentals/stablecoin-market-cap",
      },
      {
        label: "Total Value Secured",
        category: "value-locked",
        page: metricPagesByKey["tvl"],
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
        page: metricPagesByKey["txcosts"],
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
      },
      {
        label: "App Revenue",
        category: "business",
        page: metricPagesByKey["app_revenue"],
        icon: "gtp-metrics-feespaidbyusers",
        key: "app_revenue",
        rootKey: "appRevenue",
        urlKey: "app-revenue",
        url: "/fundamentals/app-revenue",
      },
      {
        label: "Chain Revenue",
        category: "business",
        page: metricPagesByKey["fees"],
        icon: "gtp-metrics-feespaidbyusers",
        key: "fees",
        rootKey: "metricsFeesPaidToEthereum",
        urlKey: "fees-paid-by-users",
        url: "/fundamentals/fees-paid-by-users",
      },
      {
        label: "Rent Paid to L1",
        category: "business",
        page: metricPagesByKey["rent_paid"],
        icon: "gtp-metrics-rentpaidtol1",
        key: "rent_paid",
        rootKey: "metricsRentPaid",
        urlKey: "rent-paid",
        url: "/fundamentals/rent-paid",
      },
      {
        label: "Onchain Profit",
        category: "business",
        page: metricPagesByKey["profit"],
        icon: "gtp-metrics-onchainprofit",
        key: "profit",
        rootKey: "metricsEarnings",
        urlKey: "profit",
        url: "/fundamentals/profit",
      },
      {
        label: "Fully Diluted Valuation",
        category: "market",
        page: metricPagesByKey["fdv"],
        icon: "gtp-metrics-fdv",
        key: "fdv",
        rootKey: "metricsFullyDilutedValuation",
        urlKey: "fully-diluted-valuation",
        url: "/fundamentals/fully-diluted-valuation",
      },
      {
        label: "Market Cap",
        category: "market",
        page: metricPagesByKey["market_cap"],
        icon: "gtp-metrics-marketcap",
        key: "market_cap",
        rootKey: "marketCap",
        urlKey: "market-cap",
        url: "/fundamentals/market-cap",
      },
    ],
  },
  quickBitesGroup,
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
      },
      {
        label: "Treemap",
        category: "blockspace-categories",
        page: {
          title: "Treemap",
          description:
            "Explore blockspace usage as a nested treemap from chains to categories and applications.",
        },
        icon: "gtp-map",
        key: "treemap",
        rootKey: "treemap",
        urlKey: "treemap",
        url: "/blockspace/treemap",
        //hide: IS_PRODUCTION,
        //excludeFromSitemap: IS_PRODUCTION,
        showNew: false,
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
    newChild: false,
    // href: "",
  },
  ...[dataAvailabilityGroup],


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
  href: "https://docs.growthepie.com/api-reference/api",
};
