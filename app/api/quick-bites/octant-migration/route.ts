import { OctantURLs } from "@/lib/urls";

export const revalidate = 300;
export const maxDuration = 120;

type EpochSummary = {
  epoch: number;
  fromDatetime: string;
  has_allocation_started: boolean;
};

type SummaryResponse = {
  epochs: Record<string, EpochSummary>;
};

type CommunityRow = {
  user: string;
  maxs: Record<string, number>;
  lockeds: Record<string, number>;
  allocation_amounts: Record<string, number>;
  allocated_to_project_counts: Record<string, number>;
};

type ProjectFundingRow = {
  project_key: string;
  allocations: Record<string, number>;
  matched_rewards: Record<string, number>;
  total: Record<string, number>;
  donor_counts: Record<string, number>;
};

type OctantProjectMetadata = {
  name: string;
  website_url: string;
};

type ProjectMetadataResponse = Record<
  string,
  Record<string, OctantProjectMetadata>
>;

type QuickBiteResponse = {
  data: {
    locked_by_epoch: {
      columns: string[];
      rows: Array<[number, number, number, number]>;
    };
    top_lockers: {
      columns: string[];
      rows: Array<[string, number, number, number]>;
    };
    top_projects_all: {
      columns: string[];
      rows: Array<[string, string, number, number, number, number, string]>;
    };
  };
};

const toUtcTimestamp = (datetime: string): number => {
  const iso = `${datetime.replace(" ", "T")}Z`;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? ts : 0;
};

const getLatestProjectMeta = (
  metadataByEpoch: Record<string, OctantProjectMetadata> | undefined,
): OctantProjectMetadata | null => {
  if (!metadataByEpoch) return null;
  const latestEpoch = Object.keys(metadataByEpoch)
    .filter((k) => k !== "all")
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)[0];
  if (latestEpoch !== undefined && metadataByEpoch[String(latestEpoch)]) {
    return metadataByEpoch[String(latestEpoch)];
  }
  return metadataByEpoch["all"] ?? null;
};

export async function GET() {
  const [summaryRes, communityRes, fundingRes, metadataRes] = await Promise.all([
    fetch(OctantURLs.summary, { next: { revalidate } }),
    fetch(OctantURLs.community, { next: { revalidate } }),
    fetch(OctantURLs.project_funding, { next: { revalidate } }),
    fetch(OctantURLs.project_metadata, { next: { revalidate } }),
  ]);

  if (!summaryRes.ok || !communityRes.ok || !fundingRes.ok || !metadataRes.ok) {
    return Response.json(
      {
        error: "Failed to fetch Octant tracker data",
        statuses: {
          summary: summaryRes.status,
          community: communityRes.status,
          project_funding: fundingRes.status,
          project_metadata: metadataRes.status,
        },
      },
      { status: 500 },
    );
  }

  // Some Octant API responses contain NaN values (Python/numpy serialization artifact),
  // which are invalid JSON. Sanitize all responses via text before parsing.
  const sanitizeJson = (text: string) => JSON.parse(text.replace(/:\s*NaN\b/g, ": null"));

  const summary = sanitizeJson(await summaryRes.text()) as SummaryResponse;
  const community = sanitizeJson(await communityRes.text()) as CommunityRow[];
  const projectFunding = sanitizeJson(await fundingRes.text()) as ProjectFundingRow[];
  const projectMetadata = sanitizeJson(await metadataRes.text()) as ProjectMetadataResponse;

  const epochEntries = Object.entries(summary.epochs)
    .map(([epoch, info]) => ({ epoch: Number(epoch), info }))
    .filter(({ epoch, info }) => Number.isFinite(epoch) && info.has_allocation_started)
    .sort((a, b) => a.epoch - b.epoch);

  const lockedByEpochRows: Array<[number, number, number, number]> = epochEntries.map(
    ({ epoch, info }) => {
      const epochKey = String(epoch);
      const lockedUsers = community.reduce((acc, user) => {
        // Match tracker "All Users" logic:
        // count wallets that have data for the epoch (not only balances > 0).
        return acc + (user.lockeds[epochKey] !== undefined ? 1 : 0);
      }, 0);
      const totalLockedGlm = community.reduce(
        (acc, user) => acc + (user.lockeds[epochKey] ?? 0),
        0,
      );
      return [toUtcTimestamp(info.fromDatetime), epoch, lockedUsers, totalLockedGlm];
    },
  );

  const topLockersRows: Array<[string, number, number, number]> = community
    .map(
      (user): [string, number, number, number] => [
        user.user,
        user.maxs.all ?? 0,
        user.allocation_amounts.all ?? 0,
        user.allocated_to_project_counts.all ?? 0,
      ],
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const topProjectsRows: Array<[string, string, number, number, number, number, string]> =
    projectFunding
      .map((project) => {
        const meta = getLatestProjectMeta(projectMetadata[project.project_key]);
        const allocations = project.allocations.all ?? 0;
        const matching = project.matched_rewards.all ?? 0;
        const total = project.total.all ?? allocations + matching;
        const donors = project.donor_counts.all ?? 0;
        return [
          meta?.name || project.project_key,
          project.project_key,
          allocations,
          matching,
          total,
          donors,
          meta?.website_url || "",
        ] as [string, string, number, number, number, number, string];
      })
      .sort((a, b) => b[4] - a[4])
      .slice(0, 20);

  const payload: QuickBiteResponse = {
    data: {
      locked_by_epoch: {
        columns: ["timestamp", "epoch", "locked_users", "total_locked_glm"],
        rows: lockedByEpochRows,
      },
      top_lockers: {
        columns: ["wallet", "max_locked_glm", "allocations_all", "projects_supported_all"],
        rows: topLockersRows,
      },
      top_projects_all: {
        columns: [
          "project_name",
          "project_key",
          "allocations_all",
          "matching_all",
          "total_funding_all",
          "donors_all",
          "website_url",
        ],
        rows: topProjectsRows,
      },
    },
  };

  return Response.json(payload);
}