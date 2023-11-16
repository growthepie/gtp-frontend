import type { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";

const graphQLClient = new GraphQLClient("https://vote.optimism.io/graphql");

const fetchProjects = async (skip: number) => {
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
    first: 100,
    skip,
  };
  return await graphQLClient.request(query, variables);
};

const fetchData = async () => {
  try {
    let allProjects: any[] = [];
    let skip = 0;
    let hasNextPage = false;

    do {
      const data: any = await fetchProjects(skip);
      allProjects = [
        ...allProjects,
        ...data.retroPGF.projects.edges.map((edge) => edge.node),
      ];
      hasNextPage = data.retroPGF.projects.pageInfo.hasNextPage;
      skip += 100;
    } while (hasNextPage);

    return { projects: allProjects };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export async function GET() {
  const result = await fetchData();
  // console.log("Pass 3");
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
