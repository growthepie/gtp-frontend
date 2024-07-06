"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import getCrossOriginWorkerURL from "crossoriginworker";
import * as duckdb from "@duckdb/duckdb-wasm";

interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  isLoading: boolean;
  error: Error | null;
}

const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  isLoading: true,
  error: null,
});

// const REMOTE_FILES = [
//   "https://api.growthepie.xyz/v1/labels/full.parquet",
//   "https://api.growthepie.xyz/v1/labels/projects.parquet",
//   "https://api.growthepie.xyz/v1/labels/sparkline.parquet",
// ];

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
        for (const fileUrl of parquetFiles) {
          // get second to last part of the URL to use as the table prefix

          // Replace /v1/ with /dev/ to get JSON files from the dev folder in S3
          let url =
            apiRoot === "dev" ? fileUrl.replace("/v1/", "/dev/") : fileUrl;
          const fileName = fileUrl.split("/").pop() || "";

          await db.registerFileURL(
            fileName,
            url,
            duckdb.DuckDBDataProtocol.HTTP,
            false,
          );

          // const response = await fetch(url);
          // const arrayBuffer = await response.arrayBuffer();
          // const fileName = fileUrl.split("/").pop() || "";
          // let tablePrefix = fileUrl.split("/").slice(-2, -1)[0];
          // let tableSuffix = fileName.split(".")[0];
          // await db.registerFileURL(
          //   fileName,
          //   url,
          //   duckdb.DuckDBDataProtocol.HTTP,
          //   false,
          // );

          // await conn.query(
          //   `CREATE TABLE ${tablePrefix}_${tableSuffix} AS SELECT * FROM '${url}'`,
          // );

          // console.log(`Loaded ${fileName}`);
        }

        // insert joined data into a new table
        let joinedQuery = `
          SELECT 
            f.origin_key,
            f.address,
            f.owner_project,
            f.owner_project_clear,
            f.usage_category,
            f.txcount,
            f.txcount_change,
            f.gas_fees_usd,
            f.gas_fees_usd_change,
            f.daa,
            f.daa_change,
            p.display_name, 
            p.description,
            p.main_github,
          FROM 'full.parquet' f
          JOIN 'projects.parquet' p ON f.owner_project = p.owner_project
        `;

        await conn.query(`CREATE TABLE 'labels' AS (${joinedQuery})`);

        // let joinedQuery = `
        //   SELECT
        //     f.origin_key,
        //     f.address,
        //     f.owner_project,
        //     f.owner_project_clear,
        //     f.usage_category,
        //     f.txcount,
        //     f.txcount_change,
        //     f.gas_fees_usd,
        //     f.gas_fees_usd_change,
        //     f.daa,
        //     f.daa_change,
        //     p.display_name,
        //     p.description,
        //     p.main_github,
        //     (
        //       SELECT json_group_array(json_object('date', s.date, 'txcount', s.txcount, 'gas_fees_usd', s.gas_fees_usd, 'daa', s.daa, 'unix', s.unix))
        //       FROM (
        //         SELECT date, unix, SUM(txcount) as txcount, SUM(gas_fees_usd) as gas_fees_usd, SUM(daa) as daa
        //         FROM 'sparkline.parquet' s
        //         WHERE s.address = f.address AND s.origin_key = f.origin_key
        //         GROUP BY date, unix
        //         ORDER BY date DESC
        //         LIMIT 30
        //       ) s
        //     ) as sparkline
        //   FROM 'full.parquet' f
        //   JOIN 'projects.parquet' p ON f.owner_project = p.owner_project
        // `;

        await conn.query(`CREATE TABLE 'labels' AS (${joinedQuery})`);

        // create indexes on origin_key, address, owner_project, usage_category
        await conn.query(
          `CREATE INDEX idx_origin_key ON 'labels' (origin_key)`,
        );
        await conn.query(`CREATE INDEX idx_address ON 'labels' (address)`);
        await conn.query(
          `CREATE INDEX idx_owner_project ON 'labels' (owner_project)`,
        );
        await conn.query(
          `CREATE INDEX idx_usage_category ON 'labels' (usage_category)`,
        );

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
    <DuckDBContext.Provider value={{ db, isLoading, error }}>
      {children}
    </DuckDBContext.Provider>
  );
};

export const useDuckDB = () => useContext(DuckDBContext);
