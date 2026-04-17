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
import StablecoinFiat from './qb-stablecoin-fiat';
import celoAnniversaryReport from './qb-celo-anniversary-report';
import polygonBurn from './qb-polygon-burn';
import EigenDAMegaETH from './qb-eigenda-megaeth';
import CompilerTvs from './qb-compiler-tvs';
import CompilerFlow from './qb-compiler-flow';

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
  "stablecoins-for-chain": StablecoinChain,
  "stablecoins-for-project": StablecoinProject,
  "eip-8004": Agents,
  "octant-v2-migration": OctantV2Migration,
  "celo-anniversary-report": celoAnniversaryReport,
  "polygon-burn": polygonBurn,
  "eigenda-megaeth": EigenDAMegaETH,
  "stablecoins-for-fiat": StablecoinFiat,
  "compiler-tvs": CompilerTvs,
  "compiler-flow": CompilerFlow,
};

export default QUICK_BITES_DATA;
