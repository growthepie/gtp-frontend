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
      `SELECT 
        p.id, p.display_name, p.profile, p.applicant, p.applicant_type, p.included_in_ballots, p.lists, p.funding_sources, p.impact_category, p.last_updated, info.value_raised, info.has_token, info.note 
      FROM rpgf3_projects p 
      LEFT JOIN project_info info 
        ON p.id = info.project_id`,
    );
    const data = result.rows;

    // remove the lists.listContent field from the response
    data.forEach((project) => {
      project.lists.forEach((list) => {
        delete list.listContent;
        delete list.impactEvaluationDescription;
        delete list.impactEvaluationLink;
        delete list.listDescription;
      });
      delete project.profile.bio;
      delete project.profile.bannerImageUrl;
    });

    return Response.json({ projects: data });
  } catch (error) {
    return Response.json({ error });
  }
}
