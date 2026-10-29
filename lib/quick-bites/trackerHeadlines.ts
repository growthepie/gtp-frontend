// The live headline number on a tracker's tile (landing page): where it comes from and
// how it reads. Kept apart from the Quick Bite data because these are functions, and the
// Quick Bite data is passed from server to client components.
import { formatNumber } from "@/lib/utils/formatters";
import {
  STABLECOIN_FIAT_TIMESERIES_URL,
  STABLECOIN_FIAT_USD_TABLE_URL,
  readStablecoinFiatSupply,
} from "@/lib/quick-bites/stablecoinFiatSupply";

export type TrackerHeadline = {
  /** The number, formatted ("122.15M ETH"). */
  value: string;
  /** What it is ("supply"). */
  label: string;
  /** An optional change in percent, coloured by sign ("+87.8% 7d"). */
  change?: { percent: number; period: string };
};

type HeadlineSource = {
  /** One URL, or several: then `read` gets their responses as an array, in the same order */
  url: string | string[];
  read: (json: any) => TrackerHeadline | null;
};

const API = "https://api.growthepie.com/v1";

const lastValue = (rows?: [number, number][]) => (rows?.length ? rows[rows.length - 1][1] : undefined);

export const TRACKER_HEADLINES: Record<string, HeadlineSource> = {
  "eth-supply": {
    url: `${API}/eim/eth_supply.json`,
    read: (json) => {
      const supply = lastValue(json?.data?.chart?.eth_supply?.daily?.data);
      const issuance = lastValue(json?.data?.chart?.eth_issuance_rate?.daily?.data);
      if (supply === undefined) return null;
      const rate = issuance !== undefined ? ` · ${issuance >= 0 ? "+" : ""}${(issuance * 100).toFixed(2)}%/yr` : "";
      return { value: `${(supply / 1e6).toFixed(2)}M ETH`, label: `supply${rate}` };
    },
  },
  "linea-burn": {
    url: `${API}/quick-bites/linea/kpis.json`,
    read: (json) => {
      const burned = Number(json?.data?.totals_lineatokensbridged_linea);
      if (!Number.isFinite(burned)) return null;
      return { value: `${formatNumber(burned, { decimals: 1 })} LINEA`, label: "burned so far" };
    },
  },
  "robinhood-stock": {
    url: `${API}/quick-bites/robinhood/kpi.json`,
    read: (json) => {
      const value = Number(json?.data?.total_market_value_sum_usd);
      if (!Number.isFinite(value)) return null;
      const count = Number(json?.data?.stockCount);
      const change = Number(json?.data?.perc_change_market_value_usd_7d);
      return {
        value: formatNumber(value, { decimals: 1, prefix: "$" }),
        // Short: the 7d change shares the line, and the value already says it's tokenized.
        label: Number.isFinite(count) ? `${count.toLocaleString("en-GB")} stocks` : "tokenized",
        ...(Number.isFinite(change) ? { change: { percent: change, period: "7d" } } : {}),
      };
    },
  },
  "glo-dollar": {
    url: `${API}/glo_dollar.json`,
    read: (json) => {
      // Same as the Quick Bite's KPIs: latest USD market cap and its 30-day change.
      const types: string[] = json?.chart?.types ?? [];
      const rows: number[][] = json?.chart?.data ?? [];
      const usd = types.indexOf("usd");
      const latest = rows[rows.length - 1]?.[usd];
      const monthAgo = rows[rows.length - 31]?.[usd];
      if (!Number.isFinite(latest)) return null;
      return {
        value: formatNumber(latest, { decimals: 2, prefix: "$" }),
        label: "market cap",
        ...(Number.isFinite(monthAgo) && monthAgo ? { change: { percent: (latest / monthAgo - 1) * 100, period: "30d" } } : {}),
      };
    },
  },
  "stablecoins-for-fiat": {
    // the timeseries' absolute values are ~7x too high; see stablecoinFiatSupply.ts
    url: [STABLECOIN_FIAT_TIMESERIES_URL, STABLECOIN_FIAT_USD_TABLE_URL],
    read: ([timeseries, usdTable]) => {
      const supply = readStablecoinFiatSupply(timeseries, usdTable);
      if (!supply) return null;
      return { value: formatNumber(supply.total, { decimals: 1, prefix: "$" }), label: `supply in ${supply.currencies} currencies` };
    },
  },
  "stablecoins-for-chain": {
    url: `${API}/quick-bites/stablecoins/dropdown-chains.json`,
    read: (json) => {
      const count = json?.dropdown_values?.length;
      return count ? { value: String(count), label: "chains tracked" } : null;
    },
  },
  "stablecoins-for-project": {
    url: `${API}/quick-bites/stablecoins/dropdown-projects.json`,
    read: (json) => {
      const count = json?.dropdown_values?.length;
      return count ? { value: String(count), label: "issuers tracked" } : null;
    },
  },
};
