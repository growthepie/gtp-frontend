
import { Metadata } from "next";
import { MasterURL } from "@/lib/urls";
import { ChainInfo, MasterResponse } from "@/types/api/MasterResponse";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { getPageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ chain: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  // fetch data from API
  let res: MasterResponse;
  try {
    const response = await fetch(MasterURL, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Master API returned ${response.status}: ${response.statusText}`);
      return {
        title: "growthepie",
        description: "Layer 2 analytics",
      };
    }
    res = await response.json();
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return {
      title: "growthepie",
      description: "Layer 2 analytics",
    };
  }

  // 1. Fetch data specific to this chain (e.g., its full name)
  const AllChainsByUrlKey = Object.keys(res.chains).filter((key) => !["multiple", "all_l2s"].includes(key)).reduce((acc, key) => {
    acc[res.chains[key].url_key] = { ...res.chains[key], key: key };
    return acc;
  }, {} as { [key: string]: ChainInfo & { key: string } });

  // Check if the chain exists before accessing its properties
  if (!AllChainsByUrlKey[params.chain]) {
    return {
      title: "Chain not found",
      description: "Chain not found",
    };
  }

  const key = AllChainsByUrlKey[params.chain].key;
  const urlKey = AllChainsByUrlKey[params.chain].url_key;

  // 2. Fetch metadata template from Airtable using the *template path*
  //    and provide the dynamic data for placeholder replacement.
  const metadata = await getPageMetadata(
    '/chains/[slug]', // The path key stored in Airtable
    { chainName: res.chains[key].name } // Data for placeholders like {{chainName}}
  );

  if (res && key && res.chains[key]) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: {
        absolute: metadata.title,
      },
      description: metadata.description,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.com/v1/og_images/chains/${urlKey}.png`,
            width: 1200,
            height: 627,
            alt: "growthepie.com",
          },
        ],
      },
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
