"use client";
import useSWR from "swr";
import { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MetricContextWrapper } from "@/components/metric/MetricContextWrapper";
import { useParams } from "next/navigation";
import { useChainMetrics } from "@/hooks/useChainMetrics";
import { useMaster } from "@/contexts/MasterContext";
import { useMemo, use } from "react";
import GTPUniversalChart from "@/components/GTPButton/GTPUniversalChart";

const Fundamentals = ({ params }: { params: Promise<{ metric: string; chain: string }> }) => {
  const { metric, chain } = use(params);
  const { is_og } = useParams();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const { SupportedChainKeys, AllChains, DefaultChainSelection } = useMaster();

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
        <FundamentalsContent metric={metric} />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

type FundamentalsContentProps = {
  metric: string;
};

const FundamentalsContent = ({ metric }: FundamentalsContentProps) => {
  return (
    <>
      <MetricContextWrapper metric={metric} metric_type="fundamentals" defaultTimespan="max" defaultTimeInterval="daily" defaultScale="stacked" showRollingAverage={false}>
        <PageContainer className="" paddingY="none">
          <GTPUniversalChart fullBleed={false} />
        </PageContainer>
      </MetricContextWrapper>
    </>
  );
};

export default Fundamentals;
