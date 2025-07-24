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
2. **Import the type**: `import { QuickBiteData } from '@/lib/types/quickBites';`
3. **Create your Quick Bite object** with all required properties
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
| `content` | `string[]` | Array of content blocks | `["# Header", "Text content", "```chart"]` |
| `image` | `string` | Banner image URL | `"https://api.growthepie.com/v1/quick-bites/banners/timeboost.png"` |
| `date` | `string` | Publication date (YYYY-MM-DD) | `"2025-01-15"` |
| `icon` | `string` | Icon identifier | `"arbitrum-logo-monochrome"` |
| `related` | `string[]` | URLs to related content | `["/chains/arbitrum"]` |
| `author` | `Author[]` | *Optional* Author information | `[{name: "John Doe", xUsername: "johndoe"}]` |
| `topics` | `Topic[]` | *Optional* Related topics/tags | `[{icon: "base-logo", color: "#2151F5", name: "Base", url: "/chains/base"}]` |

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
3. **Color Consistency**: Use brand colors from existing palette
4. **Data Sources**: Prefer API endpoints over static data for freshness
5. **Performance**: Limit charts to 5 series maximum for readability
6. **Mobile**: Test content on mobile devices (charts auto-scale)

## Need Help?

- Check `qb-test-bite.ts` for working examples of all features
- Review existing Quick Bites for inspiration
- Refer to `@/lib/types/quickBites.ts` for type definitions 