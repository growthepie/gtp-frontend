"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@react-hook/media-query";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import InfoButton from "./_components/InfoButton";
import { StackBar, Legend, BarRow, StatPair } from "./_components/StatBar";
import { AccentColor, FALLBACK_TEXT, ifFallback } from "./_components/colors";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";

const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const compactUsd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : usd(n));
const pct = (fraction: number, digits = 2) => `${(fraction * 100).toFixed(digits)}%`;
const compactEth = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M ETH` : n >= 1e3 ? `${Math.round(n / 1e3)}K ETH` : `${Math.round(n)} ETH`;
const days = (d: number) => (d < 1 ? "< 1 day" : `~${Math.round(d)} ${Math.round(d) === 1 ? "day" : "days"}`);

type Mode = "Stake" | "Lend" | "Borrow";

// The wording for each mode. Every number comes from live.json's productive_uses.
const MODES: Record<Mode, { icon: GTPIconName; headline: string; info: string; rateLabel: string; risk: string }> = {
  Stake: {
    icon: "gtp-lock",
    headline: "Lock ETH to validate. Get paid in ETH.",
    info: "Validators lock ETH as a security deposit and take turns proposing and checking blocks. In return they earn newly issued ETH, plus priority tips from users and MEV from block ordering, all paid in ETH.",
    rateLabel: "APR, paid in ETH",
    risk: "Your stake can be slashed if your validator misbehaves, and it is illiquid while queued to exit. Liquid staking tokens trade that risk for a peg risk.",
  },
  Lend: {
    icon: "gtp-metrics-fdv",
    headline: "Deposit ETH into an open lending market.",
    info: "Lending markets pool deposited ETH and lend it to borrowers, who post other collateral. Depositors earn the interest borrowers pay, and the rate rises as more of the pool is borrowed.",
    rateLabel: "supply APR, variable",
    risk: "The rate floats with demand and can go to near zero. Smart-contract failure or bad debt in the market can cost you the deposit.",
  },
  Borrow: {
    icon: "gtp-metrics-onchainprofit",
    headline: "Keep the ETH. Borrow against it.",
    info: "Post ETH as collateral and borrow stablecoins against it, without selling. You keep exposure to ETH, but pay interest on the loan and must keep the loan below the liquidation threshold.",
    rateLabel: "stablecoin borrow APR",
    risk: "If ETH falls far enough, the position is liquidated and the collateral is sold automatically. Borrowing amplifies both directions.",
  },
};

type Part = { label: string; value: number; color: AccentColor };
/** A "By the numbers" tile. `note` is a smaller line under the value. */
type Fact = { label: string; value: string; note?: string };

// In the yield comparison, ETH is the subject; every other row is context, so it
// stays grey (the "emphasis" form rather than a rainbow of categorical hues).
const YIELD_ETH_KEY = "eth_staked";

export default function ProductiveAssetSection() {
  const [mode, setMode] = useState<Mode>("Stake");
  const [amount, setAmount] = useState(10);
  const [modesWrapping, setModesWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 967px)");
  const { data: productiveData, isLoading } = useEthAssetSection("productive_asset");
  const uses = productiveData?.data?.productive_uses;
  const price = uses?.price_usd;

  // This mode's rate, its split, the tiles and sources. Null until the data is in.
  const live = useMemo(() => {
    if (!uses) return null;
    if (mode === "Stake") {
      const { stake } = uses;
      const facts: Fact[] = [
        { label: "Total staked", value: compactEth(stake.total_staked_eth) },
        { label: "Share of supply", value: pct(stake.share_of_supply, 1) },
      ];
      // The validator and queue figures can be null: their tiles are left out then.
      if (stake.active_validators != null) facts.push({ label: "Validators", value: stake.active_validators.toLocaleString("en-US") });
      if (stake.exit_queue?.days != null)
        facts.push({
          label: "Exit queue",
          value: days(stake.exit_queue.days),
          note: stake.exit_queue.eth != null ? `${compactEth(stake.exit_queue.eth)} waiting` : undefined,
        });
      if (stake.entry_queue?.days != null)
        facts.push({
          label: "Entry queue",
          value: days(stake.entry_queue.days),
          note: stake.entry_queue.eth != null ? `${compactEth(stake.entry_queue.eth)} waiting` : undefined,
        });
      return {
        rate: stake.apr,
        parts: [
          { label: "Issuance", value: stake.apr_breakdown.issuance, color: "turquoise" },
          { label: "Priority tips", value: stake.apr_breakdown.tips, color: "yellow" },
          { label: "MEV", value: stake.apr_breakdown.mev, color: "red" },
        ] as Part[],
        facts,
        rateNote: null as string | null,
        sources: stake.sources,
      };
    }
    if (mode === "Lend") {
      const { lend } = uses;
      return {
        rate: lend.apr,
        parts: [{ label: "Borrower interest", value: lend.apr_breakdown.borrower_interest, color: "turquoise" }] as Part[],
        facts: [
          { label: "ETH supplied", value: compactEth(lend.lending_supplied_eth) },
          { label: "Utilisation", value: pct(lend.utilisation, 0) },
          { label: "Largest market", value: lend.market.name },
          {
            label: "Withdrawal",
            value: "Instant",
            note:
              lend.market_available_liquidity_eth != null
                ? `up to ${compactEth(lend.market_available_liquidity_eth)} in ${lend.market.name} now`
                : undefined,
          },
        ] as Fact[],
        // Why depositors get less than borrowers pay.
        rateNote:
          lend.borrow_apr != null && lend.reserve_factor != null
            ? `Borrowers pay ${pct(lend.borrow_apr)}. ${pct(lend.reserve_factor, 0)} of that goes to the market's reserve, and only the ${pct(lend.utilisation, 0)} of the pool that is lent out earns it, so depositors get ${pct(lend.apr)}.`
            : null,
        sources: lend.sources,
      };
    }
    const { borrow } = uses;
    const stables = Object.entries(borrow.stablecoins ?? {}).filter(([, v]) => Number.isFinite(v.borrow_apr));
    return {
      rate: borrow.apr,
      parts: [
        { label: "Base rate", value: borrow.apr_breakdown.base_rate, color: "turquoise" },
        { label: "Utilisation", value: borrow.apr_breakdown.utilisation, color: "yellow" },
        { label: "Above-kink premium", value: borrow.apr_breakdown.above_kink_premium, color: "red" },
      ] as Part[],
      facts: [
        { label: "Max loan-to-value", value: pct(borrow.max_ltv, 1) },
        { label: "Liquidation at", value: pct(borrow.liquidation_threshold, 1) },
        { label: "ETH as collateral", value: compactUsd(borrow.eth_collateral_usd), note: compactEth(borrow.eth_collateral_eth) },
        { label: "Loan term", value: "Open ended" },
      ] as Fact[],
      rateNote: stables.length
        ? `Average of ${stables.map(([k, v]) => `${k} ${pct(v.borrow_apr)}`).join(" and ")} on ${borrow.market.name}.`
        : null,
      sources: borrow.sources,
    };
  }, [uses, mode]);

  const m = MODES[mode];
  // Fallback (dev only): loaded, but no productive_uses to show.
  const missing = !isLoading && !live;
  // Only the parts that aren't zero are drawn.
  const parts = (live?.parts ?? []).filter((p) => p.value > 0);
  const maxLtv = uses?.borrow.max_ltv;
  const borrowingPower = price && maxLtv ? amount * price * maxLtv : null;
  const yearly =
    live && price ? (mode === "Borrow" ? (borrowingPower ?? 0) * live.rate : amount * price * live.rate) : null;
  // Every row, in the JSON's order, from productive_asset.json (values are fractions).
  const yieldComparison = (productiveData?.data?.yield_comparison?.assets ?? [])
    .filter((a) => Number.isFinite(a.value))
    .map((a) => ({ key: a.key, label: a.name, value: a.value * 100, method: a.method, emphasis: a.key === YIELD_ETH_KEY }));
  const yieldMax = Math.max(0, ...yieldComparison.map((row) => row.value));
  const yieldSources = [
    ...new Set((productiveData?.data?.yield_comparison?.assets ?? []).flatMap((a) => a.sources.map((s) => s.name))),
  ];

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-metrics-fdv" title="ETH is a productive asset" titleSize="md" as="h2" />
      <SectionDescription>
        Gold sits in a vault. ETH can do three jobs, and it can do them at the same time.
      </SectionDescription>

      {/* Same control bar as the fundamentals charts. The buttons fill the bar once it's
          more than half full; on mobile they also get tighter padding (as fundamentals
          does) so all three fit on a 320px phone. */}
      {/* flex-nowrap: the i-button stays on the buttons' line; on the narrowest phones the
          buttons shrink a little instead of pushing it onto a second row. */}
      <GTPButtonContainer
        className="flex-nowrap"
        isWrapping={modesWrapping}
        setIsWrapping={setModesWrapping}
        style={modesWrapping ? { borderRadius: "15px" } : undefined}
      >
        <GTPButtonRow autoFill className="min-w-0">
          {(Object.keys(MODES) as Mode[]).map((k) => (
            <GTPButton
              key={k}
              label={k}
              leftIcon={MODES[k].icon}
              innerStyle={isMobile ? { minWidth: 0, padding: "5px 8px" } : undefined}
              className="min-w-0"
              isSelected={mode === k}
              clickHandler={() => setMode(k)}
              size="sm"
            />
          ))}
        </GTPButtonRow>
        {/* Sources for all three modes, at the end of the bar (as in the hero). */}
        {live?.sources?.length ? (
          <InfoButton label="Sources" className="self-stretch px-[8px]" color="rgb(var(--text-primary))">
            Sources: {[...new Set(live.sources.map((s) => s.name))].join(", ")}.
          </InfoButton>
        ) : null}
      </GTPButtonContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
        <Card fallback={missing}>
          <div className="flex items-center gap-x-[8px]">
            <span className="heading-small-xs min-w-0">{m.headline}</span>
            <InfoButton label={`About ${mode}`}>
              <span>{m.info}</span>
              {/* Lend explains its rate here; Borrow shows its stablecoin split on the card. */}
              {mode === "Lend" && live?.rateNote && <span>{live.rateNote}</span>}
            </InfoButton>
          </div>
          <div className="flex items-baseline gap-x-[5px]">
            <span
              className={`numbers-3xl ${mode === "Borrow" ? "text-color-accent-red" : "text-color-accent-turquoise"} ${ifFallback(missing, FALLBACK_TEXT)}`}
            >
              {live ? pct(live.rate) : "—"}
            </span>
            <span className="heading-small-xxxs pt-[1px]">{m.rateLabel}</span>
          </div>
          {/* Title and rate stay at the top; the breakdown sits on the card's bottom edge,
              so it lines up with the result in the card beside it when this one is taller than needed. */}
          <div className="mt-auto flex flex-col gap-y-[10px]">
            {parts.length > 0 && (
              <>
                <StackBar parts={parts} />
                <Legend items={parts.map((p) => ({ label: p.label, color: p.color, value: pct(p.value) }))} />
              </>
            )}
            {mode === "Borrow" && live?.rateNote && <span className="text-xs text-color-text-primary/70">{live.rateNote}</span>}
          </div>
        </Card>

        <Card fallback={missing}>
          <span className="heading-small-xs">{mode === "Borrow" ? "What you could borrow" : "What it earns you"}</span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className="numbers-xl">{amount} ETH</span>
            <span className={`numbers-xs text-color-text-primary/70 ${ifFallback(missing, FALLBACK_TEXT)}`}>
              ≈ {price ? usd(amount * price) : "—"}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
            aria-label="Amount of ETH"
            className="w-full h-[20px] cursor-pointer"
            style={{ accentColor: "rgb(var(--accent-turquoise))" }}
          />
          {/* The result sits on the card's bottom edge; the amount and slider stay at the top. */}
          <div className="mt-auto flex flex-col gap-y-[10px]">
            <div className="h-px bg-color-bg-medium" />
            <StatPair
              label={mode === "Borrow" ? `Borrowing power at ${maxLtv ? pct(maxLtv, 1) : "—"} LTV` : "Per year, at today's rate"}
              value={
                mode === "Borrow"
                  ? borrowingPower !== null
                    ? usd(borrowingPower)
                    : "—"
                  : live
                    ? (amount * live.rate).toFixed(3)
                    : "—"
              }
              unit={mode === "Borrow" ? "" : "ETH"}
              valueClassName={`numbers-2xl ${mode === "Borrow" ? "text-color-accent-yellow" : "text-color-accent-turquoise"} ${ifFallback(missing, FALLBACK_TEXT)}`}
            />
            <span className={`text-xs ${ifFallback(missing, FALLBACK_TEXT)}`}>
              {mode === "Borrow" ? "Interest ≈ " : "≈ "}
              {yearly !== null ? usd(yearly) : "—"} / yr
            </span>
          </div>
        </Card>

        <Card fallback={missing}>
          <div className="flex items-center gap-x-[8px]">
            <span className="heading-small-xs min-w-0">By the numbers</span>
            {/* The risks of this mode, on hover. */}
            <InfoButton label={`Risks of ${{ Stake: "staking", Lend: "lending", Borrow: "borrowing" }[mode]}`}>
              {m.risk}
            </InfoButton>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-[10px]">
            {(live?.facts ?? []).map((f, i, all) => (
              // An odd last tile spans both columns.
              <div
                key={f.label}
                className={`px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium ${i === all.length - 1 && all.length % 2 ? "col-span-2" : ""}`}
              >
                <StatPair label={f.label} value={f.value} valueClassName="numbers-sm" />
                {f.note && <div className="text-xxs text-color-text-primary/70 pt-[2px]">{f.note}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-x-[8px]">
          <span className="heading-small-xs min-w-0">Yield on the asset itself: what each one pays just for holding it</span>
          <InfoButton label="About these rates">
            <span>Hover a row for how it&apos;s measured.</span>
            {yieldSources.length > 0 && <span>Sources: {yieldSources.join(", ")}.</span>}
          </InfoButton>
        </div>
        <div className="flex flex-col gap-y-[8px]">
          {yieldComparison.map((row) => (
            <BarRow
              key={row.key}
              label={row.label}
              value={row.value}
              display={row.value.toFixed(2) + "%"}
              max={yieldMax}
              color={row.emphasis ? "turquoise" : "neutral"}
              emphasis={row.emphasis}
              accentLabel={row.emphasis}
              hint={row.method}
            />
          ))}
        </div>
        <span className="text-sm">
          Nominal rates. Staking pays in ETH, so the dollar value moves with the price. A treasury does not.
        </span>
      </Card>
    </div>
  );
}
