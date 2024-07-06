"use client";
import { HighchartsProvider } from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";
import { DuckDBProvider } from "./DuckDBContext";
import { ProjectDataProvider } from "./useProjectData";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    // <HighchartsProvider Highcharts={Highcharts}>
    <DuckDBProvider
      parquetFiles={[
        "https://api.growthepie.xyz/v1/labels/full.parquet",
        "https://api.growthepie.xyz/v1/labels/projects.parquet",
        "https://api.growthepie.xyz/v1/labels/sparkline.parquet",
      ]}
    >
      <ProjectDataProvider>{children}</ProjectDataProvider>
    </DuckDBProvider>
    // </HighchartsProvider>
  );
}
