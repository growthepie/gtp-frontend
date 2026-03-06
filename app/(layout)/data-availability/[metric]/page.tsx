"use client";
import { use } from "react";
import useSWR from "swr";
import { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MetricContextWrapper } from "@/components/metric/MetricContextWrapper";
import { useParams } from "next/navigation";
import { useChainMetrics } from "@/hooks/useChainMetrics";
import GTPUniversalChart from "@/components/GTPButton/GTPUniversalChart";

const DataAvailability = (props: { params: Promise<{ metric: string }> }) => {
  const { metric } = use(props.params);

  const { is_og } = useParams();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  // Fetch metric data at page level for SWR caching
  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useChainMetrics(metric, [], master!, "data-availability");
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
      <MetricContextWrapper metric={metric} metric_type={type}>
        <PageContainer className="" paddingY="none">
          <GTPUniversalChart fullBleed={false} />
        </PageContainer>
      </MetricContextWrapper>
    </>
  );
};

export default DataAvailability;
