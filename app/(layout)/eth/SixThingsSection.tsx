"use client";

import useSWR from "swr";
import { useTheme } from "next-themes";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { SparklineChart } from "@/components/layout/Applications/AppMetricCard";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { EthAssetURLs } from "@/lib/urls";
import Card from "./_components/Card";
import { StackBar, Legend, BarRow } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { ACCENT_HEX, AccentColor, FAKE_TEXT, fakeColor, ACCENT_BG } from "./_components/colors";
import { EthAssetPropertiesResponse } from "@/lib/eth-the-asset/data";

// Fractions → "2.56%".
const pct = (fraction: number, digits = 2) => `${(fraction * 100).toFixed(digits)}%`;
const signedPct = (fraction: number) => `${fraction >= 0 ? "+" : "−"}${Math.abs(fraction * 100).toFixed(2)}%`;

const formatUsd = (usd: number) =>
  usd >= 1e9 ? `$${(usd / 1e9).toFixed(1)}B` : usd >= 1e6 ? `$${(usd / 1e6).toFixed(1)}M` : `$${Math.round(usd).toLocaleString("en-US")}`;

// The gas sparkline shows the last 90 of the 365 daily points.
const GAS_SPARKLINE_DAYS = 90;

function PropCard({
  icon,
  title,
  tag,
  value,
  unit,
  info,
  children,
  fake = false,
}: {
  icon: GTPIconName;
  title: string;
  tag: string;
  value: string;
  unit: string;
  info: React.ReactNode;
  children?: React.ReactNode;
  /** Fixed facts rather than JSON data: purple tile, brown headline while SHOW_FAKE_DATA is on. */
  fake?: boolean;
}) {
  return (
    <Card fake={fake}>
      {/* Title truncates before the tag or info button get squeezed on narrow cards. */}
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={icon} size="md" className="shrink-0" />
        <span className="heading-small-xs flex-1 min-w-0 truncate">{title}</span>
        <span className="heading-small-xxxs shrink-0 whitespace-nowrap px-[8px] py-[3px] rounded-full bg-color-bg-medium">{tag}</span>
        <Tooltip placement="bottom-end">
          <TooltipTrigger asChild>
            <button type="button" aria-label={`About ${title}`} className="shrink-0 inline-flex items-center justify-center">
              <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm">
            {info}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-[5px] gap-y-[2px]">
        <span className={`numbers-2xl ${fake ? FAKE_TEXT : ""}`}>{value}</span>
        <span className={`heading-small-xxxs pt-[1px] ${fake ? FAKE_TEXT : ""}`}>{unit}</span>
      </div>
      {children}
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
            <span className="text-xs md:text-sm">{r.label}</span>
            <span className={`numbers-xs ${FAKE_TEXT}`}>
              {r.hours}h · {r.note}
            </span>
          </div>
          <div className="flex gap-[2px] h-[10px]">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className={`flex-1 rounded-[2px] ${
                  // Fixed facts: brown while SHOW_FAKE_DATA is on. Real: bg-color-accent-turquoise / bg-color-ui-hover.
                  h < r.hours ? ACCENT_BG[fakeColor(r.color === "turquoise" ? "turquoise" : "neutral")] : "bg-color-bg-medium"
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
  const { data, isLoading } = useSWR<EthAssetPropertiesResponse>(EthAssetURLs.properties);
  const props = data?.data;

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

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-backgroundinformation" title="ETH is 6 things at once" titleSize="md" as="h2" />
      <SectionDescription>Most assets are one of these. ETH is all six.</SectionDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[15px]">
        <PropCard
          icon="gtp-metrics-fdv"
          title="Productive"
          tag="yield"
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
          tag="store of value"
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
          tag="collateral"
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
          tag="bearer asset"
          fake
          value="12s"
          unit="to settle, any day"
          info="Whoever holds the keys owns the ETH, with no bank or broker in between. A new block lands every 12 seconds; times for the other rails are typical, not exact."
        >
          <div className="grid grid-cols-2 gap-[8px]">
            {[
              ["ETH transfer", "12 sec", true],
              ["Card payment", "1–3 days", false],
              ["Bank wire", "1–5 days", false],
              ["Stock trade", "T+1", false],
            ].map(([label, value, highlight]) => (
              <div key={label as string} className="flex flex-col gap-y-[2px] px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium">
                <span className="heading-small-xxxs text-color-text-primary/70">{label as string}</span>
                <span className={`numbers-sm ${highlight ? "text-color-accent-turquoise" : ""} ${FAKE_TEXT}`}>{value as string}</span>
              </div>
            ))}
          </div>
        </PropCard>

        <PropCard
          icon="gtp-metrics-throughput"
          title="Useful"
          tag="digital oil"
          value="ETH"
          unit={l2Count ? `pays for gas on L1 and ${l2Count} Layer 2s` : "pays for gas on L1 and Layer 2s"}
          info="Transactions on Ethereum Mainnet and its Layer 2s use ETH to pay for computation and blockspace. The chart shows ETH paid as gas per day across them over the last 90 days. Source: growthepie."
        >
          <div className="mt-auto">
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
          tag="freedom tech"
          fake
          value="24/7"
          unit="for over 11 years"
          info="Ethereum has produced blocks continuously since July 2015, with no market hours, weekends or holidays, and no one can block a valid transaction from being included."
        >
          <div className="text-xs md:text-sm">Censorship-resistant and always available.</div>
          <MarketHours />
        </PropCard>
      </div>

      <IllustrativeNote>Settlement times for card payments, wires and stock trades are typical, not exact.</IllustrativeNote>
    </div>
  );
}
