"use client";

import { useState } from "react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import Sparkline from "./_components/Sparkline";
import IllustrativeTag from "./_components/IllustrativeTag";
import { AccentColor } from "./_components/colors";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";

// Illustrative — no live source for cross-asset market caps (equities,
// commodities, other crypto) exists in this repo.
const RANKS: [string, number, AccentColor, "equity" | "commodity" | "crypto"][] = [
  ["Gold", 22400, "yellow", "commodity"],
  ["Nvidia", 4180, "muted", "equity"],
  ["Apple", 3410, "muted", "equity"],
  ["Silver", 1890, "muted", "commodity"],
  ["Bitcoin", 1720, "red", "crypto"],
  ["Berkshire Hathaway", 1040, "muted", "equity"],
  ["ETH", 504, "turquoise", "crypto"],
  ["Visa", 640, "muted", "equity"],
  ["Coca-Cola", 290, "muted", "equity"],
];

const RATIO = Array.from({ length: 60 }, (_, i) => 0.031 + Math.sin(i / 7) * 0.004 + Math.sin(i / 19) * 0.006 + i * 0.00012);

const WORLD_POPULATION = 8.2e9;

export default function RankingSection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const [filter, setFilter] = useState<"everything" | "equity" | "commodity" | "crypto">("everything");
  const rows = RANKS.filter((r) => filter === "everything" || r[3] === filter).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((r) => r[1]));
  const ethPerPerson = ethSnapshot ? ethSnapshot.totalSupply / WORLD_POPULATION : 0.0149;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] items-start">
      <div className="flex flex-col gap-y-[15px]">
        <SectionHeader icon="gtp-rank" title="How big is it, really?" description="ETH next to assets you already have a sense of.">
          <GTPButtonRow>
            {(["everything", "equity", "commodity", "crypto"] as const).map((f) => (
              <GTPButton key={f} label={f} isSelected={filter === f} clickHandler={() => setFilter(f)} size="sm" />
            ))}
          </GTPButtonRow>
        </SectionHeader>
        <Card>
          {rows.map(([name, val, color]) => (
            <div key={name} className="grid grid-cols-[150px_1fr_90px] gap-x-[10px] items-center">
              <span className={`text-sm ${name === "ETH" ? "text-color-text-primary font-bold" : "text-color-text-secondary"}`}>{name}</span>
              <div className="h-[15px] rounded-full bg-color-bg-medium overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${(val / max) * 100}%`, background: `rgb(var(--${color === "muted" ? "text-secondary" : `accent-${color}`}))` }}
                />
              </div>
              <span className="numbers-sm text-right">${(val / 1000).toFixed(2)}T</span>
            </div>
          ))}
          <IllustrativeTag />
        </Card>
      </div>
      <div className="flex flex-col gap-y-[15px]">
        <SectionHeader icon="gtp-compare" title="ETH / BTC" description="Without commentary." />
        <Card padded={false} className="overflow-hidden">
          <div className="p-[15px] pb-0 flex items-baseline gap-x-[10px]">
            <span className="numbers-2xl">0.0374</span>
            <span className="numbers-xs text-color-positive">+1.8% 30d</span>
          </div>
          <div className="px-[15px] pb-[15px]">
            <Sparkline points={RATIO} color="yellow" height={180} />
          </div>
        </Card>
        <Card>
          <span className="heading-caps-xs text-color-text-secondary">What the average person holds</span>
          <div className="text-sm">
            If the {ethSnapshot ? `${(ethSnapshot.totalSupply / 1e6).toFixed(1)}M` : "120.7M"} ETH in existence were split evenly across everyone alive, you
            would each hold <span className="numbers-sm text-color-accent-turquoise">{ethPerPerson.toFixed(4)} ETH</span> — most people hold none, so
            owning even a small amount puts you in a meaningful percentile of holders.
          </div>
        </Card>
        <IllustrativeTag label="ETH/BTC illustrative" />
      </div>
    </div>
  );
}
