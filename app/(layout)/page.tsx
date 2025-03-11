import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Icon from "@/components/layout/ServerIcon";
// import ShowLoading from "@/components/layout/ShowLoading";
import Subheading from "@/components/layout/Subheading";
import SwiperContainer from "@/components/layout/SwiperContainer";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import LandingSwiperItems from "@/components/layout/LandingSwiperItems";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { SectionButtonLink } from "@/components/layout/TextHeadingComponents";
// import { LandingURL } from "@/lib/urls";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:
      "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement - growthepie",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  };
}
/** */
export default async function Page() {
  return (
    <>
      <Container className="flex flex-col flex-1 w-full mt-[45px] md:mt-[30px] gap-y-[10px]">
        <Heading
          className="font-bold leading-[1.2] text-[24px] sm:text-[32px] md:text-[36px] max-w-[900px]"
          as="h1"
        >
          Understand every slice of Ethereum
        </Heading>
        <div className="flex items-center gap-x-[10px]">
          <Subheading className="text-xs sm:text-sm md:text-xl font-semibold leading-[1.2]">
            Ethereum is more than one blockchain. It&apos;s many.
          </Subheading>
          <a className="flex p-[3px] bg-[#344240] rounded-full items-center gap-x-[4px] relative top-[1px]" href="https://ethereum.org/" target="_blank">
              <GTPIcon icon={"ethereum-logo-monochrome"} size="sm" className="" />
              <div className="text-xs">What is Ethereum?</div>
              <Icon icon="feather:arrow-right" className="w-[12px] h-[12px]" />
          </a>
        </div>
      </Container>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[30px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon icon={"gtp-ethereumlogo"} size="lg" />
          <Heading
            id="layer-2-traction-title"
            className="heading-large-lg"
          >
            Ethereum Ecosystem Traction
          </Heading>
        </div>
        <Subheading className="text-md px-[5px] ">
          <div>These aggregated metrics across Ethereum Mainnet and all tracked Layer 2s give you a glimpse of the entire ecosystem.</div>
        </Subheading>
      </Container>
      {/* <Container className="!px-0 fade-edge-div pb-[24px] -mb-[24px]"> */}
      <SwiperContainer ariaId={"layer-2-traction-title"} size="landing">
        <LandingSwiperItems />
      </SwiperContainer>
      {/* </Container> */}

      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <GTPIcon icon={"gtp-ethereum-weekly"} size="lg" />
          <Heading className="heading-large-lg">
            Ethereum Weekly Engagement
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
          Number of unique addresses interacting with one or multiple chains in the Ethereum ecosystem in a given week.
        </Subheading>
      </Container>
      <LandingUserBaseChart />
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <Icon
            icon="gtp:package"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="layer-2-traction-title"
            className="text-[20px] md:text-[30px] leading-[1.2] font-semibold"
          >
            Top Applications
          </Heading>
        </div>
        <SectionButtonLink href="/applications" label="See more applications" shortLabel="More apps" />
        </div>
        <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
        Top 6 gainers and losers across the Layer 2s based on gas fees paid in the last 7 days.
        </Subheading>
      </Container>
      <Container className="">
        <LandingTopContracts />
      </Container>
      <Container>
        <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
          <Icon
            icon="gtp:gtp-faq"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="layer-2-traction-title"
            className="text-[20px] md:text-[30px] leading-[1.2] font-semibold"
          >
            <div>Frequently Asked Questions</div>
          </Heading>
        </div>
        <div className="flex flex-col space-y-[15px] my-0 md:my-[30px]">
          <QuestionAnswer
            question="What's growthepie?"
            answer={
              <>
                At growthepie, our mission is to provide comprehensive and
                accurate analytics Ethereum scaling solutions, acting as a
                trusted data aggregator from reliable sources such as L2Beat and
                DefiLlama, while also developing our own metrics. Through our
                analytics interface, we aim to educate and increase
                transparency. Our goal is to be one of the go-to resources for
                those seeking to learn more about the potential of layer 2
                technologies and their impact on the future of the Ethereum
                ecosystem.
              </>
            }
          />
          <QuestionAnswer
            question="What's up with the name?"
            answer={
              <>
                We view the different layer 2 solutions for the Ethereum
                ecosystem as complementary technologies that enable more use
                cases, rather than competitors vying for market share. We
                believe that the space is a positive-sum game, where each unique
                flavor of layer 2 technology brings its own benefits to the
                table. Through collaboration and innovation, the Ethereum
                community can unlock the full potential of layer 2 solutions and
                continue to expand it&apos;s user-base and evolve in exciting
                ways.
              </>
            }
          />
          <QuestionAnswer
            question='What exactly does "Active on Multiple Chains" stand for?'
            answer={
              <>
                The &quot;multiple&quot; category denotes addresses that were
                active on multiple Layer 2 (L2) networks within a given week.
                This implies that if an address was active on different L2
                networks, such as Arbitrum and OP Mainnet, in the same week, it
                would be included in the &quot;multiple&quot; category, but not
                attributed to either Arbitrum or OP Mainnet. For a more detailed
                breakdown of active addresses on each individual chain, please
                refer to the{" "}
                <Link
                  href="https://www.growthepie.xyz/fundamentals/daily-active-addresses"
                  className="underline"
                >
                  &quot;Active addresses&quot;
                </Link>{" "}
                tab.
              </>
            }
          />
          <QuestionAnswer
            question="Why have the numbers on the landing page not been updated for a few days?"
            answer={
              <>
                The numbers in the User Base chart use a weekly aggregation. In
                order to avoid confusion we only show completed weeks and no
                partial weeks. The date that you can see in the chart is always
                the start of the week (Monday). These numbers will update every
                Monday. All other numbers on this page update daily.
              </>
            }
          />
          <QuestionAnswer
            question="L2Beat has way more Layer 2s listed why do you not cover all of them?"
            answer={
              <>
                The goal is to cover as many Layer 2s as possible. We will add
                more Layer 2s over time. For our type of analysis, we need
                access to the raw data of each L2. This makes adding new L2s
                time and resource-consuming. Our goal is to cover at least 80%
                of all Ethereum ecosystem usage.
              </>
            }
          />
          <QuestionAnswer
            question="Are the dates on this website my regional timezone or UTC?"
            answer={
              <>
                All dates on our website use UTC time. This makes it easier for
                us to aggregate data and avoid confusion when people in
                different timezones share charts.
              </>
            }
          />
          <QuestionAnswer
            question="Interested in collaborating with us?"
            answer={
              <>
                We are always looking for new collaborators. If you are
                interested in working with us, please send us a message in our{" "}
                <Link
                  href="https://discord.gg/fxjJFe7QyN"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Discord
                </Link>
                .
              </>
            }
          />
        </div>
      </Container>
      <Home />
    </>
  );
}
