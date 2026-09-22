"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import GTPMetricCard from "@/components/layout/Applications/AppMetricCard";
import { useSSEMetrics } from "@/components/layout/EthAgg/useSSEMetrics";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";
import { getChainMetricURL } from "@/lib/urls";
import { ACCENT_HEX, AccentColor } from "./_components/colors";
import { IllustrativeNote } from "./_components/IllustrativeTag";

const WORLD_POPULATION = 8.2e9;

type MarketCapResponse = {
  details?: {
    timeseries?: {
      daily?: { types: string[]; data: number[][] };
    };
  };
};

// Fixed (not random) so server and client markup match and nothing flickers on
// hydration. These back the tiles that have no live source yet.
const TREND_UP = [2.9, 3.0, 2.95, 3.05, 3.0, 3.08, 3.04, 3.1, 3.07, 3.12];
const TREND_FLAT = [29.4, 29.6, 29.5, 29.9, 30.0, 29.8, 30.1, 30.2, 30.3, 30.4];
const TREND_BURN = [362, 388, 371, 402, 396, 418, 405, 397, 423, 412];

// Pointer-reactive diamond built from plain CSS/SVG (no 3D library). A slow
// autorotate loop plus a pointer-driven tilt combine into one transform.
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

  return (
    <div
      ref={wrapperRef}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
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
        <svg viewBox="0 0 100 154" width="100%" height="100%" style={{ overflow: "visible" }} aria-hidden="true">
          <defs>
            <linearGradient id="eth-face-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-turquoise))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(var(--bg-default))" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="eth-face-2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-yellow))" stopOpacity="0.55" />
              <stop offset="100%" stopColor="rgb(var(--bg-default))" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <polygon points="50,0 95,77 50,60" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
          <polygon points="50,0 5,77 50,60" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 95,77 50,154" fill="url(#eth-face-2)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" opacity="0.85" />
          <polygon points="50,60 5,77 50,154" fill="url(#eth-face-1)" stroke="rgb(var(--accent-turquoise))" strokeWidth="0.6" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-[15px] text-xs text-color-text-primary/70">drag to spin</div>
    </div>
  );
}

export default function EthHero({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const { globalMetrics } = useSSEMetrics();
  const { data: marketCapData } = useSWR<MarketCapResponse>(getChainMetricURL("ethereum", "market-cap"));
  const { resolvedTheme } = useTheme();
  const hex = ACCENT_HEX[(resolvedTheme as "light" | "dark") ?? "dark"];
  const price = globalMetrics.eth_price_usd;
  const dailyMarketCap = marketCapData?.details?.timeseries?.daily;
  const priceHistory = useMemo(() => {
    const usdColumn = dailyMarketCap?.types.indexOf("usd") ?? -1;
    const ethColumn = dailyMarketCap?.types.indexOf("eth") ?? -1;
    if (!dailyMarketCap || usdColumn < 0 || ethColumn < 0) return { values: [], timestamps: [] };

    const points = dailyMarketCap.data.slice(-30).flatMap((row) => {
      const [timestamp] = row;
      const usd = row[usdColumn];
      const eth = row[ethColumn];
      return Number.isFinite(timestamp) && Number.isFinite(usd) && Number.isFinite(eth) && eth > 0
        ? [{ timestamp, price: usd / eth }]
        : [];
    });
    return {
      values: points.map((point) => point.price),
      timestamps: points.map((point) => new Date(point.timestamp).toISOString().slice(0, 10)),
    };
  }, [dailyMarketCap]);
  const latestHistoricalPrice = priceHistory.values[priceHistory.values.length - 1];
  const displayedPrice = price && price > 0 ? price : latestHistoricalPrice;
  const weekAgoPrice = priceHistory.values[priceHistory.values.length - 8];
  const priceChange = weekAgoPrice ? ((latestHistoricalPrice / weekAgoPrice) - 1) * 100 : 0;

  const tile = (color: AccentColor) => hex[color];

  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] items-center">
        <div className="flex flex-col gap-y-[15px]">
          <div className="heading-small-xs text-color-accent-turquoise">ETH — the asset</div>
          <h1 className="heading-large-xl md:heading-large-2xl">An asset that pays you for holding it.</h1>
          <div className="text-md lg:text-lg">
            ETH secures Ethereum, earns a yield, and backs loans. Here is what it did today.
          </div>
          <div className="flex items-baseline gap-x-[12px] flex-wrap">
            {price ? (
              <span className="numbers-5xl">
                {price.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ) : (
              <span className="numbers-5xl text-color-text-primary/40">—</span>
            )}
            <span className="heading-small-xs flex items-center gap-x-[5px]">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-positive opacity-75" />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-color-positive" />
              </span>
              1 ETH · live
            </span>
          </div>
          {ethSnapshot && (
            <div className="flex flex-wrap items-center gap-x-[8px] min-h-[36px] px-[15px] py-[6px] rounded-full bg-color-bg-medium w-fit">
              <GTPIcon icon="gtp-users-monochrome" size="sm" className="text-color-accent-yellow" />
              <span className="heading-small-xs">ETH per person on earth</span>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About ETH per person on earth" className="flex items-center justify-center">
                    <GTPIcon icon="gtp-info" size="sm" className="text-color-text-primary/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="z-50 max-w-[300px] rounded-[8px] bg-color-bg-default p-[12px] shadow-standard text-xs md:text-sm">
                  If all ETH were split evenly across everyone alive, each person would have {(ethSnapshot.totalSupply / WORLD_POPULATION).toFixed(4)} ETH. Most people hold none, so owning even a small amount puts you in a meaningful percentile of holders.
                </TooltipContent>
              </Tooltip>
              <span className="numbers-sm">{(ethSnapshot.totalSupply / WORLD_POPULATION).toFixed(6)}</span>
            </div>
          )}
        </div>
        <EtherDiamond height={380} />
      </div>

      <div className="flex flex-col gap-y-[10px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[10px]">
          {priceHistory.values.length > 1 && displayedPrice ? (
            <GTPMetricCard
              label="ETH price"
              icon="gtp-tokeneth"
              value={displayedPrice}
              wowChange={priceChange}
              prefix="$"
              sparkline={priceHistory.values}
              timestamps={priceHistory.timestamps}
              color={tile("turquoise")}
            />
          ) : (
            <div className="flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px]">
              <span className="flex items-center gap-x-[10px]">
                <GTPIcon icon="gtp-tokeneth" size="md" />
                <span className="heading-large-xxs xs:heading-large-xs">ETH price</span>
              </span>
              <span className="numbers-sm xs:numbers-md text-color-accent-turquoise">
                {displayedPrice?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "—"}
              </span>
            </div>
          )}
          {ethSnapshot && (
            <GTPMetricCard
              label="Supply"
              icon="gtp-realtime"
              value={ethSnapshot.totalSupply}
              // The 30-day change is ~0.004% of supply and rounds to "0.0%", so the
              // delta carries the annualised issuance rate instead — the same figure
              // the Scarce card and the bathtub use.
              wowChange={ethSnapshot.annualIssuanceRatePct}
              suffix=" ETH"
              sparkline={ethSnapshot.recentSupply}
              timestamps={ethSnapshot.recentTimestamps.map((ts) => new Date(ts).toISOString().slice(0, 10))}
              color={tile("yellow")}
            />
          )}
          <GTPMetricCard
            label="Staking yield"
            icon="gtp-metrics-fdv"
            value={3.12}
            wowChange={0.08}
            suffix="% APR"
            sparkline={TREND_UP}
            color={tile("turquoise")}
          />
          <GTPMetricCard
            label="Staked"
            icon="gtp-lock"
            value={30.4}
            wowChange={0.6}
            suffix="% of supply"
            sparkline={TREND_FLAT}
            color={tile("turquoise")}
          />
          <GTPMetricCard
            label="Fees burned 24h"
            icon="gtp-metrics-feespaidbyusers"
            value={412}
            wowChange={11}
            suffix=" ETH"
            sparkline={TREND_BURN}
            color={tile("red")}
          />
          <Link
            href="/ethereum-ecosystem/metrics"
            className="group flex h-2xl items-center justify-between gap-x-[10px] rounded-[15px] bg-color-bg-default p-[15px] shadow-standard transition-colors hover:bg-color-ui-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-color-accent-turquoise"
          >
            <span className="flex items-center gap-x-[10px]">
              <GTPIcon icon="gtp-metrics-activity" size="md" />
              <span className="heading-large-xxs xs:heading-large-xs">Ecosystem activity</span>
            </span>
            <GTPIcon icon="gtp-chevronright" size="sm" className="shrink-0 transition-transform group-hover:translate-x-[3px]" />
          </Link>
        </div>
        <IllustrativeNote>
          Supply and ETH price are live from growthepie data, with the annualised issuance rate as supply&apos;s change.
          Staking yield, staked share and burn are illustrative — we don&apos;t track those yet.
        </IllustrativeNote>
      </div>
    </div>
  );
}
