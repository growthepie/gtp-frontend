import { NextRequest } from "next/server";
import { Pool } from "pg";
import { createHash } from "crypto";
import { BASE_URL } from "@/lib/helpers";

export const maxDuration = 600; // This function can run for a maximum of 5 minutes
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper function to create MD5 checksum
const createChecksum = (data: string): string => {
  return createHash("md5").update(data).digest("hex");
};

const createTableIfNotExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS octant_rounds (
      id SERIAL PRIMARY KEY,
      value TEXT NOT NULL,
      checksum VARCHAR(32) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Table verified successfully");
  } catch (error) {
    console.error("Error verifying table", error);
  }
};

const getLatestOctantData = async () => {
  const query = `
    SELECT value, checksum
    FROM octant_rounds
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching latest octant data", error);
    return null;
  }
};

const insertNewOctantData = async (data: any, checksum: string) => {
  const query = `
    INSERT INTO octant_rounds (value, checksum)
    VALUES ($1, $2);
  `;

  try {
    await pool.query(query, [JSON.stringify(data), checksum]);
    console.log("New octant data inserted successfully");
  } catch (error) {
    console.error("Error inserting new octant data", error);
  }
};

const compileOctantData = async () => {
  // get data from /api/trackers/octant?isCron=true
  console.log(`${BASE_URL}/api/trackers/octant?isCron=true`);
  const response = await fetch(`${BASE_URL}/api/trackers/octant?isCron=true`);
  const data = await response.json();

  return data;
};

const processCron = async () => {
  console.log("processCron started");
  await createTableIfNotExists();

  const compiledData = await compileOctantData();
  const serializedData = JSON.stringify(compiledData);
  const newChecksum = createChecksum(serializedData);

  const latestData = await getLatestOctantData();
  if (!latestData || latestData.checksum !== newChecksum) {
    await insertNewOctantData(compiledData, newChecksum);
    console.log("New data inserted");
  } else {
    console.log("No new data to insert");
  }

  console.log("processCron done");

  return {
    new: { checksum: newChecksum, value: compiledData },
    latest: {
      checksum: latestData.checksum,
      value: JSON.parse(latestData.value),
    },
  };
};

export async function GET(req: NextRequest, res: Response) {
  const authHeader = req.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", {
  //     status: 401,
  //   });
  // }

  const resp = await processCron();

  return new Response(JSON.stringify(resp), {
    status: 200,
  });
}
