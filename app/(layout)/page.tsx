import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Icon from "@/components/layout/ServerIcon";
import Subheading from "@/components/layout/Subheading";
import SwiperContainer from "@/components/layout/SwiperContainer";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import LandingSwiperItems from "@/components/layout/LandingSwiperItems";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import {LandingFirstHeaders, LandingSecondHeaders} from "@/components/home/LandingHeaders";
import { getPageMetadata } from "@/lib/metadata";
import QuickDivesSection from "@/components/home/QuickDivesSection"; // Import the new component

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/",
    {}
  );
  return metadata;
}

export default async function Page() {
  return (
    <>
      <Container className="flex flex-col flex-1 w-full pt-[65px] md:pt-[30px] gap-y-[10px]">
        <Heading
          className="heading-large-xl max-w-[900px]"
          as="h1"
        >
          Understand every slice of Ethereum
        </Heading>
        <div className="flex items-center gap-[10px]">
          <Subheading className="text-lg md:text-xl">
            Ethereum is more than one blockchain. It&apos;s many.
          </Subheading>
          <a className="flex p-[3px] bg-[#344240] rounded-full items-center gap-x-[2px] md:gap-x-[4px] relative top-[1px]" href="https://ethereum.org/" target="_blank">
              <GTPIcon icon={"ethereum-logo-monochrome"} size="sm" className="" />
              <div className="text-xxs md:text-xs text-nowrap">What is Ethereum?</div>
              <Icon icon="feather:arrow-right" className="w-[9px] h-[9px]" />
          </a>
        </div>
      </Container>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[30px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
          <LandingFirstHeaders />
      </Container>
      <SwiperContainer ariaId={"layer-2-traction-title"} size="landing">
        <LandingSwiperItems />
      </SwiperContainer>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <LandingSecondHeaders />
      </Container>
      <LandingUserBaseChart />
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
            <GTPIcon
              icon="gtp-project"
              size="lg"
            />
            <Heading
              id="layer-2-traction-title"
              className="heading-large-lg"
            >
              Top Applications
            </Heading>
          </div>
          <SectionButtonLink href="/applications" label="See more applications" shortLabel="More apps" />
        </div>
        <Subheading className="text-md px-[5px] lg:px-[45px]">
          Top 6 gainers and loosers across Layer 2s based on transaction count in the last 7 days.
        </Subheading>
      </Container>
      <Container className="">
        <LandingTopContracts />
      </Container>
      <QuickDivesSection />
      <Container>
        <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
          <GTPIcon
            icon="gtp-faq"
            size="lg"
          />
          <Heading
            id="layer-2-traction-title"
            className="heading-large-lg"
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
                accurate analytics for the Ethereum ecosystem. Through our
                analytics interface, we aim to educate and increase
                transparency. Our goal is to be one of the go-to resources for
                those seeking to learn more about Ethereum Mainnet, Layer 2s,
                and their impact on the future of the Ethereum ecosystem.
              </>
            }
          />
          <QuestionAnswer
            question="What's up with the name?"
            answer={
              <>
                We view the different scaling solutions for the Ethereum
                ecosystem as complementary technologies that enable more use
                cases, rather than competitors vying for market share. We
                believe that the space is a positive-sum game, where each unique
                flavor of layer 2 technology brings its own benefits to the
                table. Through collaboration and innovation, the Ethereum
                community can unlock the full potential and
                continue to expand it&apos;s user-base and evolve in exciting
                ways.
              </>
            }
          />
          <QuestionAnswer
            question="What's the difference between Ethereum Mainnet and the Ethereum ecosystem?"
            answer={
              <>
                Ethereum Mainnet, also called Ethereum L1, is the Ethereum blockchain
                that launched in 2015. The Ethereum ecosystem, however, includes many
                blockchains that are built on top of Ethereum Mainnet (Layer 2s). These
                blockchains settle to Ethereum Mainnet and therefore can benefit from
                some of its security guarantees. Not all of these chains necessarily run
                the EVM (Ethereum Virtual Machine) - Layer 2s can also use other VMs 
                (i.e. CairoVM, SVM, FuelVM, etc.). The VM doesn't define the Ethereum 
                ecosystem - settling to Ethereum Mainnet defines it.
              </>
            }
          />
          <QuestionAnswer
            question='What exactly does "Active on Multiple Chains" stand for?'
            answer={
              <>
                The &quot;multiple&quot; category denotes addresses that were
                active on multiple networks (Ethereum Mainnet OR Layer 2) within a given week.
                This implies that if an address was active on different networks,
                such as Arbitrum and OP Mainnet, in the same week, it would
                be included in the &quot;multiple&quot; category. For a more detailed
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
                The numbers in the Weekly Engagement chart use a weekly aggregation. In
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
