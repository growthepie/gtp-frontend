"use client";

import { useState } from "react";
import useSWR from "swr";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Pictogram from "./_components/Pictogram";
import Dumbbell from "./_components/Dumbbell";
import { BasketIcon, BasketGlyph, EGG, BREAD, COFFEE, FUEL, GOLD_BAR } from "./_components/BasketIcons";

import { EthAssetKpisResponse } from "@/lib/eth-the-asset/data";
import { FAKE_ART, FAKE_TEXT, FAKE_TILE_BG, FAKE_TILE_BG_ACTIVE, FAKE_TILE_BG_HOVER } from "./_components/colors";
import { EthAssetURLs } from "@/lib/urls";

// Illustrative retail prices — no live source for consumer-goods pricing exists
// in this repo. The ETH prices now and a year ago come from kpis.json.
type EthPrices = { now: number; yearAgo: number };

type BasketItem = {
  label: string;
  unit: string;
  glyph: BasketGlyph;
  priceNow: number;
  priceAgo: number;
};

const BASKET: BasketItem[] = [
  { label: "Bread", unit: "loaves", glyph: BREAD, priceNow: 3.2, priceAgo: 3.11 },
  { label: "Eggs", unit: "dozen", glyph: EGG, priceNow: 4.1, priceAgo: 3.98 },
  { label: "Coffee", unit: "cups", glyph: COFFEE, priceNow: 4.8, priceAgo: 4.6 },
  { label: "Fuel", unit: "tanks", glyph: FUEL, priceNow: 62, priceAgo: 64 },
  { label: "Gold", unit: "grams", glyph: GOLD_BAR, priceNow: 84, priceAgo: 71 },
];

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : n >= 10 ? n.toFixed(1) : n.toFixed(2));

function unitsFor(item: BasketItem, prices: EthPrices) {
  const now = prices.now / item.priceNow;
  const ago = prices.yearAgo / item.priceAgo;
  const ethOnly = prices.now / item.priceAgo; // ETH moved, shop price held
  return {
    now,
    ago,
    ethDelta: ethOnly - ago,
    shopDelta: now - ethOnly,
    changePct: (now / ago - 1) * 100,
  };
}

export default function BasketSection() {
  const [selectedKey, setSelectedKey] = useState(BASKET[0].label);
  const { data: kpisData } = useSWR<EthAssetKpisResponse>(EthAssetURLs.kpis);
  // Today: the latest price. A year ago: the first (weekly) point of the 1y series.
  const yearSeries = kpisData?.data?.kpis?.eth_price?.timeframes?.["1y"];
  const prices: EthPrices | null =
    yearSeries?.current && yearSeries.data?.[0]?.[1] ? { now: yearSeries.current, yearAgo: yearSeries.data[0][1] } : null;
  const item = BASKET.find((b) => b.label === selectedKey)!;

  if (!prices) {
    return (
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-package" title="What one ETH actually buys" titleSize="md" as="h2" />
        <Card className="min-h-[200px] items-center justify-center text-xs text-color-text-primary/70">
          Loading ETH price…
        </Card>
      </div>
    );
  }

  const { now, ago, ethDelta, shopDelta, changePct } = unitsFor(item, prices);

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-package" title="What one ETH actually buys" titleSize="md" as="h2" />
      <SectionDescription>
        Supply and burn only matter if they change what ETH gets you. Two things move that number — and neither of them
        is the burn.
      </SectionDescription>

      {/* Small multiples: every item, drawn — and the selector for the detail below */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[10px]">
        {BASKET.map((b) => {
          const stats = unitsFor(b, prices);
          const active = b.label === selectedKey;
          return (
            <button
              key={b.label}
              type="button"
              onClick={() => setSelectedKey(b.label)}
              // Every figure here depends on the illustrative shop prices.
              className={`flex flex-col items-center gap-y-[5px] p-[10px] rounded-[15px] transition-colors duration-200 ${
                active ? `bg-color-ui-hover ${FAKE_TILE_BG_ACTIVE}` : `bg-color-bg-default hover:bg-color-ui-hover ${FAKE_TILE_BG} ${FAKE_TILE_BG_HOVER}`
              }`}
            >
              <BasketIcon glyph={b.glyph} size={40} />
              <span className={`numbers-sm ${FAKE_TEXT}`}>{fmt(stats.now)}</span>
              <span className="heading-small-xxxs text-color-text-primary/70">{b.label}</span>
              <span className={`numbers-xs ${stats.changePct < 0 ? "text-color-negative" : "text-color-positive"} ${FAKE_TEXT}`}>
                {stats.changePct < 0 ? "−" : "+"}
                {Math.abs(stats.changePct).toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[15px]">
        {/* The answer, drawn */}
        <Card fake>
          <div className="flex items-center gap-x-[15px]">
            <BasketIcon glyph={item.glyph} size={64} className="flex-shrink-0" />
            <div className="flex flex-col gap-y-[2px]">
              <span className="heading-small-xxxs text-color-text-primary/70">1 ETH buys today</span>
              <div className="flex items-baseline gap-x-[8px]">
                <span className={`numbers-3xl ${FAKE_TEXT}`}>{fmt(now)}</span>
                <span className="heading-small-xs">{item.unit}</span>
              </div>
            </div>
          </div>
          <div className={FAKE_ART}>
            <Pictogram glyph={item.glyph} count={now} unitLabel={item.unit} />
          </div>
        </Card>

        {/* What moved it, drawn */}
        <Card fake>
          <span className="heading-small-xs">What changed it in a year</span>
          <Dumbbell
            before={{ label: "a year ago", value: ago }}
            after={{ label: "today", value: now }}
            steps={[
              { label: "ETH price — the market", delta: ethDelta, color: "yellow" },
              { label: "Shop price — inflation", delta: shopDelta, color: "red" },
            ]}
            format={fmt}
            unit={item.unit}
            fake
          />
          <div className="text-xs md:text-sm">
            Supply is not on this list: net issuance changes your share of the network, not what ETH buys.
          </div>
        </Card>
      </div>
    </div>
  );
}
