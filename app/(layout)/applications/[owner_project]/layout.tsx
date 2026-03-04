import { Metadata } from "next";
import { ApplicationDetailsDataProvider } from "../_contexts/ApplicationDetailsDataContext";
import { ChartSyncProvider } from "../_contexts/GTPChartSyncContext";
import { getPageMetadata } from "@/lib/metadata";
import { getAllProjectsMetadata } from "@/lib/projects-metadata";


const fetchProjectName = async (owner_project: string): Promise<string> => {
  const projectsData = await getAllProjectsMetadata();
  if (!projectsData[owner_project]) {
    return owner_project;
  }
  const projectName = projectsData[owner_project].displayName;
  return projectName;
}


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

  return (
    <>
        <ApplicationDetailsDataProvider owner_project={owner_project}>
          <ChartSyncProvider>
            {children}
          </ChartSyncProvider>
        </ApplicationDetailsDataProvider>
    </>
  )
}
