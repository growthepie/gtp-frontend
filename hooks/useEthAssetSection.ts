import useSWR from "swr";
import { EthAssetURLs } from "@/lib/urls";
import { EthAssetBundle, EthAssetDailySections, EthAssetLiveSections } from "@/lib/eth-the-asset/data";

type Sections = EthAssetLiveSections & EthAssetDailySections;

// Which bundle each section is in.
const SECTION_BUNDLE: Record<keyof Sections, keyof typeof EthAssetURLs> = {
  kpis: "live",
  stats: "live",
  properties: "live",
  productive_asset: "live",
  purchasing_power: "daily",
  market_caps: "daily",
  supply_flow: "daily",
  today: "daily",
};

/**
 * One section of the ETH asset bundles, in the shape of the single file it replaced:
 * { last_updated_utc, data }, with last_updated_utc being that section's own update
 * time. Every section of a bundle shares one SWR key, so the bundle is fetched once.
 */
export function useEthAssetSection<K extends keyof Sections>(section: K) {
  const { data: bundle, isLoading, isValidating, error } = useSWR<EthAssetBundle<Sections>>(EthAssetURLs[SECTION_BUNDLE[section]]);
  const sectionData = bundle?.data?.[section];
  const data =
    bundle && sectionData
      ? {
          last_updated_utc: bundle.sections_last_updated_utc?.[section] ?? bundle.last_updated_utc,
          data: sectionData as Sections[K],
        }
      : undefined;
  return { data, isLoading, isValidating, error };
}
