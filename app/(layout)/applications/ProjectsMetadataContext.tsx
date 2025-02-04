"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { IS_PRODUCTION } from "@/lib/helpers";
import { ApplicationsURLs, DAMetricsURLs, DAOverviewURL, LabelsURLS, MasterURL, MetricsURLs } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ChainData, MetricData, MetricsResponse } from "@/types/api/MetricsResponse";
import { AppDatum, AppOverviewResponse, AppOverviewResponseHelper, ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import { LogLevel } from "react-virtuoso";
import useSWR, { useSWRConfig, preload} from "swr";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";



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

export const ProjectsMetadataContext = createContext<ProjectsMetadataContextType | undefined>(undefined);

export const ProjectsMetadataProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(LabelsURLS.projects);

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
      {children}
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