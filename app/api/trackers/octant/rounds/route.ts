import {
  ListAmountsByProjectId,
  QuartilesByProjecId,
  RetropgfStatus,
} from "@/types/api/RetroPGF3";
import { EpochData } from "../route";
import { Pool } from "pg";
import { Project } from "@/types/api/RetroPGF3";
import { RecoveredListData } from "@/app/(layout)/trackers/optimism-retropgf-3/recoveredListData";

export const revalidate = 30; // 30 seconds
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM octant_rounds
      ORDER BY id DESC
      LIMIT 1;
    `);

    const data: EpochData[] = JSON.parse(result.rows[0].value);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
