import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";
import { getAllProjectsMetadata } from "@/lib/projects-metadata";
import { serializeJsonLd } from "@/utils/json-ld";
import { TimespanProvider } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { MetricsProvider } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { SortProvider } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationDetailsDataProvider } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ChartSyncProvider } from "@/app/(layout)/applications/_contexts/GTPChartSyncContext";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";

const fetchProjectData = async (app: string) => {
  const projectsData = await getAllProjectsMetadata();
  return projectsData[app] ?? null;
};

type Props = {
  params: Promise<{ app: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const app = (await params).app;

  const projectData = await fetchProjectData(app);
  const name = projectData?.displayName || app;

  const metadata = await getPageMetadata("/applications/[slug]", { name });
  const canonical = `https://www.growthepie.com/new-apps/${app}`;
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      type: "website",
      title: metadata.title,
      description: metadata.description,
      siteName: "growthepie",
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/applications/${app}.png`,
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
      images: [`https://api.growthepie.com/v1/og_images/applications/${app}.png`],
    },
    robots,
  };
}

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ app: string }>;
}) {
  const { app } = await props.params;

  const projectData = await fetchProjectData(app);
  const projectName = projectData?.displayName || app;
  const canonical = `https://www.growthepie.com/new-apps/${app}`;
  const appId = `${canonical}#app`;

  const metadata = await getPageMetadata("/applications/[slug]", { name: projectName });

  const appEntity = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": appId,
    name: projectName,
    description: projectData?.description || metadata.description,
    ...(projectData?.website ? { url: projectData.website } : {}),
    ...(projectData?.logoPath
      ? { image: `https://api.growthepie.com/v1/apps/logos/${projectData.logoPath}` }
      : {}),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: { "@id": "https://www.growthepie.com/#website" },
    mainEntity: { "@id": appId },
    inLanguage: "en",
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.growthepie.com/" },
      { "@type": "ListItem", position: 2, name: "Applications", item: "https://www.growthepie.com/new-apps" },
      { "@type": "ListItem", position: 3, name: projectName, item: canonical },
    ],
  };

  return (
    <>
      {[webPage, breadcrumbs, appEntity].map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
      <TimespanProvider timespans={{
        "1d":   { shortLabel: "1d",  label: "1 day",   value: 1 },
        "3d":   { shortLabel: "3d",  label: "3 days",  value: 3 },
        "7d":   { shortLabel: "7d",  label: "7 days",  value: 7 },
        "30d":  { shortLabel: "30d", label: "30 days", value: 30 },
        "90d":  { shortLabel: "90d", label: "90 days", value: 90 },
        "180d": { shortLabel: "180d", label: "180 days", value: 180 },
        "365d": { shortLabel: "1y",  label: "1 year",  value: 365 },
        
        max:    { shortLabel: "Max", label: "Max",     value: 0 },
      }}
      
      defaultTimespan="90d"
      >
        <MetricsProvider>
          <SortProvider defaultOrder="desc" defaultKey="txcount">
            <ProjectsMetadataProvider>
              <ApplicationDetailsDataProvider owner_project={app}>
                <ChartSyncProvider>
                  {props.children}
                </ChartSyncProvider>
              </ApplicationDetailsDataProvider>
            </ProjectsMetadataProvider>
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
    </>
  );
}
