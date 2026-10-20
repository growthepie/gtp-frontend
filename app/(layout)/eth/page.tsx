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
        <BasketSection />
        <DailySection />
      </Container>
    </>
  );
}
