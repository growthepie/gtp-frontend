import { QuickBiteData } from '@/lib/types/quickBites';

import mostUsedEthereumL2 from './qb-most-used-ethereum-l2';
import lowestFeeEthereumL2 from './qb-lowest-fee-ethereum-l2';
import mostStablecoinActivityEthereumL2 from './qb-most-stablecoin-activity-ethereum-l2';
import ethereumL2TransactionCount from './qb-ethereum-l2-transaction-count';
import topAppsEthereumL2s from './qb-top-apps-ethereum-l2s';
import isEthereumScalingThroughL2s from './qb-is-ethereum-scaling-through-l2s';
import fastestGrowingEthereumL2 from './qb-fastest-growing-ethereum-l2';
import whatFusakaUpgradeChanged from './qb-what-fusaka-upgrade-changed';
import whatPectraUpgradeChanged from './qb-what-pectra-upgrade-changed';
import isEthereumDeflationary from './qb-is-ethereum-deflationary';
import zkVsOptimisticRollup from './qb-zk-vs-optimistic-rollup';
import l2VsSidechain from './qb-l2-vs-sidechain';
import mostValueSecuredEthereumL2 from './qb-most-value-secured-ethereum-l2';
import mostProfitableEthereumL2 from './qb-most-profitable-ethereum-l2';
import ethereumMainnetRevenueFromL2s from './qb-ethereum-mainnet-revenue-from-l2s';
import ethereumL2MaturityStages from './qb-ethereum-l2-maturity-stages';
import whatIsDataAvailability from './qb-what-is-data-availability';
import whatWasTheMerge from './qb-what-was-the-merge';
import mostSmartAccountActivityEthereumL2 from './qb-most-smart-account-activity-ethereum-l2';
import defiL1VsL2 from './qb-defi-l1-vs-l2';

const ANSWERS_DATA: Record<string, QuickBiteData> = {
  'most-used-ethereum-l2': mostUsedEthereumL2,
  'lowest-fee-ethereum-l2': lowestFeeEthereumL2,
  'most-stablecoin-activity-ethereum-l2': mostStablecoinActivityEthereumL2,
  'ethereum-l2-transaction-count': ethereumL2TransactionCount,
  'top-apps-ethereum-l2s': topAppsEthereumL2s,
  'is-ethereum-scaling-through-l2s': isEthereumScalingThroughL2s,
  'fastest-growing-ethereum-l2': fastestGrowingEthereumL2,
  'what-fusaka-upgrade-changed': whatFusakaUpgradeChanged,
  'what-pectra-upgrade-changed': whatPectraUpgradeChanged,
  'is-ethereum-deflationary': isEthereumDeflationary,
  'zk-vs-optimistic-rollup': zkVsOptimisticRollup,
  'l2-vs-sidechain': l2VsSidechain,
  'most-value-secured-ethereum-l2': mostValueSecuredEthereumL2,
  'most-profitable-ethereum-l2': mostProfitableEthereumL2,
  'ethereum-mainnet-revenue-from-l2s': ethereumMainnetRevenueFromL2s,
  'ethereum-l2-maturity-stages': ethereumL2MaturityStages,
  'what-is-data-availability': whatIsDataAvailability,
  'what-was-the-merge': whatWasTheMerge,
  'most-smart-account-activity-ethereum-l2': mostSmartAccountActivityEthereumL2,
  'defi-l1-vs-l2': defiL1VsL2,
};

export default ANSWERS_DATA;

export const getAnswerBySlug = (slug: string): QuickBiteData | undefined =>
  ANSWERS_DATA[slug];

export const getAllAnswers = (): (QuickBiteData & { slug: string })[] =>
  Object.entries(ANSWERS_DATA).map(([slug, data]) => ({ ...data, slug }));
