import {
  EpochAllocation,
  EpochBudgetItem,
  EpochStats,
  OctantClient,
} from "@/lib/apis/api";
import { request, gql } from "graphql-request";
import { formatNumber } from "@/lib/chartUtils";
import { NextRequest } from "next/server";

export const revalidate = 60; // 1 minutes
export const maxDuration = 300;

const Client = new OctantClient({
  baseUrl: "https://backend.mainnet.octant.app",
});

const fetcher = (query: string, variables: any) =>
  request<FetchResponse>(
    "https://graph.mainnet.octant.app/subgraphs/name/octant",
    query,
    variables,
  );

type Epoches = {
  epoch: number;
  toTs: string;
  fromTs: string;
  decisionWindow: string;
}[];

type FetchResponse = {
  epoches: Epoches;
};
const EPOCHES_QUERY = gql`
  query GetEpochsStartEndTime($lastEpoch: Int) {
    epoches(first: $lastEpoch) {
      epoch
      toTs
      fromTs
      decisionWindow
    }
  }
`;

const getEpochStartEndTimes = async (lastEpoch: number) => {
  const { epoches } = await fetcher(EPOCHES_QUERY, { lastEpoch });
  return epoches;
};

const getProjectMetadata = async (address: string, projectCid: string) => {
  // get project metadata from: https://turquoise-accused-gayal-88.mypinata.cloud/ipfs/{projectCid}/{address}
  const response = await fetch(
    `https://turquoise-accused-gayal-88.mypinata.cloud/ipfs/${projectCid}/${address}`,
  );

  const content: {
    name: string;
    introDescription: string;
    description: string;
    profileImageSmall: string;
    profileImageMedium: string;
    profileImageLarge: string;
    website: {
      label: string;
      url: string;
    };
  } = await response.json();

  return content;
};

export type EpochState =
  | "PENDING"
  | "ACTIVE"
  | "REWARD_ALLOCATION"
  | "FINALIZED";

export type EpochProject = {
  name: string;
  project_key: string;
  address: string;
  profileImageMedium: string;
  website: {
    label: string;
    url: string;
  };
  donors: number;
  totalAllocated: number;
  thresholdReached: boolean;
  percentageThresholdOfTotalAllocated: number;
  rank: number;
  rewardsTotal: number;
  rewardsMatched: number;
  rewards: {
    allocated: number;
    matched: number;
    total: number;
  };
  allocations: EpochAllocation[];
};

export type EpochData = {
  stats: EpochStats;
  state: EpochState;
  epoch: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  decisionWindow?: Date;
  // budgets?: EpochBudgetItem[] | null;
  // allocations?: EpochAllocation[] | null;
  // totalAllocatedInEpoch: number;
  highestProjectAllocation: number;
  estimatedRewards?:
    | {
        address: string;
        allocated: number;
        matched: number;
        total: number;
      }[]
    | null
    | undefined;
  finalizedRewards:
    | {
        address: string;
        allocated: number;
        matched: number;
        total: number;
      }[]
    | null
    | undefined;
  rewardsThreshold: number;
  projects: EpochProject[];
};
const getAllEpochs = async () => {
  // get current epoch from: https://backend.mainnet.octant.app/epochs/current
  const lastEpoch = await Client.epochs
    .getCurrentEpoch()
    .then((res) => res.data.currentEpoch);

  const currentEpochStartEndTimes = await getEpochStartEndTimes(lastEpoch);

  const epochs: EpochData[] = [];

  for (let epochNum = 1; epochNum <= lastEpoch; epochNum++) {
    // get epoch stats from: https://backend.mainnet.octant.app/epochs/{epoch}
    const epochStats = await Client.epochs.getEpochStats(epochNum);

    // get projects
    const { projectsAddresses, projectsCid } = await Client.projects
      .getProjectsMetadata(epochNum)
      .then((res) => res.data);

    const epochBudgets = await Client.rewards
      .getEpochBudgets(epochNum)
      .then((res) => res.data.budgets)
      .catch((err) => {
        console.error(err);
        return null;
      });

    const estimatedRewards: any = await Client.rewards
      .getEstimatedProjectRewards()
      .then((res) => res.data.rewards)
      .catch((err) => {
        console.error(err);
        return null;
      });

    const finalizedRewards: any = await Client.rewards
      .getFinalizedProjectsRewards(epochNum)
      .then((res) => res.data.rewards)
      .catch((err) => {
        console.error(err);
        return null;
      });

    const rewardsThreshold = await Client.rewards
      .getThreshold(epochNum)
      .then((res) => parseInt(res.data.threshold))
      .catch((err) => {
        console.error(err);
        return 0;
      });

    const epochAllocations = await Client.allocations
      .getEpochAllocations(epochNum)
      .then((res) => res.data.allocations)
      .catch((err) => {
        console.error(err);
        return null;
      });

    const epochStartEndTimeInfo = currentEpochStartEndTimes.find(
      (e) => e.epoch === epochNum,
    );

    const budgetsByProject = epochBudgets
      ? epochBudgets.reduce((acc, b) => {
          if (!acc[b.address]) {
            acc[b.address] = [];
          }
          acc[b.address].push(b);
          return acc;
        }, {} as { [address: string]: EpochBudgetItem[] })
      : {};

    const allocationsByProject = epochAllocations
      ? epochAllocations.reduce((acc, a) => {
          if (!acc[a.project]) {
            acc[a.project] = [];
          }
          acc[a.project].push(a);
          return acc;
        }, {} as { [proposal: string]: EpochAllocation[] })
      : {};

    const totalAllocatedByProject: { [address: string]: number } = {};
    if (epochAllocations) {
      for (const allocation of epochAllocations) {
        if (!totalAllocatedByProject[allocation.project]) {
          totalAllocatedByProject[allocation.project] = 0;
        }
        totalAllocatedByProject[allocation.project] += parseFloat(
          allocation.amount,
        );
      }
    }

    const totalAllocatedInEpoch = epochAllocations
      ? epochAllocations.reduce((acc, a) => acc + parseFloat(a.amount), 0)
      : 0;

    // get the highest project allocation
    const highestProjectAllocation = Math.max(
      ...Object.values(totalAllocatedByProject),
    );

    const finalizedRewardsByProject: {
      [address: string]: {
        allocated: number;
        matched: number;
        total: number;
      };
    } = {};

    if (finalizedRewards && finalizedRewards.length > 0) {
      for (const reward of finalizedRewards) {
        if (!finalizedRewardsByProject[reward.address]) {
          finalizedRewardsByProject[reward.address] = {
            allocated: 0,
            matched: 0,
            total: 0,
          };
        }
        finalizedRewardsByProject[reward.address].allocated += parseFloat(
          reward.allocated,
        );
        finalizedRewardsByProject[reward.address].matched += parseFloat(
          reward.matched,
        );
        finalizedRewardsByProject[reward.address].total +=
          parseFloat(reward.allocated) + parseFloat(reward.matched);
      }
    }

    const estimatedRewardsByProject: {
      [address: string]: {
        allocated: number;
        matched: number;
        total: number;
      };
    } = {};

    if (estimatedRewards && estimatedRewards.length > 0) {
      for (const reward of estimatedRewards) {
        if (!estimatedRewardsByProject[reward.address]) {
          estimatedRewardsByProject[reward.address] = {
            allocated: 0,
            matched: 0,
            total: 0,
          };
        }
        estimatedRewardsByProject[reward.address].allocated += parseFloat(
          reward.allocated,
        );
        estimatedRewardsByProject[reward.address].matched += parseFloat(
          reward.matched,
        );
        estimatedRewardsByProject[reward.address].total +=
          parseFloat(reward.allocated) + parseFloat(reward.matched);
      }
    }

    if (epochNum >= 4) {
      // subtract total donated from estimated rewards total
      for (const address in estimatedRewardsByProject) {
        estimatedRewardsByProject[address].matched =
          estimatedRewardsByProject[address].total -
          (totalAllocatedByProject[address] || 0);
      }
    }

    const totalRewardsRankByProject = Object.entries(
      finalizedRewards ? finalizedRewardsByProject : estimatedRewardsByProject,
    ).sort((a, b) => b[1].total - a[1].total);

    let epochState: EpochState = "PENDING";

    if (epochStartEndTimeInfo) {
      const now = Date.now();
      const fromTs = parseInt(epochStartEndTimeInfo.fromTs) * 1000;
      const toTs = parseInt(epochStartEndTimeInfo.toTs) * 1000;
      const decisionWindow =
        parseInt(epochStartEndTimeInfo.decisionWindow) * 1000;

      if (now >= fromTs && now < toTs) {
        epochState = "ACTIVE";
      } else if (now >= toTs && now < toTs + decisionWindow) {
        epochState = "REWARD_ALLOCATION";
      } else if (now >= toTs + decisionWindow) {
        epochState = "FINALIZED";
      }
    }

    // if (epochState === "PENDING" || epochState === "ACTIVE") continue;

    epochs.push({
      stats: epochStats.data,
      state: epochState,
      epoch: epochNum,
      fromTimestamp: epochStartEndTimeInfo
        ? new Date(parseInt(epochStartEndTimeInfo.fromTs) * 1000)
        : undefined,
      toTimestamp: epochStartEndTimeInfo
        ? new Date(parseInt(epochStartEndTimeInfo.toTs) * 1000)
        : undefined,
      decisionWindow: epochStartEndTimeInfo
        ? new Date(
            parseInt(epochStartEndTimeInfo.toTs) * 1000 +
              parseInt(epochStartEndTimeInfo.decisionWindow) * 1000,
          )
        : undefined,
      // budgets: epochBudgets,
      // allocations: epochAllocations,
      estimatedRewards: estimatedRewards,
      finalizedRewards: finalizedRewards,
      rewardsThreshold: rewardsThreshold || 0,
      // totalAllocatedInEpoch: totalAllocatedInEpoch,
      highestProjectAllocation: highestProjectAllocation,
      projects: await Promise.all(
        projectsAddresses.map(async (address) => {
          const metadata = await getProjectMetadata(address, projectsCid);
          return {
            address,
            name: metadata.name,
            project_key: metadata.name,
            profileImageMedium: metadata.profileImageMedium,
            website: metadata.website,

            // metadata: {
            //   name: metadata.name,
            //   introDescription: metadata.introDescription,
            //   description: metadata.description,
            //   profileImageSmall: metadata.profileImageSmall,
            //   profileImageMedium: metadata.profileImageMedium,
            //   profileImageLarge: metadata.profileImageLarge,
            //   website: metadata.website,
            // },
            budgets: budgetsByProject[address] || [],
            allocations: allocationsByProject[address] || [],
            donors: allocationsByProject[address]
              ? new Set(allocationsByProject[address].map((a) => a.donor)).size
              : 0,
            totalAllocated: totalAllocatedByProject[address] || 0,
            percentageThresholdOfTotalAllocated:
              rewardsThreshold / totalAllocatedByProject[address],
            rank: totalRewardsRankByProject.findIndex((r) => r[0] === address),
            rewardsTotal: finalizedRewardsByProject[address]
              ? finalizedRewardsByProject[address].total
              : estimatedRewardsByProject[address]
              ? estimatedRewardsByProject[address].total
              : 0,
            rewardsMatched: finalizedRewardsByProject[address]
              ? finalizedRewardsByProject[address].matched
              : estimatedRewardsByProject[address]
              ? estimatedRewardsByProject[address].matched
              : 0,
            rewards: finalizedRewardsByProject[address]
              ? finalizedRewardsByProject[address]
              : estimatedRewardsByProject[address]
              ? estimatedRewardsByProject[address]
              : {
                  allocated: 0,
                  matched: 0,
                  total: 0,
                },
            thresholdReached:
              epochNum >= 4
                ? allocationsByProject[address] &&
                  new Set(allocationsByProject[address].map((a) => a.donor))
                    .size > 0
                : totalAllocatedByProject[address] >= rewardsThreshold,
          };
        }),
      ),
    });
  }

  return epochs;
};

const fetchData = async () => {
  const epochs = await getAllEpochs();
  return epochs;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (!params.get("isCron")) {
    // This is running during build time
    return new Response(JSON.stringify([]), {
      headers: { "content-type": "application/json" },
    });
  }
  const result = await fetchData();
  // console.log(result[2].projects[2]);

  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
