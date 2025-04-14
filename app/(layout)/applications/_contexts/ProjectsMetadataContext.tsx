"use client";
import { LabelsURLS } from "@/lib/urls";
import { AppDatum } from "@/types/applications/AppOverviewResponse";
import { createContext, useCallback, useContext, useMemo, } from "react";
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
      sub_category: string;
      sub_categories: string[];
      on_apps_page: boolean;
    }
  };
  projectNameToProjectData: {
    [key: string]: {
      owner_project: string;
      display_name: string;
      description: string;
      main_github: string;
      twitter: string;
      website: string;
      logo_path: string;
      main_category: string;
      sub_category: string;
      sub_categories: string[];
      on_apps_page: boolean;
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

  const {
    data: filteredProjectsData,
    error: filteredProjectsError,
    isLoading: filteredProjectsLoading,
    isValidating: filteredProjectsValidating,
  } = useSWR<any>(!useFilteredProjects ? LabelsURLS.projectsFiltered : null);

  const ownerProjectsInAppsPage = useMemo(() => {
    if(!filteredProjectsData) return new Set<string>();
    // 
    return new Set(filteredProjectsData.data.data.map((project: any) => project[filteredProjectsData.data.types.indexOf("owner_project")]));
  }, [filteredProjectsData]);

  const createDisplayNameToProjectData = useCallback((projectsData: any) => {
    return projectsData.data.data.reduce((acc, project) => {
      acc[project[projectsData.data.types.indexOf("display_name")]] = {
        owner_project: project[projectsData.data.types.indexOf("owner_project")],
        display_name: project[projectsData.data.types.indexOf("display_name")],
        description: project[projectsData.data.types.indexOf("description")],
        main_github: project[projectsData.data.types.indexOf("main_github")],
        twitter: project[projectsData.data.types.indexOf("twitter")],
        website: project[projectsData.data.types.indexOf("website")],
        logo_path: project[projectsData.data.types.indexOf("logo_path")],
        main_category: project[projectsData.data.types.indexOf("main_category")],
        sub_category: project[projectsData.data.types.indexOf("sub_category")],
        sub_categories: project[projectsData.data.types.indexOf("sub_categories")],
        on_apps_page: !useFilteredProjects ? ownerProjectsInAppsPage.has(project[projectsData.data.types.indexOf("owner_project")]) : true,
      }
      return acc;
    }, {});
  }, [ownerProjectsInAppsPage, useFilteredProjects]);

  const createOwnerProjectToProjectData = useCallback((projectsData: any) => {
    return projectsData.data.data.reduce((acc, project) => {
      acc[project[projectsData.data.types.indexOf("owner_project")]] = {
        owner_project: project[projectsData.data.types.indexOf("owner_project")],
        display_name: project[projectsData.data.types.indexOf("display_name")],
        description: project[projectsData.data.types.indexOf("description")],
        main_github: project[projectsData.data.types.indexOf("main_github")],
        twitter: project[projectsData.data.types.indexOf("twitter")],
        website: project[projectsData.data.types.indexOf("website")],
        logo_path: project[projectsData.data.types.indexOf("logo_path")],
        main_category: project[projectsData.data.types.indexOf("main_category")],
        sub_category: project[projectsData.data.types.indexOf("sub_category")],
        sub_categories: project[projectsData.data.types.indexOf("sub_categories")],
        on_apps_page: !useFilteredProjects ? ownerProjectsInAppsPage.has(project[projectsData.data.types.indexOf("owner_project")]) : true,
      }
      return acc;
    }, {});
  }, [ownerProjectsInAppsPage, useFilteredProjects]);


  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    return createOwnerProjectToProjectData(projectsData);
  }, [projectsData, createOwnerProjectToProjectData]);

  const projectNameToProjectData = useMemo(() => {
    if (!projectsData) return {};

    const displayNameToProjectData = createDisplayNameToProjectData(projectsData);

    return displayNameToProjectData;
  }, [projectsData, createDisplayNameToProjectData]);

  return (
    <ProjectsMetadataContext.Provider value={{
      ownerProjectToProjectData,
      projectNameToProjectData,
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