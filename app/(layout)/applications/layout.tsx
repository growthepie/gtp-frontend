import { TimespanProvider } from "./_contexts/TimespanContext";
import { MetricsProvider } from "./_contexts/MetricsContext";
import { SortProvider } from "./_contexts/SortContext";
import Container from "@/components/layout/Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import Search from "./_components/Search";
import Controls from "./_components/Controls";
import { ApplicationsDataProvider } from "./_contexts/ApplicationsDataContext";
import { PageTitleAndDescriptionAndControls } from "./_components/Components";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { serializeJsonLd } from "@/utils/json-ld";


export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    '/applications',
    {}
  );
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: metadata.canonical
      ? { canonical: metadata.canonical }
      : undefined,
    openGraph: {
      url: metadata.canonical ?? "https://www.growthepie.com/applications",
      type: "website",
      title: metadata.title,
      description: metadata.description,
      siteName: "growthepie",
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/applications-overview.png`,
          width: 1200,
          height: 627,
          alt: "growthepie.com",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [`https://api.growthepie.com/v1/og_images/applications-overview.png`],
    },
    robots,
  };
}

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const metadata = await getPageMetadata(
    "/applications",
    {}
  );
  const canonical = metadata.canonical ?? "https://www.growthepie.com/applications";
  const webPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": "https://www.growthepie.com/#website",
    },
    inLanguage: "en",
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.growthepie.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Applications",
        item: canonical,
      },
    ],
  };

  return (
      <>
      {[webPage, breadcrumbs].map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
      <TimespanProvider timespans={{
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
        };
      }}>
        <MetricsProvider>
          <SortProvider defaultOrder="desc" defaultKey="txcount">
            <ProjectsMetadataProvider>
              <ApplicationsDataProvider>
                {/* <Container className="sticky top-0 z-[10] flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot> */}
                <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot>
                  <PageTitleAndDescriptionAndControls />
                </Container>
                  {children}
              </ApplicationsDataProvider>
            </ProjectsMetadataProvider>
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
      </>
  )
}
