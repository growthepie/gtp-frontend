# Quick Bites Documentation

Quick Bites are data-driven content pieces that combine text, charts, and interactive elements to tell compelling stories about blockchain and Layer 2 ecosystem data.

## Table of Contents

- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [QuickBiteData Properties](#quickbitedata-properties)
- [Content Blocks](#content-blocks)
- [Chart Configuration](#chart-configuration)
- [Examples](#examples)
- [Publishing](#publishing)

## Quick Start

1. **Copy the template**: Start with `qb-template.ts` as your base
2. **Rename the file**: `qb-my-analysis.ts` (use your actual topic)
3. **Replace placeholder content** with your actual data and analysis
4. **Test locally** to ensure all blocks render correctly
5. **Add to index**: Import and add to `QUICK_BITES_DATA` in `index.ts`

### Alternative: From Scratch
1. **Create a new file** in the `lib/quick-bites/` folder
2. **Import the type + helper**:  
   `import { QuickBiteData } from '@/lib/types/quickBites';`  
   `import { createQuickBite } from '@/lib/quick-bites/createQuickBite';`
3. **Wrap your data object** with `createQuickBite({ ... })` to enforce required props (like `shortTitle`)
4. **Export as default**: `export default myQuickBite;`

## File Structure

```
lib/quick-bites/
├── README.md              # This documentation
├── index.ts               # Export registry
├── qb-template.ts         # Clean template to copy
├── qb-test-bite.ts        # Complete examples of all features
├── qb-my-analysis.ts      # Your new Quick Bite
└── ...
```

## QuickBiteData Properties

All properties are required unless marked as optional:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `title` | `string` | Main headline | `"Arbitrum Timeboost Revenue Analysis"` |
| `subtitle` | `string` | Supporting description | `"How the new fee mechanism is performing"` |
| `shortTitle` | `string` | ≤20 char label for cards, menus, SEO | `"Arbitrum Fees"` |
| `summary` | `string` | Short 1-2 sentence summary for SEO | `"xxx"` |
| `content` | `string[]` | Array of content blocks | `["# Header", "Text content", "```chart"]` |
| `image` | `string` | Banner image URL | `"https://api.growthepie.com/v1/quick-bites/banners/timeboost.png"` |
| `date` | `string` | Publication date (YYYY-MM-DD) | `"2025-01-15"` |
| `icon` | `string` | Icon identifier | `"arbitrum-logo-monochrome"` |
| `related` | `string[]` | URLs to related content | `["/chains/arbitrum"]` |
| `author` | `Author[]` | *Optional* Author information | `[{name: "John Doe", xUsername: "johndoe"}]` |
| `topics` | `Topic[]` | *Optional* Related topics/tags | `[{icon: "base-logo", color: "#2151F5", name: "Base", url: "/chains/base"}]` |

> `shortTitle` is **required** and capped at 20 characters. The `createQuickBite` helper will throw during build if it’s missing or too long.

For detailed type definitions, see `@/lib/types/quickBites.ts`.

## Content Blocks

Content is defined as an array of strings where each string represents a content block. Here are the available block types:

### Text Content

- **Regular text**: Plain string
- **Headers**: `# Main Header` or `## Subheader`
- **Bold text**: `**bold text**`
- **Callouts**: `> Important message!`
- **Lists**: `- List item`
- **Dynamic values**: `{{variableName}}` (replaced by API data)

### Special Blocks

#### KPI Cards
```typescript
"```kpi-cards",
JSON.stringify([
  {
    title: "Total Revenue",
    value: "{{totalRevenue}} ETH",
    description: "Since launch",
    icon: "gtp-realtime",
    info: "Revenue from all sources"
  }
]),
"```"
```

#### Live Metrics Card
```typescript
"```live-metrics",
JSON.stringify({
  title: "Transactions Per Second",
  icon: "gtp-metrics-transactionspersecond",
  dataUrl: "https://sse.growthepie.com/api/chain/arbitrum",
  dataPath: "data",
  refreshInterval: 10000,
  chart: {
    dataPath: "history",
    valueKey: "tps",
    timeKey: "timestamp",
    metricLabel: "TPS",
    overrideColor: ["#2151F5", "#19D9D6"],
    centerWatermark: true
  },
  metricsLeft: [
    {
      label: "Block Time",
      valuePath: "block_time",
      valueFormat: { type: "duration" }
    },
    {
      label: "All-Time High",
      valuePath: "ath",
      valueFormat: { suffix: " TPS", maxDecimals: 0 },
      hoverValuePath: "ath_timestamp",
      hoverFormat: { type: "date" }
    }
  ],
  metricsRight: [
    {
      label: "24h Peak",
      valuePath: "24h_high",
      valueFormat: { suffix: " TPS", maxDecimals: 0 },
      hoverValuePath: "24h_high_timestamp",
      hoverFormat: { type: "date" }
    }
  ],
  liveMetric: {
    label: "Current TPS",
    valuePath: "tps",
    valueFormat: { maxDecimals: 1, suffix: " TPS" },
    accentColor: "#2151F5"
  }
}),
"```"
```

You can also render `feeDisplayRows` instead of a chart inside a live metrics card:

```typescript
"```live-metrics",
JSON.stringify({
  title: "Token Transfer Fees",
  icon: "gtp-growthepie-fees",
  dataUrl: "https://sse.growthepie.com/api/ethereum",
  dataPath: "data",
  historyUrl: "https://sse.growthepie.com/api/ethereum/history",
  historyPath: "history",
  feeDisplayRows: [
    {
      title: "Ethereum Mainnet",
      valuePath: "tx_cost_erc20_transfer_usd",
      historyPath: "history",
      valueKey: "tx_cost_erc20_transfer_usd",
      showUsd: true,
      hoverText: "new block every ~12s"
    }
  ]
}),
"```"
```

> `chart` and `feeDisplayRows` are mutually exclusive. If both are provided, `chart` is ignored.
> For now, only the first `feeDisplayRows` entry is rendered.

#### Live Metrics Row (up to 3 cards)
```typescript
"```live-metrics-row",
JSON.stringify({
  items: [
    {
      title: "TPS (Arbitrum)",
      icon: "gtp-metrics-transactionspersecond",
      layout: "chart-right",
      dataUrl: "https://sse.growthepie.com/api/chain/arbitrum/history",
      dataPath: "history.0",
      chart: {
        dataPath: "history",
        valueKey: "tps",
        timeKey: "timestamp",
        metricLabel: "TPS",
        centerWatermark: true
      },
      liveMetric: {
        label: "Current TPS",
        valuePath: "tps",
        valueFormat: { maxDecimals: 1, suffix: " TPS" }
      }
    },
    {
      title: "TPS (Base)",
      icon: "gtp-metrics-transactionspersecond",
      layout: "chart-right",
      dataUrl: "https://sse.growthepie.com/api/chain/base/history",
      dataPath: "history.0",
      chart: {
        dataPath: "history",
        valueKey: "tps",
        timeKey: "timestamp",
        metricLabel: "TPS",
        centerWatermark: true
      },
      liveMetric: {
        label: "Current TPS",
        valuePath: "tps",
        valueFormat: { maxDecimals: 1, suffix: " TPS" }
      }
    }
  ],
  className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[10px]"
}),
"```"
```

#### Charts
```typescript
"```chart",
JSON.stringify({
  type: "line", // line, column, area, pie
  title: "Daily Active Users",
  subtitle: "Growth across L2s",
  stacking: "normal", // normal, percent, null
  showXAsDate: true,
  dataAsJson: {
    meta: [{
      name: "Arbitrum",
      color: "#19D9D6",
      xIndex: 0,
      yIndex: 1,
      url: "https://api.growthepie.com/v1/data.json",
      pathToData: "data.arbitrum.daily.values"
    }]
  },
  height: 400
}),
"```"
```

#### Tables
```typescript
"```table",
JSON.stringify({
  content: "Comparison of Layer 2 networks by key metrics",
  columnKeys: {
    name: {
      sortByValue: false,
      label: "Network"
    },
    tvl: {
      sortByValue: true,
      label: "TVL (USD)"
    },
    daily_txns: {
      sortByValue: true,
      label: "Daily Transactions"
    },
    avg_fee: {
      sortByValue: true,
      label: "Average Fee"
    }
  },
  columnSortBy: "value", // "value", "name", or undefined
  rowData: {
    "Arbitrum": {
      name: {
        value: "Arbitrum",
        icon: "arbitrum-logo-monochrome",
        color: "#28A0F0",
        link: "/chains/arbitrum"
      },
      tvl: {
        value: 18500000000,
        icon: undefined,
        color: undefined,
        link: undefined
      },
      daily_txns: {
        value: 1200000,
        icon: undefined,
        color: undefined,
        link: undefined
      },
      avg_fee: {
        value: 0.25,
        icon: undefined,
        color: undefined,
        link: undefined
      }
    }
    // ... more rows
  }
}),
"```"
```

**Table Features:**
- **Sortable columns**: Click headers to sort (only when `sortByValue: true`)
- **Custom labels**: Use `label` property for display names
- **Icons and colors**: Add visual elements to cells
- **Clickable links**: Add `link` property for navigation
- **Responsive design**: Horizontal scroll on mobile devices
- **Value formatting**: Numbers automatically formatted with commas

#### Embedded iFrames
```typescript
"```iframe",
JSON.stringify({
  src: "https://www.growthepie.com/embed/fundamentals/daily-active-addresses",
  width: "100%",
  height: "500px",
  caption: "Daily active addresses comparison"
}),
"```"
```

#### Images
```typescript
"```image",
JSON.stringify({
  src: "https://example.com/image.png",
  alt: "Chart description",
  width: "800",
  height: "400",
  caption: "Source: growthepie.com"
}),
"```"
```

#### Code Blocks
```typescript
"```typescript",
"interface Example {",
"  property: string;",
"}",
"```"
```

## Chart Configuration

### Chart Types

- **`line`**: Best for time series comparisons (2-5 entities)
- **`column`**: Best for discrete comparisons with limited timestamps (≤180)
- **`area`**: Best for showing composition over time (90+ timestamps)
- **`pie`**: Best for showing proportions at a single point in time

### Stacking Options

- **`"normal"`**: Stack values on top of each other
- **`"percent"`**: Show as percentage composition (0-100%)
- **`null`**: No stacking (overlay)

### Data Configuration

#### Single Series (Simple)
```typescript
dataAsJson: {
  data: [[timestamp1, value1], [timestamp2, value2], ...],
  name: "Series Name",
  color: "#FF0000"
}
```

#### Multiple Series (Advanced)
```typescript
dataAsJson: {
  meta: [
    {
      name: "Ethereum",
      color: "#94ABD3",
      xIndex: 1, // timestamp column
      yIndex: 0, // value column
      url: "https://api.growthepie.com/v1/data.json",
      pathToData: "data.ethereum.daily.values",
      dashStyle: "solid", // solid, Dash, Dot, etc.
      tooltipDecimals: 2,
      suffix: " ETH",
      prefix: "Ξ"
    }
  ]
}
```

### Data Sources

Data can come from:
1. **API URLs**: Specify `url` and `pathToData` in meta
2. **Inline JSON**: Provide `data` array directly
3. **Dynamic values**: Use `{{variableName}}` that gets replaced at runtime

## Examples

### Simple Text Content
```typescript
content: [
  "# Layer 2 Adoption Surge",
  "The Layer 2 ecosystem has seen **unprecedented growth** in 2024.",
  "",
  "## Key Metrics",
  "- Daily transactions: **{{totalTxs}}**",
  "- Total value locked: **${{totalTVL}}B**",
  "",
  "> This represents a 300% increase from last year!"
]
```

### Chart with Multiple Series
```typescript
content: [
  "## Transaction Volume Comparison",
  "```chart",
  JSON.stringify({
    type: "area",
    title: "Daily Transaction Count",
    subtitle: "L2 ecosystem growth",
    stacking: "normal",
    showXAsDate: true,
    dataAsJson: {
      meta: [
        {
          name: "Arbitrum",
          color: "#19D9D6",
          xIndex: 1,
          yIndex: 0,
          url: "https://api.growthepie.com/v1/fundamentals/transaction-count.json",
          pathToData: "data.arbitrum.daily.values"
        },
        {
          name: "Base",
          color: "#2151F5",
          xIndex: 1,
          yIndex: 0,
          url: "https://api.growthepie.com/v1/fundamentals/transaction-count.json",
          pathToData: "data.base.daily.values"
        }
      ]
    },
    height: 400,
    caption: "Data updated daily"
  }),
  "```"
]
```

### Table with Sortable Columns
```typescript
content: [
  "## L2 Ecosystem Comparison",
  "Here's how the major Layer 2 networks compare across key metrics:",
  "",
  "```table",
  JSON.stringify({
    content: "Data as of January 2025",
    columnKeys: {
      network: {
        sortByValue: false,
        label: "Network"
      },
      tvl: {
        sortByValue: true,
        label: "TVL"
      },
      tps: {
        sortByValue: true,
        label: "TPS"
      },
      cost: {
        sortByValue: true,
        label: "Avg Cost"
      }
    },
    columnSortBy: "value",
    rowData: {
      "Arbitrum": {
        network: {
          value: "Arbitrum",
          icon: "arbitrum-logo-monochrome",
          color: "#28A0F0",
          link: "/chains/arbitrum"
        },
        tvl: {
          value: 18500000000,
          icon: undefined,
          color: undefined,
          link: undefined
        },
        tps: {
          value: 4000,
          icon: undefined,
          color: undefined,
          link: undefined
        },
        cost: {
          value: 0.25,
          icon: undefined,
          color: undefined,
          link: undefined
        }
      },
      "Base": {
        network: {
          value: "Base",
          icon: "base-logo-monochrome",
          color: "#2151F5",
          link: "/chains/base"
        },
        tvl: {
          value: 12800000000,
          icon: undefined,
          color: undefined,
          link: undefined
        },
        tps: {
          value: 8000,
          icon: undefined,
          color: undefined,
          link: undefined
        },
        cost: {
          value: 0.08,
          icon: undefined,
          color: undefined,
          link: undefined
        }
      }
    }
  }),
  "```",
  "",
  "The table above shows real-time data with sortable columns for easy comparison."
]
```

## Publishing

### Step 1: Add to Index
In `lib/quick-bites/index.ts`:

```typescript
import myAnalysis from './qb-my-analysis';

const QUICK_BITES_DATA: Record<string, QuickBiteData> = {
  // ... existing entries
  "my-analysis": myAnalysis, // URL slug
};
```

### Step 2: URL Structure
Your Quick Bite will be available at:
- **URL**: `/quick-bites/my-analysis`
- **Slug**: Must be URL-friendly (lowercase, hyphens only)

### Step 3: Testing
- Use `qb-test-bite.ts` as a reference for all available features
- Test your content blocks locally before publishing

## Best Practices

1. **Content Structure**: Start broad, then dive into specifics
2. **Chart Selection**: Choose chart type based on data characteristics
3. **Table Design**: 
   - Limit to 3-6 columns for readability
   - Use sorting only for numerical/comparable data
   - Include icons for visual hierarchy
   - Add links for navigation to detailed pages
4. **Color Consistency**: Use brand colors from existing palette
5. **Data Sources**: Prefer API endpoints over static data for freshness
6. **Performance**: Limit charts to 5 series maximum for readability
7. **Mobile**: Test content on mobile devices (charts auto-scale, tables scroll horizontally)

## Need Help?

- Check `qb-test-bite.ts` for working examples of all features
- Review existing Quick Bites for inspiration
- Refer to `@/lib/types/quickBites.ts` for type definitions 
