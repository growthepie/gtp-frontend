/**
 * Insert files in DuckDB.
 */
import * as duckdb from "@duckdb/duckdb-wasm";
import type { AsyncDuckDB } from "duckdb-wasm-kit";

// import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { logElapsedTime } from "@holdenmatt/ts-utils";
import { Table as Arrow } from "apache-arrow";

import { inferTypes } from "duckdb-wasm-kit/src/util/inferTypes";
import { runQuery } from "duckdb-wasm-kit/src/util/runQuery";
import { getTempFilename } from "duckdb-wasm-kit/src/util/tempfile";

export class InsertFileError extends Error {
  title: string;
  constructor(title: string, message: string) {
    super(message);
    this.title = title;
    this.name = "InsertFileError";
  }
}

/**
 * Insert a CSV file in DuckDB from a File handle.
 * @param db The DuckDB instance.
 * @param file The file handle.
 * @param tableName The table name.
 * @throws {InsertFileError} If the file could not be inserted.
 */
export const insertCSV = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const text = await file.text();

    const tempFile = getTempFilename();
    await db.registerFileText(tempFile, text);

    const conn = await db.connect();
    await conn.insertCSVFromPath(tempFile, {
      name: tableName,
      schema: "main",
      detect: true,
    });
    await conn.close();
    db.dropFile(tempFile);

    // Infer additional column types after CSV import.
    await inferTypes(db, tableName);
  } catch (e) {
    console.error(e);
    // The file looks like a CSV, but parsing failed.
    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      throw new InsertFileError(
        "CSV import failed",
        "Sorry, we couldn't import that CSV. Please try again.",
      );
    }

    // Probably an invalid file type.
    throw e;
  }
};

/**
 * Insert a CSV file in DuckDB from a File handle.
 * @param db The DuckDB instance.
 * @param file The file handle.
 * @param tableName The table name.
 * @throws {InsertFileError} If the file could not be inserted.
 */
export const insertJSON = async (
  db: AsyncDuckDB,
  file: File,
  tableName: string,
): Promise<void> => {
  try {
    const text = await file.text();

    const tempFile = getTempFilename();
    await db.registerFileText(tempFile, text);

    const conn = await db.connect();
    await conn.insertJSONFromPath(tempFile, {
      name: tableName,
      schema: "main",
    });
    await conn.close();
    db.dropFile(tempFile);

    // Infer additional column types after JSON import.
    await inferTypes(db, tableName);
  } catch (e) {
    console.error(e);
    // The file looks like a JSON, but parsing failed.
    if (
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json")
    ) {
      throw new InsertFileError(
        "JSON import failed",
        "Sorry, we couldn't import that JSON. Please try again.",
      );
    }

    // Probably an invalid file type.
    throw e;
  }
};
