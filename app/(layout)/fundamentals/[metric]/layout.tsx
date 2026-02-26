import { Metadata } from "next";
import {
  buildAboutThings,
  buildDatasetJsonLd,
  buildDefinedTermSet,
  buildFaqJsonLd,
  buildKeywords,
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
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { cache } from "react";

type Props = {
  params: Promise<{ metric: string }>;
};

const fetchMasterData = cache(async (): Promise<MasterResponse> => {
  const response = await fetch(MasterURL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load master data for fundamentals: ${response.status}`);
  }

  return response.json();
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { metric } = await props.params;

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

  const [metadata, master] = await Promise.all([
    getPageMetadata(`/fundamentals/${metric}`, {}),
    fetchMasterData(),
  ]);
  const pageTitle = metricConfig.page?.title || metricConfig.label || metadata.title;
  const canonical = metadata.canonical ?? canonicalUrlForMetric(metric);
  const defaultDescription =
    "Explore key fundamentals for Ethereum L1 and L2 networks, backed by growthepie datasets.";
  const description =
    metadata.description ||
    nodeToString(metricConfig.page?.description) ||
    defaultDescription;
  const keywords = buildKeywords(metricConfig);
  const lastUpdated = master.last_updated_utc
    ? new Date(master.last_updated_utc).toISOString()
    : new Date().toISOString();
  const currentDate = new Date();
  // Set the time to 2 am
  currentDate.setHours(2, 0, 0, 0);
  // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  const ogImageUrl = `https://api.growthepie.com/v1/og_images/fundamentals/${metric}.png`;
  const title = metadata.title || `${pageTitle} | growthepie`;

  return {
    title,
    description,
    keywords,
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
    other: {
      "last-modified": lastUpdated,
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
  params: Promise<{ metric: string }>;
}) {
const { metric } = await params;
  const metricConfig = findMetricConfig(metric);
  if (!metricConfig) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + metric,
    });
    return notFound();
  }

  const pageData = metricConfig.page ?? {
    title: metricConfig.label ?? "",
    description: "",
    icon: "",
  };
  const pageTitle = pageData.title || metricConfig.label || "No Title";
  const metadata = await getPageMetadata(`/fundamentals/${metric}`, {});
  const master = await fetchMasterData();
  const keywords = buildKeywords(metricConfig);
  const aboutThings = buildAboutThings(metricConfig);
  const lastUpdated = master.last_updated_utc
    ? new Date(master.last_updated_utc).toISOString()
    : new Date().toISOString();

  const faqJsonLd = buildFaqJsonLd(metric, metricConfig.page);
  const datasetJsonLd = buildDatasetJsonLd(metric, metricConfig.page, {
    description: metadata.description,
    keywords,
    about: aboutThings,
    dateModified: lastUpdated,
  });
  const definedTermSetJsonLd = buildDefinedTermSet(metric, metricConfig.page);
  const jsonLdGraphs = [datasetJsonLd, faqJsonLd, definedTermSetJsonLd].filter(Boolean) as Record<
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
                metric === "transaction-costs" && (
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
          <Description>
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
      <MetricRelatedQuickBites metricKey={metric} metricType="fundamentals" includePageContainer={true} />
    </PageRoot>
  );
}
