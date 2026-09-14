import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import Card from "./_components/Card";
import SectionHeader from "./_components/SectionHeader";
import IllustrativeTag from "./_components/IllustrativeTag";
import FaqBlock from "@/components/quick-bites/blocks/FaqBlock";
import { generateBlockId } from "@/lib/types/blockTypes";

// Illustrative — a live "daily digest" needs its own editorial/data pipeline,
// which doesn't exist yet. Labeled "Example" rather than a real date so it
// never reads as an actual published update.
const TODAY_CARDS: [string, string, string][] = [
  ["Supply shrank again", "Fees ran hot for the fourth day in a row, so more ETH was burned than created.", "turquoise"],
  ["Staking passed 30%", "Nearly a third of all ETH is now locked up securing the network, which means it is not for sale on any exchange.", "yellow"],
  ["Cheapest month ever to use", "The median transaction on an Ethereum L2 cost a fraction of a cent — down sharply from the month before.", "red"],
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
    answer: "Most of the fees on Ethereum today come from payments, stablecoin transfers and trading — the same things a payment network does.",
  },
];

const COLOR_BORDER: Record<string, string> = {
  turquoise: "border-color-accent-turquoise",
  yellow: "border-color-accent-yellow",
  red: "border-color-accent-red",
};

export default function DailySection() {
  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="flex flex-col gap-y-[15px]">
        <SectionHeader icon="gtp-quick-bites" title="Today in ETH" description="One number, one sentence — example content until this is wired to a live daily digest." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
          {TODAY_CARDS.map(([title, body, color]) => (
            <Card key={title} className={`border-t-2 ${COLOR_BORDER[color]}`}>
              <IllustrativeTag label="example" />
              <span className="heading-sm">{title}</span>
              <span className="text-sm text-color-text-primary">{body}</span>
            </Card>
          ))}
        </div>
      </div>

      <FaqBlock
        block={{
          id: generateBlockId(),
          type: "faq",
          title: "Things you have probably heard",
          description: "Fair objections, answered plainly.",
          items: MYTHS.map((m) => ({ question: m.question, answer: m.answer })),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
        <Card>
          <span className="heading-sm">What kind of holder are you?</span>
          <span className="text-sm text-color-text-secondary">Four questions. We show you which of the six properties matter for you.</span>
          <GTPButton label="Start the four questions" leftIcon="gtp-compass" variant="highlight" disabled size="sm" />
        </Card>
        <Card>
          <span className="heading-sm">Get the daily number</span>
          <span className="text-sm text-color-text-secondary">Supply, yield and usage — one email each morning. No price predictions.</span>
          <div className="flex gap-x-[8px]">
            <input
              placeholder="you@email.com"
              disabled
              className="flex-1 h-[36px] rounded-full border-none bg-color-bg-medium px-[15px] text-color-text-primary font-raleway text-sm outline-none"
            />
            <GTPButton label="Subscribe" leftIcon="gtp-email" variant="highlight" disabled size="sm" />
          </div>
        </Card>
        <Card>
          <span className="heading-sm">Go deeper</span>
          <span className="text-sm text-color-text-secondary">Community work behind these numbers.</span>
          <div className="flex flex-col gap-y-[5px]">
            <a href="https://ethval.com/#valuation" target="_blank" rel="noopener noreferrer" className="text-sm underline">
              ETHval — intrinsic value dashboard ↗
            </a>
            <a href="https://productivemoney.xyz" target="_blank" rel="noopener noreferrer" className="text-sm underline">
              Ethereum and the Era of Productive Money ↗
            </a>
          </div>
        </Card>
      </div>

      <div className="rounded-[15px] bg-color-bg-medium p-[15px] flex items-center gap-x-[15px]">
        <span className="font-raleway font-bold text-[36px] leading-[36px] text-color-accent-yellow tracking-wide">NFA</span>
        <span className="text-sm flex-1">Not financial advice. Public onchain data and our reading of it. ETH is volatile and you can lose money holding it.</span>
      </div>
    </div>
  );
}
