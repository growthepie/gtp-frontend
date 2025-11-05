import { Metadata } from "next";
import {
  buildDatasetJsonLd,
  buildFaqJsonLd,
  canonicalUrlForMetric,
  findMetricConfig,
  nodeToString,
} from "@/lib/fundamentals/seo";
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { Title, TitleButtonLink, SectionTitle, SectionDescription } from "@/components/layout/TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Description, textToLinkedText } from "@/components/layout/TextComponents";
import { getPageMetadata } from "@/lib/metadata";
import { FundamentalsBackButton } from "./FundamentalsBackButton";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";

type Props = {
  params: { metric: string };
};


export async function generateMetadata({ params: { metric } }: Props): Promise<Metadata> {
  if (!metric) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + metric,
    });
    return notFound();
  }

  const metricConfig = findMetricConfig(metric);
  if (!metricConfig) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + metric,
    });
    return notFound();
  }

  const metadata = await getPageMetadata(`/fundamentals/${metric}`, {});
  const pageTitle = metricConfig.page?.title || metricConfig.label || metadata.title;
  const canonical = canonicalUrlForMetric(metric);
  const defaultDescription =
    "Explore key fundamentals for Ethereum L1 and L2 networks, backed by growthepie datasets.";
  const description =
    metadata.description ||
    nodeToString(metricConfig.page?.description) ||
    defaultDescription;
  const currentDate = new Date();
  // Set the time to 2 am
  currentDate.setHours(2, 0, 0, 0);
  // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  const ogImageUrl = `https://api.growthepie.com/v1/og_images/fundamentals/${metric}.png?date=${dateString}`;
  const title = metadata.title || `${pageTitle} | growthepie`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonical,
      type: "website",
      title,
      description,
      siteName: "growthepie",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 627,
          alt: `growthepie.com — ${pageTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(/</g, "\\u003c");

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { metric: string };
}) {
  const metricConfig = findMetricConfig(params.metric);
  if (!metricConfig) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + params.metric,
    });
    return notFound();
  }

  const pageData = metricConfig.page ?? {
    title: metricConfig.label ?? "",
    description: "",
    icon: "",
  };
  const pageTitle = pageData.title || metricConfig.label || "No Title";

  const faqJsonLd = buildFaqJsonLd(params.metric, metricConfig.page);
  const datasetJsonLd = buildDatasetJsonLd(params.metric, metricConfig.page);
  const jsonLdGraphs = [faqJsonLd, datasetJsonLd].filter(Boolean) as Record<
    string,
    unknown
  >[];

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      {jsonLdGraphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
      <PageContainer paddingY="none" >
        <Section>
          <div className="flex items-center gap-x-[8px]">
            <FundamentalsBackButton />
            <Title
              icon={pageData.icon as GTPIconName}
              title={pageTitle}
              button={
                params.metric === "transaction-costs" && (
                  <TitleButtonLink
                    label="Detailed Fees Overview"
                    icon="detailed-fees"
                    href="https://fees.growthepie.com/"
                    newTab
                  />
                )
              }
            />
          </div>
          <Description className="pb-[15px]">
            {textToLinkedText(pageData.description)}
          </Description>
        </Section>
      </PageContainer>
      {children}
      <PageContainer paddingY="none" className="!pt-[45px]">
        <SectionTitle
          icon={"gtp-faq"}
          title={"About this metric"}
        />
        <SectionDescription>Learn more about this metric, the methodology we apply and what it tells you.</SectionDescription>
        <QuestionAnswer
          question={`What does ${pageTitle} tell you?`}
          answer={pageData.why}
          note={
            pageData.note && (
              <div className="text-xs">
                <span className="font-semibold text-forest-200 dark:text-forest-400">
                  Note:{" "}
                </span>
                {pageData.note}
              </div>
            )
          }
          startOpen
        />
        {pageData.calculation && (
          <QuestionAnswer
            question={`How is ${pageTitle} calculated?`}
            answer={pageData.calculation}
          />
        )}
        {pageData.how_gamed && (
          <QuestionAnswer
            question={`How can ${pageTitle} be gamed?`}
            answer={pageData.how_gamed}
          />
        )}
        {pageData.interpretation && (
          <QuestionAnswer
            question={`How to interpret ${pageTitle}?`}
            answer={pageData.interpretation}
          />
        )}
      </PageContainer>
      <MetricRelatedQuickBites metricKey={params.metric} metricType="fundamentals" includePageContainer={true} />
    </PageRoot>
  );
}
