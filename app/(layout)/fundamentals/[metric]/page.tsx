"use client";
import { useMemo, useState, useEffect, createContext, useContext, RefObject, ReactNode } from "react";
import Error from "next/error";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import {
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { navigationCategories, navigationItems } from "@/lib/navigation";
import Container, { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useMaster } from "@/contexts/MasterContext";
import { TopRowChild, TopRowContainer, TopRowParent } from "@/components/layout/TopRow";
import { metricItems } from "@/lib/metrics";
import { Timespans, getTimespans } from "@/lib/chartUtils";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Switch } from "@/components/Switch";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { MetricDataProvider, useMetricData } from "./MetricDataContext";
import { MetricChartControlsProvider, useMetricChartControls } from "./MetricChartControlsContext";
import { MetricSeriesProvider } from "./MetricSeriesContext";
import { useParams } from "next/navigation";
import MetricChart from "./MetricChart";
import MetricTable from "./MetricTable";
import { MetricBottomControls, MetricControls, MetricTopControls } from "./MetricControls";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

const Fundamentals = ({ params: { metric } }) => {
  const { is_og } = useParams();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(MetricsURLs[metric]);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating, metricValidating]}
      />
      {master && metricData ? (
        <FundamentalsContent metric={metric} type="fundamentals" />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

type FundamentalsContentProps = {
  metric: string;
  type: "fundamentals" | "data-availability";
};

const FundamentalsContent = ({ metric, type }: FundamentalsContentProps) => {
  return (
    <>
      <MetricDataProvider metric={metric} metric_type="fundamentals">
        <MetricChartControlsProvider metric_type={type}>
          <MetricSeriesProvider metric_type={type}>
            <PageContainer className="" paddingY="none">
              <MetricTopControls metric={metric} />
            </PageContainer>
            <div className="flex flex-col lg:flex-row-reverse gap-y-[15px] px-0 lg:px-[50px]">
              <div className="w-full h-[434px] lg:!w-[calc(100%-503px)] lg:h-[434px] px-[20px] md:px-[50px] lg:px-0">
                <MetricChart metric_type={type} />
              </div>
              <PageContainer className="block lg:hidden" paddingY="none">
                <MetricBottomControls metric={metric} />
              </PageContainer>
              <div className="w-full lg:!w-[503px]">
                <MetricTable metric_type={type} />
              </div>
            </div>
            <PageContainer className="hidden md:block" paddingY="none">
              <MetricBottomControls metric={metric} />
            </PageContainer>
          </MetricSeriesProvider>
        </MetricChartControlsProvider>
      </MetricDataProvider >
    </>
  );
};

export default Fundamentals;