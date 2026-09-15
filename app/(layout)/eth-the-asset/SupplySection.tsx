"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
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

/* ── The simulation ──────────────────────────────────────────────────────────
   The water level is a STOCK: it is the running integral of the net flow, not a
   function of it. Net flow only sets how fast the level moves, and in which
   direction — which is why the tub now actually fills or empties.

   The visible area is a window onto a column, not a container: the walls fade
   out at the top and the window re-centres once the waterline drifts far
   enough, so the level can keep moving forever without implying that ETH has a
   maximum supply.                                                             */

const WEEKS_PER_SECOND = 4; // "1 second ≈ 1 month"
const BAND_ETH = 400_000; // half-window, ≈0.33% of supply
const RECENTRE_AT = 0.7; // fraction of the band before the window steps
const TICK_ETH = 200_000; // scale spacing

// Tub geometry (SVG user units)
const TUB_LEFT = 34;
const TUB_RIGHT = 386;
const TUB_BASE = 214;
const TUB_TOP = 40; // where the walls fade out — never read as a rim
const WATER_MID_Y = 134;
const HALF_PX = 62;

const TUB_PATH = `M${TUB_LEFT} ${TUB_TOP} L${TUB_LEFT} ${TUB_BASE - 34} a34 34 0 0 0 34 34 h284 a34 34 0 0 0 34 -34 L${TUB_RIGHT} ${TUB_TOP}`;
const TUB_FILL_PATH = `${TUB_PATH} Z`;

const LABEL_STYLE = { font: "600 13px var(--font-raleway)", letterSpacing: ".01em" } as const;
const VALUE_STYLE = { font: "500 18px var(--font-fira-sans)", letterSpacing: ".05em" } as const;
const TICK_STYLE = { font: "500 10px var(--font-fira-sans)", letterSpacing: ".04em" } as const;

function describeWeeks(weeks: number) {
  if (weeks < 8) return `${Math.max(1, Math.round(weeks))} weeks`;
  if (weeks < 104) return `${Math.round(weeks / 4.345)} months`;
  return `${(weeks / 52).toFixed(1)} years`;
}

type Sim = { offset: number; centre: number; centreTarget: number; weeks: number };

function Bathtub({
  inflow,
  outflow,
  totalSupply,
  height = 280,
}: {
  inflow: number;
  outflow: number;
  totalSupply: number;
  height?: number;
}) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const net = inflow - outflow;

  const sim = useRef<Sim>({ offset: 0, centre: 0, centreTarget: 0, weeks: 0 });
  const [view, setView] = useState<Sim>({ offset: 0, centre: 0, centreTarget: 0, weeks: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    let raf: number;
    let last = performance.now();
    let sincePaint = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;

      // Integrate: the level is the accumulated net flow.
      s.weeks += WEEKS_PER_SECOND * dt;
      s.offset += net * WEEKS_PER_SECOND * dt;

      // Step the window once the waterline has drifted far enough.
      const rel = s.offset - s.centre;
      if (rel > BAND_ETH * RECENTRE_AT) s.centreTarget = s.centre + BAND_ETH * RECENTRE_AT;
      else if (rel < -BAND_ETH * RECENTRE_AT) s.centreTarget = s.centre - BAND_ETH * RECENTRE_AT;
      s.centre += (s.centreTarget - s.centre) * Math.min(1, 5 * dt);

      // Repaint at ~24fps rather than every frame.
      sincePaint += dt;
      if (sincePaint >= 1 / 24) {
        sincePaint = 0;
        setView({ ...s });
        setTick((v) => v + 1);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, net]);

  const yFor = (offsetEth: number) => WATER_MID_Y - ((offsetEth - view.centre) / BAND_ETH) * HALF_PX;
  const waterY = yFor(view.offset);
  const simulatedSupply = totalSupply + view.offset;
  const drainW = 6 + (outflow / 31000) * 26;

  // Scale ticks at round supply values inside the window.
  const firstTick = Math.ceil((view.centre - BAND_ETH) / TICK_ETH) * TICK_ETH;
  const ticks: number[] = [];
  for (let o = firstTick; o <= view.centre + BAND_ETH; o += TICK_ETH) ticks.push(o);

  const drops = Array.from({ length: 6 }, (_, i) => (tick * 2.6 + i * 26) % 100 / 100);
  const embers = Array.from({ length: 6 }, (_, i) => (tick * 2.2 + i * 30) % 180);

  return (
    <svg viewBox="0 0 420 286" style={{ width: "100%", height, display: "block" }} role="img" aria-label="ETH issued versus ETH burned, as a tap and a drain">
      <defs>
        {/* Walls dissolve at the top: the column continues past the frame, so
            there is no rim and nothing to overflow. */}
        <linearGradient id="tub-fade" gradientUnits="userSpaceOnUse" x1="0" y1={TUB_TOP} x2="0" y2={TUB_TOP + 58}>
          <stop offset="0%" stopColor="rgb(var(--ui-hover))" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(var(--ui-hover))" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="tub-inner" gradientUnits="userSpaceOnUse" x1="0" y1={TUB_TOP} x2="0" y2={TUB_TOP + 70}>
          <stop offset="0%" stopColor="rgb(var(--bg-medium))" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(var(--bg-medium))" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id="tub-clip">
          <path d={TUB_FILL_PATH} />
        </clipPath>
      </defs>

      {/* Tap — positioned so the drips fall clear of the scale and the readout */}
      <rect x="133" y="8" width="34" height="9" rx="4" fill="rgb(var(--bg-medium))" />
      <rect x="146" y="14" width="8" height="14" rx="3" fill="rgb(var(--bg-medium))" />
      <text x="180" y="18" fill="rgb(var(--text-primary))" style={LABEL_STYLE}>
        Issued to stakers
      </text>
      <text x="180" y="38" fill="rgb(var(--accent-turquoise))" style={VALUE_STYLE}>
        +{Math.round(inflow).toLocaleString()} ETH/wk
      </text>

      {/* Tub interior + water, both clipped to the column */}
      <path d={TUB_FILL_PATH} fill="url(#tub-inner)" />
      <g clipPath="url(#tub-clip)">
        <rect x={TUB_LEFT} y={waterY} width={TUB_RIGHT - TUB_LEFT} height={TUB_BASE + 20 - waterY} fill="rgb(var(--accent-petrol))" opacity=".38" />
        <rect x={TUB_LEFT} y={waterY} width={TUB_RIGHT - TUB_LEFT} height="3" fill="rgb(var(--accent-turquoise))" />

        {/* Supply scale, labelled down the left — these scroll as the window
            follows the water, which is what makes the movement legible. */}
        {ticks.map((o) => {
          const y = yFor(o);
          if (y < TUB_TOP + 18 || y > TUB_BASE - 8) return null;
          return (
            <g key={o}>
              <line x1={TUB_LEFT + 76} x2={TUB_RIGHT - 10} y1={y} y2={y} stroke="rgb(var(--text-primary))" strokeWidth="1" opacity=".18" />
              <text x={TUB_LEFT + 12} y={y + 3.5} fill="rgb(var(--text-primary))" opacity=".55" style={TICK_STYLE}>
                {((totalSupply + o) / 1e6).toFixed(2)}M
              </text>
            </g>
          );
        })}

        {/* Falling drops land on the moving surface */}
        {!reduceMotion &&
          drops.map((p, i) => {
            const y = 30 + p * (waterY - 30);
            return <circle key={i} cx={150 + Math.sin(p * 9 + i) * 2.4} cy={y} r="3.1" fill="rgb(var(--accent-turquoise))" opacity={0.9 - p * 0.5} />;
          })}
      </g>

      {/* Walls, fading out at the top */}
      <path d={TUB_PATH} fill="none" stroke="url(#tub-fade)" strokeWidth="1.5" />

      {/* The live reading, pinned to the waterline on the opposite side to the
          scale so the two never overlap. Opaque, so it masks the tick behind it. */}
      <g transform={`translate(0 ${Math.max(TUB_TOP + 20, Math.min(TUB_BASE - 14, waterY))})`}>
        <rect x={TUB_RIGHT - 142} y="-12" width="132" height="24" rx="12" fill="rgb(var(--bg-default))" />
        <rect x={TUB_RIGHT - 142} y="-12" width="132" height="24" rx="12" fill="none" stroke="rgb(var(--accent-turquoise))" strokeWidth="1" opacity=".5" />
        <text x={TUB_RIGHT - 20} y="5" textAnchor="end" fill="rgb(var(--text-primary))" style={{ font: "500 15px var(--font-fira-sans)", letterSpacing: ".04em" }}>
          {(simulatedSupply / 1e6).toFixed(2)}M ETH
        </text>
      </g>

      {/* Drain */}
      <rect x={210 - drainW / 2} y={TUB_BASE - 12} width={drainW} height="16" rx="3" fill="rgb(var(--accent-red))" opacity=".35" />
      {!reduceMotion &&
        embers.map((y, i) => (
          <circle
            key={i}
            cx={210 + Math.sin((y + i * 17) / 14) * (drainW / 2.4)}
            cy={TUB_BASE + 4 + y * 0.16}
            r={Math.max(0, 2.6 - y / 120)}
            fill="rgb(var(--accent-red))"
            opacity={Math.max(0, 0.8 - y / 230)}
          />
        ))}
      <text x="250" y={TUB_BASE + 32} fill="rgb(var(--text-primary))" style={LABEL_STYLE}>
        Burned by fees
      </text>
      <text x="250" y={TUB_BASE + 52} fill="rgb(var(--accent-red))" style={VALUE_STYLE}>
        −{outflow.toLocaleString()} ETH/wk
      </text>

      {/* The exaggeration, stated rather than implied */}
      <text x={TUB_LEFT} y={TUB_BASE + 32} fill="rgb(var(--text-primary))" opacity=".7" style={TICK_STYLE}>
        {reduceMotion ? "motion paused" : "time-lapse · 1s ≈ 1 month"}
      </text>
      {!reduceMotion && (
        <text x={TUB_LEFT} y={TUB_BASE + 50} fill="rgb(var(--text-primary))" opacity=".7" style={TICK_STYLE}>
          {view.offset >= 0 ? "+" : "−"}
          {Math.abs(Math.round(view.offset)).toLocaleString()} ETH over {describeWeeks(view.weeks)}
        </text>
      )}
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
        Issuance is live from growthepie data; the demand-to-burn curve is illustrative. The tub runs as a time-lapse so
        the level moves visibly — the real rate is the annual figure above.
      </IllustrativeNote>
    </div>
  );
}
