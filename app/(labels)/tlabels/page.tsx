"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { LabelsURLS, MasterURL, LabelsParquetURLS } from '@/lib/urls';
import { useDuckDb, useDuckDbQuery } from 'duckdb-wasm-kit';
import { runQuery } from "duckdb-wasm-kit";
import { useSessionStorage } from 'usehooks-ts';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Icon } from '@iconify/react';
import LabelsHorizontalScrollContainer from '@/components/LabelsHorizontalScrollContainer';
import ShowLoading from '@/components/layout/ShowLoading';
import LabelsContainer from '@/components/layout/LabelsContainer';
import Link from 'next/link';
import { DownloadIcon, HomeIcon, NotificationIcon, SettingsIcon } from '../labels/Header';
import EthUsdSwitch from '@/components/layout/EthUsdSwitch';
import HeaderLinks from '@/components/layout/HeaderLinks';
import Image from 'next/image';
import Footer from '../labels/Footer';
import { MasterResponse } from '@/types/api/MasterResponse';
import { AllChainsByKeys } from '@/lib/chains';
import { AddIcon, Badge, RemoveIcon } from "../labels/Search";
import CanvasSparkline, { CanvasSparklineProvider, useCanvasSparkline } from '../labels/CanvasSparkline';
import { insertParquetFromURL } from '@/lib/react-duckdb/insertParquet';
import { formatNumber } from "@/lib/chartUtils";

const sparklineMetricKeys = ["txcount", "gas_fees", "active_addresses"];

export default function LabelsPage() {
  const { db, loading, error } = useDuckDb();

  const [isDataSynced, setIsDataSynced] = useState(false);

  const {
    data: fullLabelsData,
    error: fullLabelsError,
    isLoading: fullLabelsLoading,
    isValidating: fullLabelsValidating,
  } = useSWR<LabelsResponse>(LabelsURLS.full);


  useEffect(() => {
    if (isDataSynced || !fullLabelsData || !db) {
      return;
    }


    const syncData = async () => {
      console.log('Syncing data...');
      try {
        const labelsData = fullLabelsData.data.data;

        if (!labelsData) {
          console.error('No data to sync');
          return;
        }

        console.log('Syncing data:', labelsData);

        // // ... or column-major format
        // const jsonColContent = {
        //   "col1": [1, 2],
        //   "col2": ["foo", "bar"]
        // };

        // transform to columnar format
        // const labelsDataColumnar = {
        //   "address": labelsData.map(row => row[0]),
        //   "origin_key": labelsData.map(row => row[1]),
        //   "name": labelsData.map(row => row[2]),
        //   "owner_project": labelsData.map(row => row[3]),
        //   "usage_category": labelsData.map(row => row[4]),
        //   "txcount": labelsData.map(row => row[5]),
        //   "txcount_change": labelsData.map(row => row[6]),
        //   "gas_fees_usd": labelsData.map(row => row[7]),
        //   "gas_fees_usd_change": labelsData.map(row => row[8]),
        //   "daa": labelsData.map(row => row[9]),
        //   "daa_change": labelsData.map(row => row[10]),
        // };



        // // Drop the table if it already exists
        // await runQuery(db, 'DROP TABLE IF EXISTS labels;');


        // // Insert the data
        // await db.registerFileText('labels.json', JSON.stringify(labelsDataColumnar));
        // const conn = await db.connect();


        // await conn.insertJSONFromPath('labels.json', { name: 'labels' });
        await insertParquetFromURL(db, LabelsParquetURLS.quick, 'labels');


        console.log('Data synced successfully');
        setIsDataSynced(true);
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    };

    syncData();

  }, [db, fullLabelsData, isDataSynced]);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);




  return (
    <>
      <ShowLoading dataLoading={[loading]} />
      {master && (
        <div className="fixed flex flex-col w-full z-50 items-center">
          <div className="absolute h-[170px] w-full overflow-clip">
            <div className="background-container !h-screen" style={{ backgroundPosition: "top", maskImage: `linear-gradient(to bottom, white 0, white 150px, transparent 170px`, }}>
              <div className="background-gradient-group">
                <div className="background-gradient-yellow"></div>
                <div className="background-gradient-green"></div>
              </div>
            </div>
          </div>

          <header className="flex justify-between space-x-0 xl:space-x-6 items-end w-full mx-auto px-[20px] pt-[20px] md:px-[60px] md:pt-[30px] ">
            <div className="flex justify-start items-center w-full">
              <div className="flex space-x-0 xl:space-x-6 w-full h-full">


                <div className="flex justify-between items-start h-full relative w-full left-1 ">
                  <Link href="/" className="flex gap-x-1">
                    <Image
                      src="/logo_labels_full.png"
                      alt="Forest"
                      className="hidden dark:block"
                      width={206}
                      height={45}
                      sizes="100vw"
                    />

                  </Link>
                </div>
              </div>
            </div>
            <div className="items-center z-10 hidden md:flex md:space-x-[34px] h-full mt-[7px]">
              <EthUsdSwitch />

              <div className="flex space-x-[22px] pr-2.5 items-center">
                <HeaderLinks />
              </div>
            </div>
          </header>
          {isDataSynced && (
            <div className="flex flex-col gap-y-2 absolute top-[90px] inset-[80px] text-xs">
              <OriginKeysFilter />
              <AddressFilter />
            </div>
          )}

        </div>
      )}


      <div className="relative pb-[114px] pt-[140px]">
        <LabelsContainer className="w-full pt-[30px] flex items-end sm:items-center justify-between md:justify-start gap-x-[10px] z-[21]">
          <h1 className="text-[20px] md:text-[30px] pl-[15px] leading-[120%] font-bold z-[19]">
            Latest contracts on Ethereum Layer 2s
          </h1>
        </LabelsContainer>
        <div className={`sticky pl-[60px] pr-[60px] top-[144px] z-[1]`}>
          <div className="bg-[#151a19] z-50 fixed inset-0 pointer-events-none" style={{ backgroundPosition: "top", maskImage: `linear-gradient(to bottom, white 0, white 200px, transparent 230px`, }}>
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
        </div>


        {isDataSynced && (

          <DataRows />
        )}
      </div>
      <Footer />
    </>
  );
};


const OriginKeysFilter = () => {
  const { arrow, loading, error } = useDuckDbQuery(`select distinct origin_key, count(*) as count from labels group by origin_key;`);


  const [originKeyFilters, setOriginKeyFilters] = useSessionStorage<string[]>('originKeyFilters', []);
  const [distinctOriginKeys, setDistinctOriginKeys] = useState<{ origin_key: string, count: number }[]>([]);


  useEffect(() => {
    if (!arrow || loading || error) {
      return;
    }

    setDistinctOriginKeys(arrow.toArray().map((row: any) => row.toJSON()));
  }, [arrow, error, loading]);

  // console.log('distinctOriginKeys:', distinctOriginKeys);


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!arrow) {
    return <div>No data</div>;
  }

  return (
    <div className="z-50">

      <h2>Origin Keys</h2>
      <div className="flex gap-x-2 items-center">
        {distinctOriginKeys.map((row, i) => (
          <div key={i} className="flex gap-x-2 items-center">
            <input
              type="checkbox"
              id={row.origin_key}
              name={row.origin_key}
              value={row.origin_key}
              checked={originKeyFilters.includes(row.origin_key)}
              onChange={(e) => {
                if (e.target.checked) {
                  setOriginKeyFilters([...originKeyFilters, row.origin_key]);
                } else {
                  setOriginKeyFilters(originKeyFilters.filter((key) => key !== row.origin_key));
                }
              }}
            />
            <label htmlFor={row.origin_key}>{row.origin_key}</label>
            <span>({row.count.toString()})</span>
          </div>
        ))}
      </div>
    </div>
  );
}


const AddressFilter = () => {
  const [addressFilter, setAddressFilter] = useSessionStorage<string>('addressFilter', '');

  return (
    <div className="z-50">
      <h2>Address Filter</h2>
      <input
        type="text"
        value={addressFilter}
        onChange={(e) => setAddressFilter(e.target.value)}
      />
    </div>
  );
}

const metricKeys = ["txcount", "gas_fees_usd", "daa"];

function DataRows() {
  const { db } = useDuckDb();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);
  const {
    data: sparklineLabelsData,
    error: sparklineLabelsError,
    isLoading: sparklineLabelsLoading,
    isValidating: sparklineLabelsValidating,
  } = useSWR<any>(LabelsURLS.sparkline);

  const [originKeyFilters] = useSessionStorage<string[]>('originKeyFilters', []);
  const [addressFilter] = useSessionStorage<string>('addressFilter', '');

  const query = useMemo(() => {
    const filters: string[] = [];
    if (originKeyFilters.length > 0) {
      filters.push(`origin_key in (${originKeyFilters.map((key) => `'${key}'`).join(',')})`);
    }
    if (addressFilter) {
      filters.push(`address LIKE '%${addressFilter}%'`);
    }

    return `select * from labels ${filters.length > 0 ? `where ${filters.join(' AND ')}` : ''} ORDER BY address;`;
  }, [originKeyFilters, addressFilter]);



  const { arrow, loading, error } = useDuckDbQuery(query);

  // console.log('arrow:', arrow);

  const [schema, setSchema] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!arrow || loading || error) {
      return;
    }

    setSchema(arrow.schema.fields);
    setData(arrow.toArray().map((row: any) => row.toJSON()));
  }, [arrow, error, loading]);

  // console.log("query", query);
  // console.log("data.length", data.length);

  const listRef = useRef<HTMLDivElement>();

  // The virtualizer
  const virtualizer = useWindowVirtualizer({
    count: data ? data.length : 0,
    // getScrollElement: () => listRef.current,
    estimateSize: () => 37,
    // size: 37,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    overscan: 5,
    getItemKey: (index) => `${data[index].origin_key}_${data[index].address}}`,
  })

  const items = virtualizer.getVirtualItems();
  const [paddingTop, paddingBottom] =
    items.length > 0
      ? [
        Math.max(0, items[0].start - virtualizer.options.scrollMargin) + 100,
        Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end) + 100,
      ]
      : [0, 0];

  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  // if (!data || data.length === 0) {
  //   return <div>No data</div>;
  // }

  const metricKeysLabels = {
    txcount: "Transaction Count",
    gas_fees_usd: "Gas Fees",
    daa: "Active Addresses",
  };

  const [currentMetric, setCurrentMetric] = useState(metricKeys[0]);

  const handlePreviousMetric = useCallback(() => {
    const currentIndex = metricKeys.indexOf(currentMetric);
    const newIndex = currentIndex === 0 ? metricKeys.length - 1 : currentIndex - 1;
    setCurrentMetric(metricKeys[newIndex]);
  }, [currentMetric]);

  const handleNextMetric = useCallback(() => {
    const currentIndex = metricKeys.indexOf(currentMetric);
    const newIndex = currentIndex === metricKeys.length - 1 ? 0 : currentIndex + 1;
    setCurrentMetric(metricKeys[newIndex]);
  }, [currentMetric]);


  const [labelsFilters, setLabelsFilters] = useSessionStorage<{
    address: string[];
    origin_key: string[];
    name: string[];
    owner_project: string[];
    category: string[];
    subcategory: string[];
    txcount: number[];
    txcount_change: number[];
    gas_fees_usd: number[];
    gas_fees_usd_change: number[];
    daa: number[];
    daa_change: number[];
  }>('labelsFilters', {
    address: [],
    origin_key: [],
    name: [],
    owner_project: [],
    category: [],
    subcategory: [],
    txcount: [],
    txcount_change: [],
    gas_fees_usd: [],
    gas_fees_usd_change: [],
    daa: [],
    daa_change: [],

  });


  const subcategoryToCategoryMapping = useMemo(() => {
    if (!master)
      return {};

    let mapping = {};

    Object.keys(master.blockspace_categories.mapping).forEach((category) => {
      master.blockspace_categories.mapping[category].forEach((subcategory) => {
        mapping[subcategory] = category;
      });
    });

    return mapping;
  }, [master]);


  const handleFilter = useCallback((key: string, value: string | number) => {
    setLabelsFilters({
      ...labelsFilters,
      [key]: labelsFilters[key].includes(value) ? labelsFilters[key].filter(f => f !== value) : [...labelsFilters[key], value]
    });
  }, [labelsFilters, setLabelsFilters]);


  return (

    <>
      {data && data.length > 0 && (
        <>
          <LabelsHorizontalScrollContainer
            className="w-full pt-[20px] transition-none"
            header={
              <>
                {data && (
                  <GridTableHeader gridDefinitionColumns="pb-[4px] text-[12px] grid-cols-[15px,minmax(100px,1600px),150px,200px,105px,275px,100px,182px] gap-x-[20px] z-[2]">
                    <div className="flex items-center justify-center"></div>
                    <div className="flex items-center justify-start">Contract Address</div>
                    <div className="flex items-center justify-start">Owner Project</div>
                    <div className="flex items-center justify-start">Contract Name</div>
                    {/* <div className="flex items-center justify-start">Category</div> */}
                    <div className="flex items-center justify-start">
                      <Badge size="sm" label="Category" leftIcon={null} leftIconColor="#FFFFFF" rightIcon="feather:arrow-down" rightIconSize="sm" className="border border-[#5A6462]" />
                    </div>
                    <div className="flex items-center justify-start">
                      <Badge size="sm" label="Subcategory" leftIcon={null} leftIconColor="#FFFFFF" rightIcon="feather:arrow-down" rightIconSize="sm" className="border border-[#5A6462]" />
                    </div>
                    <div className="flex items-center justify-end">Date Deployed</div>
                    <div className="relative flex items-center justify-end">
                      <div className=" flex items-center ">
                        {metricKeysLabels[currentMetric]} (7 days)
                        <div className="absolute left-[12px] cursor-pointer bg-white/30 opacity-60 rounded-full px-0.5 py-[2px]" onClick={handlePreviousMetric}>
                          <Icon icon="feather:chevron-left" className="w-[12px] h-[12px]" />
                        </div>
                        <div className="absolute -right-[20px] cursor-pointer bg-white/30 opacity-60 rounded-full px-0.5 py-[2px]" onClick={handleNextMetric}>
                          <Icon icon="feather:chevron-right" className="w-[12px] h-[12px]" />
                        </div>
                      </div>

                    </div>
                  </GridTableHeader>
                )}
              </>
            }
          >
            <div ref={listRef} className=" min-w-[1272px]">
              <div
                className="relative flex-flex-col gap-y-[3px]"
                style={{
                  paddingTop,
                  paddingBottom,
                }}
              >
                {virtualizer.getVirtualItems().map((item) => (
                  <div key={item.index} style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${item.size}px`,
                    transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
                  }}>
                    <GridTableRow
                      gridDefinitionColumns="group text-[12px] h-[34px] inline-grid grid-cols-[15px,minmax(100px,1600px),150px,200px,105px,275px,100px,182px]  has-[span:hover]:grid-cols-[15px,minmax(310px,800px),150px,200px,105px,275px,100px,182px] transition-all duration-300 gap-x-[20px] mb-[3px]"
                    >

                      <div className="flex h-full items-center">
                        <Icon
                          icon={`gtp:${AllChainsByKeys[data[item.index].origin_key].urlKey
                            }-logo-monochrome`}
                          className="w-[15px] h-[15px]"
                          style={{
                            color:
                              AllChainsByKeys[data[item.index].origin_key].colors[
                              "dark"
                              ][0],
                          }}
                        />
                      </div>
                      <span className="@container flex h-full items-center hover:bg-transparent">
                        <div className="truncate max-w-[310px] group-hover:max-w-[800px] transition-all duration-300">
                          <div className="font-semibold bg-[linear-gradient(90deg,#CDD8D3_76%,transparent_100%)] hover:!bg-[#CDD8D3] @[310px]:bg-[#CDD8D3] transition-all bg-clip-text text-transparent backface-visibility-hidden">
                            {data[item.index].address}
                          </div>
                        </div>
                      </span>
                      <div className="flex h-full items-center">
                        {data[item.index].owner_project ?
                          (
                            <div className="flex h-full items-center gap-x-[3px] max-w-full">
                              <Badge
                                size="sm"
                                label={data[item.index].owner_project}
                                leftIcon={null}
                                leftIconColor="#FFFFFF"
                                rightIcon={labelsFilters.owner_project.includes(data[item.index].owner_project) ? "heroicons-solid:x-circle" : "heroicons-solid:plus-circle"}
                                rightIconColor={labelsFilters.owner_project.includes(data[item.index].owner_project) ? "#FE5468" : undefined}
                                onClick={() => handleFilter("owner_project", data[item.index].owner_project)}
                              />
                            </div>
                          ) : (
                            <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px]">
                              Not Available
                            </div>
                          )}
                      </div>
                      <div>
                        {data[item.index].name ?
                          (
                            <div className="flex h-full items-center gap-x-[3px]">
                              <div className="truncate">{data[item.index].name}</div>
                              {labelsFilters.name.includes(data[item.index].name) ? <RemoveIcon onClick={() => handleFilter("name", data[item.index].name)} /> : <AddIcon onClick={() => handleFilter("name", data[item.index].name)} />}
                            </div>
                          ) : (
                            <div className="flex h-full items-center gap-x-[3px] text-[#5A6462] text-[10px]">
                              Not Available
                            </div>
                          )}
                      </div>

                      {/* <div className="flex h-full items-center gap-x-[3px]">
                        <div>{master?.blockspace_categories.main_categories[subcategoryToCategoryMapping[data[item.index].usage_category]]}</div>
                        {data[item.index].usage_category && <AddIcon />}
                      </div> */}

                      <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap">
                        {data[item.index].usage_category && (
                          <Badge
                            size="sm"
                            label={master?.blockspace_categories.main_categories[subcategoryToCategoryMapping[data[item.index].usage_category]]}
                            leftIcon={
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C12 9.314 9.31371 12.0004 6 12.0004C2.68629 12.0004 0 9.314 0 6.00019C0 2.68638 2.68629 0 6 0C9.31371 0 12 2.68638 12 6.00019ZM7.34382 10.8177C6.91622 10.9367 6.46554 11.0003 6 11.0003C5.33203 11.0003 4.69465 10.8694 4.11215 10.6317C4.82952 10.506 5.65961 10.2499 6.53205 9.8741C6.7696 10.2694 7.04371 10.5905 7.34382 10.8177ZM1 6.00123C1.00023 7.11395 1.36391 8.14173 1.97878 8.97232C2.14906 8.66364 2.4013 8.33202 2.72307 7.99134C1.96571 7.38585 1.37599 6.69891 1 6.00123ZM3.44466 1.70145C4.19246 1.25594 5.06635 1.00003 6 1.00003C6.46554 1.00003 6.91622 1.06366 7.34382 1.18269C7.05513 1.40121 6.79049 1.70664 6.55933 2.08148C5.45843 1.72166 4.37921 1.59964 3.44466 1.70145ZM7.05278 3.3415C6.84167 3.89095 6.68872 4.55609 6.62839 5.2961C7.42655 4.91981 8.20029 4.63928 8.89799 4.46243C8.42349 4.07705 7.86331 3.72077 7.22925 3.42222C7.17039 3.39451 7.11156 3.36761 7.05278 3.3415ZM7.5113 2.45111C7.55931 2.47277 7.60729 2.49489 7.65523 2.51746C8.55899 2.943 9.34518 3.48234 9.97651 4.07822C9.85526 3.5862 9.69097 3.15297 9.49943 2.79723C9.06359 1.98779 8.62905 1.80006 8.4 1.80006C8.20804 1.80006 7.87174 1.93192 7.5113 2.45111ZM10.1994 5.89963C10.1998 5.93304 10.2 5.96655 10.2 6.00019C10.2 6.08685 10.1987 6.17275 10.1962 6.25783C9.55723 6.9422 8.55121 7.71298 7.30236 8.38912C7.2045 8.4421 7.10697 8.49352 7.00987 8.54336C6.79529 7.94561 6.64842 7.22163 6.60999 6.41969C7.78713 5.81519 8.90057 5.44121 9.76216 5.30205C9.90504 5.47067 10.0322 5.64082 10.1428 5.81054C10.1623 5.84042 10.1811 5.87012 10.1994 5.89963ZM9.75092 8.64922C9.46563 8.78698 9.10753 8.88983 8.66956 8.93957C8.55374 8.95273 8.43432 8.96175 8.31169 8.96653C8.94406 8.59205 9.51568 8.19342 10.0072 7.7922C9.93735 8.10093 9.8507 8.38805 9.75092 8.64922ZM7.88025 9.96684C8.26764 9.97979 8.63918 9.9592 8.98795 9.90588C8.74757 10.1331 8.53702 10.2003 8.4 10.2003C8.2761 10.2003 8.09208 10.1454 7.88025 9.96684ZM6.11653 2.99003C5.17456 2.69987 4.27867 2.61313 3.53224 2.69791C2.47745 2.81771 1.88588 3.24554 1.65906 3.72727C1.43225 4.209 1.47937 4.93756 2.059 5.82694C2.38732 6.33071 2.86134 6.83828 3.4599 7.29837C4.05658 6.79317 4.78328 6.28844 5.60152 5.82713C5.62011 4.77164 5.80805 3.7957 6.11653 2.99003ZM3.54862 8.57586C3.47564 8.64993 3.40675 8.72315 3.3421 8.79529C3.0225 9.15193 2.84429 9.44047 2.76697 9.63864C2.76137 9.653 2.75652 9.66623 2.75232 9.67838C2.76479 9.68151 2.77852 9.68468 2.79361 9.68784C3.00181 9.73142 3.34083 9.73992 3.81416 9.66726C4.19302 9.6091 4.62225 9.50457 5.08534 9.35405C4.9056 9.28242 4.72583 9.20443 4.54657 9.12002C4.19544 8.95469 3.86206 8.77218 3.54862 8.57586ZM5.97884 8.61386C5.64712 8.50665 5.3102 8.37424 4.97255 8.21526C4.74853 8.10978 4.53373 7.99709 4.32867 7.87846C4.7138 7.5704 5.15661 7.25944 5.64755 6.9595C5.70709 7.55249 5.82082 8.11007 5.97884 8.61386Z" fill="currentColor" />
                              </svg>
                            }
                            leftIconColor="#FFFFFF"
                            rightIcon={labelsFilters.category.includes(subcategoryToCategoryMapping[data[item.index].usage_category]) ? "heroicons-solid:x-circle" : "heroicons-solid:plus-circle"}
                            rightIconColor={labelsFilters.category.includes(subcategoryToCategoryMapping[data[item.index].usage_category]) ? "#FE5468" : undefined}
                            onClick={() => handleFilter("category", subcategoryToCategoryMapping[data[item.index].usage_category])}
                          />
                        )}
                        {/* {data[item.index].usage_category && <Badge size="sm" label={master?.blockspace_categories.main_categories[subcategoryToCategoryMapping[data[item.index].usage_category]]} leftIcon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 6.00019C12 9.314 9.31371 12.0004 6 12.0004C2.68629 12.0004 0 9.314 0 6.00019C0 2.68638 2.68629 0 6 0C9.31371 0 12 2.68638 12 6.00019ZM7.34382 10.8177C6.91622 10.9367 6.46554 11.0003 6 11.0003C5.33203 11.0003 4.69465 10.8694 4.11215 10.6317C4.82952 10.506 5.65961 10.2499 6.53205 9.8741C6.7696 10.2694 7.04371 10.5905 7.34382 10.8177ZM1 6.00123C1.00023 7.11395 1.36391 8.14173 1.97878 8.97232C2.14906 8.66364 2.4013 8.33202 2.72307 7.99134C1.96571 7.38585 1.37599 6.69891 1 6.00123ZM3.44466 1.70145C4.19246 1.25594 5.06635 1.00003 6 1.00003C6.46554 1.00003 6.91622 1.06366 7.34382 1.18269C7.05513 1.40121 6.79049 1.70664 6.55933 2.08148C5.45843 1.72166 4.37921 1.59964 3.44466 1.70145ZM7.05278 3.3415C6.84167 3.89095 6.68872 4.55609 6.62839 5.2961C7.42655 4.91981 8.20029 4.63928 8.89799 4.46243C8.42349 4.07705 7.86331 3.72077 7.22925 3.42222C7.17039 3.39451 7.11156 3.36761 7.05278 3.3415ZM7.5113 2.45111C7.55931 2.47277 7.60729 2.49489 7.65523 2.51746C8.55899 2.943 9.34518 3.48234 9.97651 4.07822C9.85526 3.5862 9.69097 3.15297 9.49943 2.79723C9.06359 1.98779 8.62905 1.80006 8.4 1.80006C8.20804 1.80006 7.87174 1.93192 7.5113 2.45111ZM10.1994 5.89963C10.1998 5.93304 10.2 5.96655 10.2 6.00019C10.2 6.08685 10.1987 6.17275 10.1962 6.25783C9.55723 6.9422 8.55121 7.71298 7.30236 8.38912C7.2045 8.4421 7.10697 8.49352 7.00987 8.54336C6.79529 7.94561 6.64842 7.22163 6.60999 6.41969C7.78713 5.81519 8.90057 5.44121 9.76216 5.30205C9.90504 5.47067 10.0322 5.64082 10.1428 5.81054C10.1623 5.84042 10.1811 5.87012 10.1994 5.89963ZM9.75092 8.64922C9.46563 8.78698 9.10753 8.88983 8.66956 8.93957C8.55374 8.95273 8.43432 8.96175 8.31169 8.96653C8.94406 8.59205 9.51568 8.19342 10.0072 7.7922C9.93735 8.10093 9.8507 8.38805 9.75092 8.64922ZM7.88025 9.96684C8.26764 9.97979 8.63918 9.9592 8.98795 9.90588C8.74757 10.1331 8.53702 10.2003 8.4 10.2003C8.2761 10.2003 8.09208 10.1454 7.88025 9.96684ZM6.11653 2.99003C5.17456 2.69987 4.27867 2.61313 3.53224 2.69791C2.47745 2.81771 1.88588 3.24554 1.65906 3.72727C1.43225 4.209 1.47937 4.93756 2.059 5.82694C2.38732 6.33071 2.86134 6.83828 3.4599 7.29837C4.05658 6.79317 4.78328 6.28844 5.60152 5.82713C5.62011 4.77164 5.80805 3.7957 6.11653 2.99003ZM3.54862 8.57586C3.47564 8.64993 3.40675 8.72315 3.3421 8.79529C3.0225 9.15193 2.84429 9.44047 2.76697 9.63864C2.76137 9.653 2.75652 9.66623 2.75232 9.67838C2.76479 9.68151 2.77852 9.68468 2.79361 9.68784C3.00181 9.73142 3.34083 9.73992 3.81416 9.66726C4.19302 9.6091 4.62225 9.50457 5.08534 9.35405C4.9056 9.28242 4.72583 9.20443 4.54657 9.12002C4.19544 8.95469 3.86206 8.77218 3.54862 8.57586ZM5.97884 8.61386C5.64712 8.50665 5.3102 8.37424 4.97255 8.21526C4.74853 8.10978 4.53373 7.99709 4.32867 7.87846C4.7138 7.5704 5.15661 7.25944 5.64755 6.9595C5.70709 7.55249 5.82082 8.11007 5.97884 8.61386Z" fill="currentColor" />
                        </svg>} leftIconColor="#FFFFFF" rightIcon="heroicons-solid:plus-circle" />} */}
                      </div>
                      <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap">
                        <div className="flex h-full items-center gap-x-[3px] whitespace-nowrap">
                          {data[item.index].usage_category && (
                            <Badge
                              size="sm"
                              label={master?.blockspace_categories.sub_categories[data[item.index].usage_category]}
                              leftIcon={null}
                              leftIconColor="#FFFFFF"
                              rightIcon={labelsFilters.subcategory.includes(data[item.index].usage_category) ? "heroicons-solid:x-circle" : "heroicons-solid:plus-circle"}
                              rightIconColor={labelsFilters.subcategory.includes(data[item.index].usage_category) ? "#FE5468" : undefined}
                              onClick={() => handleFilter("subcategory", data[item.index].usage_category)}
                            />
                          )}
                        </div>
                        {/* {data[item.index].usage_category && <Badge size="sm" label={master?.blockspace_categories.sub_categories[data[item.index].usage_category]} leftIcon={null} leftIconColor="#FFFFFF" rightIcon="heroicons-solid:plus-circle" />} */}
                      </div>
                      <div className="flex h-full items-center justify-end gap-x-[3px]">
                        {/* random date with in the last 2 years*/}
                        <div className="flex items-center gap-x-[3px]">
                          <div>{new Date(Date.now() - Math.floor(parseFloat((`0.${parseInt(data[item.index].address).toString()}`)) * 1000 * 60 * 60 * 24 * 365 * 2)).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}</div>
                          <AddIcon />
                        </div>
                      </div>
                      {/* <div className="flex items-center justify-end gap-x-[5px]">
                        {sparklineLabelsData && (
                          <div>
                            {sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`] ? <Sparkline chainKey={data[item.index].origin_key} data={sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`].sparkline} /> : <div className="text-center w-full text-xs text-forest-800">Unavailable</div>}
                          </div>
                        )}
                        <div>{data[item.index].txcount.toLocaleString("en-GB")}</div>
                      </div> */}
                      <div className="flex items-center justify-between pl-[20px]">
                        {/* {sparklineLabelsData && sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`] ? (
                        <CanvasSparklineProvider data={sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`].sparkline.map(d => [d[0], d[sparklineLabelsData.data.types.indexOf(sparklineMetricKeys[metricKeys.indexOf(currentMetric)])]])} change={data[item.index][`${currentMetric}_change`]}>
                          <CanvasSparkline chainKey={data[item.index].origin_key} />
                        </CanvasSparklineProvider>

                      ) : (
                        <div className="text-center w-full text-[#5A6462] text-[10px]">Unavailable</div>
                      )}

                      <div className="flex flex-col justify-center items-end h-[24px]">
                        <div className="min-w-[55px] text-right">{data[item.index][currentMetric].toLocaleString("en-GB")}</div>
                        <div className={`text-[9px] text-right leading-[1] ${data[item.index][`${currentMetric}_change`] > 0 ? "font-normal" : "text-[#FE5468] font-semibold "}`}>{data[item.index][`${currentMetric}_change`] > 0 && "+"}{formatNumber(data[item.index][`${currentMetric}_change`] * 100, true, false)}%</div>
                      </div> */}
                        {sparklineLabelsData && sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`] ? (
                          <CanvasSparklineProvider
                            data={sparklineLabelsData.data[`${data[item.index].origin_key}_${data[item.index].address}`].sparkline.map(d => [d[0], d[sparklineLabelsData.data.types.indexOf(sparklineMetricKeys[metricKeys.indexOf(currentMetric)])]])}
                            change={data[item.index][`${currentMetric}_change`]}
                            value={data[item.index][currentMetric]}
                          >
                            <LabelsSparkline
                              chainKey={data[item.index].origin_key}

                            />
                          </CanvasSparklineProvider>
                        ) : (
                          <div className="text-center w-full text-[#5A6462] text-[10px]">Unavailable</div>
                        )}
                      </div>
                    </GridTableRow>
                  </div>
                ))}
              </div>

            </div>
          </LabelsHorizontalScrollContainer>
        </>
      )}
    </>
  );
}

const LabelsSparkline = ({ chainKey }: { chainKey: string }) => {
  const { data, change, value, hoverValue } = useCanvasSparkline();
  return (
    <>
      <CanvasSparkline chainKey={chainKey} />
      {hoverValue ? (
        <div className="flex flex-col justify-center items-end h-[24px]">
          <div className="min-w-[55px] text-right">{hoverValue.toLocaleString("en-GB")}</div>
          <div className={`text-[9px] text-right leading-[1]`}>&nbsp;</div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-end h-[24px]">
          <div className="min-w-[55px] text-right">{value.toLocaleString("en-GB")}</div>
          <div className={`text-[9px] text-right leading-[1] ${change > 0 ? "font-normal" : "text-[#FE5468] font-semibold "}`}>{change > 0 && "+"}{formatNumber(change * 100, true, false)}%</div>
        </div>
      )}
    </>
  )
}


type LabelsResponse = {
  data: {
    sort: {
      by: string;
      direction: string;
    };
    types: string[];
    data: [
      string,
      string,
      string,
      string,
      string,
      number,
      number,
      number,
      number,
      number,
      number
    ][]
  }
}


type GridTableProps = {
  gridDefinitionColumns: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

// grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] 
// class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"
const GridTableHeader = ({ children, gridDefinitionColumns }: GridTableProps) => {
  return (
    <div className={`select-none gap-x-[10px] pl-[10px] pr-[20px] pt-[30px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns}`}>
      {children}
    </div>
  );
}

// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] 
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
const GridTableRow = ({ children, gridDefinitionColumns, style }: GridTableProps) => {
  return (
    <div className={`select-text gap-x-[10px] rounded-full border border-forest-900/20 dark:border-forest-500/20 pl-[10px] pr-[20px] py-[5px] text-xs items-center grid ${gridDefinitionColumns}`} style={style}>
      {children}
    </div>
  );
}