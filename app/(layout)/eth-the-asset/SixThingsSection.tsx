import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Sparkline from "./_components/Sparkline";
import { StackBar, Legend, BarRow } from "./_components/StatBar";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import { AccentColor } from "./_components/colors";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";

function PropCard({
  icon,
  title,
  tag,
  value,
  unit,
  children,
}: {
  icon: GTPIconName;
  title: string;
  tag: string;
  value: string;
  unit: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={icon} size="md" />
        <span className="heading-small-xs flex-1">{title}</span>
        <span className="heading-small-xxxs px-[8px] py-[3px] rounded-full bg-color-bg-medium">{tag}</span>
      </div>
      <div className="flex items-baseline gap-x-[5px]">
        <span className="numbers-2xl">{value}</span>
        <span className="heading-small-xxxs pt-[1px]">{unit}</span>
      </div>
      {children}
    </Card>
  );
}

/** Always-open vs market hours — the point "no market hours" makes visually. */
function MarketHours() {
  const rows: { label: string; hours: number; note: string; color: AccentColor }[] = [
    { label: "Ethereum", hours: 24, note: "every day", color: "turquoise" },
    { label: "Stock market", hours: 6.5, note: "weekdays", color: "neutral" },
  ];
  return (
    <div className="flex flex-col gap-y-[10px]">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-y-[4px]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs md:text-sm">{r.label}</span>
            <span className="numbers-xs">
              {r.hours}h · {r.note}
            </span>
          </div>
          <div className="flex gap-[2px] h-[10px]">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className={`flex-1 rounded-[2px] ${
                  h < r.hours ? (r.color === "turquoise" ? "bg-color-accent-turquoise" : "bg-color-ui-hover") : "bg-color-bg-medium"
                }`}
                style={h === Math.floor(r.hours) && r.hours % 1 > 0 ? { opacity: r.hours % 1 } : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SixThingsSection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const ethGrowthPct = ethSnapshot ? -ethSnapshot.annualIssuanceRatePct : -0.04;
  const scarceRows: { label: string; value: number; color: AccentColor; emphasis?: boolean }[] = [
    { label: "ETH", value: Math.abs(ethGrowthPct), color: "turquoise", emphasis: true },
    { label: "Gold", value: 1.7, color: "neutral" },
    { label: "US dollar", value: 5.9, color: "neutral" },
  ];

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-backgroundinformation" title="Six things ETH is at once" titleSize="md" as="h2" />
      <SectionDescription>Most assets are one of these. ETH is all six.</SectionDescription>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[15px]">
        <PropCard icon="gtp-metrics-fdv" title="Productive" tag="yield" value="3.12%" unit="APR, paid in ETH">
          <StackBar
            parts={[
              { label: "Issuance", value: 2.44, color: "turquoise" },
              { label: "Tips + MEV", value: 0.68, color: "yellow" },
            ]}
          />
          <Legend
            items={[
              { label: "Issuance", color: "turquoise", value: "2.44%" },
              { label: "Tips + MEV", color: "yellow", value: "0.68%" },
            ]}
          />
        </PropCard>

        <PropCard
          icon="gtp-shield"
          title="Scarce"
          tag="store of value"
          value={ethSnapshot ? `${(ethSnapshot.totalSupply / 1e6).toFixed(1)}M` : "120.7M"}
          unit={`ETH · ${ethGrowthPct >= 0 ? "+" : "−"}${Math.abs(ethGrowthPct).toFixed(2)}% a year`}
        >
          <div className="flex flex-col gap-y-[6px]">
            {scarceRows.map((r) => (
              <BarRow
                key={r.label}
                label={r.label}
                value={r.value}
                display={`${r.value.toFixed(2)}%`}
                max={5.9}
                color={r.color}
                emphasis={r.emphasis}
              />
            ))}
          </div>
          <div className="text-xs">Annual change in total stock. ETH is live; gold and dollar are illustrative.</div>
        </PropCard>

        <PropCard icon="gtp-metrics-totalvaluelocked" title="Collateral" tag="borrowable" value="$48.2B" unit="ETH posted onchain">
          <StackBar
            parts={[
              { label: "Lending markets", value: 52, color: "turquoise" },
              { label: "Liquid staking", value: 31, color: "yellow" },
              { label: "DEX liquidity", value: 17, color: "red" },
            ]}
          />
          <Legend
            items={[
              { label: "Lending", color: "turquoise", value: "52%" },
              { label: "Liquid staking", color: "yellow", value: "31%" },
              { label: "DEX", color: "red", value: "17%" },
            ]}
          />
        </PropCard>

        <PropCard icon="gtp-wallet" title="Self-custodial" tag="bearer asset" value="12s" unit="to settle, any day">
          <div className="grid grid-cols-2 gap-[8px]">
            {[
              ["ETH transfer", "12 sec", true],
              ["Card payment", "1–3 days", false],
              ["Bank wire", "1–5 days", false],
              ["Stock trade", "T+1", false],
            ].map(([label, value, highlight]) => (
              <div key={label as string} className="flex flex-col gap-y-[2px] px-[10px] py-[8px] rounded-[8px] bg-color-bg-medium">
                <span className="heading-small-xxxs text-color-text-primary/70">{label as string}</span>
                <span className={`numbers-sm ${highlight ? "text-color-accent-turquoise" : ""}`}>{value as string}</span>
              </div>
            ))}
          </div>
        </PropCard>

        <PropCard icon="gtp-metrics-marketcap" title="Liquid" tag="market depth" value="$28.4B" unit="traded per day">
          <Sparkline points={[14, 19, 17, 22, 26, 21, 28, 24, 31, 28, 34, 28.4]} color="yellow" height={54} />
          <span className="heading-small-xxxs text-color-text-primary/70">Spot volume, 12 months</span>
        </PropCard>

        <PropCard icon="gtp-support" title="Neutral rails" tag="freedom tech" value="190+" unit="countries with users">
          <MarketHours />
        </PropCard>
      </div>

      <IllustrativeNote>
        Supply and issuance are live. The yield split, collateral mix, settlement times, spot volume and country count
        are illustrative.
      </IllustrativeNote>
    </div>
  );
}
