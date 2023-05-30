import { Metadata, ResolvingMetadata } from "next";
import { MasterURL } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";

type Props = {
  params: { chain: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = AllChains.find((c) => c.urlKey === params.chain)?.key;

  // fetch data from API
  const res: MasterResponse = await fetch(MasterURL).then((r) => r.json());

  if (res && key && res.chains[key]) {
    return {
      title: res.chains[key].name,
      description: res.chains[key].description,
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
