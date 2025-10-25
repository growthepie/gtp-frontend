"use client";
import useSWR from "swr";
import { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MetricContextWrapper } from "@/components/metric/MetricContextWrapper";
import { MetricSeriesProvider } from "@/components/metric/MetricSeriesContext";
import { useParams } from "next/navigation";
import MetricChart from "@/components/metric/MetricChart";
import MetricTable from "@/components/metric/MetricTable";
import { MetricBottomControls, MetricTopControls } from "@/components/metric/MetricControls";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";
import { useChainMetrics } from "@/hooks/useChainMetrics";
import { useMaster } from "@/contexts/MasterContext";
import { useMemo, use } from "react";

const Fundamentals = ({ params }) => {
  const { metric } = use(params as Promise<{ metric: string }>);

  const { is_og } = useParams();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const { SupportedChainKeys, AllChains } = useMaster();

  // Determine which chains to fetch
  const chainsToFetch = useMemo(() => {
    return AllChains.filter((chain) =>
      SupportedChainKeys.includes(chain.key),
    ).map((chain) => chain.key);
  }, [AllChains, SupportedChainKeys]);

  // Fetch metric data at page level for SWR caching
  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
  } = useChainMetrics(metric, chainsToFetch, master!);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating]}
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
      <MetricContextWrapper metric={metric} metric_type="fundamentals">
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

          {/* Add Related Quick Bites Section */}
          <PageContainer className="" paddingY="none">
            <MetricRelatedQuickBites metricKey={metric} metricType={type} />
          </PageContainer>
        </MetricSeriesProvider>
      </MetricContextWrapper>
    </>
  );
};

export default Fundamentals;