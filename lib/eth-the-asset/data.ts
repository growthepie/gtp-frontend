// Real-data helper for the "ETH the Asset" page. Reads the same endpoint already
// used by lib/quick-bites/qb-ETH-supply.ts and lib/utils/dynamicContent.ts
// (eim/eth_supply.json), so the numbers on this page always agree with the
// existing "ETH Supply & Issuance Tracker" quick-bite.

export interface EthSupplySnapshot {
  /** Latest total ETH supply. */
  totalSupply: number;
  /** Net change in supply over the last 30 days (can be negative). */
  netIssuance30d: number;
  /** Latest annualized issuance rate, as a percentage (e.g. 0.44 for 0.44%/yr). */
  annualIssuanceRatePct: number;
  /** Issuance rate as a fraction (e.g. 0.0044), for percentage-of-supply math. */
  annualIssuanceRateFraction: number;
  /** Issued ETH per week implied by the current annualized rate, for the supply bathtub. */
  weeklyIssuanceEth: number;
}

// Mirrors the exact formulas already used in lib/utils/dynamicContent.ts for the
// {{eth_total_supply}} / {{eth_net_issuance_30d}} / {{eth_annual_issuance_rate}}
// placeholders, so this page's numbers match the existing ETH Supply quick-bite.
export function computeEthSupplySnapshot(json: any): EthSupplySnapshot | null {
  const supplyData = json?.data?.chart?.eth_supply?.daily?.data;
  const issuanceData = json?.data?.chart?.eth_issuance_rate?.daily?.data;
  if (!Array.isArray(supplyData) || !supplyData.length || !Array.isArray(issuanceData) || !issuanceData.length) {
    return null;
  }

  const totalSupply = supplyData[supplyData.length - 1][1];
  const thirtyDaysAgoIndex = Math.max(0, supplyData.length - 31);
  const netIssuance30d = totalSupply - supplyData[thirtyDaysAgoIndex][1];
  const annualIssuanceRateFraction = issuanceData[issuanceData.length - 1][1];
  const annualIssuanceRatePct = annualIssuanceRateFraction * 100;
  const weeklyIssuanceEth = (totalSupply * annualIssuanceRateFraction) / 52;

  return {
    totalSupply,
    netIssuance30d,
    annualIssuanceRatePct,
    annualIssuanceRateFraction,
    weeklyIssuanceEth,
  };
}
