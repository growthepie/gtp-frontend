"use client";
import { useState, useEffect, useMemo } from 'react';
import { LabelsURLS, MasterURL, LabelsParquetURLS } from '@/lib/urls';
import { useDuckDb, useDuckDbQuery } from 'duckdb-wasm-kit';
import { runQuery } from "duckdb-wasm-kit";
import { insertParquetFromURL } from '@/lib/react-duckdb/insertParquet';
import useSWR, { useSWRConfig } from 'swr';
import { LabelsResponse, LabelsResponseHelper, LabelsRow } from '@/types/api/LabelsResponse';
import { IS_PRODUCTION } from '@/lib/helpers';
import { useLocalStorage, useSessionStorage } from 'usehooks-ts';

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(key, (url) => {
      if (url.includes("api.growthepie.xyz")) {
        // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
        let newUrl = url.replace('/v1/', '/dev/');
        return fetch(newUrl).then((r) => r.json());
      } else {
        return fetch(url).then((r) => r.json());
      }
    }, config);
  }
}

function labelsMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    /// Add logger to the original fetcher.
    const extendedFetcher = (...args) => {
      return fetcher(...args).then((data) => {
        const labelsHelper = LabelsResponseHelper.fromResponse(data);
        return labelsHelper;
      })
    }

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config)
  }
}
// first get's partial data from the quick JSON file then inserts the full data from the parquet file
export const useLabelsData = () => {
  const [isDataSynced, setIsDataSynced] = useState(false);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  const { fetcher } = useSWRConfig()
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());


  const { db, loading: dbLoading, error: dbError } = useDuckDb();

  const [labels, setLabels] = useState<LabelsRow[]>([]);

  const { data: quickLabelsData, error: labelsError } = useSWR<LabelsResponseHelper>(LabelsURLS.quick, fallbackFetcher, {
    use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware, labelsMiddleware] : [labelsMiddleware]
  });

  useEffect(() => {
    if (quickLabelsData && labels.length === 0) {
      setLabels(quickLabelsData.data);
    }

  }, [labels.length, quickLabelsData]);

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

    return `select labels.*, ARRAY_AGG(sparkline) as sparkline from labels ${filters.length > 0 ? `where ${filters.join(' AND ')}` : ''} LEFT JOIN sparkline ON labels.address = sparkline.address AND labels.origin_key = sparkline.origin_key GROUP BY labels.address, labels.owner_project_clear, labels.origin_key, labels.name, labels.owner_project, labels.usage_category, labels.txcount, labels.txcount_change, labels.gas_fees_usd, labels.gas_fees_usd_change, labels.daa, labels.daa_change LIMIT 100`;
  }, [originKeyFilters, addressFilter]);

  const { arrow, loading, error } = useDuckDbQuery(isDataSynced ? query : '');

  const [schema, setSchema] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!arrow || loading || error) {
      return;
    }

    setSchema(arrow.schema.fields);
    setLabels(arrow.toArray().map((row: any) => row.toJSON()));
  }, [arrow, error, loading]);


  useEffect(() => {
    if (!db)
      return;
    const syncData = async () => {
      console.log('Syncing data...');
      try {

        // await conn.insertJSONFromPath('labels.json', { name: 'labels' });
        await insertParquetFromURL(db, LabelsParquetURLS.full, 'labels');
        await insertParquetFromURL(db, LabelsParquetURLS.sparkline, 'sparkline');


        console.log('Data synced successfully');
        setIsDataSynced(true);
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    };

    syncData().then(() => {
      console.log('Data synced');
    });

  }, [db]);




  return { labels, schema, loading, error, dbLoading, dbError };
};