"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useTheme } from "next-themes";
import { GetRankingColor } from "@/lib/chains";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Card from "./_components/Card";
import { StackBar, Legend, StatPair } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";

const fmtPct = (v: number) => (v < 0 ? "−" : "+") + Math.abs(v).toFixed(2) + "%";

const fmtDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fmtEth = (n: number) => Math.round(n).toLocaleString("en-US");

// The native range thumb is 16px wide and its centre travels from 8px to
// (width − 8px), so a value's position on the track is offset by half a thumb.
const SLIDER_THUMB_PX = 16;

// supply_flow's scenarios: last_week is the selectable "Last week", the others are presets.
const LAST_WEEK_KEY = "last_week";
// Ends of the demand scale: demand_level 0 is the quiet week's burn, 1 the highest.
const SCALE_MIN_KEY = "quiet_week";
const SCALE_MAX_KEY = "mania";

// Each week's dot, before its button label and on the demand scale, is coloured by
// where it sits on the scale, using the landing page's ranking colours: turquoise
// for the quietest week through yellow to red for the highest burn. The colour
// follows the data, so last week's dot shifts as its burn changes.
const demandColor = (colorLevel: number, theme: string | undefined) =>
  GetRankingColor(Math.min(1, Math.max(0, colorLevel)) * 100, false, theme === "light" ? "light" : "dark");

// Two weeks close together on the scale would get near-identical colours, so the
// colour positions are spread at least this far apart (the dots' places on the
// scale don't move). Weeks keep their order: the busier week is always the redder.
const MIN_COLOR_GAP = 0.15;

/** A week's marker: a dot, or for last week (the real, current one) an upward
 *  triangle so it stands out from the presets. Used on its button and on the scale. */
function WeekMarker({ isLastWeek, color }: { isLastWeek: boolean; color: string }) {
  if (isLastWeek)
    return (
      <svg width="10" height="9" viewBox="0 0 10 9" className="flex-shrink-0" aria-hidden>
        <path d="M5 0.5 L9.5 8.5 L0.5 8.5 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth="1" />
      </svg>
    );
  return <span className="size-[8px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden />;
}

/** Each week's colour position (0–1): its demand level, nudged apart from its neighbours. */
function spreadColorLevels(scenarios: { key: string; demand_level: number }[]): Record<string, number> {
  const sorted = [...scenarios].sort((a, b) => a.demand_level - b.demand_level);
  const levels = sorted.map((sc) => Math.min(1, Math.max(0, sc.demand_level)));
  // Push up from the quietest week, then back down from 1 so nothing passes the end.
  for (let i = 1; i < levels.length; i++) levels[i] = Math.max(levels[i], levels[i - 1] + MIN_COLOR_GAP);
  levels[levels.length - 1] = Math.min(levels[levels.length - 1], 1);
  for (let i = levels.length - 2; i >= 0; i--) levels[i] = Math.min(levels[i], levels[i + 1] - MIN_COLOR_GAP);
  return Object.fromEntries(sorted.map((sc, i) => [sc.key, Math.max(0, levels[i])]));
}

/* ── The simulation ──────────────────────────────────────────────────────────
   The water level is a STOCK: it is the running integral of the net flow, not a
   function of it. Net flow only sets how fast the level moves, and in which
   direction — which is why the tub now actually fills or empties.

   The visible area is a window onto a column, not a container: the walls fade
   out at the top and the window re-centres once the waterline drifts far
   enough, so the level can keep moving forever without implying that ETH has a
   maximum supply.                                                             */

type Pace = {
  weeksPerSecond: number;
  bandEth: number; // half-window
  tickEth: number; // scale spacing
  label: string;
  loopWeeks?: number; // replay from the start after this long
};

// Scenarios run as a time-lapse so the level moves visibly.
const SCENARIO_PACE: Pace = { weeksPerSecond: 4, bandEth: 400_000, tickEth: 200_000, label: "1s ≈ 1 month" };
// Last week plays at 1 day per second and replays, with a tighter window so a
// single week's change is still visible without the window stepping.
const LAST_WEEK_PACE: Pace = { weeksPerSecond: 1 / 7, bandEth: 25_000, tickEth: 10_000, label: "1s ≈ 1 day", loopWeeks: 1 };
const RECENTRE_AT = 0.7; // fraction of the band before the window steps

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
  if (weeks < 1) {
    const days = Math.max(1, Math.round(weeks * 7));
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (weeks < 8) {
    const whole = Math.max(1, Math.round(weeks));
    return `${whole} week${whole === 1 ? "" : "s"}`;
  }
  if (weeks < 104) return `${Math.round(weeks / 4.345)} months`;
  return `${(weeks / 52).toFixed(1)} years`;
}

type Sim = { offset: number; centre: number; centreTarget: number; weeks: number };

function Bathtub({
  inflow,
  outflow,
  totalSupply,
  pace = SCENARIO_PACE,
  height = 280,
  resetKey,
}: {
  inflow: number;
  outflow: number;
  totalSupply: number;
  pace?: Pace;
  height?: number;
  /** When this changes (a new week or slider position), the level restarts from today's supply. */
  resetKey?: string;
}) {
  const burnRgb = "rgb(var(--accent-red))";
  const { weeksPerSecond, bandEth, tickEth, loopWeeks } = pace;
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const net = inflow - outflow;

  const sim = useRef<Sim>({ offset: 0, centre: 0, centreTarget: 0, weeks: 0 });
  const [view, setView] = useState<Sim>({ offset: 0, centre: 0, centreTarget: 0, weeks: 0 });
  const [tick, setTick] = useState(0);
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    // New parameters: start again from today's supply. The view catches up on the next repaint.
    if (lastResetKey.current !== resetKey) {
      lastResetKey.current = resetKey;
      sim.current = { offset: 0, centre: 0, centreTarget: 0, weeks: 0 };
    }
    if (reduceMotion) return;
    let raf: number;
    let last = performance.now();
    let sincePaint = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;

      // Integrate: the level is the accumulated net flow.
      s.weeks += weeksPerSecond * dt;
      s.offset += net * weeksPerSecond * dt;
      if (loopWeeks && s.weeks >= loopWeeks) {
        s.weeks = 0;
        s.offset = 0;
        s.centre = 0;
        s.centreTarget = 0;
      }

      // Step the window once the waterline has drifted far enough.
      const rel = s.offset - s.centre;
      if (rel > bandEth * RECENTRE_AT) s.centreTarget = s.centre + bandEth * RECENTRE_AT;
      else if (rel < -bandEth * RECENTRE_AT) s.centreTarget = s.centre - bandEth * RECENTRE_AT;
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
  }, [reduceMotion, net, weeksPerSecond, bandEth, loopWeeks, resetKey]);

  const yFor = (offsetEth: number) => WATER_MID_Y - ((offsetEth - view.centre) / bandEth) * HALF_PX;
  const waterY = yFor(view.offset);
  const simulatedSupply = totalSupply + view.offset;
  // Square-root scale, so a quiet week's trickle and the record burn (~110k ETH) both fit.
  const drainW = 6 + Math.sqrt(Math.min(outflow, 120_000) / 120_000) * 26;

  // Scale ticks at round supply values inside the window.
  const firstTick = Math.ceil((view.centre - bandEth) / tickEth) * tickEth;
  const ticks: number[] = [];
  for (let o = firstTick; o <= view.centre + bandEth; o += tickEth) ticks.push(o);

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
      <rect x={210 - drainW / 2} y={TUB_BASE - 12} width={drainW} height="16" rx="3" fill={burnRgb} opacity=".35" />
      {!reduceMotion &&
        embers.map((y, i) => (
          <circle
            key={i}
            cx={210 + Math.sin((y + i * 17) / 14) * (drainW / 2.4)}
            cy={TUB_BASE + 4 + y * 0.16}
            r={Math.max(0, 2.6 - y / 120)}
            fill={burnRgb}
            opacity={Math.max(0, 0.8 - y / 230)}
          />
        ))}
      <text x="250" y={TUB_BASE + 32} fill="rgb(var(--text-primary))" style={LABEL_STYLE}>
        Burned by fees
      </text>
      <text x="250" y={TUB_BASE + 52} fill={burnRgb} style={VALUE_STYLE}>
        −{Math.round(outflow).toLocaleString()} ETH/wk
      </text>

      {/* The exaggeration, stated rather than implied */}
      <text x={TUB_LEFT} y={TUB_BASE + 32} fill="rgb(var(--text-primary))" opacity=".7" style={TICK_STYLE}>
        {reduceMotion ? "motion paused" : `time-lapse · ${pace.label}`}
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

export default function SupplySection() {
  // Either a real week from supply_flow (by key) or a free slider position (0–100).
  const [scenarioKey, setScenarioKey] = useState<string | null>("busy_week");
  const [demand, setDemand] = useState(0);
  const [controlsWrapping, setControlsWrapping] = useState(false);
  const { resolvedTheme } = useTheme();
  const { data: flowData, isLoading: flowLoading } = useEthAssetSection("supply_flow");
  const flow = flowData?.data;

  const scenarios = flow?.scenarios ?? [];
  const lastWeek = scenarios.find((sc) => sc.key === LAST_WEEK_KEY);
  const presets = scenarios.filter((sc) => sc.key !== LAST_WEEK_KEY);
  const colorLevels = spreadColorLevels(scenarios);
  const scaleMin = scenarios.find((sc) => sc.key === SCALE_MIN_KEY);
  const scaleMax = scenarios.find((sc) => sc.key === SCALE_MAX_KEY);
  const scenario = scenarios.find((sc) => sc.key === scenarioKey);

  if (!flow || !scenarios.length) {
    return (
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-metrics-economics" title="The supply, in one picture" titleSize="md" as="h2" />
        {/* Still showing once loaded means the data is missing: a fallback (dev only). */}
        <Card className="min-h-[280px] items-center justify-center text-xs text-color-text-primary/70" fallback={!flowLoading}>
          Loading supply…
        </Card>
      </div>
    );
  }

  // Between real weeks, the slider's burn follows the same log scale as demand_level:
  // the quiet week's burn at 0, the highest weekly burn at 100.
  const burnAtDemand = (d: number) =>
    scaleMin && scaleMax ? scaleMin.burned_per_week * Math.pow(scaleMax.burned_per_week / scaleMin.burned_per_week, d / 100) : 0;
  const sliderValue = scenario ? scenario.demand_level * 100 : demand;

  const totalSupply = flow.supply.value;
  // Today's issuance (the same in every scenario apart from last week's actual figure).
  const inflow = scenario?.issued_per_week ?? presets[0]?.issued_per_week ?? lastWeek?.issued_per_week ?? 0;
  const outflow = scenario ? scenario.burned_per_week : burnAtDemand(demand);
  const netEth = inflow - outflow;
  // A real week uses supply_flow's own annual figure; a slider position works it out the same way.
  const netPct = scenario ? scenario.net_annual_pct * 100 : ((netEth * 365) / 7 / totalSupply) * 100;
  const isLastWeek = scenario?.key === LAST_WEEK_KEY;
  // A slider position between real weeks is an estimate from the curve. It isn't marked
  // as fake data: the note under the figures and the footnote say it's an estimate.

  const lastWeekTotals = lastWeek?.daily?.data?.reduce(
    (acc, [, issued, burned]) => ({ issued: acc.issued + issued, burned: acc.burned + burned, days: acc.days + 1 }),
    { issued: 0, burned: 0, days: 0 },
  );
  const note = scenario
    ? isLastWeek && lastWeekTotals
      ? `${fmtDay(scenario.period.start)} – ${fmtDay(scenario.period.end)} (${lastWeekTotals.days} days): ${fmtEth(lastWeekTotals.issued)} ETH issued, ${fmtEth(lastWeekTotals.burned)} ETH burned.`
      : `${scenario.description} Week of ${fmtDay(scenario.period.start)}, ${scenario.period.start.slice(0, 4)}.`
    : `Between real weeks: about ${fmtEth(outflow)} ETH burned a week at this level of demand.`;
  const sources = flow.sources.map((src) => src.name).join(", ");

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-metrics-economics" title="The supply, in one picture" titleSize="md" as="h2" />
      <SectionDescription>Inflation and burn are abstract. A tap and a drain are not.</SectionDescription>

      {/* Same control bar as the fundamentals charts: presets left, slider right. The
          slider area matches the button row's 32px height so the bar's wrap check
          (which compares the items' tops) doesn't mistake it for a second line. */}
      <GTPButtonContainer
        className="gap-x-[15px]"
        isWrapping={controlsWrapping}
        setIsWrapping={setControlsWrapping}
        style={controlsWrapping ? { borderRadius: "15px" } : undefined}
      >
        <GTPButtonRow wrap autoFill>
          {/* Last week first, then the presets: every button is a real week from supply_flow. */}
          {[...(lastWeek ? [lastWeek] : []), ...presets].map((sc) => (
            <GTPButton
              key={sc.key}
              label={sc.name}
              leftIconOverride={
                <WeekMarker isLastWeek={sc.key === LAST_WEEK_KEY} color={demandColor(colorLevels[sc.key], resolvedTheme)} />
              }
              isSelected={scenarioKey === sc.key}
              clickHandler={() => setScenarioKey(sc.key)}
              size="sm"
            />
          ))}
        </GTPButtonRow>
        {/* At least 360px (the label plus a ~210px track), so it wraps onto its own line
            before the track gets too short to use; capped at the bar's width on phones. */}
        <div className="flex items-center gap-x-[10px] flex-1 min-w-[min(360px,100%)] h-[32px] px-[13px]">
          <span className="heading-small-xs whitespace-nowrap">Network demand</span>
          {/* Raised 6px so the week markers below the track fit inside the bar. */}
          <div className="relative flex-1 flex items-center -translate-y-[6px]">
            <input
              type="range"
              min="0"
              max="100"
              step="any"
              value={sliderValue}
              // Moving the slider leaves the selected week for a position between real weeks.
              onChange={(e) => {
                setScenarioKey(null);
                setDemand(+e.target.value);
              }}
              aria-label="Network demand"
              className="w-full h-[20px] cursor-pointer"
              style={{ accentColor: "rgb(var(--accent-turquoise))" }}
            />
            {/* Where each week's burn sits on the demand scale, as the marker from its
                button, just below the track. Clicking a marker selects that week. Last
                week is drawn last, so its triangle sits on top if it overlaps a dot. */}
            {[...presets, ...(lastWeek ? [lastWeek] : [])]
              .map((sc) => (
                <Tooltip key={sc.key} placement="top">
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${sc.name}: network demand ${Math.round(sc.demand_level * 100)} of 100`}
                      onClick={() => setScenarioKey(sc.key)}
                      className="absolute top-[calc(50%+9px)] -translate-x-1/2 size-[14px] flex items-center justify-center cursor-pointer"
                      style={{
                        left: `calc(${SLIDER_THUMB_PX / 2}px + (100% - ${SLIDER_THUMB_PX}px) * ${sc.demand_level})`,
                      }}
                    >
                      <WeekMarker isLastWeek={sc.key === LAST_WEEK_KEY} color={demandColor(colorLevels[sc.key], resolvedTheme)} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 rounded-[8px] bg-color-bg-default px-[10px] py-[6px] shadow-standard text-xs">
                    {sc.name}: {fmtDay(sc.period.start)} – {fmtDay(sc.period.end)} · {fmtEth(sc.burned_per_week)} ETH burned
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        </div>
      </GTPButtonContainer>

      <Card padded={false} className="overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="p-[15px]">
          {/* Picking a week or moving the slider restarts the level from today's supply. */}
          <Bathtub
            resetKey={scenarioKey ?? `demand-${demand}`}
            inflow={inflow}
            outflow={outflow}
            totalSupply={totalSupply}
            pace={isLastWeek ? LAST_WEEK_PACE : SCENARIO_PACE}
          />
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
          <span className="text-xs md:text-sm">{note}</span>
        </div>
      </Card>

      <IllustrativeNote>
        Every button is a real week&apos;s burn with today&apos;s issuance (&quot;Last week&quot; uses that week&apos;s
        actual issuance too). Slider positions between them follow a log curve from the quietest week to the highest
        burn, so they&apos;re estimates. The tub runs as a time-lapse so the level moves visibly. The real rate is the
        annual figure above. Sources: {sources}.
      </IllustrativeNote>
    </div>
  );
}
