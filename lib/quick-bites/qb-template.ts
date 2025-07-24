import { QuickBiteData } from '@/lib/types/quickBites';

/**
 * Quick Bite Template
 * 
 * Copy this file and rename it to create a new Quick Bite.
 * Replace all placeholder content with your actual data.
 * 
 * 📖 Full documentation: ./README.md
 */

const myQuickBite: QuickBiteData = {
  title: "Your Quick Bite Title",
  subtitle: "Brief description of what this analysis covers",
  content: [
    "# Main Heading",
    "Your introduction text goes here. You can use **bold text** and reference dynamic values like {{dynamicValue}}.",
    "",
    "## Section Heading", 
    "More content here.",
    "",
    "> Important callout or key insight",
    "",
    "## Key Metrics",
    "```kpi-cards",
    JSON.stringify([
      {
        title: "Metric Name",
        value: "{{apiValue}}",
        description: "Metric description",
        icon: "gtp-realtime",
        info: "Additional context"
      }
    ]),
    "```",
    "",
    "## Chart Section",
    "```chart",
    JSON.stringify({
      type: "line", // line, column, area, pie
      title: "Chart Title",
      subtitle: "Chart subtitle",
      stacking: null, // null, "normal", "percent"
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Series Name",
          color: "#19D9D6",
          xIndex: 1, // timestamp column
          yIndex: 0, // value column
          url: "https://api.growthepie.com/v1/your-endpoint.json",
          pathToData: "data.your_data.daily.values"
        }]
      },
      height: 400,
      caption: "Chart caption and data source"
    }),
    "```",
    "",
    "Your conclusion text goes here."
  ],
  image: "https://api.growthepie.com/v1/quick-bites/banners/your-banner.png",
  date: "2025-01-15", // YYYY-MM-DD format
  icon: "your-icon-name", // Check available icons
  related: [], // Related URLs like ["/chains/arbitrum"]
  author: [{
    name: "Your Name",
    xUsername: "your_twitter"
  }],
  topics: [{
    icon: "loopring-logo-monochrome",
    color: "#2151F5",
    name: "Topic Name",
    url: "/relevant/path"
  }]
};

export default myQuickBite; 