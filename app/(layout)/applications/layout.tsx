import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "./Search";
import Controls from "./Controls";
import { ApplicationsDataProvider } from "./ApplicationsDataContext";
import { ApplicationsURLs } from "@/lib/urls";
import { TimespanProvider } from "./TimespanContext";
import ReactDOM from 'react-dom';
import { MetricsProvider } from "./MetricsContext";
import { ProjectsMetadataProvider } from "./ProjectsMetadataContext";
import { SortProvider } from "./SortContext";




export default async function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { owner_project } = params;

  return (
    <ProjectsMetadataProvider>
      <TimespanProvider timespans={{
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
        };
      }}>
        <MetricsProvider>
          <SortProvider defaultOrder="desc" defaultKey="gas_fees">
          
            
            {children}
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
    </ProjectsMetadataProvider>
  )
}