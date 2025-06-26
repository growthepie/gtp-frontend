import React, { useMemo } from 'react';
import { GTPIcon } from '../GTPIcon';
import Container from '../Container';
import useSWR from 'swr';
import { EthAggURL } from '@/lib/urls';
import { EthAggResponse, CountLayer2s, Tps, Stables, Gdp, MeetL2s } from '@/types/api/EthAggResponse';
import "@/app/highcharts.axis.css";
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import "@/app/highcharts.axis.css";
import { AggChart } from './AggChart';
interface MetricsChartsProps {
  selectedBreakdownGroup: string;
}

export type ChartDataSource = Gdp | Stables | CountLayer2s | Tps | Tps['layer_2s'];

export interface SeriesConfig {
  dataExtractor: (data: ChartDataSource, showUsd: boolean) => [number, number][];
  type: 'area' | 'column';
  key: string; // Unique key for the series
  name?: string;
  stacking?: 'normal' | undefined; // Add stacking option
}

export interface AggChartProps {
  title: string;
  dataSource: ChartDataSource;
  seriesConfigs: SeriesConfig[];
  totalValueExtractor: (data: ChartDataSource, showUsd: boolean) => string;
  shareValueExtractor?: (data: ChartDataSource, showUsd: boolean) => string;
}


function MetricsChartsComponent({ selectedBreakdownGroup }: MetricsChartsProps) {
  const { data, error, isLoading } = useSWR<EthAggResponse>(EthAggURL);
  const { AllChainsByKeys } = useMaster();

  function formatNumber(number: number, decimals?: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e9) {
      if (Math.abs(number) >= 1e12) {
        return (number / 1e12).toFixed(2) + "T";
      } else if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + "B";
      }
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(decimals ? decimals : 2);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(decimals ? decimals : 2);
    } else {
      return number.toFixed(decimals ? decimals : 2);
    }

    // Default return if none of the conditions are met
    return "";
  }

  const stableData = data ? data.data.stables : null;
  const appData = data ? data.data.app_fees : null;
  const layer2Data = data ? data.data.count_layer2s : null;
  const tpsData = data ? data.data.tps : null;
  const meetL2sData = data ? data.data.meet_l2s : null;
  const maxUnix = useMemo(() => {
    if (!stableData || !appData || !layer2Data || !tpsData) return null;

    // get the max unix from the daily values of each data
    const stableDataSeries = Object.values(stableData);
    const appDataSeries = Object.values(appData);
    const layer2DataSeries = layer2Data;
    const tpsDataSeries = Object.values(tpsData);

    const maxUnix = Math.max(
      ...stableDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0)),
      ...appDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0)),
      layer2DataSeries.daily.values.reduce((max: number, value: any) => Math.max(max, value[layer2DataSeries.daily.types.indexOf("unix")]), 0),
      ...tpsDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0))
    );
    return maxUnix;
  }, [stableData, appData, layer2Data, tpsData]);

  const appRevenueTypes = (appData && appData.layer_2s && appData.layer_2s.daily && appData.layer_2s.daily.types) || [];
  const appUnixIndex = appRevenueTypes.indexOf("unix");
  const appUsdIndex = appRevenueTypes.indexOf("usd");
  const appEthIndex = appRevenueTypes.indexOf("eth");

  const appRevenueConfig: Omit<AggChartProps, 'dataSource'> = {
    title: "Application Revenue",
    seriesConfigs: [
      {
        name: "Layer 2s",
        key: "all_l2s",
        type: 'area',
        stacking: 'normal',
        dataExtractor: (data, showUsd) => (data as Gdp).layer_2s.daily.values.map(v => [v[appUnixIndex], v[showUsd ? appUsdIndex : appEthIndex]]),
        // color: ... // define color here
      },
      {
        name: "Ethereum Mainnet",
        key: "ethereum",
        type: 'area',
        stacking: 'normal',
        dataExtractor: (data, showUsd) => (data as Gdp).ethereum_mainnet.daily.values.map(v => [v[appUnixIndex], v[showUsd ? appUsdIndex : appEthIndex]]),
        // color: ... // define color here
      },
    ],
    totalValueExtractor: (data, showUsd) => {
      const d = data as Gdp;
      const key = showUsd ? appUsdIndex : appEthIndex;
      const total = d.layer_2s.daily.values.slice(-1)[0][key] + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
      return `${showUsd ? "$" : ""}${formatNumber(total)}`;
    },
    shareValueExtractor: (data, showUsd) => {
      const d = data as Gdp;
      const key = showUsd ? appUsdIndex : appEthIndex;
      const l2 = d.layer_2s.daily.values.slice(-1)[0][key];
      const total = l2 + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
      return `Layer 2 Share: ${((l2 / total) * 100).toFixed(2)}%`;
    },
  };

  const stableTypes = (stableData && stableData.layer_2s && stableData.layer_2s.daily && stableData.layer_2s.daily.types) || [];
  const stableUnixIndex = stableTypes.indexOf("unix");
  const stableUsdIndex = stableTypes.indexOf("usd");
  const stableEthIndex = stableTypes.indexOf("eth");

  const stablecoinConfig: Omit<AggChartProps, 'dataSource'> = {
    title: "Stablecoin Supply",
    seriesConfigs: [
      {
        name: "Layer 2s",
        key: "all_l2s",
        type: 'area',
        stacking: 'normal',
        dataExtractor: (data, showUsd) => (data as Stables).layer_2s.daily.values.map(v => [v[stableUnixIndex], v[showUsd ? stableUsdIndex : stableEthIndex]]),
      },
      {
        name: "Ethereum Mainnet",
        key: "ethereum",
        type: 'area',
        stacking: 'normal',
        dataExtractor: (data, showUsd) => (data as Stables).ethereum_mainnet.daily.values.map(v => [v[stableUnixIndex], v[showUsd ? stableUsdIndex : stableEthIndex]]),
      },
    ],
    totalValueExtractor: (data, showUsd) => {
      const d = data as Stables;
      const key = showUsd ? stableUsdIndex : stableEthIndex;
      const total = d.layer_2s.daily.values.slice(-1)[0][key] + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
      return `${showUsd ? "$" : ""}${formatNumber(total)}`;
    },
    shareValueExtractor: (data, showUsd) => {
      const d = data as Stables;
      const key = showUsd ? stableUsdIndex : stableEthIndex;
      const total = d.layer_2s.daily.values.slice(-1)[0][key] + d.ethereum_mainnet.daily.values.slice(-1)[0][key];
      return `Total Supply: ${formatNumber(total)}`;
    }
  };

  const countl2s = (layer2Data && layer2Data.daily && layer2Data.daily.types) || [];
  const countl2sUnixIndex = countl2s.indexOf("unix");
  const countl2CountIndex = countl2s.indexOf("value");
  const countl2LaunchedIndex = countl2s.indexOf("l2s_launched");

  const l2CountConfig: Omit<AggChartProps, 'dataSource'> = {
    title: "Layer 2s Building on Ethereum",
    seriesConfigs: [{
      name: "Total L2s",
      key: "total_l2s",
      type: 'column',
      dataExtractor: (data) => (data as CountLayer2s).daily.values.map(v => [v[countl2sUnixIndex], v[countl2CountIndex]]),
    }, {
      name: "L2s Launched",
      key: "l2s_launched",
      type: 'column',
      dataExtractor: (data) => (data as CountLayer2s).daily.values.map(v => [v[countl2sUnixIndex], v[countl2LaunchedIndex]]),

    }],
    totalValueExtractor: (data) => formatNumber((data as CountLayer2s).daily.values.slice(-1)[0][countl2CountIndex]),
  };

  const tpsTypes = (tpsData && tpsData.layer_2s && tpsData.layer_2s.daily && tpsData.layer_2s.daily.types) || [];
  const tpsUnixIndex = tpsTypes.indexOf("unix");
  const tpsValueIndex = tpsTypes.indexOf("value");

  const tpsConfig: Omit<AggChartProps, 'dataSource'> = {
    title: "Average Daily TPS",
    seriesConfigs: [
      {
        name: "Max TPS",
        key: "max_tps",
        type: 'area',
        dataExtractor: (data) => (data as Tps['layer_2s']).daily.values.map(v => [v[tpsUnixIndex], v[tpsValueIndex]]),
      }
    ],
    totalValueExtractor: (data) => {
      const d = data as Tps['layer_2s'];
      const lastValue = d.daily.values.slice(-1)[0][1];
      return formatNumber(lastValue);
    }
  };


  
  if( selectedBreakdownGroup !== "Metrics" ) return null;

  if (!stableData || !appData || !layer2Data || !tpsData || !maxUnix) return;

  return (
    <Container className='flex flex-col gap-y-[60px] mt-[60px] w-full'>
      {/* <EconCharts selectedBreakdownGroup={selectedBreakdownGroup} appData={appData} stableData={stableData} maxUnix={maxUnix} />
      <ScalingCharts selectedBreakdownGroup={selectedBreakdownGroup} layer2Data={layer2Data} tpsData={tpsData} maxUnix={maxUnix} /> */}
      <div className='flex flex-col gap-y-[15px]'>
        <div className='flex gap-x-[8px] items-center'>
          <GTPIcon icon='gtp-metrics-economics' size='lg' className='text-[#5A6462]' />
          <div className='heading-large-lg'>Economic Activity is Shifting Onchain</div>
        </div>
        <div className='pl-[45px] text-md'>Value locked and user spending are growing across the Ethereum ecosystem, with Ethereum Mainnet remaining the most trusted ledger. </div>
        <div className='flex flex-col xl:flex-row gap-[15px] w-full'>
          <AggChart dataSource={appData} {...appRevenueConfig} />
          <AggChart dataSource={stableData} {...stablecoinConfig} />
        </div>
      </div>
      <div className='flex flex-col gap-y-[15px]'>
        <div className='flex gap-x-[8px] items-center'>
          <GTPIcon icon='gtp-ecosystem-scaling' size='lg' className='text-[#5A6462]' />
          <div className='heading-large-lg'>The Ethereum Ecosystem is Scaling</div>
        </div>
        <div className='pl-[45px] text-md'>Transaction throughput is rising across Ethereum Mainnet and its growing number of Layer 2 networks.</div>
        <div className='flex flex-col xl:flex-row gap-[15px] w-full'>
          <AggChart dataSource={layer2Data} {...l2CountConfig} />
          <AggChart dataSource={tpsData.layer_2s} {...tpsConfig} />
        </div>
      </div>
      <MeetLayer2s meetL2sData={meetL2sData} selectedBreakdownGroup={selectedBreakdownGroup} />
    </Container>
  );
}

const MeetLayer2s = ({ meetL2sData, selectedBreakdownGroup }: { meetL2sData: MeetL2s | null, selectedBreakdownGroup: string }) => {
  const { AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  if (!meetL2sData) return null;

  function formatNumber(number: number, decimals?: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e9) {
      if (Math.abs(number) >= 1e12) {
        return (number / 1e12).toFixed(2) + "T";
      } else if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + "B";
      }
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(decimals ? decimals : 2);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(decimals ? decimals : 2);
    } else {
      return number.toFixed(decimals ? decimals : 2);
    }

    // Default return if none of the conditions are met
    return "";
  }

  
  if( selectedBreakdownGroup !== "Metrics" ) return null;

  return (
    <div className={`gap-y-[15px] w-full overflow-hidden ${selectedBreakdownGroup === "Metrics" ? "flex flex-col " : "hidden"}`}>
      <div className='flex gap-x-[8px] items-center'>
        <GTPIcon icon='gtp-multiple-chains' size='lg' className='' />
        <div className='heading-large-lg'>Meet L2s</div>
      </div>
      <div className='text-md pl-[44px] overflow-hidden'>Ethereum scales using different Layer 2s, built by 3rd party teams. Have a closer look at each of them.</div>
      <div className='flex w-full gap-[5px] overflow-hidden'>
        {Object.keys(meetL2sData).map((key, index) => {
          const color = AllChainsByKeys[key]?.colors["dark"][0];

          return (
            <div key={key} className='flex flex-col gap-y-[10px] rounded-[15px] p-[15px] bg-transparent border-[1px] border-[#5A6462] flex-shrink-0 w-full sm:w-[calc(50%-2.5px)] lg:w-[calc(33.333%-3.33px)] xl:w-[calc(25%-3.75px)] 2xl:w-[calc(20%-4px)]'>

              <div className='flex items-center w-full justify-between'>
                <div className='flex items-center gap-x-[5px]'>
                  <GTPIcon icon={`${AllChainsByKeys[key]?.urlKey}-logo-monochrome` as GTPIconName} size='lg'
                    style={{
                      color: color,
                    }}
                  />
                  <div className='heading-large-md'>{AllChainsByKeys[key]?.label}</div>
                </div>
                <Link href={`/chains/${key}`} className='flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#344240]'>
                  <Icon
                    icon="feather:arrow-right"
                    className="w-[15px] h-[15px]"
                  />
                </Link>
              </div>
              <div className='flex gap-x-[10px] items-center'>
                <div className='flex flex-col gap-y-[5px]'>

                  <div className='numbers-2xl'>{formatNumber(meetL2sData[key].yesterday_aa)}</div>
                  <div className='text-xs'>Wallets Yesterday</div>
                </div>
                <div className='flex flex-col gap-y-[5px]'>

                  <div className='numbers-2xl'>{formatNumber(meetL2sData[key].total_aa)}</div>
                  <div className='text-xs'>Total Wallets</div>
                </div>

              </div>
              <div className='flex gap-x-[10px] items-center'>
                <div className='flex flex-col gap-y-[5px]'>
                  <div className='numbers-2xl'>{formatNumber(meetL2sData[key][showUsd ? "stables_mcap_usd" : "stables_mcap_eth"])}</div>
                  <div className='text-xs'>Stablecoin Supply</div>
                </div>
                <div className='flex flex-col gap-y-[5px]'>
                  <div className='numbers-2xl'>{formatNumber(meetL2sData[key].tps)}</div>
                  <div className='text-xs'>TPS/Day</div>
                </div>
              </div>
              <div className='flex flex-col gap-y-[5px]'>
                <div className='flex items-center gap-x-[5px]'>
                  <GTPIcon icon='gtp-crosschain' size='sm' className='' />
                  <GTPIcon icon='gtp-defi' size='sm' className='' />
                </div>
                <div className='text-xs'>Predominately used for</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// const arePropsEqual = (
//   prevProps: Readonly<MetricsChartsProps>,
//   nextProps: Readonly<MetricsChartsProps>
// ) => {
//   // This comparison means MetricsChartsComponent will only re-evaluate 
//   // its rendering if selectedBreakdownGroup actually changes its value OR 
//   // if selectedBreakdownGroup *becomes* or *stops being* "Metrics".

//   // If it was not "Metrics" and is now "Metrics", re-render (to mount MetricsCharts properly)
//   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup === "Metrics") {
//     return false;
//   }
//   // If it was "Metrics" and is now not "Metrics", re-render (to unmount/hide MetricsCharts)
//   if (prevProps.selectedBreakdownGroup === "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
//     return false;
//   }

//   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
//     return true; // Effectively, don't care about changes if not displaying Metrics.
//   }

//   return prevProps.selectedBreakdownGroup === nextProps.selectedBreakdownGroup;
// };

// export default React.memo(MetricsChartsComponent, arePropsEqual);
export default MetricsChartsComponent;