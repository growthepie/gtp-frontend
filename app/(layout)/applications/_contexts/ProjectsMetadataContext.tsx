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
  isLoading: boolean;
  ownerProjectToProjectData: {
    [key: string]: {
      owner_project: string;
      display_name: string;
      description: string | null;
      main_github: string | null;
      twitter: string | null;
      website: string | null;
      logo_path: string | null;
      main_category: string | null;
      sub_category: string | null;
      sub_categories: string[] | null;
      on_apps_page: boolean;
    }
  };
  projectNameToProjectData: {
    [key: string]: {
      owner_project: string;
      display_name: string;
      description: string | null;
      main_github: string | null;
      twitter: string | null;
      website: string | null;
      logo_path: string | null;
      main_category: string | null;
      sub_category: string | null;
      sub_categories: string[] | null;
      on_apps_page: boolean;
    }
  };
  availableMainCategories: string[];
  filteredProjectsData: {
    types: string[];
    data: any[];
  } | null;
}

type ProjectsMetadataProviderProps = {
  children: React.ReactNode;
}

export const ProjectsMetadataContext = createContext<ProjectsMetadataContextType | undefined>(undefined);

export const ProjectsMetadataProvider = ({ children }: ProjectsMetadataProviderProps) => {
  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(LabelsURLS.projectsFiltered);

  const createDisplayNameToProjectData = useCallback((projectsData: any) => {
    return projectsData.data.data.reduce((acc: any, project: any) => {
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
        on_apps_page: true,
      }
      return acc;
    }, {});
  }, []);

  const createOwnerProjectToProjectData = useCallback((projectsData: any) => {
    return projectsData.data.data.reduce((acc: any, project: any) => {
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
        on_apps_page: true,
      }
      return acc;
    }, {});
  }, []);


  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    return createOwnerProjectToProjectData(projectsData);
  }, [projectsData, createOwnerProjectToProjectData]);

  const projectNameToProjectData = useMemo(() => {
    if (!projectsData) return {};

    const displayNameToProjectData = createDisplayNameToProjectData(projectsData);

    return displayNameToProjectData;
  }, [projectsData, createDisplayNameToProjectData]);

  const availableMainCategories = useMemo(() => {
    if (!projectsData || !projectsData.data || !projectsData.data.data) {
      return [];
    }
    const categories = new Set<string>();
    const mainCategoryIndex = projectsData.data.types.indexOf("main_category");
    if (mainCategoryIndex === -1) return [];

    projectsData.data.data.forEach((project: any[]) => {
      const category = project[mainCategoryIndex];
      if (category && typeof category === 'string') {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [projectsData]);

  return (
    <ProjectsMetadataContext.Provider value={{
      isLoading: projectsLoading,
      ownerProjectToProjectData,
      projectNameToProjectData,
      availableMainCategories,
      filteredProjectsData: projectsData ? projectsData.data : null,
    }}>
      {projectsData && children}
    </ProjectsMetadataContext.Provider>
  );
}

export const useProjectsMetadata = () => {
  const context = useContext(ProjectsMetadataContext);
  if (context === undefined) {
    throw new Error("useProjectsMetadata must be used within a ProjectsMetadataProvider");
  }
  return context;
}