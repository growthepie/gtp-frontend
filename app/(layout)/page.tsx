import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import Icon from "@/components/layout/ServerIcon";
// import ShowLoading from "@/components/layout/ShowLoading";
import Subheading from "@/components/layout/Subheading";
import SwiperContainer from "@/components/layout/SwiperContainer";
import { Metadata } from "next";
import Image from "next/image";
// import { LandingURL } from "@/lib/urls";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:
      "Growing Ethereum’s Ecosystem Together - Layer 2 User Base - growthepie",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  };
}

export default async function Page() {
  return (
    <>
      <Container className="flex flex-col flex-1 w-full mt-[65px] md:mt-[70px] gap-y-[10px]">
        <Heading
          className="font-bold leading-[1.2] text-[24px] sm:text-[32px] md:text-[36px] max-w-[900px]"
          as="h1"
        >
          Watching Restaking Platforms
        </Heading>
        <Subheading className="text-xs sm:text-sm md:text-[20px] font-semibold leading-[1.2]">
          Your Gateway to Curated Analytics and Knowledge
        </Subheading>
      </Container>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[30px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <Icon
            icon="gtp:fundamentals"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="layer-2-traction-title"
            className="text-[20px] md:text-[30px] leading-[1.2] font-semibold"
          >
            Restaking Traction
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
          <div>
            Aggregated daily metrics across all tracked Restaking platforms.
          </div>
        </Subheading>
      </Container>
      <Container className="!px-0 fade-edge-div pb-[24px] -mb-[24px]">
        <SwiperContainer ariaId={"layer-2-traction-title"} />
        {/* TODO: ELIMINAR ESTOS COMENTARIOS */}
        {/* <div className="h-[145px] md:h-[183px] w-full">
          <ShowLoading section />
        </div> */}
      </Container>
      <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <Icon
            icon="gtp:gtp-pie"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-[1.2] font-semibold">
            Daily restaking engagement
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
          Number of distinct restakers interacting with one or multiple
          restaking platforms
        </Subheading>
      </Container>
      Dorime
      <LandingUserBaseChart />
      {/* TODO: ELIMINAR ESTOS COMENTARIOS */}
      {/**Blockspace */}
      {/* <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
        <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
          <Icon
            icon="gtp:package"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="layer-2-traction-title"
            className="text-[20px] md:text-[30px] leading-[1.2] font-semibold"
          >
            Blockspace
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug px-[5px] lg:px-[45px]">
          <div>Top 6 gas-consuming contracts across all tracked Layer 2s.</div>
        </Subheading>
      </Container> */}
      {/**Top contracts */}
      {/* <Container className="">
        <LandingTopContracts />
      </Container> */}
      <Container>
        <div className="flex gap-x-0 md:gap-x-12 w-full ml-0 mt-[30px] md:mt-[60px]">
          <div className="flex flex-col md:w-1/2 lg:w-2/3 ">
            <div className="flex items-center mb-[15px] md:mb-[15px] gap-x-[8px] py-[10px] md:py-0 ">
              <Icon
                icon="gtp:gtp-about"
                className="w-[30px] h-[30px] md:w-9 md:h-9"
              />
              <Heading
                id="layer-2-traction-title"
                className="text-[20px] md:text-[30px] leading-[1.2] font-semibold"
              >
                About Restake Watch
              </Heading>
            </div>
            <div className="block md:hidden relative mt-[0px] lg:mt-[15px] mb-[30px] lg:-mb-[30px] h-[190px]">
              <Image
                src="/GTP-Data-Kraken.png"
                fill={true}
                alt="About growthepie"
                className="object-contain"
                sizes="25vw"
              />
            </div>
            <div className="text-base md:text-sm lg:text-base">
              <p className="mb-2">
                This website is based on the open-source websites of
                growthepie.xyz and l2beat.com, and we thank them dearly for
                inspiring the Restake Watch concept. Restake Watch is a public
                goods organization, soon to be a company, dedicated to providing
                transparency to the restaking ecosystem.
              </p>
              <p className="mb-2">
                We aim to serve as an impartial and autonomous watchdog, always
                acting in the best interest of users and the broader ecosystem.
                Our commitment is to remain genuinely neutral and grounded in
                reality and facts.
              </p>
              <p>
                We receive generous funding from the Ethereum Foundation
                Ecosystem Support Grants. Additionally, we are actively seeking
                further funding and donoations to enhance our monitoring
                capabilities and continue advancing the ecosystem.
              </p>
            </div>
          </div>
          {/* TODO: ELIMINAR ESTOS COMENTARIOS */}
          {/* <div className="hidden md:flex md:flex-1 relative mt-[5px] lg:mt-[15px] -mb-[10px] lg:-mb-[30px]">
            <Image
              src="/GTP-Data-Kraken.png"
              fill={true}
              alt="About growthepie"
              className="object-contain"
              sizes="25vw"
            />
          </div> */}
        </div>
        {/* TODO: ELIMINAR ESTOS COMENTARIOS */}
        {/**Preguntas frecuentes */}
        {/* <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
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
        </div> */}
        {/* <div className="flex flex-col space-y-[15px] my-0 md:my-[30px]">
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
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
        </div> */}
      </Container>
      <Home />
    </>
  );
}
