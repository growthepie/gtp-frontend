"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../ProjectsMetadataContext";
import { useMetrics } from "../MetricsContext";
import { useApplicationDetailsData } from "../ApplicationDetailsDataContext";
import { useTimespan } from "../TimespanContext";
import { useMaster } from "@/contexts/MasterContext";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();

  // const projectData = ownerProjectToProjectData[owner_project];

  return (
    <>
      {selectedMetrics.map((metric) => (
        <MetricSection key={metric} metric={metric} owner_project={owner_project} />
      ))}
      <Container>
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Most Active Contracts</div>
          <div className="text-xs">
            See the most active contracts within the selected timeframe (Maximum) for 1inch.
          </div>
        </div>
        
      </div>
      <div className="rounded-md bg-forest-1000/60 h-[152px] w-full"></div>
      <div className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">Similar Applications</div>
          <div className="text-xs">
            See other applications similar to 1inch sorted by their performance in terms of gas fees.
          </div>
        </div>
        
      </div>
      <div className="rounded-md bg-forest-1000/60 h-[140px] w-full"></div>
      </Container>
    </>
  );
}

const MetricSection = ({ metric, owner_project }: { metric: string; owner_project: string }) => {
  const { metricsDef } = useMetrics();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const def = metricsDef[metric];

  if (!def) {
    return null;
  }

  return (
    <>
      <Container className="pt-[30px] pb-[15px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="heading-large">{def.name} across different chains</div>
          <div className="text-xs">
            {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name} is available on multiple chains. Here you see how much usage is on each based on the respective metric.
          </div>
        </div>
      </Container>
      <Container>
      <MetricChainBreakdownBar metric={metric} />
        <div className="rounded-md bg-forest-1000/60 h-[163px] w-full"></div>
      </Container>
    </>
  );
}

const MetricChainBreakdownBar = ({ metric }: { metric: string }) => {
  const { data } = useApplicationDetailsData();
  const { selectedTimespan } = useTimespan();
  const {AllChainsByKeys} = useMaster();

  console.log("metric", metric);
  console.log("data", data);

  const metricToKey = {
    "daa": "daa",
    "gas_fees": "fees",
    "txcount": "txcount",
  };

  const metricData = data.metrics[metricToKey[metric]];

  const values = Object.values(metricData.aggregated.data).map((v) => v[metricData.aggregated.types.indexOf(selectedTimespan)]);
  const total = values.reduce((acc, v) => acc + v, 0);

  if (!metricData) {
    return null;
  }

  return (
    <div className="h-[71px]">
      <div className="flex h-[30px] rounded-[5px] overflow-hidden bg-forest-1000/60">
        {Object.entries(metricData.aggregated.data).map(([chain, values]) => (
          <div key={chain} className="transition-[width]" style={{ width: `${(values[metricData.aggregated.types.indexOf(selectedTimespan)] / total) * 100}%` , background: AllChainsByKeys[chain].colors.dark[0]}} />
        ))}
      </div>
    </div>
  );
}