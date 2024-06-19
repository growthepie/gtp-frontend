"use client";
import { HighchartsProvider } from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <HighchartsProvider Highcharts={Highcharts}>
      {children}
    </HighchartsProvider>
  );
}
