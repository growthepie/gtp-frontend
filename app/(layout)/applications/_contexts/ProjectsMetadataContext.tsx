"use client";
import { LabelsURLS } from "@/lib/urls";
import { AppDatum } from "@/types/applications/AppOverviewResponse";
import { createContext, useContext, useMemo, } from "react";
import useSWR from "swr";




function ownerProjectToProjectData(data: AppDatum[]): { [key: string]: any } {
  return data.reduce((acc, entry) => {
    const [owner, origin]: [string, string] = [entry[0] as string, entry[1] as string];
    if (!acc[owner]) acc[owner] = [];
    if (!acc[owner].includes(origin)) acc[owner].push(origin);
    return acc;
  }, {});
}

export type ProjectsMetadataContextType = {
  ownerProjectToProjectData: {
    [key: string]: {
      owner_project: string;
      display_name: string;
      description: string;
      main_github: string;
      twitter: string;
      website: string;
      logo_path: string;
      main_category: string;
    }
  };
}

type ProjectsMetadataProviderProps = {
  children: React.ReactNode;
  useFilteredProjects?: boolean;
}

export const ProjectsMetadataContext = createContext<ProjectsMetadataContextType | undefined>(undefined);

export const ProjectsMetadataProvider = ({ children, useFilteredProjects = false }: ProjectsMetadataProviderProps) => {
  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(useFilteredProjects ? LabelsURLS.projectsFiltered : LabelsURLS.projects);

  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let ownerProjectToProjectData = {};
    const typesArr = projectsData.data.types;
    projectsData.data.data.forEach((project) => {
      ownerProjectToProjectData[project[typesArr.indexOf("owner_project")]] = {
        owner_project: project[typesArr.indexOf("owner_project")],
        display_name: project[typesArr.indexOf("display_name")],
        description: project[typesArr.indexOf("description")],
        main_github: project[typesArr.indexOf("main_github")],
        twitter: project[typesArr.indexOf("twitter")],
        website: project[typesArr.indexOf("website")],
        logo_path: project[typesArr.indexOf("logo_path")],
        main_category: project[typesArr.indexOf("main_category")],
      }
    });

    return ownerProjectToProjectData;
  }, [projectsData]);

  return (
    <ProjectsMetadataContext.Provider value={{
      ownerProjectToProjectData,
    }}>
      {projectsData && children}
    </ProjectsMetadataContext.Provider>
  );
}

export const useProjectsMetadata = () => {
  const context = useContext(ProjectsMetadataContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}