import {
  ListAmountsByProjectId,
  QuartilesByProjecId,
  RetropgfStatus,
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

function getMin(sortedNumbers: number[]): number {
  return sortedNumbers[0];
}

function getMax(sortedNumbers: number[]): number {
  return sortedNumbers[sortedNumbers.length - 1];
}

function getMedian(sortedNumbers: number[]): number {
  const mid = sortedNumbers.length / 2;
  return sortedNumbers.length % 2 !== 0 ? sortedNumbers[Math.floor(mid)] : (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2;
}

function getQ1(sortedNumbers: number[]): number {
  const mid = sortedNumbers.length / 2;
  return sortedNumbers.length % 2 !== 0 ? getMedian(sortedNumbers.slice(0, Math.floor(mid))) : getMedian(sortedNumbers.slice(0, mid));
}

function getQ3(sortedNumbers: number[]): number {
  const mid = sortedNumbers.length / 2;
  return sortedNumbers.length % 2 !== 0 ? getMedian(sortedNumbers.slice(Math.ceil(mid))) : getMedian(sortedNumbers.slice(mid));
}

function getQuartiles(sortedNumbers: number[]): { min: number; q1: number; median: number; q3: number; max: number } {
  return {
    min: getMin(sortedNumbers),
    q1: getQ1(sortedNumbers),
    median: getMedian(sortedNumbers),
    q3: getQ3(sortedNumbers),
    max: getMax(sortedNumbers),
  };
}

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

    // calculate quartiles
    const projectQuartiles: QuartilesByProjecId = {};

    data.forEach((project) => {
      projectQuartiles[project.id] = {
        min: NaN,
        q1: NaN,
        median: NaN,
        q3: NaN,
        max: NaN,
      };

      const listAmountsByProject = listAmounts[project.id];
      const amounts = listAmountsByProject.map(list => list.listContent.map((listContent) => {
        return listContent.OPAmount;
      })).flat();

      const sortedAmounts = amounts.sort((a, b) => a - b);


        if (sortedAmounts && sortedAmounts.length > 0) {
          

          // const min = amounts[0];
          // const max = amounts[amounts.length - 1];
          // const median = amounts[Math.floor(amounts.length / 2)];

          // const q1 = amounts[Math.floor(amounts.length / 4)];
          // const q3 = amounts[Math.floor((3 * amounts.length) / 4)];

          projectQuartiles[project.id] = getQuartiles(sortedAmounts);
        }
      });

    const numUniqueAuthorsByProject: { [projectId: string]: number } = {};
    const retroPgfStatusByProject: {[projectId:string]: RetropgfStatus} = {};

    data.forEach((project) => {
      numUniqueAuthorsByProject[project.id] = 0;

      const listAmountsByProject = listAmounts[project.id];
      const authors = listAmountsByProject.map(list => list.listAuthor.address).flat();

      const uniqueAuthors = new Set(listAmountsByProject.map(list => list.listAuthor.address));

      numUniqueAuthorsByProject[project.id] = uniqueAuthors.size;

      retroPgfStatusByProject[project.id] = {
        retropgf1: null,
        retropgf2: null,
        // retropgf3: null,
      };

      const retroPgf1 = project.funding_sources.find((fundingSource) => fundingSource.type === "RETROPGF_1");
      const retroPgf2 = project.funding_sources.find((fundingSource) => fundingSource.type === "RETROPGF_2");
      // const retroPgf3 = project.funding_sources.find((fundingSource) => fundingSource.type === "RETROPGF_3");

      if (retroPgf1) {
        retroPgfStatusByProject[project.id].retropgf1 = retroPgf1.amount;
      }

      if (retroPgf2) {
        retroPgfStatusByProject[project.id].retropgf2 = retroPgf2.amount;
      }

      // if (retroPgf3) {
      //   retroPgfStatusByProject[project.id].retropgf3 = retroPgf3.amount;
      // }
    });

    return Response.json({ listAmounts: listAmounts, listQuartiles: projectQuartiles, numUniqueAuthors: numUniqueAuthorsByProject, retropgfStatus: retroPgfStatusByProject });
  } catch (error) {
    return Response.json({ error });
  }
}
