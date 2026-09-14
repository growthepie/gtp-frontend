"use client";

import { useEffect, useState } from "react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import { StackBar, Legend, StatPair } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";

const FALLBACK_SUPPLY = 120.7e6;
const FALLBACK_ISSUE_WK = 18050;

// Illustrative — no live network-demand/burn endpoint exists yet. Shape only:
// higher demand for blockspace burns more ETH per week.
const burnAt = (d: number) => Math.round(1500 + Math.pow(d / 100, 1.7) * 29000);
const fmtPct = (v: number) => (v < 0 ? "−" : "+") + Math.abs(v).toFixed(2) + "%";

const PRESETS = [
  { name: "Quiet week", d: 22, note: "Layer 2s made transactions cheap. Little ETH burns." },
  { name: "Busy week", d: 58, note: "Fees rise with demand, so more ETH burns." },
  { name: "Mania", d: 92, note: "Burn overtakes issuance. Supply shrinks." },
];

const LABEL_STYLE = {
  font: "600 13px var(--font-raleway)",
  letterSpacing: ".01em",
} as const;
const VALUE_STYLE = { font: "500 18px var(--font-fira-sans)", letterSpacing: ".05em" } as const;

function Bathtub({
  inflow,
  outflow,
  totalSupply,
  height = 260,
}: {
  inflow: number;
  outflow: number;
  totalSupply: number;
  height?: number;
}) {
  const net = inflow - outflow;
  const level = 0.5 + Math.max(-0.22, Math.min(0.22, net / 30000)) * 0.9;
  const waterTop = 190 - level * 120;
  const drainW = 6 + (outflow / 31000) * 26;
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      setT((p) => p + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const drops = Array.from({ length: 7 }, (_, i) => (t * 2.4 + i * 26) % 182);
  const embers = Array.from({ length: 6 }, (_, i) => (t * 1.9 + i * 30) % 180);

  return (
    <svg viewBox="0 0 420 258" style={{ width: "100%", height, display: "block" }} role="img" aria-label="ETH issued versus ETH burned">
      <rect x="86" y="8" width="34" height="9" rx="4" fill="rgb(var(--bg-medium))" />
      <rect x="99" y="14" width="8" height="14" rx="3" fill="rgb(var(--bg-medium))" />
      {drops.map(
        (y, i) =>
          y < 170 && (
            <circle
              key={i}
              cx={103 + Math.sin((y + i * 20) / 22) * 2.5}
              cy={30 + y * 0.78}
              r="3.1"
              fill="rgb(var(--accent-turquoise))"
              opacity={0.85 - y / 260}
            />
          ),
      )}
      <text x="130" y="20" fill="rgb(var(--text-primary))" style={LABEL_STYLE}>
        Issued to stakers
      </text>
      <text x="130" y="40" fill="rgb(var(--accent-turquoise))" style={VALUE_STYLE}>
        +{Math.round(inflow).toLocaleString()} ETH/wk
      </text>

      <path d="M34 118 h352 v52 a34 34 0 0 1 -34 34 h-284 a34 34 0 0 1 -34 -34 z" fill="rgb(var(--bg-medium))" opacity=".5" />
      <clipPath id="tubclip">
        <path d="M34 118 h352 v52 a34 34 0 0 1 -34 34 h-284 a34 34 0 0 1 -34 -34 z" />
      </clipPath>
      <g clipPath="url(#tubclip)">
        <rect x="34" y={waterTop} width="352" height="240" fill="rgb(var(--accent-petrol))" opacity=".55" />
        <rect x="34" y={waterTop} width="352" height="3" fill="rgb(var(--accent-turquoise))" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="34" y={waterTop + 14 + i * 16} width="352" height="1" fill="rgb(var(--accent-turquoise))" opacity=".14" />
        ))}
      </g>
      <path d="M34 118 h352 v52 a34 34 0 0 1 -34 34 h-284 a34 34 0 0 1 -34 -34 z" fill="none" stroke="rgb(var(--ui-hover))" strokeWidth="1.5" />
      <text x="52" y="158" fill="rgb(var(--text-primary))" style={VALUE_STYLE}>
        {(totalSupply / 1e6).toFixed(1)}M ETH
      </text>
      <text x="52" y="178" fill="rgb(var(--text-primary))" opacity=".85" style={LABEL_STYLE}>
        Total supply
      </text>

      <rect x={210 - drainW / 2} y="200" width={drainW} height="16" rx="3" fill="rgb(var(--accent-red))" opacity=".35" />
      {embers.map((y, i) => (
        <circle
          key={i}
          cx={210 + Math.sin((y + i * 17) / 14) * (drainW / 2.4)}
          cy={214 + y * 0.18}
          r={Math.max(0, 2.6 - y / 120)}
          fill="rgb(var(--accent-red))"
          opacity={Math.max(0, 0.8 - y / 230)}
        />
      ))}
      <text x="250" y="230" fill="rgb(var(--text-primary))" style={LABEL_STYLE}>
        Burned by fees
      </text>
      <text x="250" y="250" fill="rgb(var(--accent-red))" style={VALUE_STYLE}>
        −{outflow.toLocaleString()} ETH/wk
      </text>
    </svg>
  );
}

export default function SupplySection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const [demand, setDemand] = useState(58);
  const totalSupply = ethSnapshot?.totalSupply ?? FALLBACK_SUPPLY;
  const inflow = ethSnapshot?.weeklyIssuanceEth ?? FALLBACK_ISSUE_WK;
  const outflow = burnAt(demand);
  const netEth = inflow - outflow;
  const netPct = ((netEth * 52) / totalSupply) * 100;
  const preset = PRESETS.reduce((a, b) => (Math.abs(b.d - demand) < Math.abs(a.d - demand) ? b : a));

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-metrics-economics" title="The supply, in one picture" titleSize="md" as="h2" />
      <SectionDescription>Inflation and burn are abstract. A tap and a drain are not.</SectionDescription>

      <div className="flex gap-[15px] flex-wrap items-center">
        <GTPButtonRow>
          {PRESETS.map((p) => (
            <GTPButton key={p.name} label={p.name} isSelected={preset.name === p.name} clickHandler={() => setDemand(p.d)} size="sm" />
          ))}
        </GTPButtonRow>
        <div className="flex items-center gap-x-[10px] flex-1 min-w-[220px]">
          <span className="heading-small-xs whitespace-nowrap">Network demand</span>
          <input
            type="range"
            min="0"
            max="100"
            value={demand}
            onChange={(e) => setDemand(+e.target.value)}
            aria-label="Network demand"
            className="flex-1 h-[20px] cursor-pointer"
            style={{ accentColor: "rgb(var(--accent-turquoise))" }}
          />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="p-[15px]">
          <Bathtub inflow={inflow} outflow={outflow} totalSupply={totalSupply} />
        </div>
        <div className="p-[20px] flex flex-col gap-y-[15px] justify-center border-t md:border-t-0 md:border-l border-color-bg-medium">
          <StatPair
            label="Net change in the water level, per year"
            value={fmtPct(netPct)}
            valueClassName={`numbers-3xl ${netEth < 0 ? "text-color-positive" : ""}`}
          />
          <StackBar
            parts={[
              { label: "Burned", value: outflow, color: "red" },
              { label: "Stays in the tub", value: Math.max(0, netEth), color: "turquoise" },
            ]}
          />
          <Legend
            items={[
              { label: "Burned", color: "red", value: Math.round((outflow / inflow) * 100) + "% of issuance" },
              { label: "Net new", color: "turquoise", value: `${netEth > 0 ? "+" : ""}${Math.round(netEth).toLocaleString()} ETH` },
            ]}
          />
          <div className="h-px bg-color-bg-medium" />
          <span className="text-xs md:text-sm">{preset.note}</span>
        </div>
      </Card>

      <IllustrativeNote>
        Issuance is live from growthepie data; the demand-to-burn curve is illustrative.
      </IllustrativeNote>
    </div>
  );
}
