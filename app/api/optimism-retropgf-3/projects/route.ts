import { NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  const res = await pool
    .query("SELECT * FROM rpgf3_projects")
    .then((res) => res.rows)
    .then((rows) => JSON.stringify(rows));

  return new Response(res, {
    headers: {
      "content-type": "application/json",
    },
  });
}
