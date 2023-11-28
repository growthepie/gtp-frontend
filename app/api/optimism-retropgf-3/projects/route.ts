import { ProjectsResponse } from "@/types/api/RetroPGF3";
import { Pool } from "pg";

export const revalidate = 60 * 1; // 2 minutes

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, display_name, profile, applicant, applicant_type, included_in_ballots, lists, funding_sources, impact_category, impact_metrics, last_updated FROM rpgf3_projects",
    );
    const data = result.rows;

    // remove the lists.listContent field from the response
    data.forEach((project) => {
      project.lists.forEach((list) => {
        delete list.listContent;
      });
    });

    return Response.json({ projects: data });
  } catch (error) {
    return Response.json({ error });
  }
}
