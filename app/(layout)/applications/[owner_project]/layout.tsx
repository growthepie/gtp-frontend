import { Metadata } from "next";
import { ApplicationDetailsDataProvider } from "../_contexts/ApplicationDetailsDataContext";
import { ChartSyncProvider } from "../_contexts/GTPChartSyncContext";
import { TimespanProvider } from "../_contexts/TimespanContext";
import { getPageMetadata } from "@/lib/metadata";
import { getAllProjectsMetadata } from "@/lib/projects-metadata";
import { serializeJsonLd } from "@/utils/json-ld";

type ProjectData = {
  displayName: string;
  description: string;
  mainGithub: string;
  twitter: string;
  website: string;
  logoPath: string;
  subCategory: string;
  mainCategory: string;
};

const normalizeValue = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return undefined;
  return trimmed;
};

const fetchProjectData = async (
  owner_project: string
): Promise<ProjectData | null> => {
  const projectsData = await getAllProjectsMetadata();
  return projectsData[owner_project] ?? null;
};

const fetchProjectName = async (owner_project: string): Promise<string> => {
  const projectData = await fetchProjectData(owner_project);
  return projectData?.displayName || owner_project;
};


type Props = {
  params: Promise<{ owner_project: string }>,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const owner_project = (await params).owner_project;

  // get the project name from the projects data
  const name = (await fetchProjectName(owner_project)) || owner_project;

  const metadata = await getPageMetadata(
    '/applications/[slug]',
    { name }
  );
  const canonical = `https://www.growthepie.com/applications/${owner_project}`;
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical,
    },
    openGraph: {
      url: canonical,
      type: "website",
      title: metadata.title,
      description: metadata.description,
      siteName: "growthepie",
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/applications/${owner_project}.png`,
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
      images: [`https://api.growthepie.com/v1/og_images/applications/${owner_project}.png`],
    },
    robots,
  };
}

export default async function Layout(
  props: {
    children: React.ReactNode;
    params: Promise<any>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const { owner_project } = params;

  const projectData = await fetchProjectData(owner_project);
  const projectName = projectData?.displayName || owner_project;
  const projectDescription = normalizeValue(projectData?.description);
  const projectWebsite = normalizeValue(projectData?.website);
  const projectTwitter = normalizeValue(projectData?.twitter);
  const projectGithub = normalizeValue(projectData?.mainGithub);
  const projectLogoPath = normalizeValue(projectData?.logoPath);
  const projectMainCategory = normalizeValue(projectData?.mainCategory);
  const projectSubCategory = normalizeValue(projectData?.subCategory);

  const metadata = await getPageMetadata("/applications/[slug]", {
    name: projectName,
  });

  const canonical = `https://www.growthepie.com/applications/${owner_project}`;
  const appId = `${canonical}#app`;
  const description = projectDescription || metadata.description;

  const sameAs = [
    projectWebsite,
    projectTwitter ? `https://x.com/${projectTwitter}` : undefined,
    projectGithub ? `https://github.com/${projectGithub}` : undefined,
  ].filter(Boolean) as string[];

  const applicationCategory = [
    projectMainCategory,
    projectSubCategory,
  ].filter(Boolean) as string[];

  const appEntity = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": appId,
    name: projectName,
    description,
    ...(projectWebsite ? { url: projectWebsite } : {}),
    ...(projectLogoPath
      ? { image: `https://api.growthepie.com/v1/apps/logos/${projectLogoPath}` }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(applicationCategory.length ? { applicationCategory } : {}),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": "https://www.growthepie.com/#website",
    },
    mainEntity: {
      "@id": appId,
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
        item: "https://www.growthepie.com/applications",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: projectName,
        item: canonical,
      },
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
        <TimespanProvider
          timespans={{
            "1d":   { shortLabel: "1d",   label: "1 day",    value: 1 },
            "3d":   { shortLabel: "3d",   label: "3 days",   value: 3 },
            "7d":   { shortLabel: "7d",   label: "7 days",   value: 7 },
            "30d":  { shortLabel: "30d",  label: "30 days",  value: 30 },
            "90d":  { shortLabel: "90d",  label: "90 days",  value: 90 },
            "180d": { shortLabel: "180d", label: "180 days", value: 180 },
            "365d": { shortLabel: "1y",   label: "1 year",   value: 365 },
            max:    { shortLabel: "Max",  label: "Max",      value: 0 },
          }}
          defaultTimespan="90d"
        >
          <ApplicationDetailsDataProvider owner_project={owner_project}>
            <ChartSyncProvider>
              {children}
            </ChartSyncProvider>
          </ApplicationDetailsDataProvider>
        </TimespanProvider>
    </>
  )
}
