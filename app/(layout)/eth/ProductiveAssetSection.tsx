"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@react-hook/media-query";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card, { Callout } from "./_components/Card";
import { StackBar, Legend, BarRow, StatPair } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { AccentColor, FAKE_TEXT, fakeColor, ifFake } from "./_components/colors";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";

const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const compactUsd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : usd(n));

type Mode = "Stake" | "Lend" | "Borrow";

const MODES: Record<
  Mode,
  {
    icon: GTPIconName;
    headline: string;
    info: string;
    rate: number;
    rateLabel: string;
    parts: { label: string; value: number; color: AccentColor }[];
    facts: [string, string][];
    risk: string;
  }
> = {
  Stake: {
    icon: "gtp-lock",
    headline: "Lock ETH to validate. Get paid in ETH.",
    info: "Validators lock ETH as a security deposit and take turns proposing and checking blocks. In return they earn newly issued ETH, plus priority tips from users and MEV from block ordering, all paid in ETH.",
    rate: 3.12,
    rateLabel: "APR, paid in ETH",
    parts: [
      { label: "Issuance", value: 2.44, color: "turquoise" },
      { label: "Priority tips", value: 0.41, color: "yellow" },
      { label: "MEV", value: 0.27, color: "red" },
    ],
    facts: [
      ["Total staked", "36.7M ETH"],
      ["Share of supply", "30.4%"],
      ["Validators", "1.15M"],
      ["Exit queue", "~4 days"],
    ],
    risk: "Your stake can be slashed if your validator misbehaves, and it is illiquid while queued to exit. Liquid staking tokens trade that risk for a peg risk.",
  },
  Lend: {
    icon: "gtp-metrics-fdv",
    headline: "Deposit ETH into an open lending market.",
    info: "Lending markets pool deposited ETH and lend it to borrowers, who post other collateral. Depositors earn the interest borrowers pay, and the rate rises as more of the pool is borrowed.",
    rate: 1.94,
    rateLabel: "supply APR, variable",
    parts: [{ label: "Borrower interest", value: 1.94, color: "turquoise" }],
    facts: [
      ["ETH supplied", "9.4M ETH"],
      ["Utilisation", "78%"],
      ["Largest market", "Aave v3"],
      ["Withdrawal", "Instant"],
    ],
    risk: "The rate floats with demand and can go to near zero. Smart-contract failure or bad debt in the market can cost you the deposit.",
  },
  Borrow: {
    icon: "gtp-metrics-onchainprofit",
    headline: "Keep the ETH. Borrow against it.",
    info: "Post ETH as collateral and borrow stablecoins against it, without selling. You keep exposure to ETH, but pay interest on the loan and must keep the loan below the liquidation threshold.",
    rate: 4.6,
    rateLabel: "stablecoin borrow APR",
    parts: [
      { label: "Base rate", value: 3.4, color: "red" },
      { label: "Utilisation premium", value: 1.2, color: "yellow" },
    ],
    facts: [
      ["Max loan-to-value", "82.5%"],
      ["Liquidation at", "86%"],
      ["ETH as collateral", "$48.2B"],
      ["Loan term", "Open ended"],
    ],
    risk: "If ETH falls far enough, the position is liquidated and the collateral is sold automatically. Borrowing amplifies both directions.",
  },
};

// In the yield comparison, ETH is the subject; every other row is context, so it
// stays grey (the "emphasis" form rather than a rainbow of categorical hues).
const YIELD_ETH_KEY = "eth_staked";

export default function ProductiveAssetSection() {
  const [mode, setMode] = useState<Mode>("Stake");
  const [amount, setAmount] = useState(10);
  const [modesWrapping, setModesWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 967px)");
  const { data: kpisData } = useEthAssetSection("kpis");
  const { data: propsData } = useEthAssetSection("properties");
  const { data: productiveData } = useEthAssetSection("productive_asset");
  const price = kpisData?.data?.kpis?.eth_price?.timeframes?.["24h"]?.current;
  const supply = kpisData?.data?.kpis?.eth_supply?.timeframes?.["24h"]?.current;
  const stakedShare = kpisData?.data?.kpis?.staked_share?.timeframes?.["24h"]?.current;
  const yieldBreakdown = propsData?.data?.yield_breakdown;
  const collateralUsd = propsData?.data?.collateral?.total_usd;

  // Stake's rate, split and staked figures, and Borrow's collateral total, come from
  // kpis.json / properties.json; the rest of MODES stays illustrative.
  const modes = useMemo(() => {
    const stakeFacts = MODES.Stake.facts.map(([k, v]): [string, string] => {
      if (k === "Total staked" && supply && stakedShare) return [k, `${((supply * stakedShare) / 1e6).toFixed(1)}M ETH`];
      if (k === "Share of supply" && stakedShare) return [k, `${(stakedShare * 100).toFixed(1)}%`];
      return [k, v];
    });
    const borrowFacts = MODES.Borrow.facts.map(([k, v]): [string, string] =>
      k === "ETH as collateral" && collateralUsd ? [k, compactUsd(collateralUsd)] : [k, v],
    );
    // Facts whose value came from the JSONs; every other fact is illustrative.
    const liveFacts = new Set<string>([
      ...(supply && stakedShare ? ["Total staked"] : []),
      ...(stakedShare ? ["Share of supply"] : []),
      ...(collateralUsd ? ["ETH as collateral"] : []),
    ]);
    return {
      liveFacts,
      ...MODES,
      Stake: {
        ...MODES.Stake,
        facts: stakeFacts,
        ...(yieldBreakdown && {
          rate: yieldBreakdown.total * 100,
          parts: [
            { label: "Issuance", value: yieldBreakdown.breakdown.issuance * 100, color: "turquoise" as AccentColor },
            { label: "Priority tips", value: yieldBreakdown.breakdown.tips * 100, color: "yellow" as AccentColor },
            { label: "MEV", value: yieldBreakdown.breakdown.mev * 100, color: "red" as AccentColor },
          ],
        }),
      },
      Borrow: { ...MODES.Borrow, facts: borrowFacts },
    };
  }, [supply, stakedShare, yieldBreakdown, collateralUsd]);

  const m = modes[mode];
  // Only Stake's rate is live (once properties.json has loaded); Lend and Borrow are illustrative.
  const rateIsFake = !(mode === "Stake" && yieldBreakdown);
  // Stake earnings use the live rate and price; Lend uses a fake rate; Borrow a fake LTV and rate.
  const calcIsFake = rateIsFake || !price;
  const yearly = price
    ? mode === "Borrow"
      ? amount * 0.825 * price * 0.046
      : amount * price * (m.rate / 100)
    : null;
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
        Gold sits in a vault. ETH can do three jobs — and it can do them at the same time.
      </SectionDescription>

      {/* Same control bar as the fundamentals charts. The buttons fill the bar once it's
          more than half full; on mobile they also get tighter padding (as fundamentals
          does) so all three fit on a 320px phone. */}
      <GTPButtonContainer
        isWrapping={modesWrapping}
        setIsWrapping={setModesWrapping}
        style={modesWrapping ? { borderRadius: "15px" } : undefined}
      >
        <GTPButtonRow autoFill>
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
      </GTPButtonContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] items-start">
        <Card fake={rateIsFake}>
          <div className="flex items-start gap-x-[8px]">
            <span className="heading-small-xs flex-1 min-w-0">{m.headline}</span>
            <Tooltip placement="bottom-end">
              <TooltipTrigger asChild>
                <button type="button" aria-label={`About ${mode}`} className="shrink-0 inline-flex items-center justify-center">
                  <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm">
                {m.info}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-baseline gap-x-[5px]">
            <span className={`numbers-3xl ${mode === "Borrow" ? "text-color-accent-red" : "text-color-accent-turquoise"} ${ifFake(rateIsFake, FAKE_TEXT)}`}>
              {m.rate.toFixed(2)}%
            </span>
            <span className="heading-small-xxxs pt-[1px]">{m.rateLabel}</span>
          </div>
          <StackBar
            parts={m.parts.filter((p) => p.value > 0).map((p) => (rateIsFake ? { ...p, color: fakeColor(p.color) } : p))}
          />
          <Legend
            items={m.parts
              .filter((p) => p.value > 0)
              .map((p) => ({ label: p.label, color: rateIsFake ? fakeColor(p.color) : p.color, value: p.value.toFixed(2) + "%", fake: rateIsFake }))}
          />
        </Card>

        <Card fake={calcIsFake}>
          <span className="heading-small-xs">{mode === "Borrow" ? "What you could borrow" : "What it earns you"}</span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className="numbers-xl">{amount} ETH</span>
            <span className="numbers-xs text-color-text-primary/70">
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
          <div className="h-px bg-color-bg-medium" />
          <StatPair
            label={mode === "Borrow" ? "Borrowing power at 82.5% LTV" : "Per year, at today's rate"}
            value={
              mode === "Borrow"
                ? price
                  ? usd(amount * price * 0.825)
                  : "—"
                : (amount * (m.rate / 100)).toFixed(3)
            }
            unit={mode === "Borrow" ? "" : "ETH"}
            valueClassName={`numbers-2xl ${mode === "Borrow" ? "text-color-accent-yellow" : "text-color-accent-turquoise"} ${ifFake(calcIsFake, FAKE_TEXT)}`}
          />
          <span className={`text-xs ${ifFake(calcIsFake, FAKE_TEXT)}`}>
            {mode === "Borrow" ? "Interest ≈ " : "≈ "}
            {yearly !== null ? usd(yearly) : "—"} / yr
          </span>
        </Card>

        <Card fake={m.facts.some(([k]) => !modes.liveFacts.has(k))}>
          <span className="heading-small-xs">By the numbers</span>
          <div className="grid grid-cols-2 gap-[10px]">
            {m.facts.map(([k, v]) => (
              <div key={k} className="px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium">
                <StatPair label={k} value={v} valueClassName={`numbers-sm ${ifFake(!modes.liveFacts.has(k), FAKE_TEXT)}`} />
              </div>
            ))}
          </div>
          <Callout color="border-color-accent-red">
            <div className="flex gap-x-[10px] items-start">
              <GTPIcon icon="gtp-unverified-monochrome" size="sm" className="flex-shrink-0 text-color-accent-red" />
              <span>{m.risk}</span>
            </div>
          </Callout>
        </Card>
      </div>

      <Card>
        <span className="heading-small-xs">Yield on the asset itself — what each one pays just for holding it</span>
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
        <span className="text-xs md:text-sm">
          Nominal rates. Staking pays in ETH, so the dollar value moves with the price — a treasury does not.
        </span>
        <span className="text-xs text-color-text-primary/70">
          Hover a row for how it&apos;s measured.{yieldSources.length > 0 && <> Sources: {yieldSources.join(", ")}.</>}
        </span>
      </Card>

      <IllustrativeNote>
        The staking rate and split, ETH staked, ETH as collateral, the ETH price and the yield comparison are live.
        Lend and borrow rates and the validator and queue figures are illustrative.
      </IllustrativeNote>
    </div>
  );
}
