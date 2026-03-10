import { QuickBiteData } from '@/lib/types/quickBites';
import testBite from './qb-test-bite';

import pectraUpgrade from './qb-pectra-upgrade';
import arbitrumTimeboost from './qb-arbitrum-timeboost';
import shopifyUsdc from './qb-shopify-usdc';
import robinhoodStock from './qb-robinhood-stock';
import anniversaryReport from './qb-anniversary-report';
import arbitrumHyperliquidBridge from './qb-arbitrum-hyperliquid-bridge';
import ethereumScaling from './qb-ethereum-scaling';
import ethSupply from './qb-ETH-supply';
import lineaTokenBurn from './qb-linea-burn';
import Fusaka from './qb-fusaka';
import Agents from './qb-eip8004';
import OctantV2Migration from './qb-octant-v2-migration';
import StablecoinChain from './qb-stablecoin-chain';
import StablecoinProject from './qb-stablecoin-project';

const QUICK_BITES_DATA: Record<string, QuickBiteData> = {
  "test-bite": testBite,
  "pectra-upgrade": pectraUpgrade,
  "arbitrum-timeboost": arbitrumTimeboost,
  "base-commerce": shopifyUsdc,
  "robinhood-stock": robinhoodStock,
  "anniversary-report": anniversaryReport,
  "arbitrum-hyperliquid-bridge": arbitrumHyperliquidBridge,
  "ethereum-scaling": ethereumScaling,
  "eth-supply": ethSupply,
  "linea-burn": lineaTokenBurn,
  "fusaka": Fusaka,
  "stablecoins-by-chain": StablecoinChain,
  "stablecoins-by-project": StablecoinProject,
  "eip-8004": Agents,
  "octant-v2-migration": OctantV2Migration
};

export default QUICK_BITES_DATA;
