import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "../Search";
import Controls from "../Controls";
import { ApplicationsDataProvider } from "../ApplicationsDataContext";
import { ApplicationsURLs, LabelsURLS } from "@/lib/urls";
import ReactDOM from 'react-dom';
import { ApplicationDescription, ApplicationDisplayName, ApplicationIcon, BackButton } from "../Components";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";

  // fetch data
  const projectsData = await fetch(LabelsURLS.projects).then((res) => res.json());
  const typesArr = projectsData.data.types;

  const ownerProjectToProjectData = projectsData.data.data.reduce((curr, project) => {
    return {
      ...curr,
      [project[typesArr.indexOf("owner_project")]]: {
        owner_project: project[typesArr.indexOf("owner_project")],
        display_name: project[typesArr.indexOf("display_name")],
        description: project[typesArr.indexOf("description")],
        main_github: project[typesArr.indexOf("main_github")],
        twitter: project[typesArr.indexOf("twitter")],
        website: project[typesArr.indexOf("website")],
        logo_path: project[typesArr.indexOf("logo_path")],
        main_category: project[typesArr.indexOf("main_category")],
      }
    }
  }, {});

type Props = {
  params: Promise<{ owner_project: string }>,
}
 
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const owner_project = (await params).owner_project;
  
  return {
    title: ownerProjectToProjectData[owner_project].display_name,
    description: ownerProjectToProjectData[owner_project].description,
  }
}

export default async function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { owner_project } = params;

  return (
    <>
      <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]" isPageRoot>
        <div className="flex items-center h-[43px] gap-x-[8px] ">
        {/* <Link className="size-[36px] bg-[#344240] rounded-full flex justify-center items-center" href={`/applications/overview`}>
          <Icon icon="feather:arrow-left" className="size-[26px]  text-[#CDD8D3]" />
        </Link> */}
        <BackButton />
          <ApplicationIcon owner_project={owner_project} size="lg" />
          <Heading className="heading-large-xl" as="h1">
            <ApplicationDisplayName owner_project={owner_project} />
          </Heading>
        </div>
        <div className="text-sm">
          <ApplicationDescription owner_project={owner_project} />
        </div>
      </Container>
      {children}
    </>
  )
}