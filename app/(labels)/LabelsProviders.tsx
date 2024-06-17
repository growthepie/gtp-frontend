"use client";
import { DuckDBConfig } from "@duckdb/duckdb-wasm";
import { initializeDuckDb, useDuckDb } from "duckdb-wasm-kit";
import { useEffect } from "react";


type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const { db, loading, error } = useDuckDb();
  useEffect(() => {
    const config: DuckDBConfig = {
      query: {
        /**
         * By default, int values returned by DuckDb are Int32Array(2).
         * This setting tells DuckDB to cast ints to double instead,
         * so they become JS numbers.
         */
        castBigIntToDouble: true,
      },
    }
    initializeDuckDb({ config, debug: false });
  }, []);


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      {/* <div>Connected to DuckDB!</div> */}
      {children}
    </>
  );
}
