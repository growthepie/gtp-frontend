import {
  ListAmountsByProjectId,
  ListAmountsByProjectIdResponse,
  ListContent,
  ProjectsResponse,
} from "@/types/api/RetroPGF3";
import { Pool } from "pg";
import { Project } from "@/types/api/RetroPGF3";

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
    const data: Project[] = result.rows;

    // create dictionary of project ids to lists
    const listAmounts: ListAmountsByProjectId = {};

    data.forEach((project) => {
      listAmounts[project.id] = project.lists.map((list) => {
        return {
          id: list.id,
          listName: list.listName,
          listAuthor: list.author,
          listContent: list.listContent
            ? list.listContent?.filter((listContent) => {
                return listContent.project.id === project.id;
              })
            : [],
        };
      });
    });

    return Response.json({ listAmounts: listAmounts });
  } catch (error) {
    return Response.json({ error });
  }
}
