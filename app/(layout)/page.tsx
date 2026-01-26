import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Subheading from "@/components/layout/Subheading";
import { Metadata } from "next";
import Link from "next/link";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { SectionButtonLink } from "@/components/layout/TextHeadingComponents";
import {LandingFirstHeaders, LandingSecondHeaders} from "@/components/home/LandingHeaders";
import { getPageMetadata } from "@/lib/metadata";
import QuickBitesSection from "@/components/home/QuickBitesSection"; // Import the new component
import { LinkButton } from "@/components/layout/LinkButton";
import dynamic from "next/dynamic";
const LandingSwiperItems = dynamic(() => import("@/components/layout/LandingSwiperItems"), { ssr: true });

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
          Visualizing Ethereum's Story Through Data
        </Heading>
        <div className="flex items-center gap-[10px]">
          <Subheading className="text-lg md:text-xl">
            Ethereum is more than one blockchain. It&apos;s many.
          </Subheading>
          <LinkButton href="https://ethereum.org/" icon="ethereum-logo-monochrome" iconClassName="text-chains-ethereum">
            What is Ethereum?
          </LinkButton>
        </div>
      </Container>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[30px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
          <LandingFirstHeaders />
      </Container>
      <LandingSwiperItems />
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <LandingSecondHeaders />
      </Container>
      <LandingUserBaseChart />
      {/* {!IS_PRODUCTION && ( */}
        <QuickBitesSection />
      {/* )} */}
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
          <SectionButtonLink href="/applications" label="See more Applications" shortLabel="More Apps" />
        </div>
        <Subheading className="text-md px-[5px]">
          Applications in the Ethereum ecosystem that showed the strongest growth in the past 7 days.
        </Subheading>
      </Container>
      <Container className="">
        <LandingTopContracts />
      </Container>
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
                growthepie is the open analytics platform for the Ethereum 
                ecosystem - empowering builders with actionable insights 
                to grow the pie. From Mainnet to Layer 2s and onchain applications, 
                explore open data on usage, growth, and adoption. 
              </>
            }
          />
          <QuestionAnswer
            question="What's up with the name 'growthepie'?"
            answer={
              <>
                We view Ethereum's different scaling solutions
                as complementary technologies for the ecosystem that enable more use
                cases, rather than competitors vying for market share. We
                believe that the space is a positive-sum game, where each unique
                flavor of layer 2 technology brings its own benefits to the
                table, and together {" "}
                <Link
                  href="https://en.wikipedia.org/wiki/Growing_the_pie"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  &quot;growing the pie&quot;
                </Link>{" "}
                for everyone. Hence the name
                &quot;growthepie&quot; - we&apos;re all in this together, and the pie
                is getting bigger in many different ways. Btw, our brand name is always
                one word and lowercase: growthepie.
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
                  href="https://www.growthepie.com/fundamentals/daily-active-addresses"
                  className="underline"
                >
                  &quot;Active addresses&quot;
                </Link>{" "}
                tab.
              </>
            }
          />
          <QuestionAnswer
            question="I attested contract labels via the Open Labels Initiative - when will they show on the Applications section?"
            answer={
              <>
                Thank you for attesting your contracts via <Link
                  href="https://www.openlabelsinitiative.org/"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  OLI
                </Link>!
                Your attestations are securely stored in the OLI Label Pool.
                We, as growthepie, consume labels from the OLI Label Pool and
                we apply our own verification step before we add them to our platform.
                Usually, this step takes 1 to 3 days and you should see your application
                being listed very soon. In case you have issues, please reach out via
                Discord.
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
                If you are interested in working with us, please send us a message via{" "}
                <Link
                  href="https://x.com/growthepie_eth"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  X
                </Link>
                ,{" "}
                <Link
                  href="mailto:contact@growthepie.com"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  email
                </Link>
                , or join our{" "}
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
     
    </>
  );
}
