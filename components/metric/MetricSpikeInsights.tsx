"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import {
  ProjectsMetadataProvider,
  useProjectsMetadata,
} from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { SectionDescription, SectionTitle } from "@/components/layout/TextHeadingComponents";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { SPIKE_METRICS, VOLATILE_MOVE, addressSignal } from "@/lib/spikes/metricSpikes";
import type {
  MetricSpike,
  MetricSpikeExplanation,
  SpikeCategoryDriver,
  SpikeMetricKey,
  SpikeMetricMove,
  SpikePriceMove,
} from "@/lib/spikes/metricSpikes";

const MAIN_CATEGORY_ICONS: Record<string, GTPIconName> = {
  finance: "gtp-defi",
  token_transfers: "gtp-tokentransfers",
  utility: "gtp-utilities",
  social: "gtp-socials",
  cross_chain: "gtp-crosschain",
  collectibles: "gtp-nft",
  unlabeled: "gtp-unlabeled",
} as Record<string, GTPIconName>;

// Segment colours for the "what made up the increase" bar, by main category.
const MAIN_CATEGORY_COLORS: Record<string, string> = {
  finance: "#1DF7EF",
  utility: "#FFDF27",
  token_transfers: "#FE5468",
  unlabeled: "#94ABD3",
  cross_chain: "#4CFF7E",
  collectibles: "#9F7AEA",
  social: "#FFC300",
};
const OTHER_COLOR = "rgb(var(--text-secondary) / 35%)";

/** Sub-categories that, when they dominate, usually mean bots rather than people. */
const BOT_LIKE_SUBCATEGORIES = new Set(["trading", "unlabeled", "inscriptions", "airdrop"]);

const WINDOW_LABELS: Record<string, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "180d": "last 180 days",
  max: "all time",
};

const ADDRESS_SIGNAL_LABELS = {
  users: { label: "More users", tone: "#4CFF7E" },
  mixed: { label: "Mostly existing wallets", tone: "#FFDF27" },
  "same-wallets": { label: "Same wallets, more txs", tone: "#FE5468" },
} as const;

/** Unit the chart is showing; the spike headline uses it, attribution is count / USD. */
export type SpikeDisplayUnit = "count" | "usd" | "eth";

// --- formatting ----------------------------------------------------------------

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const formatUsdAmount = (value: number) => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}$${formatCompact(abs)}`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumSignificantDigits: 3 })}`;
};

/** Amounts from the API: tx counts for txcount, USD for revenue. */
const formatAmount = (metric: SpikeMetricKey, value: number) =>
  metric === "fees" ? formatUsdAmount(value) : formatCompact(value);

const formatDisplayAmount = (unit: SpikeDisplayUnit, value: number) => {
  if (unit === "usd") return formatUsdAmount(value);
  if (unit === "eth") return `Ξ${formatCompact(value)}`;
  return formatCompact(value);
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

const formatShare = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)}%` : "–");

const formatSignedPct = (increase: number, baseline: number) => {
  const pct = baseline > 0 ? Math.round((increase / baseline) * 100) : 0;
  return `${pct >= 0 ? "+" : ""}${pct}%`;
};

/** Whole-percent signed change (0.234 → "+23%"). */
const pct0 = (change: number) => `${change >= 0 ? "+" : ""}${Math.round(change * 100)}%`;

/** Unsigned whole percent for use after "rose"/"fell" (−0.12 → "12%"). */
const absPct0 = (change: number) => `${Math.abs(Math.round(change * 100))}%`;

const formatPctChange = (change: number) => `${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`;

const formatRatio = (value: number | null | undefined) =>
  value == null ? "–" : value.toLocaleString("en-US", { maximumFractionDigits: 1 });

const formatUsdPrice = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 100 ? 0 : 2 }).format(
    value,
  );

const formatMetricValue = (value: number, kind: "throughput" | "usd" | "eth" | "count") => {
  if (kind === "throughput") return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} Mgas/s`;
  if (kind === "eth") return `Ξ${value.toLocaleString("en-US", { maximumSignificantDigits: 3 })}`;
  if (kind === "count") return formatCompact(value);
  return formatUsdAmount(value);
};

const shortAddress = (address: string) =>
  address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

// Compare on the rounded value we display (−4.98% shows as −5.0%).
const isVolatile = (move: SpikePriceMove | null | undefined, threshold: number) =>
  Boolean(move && Math.round(Math.abs(move.largestRecentMove) * 1000) / 1000 >= threshold);

/** "ETH fell 9.2% that day" / "ETH rose 7.1% in the days before". */
const describeMove = (move: SpikePriceMove) => {
  const sameDay = move.largestRecentMove === move.change;
  const verb = move.largestRecentMove < 0 ? "fell" : "rose";
  return `${move.symbol} ${verb} ${Math.abs(move.largestRecentMove * 100).toFixed(1)}% ${sameDay ? "that day" : "in the days before"}`;
};

const changeOf = (move: SpikeMetricMove | null | undefined) => (move?.change == null ? null : move.change);

// --- factors -------------------------------------------------------------------

/** One explanatory statement; higher weight = stronger evidence for the "why". */
type Factor = { text: string; weight: number };

/** Transaction count: read throughput / tx cost / revenue against the tx jump. */
function txcountNetworkFactors(data: MetricSpikeExplanation, txChange: number): Factor[] {
  const throughput = changeOf(data.activity.throughput);
  const cost = changeOf(data.activity.txCost);
  const revenue = changeOf(data.economics.revenue);
  const factors: Factor[] = [];

  const congested = throughput !== null && throughput < 0.1 && cost !== null && cost >= 0.5;
  if (congested) {
    factors.push({
      weight: 3,
      text: `Throughput barely moved (${pct0(throughput)}) while the median tx cost rose ${absPct0(cost)}: the chain was near capacity and users bid up fees to get in.`,
    });
  } else {
    if (throughput !== null && throughput < txChange / 2) {
      factors.push({
        weight: 2,
        text: `Throughput only rose ${absPct0(throughput)}, so the extra transactions were lighter than usual (simple transfers or bot calls).`,
      });
    } else if (throughput !== null) {
      factors.push({ weight: 1, text: `Throughput rose ${absPct0(throughput)} with it, so blocks were genuinely fuller.` });
    }
    if (cost !== null && cost >= 0.5) {
      factors.push({ weight: 2, text: `Demand pushed the median tx cost up ${absPct0(cost)}.` });
    } else if (cost !== null && cost <= -0.3) {
      factors.push({
        weight: 2,
        text: `Transactions got ${Math.round(Math.abs(cost) * 100)}% cheaper, which makes high-volume or bot activity cheaper to run.`,
      });
    }
  }
  if (revenue !== null && Math.abs(revenue) >= 0.25) {
    factors.push({ weight: 1, text: `Chain revenue ${revenue >= 0 ? "rose" : "fell"} ${Math.round(Math.abs(revenue) * 100)}%.` });
  }
  return factors;
}

/**
 * Revenue = transactions × average fee per tx. Splits the jump into those two,
 * then reads throughput (capacity), ETH price (USD vs ETH revenue) and L1 rent / profit.
 */
function revenueFactors(data: MetricSpikeExplanation): Factor[] {
  const factors: Factor[] = [];
  const revChange = data.baseline > 0 ? data.increase / data.baseline : null;
  const txChange = changeOf(data.activity.txcount);
  const throughput = changeOf(data.activity.throughput);

  if (revChange !== null && txChange !== null && revChange > 0) {
    const feePerTxChange = (1 + revChange) / (1 + txChange) - 1;
    // Share of the (log) growth explained by more transactions.
    const txShare = Math.log(1 + txChange) / Math.log(1 + revChange);
    if (txShare >= 0.6) {
      factors.push({
        weight: 3.5,
        text: `Mostly more transactions: txs rose ${absPct0(txChange)} while the average fee per tx moved only ${pct0(feePerTxChange)}.`,
      });
    } else if (txShare <= 0.4) {
      factors.push({
        weight: 3.5,
        text: `Each transaction paid more: the average fee per tx rose ${absPct0(feePerTxChange)} while transactions ${txChange >= 0 ? `only rose ${absPct0(txChange)}` : `fell ${absPct0(txChange)}`}, typical of congestion and priority-fee bidding.`,
      });
    } else {
      factors.push({
        weight: 2,
        text: `Both more transactions (${pct0(txChange)}) and higher fees per tx (${pct0(feePerTxChange)}).`,
      });
    }

    if (throughput !== null && throughput < 0.1 && feePerTxChange >= 0.3) {
      factors.push({
        weight: 2,
        text: `Throughput barely moved (${pct0(throughput)}), so blocks were near capacity and users outbid each other for space.`,
      });
    } else if (throughput !== null) {
      factors.push({ weight: 1, text: `Throughput ${throughput >= 0 ? "rose" : "fell"} ${absPct0(throughput)}.` });
    }
  }

  // ETH price: USD revenue rises mechanically when ETH does.
  const revEthChange = changeOf(data.economics.revenueEth);
  const ethPrice = data.prices?.eth;
  if (revChange !== null && revEthChange !== null && ethPrice) {
    const priceShare = revChange > 0 ? Math.log(1 + ethPrice.change) / Math.log(1 + revChange) : 0;
    if (priceShare >= 0.3) {
      factors.push({
        weight: 2,
        text: `ETH's price move (${pct0(ethPrice.change)}) explains a good part of it: in ETH terms revenue ${revEthChange >= 0 ? "only rose" : "fell"} ${absPct0(revEthChange)}.`,
      });
    } else {
      factors.push({
        weight: 1,
        text: `In ETH terms revenue rose ${absPct0(revEthChange)} too, so this wasn't just ETH's price (${pct0(ethPrice.change)}).`,
      });
    }
  }

  // Costs and margin: rent paid to L1 and onchain profit.
  const rent = data.economics.rentPaid;
  const profit = data.economics.profit;
  if (rent || profit) {
    const rentText = rent?.change != null ? `Rent paid to L1 ${rent.change >= 0 ? "rose" : "fell"} ${absPct0(rent.change)}` : null;
    const profitText = profit
      ? profit.baseline > 0 && profit.change !== null
        ? `onchain profit ${profit.change >= 0 ? "rose" : "fell"} ${absPct0(profit.change)} (${formatUsdAmount(profit.value)})`
        : `onchain profit was ${formatUsdAmount(profit.value)} (from ${formatUsdAmount(profit.baseline)})`
      : null;
    const marginSqueeze = profit?.change != null && profit.change < 0 && (revChange ?? 0) > 0;
    const text = [rentText, profitText].filter(Boolean).join(" and ");
    if (text) {
      factors.push({
        weight: marginSqueeze ? 2 : 1,
        text: `${text.charAt(0).toUpperCase()}${text.slice(1)}${marginSqueeze ? ": L1 costs grew faster than revenue" : ""}.`,
      });
    }
  }

  return factors;
}

function buildSummary(
  data: MetricSpikeExplanation,
  appName: (owner: string) => string,
  categoryLabel: (driver: SpikeCategoryDriver) => string,
  signal: ReturnType<typeof addressSignal>,
) {
  const metric = data.metric;
  const topApp = data.apps[0];
  const topCategory = data.categories[0];
  const event = data.events[0];
  const addr = data.activeAddresses;
  const factors: Factor[] = [];

  let cause: string | null = null;
  if (topApp && topApp.increase >= data.increase * 0.25) {
    const amount = `+${formatAmount(metric, topApp.increase)}, ${formatShare(topApp.increase, data.increase)}`;
    cause =
      metric === "fees"
        ? `Mostly fees paid by users of ${appName(topApp.owner_project)} (${amount}).`
        : `Mostly driven by ${appName(topApp.owner_project)} (${amount}).`;
  } else if (topCategory) {
    // Only call it bot-like when addresses didn't grow with it.
    const botLike = BOT_LIKE_SUBCATEGORIES.has(topCategory.sub_category) && signal !== "users";
    const label = categoryLabel(topCategory);
    const share = formatShare(topCategory.increase, data.increase);
    cause = botLike
      ? `No single app stands out — most of the jump came from ${label.toLowerCase()} activity (${share}), typical of trading bots and unlabeled contracts${metric === "fees" ? ", which often pay up for transaction ordering" : ""}.`
      : `Spread across apps — ${label} activity accounted for ${share} of the jump.`;
  }

  // An event is the headline when there is one; the blockspace cause then competes as a factor.
  let headline: string;
  if (event) {
    headline = `Coincides with “${event.title}” (${formatDate(event.date)}).`;
    if (cause) factors.push({ weight: 4, text: cause });
  } else {
    headline = cause ?? "We couldn't attribute this jump to a specific app, category or event.";
  }

  if (addr && signal) {
    const addrPct = formatSignedPct(addr.increase, addr.baseline);
    const perAddr = `${formatRatio(addr.txPerAddressBaseline)} → ${formatRatio(addr.txPerAddress)} txs per address`;
    if (signal === "users") {
      factors.push({
        weight: 3,
        text: `Active addresses rose too (${addrPct}), so this was more people using the chain, not just more activity per wallet.`,
      });
    } else if (signal === "mixed") {
      factors.push({
        weight: 2,
        text: `Active addresses only moved ${addrPct}, so most of it was existing wallets transacting more (${perAddr}).`,
      });
    } else {
      factors.push({
        weight: 3,
        text: `Active addresses didn't grow (${addrPct}): the same wallets sent more transactions (${perAddr}), a typical bot / automation pattern.`,
      });
    }
  }

  const { eth, token } = data.prices ?? { eth: null, token: null };
  const volatileMoves = [
    isVolatile(eth, VOLATILE_MOVE.ETH) ? eth : null,
    isVolatile(token, VOLATILE_MOVE.token) ? token : null,
  ].filter((m): m is SpikePriceMove => Boolean(m));
  if (volatileMoves.length > 0) {
    factors.push({
      weight: 3,
      text: `${volatileMoves.map(describeMove).join(" and ")}, so market volatility (trading, arbitrage, liquidations) likely added to it.`,
    });
  } else if (eth) {
    factors.push({
      weight: 1,
      text: `Prices were calm (ETH ${formatPctChange(eth.change)}${token ? `, ${token.symbol} ${formatPctChange(token.change)}` : ""}), so this wasn't market-driven.`,
    });
  }

  if (metric === "fees") {
    factors.push(...revenueFactors(data));
  } else {
    factors.push(...txcountNetworkFactors(data, data.baseline > 0 ? data.increase / data.baseline : 0));
  }

  // Stable sort keeps the order above as the tie-breaker.
  const ranked = [...factors].sort((a, b) => b.weight - a.weight);
  const [strongest, ...others] = ranked;
  return {
    text: [headline, strongest?.text].filter(Boolean).join(" "),
    others: others.map((f) => f.text),
  };
}

// --- components ----------------------------------------------------------------

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

type MetricSpikeInsightsProps = {
  metric: SpikeMetricKey;
  spikes: MetricSpike[];
  displayUnit: SpikeDisplayUnit;
  onZoomToSpike: (spike: MetricSpike) => void;
};

// The fundamentals routes aren't wrapped in ProjectsMetadataProvider (app names/logos),
// so provide it here; useProjectsMetadata throws without it.
export default function MetricSpikeInsights(props: MetricSpikeInsightsProps) {
  return (
    <ProjectsMetadataProvider>
      <MetricSpikeInsightsContent {...props} />
    </ProjectsMetadataProvider>
  );
}

function MetricSpikeInsightsContent({ metric, spikes, displayUnit, onZoomToSpike }: MetricSpikeInsightsProps) {
  const { label, icon } = SPIKE_METRICS[metric];
  return (
    <div className="flex flex-col gap-y-[15px] pt-[30px]">
      <div className="flex flex-col gap-y-[5px]">
        <SectionTitle icon={icon as GTPIconName} title="Why did it spike?" />
        <SectionDescription>
          The biggest day-over-day jumps in {label} (at least +10% on the previous day) for the chains and timeframe
          shown above, and what drove them.
        </SectionDescription>
      </div>
      {spikes.length === 0 ? (
        <div className="rounded-[15px] bg-color-bg-default px-[15px] py-[20px] text-sm text-color-text-secondary">
          No day in the selected range was 10% or more above the previous day. Try a longer timeframe or different chains.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[10px] lg:grid-cols-3">
          {spikes.map((spike, index) => (
            <SpikeCard
              key={`${spike.chainKey}-${spike.timestamp}`}
              metric={metric}
              rank={index + 1}
              spike={spike}
              displayUnit={displayUnit}
              onZoom={() => onZoomToSpike(spike)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type StatCell = { label: string; move: SpikeMetricMove | null; kind: "throughput" | "usd" | "eth" | "count" };

function StatBox({ icon, title, cells, columns }: { icon: string; title: string; cells: StatCell[]; columns: 2 | 3 }) {
  const visible = cells.filter((cell) => cell.move);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-col gap-y-[6px] rounded-[10px] bg-color-bg-medium p-[10px]">
      <div className="flex items-center gap-x-[6px]">
        <GTPIcon icon={icon as GTPIconName} size="sm" />
        <div className="heading-small-xxs">{title}</div>
      </div>
      <div className={`grid gap-x-[8px] gap-y-[6px] text-xs ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {visible.map(({ label, move, kind }) => (
          <div key={label} className="flex flex-col">
            <span className="text-color-text-secondary">{label}</span>
            <span className="numbers-xs">{move!.change !== null ? formatPctChange(move!.change) : "–"}</span>
            <span className="text-xxs text-color-text-secondary">{formatMetricValue(move!.value, kind)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpikeCard({
  metric,
  rank,
  spike,
  displayUnit,
  onZoom,
}: {
  metric: SpikeMetricKey;
  rank: number;
  spike: MetricSpike;
  displayUnit: SpikeDisplayUnit;
  onZoom: () => void;
}) {
  const { theme } = useTheme();
  const { AllChainsByKeys, data: master } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const chain = AllChainsByKeys[spike.chainKey];
  const chainColor = chain?.colors?.[theme ?? "dark"]?.[0] ?? "#CDD8D3";

  const { data, error, isLoading } = useSWR<MetricSpikeExplanation>(
    `/api/metrics/spike?metric=${metric}&chain=${spike.chainKey}&date=${spike.date}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const categoryLabel = (driver: SpikeCategoryDriver) => {
    const mainLabel = master?.blockspace_categories?.main_categories?.[driver.main_category] ?? driver.main_category;
    const subLabel = master?.blockspace_categories?.sub_categories?.[driver.sub_category] ?? driver.sub_category;
    return driver.main_category === "unlabeled" ? "Unlabeled" : `${mainLabel} › ${subLabel}`;
  };
  const appName = (owner: string) => ownerProjectToProjectData[owner]?.display_name ?? owner;

  const explorerBase = useMemo(() => {
    const chainMeta = master?.chains?.[spike.chainKey] as any;
    const explorers = chainMeta?.links?.block_explorers ?? chainMeta?.block_explorers ?? {};
    const first = Object.values(explorers)[0] as string | undefined;
    return first ? first.replace(/\/$/, "") : null;
  }, [master?.chains, spike.chainKey]);

  // Headline in the unit the chart shows (detected client-side).
  const pctIncrease = spike.baseline > 0 ? Math.round((spike.increase / spike.baseline) * 100) : null;

  const segments = useMemo(() => {
    if (!data) return [];
    const total = Math.max(data.increase, 1e-9);
    const top = data.categories.slice(0, 4);
    const covered = top.reduce((sum, c) => sum + c.increase, 0);
    const parts = top.map((c) => ({
      key: `${c.main_category}:${c.sub_category}`,
      label: categoryLabel(c),
      color: MAIN_CATEGORY_COLORS[c.main_category] ?? OTHER_COLOR,
      share: Math.min(c.increase / total, 1),
    }));
    if (covered < total) parts.push({ key: "other", label: "Other", color: OTHER_COLOR, share: (total - covered) / total });
    return parts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, master?.blockspace_categories]);

  const addresses = data?.activeAddresses ?? null;
  const txChange = data?.activity?.txcount?.change ?? null;
  const signal = data && txChange !== null ? addressSignal(txChange, addresses) : null;

  // Summary = the main cause + the single strongest supporting factor; everything
  // else is listed under "Other factors" so nothing is hidden.
  const summary = useMemo(
    () => (data ? buildSummary(data, appName, categoryLabel, signal) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, signal, ownerProjectToProjectData, master?.blockspace_categories],
  );

  const feePerTx = useMemo<SpikeMetricMove | null>(() => {
    const revenue = data?.economics.revenue;
    const txcount = data?.activity.txcount;
    if (!revenue || !txcount || !txcount.value || !txcount.baseline) return null;
    const value = revenue.value / txcount.value;
    const baseline = revenue.baseline / txcount.baseline;
    return { value, baseline, change: baseline > 0 ? value / baseline - 1 : null };
  }, [data]);

  return (
    <div className="flex flex-col gap-y-[12px] rounded-[15px] bg-color-bg-default p-[15px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-x-[8px]">
        <div className="flex min-w-0 items-center gap-x-[8px]">
          <div
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full numbers-xs text-color-bg-default"
            style={{ backgroundColor: chainColor }}
          >
            {rank}
          </div>
          <GTPIcon
            icon={`${spike.chainKey.replaceAll("_", "-")}-logo-monochrome` as GTPIconName}
            size="sm"
            style={{ color: chainColor }}
          />
          <div className="truncate heading-small-xs">{chain?.label ?? spike.chainKey}</div>
          <div className="whitespace-nowrap text-xs text-color-text-secondary">{formatDate(spike.date)}</div>
        </div>
        <GTPButton
          leftIcon={"feather:zoom-in" as GTPIconName}
          size="sm"
          variant="no-background"
          visualState="default"
          clickHandler={onZoom}
        />
      </div>

      {/* Headline numbers */}
      <div className="flex items-baseline gap-x-[8px]">
        <div className="numbers-xl">+{formatDisplayAmount(displayUnit, spike.increase)}</div>
        <div className="text-xs text-color-text-secondary">
          {metric === "fees" ? "revenue" : "txs"}
          {pctIncrease !== null
            ? ` · +${pctIncrease}% vs previous day (${formatDisplayAmount(displayUnit, spike.baseline)})`
            : ""}
        </div>
      </div>

      {isLoading && <div className="h-[80px] animate-pulse rounded-[10px] bg-color-bg-medium" />}
      {error && !data && <div className="text-xs text-color-text-secondary">Couldn&apos;t load the breakdown for this spike.</div>}

      {data && (
        <>
          {summary && <div className="text-sm">{summary.text}</div>}

          {summary && summary.others.length > 0 && (
            <div className="flex flex-col gap-y-[4px]">
              <div className="heading-small-xxs text-color-text-secondary">Other factors</div>
              <ul className="flex list-disc flex-col gap-y-[3px] pl-[16px] text-xs">
                {summary.others.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Event(s) */}
          {data.events.map((event) => (
            <div key={`${event.date}-${event.title}`} className="flex gap-x-[8px] rounded-[10px] bg-color-bg-medium p-[10px]">
              <GTPIcon icon={"gtp-calendar" as GTPIconName} size="sm" className="mt-[2px] shrink-0" />
              <div className="flex min-w-0 flex-col gap-y-[2px]">
                <div className="heading-small-xxs">
                  {event.title} <span className="text-color-text-secondary">· {formatDate(event.date)}</span>
                </div>
                <div className="text-xs text-color-text-secondary">{event.description}</div>
                {event.source && (
                  <a href={event.source} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                    Source
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Economics (revenue page): USD vs ETH revenue, L1 costs, margin */}
          {metric === "fees" && (
            <StatBox
              icon="gtp-metrics-feespaidbyusers"
              title="Economics that day"
              columns={2}
              cells={[
                { label: "Revenue (USD)", move: data.economics.revenue, kind: "usd" },
                { label: "Revenue (ETH)", move: data.economics.revenueEth, kind: "eth" },
                { label: "Rent paid to L1", move: data.economics.rentPaid, kind: "usd" },
                { label: "Onchain profit", move: data.economics.profit, kind: "usd" },
              ]}
            />
          )}

          {/* Active addresses vs transactions */}
          {addresses && txChange !== null && (
            <div className="flex flex-col gap-y-[6px] rounded-[10px] bg-color-bg-medium p-[10px]">
              <div className="flex items-center justify-between gap-x-[8px]">
                <div className="flex items-center gap-x-[6px]">
                  <GTPIcon icon={"gtp-metrics-activeaddresses" as GTPIconName} size="sm" />
                  <div className="heading-small-xxs">Active addresses</div>
                </div>
                {signal && (
                  <div
                    className="whitespace-nowrap rounded-full px-[8px] py-[2px] text-xxs"
                    style={{ color: ADDRESS_SIGNAL_LABELS[signal].tone, border: `1px solid ${ADDRESS_SIGNAL_LABELS[signal].tone}` }}
                  >
                    {ADDRESS_SIGNAL_LABELS[signal].label}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-x-[8px] text-xs">
                <div className="flex flex-col">
                  <span className="text-color-text-secondary">Transactions</span>
                  <span className="numbers-xs">{pct0(txChange)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-color-text-secondary">Addresses</span>
                  <span className="numbers-xs">
                    {formatSignedPct(addresses.increase, addresses.baseline)}{" "}
                    <span className="text-color-text-secondary">({formatCompact(addresses.value)})</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-color-text-secondary">Txs / address</span>
                  <span className="numbers-xs">
                    {formatRatio(addresses.txPerAddressBaseline)} → {formatRatio(addresses.txPerAddress)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Activity / network context */}
          {metric === "fees" ? (
            <StatBox
              icon="gtp-metrics-throughput"
              title="Activity that day"
              columns={2}
              cells={[
                { label: "Transactions", move: data.activity.txcount, kind: "count" },
                { label: "Avg fee per tx", move: feePerTx, kind: "usd" },
                { label: "Median tx cost", move: data.activity.txCost, kind: "usd" },
                { label: "Throughput", move: data.activity.throughput, kind: "throughput" },
              ]}
            />
          ) : (
            <StatBox
              icon="gtp-metrics-throughput"
              title="Network that day"
              columns={3}
              cells={[
                { label: "Throughput", move: data.activity.throughput, kind: "throughput" },
                { label: "Chain revenue", move: data.economics.revenue, kind: "usd" },
                { label: "Median tx cost", move: data.activity.txCost, kind: "usd" },
              ]}
            />
          )}

          {/* Market context: ETH + the chain's own token */}
          {(data.prices?.eth || data.prices?.token) && (
            <div className="flex flex-col gap-y-[6px] rounded-[10px] bg-color-bg-medium p-[10px]">
              <div className="flex items-center gap-x-[6px]">
                <GTPIcon icon={"gtp-metrics-marketcap" as GTPIconName} size="sm" />
                <div className="heading-small-xxs">Market that day</div>
              </div>
              <div className="grid grid-cols-2 gap-x-[8px] text-xs">
                {[data.prices.eth, data.prices.token].map((move, index) =>
                  move ? (
                    <div key={move.symbol} className="flex flex-col">
                      <span className="text-color-text-secondary">
                        {move.symbol} price{move.value !== null ? ` (${formatUsdPrice(move.value)})` : ""}
                      </span>
                      <span
                        className="numbers-xs"
                        style={
                          isVolatile(move, index === 0 ? VOLATILE_MOVE.ETH : VOLATILE_MOVE.token)
                            ? { color: move.largestRecentMove < 0 ? "#FE5468" : "#4CFF7E" }
                            : undefined
                        }
                      >
                        {formatPctChange(move.change)} <span className="text-color-text-secondary">that day</span>
                      </span>
                      {move.largestRecentMove !== move.change && (
                        <span className="text-xxs text-color-text-secondary">
                          biggest move in prior 2 days: {formatPctChange(move.largestRecentMove)}
                        </span>
                      )}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Blockspace breakdown of the increase */}
          {segments.length > 0 && (
            <div className="flex flex-col gap-y-[6px]">
              <div className="heading-small-xxs text-color-text-secondary">What made up the increase</div>
              <div className="flex h-[8px] w-full overflow-hidden rounded-full bg-color-bg-medium">
                {segments.map((s) => (
                  <div key={s.key} style={{ width: `${s.share * 100}%`, backgroundColor: s.color }} title={s.label} />
                ))}
              </div>
              <div className="flex flex-col gap-y-[3px]">
                {data.categories.slice(0, 4).map((c) => (
                  <div key={`${c.main_category}:${c.sub_category}`} className="flex items-center justify-between gap-x-[8px] text-xs">
                    <div className="flex min-w-0 items-center gap-x-[6px]">
                      <span
                        className="size-[8px] shrink-0 rounded-full"
                        style={{ backgroundColor: MAIN_CATEGORY_COLORS[c.main_category] ?? OTHER_COLOR }}
                      />
                      {MAIN_CATEGORY_ICONS[c.main_category] && (
                        <GTPIcon icon={MAIN_CATEGORY_ICONS[c.main_category]} size="sm" className="!size-[12px] shrink-0" />
                      )}
                      <span className="truncate">{categoryLabel(c)}</span>
                    </div>
                    <span className="numbers-xxs whitespace-nowrap">
                      +{formatAmount(metric, c.increase)} · {formatShare(c.increase, data.increase)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apps */}
          {data.apps.length > 0 && (
            <div className="flex flex-col gap-y-[6px]">
              <div className="heading-small-xxs text-color-text-secondary">
                {metric === "fees" ? "Apps whose users paid it" : "Apps behind it"}
              </div>
              {data.apps.slice(0, 4).map((app) => {
                const meta = ownerProjectToProjectData[app.owner_project];
                return (
                  <Link
                    key={app.owner_project}
                    href={`/applications/${app.owner_project}`}
                    className="flex items-center justify-between gap-x-[8px] rounded-full px-[6px] py-[2px] text-xs hover:bg-color-ui-hover"
                  >
                    <div className="flex min-w-0 items-center gap-x-[6px]">
                      {meta?.logo_path ? (
                        <Image
                          src={`https://api.growthepie.com/v1/apps/logos/${meta.logo_path}`}
                          width={16}
                          height={16}
                          className="shrink-0 rounded-full"
                          alt={meta.display_name}
                        />
                      ) : (
                        <GTPIcon icon={"gtp-project-monochrome" as GTPIconName} size="sm" className="!size-[16px] shrink-0" />
                      )}
                      <span className="truncate">{meta?.display_name ?? app.owner_project}</span>
                    </div>
                    <span className="numbers-xxs whitespace-nowrap">
                      +{formatAmount(metric, app.increase)} · {formatShare(app.increase, data.increase)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Contracts with no app behind them (bots, unlabeled) */}
          {data.unownedContracts.length > 0 && (
            <div className="flex flex-col gap-y-[6px]">
              <div className="heading-small-xxs text-color-text-secondary">
                {metric === "fees" ? "Top fee-paying contracts with no app" : "Busiest contracts with no app"} (
                {WINDOW_LABELS[data.contractsWindow] ?? data.contractsWindow})
              </div>
              {data.unownedContracts.slice(0, 3).map((contract) => {
                const label = contract.name ?? "Unnamed contract";
                const content = (
                  <>
                    <div className="flex min-w-0 items-center gap-x-[6px]">
                      <GTPIcon icon={"gtp-unlabeled" as GTPIconName} size="sm" className="!size-[12px] shrink-0" />
                      <span className="truncate">{label}</span>
                      <span className="numbers-xxs text-color-text-secondary">{shortAddress(contract.address)}</span>
                    </div>
                    <span className="numbers-xxs whitespace-nowrap">
                      {metric === "fees" ? `${formatUsdAmount(contract.fees_usd)} fees` : `${formatCompact(contract.txcount)} txs`}
                    </span>
                  </>
                );
                return explorerBase ? (
                  <a
                    key={contract.address}
                    href={`${explorerBase}/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-x-[8px] rounded-full px-[6px] py-[2px] text-xs hover:bg-color-ui-hover"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={contract.address} className="flex items-center justify-between gap-x-[8px] px-[6px] py-[2px] text-xs">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
