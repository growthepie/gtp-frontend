import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import Donut from "./_components/Donut";
import Sparkline from "./_components/Sparkline";
import { StackBar, Legend } from "./_components/StatBar";
import IllustrativeTag from "./_components/IllustrativeTag";
import { ACCENT_BG, AccentColor } from "./_components/colors";
import { EthSupplySnapshot } from "@/lib/eth-the-asset/data";

function PropCard({
  icon,
  title,
  tag,
  stat,
  statLabel,
  illustrative = true,
  children,
}: {
  icon: GTPIconName;
  title: string;
  tag: string;
  stat: string;
  statLabel: string;
  illustrative?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={icon} size="md" className="!text-color-accent-turquoise" />
        <span className="heading-sm flex-1">{title}</span>
        <span className="heading-caps-xxs px-[8px] py-[2px] rounded-full bg-color-bg-medium text-color-text-secondary">{tag}</span>
      </div>
      <div className="flex items-baseline gap-x-[8px]">
        <span className="numbers-2xl">{stat}</span>
        <span className="heading-caps-xs text-color-text-secondary">{statLabel}</span>
      </div>
      {children}
      {illustrative && <IllustrativeTag />}
    </Card>
  );
}

export default function SixThingsSection({ ethSnapshot }: { ethSnapshot: EthSupplySnapshot | null }) {
  const ethGrowthPct = ethSnapshot ? -ethSnapshot.annualIssuanceRatePct : -0.04;
  const scarceRows: [string, number, AccentColor][] = [
    ["ETH", Math.abs(ethGrowthPct), "turquoise"],
    ["Gold", 1.7, "yellow"],
    ["US dollar", 5.9, "red"],
  ];
  const scarceMax = Math.max(...scarceRows.map((r) => r[1]), 5.9);

  return (
    <div className="flex flex-col gap-y-[15px]">
      <SectionHeader icon="gtp-backgroundinformation" title="Six things ETH is at once" description="Most assets are one of these. ETH is all six." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[15px]">
        <PropCard icon="gtp-metrics-fdv" title="Productive" tag="yield" stat="3.12%" statLabel="APR, paid in ETH">
          <Legend items={[{ label: "Issuance", color: "turquoise", value: "2.44%" }, { label: "Tips + MEV", color: "yellow", value: "0.68%" }]} />
          <StackBar parts={[{ label: "Issuance", value: 2.44, color: "turquoise" }, { label: "Tips + MEV", value: 0.68, color: "yellow" }]} />
        </PropCard>

        <PropCard
          icon="gtp-shield"
          title="Scarce"
          tag="store of value"
          stat={ethSnapshot ? `${(ethSnapshot.totalSupply / 1e6).toFixed(1)}M` : "120.7M"}
          statLabel={`ETH, growth ${ethGrowthPct >= 0 ? "+" : "−"}${Math.abs(ethGrowthPct).toFixed(2)}%/yr`}
          illustrative={false}
        >
          <div className="flex flex-col gap-y-[4px]">
            {scarceRows.map(([label, value, color]) => (
              <div key={label} className="grid grid-cols-[70px_1fr_44px] gap-x-[8px] items-center">
                <span className="text-xxs text-color-text-secondary">{label}</span>
                <div className="h-[8px] rounded-full bg-color-bg-medium overflow-hidden">
                  <div className={`h-full ${ACCENT_BG[color]}`} style={{ width: `${(value / scarceMax) * 100}%` }} />
                </div>
                <span className="numbers-xxs text-right">{value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <div className="text-xxs text-color-text-secondary">ETH figure from live issuance data · Gold/USD illustrative</div>
        </PropCard>

        <PropCard icon="gtp-metrics-totalvaluelocked" title="Collateral" tag="borrowable" stat="$48.2B" statLabel="ETH posted onchain">
          <div className="flex items-center gap-x-[15px]">
            <Donut
              size={88}
              thickness={12}
              segments={[
                { label: "Lending markets", value: 52, color: "turquoise" },
                { label: "Liquid staking", value: 31, color: "yellow" },
                { label: "DEX liquidity", value: 17, color: "petrol" },
              ]}
              center={<span className="numbers-sm">52%</span>}
            />
            <Legend
              compact
              items={[
                { label: "Lending", color: "turquoise", value: "52%" },
                { label: "Liquid staking", color: "yellow", value: "31%" },
                { label: "DEX", color: "petrol", value: "17%" },
              ]}
            />
          </div>
        </PropCard>

        <PropCard icon="gtp-wallet" title="Self-custodial" tag="bearer asset" stat="12s" statLabel="to settle, any day">
          <div className="flex gap-x-[8px] flex-wrap">
            {[
              ["ETH transfer", "12 sec", true],
              ["Card payment", "1–3 days", false],
              ["Bank wire", "1–5 days", false],
              ["Stock trade", "T+1", false],
            ].map(([label, value, highlight]) => (
              <div key={label as string} className="flex flex-col gap-y-[2px] px-[10px] py-[6px] rounded-[8px] bg-color-bg-medium">
                <span className="heading-caps-xxs text-color-text-secondary">{label as string}</span>
                <span className={`numbers-xs ${highlight ? "text-color-accent-turquoise" : ""}`}>{value as string}</span>
              </div>
            ))}
          </div>
        </PropCard>

        <PropCard icon="gtp-metrics-marketcap" title="Liquid" tag="market depth" stat="$28.4B" statLabel="traded per day">
          <div className="flex flex-col gap-y-[6px]">
            <Sparkline points={[14, 19, 17, 22, 26, 21, 28, 24, 31, 28, 34, 28.4]} color="yellow" height={54} />
            <span className="heading-caps-xxs text-color-text-secondary">Spot volume, 12 months</span>
          </div>
        </PropCard>

        <PropCard icon="gtp-support" title="Neutral rails" tag="freedom tech" stat="190+" statLabel="countries with users">
          <div className="grid grid-cols-[repeat(20,1fr)] gap-[3px]">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-[2px]"
                style={{
                  background: i < 57 ? "rgb(var(--accent-turquoise))" : "rgb(var(--bg-medium))",
                  opacity: i < 57 ? 0.35 + (i % 5) * 0.13 : 1,
                }}
              />
            ))}
          </div>
          <span className="heading-caps-xxs text-color-text-secondary">No permission, no market hours</span>
        </PropCard>
      </div>
    </div>
  );
}
