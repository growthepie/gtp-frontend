import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { GTPIcon } from '../GTPIcon';
import Container from '../Container';
import useSWR from 'swr';
import { EthAggURL } from '@/lib/urls';
import { EthAggResponse, CountLayer2s, Tps, Stables, Gdp, MeetL2s } from '@/types/api/EthAggResponse';
import "@/app/highcharts.axis.css";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import "@/app/highcharts.axis.css";
import { AggChart } from './AggChart';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ApplicationIcon } from '@/app/(layout)/applications/_components/Components';

interface MetricsChartsProps {
  selectedBreakdownGroup: string;
}

export type ChartDataSource = Gdp | Stables | CountLayer2s | Tps | Tps['layer_2s'];

export interface SeriesConfig {
  dataExtractor: (data: ChartDataSource, showUsd: boolean) => [number, number][];
  type: 'area' | 'column';
  key: string;
  name?: string;
  stacking?: 'normal' | 'x' | undefined;
}

export interface AggChartProps {
  title: string;
  tooltipContent: string;
  prefix: string;
  dataSource: ChartDataSource;
  seriesConfigs: SeriesConfig[];
  totalValueExtractor: (data: ChartDataSource, showUsd: boolean) => string;
  shareValueExtractor?: (data: ChartDataSource, showUsd: boolean) => string;
  chartKey: string;
  onCoordinatesUpdate: (chartKey: string, coordinates: { x: number; y: number; circleY: number } | null) => void;
  allChartCoordinates: Record<string, { x: number; y: number; circleY: number } | null>;
}

// Optimized shared formatting function
const formatNumber = (number: number, decimals = 2): string => {
  if (number === 0) return "0";

  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) return (number / 1e12).toFixed(1) + "T";
  if (absNumber >= 1e9) return (number / 1e9).toFixed(1) + "B";
  if (absNumber >= 1e6) return (number / 1e6).toFixed(1) + "M";
  if (absNumber >= 1e3) return (number / 1e3).toFixed(1) + "k";
  if (absNumber >= 100) return number.toFixed(decimals);
  return number.toFixed(decimals);
};

function MetricsChartsComponent({ selectedBreakdownGroup }: MetricsChartsProps) {
  const { data, error, isLoading } = useSWR<EthAggResponse>(EthAggURL);
  const [showUsd] = useLocalStorage("showUsd", true);
  const { AllChainsByKeys } = useMaster();

  // State to store last point coordinates for each chart
  const [chartCoordinates, setChartCoordinates] = useState<Record<string, { x: number; y: number; circleY: number } | null>>({});

  // Callback to update coordinates for a specific chart
  const handleCoordinatesUpdate = useCallback((chartKey: string, coordinates: { x: number; y: number; circleY: number } | null) => {
    setChartCoordinates(prev => {
      // Only update if coordinates have actually changed
      const currentCoords = prev[chartKey];
      if (!coordinates && !currentCoords) return prev;
      if (!coordinates || !currentCoords) {
        return { ...prev, [chartKey]: coordinates };
      }
      if (
        currentCoords.x === coordinates.x &&
        currentCoords.y === coordinates.y &&
        currentCoords.circleY === coordinates.circleY
      ) {
        return prev; // No change, return same object
      }
      return { ...prev, [chartKey]: coordinates };
    });
  }, []);

  // Memoized data extraction
  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      stableData: data.data.stables,
      appData: data.data.app_fees,
      layer2Data: data.data.count_layer2s,
      tpsData: data.data.tps,
      meetL2sData: data.data.meet_l2s
    };
  }, [data]);

  // Memoized index calculations
  const dataIndices = useMemo(() => {
    if (!chartData) return null;

    const appTypes = chartData.appData?.layer_2s?.daily?.types || [];
    const stableTypes = chartData.stableData?.layer_2s?.daily?.types || [];
    const countTypes = chartData.layer2Data?.daily?.types || [];
    const tpsTypes = chartData.tpsData?.layer_2s?.daily?.types || [];

    return {
      app: {
        unix: appTypes.indexOf("unix"),
        usd: appTypes.indexOf("usd"),
        eth: appTypes.indexOf("eth")
      },
      stable: {
        unix: stableTypes.indexOf("unix"),
        usd: stableTypes.indexOf("usd"),
        eth: stableTypes.indexOf("eth")
      },
      count: {
        unix: countTypes.indexOf("unix"),
        value: countTypes.indexOf("value"),
        launched: countTypes.indexOf("l2s_launched")
      },
      tps: {
        unix: tpsTypes.indexOf("unix"),
        value: tpsTypes.indexOf("value")
      }
    };
  }, [chartData]);

  // Memoized chart configurations
  const chartConfigs = useMemo(() => {
    if (!chartData || !dataIndices) return null;

    const { app, stable, count, tps } = dataIndices;
    const prefix = showUsd ? "$" : "Ξ";

    return {
      appRevenue: {
        title: "Application Revenue",
        tooltipContent: "Application Revenue is the total revenue generated by applications built on Ethereum. Source: DefiLlama, growthepie",
        prefix,
        seriesConfigs: [
          {
            name: "Ethereum Mainnet",
            key: "ethereum",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data, showUsd) => (data as Gdp).ethereum_mainnet.daily.values.map(v => [v[app.unix], v[showUsd ? app.usd : app.eth]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
          {
            name: "Layer 2s",
            key: "all_l2s",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data, showUsd) => (data as Gdp).layer_2s.daily.values.map(v => [v[app.unix], v[showUsd ? app.usd : app.eth]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
        ],
        totalValueExtractor: (data, showUsd) => {
          const d = data as Gdp;
          const key = showUsd ? app.usd : app.eth;
          const total = d.layer_2s.daily.values.slice(-1)[0][key] + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
          return `${prefix}${formatNumber(total)}`;
        },
        shareValueExtractor: (data, showUsd) => {
          const d = data as Gdp;
          const key = showUsd ? app.usd : app.eth;
          const l2 = d.layer_2s.daily.values.slice(-1)[0][key];
          const total = l2 + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
          return `Layer 2 Share: ${((l2 / total) * 100).toFixed(2)}%`;
        },
      },
      stablecoin: {
        title: "Stablecoin Supply",
        tooltipContent: "Stablecoin supply shows the total amount of stablecoins (tokens pegged to fiat currencies) secured by chains in the Ethereum ecosystem. Source: growthepie.",
        prefix,
        seriesConfigs: [
          {
            name: "Ethereum Mainnet",
            key: "ethereum",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data, showUsd) => (data as Stables).ethereum_mainnet.daily.values.map(v => [v[stable.unix], v[showUsd ? stable.usd : stable.eth]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
          {
            name: "Layer 2s",
            key: "all_l2s",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data, showUsd) => (data as Stables).layer_2s.daily.values.map(v => [v[stable.unix], v[showUsd ? stable.usd : stable.eth]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
        ],
        totalValueExtractor: (data, showUsd) => {
          const d = data as Stables;
          const key = showUsd ? stable.usd : stable.eth;
          const total = d.layer_2s.daily.values.slice(-1)[0][key] + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
          return `${prefix}${formatNumber(total)}`;
        },
        shareValueExtractor: (data, showUsd) => {
          const d = data as Stables;
          const key = showUsd ? stable.usd : stable.eth;
          const l2 = d.layer_2s.daily.values.slice(-1)[0][key];
          const total = l2 + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
          return `Layer 2 Share: ${((l2 / total) * 100).toFixed(2)}%`;
        }
      },
      l2Count: {
        title: "# Layer 2s Live",
        tooltipContent: "Number of Layer 2s with at least $100K in Total Value Secured, according to L2BEAT. Source: L2BEAT, growthepie.",
        prefix: "",
        seriesConfigs: [
          {
            name: "Layer 2s Live",
            key: "all_l2s",
            type: 'column' as const,
            dataExtractor: ((data) => (data as CountLayer2s).daily.values.map(v => [v[count.unix], v[count.value]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
          {
            name: "L2s Launched",
            key: "l2s_launched",
            type: 'column' as const,
            dataExtractor: ((data) => (data as CountLayer2s).daily.values.map(v => [v[count.unix], v[count.launched]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          }
        ],
        totalValueExtractor: (data) => formatNumber((data as CountLayer2s).daily.values.slice(-1)[0][count.value], 0),
      },
      tps: {
        title: "Daily TPS",
        tooltipContent: "Daily average transactions-per-second (TPS) across the Ethereum ecosystem. Source: growthepie",
        prefix: "",
        seriesConfigs: [
          {
            name: "Ethereum Mainnet",
            key: "ethereum",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data) => (data as Tps).ethereum_mainnet.daily.values.map(v => [v[tps.unix], v[tps.value]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
          {
            name: "Layer 2s",
            key: "all_l2s",
            type: 'area' as const,
            stacking: 'x' as const,
            dataExtractor: ((data) => (data as Tps).layer_2s.daily.values.map(v => [v[tps.unix], v[tps.value]] as [number, number])) as (data: ChartDataSource, showUsd: boolean) => [number, number][],
          },
        ],
        totalValueExtractor: (data) => {
          const d = data as Tps;
          const total = d.layer_2s.daily.values.slice(-1)[0][tps.value] + d.ethereum_mainnet.daily.values.slice(-1)[0][tps.value];
          return formatNumber(total);
        },
        shareValueExtractor: (data) => {
          const d = data as Tps;
          const l2 = d.layer_2s.daily.values.slice(-1)[0][tps.value];
          const total = l2 + d.ethereum_mainnet.daily.values.slice(-1)[0][tps.value];
          return `Layer 2 Share: ${((l2 / total) * 100).toFixed(2)}%`;
        },
      }
    };
  }, [chartData, dataIndices, showUsd]);

  if (selectedBreakdownGroup !== "Metrics") return null;
  if (!chartData || !chartConfigs) return null;

  return (
    <Container className='flex flex-col gap-y-[60px] mt-[60px] w-full'>
      <div className='flex flex-col gap-y-[15px]'>
        <div className='flex gap-x-[8px] items-center'>
          <GTPIcon icon='gtp-metrics-economics' size='lg' className='text-[#5A6462]' />
          <div className='heading-large-lg select-auto'>Economic Activity is Shifting Onchain</div>
        </div>
        <div className='pl-[45px] text-md select-auto'>Revenue generated and value locked are growing across the Ethereum ecosystem, with Ethereum Mainnet remaining the most trusted ledger.</div>
        <div className='flex flex-col xl:flex-row gap-[15px] w-full'>
          <AggChart dataSource={chartData.appData} {...chartConfigs.appRevenue} chartKey="appRevenue" onCoordinatesUpdate={handleCoordinatesUpdate} allChartCoordinates={chartCoordinates} />
          <AggChart dataSource={chartData.stableData} {...chartConfigs.stablecoin} chartKey="stablecoin" onCoordinatesUpdate={handleCoordinatesUpdate} allChartCoordinates={chartCoordinates} />
        </div>
      </div>
      <div className='flex flex-col gap-y-[15px]'>
        <div className='flex gap-x-[8px] items-center'>
          <GTPIcon icon='gtp-ecosystem-scaling' size='lg' className='text-[#5A6462]' />
          <div className='heading-large-lg select-auto'>The Ethereum Ecosystem is Scaling</div>
        </div>
        <div className='pl-[45px] text-md select-auto'>Transaction capacity is rising across Ethereum Mainnet and its growing number of Layer 2 scaling solutions.</div>
        <div className='flex flex-col xl:flex-row gap-[15px] w-full'>
          <AggChart dataSource={chartData.layer2Data} {...chartConfigs.l2Count} chartKey="l2Count" onCoordinatesUpdate={handleCoordinatesUpdate} allChartCoordinates={chartCoordinates} />
          <AggChart dataSource={chartData.tpsData} {...chartConfigs.tps} chartKey="tps" onCoordinatesUpdate={handleCoordinatesUpdate} allChartCoordinates={chartCoordinates} />
        </div>
      </div>
      <MeetLayer2s meetL2sData={chartData.meetL2sData} selectedBreakdownGroup={selectedBreakdownGroup} />
    </Container>
  );
}

const MeetLayer2s = React.memo(({ meetL2sData, selectedBreakdownGroup }: { meetL2sData: MeetL2s | null, selectedBreakdownGroup: string }) => {
  const { AllChainsByKeys } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { ownerProjectToProjectData } = useProjectsMetadata();

  

  const l2Keys = useMemo(() => meetL2sData ? Object.keys(meetL2sData) : [], [meetL2sData]);

  const ProjectData = useMemo(() => {
    if (!ownerProjectToProjectData || !meetL2sData) return null;
    let projectData: Record<string, any> = {};
    l2Keys.forEach((key) => {
      if (meetL2sData[key]?.top_apps) {
        projectData[key] = meetL2sData[key].top_apps.map((app) => 
          ownerProjectToProjectData[app]
        ).filter(Boolean);
      }
    });
    return projectData;
  }, [l2Keys, ownerProjectToProjectData, meetL2sData]);

  



  if (!meetL2sData || selectedBreakdownGroup !== "Metrics" || !ProjectData) return null;



  return (
    <div className="flex flex-col gap-y-[15px] w-full h-full overflow-hidden">
      <div className='flex gap-x-[8px] items-center'>
        <GTPIcon icon='gtp-multiple-chains' size='lg' />
        <div className='heading-large-lg select-auto'>Meet Layer 2s</div>
      </div>
      <div className='text-md pl-[44px] overflow-hidden select-auto'>Ethereum scales using a wide set of different Layer 2s, built by 3rd party teams. Take a closer look at them on our platform. </div>
      {isMobile ? (
        <Splide 
          options={{
            perPage: 1,
            gap: '10px',
            pagination: false,
            arrows: false,
            padding: { left: '20px', right: '20px' },
            breakpoints: {
              640: {
                perPage: 1,
                gap: '10px',
              },
            },
          }}
          className='w-full h-full overflow-visible'
        >
          {l2Keys.map((key) => {
            const l2Data = meetL2sData[key];
            const chainInfo = AllChainsByKeys[key];
            const color = chainInfo?.colors?.dark?.[0];

            return (
              <SplideSlide key={key}>
                <Link href={`/chains/${key}`} className='group cursor-pointer flex flex-col gap-y-[10px] rounded-[15px] p-[15px] bg-transparent border-[1px] border-[#5A6462] flex-shrink-0 w-full mx-[1px]'>
                  <div className='flex items-center w-full justify-between'>
                    <div className='flex items-center gap-x-[5px]'>
                      <GTPIcon
                        icon={`${chainInfo?.urlKey}-logo-monochrome` as GTPIconName}
                        size='lg'
                        style={{ color }}
                      />
                      <div className='heading-large-md select-auto group-hover:underline'>{chainInfo?.label}</div>
                    </div>
                    <div className='flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#344240]'>
                      <Icon icon="feather:arrow-right" className="w-[15px] h-[15px]" />
                    </div>
                  </div>
                  <div className='flex gap-x-[10px] items-center'>
                    <div className='flex flex-col gap-y-[5px]'>
                      <div className='numbers-2xl'>{formatNumber(l2Data.yesterday_aa)}</div>
                      <div className='text-xs'>Wallets Yesterday</div>
                    </div>
                    <div className='flex flex-col gap-y-[5px]'>
                      <div className='numbers-2xl'>{formatNumber(l2Data.total_aa)}</div>
                      <div className='text-xs'>Total Wallets</div>
                    </div>
                  </div>
                  <div className='flex gap-x-[10px] items-center'>
                    <div className='flex flex-col gap-y-[5px]'>
                      <div className='numbers-2xl'>${formatNumber(l2Data[showUsd ? "stables_mcap_usd" : "stables_mcap_eth"])}</div>
                      <div className='text-xs'>Stablecoin Supply</div>
                    </div>
                    <div className='flex flex-col gap-y-[5px]'>
                      <div className='numbers-2xl'>{formatNumber(l2Data.tps)}</div>
                      <div className='text-xs'>TPS/Day</div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='flex items-center gap-x-[5px]'>
                      {ProjectData[key].length === 0 ? (
                        <div className='heading-small-xxxs bg-[#344240] rounded-full w-[24px] h-[24px] flex items-center justify-center'>N/A</div>
                      ) : (
                        ProjectData[key].map((project: any) => (
                        <GTPTooltipNew
                          size="md"
                          placement="top-start"
                          allowInteract={true}
                          trigger={
                            <Link href={`/applications/${project.owner_project}`} className='w-fit h-fit'>
                              <ApplicationIcon owner_project={project.owner_project} size='sm' />
                            </Link>
                          }
                          containerClass="flex flex-col gap-y-[10px]"
                          positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                        >
                          <TooltipBody className='pl-[20px]'>
                            {project.description}
                          </TooltipBody>
                        </GTPTooltipNew>
                        ))
                      )}
                      {/* <GTPTooltipNew
                        size="md"
                        placement="bottom-start"
                        allowInteract={true}
                        trigger={
                          <div>
                            <GTPIcon icon='gtp-crosschain' size='sm' />
                          </div>
                        }
                        containerClass="flex flex-col gap-y-[10px]"
                        positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                      >
                        <TooltipBody className='pl-[20px]'>
                          This is a tooltip
                        </TooltipBody>
                      </GTPTooltipNew>
                      <GTPTooltipNew
                        size="md"
                        placement="bottom-start"
                        allowInteract={true}
                        trigger={
                          <div>
                            <GTPIcon icon='gtp-defi' size='sm' />
                          </div>
                        }
                        containerClass="flex flex-col gap-y-[10px]"
                        positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                      >
                        <TooltipBody className='pl-[20px]'>
                          This is a tooltip
                        </TooltipBody>
                      </GTPTooltipNew> */}
                    </div>
                    <div className='text-xs'>Predominately used for</div>
                  </div>
                </Link>
              </SplideSlide>
            );
          })}
        </Splide>
      ) : (
        <div className='flex w-full gap-[5px] overflow-hidden'>
          {l2Keys.map((key) => {
            const l2Data = meetL2sData[key];
            const chainInfo = AllChainsByKeys[key];
            const color = chainInfo?.colors?.dark?.[0];

            return (
              <Link href={`/chains/${key}`} key={key} className='group cursor-pointer flex flex-col gap-y-[10px] rounded-[15px] p-[15px] bg-transparent border-[1px] border-[#5A6462] flex-shrink-0 w-full sm:w-[calc(50%-2.5px)] lg:w-[calc(33.333%-3.33px)] xl:w-[calc(25%-3.75px)] 2xl:w-[calc(20%-4px)]'>
                <div className='flex items-center w-full justify-between'>
                  <div className='flex items-center gap-x-[5px]'>
                    <GTPIcon
                      icon={`${chainInfo?.urlKey}-logo-monochrome` as GTPIconName}
                      size='lg'
                      style={{ color }}
                    />
                    <div className='heading-large-md select-auto group-hover:underline'>{chainInfo?.label}</div>
                  </div>
                  <div className='flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#344240]'>
                    <Icon icon="feather:arrow-right" className="w-[15px] h-[15px]" />
                  </div>
                </div>
                <div className='flex gap-x-[10px] items-center'>
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='numbers-2xl'>{formatNumber(l2Data.yesterday_aa)}</div>
                    <div className='text-xs'>Wallets Yesterday</div>
                  </div>
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='numbers-2xl'>{formatNumber(l2Data.total_aa)}</div>
                    <div className='text-xs'>Total Wallets</div>
                  </div>
                </div>
                <div className='flex gap-x-[10px] items-center'>
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='numbers-2xl'>${formatNumber(l2Data[showUsd ? "stables_mcap_usd" : "stables_mcap_eth"])}</div>
                    <div className='text-xs'>Stablecoin Supply</div>
                  </div>
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='numbers-2xl'>{formatNumber(l2Data.tps)}</div>
                    <div className='text-xs'>TPS/Day</div>
                  </div>
                </div>
                <div className='flex flex-col gap-y-[5px]'>
                  <div className='flex items-center gap-x-[5px] min-h-[26px]'>
                    {ProjectData[key].length === 0 ? (
                      <div className='heading-small-xxxs bg-[#344240]  rounded-full w-[24px] h-[24px] flex items-center justify-center'>
                        <div className='opacity-90'>N/A</div>
                      </div>
                    ) : (
                      ProjectData[key].map((project: any) => (
                        <GTPTooltipNew
                          size="md"
                          placement="top-start"
                          allowInteract={true}
                          trigger={
                            <Link href={`/applications/${project.owner_project}`} className='w-fit h-fit'>
                              <ApplicationIcon owner_project={project.owner_project} size='sm' />
                            </Link>
                          }
                          containerClass="flex flex-col gap-y-[10px]"
                          positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                        >
                          <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                            <div className='heading-small-xxs'>{project.display_name}</div>
                            <div className='text-xs'>{project.description}</div>
                          </TooltipBody>
                        </GTPTooltipNew>
                      ))
                    )}
                  </div>
                  <div className='text-xs'>Predominately used for</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

MeetLayer2s.displayName = 'MeetLayer2s';

export default MetricsChartsComponent;