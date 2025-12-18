/* eslint-disable react/no-unescaped-entities */
"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Subheading from "@/components/layout/Subheading";
import { SectionButtonLink, SectionDescription, SectionTitle, Title } from "@/components/layout/TextHeadingComponents";
import { EthereumFoundationLogo, Supporters } from "@/lib/contributors";
import Link from "next/link";
import { ExpandableCardContainer } from "@/components/layout/EthAgg/MetricsTop";
import { useEffect, useRef, useState } from "react";
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
    description: "Full inclusion in realtime, landing page and fundamental metrics pages.",
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
    description: "Categorization of your chain's onchain activity and application metrics.",
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
    description: "Granular showcasing of your unique data points, individual data analytics and more.",
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
    answer: "Yes. We co-create dashboards, labels, and metrics with partners. Tell us what you need and we will scope it together.",
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

export default function SalesPage() {
  const [expandedTiers, setExpandedTiers] = useState<string[]>([]);
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const dataTiersRef = useRef<HTMLElement | null>(null);
  const [feedbackIndex, setFeedbackIndex] = useState(0);

  const goToFeedback = (index: number) => {
    const safeIndex = (index + feedbackSlides.length) % feedbackSlides.length;
    setFeedbackIndex(safeIndex);
  };
  const scrollTiersIntoView = () => {
    if (!dataTiersRef.current) return;
    const top = dataTiersRef.current.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const scrollCardIntoViewMobile = (cardElement: HTMLElement | null) => {
    if (!cardElement) return;
    const top = cardElement.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handlePricingButtonClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollTiersIntoView();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#data-tiers") {
      // Delay to ensure layout is ready before scrolling
      requestAnimationFrame(() => {
        scrollTiersIntoView();
      });
    }
  }, []);

  const handleToggleTier = (tierName: string, isExpanded: boolean, event: MouseEvent<HTMLDivElement>) => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    setExpandedTiers((prev) => {
      if (isExpanded) {
        return prev.filter((t) => t !== tierName);
      }
      if (isMobile) {
        return [tierName];
      }
      return [...prev, tierName];
    });

    if (!isExpanded) {
      if (isMobile) {
        const cardElement = (event.target as HTMLElement).closest("[data-tier-card]") as HTMLElement | null;
        scrollCardIntoViewMobile(cardElement);
      } else {
        scrollTiersIntoView();
      }
    }
  };
  const feedbackSlides = [
    {
      logo: <EthereumFoundationLogo />,
      quote:
        "growthepie data and visualizations are used across many different sites, publishers and media. Our main focus is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem. Therefore we support everyone who helps us achieve this mission.",
      author: "Ethereum Foundation",
    },
    {
      logo: null,
      quote:
        "The dashboards make it easy to brief our partners quickly. Having consistent labels and fundamentals saves us hours each week.",
      author: "Ecosystem Contributor",
    },
    {
      logo: null,
      quote:
        "The team is fast to ship and receptive to feedback. Advanced tier access gave us the metrics we needed for our quarterly review.",
      author: "Layer 2 Team Lead",
    },
    {
      logo: null,
      quote:
        "We rely on growthepie’s contract labeling and economics breakdowns for investor updates and product planning.",
      author: "Protocol Operations",
    },
  ];

  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] pb-[15px] gap-y-[60px]">
      <section className="flex flex-col gap-y-[15px]">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-y-[15px] md:gap-x-[20px]">
          <div className="flex items-center h-[43px] gap-x-[8px]">
            <Title title="Work with us" icon="gtp-socials" as="h1" iconSize="lg" />
          </div>
          <div className="self-start md:self-center">
            <SectionButtonLink
              href="#data-tiers"
              label="See data tiers"
              shortLabel="Data tiers"
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
                className="flex items-center justify-center rounded-[18px] px-[14px] py-[16px]"
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
          Our goal is to also suit the needs of chains and more professional users. For this reason we have
          paid tiers to allow us to index and aggregate more data, and show a more complete picture of each chain and its
          part in the ecosystem. See for yourself what suits you best:
        </SectionDescription>
        {expandedTiers.length > 0 && (
          <div
            className="fixed inset-0 z-[1001] bg-black/50"
            onClick={() => {
              setExpandedTiers([]);
              setHoveredTier(null);
            }}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start gap-[10px] md:gap-[10px] relative z-[1002]">
          {tiers.map((tier) => {
            const isExpanded = expandedTiers.includes(tier.name);
            const overlayActive = expandedTiers.length > 0;
            const shouldDim = overlayActive && !isExpanded && hoveredTier !== tier.name;
            const dimClass = shouldDim ? "opacity-40" : "opacity-100";
            const card = (
              <ExpandableCardContainer
                isExpanded={isExpanded}
                onToggleExpand={(event: React.MouseEvent<HTMLDivElement>) => handleToggleTier(tier.name, isExpanded, event)}
                onCardClick={(event: React.MouseEvent<HTMLDivElement>) => handleToggleTier(tier.name, isExpanded, event)}
                className={`!border-none overflow-visible ${isExpanded ? "!z-[1002]" : "z-0"}`}
                minHeightClass="min-h-[190px]"
                fullHeight={false}
                overlayOnExpand={false}
                collapsedChevronOffset={15}
                hideInfoButton
                disableSelection
                infoSlot={
                  <div className="flex flex-col gap-y-[10px] text-xs">
                    <div className="font-semibold">{tier.name} tier</div>
                  </div>
                }
              >
                <div className={`relative flex flex-col gap-y-[15px] pb-[32px] ${isExpanded ? "" : "max-h-[140px] overflow-hidden"}`}>
                  <div className="flex items-center justify-between gap-x-[8px]">
                    <div className="heading-md">{tier.name}</div>
                    <span className="text-xs uppercase tracking-wide text-color-text-primary whitespace-nowrap">
                      {tier.status}
                    </span>
                  </div>
                  <p className="text-xs leading-snug">{tier.description}</p>
                  <ul className="flex flex-col gap-y-[10px] text-xs text-color-text-primary">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-x-[10px]">
                        <GTPIcon icon="gtp-checkmark-checked-monochrome" size="sm" className="!size-[16px]" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
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
                <div
                  key={tier.name}
                  className={`relative min-h-[190px] transition-opacity duration-200 ${dimClass}`}
                  data-tier-card
                  onMouseEnter={() => setHoveredTier(tier.name)}
                  onMouseLeave={() => setHoveredTier(null)}
                >
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
              <div
                key={tier.name}
                className={`relative min-h-[190px] transition-opacity duration-200 ${dimClass}`}
                data-tier-card
                onMouseEnter={() => setHoveredTier(tier.name)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                <div className={`${baseWrapper} ${wrapperStateClass} p-[1px] bg-color-bg-medium`}>
                  <div className="rounded-[15px] bg-color-bg-default">
                    {card}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[10px] mt-0 w-full">
          <Link
            href="https://forms.office.com/e/wWzMs6Zc3A"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-bg-medium bg-color-bg-medium px-[12px] h-[34px] text-md hover:bg-color-ui-hover transition-colors w-full col-span-1 md:col-span-2 lg:col-span-1"
          >
            <span>Request a free listing</span>
            <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
          </Link>
          <div className="rounded-full p-[1px] bg-[linear-gradient(144.58deg,#FE5468_20.78%,#FFDF27_104.18%)] w-full h-[34px] col-span-1 md:col-span-2 lg:col-span-3">
            <Link
              href="mailto:contact@growthepie.com"
              className="inline-flex items-center justify-center gap-x-[10px] rounded-full border border-color-bg-medium bg-color-bg-default px-[12px] text-md hover:bg-color-ui-hover transition-colors w-full h-full"
            >
              <span>Get in touch</span>
              <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!size-[14px]" containerClassName="!size-[14px]" />
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
        <div className="relative w-full">
          <button
            aria-label="Previous feedback"
            onClick={() => goToFeedback(feedbackIndex - 1)}
            className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-[26px] h-[26px] items-center justify-center bg-color-bg-medium hover:bg-color-ui-hover rounded-full transition-colors"
          >
            <GTPIcon icon="gtp-chevronleft-monochrome" size="sm" className="!size-[16px]" />
          </button>
          <button
            aria-label="Previous feedback"
            onClick={() => goToFeedback(feedbackIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex sm:hidden w-[26px] h-[26px] items-center justify-center bg-color-bg-medium hover:bg-color-ui-hover rounded-full transition-colors"
          >
            <GTPIcon icon="gtp-chevronleft-monochrome" size="sm" className="!size-[16px]" />
          </button>
          <button
            aria-label="Next feedback"
            onClick={() => goToFeedback(feedbackIndex + 1)}
            className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-[26px] h-[26px] items-center justify-center bg-color-bg-medium hover:bg-color-ui-hover rounded-full transition-colors"
          >
            <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!size-[16px]" />
          </button>
          <button
            aria-label="Next feedback"
            onClick={() => goToFeedback(feedbackIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex sm:hidden w-[26px] h-[26px] items-center justify-center bg-color-bg-medium hover:bg-color-ui-hover rounded-full transition-colors"
          >
            <GTPIcon icon="gtp-chevronright-monochrome" size="sm" className="!size-[16px]" />
          </button>
          <div className="overflow-hidden rounded-[15px]">
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${feedbackIndex * 100}%)` }}
            >
              {feedbackSlides.map((slide) => (
                <div key={slide.author} className="min-w-full px-[4px] sm:px-[16px]">
                  <div className="flex flex-col gap-y-[10px] px-[18px] md:px-[26px] py-[22px] md:py-[28px] text-center h-full justify-between">
                    <div className="flex justify-center">{slide.logo}</div>
                    <p className="text-md leading-normal max-w-[900px] mx-auto">
                      "{slide.quote}"
                    </p>
                    <div className="heading-sm text-color-text-secondary">{slide.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-[8px] mt-[12px]">
            {feedbackSlides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to feedback ${idx + 1}`}
                onClick={() => goToFeedback(idx)}
                className={`w-[8px] h-[8px] rounded-full transition-colors ${
                  idx === feedbackIndex ? "bg-color-text-primary" : "bg-color-bg-medium"
                }`}
              />
            ))}
          </div>
        </div>
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
