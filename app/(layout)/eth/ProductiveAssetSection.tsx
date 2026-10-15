"use client";

import { useState } from "react";
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
import { AccentColor } from "./_components/colors";

const ETH_PRICE_ANCHOR = 4182;

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

// ETH is the subject; every other row is context, so it stays grey (the
// "emphasis" form rather than a rainbow of categorical hues).
const YIELD_COMPARISON: { label: string; value: number; emphasis?: boolean }[] = [
  { label: "ETH staked", value: 3.12, emphasis: true },
  { label: "US 10-year treasury", value: 4.21 },
  { label: "S&P 500 dividend", value: 1.27 },
  { label: "Gold", value: 0 },
  { label: "Bitcoin", value: 0 },
  { label: "Cash savings", value: 0.42 },
];

export default function ProductiveAssetSection() {
  const [mode, setMode] = useState<Mode>("Stake");
  const [amount, setAmount] = useState(10);
  const [modesWrapping, setModesWrapping] = useState(false);
  const isMobile = useMediaQuery("(max-width: 967px)");
  const m = MODES[mode];
  const yearly =
    mode === "Borrow" ? amount * 0.825 * ETH_PRICE_ANCHOR * 0.046 : amount * ETH_PRICE_ANCHOR * (m.rate / 100);

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-metrics-fdv" title="ETH is a productive asset" titleSize="md" as="h2" />
      <SectionDescription>
        Gold sits in a vault. ETH can do three jobs — and it can do them at the same time.
      </SectionDescription>

      {/* Same control bar as the fundamentals charts. On mobile the buttons share the
          full width with tighter padding (as fundamentals does) so all three fit on a
          320px phone. */}
      <GTPButtonContainer
        isWrapping={modesWrapping}
        setIsWrapping={setModesWrapping}
        style={modesWrapping ? { borderRadius: "15px" } : undefined}
      >
        <GTPButtonRow style={{ width: isMobile ? "100%" : "auto" }}>
          {(Object.keys(MODES) as Mode[]).map((k) => (
            <GTPButton
              key={k}
              label={k}
              leftIcon={MODES[k].icon}
              innerStyle={isMobile ? { width: "100%", minWidth: 0, padding: "5px 8px" } : { width: "100%" }}
              className="w-full min-w-0 justify-center"
              isSelected={mode === k}
              clickHandler={() => setMode(k)}
              size="sm"
            />
          ))}
        </GTPButtonRow>
      </GTPButtonContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] items-start">
        <Card>
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
            <span className={`numbers-3xl ${mode === "Borrow" ? "text-color-accent-red" : "text-color-accent-turquoise"}`}>
              {m.rate.toFixed(2)}%
            </span>
            <span className="heading-small-xxxs pt-[1px]">{m.rateLabel}</span>
          </div>
          <StackBar parts={m.parts.filter((p) => p.value > 0)} />
          <Legend
            items={m.parts
              .filter((p) => p.value > 0)
              .map((p) => ({ label: p.label, color: p.color, value: p.value.toFixed(2) + "%" }))}
          />
        </Card>

        <Card>
          <span className="heading-small-xs">{mode === "Borrow" ? "What you could borrow" : "What it earns you"}</span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className="numbers-xl">{amount} ETH</span>
            <span className="numbers-xs text-color-text-primary/70">
              ≈ ${(amount * ETH_PRICE_ANCHOR).toLocaleString("en-US", { maximumFractionDigits: 0 })}
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
                ? "$" + (amount * ETH_PRICE_ANCHOR * 0.825).toLocaleString("en-US", { maximumFractionDigits: 0 })
                : (amount * (m.rate / 100)).toFixed(3)
            }
            unit={mode === "Borrow" ? "" : "ETH"}
            valueClassName={`numbers-2xl ${mode === "Borrow" ? "text-color-accent-yellow" : "text-color-accent-turquoise"}`}
          />
          <span className="text-xs">
            {mode === "Borrow" ? "Interest ≈ " : "≈ "}${yearly.toLocaleString("en-US", { maximumFractionDigits: 0 })} / yr
          </span>
        </Card>

        <Card>
          <span className="heading-small-xs">By the numbers</span>
          <div className="grid grid-cols-2 gap-[10px]">
            {m.facts.map(([k, v]) => (
              <div key={k} className="px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium">
                <StatPair label={k} value={v} valueClassName="numbers-sm" />
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
          {YIELD_COMPARISON.map((row) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={row.value}
              display={row.value.toFixed(2) + "%"}
              max={4.21}
              color={row.emphasis ? "turquoise" : "neutral"}
              emphasis={row.emphasis}
            />
          ))}
        </div>
        <span className="text-xs md:text-sm">
          Nominal rates. Staking pays in ETH, so the dollar value moves with the price — a treasury does not.
        </span>
      </Card>

      <IllustrativeNote>Rates and market figures in this section are illustrative.</IllustrativeNote>
    </div>
  );
}
