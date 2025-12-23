import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const averageAddress: QuickBiteData = createQuickBite({
  title: "The Average Address",
  subtitle: "Understanding the typical blockchain address and its characteristics",
  shortTitle: "Avg Address",
  content: [
    "# The Average Address",
    
    "The average address on a blockchain represents the typical user experience and behavior patterns across the network. Understanding what makes an address 'average' provides valuable insights into network health, user distribution, and economic activity.",
    
    "## Active Addresses vs Transaction Count",
    
    "The relationship between active addresses and transaction count reveals how engaged users are on each network. A scatter plot comparing these metrics shows whether networks have high activity per address or many addresses with lower individual activity.",
    
    "```chains-scatter-chart",
    "```",
    
    "## Daily Data Projection (Last 1 Day × 30)",

    "This chart projects 30-day activity based on the last 24 hours of data, providing an alternative view of network engagement. It helps to identify recent shifts in activity that might be obscured by longer-term averages.",

    "```chains-scatter-chart-daily",
    "```",

    "## Data Comparison",

    "The table below compares actual 30-day data with daily projections (last 1 day × 30) to show how recent activity patterns compare to longer-term averages.",

    "```chains-scatter-comparison-table",
    "```",
    
    "## Key Insights",
    
    "The average address metric helps identify trends in network adoption, user behavior, and economic distribution. By tracking how the average address evolves over time, we can better understand whether a network is becoming more accessible, more concentrated, or more active.",
    
    "> The average address provides a snapshot of typical user experience, but it's important to consider the distribution of wealth and activity to get a complete picture of network health.",
  ],
  image: "/quick-bites/average-address.webp",
  og_image: "/quick-bites/average-address.webp",
  date: new Date().toISOString().split('T')[0],
  related: [],
  author: [],
  topics: [
    {
      name: "Fundamentals",
      url: "/fundamentals"
    }
  ],
  icon: "gtp-metrics-activeaddresses",
  showInMenu: true
});

export default averageAddress;

