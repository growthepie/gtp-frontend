import { QuickBiteData } from '@/lib/types/quickBites';

import mostUsedEthereumL2 from './qb-most-used-ethereum-l2';

const ANSWERS_DATA: Record<string, QuickBiteData> = {
  'most-used-ethereum-l2': mostUsedEthereumL2,
};

export default ANSWERS_DATA;

export const getAnswerBySlug = (slug: string): QuickBiteData | undefined =>
  ANSWERS_DATA[slug];

export const getAllAnswers = (): (QuickBiteData & { slug: string })[] =>
  Object.entries(ANSWERS_DATA).map(([slug, data]) => ({ ...data, slug }));
