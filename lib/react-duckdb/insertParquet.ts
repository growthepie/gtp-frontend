/**
 * Insert files in DuckDB.
 */
import * as duckdb from "@duckdb/duckdb-wasm";
// import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { logElapsedTime } from "@holdenmatt/ts-utils";
import { Table as Arrow } from "apache-arrow";
import { runQuery, AsyncDuckDB } from "duckdb-wasm-kit";

export class InsertFileError extends Error {
  title: string;
  constructor(title: string, message: string) {
    super(message);
    this.title = title;
    this.name = "InsertFileError";
  }
}

/**
 * Insert a Parquet file in DuckDB from a File handle.
 */
export const insertParquetFromURL = async (
  db: AsyncDuckDB,
  url: string,
  tableName: string,
): Promise<void> => {
  try {
    await db.registerFileURL(
      url.split("/").pop()!,
      url,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    console.log(`Parquet file registered from ${url}`);
    await runQuery(db, `CREATE TABLE '${tableName}' AS SELECT * FROM '${url}'`);
    console.log(`Parquet file imported from ${url}`);
  } catch (e) {
    console.error(e);
    throw new InsertFileError(
      "Parquet import failed",
      "Sorry, we couldn't import that file",
    );
  }
};
