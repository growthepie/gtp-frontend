import { ProjectsResponse } from "@/types/api/RetroPGF3";
import { Pool } from "pg";

export const dynamic = 'force-dynamic'

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    // Fetch OP token price with error handling
    let tokenPrice = { optimism: { usd: 0 } }; // default fallback

    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=optimism&vs_currencies=usd",
        { next: { revalidate: 60 } }
      );
      
      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          tokenPrice = await response.json();
        } else {
          console.error("CoinGecko returned non-JSON response");
        }
      }
    } catch (fetchError) {
      console.error("Failed to fetch token price:", fetchError);
      // Continue with default price
    }

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
