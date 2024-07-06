"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import getCrossOriginWorkerURL from "crossoriginworker";
import * as duckdb from "@duckdb/duckdb-wasm";

interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  isLoading: boolean;
  error: Error | null;
  data: any;
}

const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  isLoading: true,
  error: null,
  data: null,
});

const parquetURL = "https://api.growthepie.xyz/v1/labels/sparkline.parquet";

type DuckDBProviderProps = {
  children: React.ReactNode;
  parquetFiles: string[];
};

export const DuckDBProvider: React.FC<DuckDBProviderProps> = ({
  children,
  parquetFiles,
}) => {
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  const [db, setDB] = useState<duckdb.AsyncDuckDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    console.log("DuckDBProvider: initializing DuckDB");
    const initDB = async () => {
      try {
        const allBundles = duckdb.getJsDelivrBundles();
        const bestBundle = await duckdb.selectBundle(allBundles);
        // const worker = new Worker(bestBundle.mainWorker || '');

        // Get the worker URL using the provided function
        const workerUrl = await getCrossOriginWorkerURL(
          bestBundle.mainWorker || "",
        );

        const worker = new Worker(workerUrl);

        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bestBundle.mainModule, bestBundle.pthreadWorker);

        const conn = await db.connect();

        // Fetch and load remote Parquet files
        // get second to last part of the URL to use as the table prefix

        // Replace /v1/ with /dev/ to get JSON files from the dev folder in S3
        let url =
          apiRoot === "dev" ? parquetURL.replace("/v1/", "/dev/") : parquetURL;
        const fileName = parquetURL.split("/").pop() || "";

        await db.registerFileURL(
          fileName,
          url,
          duckdb.DuckDBDataProtocol.HTTP,
          false,
        );
        

        const result = await conn.query(`
          SELECT 
            origin_key || '_' || address AS key,
            json_array(
              array_agg(
                json_object(
                  'date', date,
                  'unix', unix,
                  'txcount', txcount,
                  'daa', daa,
                  'gas_fees_usd', gas_fees_usd
                )
                ORDER BY date ASC
              )
            ) AS sparkline_data
          FROM 'sparkline.parquet' 
          GROUP BY origin_key, address`);

        const records = result
          .toArray()
          .map((r) => r.toJSON())
          .map((r) => ({
            key: r.key,
            sparkline: JSON.parse(r.sparkline_data),
          }))
          .reduce((acc, r) => {
            acc[r.key] = r.sparkline[0];
            return acc;
          }, {});

        setData(records);

        setDB(db);
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to initialize DuckDB"),
        );
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  return (
    <DuckDBContext.Provider value={{ db, isLoading, error, data }}>
      {children}
    </DuckDBContext.Provider>
  );
};

export const useDuckDB = () => useContext(DuckDBContext);
