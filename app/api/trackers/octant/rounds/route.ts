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

    // add project_key to each project in each epoch
    data.forEach((epoch) => {
      epoch.projects.forEach((project) => {
        let project_key =
          project.website.url
            .toLowerCase()
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "")
            .split("/")[0] || "";
        if (project_key === "docs.vyperlang.org") project_key = "vyperlang";
        if (project_key === "snakecharmers.ethereum.org")
          project_key = "Web3.py";
        if (project_key === "linktr.ee") project_key = "ecosynthesisx";
        project.project_key = project_key;
      });
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
