"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { EthSupplyURL } from "@/lib/urls";
import { computeEthSupplySnapshot } from "@/lib/eth-the-asset/data";
import { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import EthHero from "./EthHero";
import SixThingsSection from "./SixThingsSection";
import ProductiveAssetSection from "./ProductiveAssetSection";
import SupplySection from "./SupplySection";
import BasketSection from "./BasketSection";
import RankingSection from "./RankingSection";
import DailySection from "./DailySection";

export default function EthTheAssetPage() {
  const { data, isLoading, isValidating } = useSWR<any>(EthSupplyURL);
  const ethSnapshot = useMemo(() => (data ? computeEthSupplySnapshot(data) : null), [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      <PageContainer gapSize="lg" paddingY="md">
        <EthHero ethSnapshot={ethSnapshot} />
        <SixThingsSection ethSnapshot={ethSnapshot} />
        <ProductiveAssetSection />
        <SupplySection ethSnapshot={ethSnapshot} />
        <BasketSection />
        <RankingSection ethSnapshot={ethSnapshot} />
        <DailySection />
      </PageContainer>
    </>
  );
}
