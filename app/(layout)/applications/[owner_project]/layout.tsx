import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Controls from "../_components/Controls";
import { LabelsURLS } from "@/lib/urls";
import { ApplicationDisplayName, ApplicationIcon, BackButton, PageMetadata, ProjectDetailsLinks } from "../_components/Components";
import { Metadata, ResolvingMetadata } from "next";
import { ApplicationDetailsDataProvider } from "../_contexts/ApplicationDetailsDataContext";
import { SortProvider } from "../_contexts/SortContext";
import { GTPChart } from "../_components/GTPChart";
import { ChartSyncProvider } from "../_contexts/GTPChartSyncContext";

// // fetch data
// const projectsData = await fetch(LabelsURLS.projects).then((res) => res.json());
// const typesArr = projectsData.data.types;

// const ownerProjectToProjectData = projectsData.data.data.reduce((curr, project) => {
//   return {
//     ...curr,
//     [project[typesArr.indexOf("owner_project")]]: {
//       owner_project: project[typesArr.indexOf("owner_project")],
//       display_name: project[typesArr.indexOf("display_name")],
//       description: project[typesArr.indexOf("description")],
//       main_github: project[typesArr.indexOf("main_github")],
//       twitter: project[typesArr.indexOf("twitter")],
//       website: project[typesArr.indexOf("website")],
//       logo_path: project[typesArr.indexOf("logo_path")],
//       main_category: project[typesArr.indexOf("main_category")],
//     }
//   }
// }, {});

// type Props = {
//   params: Promise<{ owner_project: string }>,
// }

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   // read route params
//   const owner_project = (await params).owner_project;
  
//   return {
//     title: ownerProjectToProjectData[owner_project].display_name,
//     description: ownerProjectToProjectData[owner_project].description,
//   }
// }

export default function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { owner_project } = params;

  return (
    <>
      <PageMetadata owner_project={owner_project} />
      {/* <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]" isPageRoot>
        <div className="flex items-center h-[43px] gap-x-[8px] ">
        <BackButton />
          <ApplicationIcon owner_project={owner_project} size="lg" />
          <Heading className="heading-large-xl" as="h1">
            <ApplicationDisplayName owner_project={owner_project} />
          </Heading>
        </div>
        <div className="flex items-end gap-x-[10px]">
          <div className="flex-1 text-sm font-medium">
            { <ApplicationDescription owner_project={owner_project} /> }
            Relay is a cross-chain payment system that enables instant, low-cost bridging and transaction execution by connecting users with relayers who act on their behalf for a small fee. It aims to minimize gas costs and execution latency, making it suitable for applications like payments, bridging, NFT minting, and gas abstraction. I can add one more sentence to that and its still legible. And one more maybe so that we reach 450 characters. Let’s see. 
          </div>
          <ProjectDetailsLinks owner_project={owner_project} />
        </div>
        <Controls />
      </Container> */}
      {/* <SortProvider defaultOrder="desc" defaultKey={"gas_fees"}> */}
        <ApplicationDetailsDataProvider owner_project={owner_project}>
          <ChartSyncProvider>
            {children}
          </ChartSyncProvider>
        </ApplicationDetailsDataProvider>
      {/* </SortProvider> */}
    </>
  )
}