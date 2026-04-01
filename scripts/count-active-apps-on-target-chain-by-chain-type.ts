import { ApplicationsURLs } from "../lib/urls";

type AppOverviewApiResponse = {
  data?: {
    types?: string[];
    data?: Array<Array<string | number | null>>;
  };
};

const TIMESPAN = "7d";
const endpoint = ApplicationsURLs.overview.replace("{timespan}", TIMESPAN);
const targetChainArg = (process.argv[2] ?? "megaeth").trim().toLowerCase();

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
  const knownChains = new Set<string>();

  for (const row of rows) {
    const ownerProject = String(row[ownerProjectIndex] ?? "").trim();
    const originKey = String(row[originKeyIndex] ?? "").trim();
    const txCount = Number(row[txCountIndex] ?? 0);

    if (!ownerProject || !originKey || !Number.isFinite(txCount)) {
      continue;
    }

    knownChains.add(originKey.toLowerCase());

    const projectEntry = txByOwnerProject.get(ownerProject) ?? new Map<string, number>();
    projectEntry.set(originKey, (projectEntry.get(originKey) ?? 0) + txCount);
    txByOwnerProject.set(ownerProject, projectEntry);
  }

  const matchedTargetChains = Array.from(knownChains).filter(
    (chain) => chain === targetChainArg || chain.includes(targetChainArg),
  );

  if (matchedTargetChains.length === 0) {
    throw new Error(
      `No chain key matched "${targetChainArg}" in app_overview_${TIMESPAN}.`,
    );
  }

  let singleChainActiveOnTarget = 0;
  let multiChainActiveOnTarget = 0;

  txByOwnerProject.forEach((txByChain) => {
    const activeChains = Array.from(txByChain.entries())
      .filter(([, txCount]) => txCount > 0)
      .map(([chain]) => chain.toLowerCase());

    if (activeChains.length === 0) {
      return;
    }

    const isActiveOnTarget = activeChains.some((chain) =>
      matchedTargetChains.includes(chain),
    );

    if (!isActiveOnTarget) {
      return;
    }

    if (activeChains.length === 1) {
      singleChainActiveOnTarget += 1;
    } else {
      multiChainActiveOnTarget += 1;
    }
  });

  const totalActiveOnTarget = singleChainActiveOnTarget + multiChainActiveOnTarget;

  console.log(`Applications active in the past ${TIMESPAN} on "${targetChainArg}" (txcount > 0):`);
  console.log(`Matched target chain keys: ${matchedTargetChains.join(", ")}`);
  console.log(
    `Single-chain active apps on ${targetChainArg}: ${singleChainActiveOnTarget}`,
  );
  console.log(
    `Multi-chain active apps on ${targetChainArg} (target + >=1 other chain): ${multiChainActiveOnTarget}`,
  );
  console.log(`Total active apps on ${targetChainArg}: ${totalActiveOnTarget}`);
}

main().catch((error) => {
  console.error("Failed to count active applications on target chain by chain type.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
