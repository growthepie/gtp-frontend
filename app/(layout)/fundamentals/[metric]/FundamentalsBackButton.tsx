"use client";
import { useEffect, useState } from "react";
import { BackButton } from "../../applications/_components/Components";
import { useMaster } from "@/contexts/MasterContext";

export const FundamentalsBackButton = () => {
  const [isChainFocused, setIsChainFocused] = useState(false);
  const { AllChains } = useMaster();

  useEffect(() => {
    const url = window.location.href;
    const split = url.split('/');

    if(AllChains.map(chain => chain.urlKey).includes(split[split.length -1].toLowerCase())) {
      setIsChainFocused(true);
    }
  }, [AllChains]);

  if(!isChainFocused) {
    return null;
  }
  return (
  <BackButton />
  );
};