import { Metadata } from "next";
import { MasterURL } from "@/lib/urls";
import { AllChainsByUrlKey } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";

type Props = {
  params: { chain: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = AllChainsByUrlKey[params.chain].key;

  // fetch data from API
  const res: MasterResponse = await fetch(MasterURL, {
    cache: "no-store",
  }).then((r) => r.json());

  if (res && key && res.chains[key]) {
    return {
      title: res.chains[key].name,
      description: res.chains[key].symbol,
    };
  }

  return {
    title: "Chain not found",
    description: "Chain not found",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
