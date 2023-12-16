import type { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";
import { NextRequest } from "next/server";

const graphQLClient = new GraphQLClient("https://vote.optimism.io/graphql");

const fetchProjects = async (first: number, skip: number) => {
  const query = `
      query MyQuery($first: Int!, $skip: Int!) {
        retroPGF {
          projects(first: $first, skip: $skip, orderBy: byIncludedInBallots) {
            edges {
              node {
                id
                displayName
                includedInBallots
                impactCategory
                lists {
                  listName
                  impactEvaluationLink
                  impactEvaluationDescription
                }
                websiteUrl
                
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `;

  const variables = {
    first: first,
    skip: skip,
  };

  return await graphQLClient.request(query, variables);
};

const fetchData = async (first, skip) => {
  try {
    let allProjects: any[] = [];
    let hasNextPage = false;

    const data: any = await fetchProjects(first, skip);
    allProjects = [
      ...allProjects,
      ...data.retroPGF.projects.edges.map((edge) => edge.node),
    ];
    hasNextPage = data.retroPGF.projects.pageInfo.hasNextPage;

    return { projects: allProjects, hasNextPage };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export async function GET(req: NextRequest) {
  const first = parseInt(req.nextUrl.searchParams.get("first") as string) || 20;
  const skip = parseInt(req.nextUrl.searchParams.get("skip") as string) || 0;

  const result = await fetchData(first, skip);

  // console.log("Pass 3");
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
