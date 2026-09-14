"use client";

import { useEffect, useRef, useState } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useSSEMetrics } from "@/components/layout/EthAgg/useSSEMetrics";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";
import Sparkline from "./_components/Sparkline";
import IllustrativeTag from "./_components/IllustrativeTag";
import { AccentColor } from "./_components/colors";

const WORLD_POPULATION = 8.2e9;

// Deterministic gentle up/down trend used for stat tiles that have no live
// data source behind them yet — fixed (not random) so server/client markup
// matches and the page doesn't flicker on hydration.
const ILLUSTRATIVE_TREND = [0, 1, 0.4, 1.6, 1.1, 2.1, 1.6, 2.6, 2.1, 3.1, 2.6, 3.6];

function StatTile({
  icon,
  label,
  value,
  unit,
  delta,
  points,
  color,
  live = false,
}: {
  icon: GTPIconName;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  points: number[];
  color: AccentColor;
  live?: boolean;
}) {
  const negative = delta?.startsWith("-") || delta?.startsWith("−");
  return (
    <div className="flex-1 min-w-[190px] rounded-[15px] bg-color-bg-default shadow-standard p-[15px] pb-0 flex flex-col gap-y-[8px] overflow-hidden">
      <div className="flex items-center gap-x-[5px]">
        <GTPIcon icon={icon} size="sm" />
        <span className="heading-caps-xs text-color-text-secondary flex-1">{label}</span>
        {!live && <IllustrativeTag />}
      </div>
      <div className="flex items-baseline gap-x-[8px]">
        <span className="numbers-2xl">{value}</span>
        {unit && <span className="numbers-xs text-color-text-secondary">{unit}</span>}
        {delta && (
          <span className={`numbers-xs ml-auto ${negative ? "text-color-negative" : "text-color-positive"}`}>{delta}</span>
        )}
      </div>
      <Sparkline points={points} color={color} height={38} />
    </div>
  );
}

// Pointer-reactive diamond built from plain CSS/SVG (no three.js). A slow
// autorotate loop plus a pointer-driven tilt combine into one 3D transform.
function EtherDiamond({ height = 380 }: { height?: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoAngle, setAutoAngle] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setAutoAngle((a) => (a + 0.15) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -30, y: px * 40 });
  };

  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={wrapperRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative w-full flex items-center justify-center cursor-grab select-none"
      style={{ height, perspective: 900 }}
    >
      <div
        className="absolute inset-0 m-auto rounded-full blur-3xl opacity-30"
        style={{
          width: height * 0.8,
          height: height * 0.8,
          background: "radial-gradient(circle, rgb(var(--accent-turquoise)) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          width: height * 0.55,
          height: height * 0.85,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${autoAngle + tilt.y}deg)`,
        }}
      >
        <svg viewBox="0 0 100 154" width="100%" height="100%" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="eth-face-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-turquoise))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1F2726" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="eth-face-2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-yellow))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#1F2726" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <polygon points="50,0 95,77 50,60" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
          <polygon points="50,0 5,77 50,60" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 95,77 50,154" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 5,77 50,154" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-[15px] text-xxs text-color-text-secondary">drag to spin</div>
    </div>
  );
}

export default function EthHero({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const { globalMetrics } = useSSEMetrics();
  const price = globalMetrics.eth_price_usd;

  const supplyTrend = ethSnapshot ? [ethSnapshot.totalSupply * 0.9995, ethSnapshot.totalSupply] : ILLUSTRATIVE_TREND;

  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] items-center">
        <div className="flex flex-col gap-y-[15px]">
          <div className="heading-caps-sm text-color-accent-turquoise">ETH — the asset</div>
          <h1 className="heading-large-xl md:heading-large-2xl">An asset that pays you for holding it.</h1>
          <div className="text-lg text-color-text-secondary max-w-[560px]">
            ETH secures Ethereum, earns a yield, and backs loans. Here is what it did today.
          </div>
          <div className="flex items-baseline gap-x-[12px] flex-wrap">
            {price ? (
              <span className="numbers-5xl">
                {price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="numbers-5xl text-color-text-secondary">—</span>
            )}
            <span className="heading-caps-xs text-color-text-secondary flex items-center gap-x-[5px]">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-positive opacity-75" />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-color-positive" />
              </span>
              1 ETH · live
            </span>
          </div>
          {ethSnapshot && (
            <div className="flex items-center gap-x-[8px] h-[36px] px-[15px] rounded-full bg-color-bg-medium w-fit">
              <GTPIcon icon="gtp-users" size="sm" className="!text-color-accent-yellow" />
              <span className="heading-caps-xs text-color-text-secondary">ETH per person on earth</span>
              <span className="numbers-sm">{(ethSnapshot.totalSupply / WORLD_POPULATION).toFixed(6)}</span>
            </div>
          )}
        </div>
        <EtherDiamond height={380} />
      </div>

      <div className="flex gap-[15px] flex-wrap">
        {ethSnapshot ? (
          <StatTile
            icon="gtp-realtime"
            label="Supply"
            value={`${(ethSnapshot.totalSupply / 1e6).toFixed(1)}M`}
            unit="ETH"
            delta={`${ethSnapshot.netIssuance30d >= 0 ? "+" : "−"}${Math.abs(ethSnapshot.netIssuance30d).toLocaleString(undefined, { maximumFractionDigits: 0 })} / 30d`}
            points={supplyTrend}
            color="yellow"
            live
          />
        ) : (
          <StatTile icon="gtp-realtime" label="Supply" value="—" points={ILLUSTRATIVE_TREND} color="yellow" />
        )}
        <StatTile icon="gtp-metrics-fdv" label="Staking yield" value="3.12" unit="% APR" delta="+0.08" points={ILLUSTRATIVE_TREND} color="turquoise" />
        <StatTile icon="gtp-lock" label="Staked" value="30.4" unit="% of supply" delta="+0.6" points={ILLUSTRATIVE_TREND} color="petrol" />
        <StatTile icon="gtp-metrics-totalvaluelocked" label="Used as collateral" value="$48.2B" delta="+3.1%" points={ILLUSTRATIVE_TREND} color="red" />
        <StatTile icon="gtp-metrics-feespaidbyusers" label="Fees burned 24h" value="412" unit="ETH" delta="+11%" points={ILLUSTRATIVE_TREND} color="red" />
      </div>
    </div>
  );
}
