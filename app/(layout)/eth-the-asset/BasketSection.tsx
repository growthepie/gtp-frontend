"use client";

import { useState } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import IllustrativeTag from "./_components/IllustrativeTag";
import { ACCENT_BG, ACCENT_RGB } from "./_components/colors";

// Illustrative retail prices — no live source for consumer-goods pricing exists
// in this repo. ETH price is a fixed illustrative anchor for the same reason.
const PRICE_NOW = 4182;
const PRICE_YR_AGO = 3030;

const BASKET: [string, string, number, number][] = [
  ["Dozen eggs", "dozen", 4.1, 3.98],
  ["Loaf of bread", "loaves", 3.2, 3.11],
  ["Cup of coffee", "cups", 4.8, 4.6],
  ["Tank of fuel", "tanks", 62, 64],
  ["Month of rent", "months", 1510, 1455],
  ["Gram of gold", "grams", 84, 71],
];

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : n >= 10 ? n.toFixed(1) : n.toFixed(2));
const signed = (n: number) => (n < 0 ? "−" : "+") + fmt(Math.abs(n));

function Quantity({ count, unit }: { count: number; unit: string }) {
  const filled = Math.max(1, Math.min(60, count > 60 ? 48 : Math.round(count)));
  const per = count / filled;
  return (
    <div className="flex flex-col gap-y-[6px]">
      <div className="grid grid-cols-[repeat(20,1fr)] gap-[2.5px] w-full">
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[1.5px]"
            style={{ background: i < filled ? ACCENT_RGB.yellow : "rgb(var(--bg-medium))", opacity: i < filled ? 0.3 + (i / filled) * 0.7 : 1 }}
          />
        ))}
      </div>
      <span className="heading-caps-xxs text-color-text-secondary">each block ≈ {per >= 10 ? Math.round(per) : per.toFixed(1)} {unit}</span>
    </div>
  );
}

function ForceBar({ title, note, delta, unit, pct, width, positive }: { title: string; note: string; delta: number; unit: string; pct: string; width: number; positive: boolean }) {
  return (
    <div className="flex flex-col gap-y-[4px]">
      <div className="flex justify-between items-baseline gap-x-[10px]">
        <span className="text-sm">{title}</span>
        <span className={`numbers-sm whitespace-nowrap ${positive ? "text-color-positive" : "text-color-negative"}`}>
          {signed(delta)} {unit}
        </span>
      </div>
      <div className="h-[10px] rounded-full bg-color-bg-medium overflow-hidden">
        <div className={`h-full rounded-full ${positive ? ACCENT_BG.yellow : "bg-color-negative"}`} style={{ width: `${Math.max(1.5, width)}%` }} />
      </div>
      <span className="heading-caps-xxs text-color-text-secondary">{pct} · {note}</span>
    </div>
  );
}

export default function BasketSection() {
  const [item, setItem] = useState("Dozen eggs");
  const [force, setForce] = useState<"Both" | "ETH price only" | "Shop price only">("Both");
  const [label, unit, pNow, pAgo] = BASKET.find((b) => b[0] === item)!;

  const agoUnits = PRICE_YR_AGO / pAgo;
  const nowUnits = PRICE_NOW / pNow;
  const ethOnly = PRICE_NOW / pAgo;
  const shopOnly = PRICE_YR_AGO / pNow;
  const ethDelta = ethOnly - agoUnits;
  const shopDelta = nowUnits - ethOnly;
  const totalDelta = nowUnits - agoUnits;
  const scale = Math.max(Math.abs(ethDelta), Math.abs(shopDelta));

  const shown = force === "Both" ? nowUnits : force === "ETH price only" ? ethOnly : shopOnly;
  const ethPct = (PRICE_NOW / PRICE_YR_AGO - 1) * 100;
  const shopPct = (pNow / pAgo - 1) * 100;

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionHeader
        icon="gtp-users"
        title="The shopping basket — what it actually buys"
        description="Supply only matters if it changes what one ETH gets you. Two things move that number, and neither of them is the burn."
      >
        <GTPButtonRow>
          {BASKET.map(([l]) => (
            <GTPButton key={l} label={l} isSelected={item === l} clickHandler={() => setItem(l)} size="sm" />
          ))}
        </GTPButtonRow>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
        <Card>
          <span className="heading-caps-xs text-color-text-secondary">
            {force === "Both" ? "1 ETH buys today" : force === "ETH price only" ? "1 ETH buys — ETH price change only" : "1 ETH buys — shop price change only"}
          </span>
          <div className="flex items-baseline gap-x-[8px]">
            <span className="numbers-4xl text-color-accent-yellow">{fmt(shown)}</span>
            <span className="heading-caps-sm text-color-text-secondary">{unit}</span>
          </div>
          <Quantity count={shown} unit={unit} />
          <GTPButtonRow>
            {(["Both", "ETH price only", "Shop price only"] as const).map((f) => (
              <GTPButton key={f} label={f} isSelected={force === f} clickHandler={() => setForce(f)} size="xs" />
            ))}
          </GTPButtonRow>
          <span className="text-xs text-color-text-secondary">
            {force === "Both"
              ? `At $${PRICE_NOW.toLocaleString()} per ETH and $${pNow.toFixed(2)} per ${unit.replace(/s$/, "")}. A year ago: ${fmt(agoUnits)}.`
              : force === "ETH price only"
                ? `Shop price held at last year's $${pAgo.toFixed(2)} — only ETH moved.`
                : `ETH held at last year's $${PRICE_YR_AGO.toLocaleString()} — only the shop price moved.`}
          </span>
          <IllustrativeTag />
        </Card>

        <Card>
          <span className="heading-caps-xs text-color-text-secondary">What changed the basket in a year</span>
          <ForceBar
            title="ETH price — the market"
            note="no rules, large numbers"
            delta={ethDelta}
            unit={unit}
            pct={(ethPct > 0 ? "+" : "−") + Math.abs(ethPct).toFixed(0) + "% ETH price"}
            width={(Math.abs(ethDelta) / scale) * 100}
            positive
          />
          <ForceBar
            title="Shop prices — inflation"
            note="what the goods themselves cost"
            delta={shopDelta}
            unit={unit}
            pct={(shopPct > 0 ? "+" : "−") + Math.abs(shopPct).toFixed(1) + "% shelf price"}
            width={(Math.abs(shopDelta) / scale) * 100}
            positive={shopDelta >= 0}
          />
          <div className="flex justify-between items-baseline pt-[4px] border-t border-color-bg-medium">
            <span className="heading-caps-xs text-color-text-secondary">Net change</span>
            <span className={`numbers-lg ${totalDelta < 0 ? "text-color-negative" : "text-color-positive"}`}>
              {signed(totalDelta)} {unit}
            </span>
          </div>
          <div className="flex gap-x-[8px] px-[12px] py-[10px] rounded-[8px] bg-color-bg-medium">
            <GTPIcon icon="gtp-info" size="sm" className="!text-color-accent-turquoise flex-shrink-0 mt-[2px]" />
            <span className="text-xs text-color-text-primary">
              Supply is not on this list. Net supply growth moves your <em>share of the network</em> — not what ETH buys. The market decides what that share is worth.
            </span>
          </div>
        </Card>

        <Card>
          <span className="heading-caps-xs text-color-text-secondary">The full basket — units per 1 ETH, vs a year ago</span>
          {BASKET.map(([l, u, pn, pa]) => {
            const n = PRICE_NOW / pn;
            const a = PRICE_YR_AGO / pa;
            const ch = (n / a - 1) * 100;
            return (
              <div key={l} className="grid grid-cols-[118px_1fr_74px_58px] gap-x-[8px] items-center">
                <span className="text-xs text-color-text-secondary whitespace-nowrap">{l}</span>
                <div className="h-[8px] rounded-full bg-color-bg-medium overflow-hidden">
                  <div className="h-full bg-color-accent-yellow" style={{ width: `${Math.min(100, (ch / 45) * 100)}%` }} />
                </div>
                <span className="numbers-xs text-right">{fmt(n)}</span>
                <span className={`numbers-xs text-right ${ch < 0 ? "text-color-negative" : "text-color-positive"}`}>
                  {ch < 0 ? "−" : "+"}
                  {Math.abs(ch).toFixed(0)}%
                </span>
              </div>
            );
          })}
          <span className="text-xxs text-color-text-secondary">Gold rose too, so ETH gained less against it than against bread. Illustrative retail prices.</span>
        </Card>
      </div>
    </div>
  );
}
