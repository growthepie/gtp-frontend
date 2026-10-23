"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { SparklineChart } from "@/components/layout/Applications/AppMetricCard";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";
import { formatUptime } from "@/components/layout/EthAgg/helpers";
import Card from "./_components/Card";
import InfoButton from "@/components/GTPComponents/GTPInfoButton";
import { StackBar, Legend, BarRow } from "./_components/StatBar";
import { ACCENT_HEX, AccentColor, FAKE_TEXT, ACCENT_BG, FALLBACK_TEXT, ifFallback } from "./_components/colors";

// Fractions → "2.56%".
const pct = (fraction: number, digits = 2) => `${(fraction * 100).toFixed(digits)}%`;
const signedPct = (fraction: number) => `${fraction >= 0 ? "+" : "−"}${Math.abs(fraction * 100).toFixed(2)}%`;

const formatUsd = (usd: number) =>
  usd >= 1e9 ? `$${(usd / 1e9).toFixed(1)}B` : usd >= 1e6 ? `$${(usd / 1e6).toFixed(1)}M` : `$${Math.round(usd).toLocaleString("en-US")}`;

// Live block time in seconds → "12" (one decimal only when it isn't whole).
const formatSeconds = (s: number) => `${Number(s.toFixed(1))}`;

// Ethereum's genesis block (30 July 2015), the start of the uptime on the
// ecosystem page's "Ethereum Uptime" card (EthAgg/MetricsTop.tsx).
const GENESIS_MS = 1438269973000;

// Ethereum's live chain stats. Only the first message is read (see useEthBlockTime).
const ETH_CHAIN_SSE_URL = "https://sse.growthepie.com/events/chain/ethereum";

/**
 * Ethereum's block time in seconds, read once on load. The stream sends a message a
 * second (~2.8 MB an hour) for a number that's almost always 12, so the connection
 * closes after its first message instead of staying open.
 */
function useEthBlockTime() {
  const [blockTime, setBlockTime] = useState<number | null>(null);
  // True once the stream has answered or failed, so a missing value counts as a fallback.
  const [done, setDone] = useState(false);
  useEffect(() => {
    const source = new EventSource(ETH_CHAIN_SSE_URL);
    source.onmessage = (event) => {
      source.close();
      try {
        const value = JSON.parse(event.data)?.data?.block_time;
        if (Number.isFinite(value) && value > 0) setBlockTime(value);
      } catch {
        // Leave it empty: the card shows "—".
      }
      setDone(true);
    };
    // Don't let EventSource keep retrying; the card just shows "—".
    source.onerror = () => {
      source.close();
      setDone(true);
    };
    return () => source.close();
  }, []);
  return { blockTime, done };
}

// The gas sparkline shows the last 90 of the 365 daily points.
const GAS_SPARKLINE_DAYS = 90;

function PropCard({
  icon,
  title,
  tag,
  value,
  unit,
  unitShort,
  info,
  children,
  fake = false,
  fallback = false,
}: {
  icon: GTPIconName;
  title: string;
  tag: string;
  value: string;
  unit: string;
  /** Shown instead of `unit` when `unit` doesn't fit on the same line as `value`. */
  unitShort?: string;
  info: React.ReactNode;
  children?: React.ReactNode;
  /** Fixed facts rather than JSON data: purple tile, brown headline while SHOW_FAKE_DATA is on. */
  fake?: boolean;
  /** The value is a fallback (its data didn't arrive): purple tile and brown headline on dev only. */
  fallback?: boolean;
}) {
  // With a short unit, check whether value + full unit fit on one line. A hidden copy
  // of the full unit is measured, since the visible one may be the short form.
  const row = useRef<HTMLDivElement>(null);
  const valueEl = useRef<HTMLSpanElement>(null);
  const fullUnit = useRef<HTMLSpanElement>(null);
  const [unitFits, setUnitFits] = useState(true);
  useEffect(() => {
    if (!unitShort || !row.current) return;
    // Fires once on observe, which sets the first measurement.
    const observer = new ResizeObserver(() => {
      if (!row.current || !valueEl.current || !fullUnit.current) return;
      setUnitFits(valueEl.current.offsetWidth + 5 + fullUnit.current.offsetWidth <= row.current.clientWidth);
    });
    observer.observe(row.current);
    return () => observer.disconnect();
  }, [unitShort]);

  return (
    <Card fake={fake} fallback={fallback}>
      {/* Title truncates before the tag or info button get squeezed on narrow cards. */}
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={icon} size="md" className="shrink-0" />
        <span className="heading-small-xs min-w-0 truncate">{title}</span>
        <InfoButton label={`About ${title}`}>
          {info}
        </InfoButton>
        <span className="heading-small-xxxs ml-auto shrink-0 whitespace-nowrap px-[8px] py-[3px] rounded-full bg-color-bg-medium">{tag}</span>
      </div>
      {/* gap-x matches the 5px in the fit check above. */}
      <div ref={row} className="relative flex flex-wrap items-baseline gap-x-[5px] gap-y-[2px]">
        <span ref={valueEl} className={`numbers-2xl ${fake ? FAKE_TEXT : ""} ${ifFallback(fallback, FALLBACK_TEXT)}`}>{value}</span>
        <span className={`heading-small-xxxs pt-[1px] ${fake ? FAKE_TEXT : ""}`}>{unitShort && !unitFits ? unitShort : unit}</span>
        {unitShort && (
          <span ref={fullUnit} aria-hidden className="heading-small-xxxs absolute invisible whitespace-nowrap pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {/* Title and value stay at the top; the visual sits on the card's bottom edge, so
          cards in the same row end on the same line whatever their content height. */}
      {children && <div className="mt-auto flex flex-col gap-y-[10px]">{children}</div>}
    </Card>
  );
}

/** Always-open vs market hours — the point "no market hours" makes visually. */
function MarketHours() {
  const rows: { label: string; hours: number; note: string; color: AccentColor }[] = [
    { label: "Ethereum", hours: 24, note: "every day", color: "turquoise" },
    { label: "Stock market", hours: 6.5, note: "weekdays", color: "neutral" },
  ];
  return (
    <div className="flex flex-col gap-y-[10px]">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-y-[4px]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs">{r.label}</span>
            <span className="numbers-xs">
              {r.hours}h · {r.note}
            </span>
          </div>
          <div className="flex gap-[2px] h-[10px]">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className={`flex-1 rounded-full ${
                  h < r.hours ? ACCENT_BG[r.color] : "bg-color-bg-medium"
                }`}
                style={h === Math.floor(r.hours) && r.hours % 1 > 0 ? { opacity: r.hours % 1 } : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SixThingsSection() {
  const { resolvedTheme } = useTheme();
  const feeColor = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"].yellow;
  const { data, isLoading } = useEthAssetSection("properties");
  const props = data?.data;
  // Ethereum's block time from the growthepie stream (same feed as the chain pages), read once on load.
  const { blockTime: liveBlockTime, done: blockTimeDone } = useEthBlockTime();
  const blockTime = liveBlockTime ? formatSeconds(liveBlockTime) : null;

  const yieldBreakdown = props?.yield_breakdown;
  const scarcity = props?.scarcity?.assets;
  const scarceRows: { label: string; value: number; color: AccentColor; emphasis?: boolean; method: string }[] = scarcity
    ? [
        { label: "ETH", value: scarcity.eth.value, color: "turquoise", emphasis: true, method: scarcity.eth.method },
        { label: scarcity.gold.name, value: scarcity.gold.value, color: "neutral", method: scarcity.gold.method },
        { label: scarcity.usd.name, value: scarcity.usd.value, color: "neutral", method: scarcity.usd.method },
      ]
    : [];
  const scarceMax = Math.max(...scarceRows.map((r) => Math.abs(r.value)), 0);

  const collateral = props?.collateral;
  const collateralParts: { label: string; short: string; share: number; color: AccentColor }[] = collateral
    ? [
        { label: "Lending markets", short: "Lending", share: collateral.breakdown.lending.share, color: "turquoise" as AccentColor },
        { label: "Liquid staking", short: "Liquid staking", share: collateral.breakdown.liquid_staking.share, color: "yellow" as AccentColor },
        { label: "DEX liquidity", short: "DEX", share: collateral.breakdown.dex.share, color: "red" as AccentColor },
      ].sort((a, b) => b.share - a.share)
    : [];

  const gasPaid = props?.gas_paid;
  const recentGas = gasPaid?.data?.slice(-GAS_SPARKLINE_DAYS).filter((row) => Number.isFinite(row[0]) && Number.isFinite(row[1])) ?? [];
  const l2Count = gasPaid?.chains?.count_l2;

  // Same calculation as the ecosystem page's uptime, to the day ("11 years, 2 months, 16 days").
  // Read once on mount: it only changes daily, so no ticking timer like the ecosystem card's.
  // The heading starts with the whole years ("11 years, …"), used for the short form.
  const [uptime] = useState(() => {
    const full = formatUptime(Date.now() - GENESIS_MS).heading;
    return { full, years: parseInt(full, 10) };
  });

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-backgroundinformation" title="ETH is 6 things at once" titleSize="md" as="h2" />
      <SectionDescription>Most assets are one of these. ETH is all six.</SectionDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[15px]">
        <PropCard
          icon="gtp-metrics-fdv"
          title="Productive"
          tag="Yield"
          fallback={!isLoading && !yieldBreakdown}
          value={yieldBreakdown ? pct(yieldBreakdown.total) : "—"}
          unit="APR, paid in ETH"
          info="Stakers lock ETH to secure Ethereum and are paid in ETH: new issuance plus priority tips and MEV. Source: ethsupply.fyi."
        >
          {yieldBreakdown && (
            <>
              <StackBar
                parts={[
                  { label: "Issuance", value: yieldBreakdown.breakdown.issuance, color: "turquoise" },
                  { label: "Tips + MEV", value: yieldBreakdown.breakdown.tips + yieldBreakdown.breakdown.mev, color: "yellow" },
                ]}
              />
              <Legend
                items={[
                  { label: "Issuance", color: "turquoise", value: pct(yieldBreakdown.breakdown.issuance) },
                  { label: "Tips + MEV", color: "yellow", value: pct(yieldBreakdown.breakdown.tips + yieldBreakdown.breakdown.mev) },
                ]}
              />
            </>
          )}
        </PropCard>

        <PropCard
          icon="gtp-shield"
          title="Scarce"
          tag="Store of Value"
          fallback={!isLoading && !scarcity}
          value={scarcity ? signedPct(scarcity.eth.value) : "—"}
          unit="ETH supply a year"
          info={
            <span className="flex flex-col gap-y-[6px]">
              <span>New issuance is partly offset by the base-fee burn, so supply grows slowly or even shrinks.</span>
              {scarceRows.map((r) => (
                <span key={r.label}>
                  <span className="font-semibold">{r.label}:</span> {r.method}.
                </span>
              ))}
            </span>
          }
        >
          <div className="flex flex-col gap-y-[6px]">
            {scarceRows.map((r) => (
              <BarRow
                key={r.label}
                label={r.label}
                value={Math.abs(r.value)}
                display={signedPct(r.value)}
                max={scarceMax}
                color={r.color}
                emphasis={r.emphasis}
              />
            ))}
          </div>
          <div className="text-xs">Annual change in total stock.</div>
        </PropCard>

        <PropCard
          icon="gtp-metrics-totalvaluelocked"
          title="Trusted"
          tag="Collateral"
          fallback={!isLoading && !collateral}
          value={collateral ? formatUsd(collateral.total_usd) : "—"}
          unit={collateral ? `${(collateral.total_eth / 1e6).toFixed(1)}M ETH posted onchain` : "ETH posted onchain"}
          info="ETH is the main collateral onchain: it backs loans in lending markets, liquid staking tokens and DEX liquidity. Source: DefiLlama, updated daily."
        >
          {collateralParts.length > 0 && (
            <>
              <StackBar parts={collateralParts.map((p) => ({ label: p.label, value: p.share, color: p.color }))} />
              <Legend items={collateralParts.map((p) => ({ label: p.short, color: p.color, value: pct(p.share, 0) }))} />
            </>
          )}
        </PropCard>

        <PropCard
          icon="gtp-wallet"
          title="Reliable"
          tag="Bearer Asset"
          fallback={blockTimeDone && !blockTime}
          value={blockTime ? `${blockTime}s` : "—"}
          unit="to settle, any day"
          info={`Whoever holds the keys owns the ETH, with no bank or broker in between. A new block lands every ${blockTime ?? "12"} seconds (block time from growthepie, read when the page loads); times for the other rails are typical, not exact.`}
        >
          {/* ETH's time is the live block time; the other rails are fixed, typical times.
              Each tile is a size container: "1 business day" (~104px) drops to its short
              form, "T+1", when the tile is too narrow for it. */}
          <div className="grid grid-cols-2 gap-[8px]">
            {[
              { label: "ETH transfer", value: blockTime ? `${blockTime} sec` : "—", highlight: true },
              { label: "Card payment", value: "1–3 days" },
              { label: "Bank wire", value: "1–5 days" },
              { label: "Stock trade", value: "1 business day", short: "T+1" },
            ].map(({ label, value, highlight, short }) => (
              <div key={label} className="@container flex flex-col gap-y-[2px] px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium">
                <span className="heading-small-xxxs text-color-text-primary/70">{label}</span>
                <span className={`numbers-sm whitespace-nowrap ${highlight ? "text-color-accent-turquoise" : ""} ${ifFallback(!!highlight && blockTimeDone && !blockTime, FALLBACK_TEXT)}`}>
                  {short ? (
                    <>
                      <span className="hidden @[108px]:inline">{value}</span>
                      <span className="@[108px]:hidden">{short}</span>
                    </>
                  ) : (
                    value
                  )}
                </span>
              </div>
            ))}
          </div>
        </PropCard>

        <PropCard
          icon="gtp-metrics-throughput"
          title="Useful"
          tag="Digital Oil"
          fallback={!isLoading && recentGas.length <= 1}
          value="ETH"
          unit={l2Count ? `pays for gas on L1 and ${l2Count} Layer 2s` : "pays for gas on L1 and Layer 2s"}
          info="Transactions on Ethereum Mainnet and its Layer 2s use ETH to pay for computation and blockspace. The chart shows ETH paid as gas per day across them over the last 90 days. Source: growthepie."
        >
          <div>
            {recentGas.length > 1 ? (
              <div className="h-[72px]">
                <SparklineChart
                  values={recentGas.map((row) => row[1])}
                  timestamps={recentGas.map((row) => new Date(row[0]).toISOString().slice(0, 10))}
                  color={feeColor}
                  label="Gas paid"
                  prefix=""
                  suffix=" ETH"
                  height={72}
                />
              </div>
            ) : (
              <div className="flex h-[72px] items-center text-xs text-color-text-primary/70">
                {isLoading ? "Loading gas fees..." : "Gas fee data unavailable"}
              </div>
            )}
          </div>
        </PropCard>

        <PropCard
          icon="gtp-clock"
          title="Available"
          tag="Freedom Tech"
          value="24/7"
          unit={`for ${uptime.full}`}
          unitShort={`for over ${uptime.years} years`}
          info="Ethereum has produced blocks continuously since July 2015, with no market hours, weekends or holidays, and no one can block a valid transaction from being included. Settlement times for card payments, wires and stock trades are typical, not exact."
        >
          <div className="text-sm">Censorship-resistant and always available.</div>
          <MarketHours />
        </PropCard>
      </div>
    </div>
  );
}
