import { ProjectsResponse } from "@/types/api/RetroPGF3";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM rpgf3_projects");
    const data = result.rows;

    return Response.json({ projects: data });
  } catch (error) {
    return Response.json({ error });
  }
}
