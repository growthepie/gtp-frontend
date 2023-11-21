import { NextRequest } from "next/server";
import { Pool } from "pg";
import { request, gql } from "graphql-request";

export const maxDuration = 660; // This function can run for a maximum of 10 minutes
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.FUN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper function to delay execution
const delay = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const PAGE_SIZE = 100;

const fetchProjects = async (skip, retries = 3) => {
  const endpoint = process.env.OPTIMISM_VOTE_ENDPOINT;

  if (!endpoint) {
    throw new Error("OPTIMISM_VOTE_ENDPOINT is not set");
  }

  const graphQLQuery = gql`
    query MyQuery($skip: Int, $first: Int!) {
      retroPGF {
        projects(first: $first, skip: $skip, orderBy: alphabeticalAZ) {
          edges {
            node {
              id
              includedInBallots
              displayName
              applicant {
                address {
                  isContract
                  resolvedName {
                    address
                    name
                  }
                  address
                }
                amountOwned {
                  amount {
                    amount
                    currency
                    decimals
                  }
                  bpsOfDelegatedSupply
                  bpsOfQuorum
                  bpsOfTotal
                }
              }
              applicantType
              bio
              certifiedNotBarredFromParticipating
              certifiedNotDesignatedOrSanctionedOrBlocked
              certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity
              contributionDescription
              contributionLinks {
                description
                type
                url
              }
              fundingSources {
                amount
                currency
                description
                type
              }
              impactCategory
              impactDescription
              impactMetrics {
                description
                number
                url
              }
              lists {
                categories
                author {
                  address
                  isContract
                  resolvedName {
                    address
                    name
                  }
                }
                id
                impactEvaluationDescription
                impactEvaluationLink
                likes
                listDescription
                listName
              }
              understoodFundClaimPeriod
              understoodKYCRequirements
              websiteUrl
              profile {
                bannerImageUrl
                id
                bio
                name
                profileImageUrl
                uid
                websiteUrl
              }
              payoutAddress {
                address
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
  `;

  try {
    const variables = { first: PAGE_SIZE, skip: skip };
    return await request(endpoint, graphQLQuery, variables);
  } catch (error) {
    console.error("Request failed", error);
    if (retries === 0) {
      console.error("Request failed, no retries left", error);
      return [];
    }
    console.log(`Request failed, retrying in 10 seconds...`);
    await delay(10000); // Wait for 5 seconds before retrying
    return fetchProjects(skip, retries - 1); // Recursive call with decreased retries
  }
};

const createTableIfNotExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS rpgf3_projects (
      id VARCHAR PRIMARY KEY,
      included_in_ballots INTEGER,
      display_name VARCHAR,
      applicant JSONB,
      applicant_type VARCHAR,
      bio TEXT,
      certified_not_barred_from_participating BOOLEAN,
      certified_not_designated_or_sanctioned_or_blocked BOOLEAN,
      certified_not_sponsored_by_political_figure_or_government_entity BOOLEAN,
      contribution_description TEXT,
      contribution_links JSONB,
      funding_sources JSONB,
      impact_category TEXT[],
      impact_description TEXT,
      impact_metrics JSONB,
      lists JSONB DEFAULT '[]',
      understood_fund_claim_period BOOLEAN,
      understood_kyc_requirements BOOLEAN,
      website_url VARCHAR,
      profile JSONB,
      payout_address JSONB,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for improving search performance (optional)
    CREATE INDEX IF NOT EXISTS idx_applicant ON rpgf3_projects USING gin (applicant);
    CREATE INDEX IF NOT EXISTS idx_contribution_links ON rpgf3_projects USING gin (contribution_links);
    CREATE INDEX IF NOT EXISTS idx_funding_sources ON rpgf3_projects USING gin (funding_sources);
    CREATE INDEX IF NOT EXISTS idx_impact_metrics ON rpgf3_projects USING gin (impact_metrics);
    CREATE INDEX IF NOT EXISTS idx_profile ON rpgf3_projects USING gin (profile);
    CREATE INDEX IF NOT EXISTS idx_payout_address ON rpgf3_projects USING gin (payout_address);
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Table verified successfully");
  } catch (error) {
    console.error("Error verifying table", error);
  }
};

const insertOrUpdateProjects = async (projects) => {
  const client = await pool.connect();

  const placeholders = projects.map(
    (project, index) =>
      `($${index * 22 + 1}, $${index * 22 + 2}, $${index * 22 + 3}, $${
        index * 22 + 4
      }, $${index * 22 + 5}, $${index * 22 + 6}, $${index * 22 + 7}, $${
        index * 22 + 8
      }, $${index * 22 + 9}, $${index * 22 + 10}, $${index * 22 + 11}, $${
        index * 22 + 12
      }, $${index * 22 + 13}, $${index * 22 + 14}, $${index * 22 + 15}, $${
        index * 22 + 16
      }, $${index * 22 + 17}, $${index * 22 + 18}, $${index * 22 + 19}, $${
        index * 22 + 20
      }, $${index * 22 + 21}, $${index * 22 + 22})`,
  );

  const upsertQuery = `
    INSERT INTO rpgf3_projects (
      id,
      included_in_ballots,
      display_name,
      applicant,
      applicant_type,
      bio,
      certified_not_barred_from_participating,
      certified_not_designated_or_sanctioned_or_blocked,
      certified_not_sponsored_by_political_figure_or_government_entity,
      contribution_description,
      contribution_links,
      funding_sources,
      impact_category,
      impact_description,
      impact_metrics,
      lists,
      understood_fund_claim_period,
      understood_kyc_requirements,
      website_url,
      profile,
      payout_address,
      last_updated
    ) VALUES 
      ${placeholders.join(",")}
    ON CONFLICT (id) DO UPDATE SET
      included_in_ballots = EXCLUDED.included_in_ballots,
      display_name = EXCLUDED.display_name,
      applicant = EXCLUDED.applicant,
      applicant_type = EXCLUDED.applicant_type,
      bio = EXCLUDED.bio,
      certified_not_barred_from_participating = EXCLUDED.certified_not_barred_from_participating,
      certified_not_designated_or_sanctioned_or_blocked = EXCLUDED.certified_not_designated_or_sanctioned_or_blocked,
      certified_not_sponsored_by_political_figure_or_government_entity = EXCLUDED.certified_not_sponsored_by_political_figure_or_government_entity,
      contribution_description = EXCLUDED.contribution_description,
      contribution_links = EXCLUDED.contribution_links,
      funding_sources = EXCLUDED.funding_sources,
      impact_category = EXCLUDED.impact_category,
      impact_description = EXCLUDED.impact_description,
      impact_metrics = EXCLUDED.impact_metrics,
      lists = EXCLUDED.lists,
      understood_fund_claim_period = EXCLUDED.understood_fund_claim_period,
      understood_kyc_requirements = EXCLUDED.understood_kyc_requirements,
      website_url = EXCLUDED.website_url,
      profile = EXCLUDED.profile,
      payout_address = EXCLUDED.payout_address,
      last_updated = EXCLUDED.last_updated
  `;

  const values = projects.flatMap((project) => [
    project.id,
    project.includedInBallots,
    project.displayName,
    JSON.stringify(project.applicant),
    project.applicantType,
    project.bio,
    project.certifiedNotBarredFromParticipating,
    project.certifiedNotDesignatedOrSanctionedOrBlocked,
    project.certifiedNotSponsoredByPoliticalFigureOrGovernmentEntity,
    project.contributionDescription,
    JSON.stringify(project.contributionLinks),
    JSON.stringify(project.fundingSources),
    project.impactCategory,
    project.impactDescription,
    JSON.stringify(project.impactMetrics),
    JSON.stringify(project.lists),
    project.understoodFundClaimPeriod,
    project.understoodKYCRequirements,
    project.websiteUrl,
    JSON.stringify(project.profile),
    JSON.stringify(project.payoutAddress),
    new Date().toISOString(),
  ]);

  try {
    await client.query("BEGIN");
    await client.query(upsertQuery, values);
    await client.query("COMMIT");
    console.log("Projects inserted/updated successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting/updating projects", error);
  } finally {
    client.release();
  }
};

const processAllProjects = async () => {
  let cursor = null;
  let hasNextPage = true;
  let skip = 0;

  while (hasNextPage) {
    const projectsResp = await fetchProjects(skip);
    if (projectsResp.retroPGF.projects.edges.length > 0) {
      const projects = projectsResp.retroPGF.projects.edges.map(
        (edge) => edge.node,
      );

      await insertOrUpdateProjects(projects);
    }

    skip += PAGE_SIZE;

    hasNextPage = projectsResp.retroPGF.projects.pageInfo.hasNextPage;
  }
  console.log("processAllProjects done");
};

const processCron = async () => {
  console.log("processCron started");
  await createTableIfNotExists().then(async () => {
    console.log("processCron::createTableIfNotExists done");
    await processAllProjects().then(() => {
      console.log("processCron::processAllProjects done");
    });
  });
  console.log("processCron done");
};

export function GET(req: NextRequest, res: Response) {
  const authHeader = req.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", {
  //     status: 401,
  //   });
  // }

  processCron();

  return new Response("OK", {
    status: 200,
  });
}
