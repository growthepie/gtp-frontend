/* eslint-disable react/no-unescaped-entities */
"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Subheading from "@/components/layout/Subheading";
import { SectionDescription, SectionTitle } from "@/components/layout/TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { EthereumFoundationLogo, Supporters } from "@/lib/contributors";
import Link from "next/link";
import SwiperComponent from "@/components/SwiperComponent";
import { ExpandableCardContainer } from "@/components/layout/EthAgg/MetricsTop";
import { useState } from "react";

const partners = [
  {
    name: "Ethereum Foundation",
    svg: EthereumFoundationLogo,
    width: 207,
    height: 66,
    url: "https://ethereum.foundation/",
  },
  ...Supporters,
];

const tiers = [
  {
    name: "Ecosystem",
    status: "Free",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: false,
    features: ["Indexing basics", "Starter dashboards", "Community support"],
  },
  {
    name: "Basic",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: false,
    features: ["Extended metrics", "Labels assistance", "Email support"],
  },
  {
    name: "Advanced",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: true,
    features: ["Deep indexing", "Custom visualizations", "Shared success reporting"],
  },
  {
    name: "Strategic",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: false,
    features: ["Priority ingestion", "Dedicated success manager", "Co-marketing"],
  },
];

const faqs = [
  {
    question: "More offers on-demand",
    answer: (
      <ul className="list-disc list-inside space-y-[6px] text-md">
        <li>Sponsored Quick Bites (custom research pages with live data)</li>
        <li>Ad space</li>
        <li>Custom reports example: “Ethereum — The World Ledger”</li>
      </ul>
    ),
  },
  {
    question: "Can I request custom features and metrics?",
    answer:
      "Yes. We co-create dashboards, labels, and metrics with partners. Tell us what you need and we will scope it together.",
  },
  {
    question: "How do listings work?",
    answer:
      "Free listings cover every chain in the ecosystem. Paid tiers unlock deeper indexing, more granular visualizations, and tailored support.",
  },
];

const ctaArrow = "feather:arrow-right" as GTPIconName;

export default function SalesPage() {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const feedbackSlides = [
    {
      logo: <EthereumFoundationLogo />,
      quote:
        "growthepie data and visualizations are used across many different sites, publishers and media. Our main focus is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem. Therefore we support everyone who helps us achieve this mission.",
      author: "Ethereum Foundation",
    },
  ];

  return (
    <Container className="mt-[45px] md:mt-[30px] flex flex-col gap-y-[45px]">
      <section className="flex flex-col gap-y-[20px]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-y-[15px] md:gap-x-[20px]">
          <Heading className="heading-large-xl leading-[110%]" as="h1">
            Work with us
          </Heading>
          <Link
            href="#data-tiers"
            className="inline-flex items-center gap-x-[10px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[14px] py-[10px] heading-small-sm hover:bg-color-ui-hover transition-colors self-start md:self-auto"
          >
            <span>See pricing tiers for listing</span>
            <GTPIcon icon={ctaArrow} size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
          </Link>
        </div>
        <Subheading className="text-md md:text-lg leading-normal max-w-[1100px] text-color-text-primary">
          growthepie.com started with an initial grant from the Ethereum Foundation back in February 2023. We decided
          to build the platform as a public good, because we want everyone to have free access to transparent data and
          visualizations that everyone understands, not just the few.
        </Subheading>
      </section>

      <section className="flex flex-col gap-y-[16px]">
        <SectionTitle icon="gtp-support" title="Trusted Partners and Community Members" />
        <SectionDescription className="text-md md:text-lg max-w-[1100px] text-color-text-primary">
          growthepie data and visualizations are used across many different sites, publishers and media. Our main focus
          is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem.
          Therefore we support everyone who helps us achieve this mission.
        </SectionDescription>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] md:gap-[16px]">
          {partners.map((partner) => {
            const Logo = partner.svg;
            return (
              <Link
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-[18px] border border-color-ui-shadow bg-color-bg-default px-[14px] py-[16px] hover:bg-color-ui-hover transition-colors"
              >
                {Logo ? (
                  <div className="flex items-center justify-center w-full">
                    <Logo />
                  </div>
                ) : (
                  <div className="heading-small-sm">{partner.name}</div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-y-[16px]">
        <SectionTitle icon="gtp-feedback" title="Feedback we receive" />
        <SectionDescription className="text-md md:text-lg max-w-[1100px] text-color-text-primary">
          growthepie data and visualizations are used across many different sites, publishers and media. Our main focus
          is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem.
          Therefore we support everyone who helps us achieve this mission.
        </SectionDescription>
        <SwiperComponent>
          {feedbackSlides.map((slide) => (
            <div
              key={slide.author}
              className="flex flex-col gap-y-[16px] rounded-[22px] border border-color-ui-shadow bg-color-bg-default px-[18px] md:px-[26px] py-[22px] md:py-[28px] text-center h-full justify-between"
            >
              <div className="flex justify-center">{slide.logo}</div>
              <p className="text-md md:text-lg leading-normal max-w-[900px] mx-auto">
                “{slide.quote}”
              </p>
              <div className="heading-small-sm text-color-text-secondary">{slide.author}</div>
            </div>
          ))}
        </SwiperComponent>
      </section>

      <section id="data-tiers" className="flex flex-col gap-y-[16px]">
        <SectionTitle icon="gtp-categories" title="Data Tiers" />
        <SectionDescription className="text-md md:text-lg max-w-[1100px] text-color-text-primary">
          Our goal is, however, to also suit the needs of chains and more professional users. For this reason we have
          paid tiers to allow us to index and aggregate more data, and show a more complete picture of each chain and its
          part in the ecosystem. See for yourself what suits you best:
        </SectionDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px] md:gap-[16px]">
          {tiers.map((tier) => {
            const isExpanded = expandedTier === tier.name;
            return (
              <ExpandableCardContainer
                key={tier.name}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpandedTier(isExpanded ? null : tier.name)}
                className={`${tier.highlight ? "border border-color-accent-yellow" : "border border-color-ui-shadow"}`}
                infoSlot={
                  <div className="flex flex-col gap-y-[6px] text-sm">
                    <div className="font-semibold">{tier.name} tier</div>
                    <div className="text-color-text-secondary">Includes starter reports and tailored insights.</div>
                  </div>
                }
              >
                <div className="flex flex-col gap-y-[10px]">
                  <div className="flex items-center justify-between">
                    <div className="heading-small-md">{tier.name}</div>
                    <span
                      className={`px-[10px] py-[6px] rounded-full border text-xxs uppercase tracking-wide ${
                        tier.status === "Free"
                          ? "border-color-text-secondary text-color-text-secondary"
                          : "border-color-accent-yellow text-color-accent-yellow"
                      }`}
                    >
                      {tier.status}
                    </span>
                  </div>
                  <p className="text-md leading-snug">{tier.description}</p>
                  <ul className="flex flex-col gap-y-[6px] text-sm text-color-text-secondary">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-x-[6px]">
                        <span className="size-[8px] rounded-full bg-color-ui-shadow inline-block" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`transition-[max-height,opacity] duration-300 overflow-hidden text-sm text-color-text-secondary ${
                      isExpanded ? "max-h-[200px] opacity-100 mt-[6px]" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col gap-y-[6px]">
                      <div>• Dedicated onboarding session</div>
                      <div>• Custom alerts & reporting options</div>
                      <div>• Access to future beta dashboards</div>
                    </div>
                  </div>
                </div>
              </ExpandableCardContainer>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-[12px] mt-[8px]">
          <Link
            href="https://forms.office.com/e/wWzMs6Zc3A"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[14px] py-[10px] heading-small-sm hover:bg-color-ui-hover transition-colors"
          >
            <span>Request a free listing</span>
            <GTPIcon icon={ctaArrow} size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
          </Link>
          <Link
            href="mailto:contact@growthepie.com"
            className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[14px] py-[10px] heading-small-sm hover:bg-color-ui-hover transition-colors"
          >
            <span>Get in touch</span>
            <GTPIcon icon={ctaArrow} size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-y-[16px] mb-[20px]">
        <SectionTitle icon="gtp-faq" title="Frequently Asked Questions" />
        <div className="flex flex-col gap-y-[12px]">
          {faqs.map((faq, index) => (
            <QuestionAnswer
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              startOpen={index === 0}
              className="bg-color-bg-default"
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
