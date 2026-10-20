"use client";

import { useState } from "react";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import Card from "./_components/Card";
import Pictogram from "./_components/Pictogram";
import Dumbbell from "./_components/Dumbbell";
import { BasketIcon, BasketGlyph, EGG, BREAD, COFFEE, FUEL, GOLD_BAR } from "./_components/BasketIcons";
import { PurchasingPowerItem } from "@/lib/eth-the-asset/data";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";

// Everything here comes from purchasing_power.json: per region, how many of each item
// one ETH buys now and a year ago, and how much of that change came from the ETH price
// vs the shop price. The glyphs and unit names (US English: the JSON says "litre")
// are the only things set here.
const ITEM_DISPLAY: Record<string, { glyph: BasketGlyph; unit: string; units: string }> = {
  bread: { glyph: BREAD, unit: "500 g loaf", units: "loaves" },
  eggs: { glyph: EGG, unit: "dozen", units: "dozen" },
  coffee: { glyph: COFFEE, unit: "500 g bag", units: "500 g bags" },
  fuel: { glyph: FUEL, unit: "liter", units: "liters" },
  gold: { glyph: GOLD_BAR, unit: "gram", units: "grams" },
};

// Region tabs, in this order, with short labels so the bar fits on a phone.
const REGIONS = [
  { key: "us", label: "US" },
  { key: "euro_area", label: "Euro area" },
  { key: "uk", label: "UK" },
  { key: "japan", label: "Japan" },
] as const;
type RegionKey = (typeof REGIONS)[number]["key"];

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString("en-US") : n >= 10 ? n.toFixed(1) : n.toFixed(2));

const formatPrice = (value: number, currency: string) =>
  value.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 });

// "2026-09-01" → "September 2026".
const formatMonth = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export default function BasketSection() {
  const [regionKey, setRegionKey] = useState<RegionKey>("us");
  const [regionsWrapping, setRegionsWrapping] = useState(false);
  const [selectedKey, setSelectedKey] = useState("bread");
  const { data, isLoading } = useEthAssetSection("purchasing_power");

  const region = data?.data?.regions?.[regionKey];
  // Only items with a glyph and finite numbers are drawn.
  const items = (region?.items ?? []).filter(
    (i) => ITEM_DISPLAY[i.key] && Number.isFinite(i.units_per_eth) && Number.isFinite(i.units_per_eth_year_ago),
  );
  const item: PurchasingPowerItem | undefined = items.find((i) => i.key === selectedKey) ?? items[0];

  if (!region || !item) {
    return (
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-package" title="What one ETH actually buys" titleSize="md" as="h2" />
        {/* Still showing once loaded means the data is missing: a fallback (dev only). */}
        <Card className="min-h-[200px] items-center justify-center text-xs text-color-text-primary/70" fallback={!isLoading}>
          Loading prices…
        </Card>
      </div>
    );
  }

  const display = ITEM_DISPLAY[item.key];
  const sources = [...new Set([...item.sources, ...(data?.data?.eth_price_sources ?? [])].map((s) => s.name))];

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-package" title="What one ETH actually buys" titleSize="md" as="h2" />
      <SectionDescription>
        Supply and burn only matter if they change what ETH gets you. Two things move that number, and neither of them
        is the burn.
      </SectionDescription>

      <GTPButtonContainer style={regionsWrapping ? { borderRadius: "15px" } : undefined}>
        <GTPButtonRow wrap autoFill onWrapChange={setRegionsWrapping}>
          {REGIONS.map((r) => (
            <GTPButton key={r.key} label={r.label} isSelected={regionKey === r.key} clickHandler={() => setRegionKey(r.key)} size="sm" />
          ))}
        </GTPButtonRow>
      </GTPButtonContainer>

      {/* Small multiples: every item, drawn — and the selector for the detail below */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[10px]">
        {items.map((b) => {
          const active = b.key === item.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setSelectedKey(b.key)}
              className={`flex flex-col items-center gap-y-[5px] p-[10px] rounded-[15px] transition-colors duration-200 ${
                active ? "bg-color-ui-hover" : "bg-color-bg-default hover:bg-color-ui-hover"
              }`}
            >
              <BasketIcon glyph={ITEM_DISPLAY[b.key].glyph} size={40} />
              <span className="numbers-sm">{fmt(b.units_per_eth)}</span>
              <span className="heading-small-xxxs text-color-text-primary/70">{b.name}</span>
              <span className={`numbers-xs ${b.change_pct < 0 ? "text-color-negative" : "text-color-positive"}`}>
                {b.change_pct < 0 ? "−" : "+"}
                {Math.abs(b.change_pct * 100).toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[15px]">
        {/* The answer, drawn */}
        <Card>
          <div className="flex items-center gap-x-[15px]">
            <BasketIcon glyph={display.glyph} size={64} className="flex-shrink-0" />
            <div className="flex flex-col gap-y-[2px]">
              <span className="heading-small-xxxs text-color-text-primary/70">1 ETH buys today</span>
              <div className="flex items-baseline gap-x-[8px]">
                <span className="numbers-3xl">{fmt(item.units_per_eth)}</span>
                <span className="heading-small-xs">{display.units}</span>
              </div>
            </div>
          </div>
          <Pictogram glyph={display.glyph} count={item.units_per_eth} unitLabel={display.units} />
        </Card>

        {/* What moved it, drawn */}
        <Card>
          <span className="heading-small-xs">What changed it in a year</span>
          <Dumbbell
            before={{ label: "a year ago", value: item.units_per_eth_year_ago }}
            after={{ label: "today", value: item.units_per_eth }}
            steps={[
              { label: "ETH price (the market)", delta: item.change_units.eth_price, color: "yellow" },
              { label: "Shop price (inflation)", delta: item.change_units.shop_price, color: "red" },
            ]}
            format={fmt}
            unit={display.units}
          />
          <div className="text-xs md:text-sm">
            Supply is not on this list: net issuance changes your share of the network, not what ETH buys.
          </div>
        </Card>
      </div>

      <div className="text-xs text-color-text-primary/70">
        {region.name}: 1 ETH = {formatPrice(region.eth_price, region.currency)} today,{" "}
        {formatPrice(region.eth_price_year_ago, region.currency)} a year ago. {item.name} costs{" "}
        {formatPrice(item.price, region.currency)} per {display.unit} ({formatPrice(item.price_year_ago, region.currency)} a year
        ago), as of {formatMonth(item.price_as_of)}
        {/* Only mention the conversion when the source priced a different unit. */}
        {!item.source_unit.startsWith(item.unit) && <>, converted from {item.source_unit}</>}. Sources: {sources.join(", ")}.
      </div>
    </div>
  );
}
