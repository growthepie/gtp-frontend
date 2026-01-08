import { ProjectsResponse } from "@/types/api/RetroPGF3";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  // get OP token price from coingecko
  const tokenPrice = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=optimism&vs_currencies=usd",
  ).then((res) => res.json());

  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.display_name, p.profile, p.applicant, p.applicant_type, p.awarded, p.included_in_ballots, p.lists, p.funding_sources, p.impact_category, p.last_updated, info.value_raised, info.has_token, info.note 
      FROM rpgf3_projects p 
      LEFT JOIN project_info info 
        ON p.id = info.project_id`,
    );
    const data = result.rows;

    // remove the lists.listContent field from the response
    data.forEach((project, i) => {
      project.lists.forEach((list) => {
        delete list.listContent;
        delete list.impactEvaluationDescription;
        delete list.impactEvaluationLink;
        delete list.listDescription;
      });
      delete project.profile.bio;
      delete project.profile.bannerImageUrl;
      if (
        process.env.NEXT_PUBLIC_VERCEL_ENV &&
        ["development", "preview"].includes(process.env.NEXT_PUBLIC_VERCEL_ENV)
      ) {
        project.awarded = Math.random() > 0.5 ? i * Math.pow(10, i / 150) : 0;
      }
    });

    return Response.json({ projects: data, prices: tokenPrice });
  } catch (error) {
    return Response.json({ error });
  }
}
