"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { EthSupplyURL } from "@/lib/urls";
import { computeEthSupplySnapshot } from "@/lib/eth-the-asset/data";
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
  const { data, isLoading, isValidating } = useSWR<any>(EthSupplyURL);
  const ethSnapshot = useMemo(() => (data ? computeEthSupplySnapshot(data) : null), [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      <Container className="flex flex-col pt-[45px] md:pt-[30px] pb-[15px] gap-y-[60px]">
        <EthHero ethSnapshot={ethSnapshot} />
        <SixThingsSection ethSnapshot={ethSnapshot} />
        <SupplySection ethSnapshot={ethSnapshot} />
        <ProductiveAssetSection />
        <RankingSection ethSnapshot={ethSnapshot} />
        <BasketSection />
        <DailySection />
      </Container>
    </>
  );
}
