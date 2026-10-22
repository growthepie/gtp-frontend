import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { SectionTitle, SectionDescription, SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Sparkline from "./_components/Sparkline";
import FaqBlock from "@/components/quick-bites/blocks/FaqBlock";
import { generateBlockId } from "@/lib/types/blockTypes";
import { AccentColor } from "./_components/colors";
import { useEthAssetSection } from "@/hooks/useEthAssetSection";
import { IS_PRODUCTION } from "@/lib/helpers";

// "Today in ETH" shows the newest cards from daily.json's `today` section: one card a
// day, each a metric with an automatically written headline and sentence.
const TODAY_CARD_COUNT = 3;
// Accent per position, so the three cards stay distinguishable.
const TODAY_COLORS: AccentColor[] = ["turquoise", "yellow", "red"];

const MYTHS = [
  {
    question: "“ETH has no cap, so it’s inflationary.”",
    answer:
      "It has no fixed cap and it has still shrunk in supply during busy periods, because fees are burned. A cap is one way to be scarce; burning is another.",
  },
  {
    question: "“It uses as much power as a country.”",
    answer:
      "That stopped in 2022. Ethereum switched from mining to staking and cut its energy use by over 99.9%. It now runs on roughly the power of a small town.",
  },
  {
    question: "“It’s only used for speculation.”",
    answer:
      "Most of the fees on Ethereum today come from payments, stablecoin transfers and trading, the same things a payment network does.",
  },
  {
    question: "“It’s vulnerable to quantum computers.”",
    answer:
      "In theory, for now. The signatures that wallets and validators use today could be broken by a large enough quantum computer, though no such machine exists yet. Ethereum has a plan to switch to quantum-safe cryptography: a dedicated team is building it, test networks are already running, and the aim is a quantum-safe base layer by the end of the decade.",
  },
  {
    question: "“AI is the future, not crypto.”",
    answer:
      "It isn't one or the other. AI agents that act on their own will need to pay for things, and banks don't open accounts for software. A wallet works for anyone, or anything, that holds a key, so agents will have wallets, not bank accounts. Ethereum already has the pieces: x402 lets an agent pay for a web request in stablecoins as part of making it, on Ethereum and its Layer 2s, and ERC-8004 gives agents an onchain identity and reputation so others can decide whether to trust them.",
  },
];

export default function DailySection() {
  const { data: todayData } = useEthAssetSection("today");
  const todayCards = (todayData?.data?.cards ?? []).slice(0, TODAY_CARD_COUNT);
  const todaySources = [...new Set(todayCards.flatMap((c) => c.sources.map((s) => s.name)))];

  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-quick-bites" title="Today in ETH" titleSize="md" as="h2" />
        <SectionDescription>One number, one sentence.</SectionDescription>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
          {todayCards.map((card, i) => {
            const color = TODAY_COLORS[i % TODAY_COLORS.length];
            const trend = card.sparkline.data.map(([, v]) => v).filter(Number.isFinite);
            return (
              <Card key={card.date}>
                <div className="flex items-baseline justify-between gap-x-[10px]">
                  <span className="numbers-2xl">{card.value_formatted}</span>
                  <span className="heading-small-xxxs pt-[1px] text-color-text-primary/70 whitespace-nowrap">{card.data_date}</span>
                </div>
                {/* Milestone cards have no trend; keep the space so the three cards line up. */}
                {trend.length > 1 ? <Sparkline points={trend} color={color} height={44} /> : <div className="h-[44px]" />}
                <span className="heading-small-xs">{card.headline}</span>
                <span className="text-xs md:text-sm">{card.sentence}</span>
              </Card>
            );
          })}
        </div>
        <div className="text-xs text-color-text-primary/70">
          A new card each day, picked from the day&apos;s data and written up automatically.
          {todaySources.length > 0 && <> Sources: {todaySources.join(", ")}.</>}
        </div>
      </div>

      <FaqBlock
        block={{
          id: generateBlockId(),
          type: "faq",
          title: "Things you have probably heard",
          description: "Fair objections, answered plainly.",
          items: MYTHS,
        }}
      />

      {/* "Go deeper" fills the row on its own when the newsletter card is hidden. */}
      <div className={`grid grid-cols-1 ${IS_PRODUCTION ? "" : "md:grid-cols-2"} gap-[15px] items-start`}>
        {/* Placeholder: there's no newsletter behind this yet (input and button are disabled),
            so it's marked like the fake data, and hidden in production. */}
        {!IS_PRODUCTION && (
        <Card fake>
          <span className="heading-small-xs">Get the weekly numbers</span>
          <span className="text-xs md:text-sm">Supply, yield and usage in one email each week. No price predictions.</span>
          <div className="flex gap-x-[8px]">
            <input
              placeholder="you@email.com"
              disabled
              aria-label="Email address"
              className="flex-1 min-w-0 h-[36px] rounded-full border-none bg-color-bg-medium px-[15px] text-color-text-primary font-raleway text-sm outline-none"
            />
            <GTPButton label="Subscribe" leftIcon="gtp-email" variant="highlight" disabled size="sm" />
          </div>
        </Card>
        )}
        <Card>
          <span className="heading-small-xs">Go deeper</span>
          <span className="text-xs md:text-sm">Community work behind these numbers.</span>
          <div className="flex flex-wrap gap-[10px] items-start">
            <SectionButtonLink href="https://ethval.com/#valuation" newTab label="ETHval dashboard" />
            <SectionButtonLink href="https://productivemoney.xyz" newTab label="Productive Money" />
          </div>
        </Card>
      </div>

      <div className="rounded-[15px] bg-color-bg-medium p-[15px] flex items-center gap-x-[15px]">
        <span className="font-raleway font-bold text-[36px] leading-[36px] text-color-accent-yellow tracking-wide">NFA</span>
        <span className="text-xs md:text-sm flex-1">
          Not financial advice. Public onchain data and our reading of it. ETH is volatile and you can lose money holding it.
        </span>
      </div>
    </div>
  );
}
