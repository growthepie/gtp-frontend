"use client";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import useSWR from "swr";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import {
} from "@/lib/chains";
import { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MetricDataProvider, } from "@/components/metric/MetricDataContext";
import { MetricChartControlsProvider } from "@/components/metric/MetricChartControlsContext";
import { MetricSeriesProvider } from "@/components/metric/MetricSeriesContext";
import { useParams } from "next/navigation";
import MetricChart from "@/components/metric/MetricChart";
import MetricTable from "@/components/metric/MetricTable";
import { MetricBottomControls, MetricTopControls } from "@/components/metric/MetricControls";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

const DataAvailability = ({ params: { metric } }) => {
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
  } = useSWR<MetricsResponse>(DAMetricsURLs[metric]);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating, metricValidating]}
      />
      {master && metricData ? (
        <DAContent metric={metric} type="data-availability" />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

type DAContentProps = {
  metric: string;
  type: "fundamentals" | "data-availability";
};

const DAContent = ({ metric, type }: DAContentProps) => {
  return (
    <>
      <MetricDataProvider metric={metric} metric_type={type}>
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

export default DataAvailability;