"use client";

import { useState } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import { StackBar, Legend, BarRow } from "./_components/StatBar";
import IllustrativeTag from "./_components/IllustrativeTag";
import { AccentColor } from "./_components/colors";

const ETH_PRICE_FALLBACK = 4182;

type Mode = "Stake" | "Lend" | "Borrow";

const MODES: Record<
  Mode,
  {
    icon: GTPIconName;
    headline: string;
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
    rate: 3.12,
    rateLabel: "APR, paid in ETH",
    parts: [
      { label: "Issuance", value: 2.44, color: "turquoise" },
      { label: "Priority tips", value: 0.41, color: "yellow" },
      { label: "MEV", value: 0.27, color: "petrol" },
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
    rate: 1.94,
    rateLabel: "supply APR, variable",
    parts: [{ label: "Borrower interest", value: 1.94, color: "turquoise" }],
    facts: [
      ["ETH supplied", "9.4M ETH"],
      ["Utilisation", "78%"],
      ["Largest market", "Aave v3"],
      ["Withdrawal", "Instant while liquid"],
    ],
    risk: "The rate floats with demand and can go to near zero. Smart-contract failure or bad debt in the market can cost you the deposit.",
  },
  Borrow: {
    icon: "gtp-metrics-onchainprofit",
    headline: "Keep the ETH. Borrow against it.",
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
      ["Loan term", "None — open ended"],
    ],
    risk: "If ETH falls far enough, the position is liquidated and the collateral is sold automatically. Borrowing amplifies both directions.",
  },
};

const YIELD_COMPARISON: [string, number, AccentColor | "primary"][] = [
  ["ETH staked", 3.12, "turquoise"],
  ["US 10-year treasury", 4.21, "primary"],
  ["S&P 500 dividend", 1.27, "primary"],
  ["Gold", 0, "yellow"],
  ["Bitcoin", 0, "red"],
  ["Cash savings", 0.42, "primary"],
];

export default function ProductiveAssetSection() {
  const [mode, setMode] = useState<Mode>("Stake");
  const [amount, setAmount] = useState(10);
  const m = MODES[mode];
  const yearly = mode === "Borrow" ? amount * 0.825 * ETH_PRICE_FALLBACK * 0.046 : amount * ETH_PRICE_FALLBACK * (m.rate / 100);

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionHeader
        icon="gtp-metrics-fdv"
        title="ETH is a productive asset"
        description="Gold sits in a vault. ETH can do three jobs — and it can do them at the same time."
      >
        <GTPButtonRow>
          {(Object.keys(MODES) as Mode[]).map((k) => (
            <GTPButton key={k} label={k} leftIcon={MODES[k].icon} isSelected={mode === k} clickHandler={() => setMode(k)} size="sm" />
          ))}
        </GTPButtonRow>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
        <Card>
          <span className="heading-sm">{m.headline}</span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className={`numbers-5xl ${mode === "Borrow" ? "text-color-accent-red" : "text-color-accent-turquoise"}`}>{m.rate.toFixed(2)}%</span>
            <span className="heading-caps-xs text-color-text-secondary">{m.rateLabel}</span>
          </div>
          <StackBar parts={m.parts.filter((p) => p.value > 0)} height={15} />
          <Legend items={m.parts.filter((p) => p.value > 0).map((p) => ({ label: p.label, color: p.color, value: p.value.toFixed(2) + "%" }))} />
          <IllustrativeTag />
        </Card>

        <Card>
          <span className="heading-caps-xs text-color-text-secondary">{mode === "Borrow" ? "What you could borrow" : "What it earns you"}</span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className="numbers-xl">{amount} ETH</span>
            <span className="numbers-xs text-color-text-secondary">≈ ${(amount * ETH_PRICE_FALLBACK).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
            className="w-full"
            style={{ accentColor: "rgb(var(--accent-turquoise))" }}
          />
          <div className="h-px bg-color-bg-medium" />
          <div className="flex flex-col gap-y-[2px]">
            <span className="heading-caps-xs text-color-text-secondary">{mode === "Borrow" ? "Borrowing power at 82.5% LTV" : "Per year, at today's rate"}</span>
            <span className={`numbers-3xl ${mode === "Borrow" ? "text-color-accent-yellow" : "text-color-accent-turquoise"}`}>
              {mode === "Borrow"
                ? "$" + (amount * ETH_PRICE_FALLBACK * 0.825).toLocaleString("en-US", { maximumFractionDigits: 0 })
                : (amount * (m.rate / 100)).toFixed(3) + " ETH"}
            </span>
            <span className="numbers-xs text-color-text-secondary">
              {mode === "Borrow" ? "Interest ≈ $" + yearly.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " / yr" : "≈ $" + yearly.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " / yr at today's price"}
            </span>
          </div>
          <IllustrativeTag label="illustrative price" />
        </Card>

        <Card>
          <span className="heading-caps-xs text-color-text-secondary">By the numbers</span>
          {m.facts.map(([k, v]) => (
            <div key={k} className="flex justify-between items-baseline gap-x-[15px]">
              <span className="text-sm text-color-text-secondary">{k}</span>
              <span className="numbers-sm">{v}</span>
            </div>
          ))}
          <div className="h-px bg-color-bg-medium mt-auto" />
          <div className="flex gap-x-[8px]">
            <GTPIcon icon="gtp-unverified" size="sm" className="!text-color-accent-red flex-shrink-0 mt-[2px]" />
            <span className="text-xs text-color-text-secondary">{m.risk}</span>
          </div>
        </Card>
      </div>

      <Card>
        <span className="heading-caps-xs text-color-text-secondary">Yield on the asset itself — what each one pays just for holding it</span>
        {YIELD_COMPARISON.map(([label, value, color]) => (
          <BarRow
            key={label}
            label={label}
            value={value}
            display={value.toFixed(2) + "%"}
            max={4.21}
            color={color === "primary" ? "muted" : color}
            muted={color === "primary"}
          />
        ))}
        <span className="text-xxs text-color-text-secondary">Nominal rates. Staking pays in ETH, so the dollar value moves with the price — a treasury does not.</span>
        <IllustrativeTag />
      </Card>
    </div>
  );
}
