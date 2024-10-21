import { Metadata } from "next";
import { MetricsURLs } from "@/lib/urls";
import Container, { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { metricItems } from "@/lib/metrics";
import { Title, TitleButtonLink } from "@/components/layout/TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Description, textToLinkedText } from "@/components/layout/TextComponents";
import ReactMarkdown from "react-markdown";

type Props = {
  params: { metric: string };
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (
    !params.metric ||
    metricItems.find((item) => item.urlKey === params.metric) === undefined
  ) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + params.metric,
    });
    return notFound();
  }

  const option = metricItems.find((item) => item.urlKey === params.metric);

  if (option) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: option.page?.title,
      description: option.page?.why,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.xyz/v1/og_images/fundamentals/${params.metric}.png?date=${dateString}`,
            width: 1200,
            height: 627,
            alt: "growthepie.xyz",
          },
        ],
      },
    };
  }

  return {
    title: "Metric not found",
    description: "Metric not found",
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { metric: string };
}) {
  const url = MetricsURLs[params.metric];

  const pageData = metricItems.find((item) => item.urlKey === params.metric)
    ?.page ?? {
    title: "",
    description: "",
    icon: "",
  };



  return (
    <PageRoot className="pt-[15px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon={pageData.icon as GTPIconName}
            title={pageData.title || "No Title"}
            button={
              params.metric === "transaction-costs" && (
                <TitleButtonLink
                  label="Detailed Fees Overview"
                  icon="detailed-fees"
                  href="https://fees.growthepie.xyz/"
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
      <PageContainer paddingY="none">
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
