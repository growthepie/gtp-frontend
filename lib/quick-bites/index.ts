import { QuickBiteData } from '@/lib/types/quickBites';
import testBite from './qb-test-bite';


import pectraUpgrade from './qb-pectra-upgrade';
import arbitrumTimeboost from './qb-arbitrum-timeboost';

const QUICK_BITES_DATA: Record<string, QuickBiteData> = {
  "test-bite": testBite,
  "pectra-upgrade": pectraUpgrade,
  "arbitrum-timeboost": arbitrumTimeboost
};

export default QUICK_BITES_DATA; 