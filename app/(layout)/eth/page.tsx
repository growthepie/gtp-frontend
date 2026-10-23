"use client";

import { useEthAssetSection } from "@/hooks/useEthAssetSection";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import EthHero from "./EthHero";
import SixThingsSection from "./SixThingsSection";
import ProductiveAssetSection from "./ProductiveAssetSection";
import SupplySection from "./SupplySection";
import BasketSection from "./BasketSection";
import RankingSection from "./RankingSection";
import DailySection from "./DailySection";
import QuickBitesShelf from "@/components/quick-bites/QuickBitesShelf";
import { IS_PRODUCTION } from "@/lib/helpers";

export default function EthTheAssetPage() {
  // The top loading bar follows the two bundles (every section reads from one of them).
  const live = useEthAssetSection("kpis");
  const daily = useEthAssetSection("supply_flow");

  return (
    <>
      <ShowLoading dataLoading={[live.isLoading, daily.isLoading]} dataValidating={[live.isValidating, daily.isValidating]} />
      <Container className="flex flex-col pt-[45px] md:pt-[30px] pb-[15px] gap-y-[60px]">
        <EthHero />
        <SixThingsSection />
        <RankingSection />
        <SupplySection />
        <ProductiveAssetSection />
        {/* Hidden in production for now; shown on local, dev and preview. */}
        {!IS_PRODUCTION && <BasketSection />}
        <QuickBitesShelf
          slugs={["eth-supply", "fusaka", "ethereum-scaling"]}
          topic="token-economics"
          description="Deeper dives on ETH's supply and the upgrades that shape it, backed by live data."
        />
        <DailySection />
      </Container>
    </>
  );
}
