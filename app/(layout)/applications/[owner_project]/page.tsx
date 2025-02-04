"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../ProjectsMetadataContext";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const projectData = ownerProjectToProjectData[owner_project];

  if (!projectData) {
    return null;
  }

  return (
    <Container>
      <div className="flex items-center h-[43px] gap-x-[8px] ">
      </div>
    </Container>
  );

  
}