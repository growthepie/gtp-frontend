"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";
import { useLiveEthPrice, withLivePrice } from "@/hooks/useLiveEthPrice";
import { MarketCapCategory } from "@/lib/eth-the-asset/data";
import { track } from "@/lib/tracking";
import EtherDiamond from "@/app/(layout)/eth/_components/EtherDiamond";
import Sparkline from "@/app/(layout)/eth/_components/Sparkline";

const ETH_ASSET_URL = "/eth";

type RankedAsset = { key: string; cap: number; kind: MarketCapCategory };

/**
 * Landing carousel tile for ETH the Asset: ETH's rank among every asset on the
 * "How big is it really?" list (the Everything filter), the ETH price with its 24h
 * change and trend, and the ETH page's diamond (display only). Links through to the ETH page.
 */
export default function LandingEthAssetCard() {
  const { data: capsData } = useEthAssetSection("market_caps");
  const { data: kpisData } = useEthAssetSection("kpis");
  const caps = capsData?.data;

  // Same ranking as the ETH page's "Everything" list: every category, largest first.
  // The crypto rank is ETH's place within that list's crypto assets (its "Crypto" filter).
  const ranked = useMemo<RankedAsset[]>(() => {
    if (!caps?.categories) return [];
    return (Object.keys(caps.categories) as MarketCapCategory[])
      .flatMap((kind) =>
        caps.categories[kind].map((item) => ({ key: item.key, cap: item.market_cap_usd, kind })),
      )
      .filter((a) => Number.isFinite(a.cap))
      .sort((a, b) => b.cap - a.cap);
  }, [caps]);

  const ethRank = ranked.findIndex((a) => a.key === "eth") + 1;
  const ethCryptoRank = ranked.filter((a) => a.key === "eth" || a.kind === "crypto").findIndex((a) => a.key === "eth") + 1;

  // The hourly 24h series, brought up to the live price (price, last point and change)
  // while the stream is coming in.
  const livePrice = useLiveEthPrice();
  const hourly = kpisData?.data?.kpis?.eth_price?.timeframes?.["24h"];
  const price = useMemo(
    () =>
      withLivePrice(
        {
          values: hourly?.data?.map(([, v]) => v).filter(Number.isFinite) ?? [],
          current: hourly?.current,
          change: hourly?.change_pct != null && Number.isFinite(hourly.change_pct) ? hourly.change_pct * 100 : null,
        },
        livePrice,
      ),
    [hourly, livePrice],
  );
  const priceTrend = price.values;
  // Rounded to what's shown, so a tiny move reads "0.0%" rather than a red "-0.0%".
  const priceChange = price.change === null ? null : Math.round(price.change * 10) / 10 || 0;

  return (
    <Link
      href={ETH_ASSET_URL}
      onClick={() => {
        track("clicked ETH the Asset card", {
          location: "landing carousel",
          page: window.location.pathname,
        });
      }}
      className="group/eth flex flex-col w-full min-w-[100px] h-[145px] md:h-[176px] rounded-[15px] bg-color-bg-default border-[1px] border-color-bg-medium px-[15px] py-[10px] select-none"
    >
      <div className="flex items-center justify-between gap-x-[10px]">
        <div className="heading-large-sm md:heading-large-md truncate">ETH the Asset</div>
        <div className="size-[24px] shrink-0 bg-color-bg-medium rounded-full flex items-center justify-center transition-colors duration-300 group-hover/eth:bg-color-ui-hover">
          <Icon icon="feather:arrow-right" className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-x-[10px]">
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Wraps the change under the price when the card is too narrow for both;
              the sparkline below then gives up the height. */}
          <div className="flex flex-wrap items-baseline gap-x-[8px] pt-[4px] whitespace-nowrap">
            <div className="numbers-xl md:numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent">
              {price.current !== undefined
                ? price.current.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"}
            </div>
            <div className={`numbers-xs ${priceChange === null ? "" : priceChange > 0 ? "text-color-positive" : priceChange < 0 ? "text-color-negative" : ""}`}>
              {priceChange === null ? "" : `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(1)}%`}
            </div>
            {/* Only where cards are wide enough for it on the same line. */}
            <div className="hidden xl:block heading-small-xxxs text-color-text-secondary">24h</div>
          </div>
          {/* Up to 56px tall (44px on phones), less when the price row wraps; the svg
              stretches to fit. The end dot pulses while the price is live. */}
          <div className="pt-[4px] flex-1 min-h-0 max-h-[48px] md:max-h-[60px] [&>*]:!h-full">
            {priceTrend.length > 1 && <Sparkline points={priceTrend} color="turquoise" height={56} pulseEnd={livePrice !== null} />}
          </div>

          {/* Crypto rank, then rank among all assets, by market cap: label, then number.
              On a card too narrow for both on one line, the asset rank wraps below. */}
          <div className="mt-auto pt-[4px] flex flex-wrap items-baseline gap-x-[24px] whitespace-nowrap">
            {[
              { rank: ethCryptoRank, label: "Crypto rank" },
              { rank: ethRank, label: "Asset rank" },
            ].map(({ rank, label }) => (
              <div key={label} className="flex items-baseline gap-x-[6px]">
                <div className="heading-small-xxxs text-color-ui-hover">{label}</div>
                <div className="numbers-md md:numbers-lg text-color-text-primary">
                  {rank > 0 ? `#${rank}` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display only: the card is a link, so the glyph just spins. */}
        <div className="w-[90px] xl:w-[110px] shrink-0 self-center">
          <EtherDiamond height={110} interactive={false} />
        </div>
      </div>
    </Link>
  );
}
