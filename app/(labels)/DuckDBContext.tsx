// contexts/DuckDBContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import getCrossOriginWorkerURL from 'crossoriginworker';
import * as duckdb from '@duckdb/duckdb-wasm';

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

const REMOTE_FILES = [
  'https://api.growthepie.xyz/v1/labels/full.parquet',
  'https://api.growthepie.xyz/v1/labels/projects.parquet',
  'https://api.growthepie.xyz/v1/labels/sparkline.parquet',
];

export const DuckDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDB] = useState<duckdb.AsyncDuckDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const allBundles = duckdb.getJsDelivrBundles();
        const bestBundle = await duckdb.selectBundle(allBundles);
        // const worker = new Worker(bestBundle.mainWorker || '');

        // Get the worker URL using the provided function
        const workerUrl = await getCrossOriginWorkerURL(bestBundle.mainWorker || '');


        const worker = new Worker(workerUrl);

        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bestBundle.mainModule);

        // Fetch and load remote Parquet files
        for (const fileUrl of REMOTE_FILES) {
          const response = await fetch(fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          const fileName = fileUrl.split('/').pop() || '';
          await db.registerFileBuffer(fileName, new Uint8Array(arrayBuffer));
        }

        setDB(db);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize DuckDB'));
        setIsLoading(false);
      }
    };

    initDB();

    return () => {
      if (db) {
        db.terminate();
      }
    };
  }, []);

  return (
    <DuckDBContext.Provider value={{ db, isLoading, error }}>
      {children}
    </DuckDBContext.Provider>
  );
};

export const useDuckDB = () => useContext(DuckDBContext);