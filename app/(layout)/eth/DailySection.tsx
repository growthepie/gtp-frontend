import type { ReactNode } from "react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { SectionTitle, SectionDescription, SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Sparkline from "./_components/Sparkline";
import InfoButton from "@/components/GTPComponents/GTPInfoButton";
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

// value_formatted can carry words after the number ("0.93M new wallets in 7 days"):
// the number stays large and the words become its label, like "APR, paid in ETH".
function splitValue(formatted: string): { value: string; unit: string | null } {
  const match = formatted.match(/^([$€£]?[\d.,]+[A-Za-z%]{0,2})\s+(.+)$/);
  return match ? { value: match[1], unit: match[2] } : { value: formatted, unit: null };
}

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
    question: "“Proof of Stake is a scam.”",
    answer:
      "Ethereum ran on proof of work, the same mining model as Bitcoin, from its launch in 2015 until the Merge in September 2022. Switching to proof of stake cut energy use by over 99.9% and new ETH issuance by around 90%, because the network no longer has to pay for mining hardware and electricity. It also changed what an attack costs: an attacker has to buy and lock up ETH, and the protocol can destroy (slash) that stake if they misbehave, while a miner who attacks keeps their hardware. And anyone with ETH can take part from an ordinary computer, without specialized mining machines.",
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

/** `children` sits between "Today in ETH" and the FAQ (the page puts Quick Bites there). */
export default function DailySection({ children }: { children?: ReactNode }) {
  const { data: todayData } = useEthAssetSection("today");
  const todayCards = (todayData?.data?.cards ?? []).slice(0, TODAY_CARD_COUNT);
  const todaySources = [...new Set(todayCards.flatMap((c) => c.sources.map((s) => s.name)))];

  // Every block here is its own section, so they're spaced like the rest of the page.
  return (
    <div className="flex flex-col gap-y-[60px]">
      <div className="flex flex-col gap-y-[15px]">
        <div className="flex items-center gap-x-[8px]">
          <SectionTitle icon="gtp-quick-bites" title="Today in ETH" titleSize="md" as="h2" />
          <InfoButton label="About Today in ETH">
            <span>A new card each day, picked from the day&apos;s data and written up automatically.</span>
            {todaySources.length > 0 && <span>Sources: {todaySources.join(", ")}.</span>}
          </InfoButton>
        </div>
        <SectionDescription>One number, one sentence.</SectionDescription>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
          {todayCards.map((card, i) => {
            const color = TODAY_COLORS[i % TODAY_COLORS.length];
            const trend = card.sparkline.data.map(([, v]) => v).filter(Number.isFinite);
            const { value, unit } = splitValue(card.value_formatted);
            return (
              // Each card spans four rows of a shared subgrid (value, trend, headline, sentence),
              // so a value that wraps or a longer headline keeps the rows aligned across cards.
              <Card key={card.date} className="grid grid-rows-subgrid row-span-4">
                <div className="flex items-baseline justify-between gap-x-[10px]">
                  <span className="flex flex-wrap items-baseline gap-x-[8px] min-w-0">
                    <span className="numbers-2xl">{value}</span>
                    {unit && <span className="heading-small-xxxs pt-[1px]">{unit}</span>}
                  </span>
                  <span className="heading-small-xxxs pt-[1px] text-color-text-primary/70 whitespace-nowrap">{card.data_date}</span>
                </div>
                {/* Milestone cards have no trend; keep the space so the three cards line up. */}
                {trend.length > 1 ? <Sparkline points={trend} color={color} height={44} /> : <div className="h-[44px]" />}
                <span className="heading-large-xs md:heading-large-sm">{card.headline}</span>
                <span className="text-sm">{card.sentence}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {children}

      <FaqBlock
        block={{
          id: generateBlockId(),
          type: "faq",
          title: "Things you have probably heard",
          description: "Fair objections, answered plainly.",
          items: MYTHS,
          // the section gap above spaces it, not the block's own margin
          className: "!my-0",
        }}
      />

      {/* The closing cards, 15px apart like the cards in every section. */}
      <div className="flex flex-col gap-y-[15px]">
        {/* "Go deeper" fills the row on its own when the newsletter card is hidden. */}
        <div className={`grid grid-cols-1 ${IS_PRODUCTION ? "" : "md:grid-cols-2"} gap-[15px] items-start`}>
          {/* Placeholder: there's no newsletter behind this yet (input and button are disabled),
              so it's marked like the fake data, and hidden in production. */}
          {!IS_PRODUCTION && (
          <Card fake>
            <span className="heading-small-xs">Get the weekly numbers</span>
            <span className="text-sm">Supply, yield and usage in one email each week. No price predictions.</span>
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
            <span className="text-sm">Community work behind these numbers.</span>
            <div className="flex flex-wrap gap-[10px] items-start">
              <SectionButtonLink href="https://ethval.com/#valuation" newTab label="ETHval dashboard" />
              <SectionButtonLink href="https://productivemoney.xyz" newTab label="Productive Money" />
            </div>
          </Card>
        </div>

        <div className="rounded-[15px] bg-color-bg-medium p-[15px] flex items-center gap-x-[15px]">
          <span className="font-raleway font-bold text-[36px] leading-[36px] text-color-accent-yellow tracking-wide">NFA</span>
          <span className="text-sm flex-1">
            Not financial advice. Public onchain data and our reading of it. ETH is volatile and you can lose money holding it.
          </span>
        </div>
      </div>
    </div>
  );
}
