"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs } from "@/lib/urls";
import { createContext, useContext } from "react";

import useSWR from "swr";



export type ApplicationDetailsDataContextType = {
  data: any
}

export const ApplicationDetailsDataContext = createContext<ApplicationDetailsDataContextType | undefined>(undefined);

type ApplicationDetailsDataProviderProps = {
  owner_project: string;
  children: React.ReactNode;
}

export const ApplicationDetailsDataProvider = ({
  children,
  owner_project,
}: ApplicationDetailsDataProviderProps ) => {
  const { 
    data: applicationDetailsData,
    isLoading: applicationDetailsLoading,
    isValidating: applicationDetailsValidating 
  } = useSWR(
    owner_project ? ApplicationsURLs.details.replace("{owner_project}", owner_project) : null,
  );

  return (
    <ApplicationDetailsDataContext.Provider value={{
      data: applicationDetailsData,
    }}>
      <ShowLoading 
        dataLoading={[applicationDetailsLoading]} 
        // dataValidating={[applicationDetailsData]} 
      />
      {children}
    </ApplicationDetailsDataContext.Provider>
  );
}

export const useApplicationDetailsData = () => {
  const context = useContext(ApplicationDetailsDataContext);
  if (context === undefined) {
    throw new Error("useApplicationDetailsData must be used within a ApplicationDetailsDataProvider");
  }
  return context;
}