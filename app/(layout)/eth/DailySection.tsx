import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { SectionTitle, SectionDescription, SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Sparkline from "./_components/Sparkline";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import FaqBlock from "@/components/quick-bites/blocks/FaqBlock";
import { generateBlockId } from "@/lib/types/blockTypes";
import { AccentColor } from "./_components/colors";

// Illustrative — a live daily digest needs its own editorial/data pipeline,
// which doesn't exist yet. Labelled "example" rather than given a real date so
// it never reads as an actual published update.
const TODAY_CARDS: {
  value: string;
  unit: string;
  title: string;
  body: string;
  color: AccentColor;
  trend: number[];
}[] = [
  {
    value: "−0.04%",
    unit: "net supply, annualised",
    title: "Supply shrank again",
    body: "Fees ran hot for a fourth day, so more ETH was burned than created.",
    color: "turquoise",
    trend: [0.32, 0.28, 0.19, 0.11, 0.04, -0.01, -0.04],
  },
  {
    value: "30.4%",
    unit: "of all ETH staked",
    title: "Staking passed 30%",
    body: "Nearly a third of supply is locked securing the network, so it isn't on any exchange.",
    color: "yellow",
    trend: [28.9, 29.2, 29.4, 29.8, 30.0, 30.2, 30.4],
  },
  {
    value: "$0.003",
    unit: "median L2 transaction",
    title: "Cheapest month ever to use",
    body: "The median Layer 2 transaction cost a fraction of a cent — down sharply on last month.",
    color: "red",
    trend: [0.009, 0.008, 0.0072, 0.006, 0.0048, 0.0039, 0.003],
  },
];

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
      "Most of the fees on Ethereum today come from payments, stablecoin transfers and trading — the same things a payment network does.",
  },
];

export default function DailySection() {
  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-quick-bites" title="Today in ETH" titleSize="md" as="h2" />
        <SectionDescription>One number, one sentence.</SectionDescription>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
          {TODAY_CARDS.map((card) => (
            <Card key={card.title}>
              <div className="flex items-baseline gap-x-[5px]">
                <span className="numbers-2xl">{card.value}</span>
                <span className="heading-small-xxxs pt-[1px]">{card.unit}</span>
              </div>
              <Sparkline points={card.trend} color={card.color} height={44} />
              <span className="heading-small-xs">{card.title}</span>
              <span className="text-xs md:text-sm">{card.body}</span>
            </Card>
          ))}
        </div>
        <IllustrativeNote>Example content until this is wired to a live daily digest.</IllustrativeNote>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px] items-start">
        <Card>
          <span className="heading-small-xs">Get the daily number</span>
          <span className="text-xs md:text-sm">Supply, yield and usage — one email each morning. No price predictions.</span>
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
