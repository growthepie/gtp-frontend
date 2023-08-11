import { Metadata } from "next";
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

  console.log("chains/chain/layout::key", key); // eslint-disable-line no-console
  console.log("chains/chain/layout::res.chains[key]", res.chains[key]); // eslint-disable-line no-console
  console.log("chains/chain/layout::res", res); // eslint-disable-line no-console

  if (res && key && res.chains[key]) {
    console.log(
      `key: ${key} - ${res.chains[key].name} - ${res.chains[key].description}`,
    ); // eslint-disable-line no-console
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
