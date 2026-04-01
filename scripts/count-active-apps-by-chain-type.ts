import { ApplicationsURLs } from "../lib/urls";

type AppOverviewApiResponse = {
  data?: {
    types?: string[];
    data?: Array<Array<string | number | null>>;
  };
};

const TIMESPAN = "7d";
const endpoint = ApplicationsURLs.overview.replace("{timespan}", TIMESPAN);

async function main() {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText})`);
  }

  const payload = (await response.json()) as AppOverviewApiResponse;
  const types = payload?.data?.types ?? [];
  const rows = payload?.data?.data ?? [];

  const ownerProjectIndex = types.indexOf("owner_project");
  const originKeyIndex = types.indexOf("origin_key");
  const txCountIndex = types.indexOf("txcount");

  if (ownerProjectIndex === -1 || originKeyIndex === -1 || txCountIndex === -1) {
    throw new Error(
      "Unexpected response schema: expected columns owner_project, origin_key, txcount.",
    );
  }

  const txByOwnerProject = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const ownerProject = String(row[ownerProjectIndex] ?? "").trim();
    const originKey = String(row[originKeyIndex] ?? "").trim();
    const txCount = Number(row[txCountIndex] ?? 0);

    if (!ownerProject || !originKey || !Number.isFinite(txCount)) {
      continue;
    }

    const projectEntry = txByOwnerProject.get(ownerProject) ?? new Map<string, number>();
    projectEntry.set(originKey, (projectEntry.get(originKey) ?? 0) + txCount);
    txByOwnerProject.set(ownerProject, projectEntry);
  }

  let singleChainActiveApps = 0;
  let multiChainActiveApps = 0;

  txByOwnerProject.forEach((txByChain) => {
    let activeChains = 0;

    txByChain.forEach((txCount) => {
      if (txCount > 0) {
        activeChains += 1;
      }
    });

    if (activeChains === 1) {
      singleChainActiveApps += 1;
    } else if (activeChains >= 2) {
      multiChainActiveApps += 1;
    }
  });

  const totalActiveApps = singleChainActiveApps + multiChainActiveApps;

  console.log(`Applications active in the past ${TIMESPAN} (txcount > 0):`);
  console.log("Definition: chain-count is based on chains with txcount > 0 in the last 7 days.");
  console.log(`Single-chain active apps: ${singleChainActiveApps}`);
  console.log(`Multi-chain active apps: ${multiChainActiveApps}`);
  console.log(`Total active apps: ${totalActiveApps}`);
}

main().catch((error) => {
  console.error("Failed to count active applications by chain type.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
