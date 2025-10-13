# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"growthepie" is a comprehensive analytics platform for the Ethereum Layer 2 ecosystem, providing metrics, visualizations, and insights about L2 scaling solutions. Built with Next.js 14 using the App Router pattern.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbo (recommended)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run postbuild` - Generate sitemap after build

### Asset Management
- `npm run figma-icons` - Sync icons from Figma and process SVGs

## Architecture Overview

### App Router Structure
The application uses Next.js 14 App Router with organized route groups:

- **`app/(layout)/`** - Main application pages (fundamentals, economics, chains, etc.)
- **`app/(fees)/`** - Dedicated fees analytics (fees.growthepie.com)
- **`app/(labels)/`** - Contract labeling system (labels.growthepie.com)  
- **`app/(icons)/`** - Icon library management (icons.growthepie.com)
- **`app/(embeds)/`** - Embeddable widgets and components
- **`app/(debug)/`** - Development tools and helpers

### Core Contexts and Data Flow

#### MasterProvider (`contexts/MasterContext.tsx`)
Central data provider that:
- Fetches master configuration from API
- Manages chain definitions and metadata
- Provides formatting utilities for metrics
- Handles icon imports and chain/DA layer data

#### Key Data Patterns
- **SWR** for data fetching with caching
- **Master context** provides global chain/metrics configuration
- **URL-based data fetching** from `lib/urls.ts`
- **Development middleware** switches API endpoints for local testing

### Multi-Domain Architecture
The application serves multiple domains through Next.js rewrites:
- **Main**: `growthepie.com` → root pages
- **Fees**: `fees.growthepie.com` → `/fees`
- **Labels**: `labels.growthepie.com` → `/labels`
- **Icons**: `icons.growthepie.com` → `/icons`

## Key Technologies & Libraries

### Core Stack
- **Next.js 14** with App Router
- **TypeScript** with path aliases (`@/*`)
- **Tailwind CSS** with custom configuration
- **SWR** for data fetching and caching

### Visualization
- **Highcharts** (`highcharts`, `highcharts-react-official`) - Primary charting
- **Custom chart utilities** in `lib/highcharts/`
- **SVG pattern generation** for chart backgrounds

### UI Components
- **Floating UI** for tooltips and popovers
- **React Virtuoso** for performance with large lists
- **Framer Motion** for animations
- **Custom component library** in `components/`

### Icon System
- **Iconify** for icon management
- **Custom GTP icons** from Figma integration
- **SVG utilities** in `lib/icon-library/`

## Important File Locations

### Configuration
- `next.config.js` - Next.js config with domain rewrites
- `tailwind.config.js` - Custom design system and utilities
- `tsconfig.json` - TypeScript configuration with path mapping

### Core Libraries
- `lib/chains.ts` - Chain definitions and utilities
- `lib/urls.ts` - API endpoint definitions
- `lib/helpers.ts` - Common utility functions
- `lib/types/` - TypeScript type definitions

### Context Providers
- `app/providers.tsx` - Root providers wrapper
- `contexts/MasterContext.tsx` - Global data context
- `contexts/UIContext.tsx` - UI state management

## Development Patterns

### Component Structure
- Use TypeScript for all components
- Follow existing naming conventions (PascalCase for components)
- Utilize Tailwind CSS classes, especially custom typography utilities
- Components organized by feature/page in `components/`

### Data Fetching
- Use SWR hooks for API calls
- Reference URL patterns from `lib/urls.ts`
- Master context provides formatted data and chain information
- Development mode switches to `/dev/` API endpoints

### Styling Approach
- **Tailwind-first** with custom utilities
- **Dark theme default** with class-based theme switching
- **Custom typography system**: `heading-large`, `heading-small`, `numbers`, `text` with size variants
- **Forest color palette** as primary theme
- **Custom scrollbar styling** via Tailwind utilities

### Icon Management
- Icons stored in `icons/` directory with JSON manifests
- Use Iconify React components for rendering
- Custom GTP icons synced from Figma
- Chain and DA layer icons imported dynamically

## API and Data Architecture

### API Structure
- Primary API: `api.growthepie.com/v1/`
- Development API: switches `/v1/` to `/dev/` for testing
- Data types defined in `types/api/`
- URL patterns centralized in `lib/urls.ts`

### Chain Support
The platform tracks major Ethereum L2 solutions including Arbitrum, Optimism, Base, Polygon zkEVM, zkSync Era, Starknet, and others. Chain configurations managed through MasterProvider.

### Metrics Categories
- **Fundamentals**: Active addresses, transaction counts, throughput
- **Economics**: Revenue, profit, market cap, rent paid to L1
- **Value**: TVL, stablecoins, token metrics
- **Blockspace**: Usage analysis and category breakdowns
- **Data Availability**: DA layer metrics and blob usage

## Testing and Quality

### Code Quality
- ESLint configuration with Next.js rules
- Prettier integration for code formatting
- TypeScript strict mode disabled but null checks enabled

### Performance Considerations
- Virtual scrolling for large datasets
- SWR caching for API responses
- Dynamic imports for code splitting
- Optimized images with Next.js Image component

## Environment Management

### Development
- `IS_DEVELOPMENT` flag for dev-specific features
- Mock data available in `public/mock/v1/`
- Development API endpoint switching
- Debug tools available in `(debug)` route group

### Production
- Analytics via Vercel Analytics
- Sitemap generation post-build
- Cookie consent management
- SEO optimization with next-seo