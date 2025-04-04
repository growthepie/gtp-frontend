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
  console.log(projectName);
  return projectName;
}


type Props = {
  params: Promise<{ owner_project: string }>,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const owner_project = (await params).owner_project;

  // get the project name from the projects data
  const name = await fetchProjectName(owner_project) || owner_project;

  const metadata = await getPageMetadata(
    '/applications/[slug]',
    { name }
  );
  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
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