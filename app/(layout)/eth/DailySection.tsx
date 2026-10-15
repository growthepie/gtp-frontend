import useSWR from "swr";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { SectionTitle, SectionDescription, SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import Card from "./_components/Card";
import Sparkline from "./_components/Sparkline";
import { IllustrativeNote } from "./_components/IllustrativeTag";
import FaqBlock from "@/components/quick-bites/blocks/FaqBlock";
import { generateBlockId } from "@/lib/types/blockTypes";
import { AccentColor, FAKE_TEXT, fakeColor, ifFake } from "./_components/colors";
import { EthAssetKpisResponse, EthAssetPropertiesResponse } from "@/lib/eth-the-asset/data";
import { EthAssetURLs } from "@/lib/urls";

type TodayCard = {
  value: string;
  unit: string;
  title: string;
  body: string;
  color: AccentColor;
  trend: number[];
  /** Example content, not from the JSONs. */
  fake?: boolean;
};

// Supply and staking are live (properties.json / kpis.json, 7-day trend lines)
// with headlines picked from the data. The L2 cost card is still illustrative — a
// live daily digest needs its own editorial/data pipeline, which doesn't exist yet.
const EXAMPLE_CARDS: TodayCard[] = [
  {
    value: "$0.003",
    unit: "median L2 transaction",
    title: "Cheapest month ever to use",
    body: "The median Layer 2 transaction cost a fraction of a cent — down sharply on last month.",
    color: "red",
    trend: [0.009, 0.008, 0.0072, 0.006, 0.0048, 0.0039, 0.003],
    fake: true,
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
  const { data: kpisData } = useSWR<EthAssetKpisResponse>(EthAssetURLs.kpis);
  const { data: propsData } = useSWR<EthAssetPropertiesResponse>(EthAssetURLs.properties);
  const supplyChange = propsData?.data?.scarcity?.assets?.eth?.value;
  const supplyWeek = kpisData?.data?.kpis?.eth_supply?.timeframes?.["7d"];
  const stakedWeek = kpisData?.data?.kpis?.staked_share?.timeframes?.["7d"];

  const liveCards: TodayCard[] = [];
  if (supplyChange !== undefined && supplyWeek?.data?.length) {
    const grew = supplyChange >= 0;
    liveCards.push({
      value: `${grew ? "+" : "−"}${Math.abs(supplyChange * 100).toFixed(2)}%`,
      unit: "net supply, annualised",
      title: grew ? "Supply is growing slowly" : "Supply is shrinking",
      body: grew
        ? "Over the last 30 days, more ETH was created than burned. Busier blocks burn more and can flip it."
        : "Over the last 30 days, fees burned more ETH than was created.",
      color: "turquoise",
      trend: supplyWeek.data.map(([, v]) => v),
    });
  }
  if (stakedWeek?.current !== undefined && stakedWeek.data?.length) {
    const stakedPct = stakedWeek.current * 100;
    liveCards.push({
      value: `${stakedPct.toFixed(1)}%`,
      unit: "of all ETH staked",
      title: `Over ${Math.floor(stakedPct / 5) * 5}% of ETH is staked`,
      body: "That ETH is locked securing the network rather than sitting on an exchange.",
      color: "yellow",
      trend: stakedWeek.data.map(([, v]) => v * 100),
    });
  }
  const todayCards = [...liveCards, ...EXAMPLE_CARDS];

  return (
    <div className="flex flex-col gap-y-[30px]">
      <div className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-quick-bites" title="Today in ETH" titleSize="md" as="h2" />
        <SectionDescription>One number, one sentence.</SectionDescription>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px]">
          {todayCards.map((card) => (
            <Card key={card.title} fake={card.fake}>
              <div className="flex items-baseline gap-x-[5px]">
                <span className={`numbers-2xl ${ifFake(!!card.fake, FAKE_TEXT)}`}>{card.value}</span>
                <span className="heading-small-xxxs pt-[1px]">{card.unit}</span>
              </div>
              <Sparkline points={card.trend} color={card.fake ? fakeColor(card.color) : card.color} height={44} />
              <span className="heading-small-xs">{card.title}</span>
              <span className="text-xs md:text-sm">{card.body}</span>
            </Card>
          ))}
        </div>
        <IllustrativeNote>
          Supply and staking are live, with 7-day trend lines. The Layer 2 cost card is example content until this is
          wired to a live daily digest.
        </IllustrativeNote>
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
          <span className="heading-small-xs">Get the weekly numbers</span>
          <span className="text-xs md:text-sm">Supply, yield and usage — one email each week. No price predictions.</span>
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
