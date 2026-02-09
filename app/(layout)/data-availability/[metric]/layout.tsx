import { Metadata } from "next";
import { MetricsURLs } from "@/lib/urls";
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { daMetricItems } from "@/lib/metrics";
import { SectionDescription, SectionTitle, Title, TitleButtonLink } from "@/components/layout/TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Description, textToLinkedText } from "@/components/layout/TextComponents";
import { getPageMetadata } from "@/lib/metadata";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";

type Props = {
  params: Promise<{ metric: string }>;
};


export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;

  const {
    metric
  } = params;

  // 1. Check if the metric is valid
  if (
    !metric ||
    daMetricItems.find((item) => item.urlKey === metric) === undefined
  ) {
    track("404 Error", {
      location: "404 Error",
      page: "/data-availability/" + metric,
    });
    return notFound();
  }


  // 2. Get the page metadata
  const metadata = await getPageMetadata(
    `/data-availability/${metric}`,
    {}
  );

  const currentDate = new Date();
  // Set the time to 2 am
  currentDate.setHours(2, 0, 0, 0);
  // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/data-availability/${metric}.png`,
          width: 1200,
          height: 627,
          alt: "growthepie.com",
        },
      ],
    },
  };
}

export default async function Layout(
  props: {
    children: React.ReactNode;
    params: Promise<{ metric: string }>;
  }
) {
  const { metric } = await props.params;
  const { children } = props;

  const url = MetricsURLs[metric];

  const pageData = daMetricItems.find((item) => item.urlKey === metric)
    ?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon={pageData.icon as GTPIconName}
            title={pageData.title || "No Title"}
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
          question={`What does ${pageData.title} tell you?`}
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
      </PageContainer>
      
    </PageRoot>
  );
}
