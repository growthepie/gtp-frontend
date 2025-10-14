import { QuickBiteData } from '@/lib/types/quickBites';
import testBite from './qb-test-bite';


import pectraUpgrade from './qb-pectra-upgrade';
import arbitrumTimeboost from './qb-arbitrum-timeboost';
import shopifyUsdc from './qb-shopify-usdc';
import robinhoodStock from './qb-robinhood-stock';
import anniversaryReport from './qb-anniversary-report';
import arbitrumHyperliquidBridge from './qb-arbitrum-hyperliquid-bridge';

const QUICK_BITES_DATA: Record<string, QuickBiteData> = {
  "test-bite": testBite,
  "pectra-upgrade": pectraUpgrade,
  "arbitrum-timeboost": arbitrumTimeboost,
  "base-commerce": shopifyUsdc,
  "robinhood-stock": robinhoodStock,
  "anniversary-report": anniversaryReport,
  "arbitrum-hyperliquid-bridge": arbitrumHyperliquidBridge,
};

export default QUICK_BITES_DATA; 