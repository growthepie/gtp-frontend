import { QuickBiteData } from '@/lib/types/quickBites';

import mostUsedEthereumL2 from './qb-most-used-ethereum-l2';
import lowestFeeEthereumL2 from './qb-lowest-fee-ethereum-l2';
import mostStablecoinActivityEthereumL2 from './qb-most-stablecoin-activity-ethereum-l2';
import ethereumL2TransactionCount from './qb-ethereum-l2-transaction-count';
import topAppsEthereumL2s from './qb-top-apps-ethereum-l2s';
import isEthereumScalingThroughL2s from './qb-is-ethereum-scaling-through-l2s';

const ANSWERS_DATA: Record<string, QuickBiteData> = {
  'most-used-ethereum-l2': mostUsedEthereumL2,
  'lowest-fee-ethereum-l2': lowestFeeEthereumL2,
  'most-stablecoin-activity-ethereum-l2': mostStablecoinActivityEthereumL2,
  'ethereum-l2-transaction-count': ethereumL2TransactionCount,
  'top-apps-ethereum-l2s': topAppsEthereumL2s,
  'is-ethereum-scaling-through-l2s': isEthereumScalingThroughL2s,
};

export default ANSWERS_DATA;

export const getAnswerBySlug = (slug: string): QuickBiteData | undefined =>
  ANSWERS_DATA[slug];

export const getAllAnswers = (): (QuickBiteData & { slug: string })[] =>
  Object.entries(ANSWERS_DATA).map(([slug, data]) => ({ ...data, slug }));
