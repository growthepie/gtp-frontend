/* eslint-disable react/no-unescaped-entities */
"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Subheading from "@/components/layout/Subheading";
import { SectionButtonLink, SectionDescription, SectionTitle, Title } from "@/components/layout/TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { EthereumFoundationLogo, Supporters } from "@/lib/contributors";
import Link from "next/link";
import SwiperComponent from "@/components/SwiperComponent";
import { ExpandableCardContainer } from "@/components/layout/EthAgg/MetricsTop";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";

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
    features: [
      "Ecosystem page listing in a neutral color",
      "Aggregation of 2 fundamentals metrics",
      "Exposure to growthepie's community",
      "Free for rollups using the OP Stack, Arbitrum Nitro, or ZKsync Stack",
    ],
  },
  {
    name: "Basic",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: false,
    features: [
      "All in Ecosystem",
      "Support open Ethereum analytics",
      "Full landing page listing",
      "Dedicated chain overview page",
      "Listing on all feasible fundamental metrics pages",
      "Color inspired by your branding",
      "Inclusion in social posts and other content",
    ],
  },
  {
    name: "Advanced",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: true,
    features: [
      "All in Basic",
      "OLI integration & contract labeling",
      "Blockspace usage section enabled",
      "Labels page & API access",
      "Economics dashboard & metrics",
      "Application metrics",
      "More frequent updates on socials",
      "Early access to new features",
    ],
  },
  {
    name: "Strategic",
    status: "Paid",
    description: "The entry tier for all Ethereum rollups and chains being part of the ecosystem.",
    highlight: false,
    features: [
      "All in Advanced",
      "Quarterly insights calls",
      "\"Ask an analyst\"",
      "2 Quick Bites per year",
      "Alerts-as-a-service",
      "Default selection on metrics pages",
      "Permanent spot in \"Meet L2s\" section",
      "Soon: User insights",
      "Soon: Quarterly report as easy export (PDF)",
    ],
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
  const dataTiersRef = useRef<HTMLElement | null>(null);
  const scrollTiersIntoView = () => {
    if (!dataTiersRef.current) return;
    const top = dataTiersRef.current.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handlePricingButtonClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollTiersIntoView();
  };

  const handleToggleTier = (tierName: string, isExpanded: boolean) => {
    const next = isExpanded ? null : tierName;
    setExpandedTier(next);
    if (!isExpanded) {
      scrollTiersIntoView();
    }
  };
  const feedbackSlides = [
    {
      logo: <EthereumFoundationLogo />,
      quote:
        "growthepie data and visualizations are used across many different sites, publishers and media. Our main focus is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem. Therefore we support everyone who helps us achieve this mission.",
      author: "Ethereum Foundation",
    },
  ];

  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] pb-[15px] gap-y-[45px]">
      <section className="flex flex-col gap-y-[15px]">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-y-[15px] md:gap-x-[20px]">
          <div className="flex items-center h-[43px] gap-x-[8px]">
            <Title title="Work with us" icon="gtp-socials" as="h1" iconSize="lg" />
          </div>
          <div className="self-start md:self-center">
            <SectionButtonLink
              href="#data-tiers"
              label="See pricing tiers"
              shortLabel="Pricing tiers"
              onClick={handlePricingButtonClick}
            />
          </div>
        </div>
        <Subheading className="text-md leading-normal w-full text-color-text-primary">
          growthepie.com started with an initial grant from the Ethereum Foundation back in February 2023. We decided
          to build the platform as a public good, because we want everyone to have free access to transparent data and
          visualizations that everyone understands, not just the few.
        </Subheading>
      </section>

      <section className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-support" title="Trusted Partners and Community Members" as="h2" iconSize="md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px] md:gap-[10px]">
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
                  <div className="heading-sm">{partner.name}</div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="data-tiers" ref={dataTiersRef} className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-categories" title="Data Tiers"  as="h2" iconSize="md" />
        <SectionDescription className="w-full text-color-text-primary">
          Our goal is, however, to also suit the needs of chains and more professional users. For this reason we have
          paid tiers to allow us to index and aggregate more data, and show a more complete picture of each chain and its
          part in the ecosystem. See for yourself what suits you best:
        </SectionDescription>
        {expandedTier && <div className="fixed inset-0 z-[1001]" onClick={() => setExpandedTier(null)} />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start gap-[10px] md:gap-[10px]">
          {tiers.map((tier) => {
            const isExpanded = expandedTier === tier.name;
            const card = (
              <ExpandableCardContainer
                isExpanded={isExpanded}
                onToggleExpand={() => handleToggleTier(tier.name, isExpanded)}
                className={`!border-none overflow-visible ${isExpanded ? "!z-[1002]" : "z-0"}`}
                minHeightClass="min-h-[190px]"
                fullHeight={false}
                overlayOnExpand={false}
                infoSlot={
                  <div className="flex flex-col gap-y-[6px] text-xs">
                    <div className="font-semibold">{tier.name} tier</div>
                    <div className="text-color-text-secondary">Includes starter reports and tailored insights.</div>
                  </div>
                }
              >
                <div className={`relative flex flex-col gap-y-[10px] pb-[32px] ${isExpanded ? "" : "max-h-[140px] overflow-hidden"}`}>
                  <div className="flex items-center justify-between gap-x-[8px]">
                    <div className="heading-md">{tier.name}</div>
                    <span className="text-xs uppercase tracking-wide text-color-text-primary whitespace-nowrap">
                      {tier.status}
                    </span>
                  </div>
                  <p className="text-xs leading-snug">{tier.description}</p>
                  <ul className="flex flex-col gap-y-[6px] text-xs text-color-text-secondary">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-x-[6px]">
                        <GTPIcon icon="gtp-checkmark-checked" size="sm" className="!size-[16px]" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`transition-[max-height,opacity] duration-300 overflow-hidden text-xs text-color-text-secondary ${
                      isExpanded ? "max-h-[200px] opacity-100 mt-[6px]" : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="flex flex-col gap-y-[6px]">
                      {[
                        "Dedicated onboarding session",
                        "Custom alerts & reporting options",
                        "Access to future beta dashboards",
                      ].map((extra) => (
                        <li key={extra} className="flex items-center gap-x-[6px]">
                          <GTPIcon icon="gtp-checkmark-checked" size="sm" className="!size-[16px]" />
                          <span className="leading-snug">{extra}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {!isExpanded && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-b from-transparent to-color-bg-default" />
                  )}
                </div>
              </ExpandableCardContainer>
            );

            const baseWrapper = "rounded-[15px] overflow-visible";
            const wrapperStateClass = isExpanded ? "absolute left-0 right-0 top-0 z-[1002]" : "relative z-0";
            if (tier.highlight) {
              return (
                <div key={tier.name} className="relative min-h-[190px]">
                  <div
                    className={`${baseWrapper} ${wrapperStateClass} p-[1px] bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)]`}
                  >
                    <div className="rounded-[15px] bg-color-bg-default">
                      {card}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={tier.name} className="relative min-h-[190px]">
                <div className={`${baseWrapper} ${wrapperStateClass} p-[1px] bg-color-bg-medium`}>
                  <div className="rounded-[15px] bg-color-bg-default">
                    {card}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-[10px] mt-0">
          <Link
            href="https://forms.office.com/e/wWzMs6Zc3A"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-bg-medium bg-color-bg-medium px-[16px] py-[12px] heading-sm hover:bg-color-ui-hover transition-colors"
          >
            <span>Request a free listing</span>
            <GTPIcon icon={ctaArrow} size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
          </Link>
          <div className="rounded-full p-[1px] bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)]">
            <Link
              href="mailto:contact@growthepie.com"
              className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-bg-medium bg-color-bg-default px-[16px] py-[12px] heading-sm hover:bg-color-ui-hover transition-colors"
            >
              <span>Get in touch</span>
              <GTPIcon icon={ctaArrow} size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-y-[15px]">
        <SectionTitle icon="gtp-feedback" title="Feedback we receive"  as="h2" iconSize="md" />
        <SectionDescription className="w-full text-color-text-primary">
          growthepie data and visualizations are used across many different sites, publishers and media. Our main focus
          is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem.
          Therefore we support everyone who helps us achieve this mission.
        </SectionDescription>
        <SwiperComponent>
          {feedbackSlides.map((slide) => (
            <div
              key={slide.author}
              className="flex flex-col gap-y-[10px] rounded-[15px] border border-color-ui-shadow bg-color-bg-default px-[18px] md:px-[26px] py-[22px] md:py-[28px] text-center h-full justify-between"
            >
              <div className="flex justify-center">{slide.logo}</div>
              <p className="text-md leading-normal max-w-[900px] mx-auto">
                "{slide.quote}"
              </p>
              <div className="heading-sm text-color-text-secondary">{slide.author}</div>
            </div>
          ))}
        </SwiperComponent>
      </section>

      <section className="flex flex-col gap-y-[15px] mb-[20px]">
        <SectionTitle icon="gtp-faq" title="Frequently Asked Questions" as="h2" iconSize="md"  />
        <div className="flex flex-col gap-y-[10px]">
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
