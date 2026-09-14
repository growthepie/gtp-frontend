"use client";

import { useEffect, useState } from "react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import { StackBar, Legend } from "./_components/StatBar";
import IllustrativeTag from "./_components/IllustrativeTag";
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

function Bathtub({ inflow, outflow, totalSupply, height = 250 }: { inflow: number; outflow: number; totalSupply: number; height?: number }) {
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
    <svg viewBox="0 0 420 250" style={{ width: "100%", height, display: "block" }}>
      <rect x="86" y="8" width="34" height="9" rx="4" fill="rgb(var(--bg-medium))" />
      <rect x="99" y="14" width="8" height="14" rx="3" fill="rgb(var(--bg-medium))" />
      {drops.map(
        (y, i) =>
          y < 170 && (
            <circle key={i} cx={103 + Math.sin((y + i * 20) / 22) * 2.5} cy={30 + y * 0.78} r="3.1" fill="rgb(var(--accent-turquoise))" opacity={0.85 - y / 260} />
          ),
      )}
      <text x="128" y="20" fill="rgb(var(--text-primary))" opacity=".62" style={{ font: "600 11px var(--font-raleway)", fontVariant: "all-small-caps", letterSpacing: ".02em" }}>
        issued to stakers
      </text>
      <text x="128" y="38" fill="rgb(var(--accent-turquoise))" style={{ font: "500 17px var(--font-fira-sans)", letterSpacing: ".05em" }}>
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
      <text x="50" y="162" fill="rgb(var(--text-primary))" style={{ font: "500 16px var(--font-fira-sans)", letterSpacing: ".05em" }}>
        {(totalSupply / 1e6).toFixed(1)}M ETH
      </text>
      <text x="50" y="180" fill="rgb(var(--text-primary))" opacity=".7" style={{ font: "600 11px var(--font-raleway)", fontVariant: "all-small-caps", letterSpacing: ".02em" }}>
        total supply
      </text>

      <rect x={210 - drainW / 2} y="200" width={drainW} height="16" rx="3" fill="rgb(var(--accent-red))" opacity=".35" />
      {embers.map((y, i) => (
        <circle key={i} cx={210 + Math.sin((y + i * 17) / 14) * (drainW / 2.4)} cy={214 + y * 0.18} r={Math.max(0, 2.6 - y / 120)} fill="rgb(var(--accent-red))" opacity={Math.max(0, 0.8 - y / 230)} />
      ))}
      <text x="248" y="228" fill="rgb(var(--text-primary))" opacity=".62" style={{ font: "600 11px var(--font-raleway)", fontVariant: "all-small-caps", letterSpacing: ".02em" }}>
        burned by fees
      </text>
      <text x="248" y="246" fill="rgb(var(--accent-red))" style={{ font: "500 17px var(--font-fira-sans)", letterSpacing: ".05em" }}>
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
  const netPct = (netEth * 52 / totalSupply) * 100;
  const preset = PRESETS.reduce((a, b) => (Math.abs(b.d - demand) < Math.abs(a.d - demand) ? b : a));

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionHeader icon="gtp-metrics-economics" title="The supply, in one picture" description="Inflation and burn are abstract. A tap and a drain are not.">
        <div className="flex gap-[10px] flex-wrap items-center">
          <GTPButtonRow>
            {PRESETS.map((p) => (
              <GTPButton key={p.name} label={p.name} isSelected={preset.name === p.name} clickHandler={() => setDemand(p.d)} size="sm" />
            ))}
          </GTPButtonRow>
          <div className="flex items-center gap-x-[10px] flex-1 min-w-[200px]">
            <span className="heading-caps-xxs text-color-text-secondary whitespace-nowrap">network demand</span>
            <input
              type="range"
              min="0"
              max="100"
              value={demand}
              onChange={(e) => setDemand(+e.target.value)}
              className="flex-1"
              style={{ accentColor: "rgb(var(--accent-turquoise))" }}
            />
          </div>
        </div>
      </SectionHeader>

      <Card padded={false} className="overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-[15px] pb-0">
          <span className="heading-caps-xs text-color-text-secondary">The bathtub — a tap and a drain</span>
          <Bathtub inflow={inflow} outflow={outflow} totalSupply={totalSupply} height={250} />
        </div>
        <div className="p-[20px] flex flex-col gap-y-[15px] justify-center border-t md:border-t-0 md:border-l border-color-bg-medium">
          <div className="flex flex-col gap-y-[2px]">
            <span className="heading-caps-xs text-color-text-secondary">Net change in the water level</span>
            <span className={`numbers-4xl ${netEth < 0 ? "text-color-positive" : ""}`}>{fmtPct(netPct)}</span>
            <span className="numbers-xs text-color-text-secondary">
              per year · {netEth > 0 ? "+" : ""}
              {Math.round(netEth).toLocaleString()} ETH this week
            </span>
          </div>
          <StackBar height={15} parts={[{ label: "Burned", value: outflow, color: "red" }, { label: "Stays in the tub", value: Math.max(0, netEth), color: "turquoise" }]} />
          <Legend items={[{ label: "Burned", color: "red", value: Math.round((outflow / inflow) * 100) + "% of issuance" }, { label: "Net new", color: "turquoise" }]} />
          <div className="h-px bg-color-bg-medium" />
          <span className="text-sm text-color-text-secondary">{preset.note}</span>
          <div className="flex items-center justify-between">
            <span className="text-xxs text-color-text-secondary">Inflow from live issuance data · demand/burn curve illustrative</span>
            <IllustrativeTag label="burn illustrative" />
          </div>
        </div>
      </Card>
    </div>
  );
}
