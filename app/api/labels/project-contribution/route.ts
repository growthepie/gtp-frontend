import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  DEFAULT_CONTRIBUTION_REPOSITORIES,
  buildProjectPayloadFromDraft,
  createGitHubPullRequestClient,
  inferLogoExtension,
  submitProjectContribution,
} from "@openlabels/oli-sdk";
import { commitFilesToBranch, submitProjectEditContribution } from "@openlabels/oli-sdk/contributions";
import type { GitHubRepositoryRef } from "@openlabels/oli-sdk/contributions";

// ---------------------------------------------------------------------------
// In-memory rate limiter — 5 requests per IP per hour
// Bypass with: OLI_DISABLE_RATE_LIMIT=true (dev/testing only)
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_LOGO_BASE64_BYTES = 700_000; // ~500 KB binary

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs: number } {
  if (["1", "true", "yes", "on"].includes((process.env.OLI_DISABLE_RATE_LIMIT ?? "").trim().toLowerCase())) {
    return { allowed: true, retryAfterSecs: 0 };
  }
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSecs: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSecs: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSecs: 0 };
}

type ProjectContributionMode = "add" | "edit";

type ContributionProjectInput = {
  owner_project?: string;
  display_name?: string;
  description?: string;
  website?: string;
  websites?: string[];
  main_github?: string;
  github?: string[];
  twitter?: string;
  telegram?: string;
};

type ContributionLogoInput = {
  base64?: string;
  fileName?: string;
  mimeType?: string;
};

type ContributionRequestBody = {
  mode?: ProjectContributionMode;
  project?: ContributionProjectInput;
  logo?: ContributionLogoInput;
};

const toNonEmptyString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

const sanitizeBranchSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const decodeBase64Bytes = (value: string): Uint8Array => {
  const normalized = value.includes(",") ? value.split(",").pop() || "" : value;
  return new Uint8Array(Buffer.from(normalized, "base64"));
};

const toNonEmptyStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toNonEmptyString(entry)).filter(Boolean);
};

const dedupeUrls = (values: string[]): string[] => {
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    deduped.push(trimmed);
  }
  return deduped;
};

const toUrlList = (input: {
  primary?: string;
  additional?: unknown;
}): string[] | undefined => {
  const urls = dedupeUrls([
    ...(input.primary ? [input.primary] : []),
    ...toNonEmptyStringArray(input.additional),
  ]);
  return urls.length > 0 ? urls : undefined;
};

const toRepositoryRef = (input: {
  owner: string;
  repo: string;
  baseBranch: string;
}): GitHubRepositoryRef => ({
  owner: input.owner,
  repo: input.repo,
  baseBranch: input.baseBranch,
});

const resolveContributionRepositories = () => {
  const projects = toRepositoryRef({
    owner: process.env.OLI_PROJECTS_REPO_OWNER || DEFAULT_CONTRIBUTION_REPOSITORIES.projects.owner,
    repo: process.env.OLI_PROJECTS_REPO_NAME || DEFAULT_CONTRIBUTION_REPOSITORIES.projects.repo,
    baseBranch:
      process.env.OLI_PROJECTS_REPO_BASE_BRANCH ||
      DEFAULT_CONTRIBUTION_REPOSITORIES.projects.baseBranch ||
      "main",
  });

  const hasExplicitLogoRepositoryOverride = Boolean(
    process.env.OLI_LOGOS_REPO_OWNER ||
      process.env.OLI_LOGOS_REPO_NAME ||
      process.env.OLI_LOGOS_REPO_BASE_BRANCH,
  );

  const logos = hasExplicitLogoRepositoryOverride
    ? toRepositoryRef({
        owner: process.env.OLI_LOGOS_REPO_OWNER || projects.owner,
        repo: process.env.OLI_LOGOS_REPO_NAME || projects.repo,
        baseBranch: process.env.OLI_LOGOS_REPO_BASE_BRANCH || projects.baseBranch || "main",
      })
    : projects;

  return { projects, logos };
};

const repositoriesMatch = (left: GitHubRepositoryRef, right: GitHubRepositoryRef): boolean =>
  left.owner === right.owner && left.repo === right.repo;

export async function POST(request: Request) {
  try {
    // Rate limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const { allowed, retryAfterSecs } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": String(retryAfterSecs) } },
      );
    }

    const body = (await request.json().catch(() => null)) as ContributionRequestBody | null;
    if (!body?.project) {
      return NextResponse.json({ error: "Missing project payload." }, { status: 400 });
    }

    // Logo size cap (~500 KB binary)
    const rawLogoBase64 = toNonEmptyString(body.logo?.base64);
    if (rawLogoBase64 && rawLogoBase64.length > MAX_LOGO_BASE64_BYTES) {
      return NextResponse.json(
        { error: "Logo file is too large. Maximum size is 500 KB." },
        { status: 413 },
      );
    }

    const mode: ProjectContributionMode = body.mode === "edit" ? "edit" : "add";
    const ownerProject = toNonEmptyString(body.project.owner_project);
    const displayName = toNonEmptyString(body.project.display_name);
    const description = toNonEmptyString(body.project.description) || undefined;
    const websites = toUrlList({
      primary: toNonEmptyString(body.project.website) || undefined,
      additional: body.project.websites,
    });
    const github = toUrlList({
      primary: toNonEmptyString(body.project.main_github) || undefined,
      additional: body.project.github,
    });
    const twitter = toNonEmptyString(body.project.twitter) || undefined;
    const telegram = toNonEmptyString(body.project.telegram) || undefined;
    if (!ownerProject || !displayName) {
      return NextResponse.json(
        { error: "owner_project and display_name are required." },
        { status: 400 },
      );
    }

    const repositories = resolveContributionRepositories();

    const githubToken =
      process.env.OLI_GITHUB_TOKEN ||
      process.env.GITHUB_TOKEN ||
      "";
    if (!githubToken) {
      return NextResponse.json(
        { error: "Missing OLI_GITHUB_TOKEN (or GITHUB_TOKEN) on the server." },
        { status: 500 },
      );
    }

    const targetOwner = process.env.OLI_GITHUB_TARGET_OWNER || undefined;
    const autoCreateFork = parseBooleanEnv(process.env.OLI_GITHUB_AUTO_CREATE_FORK, true);

    // Sync the fork's base branch with upstream before creating a contribution
    // branch, so PRs are always based on the latest upstream state.
    if (targetOwner) {
      const forkSyncResults = await Promise.allSettled(
        [repositories.projects, repositories.logos].map(async (repo) => {
          await fetch(
            `https://api.github.com/repos/${targetOwner}/${repo.repo}/merge-upstream`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${githubToken}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github+json",
              },
              body: JSON.stringify({ branch: repo.baseBranch }),
            },
          );
        }),
      );
      // Log failures but don't abort — the SDK will still create the branch
      // from whatever state the fork is currently in.
      forkSyncResults.forEach((r) => {
        if (r.status === "rejected") {
          console.warn("[project-contribution] fork sync failed:", r.reason);
        }
      });
    }

    // Deterministic branch name — SDK handles -2, -3, etc. on collisions
    const branchName = `oli-contrib-${sanitizeBranchSegment(ownerProject)}`;
    const actorLabel = "gtp-frontend";

    // Resolve logo — keep GTP-specific path override (data/logos/<c>/<slug>.<ext>)
    let logoInput:
      | { fileBytes: Uint8Array; fileName?: string; mimeType?: string; filePath: string }
      | undefined;
    if (rawLogoBase64) {
      const logoBytes = decodeBase64Bytes(rawLogoBase64);
      if (logoBytes.length === 0) {
        return NextResponse.json({ error: "Uploaded logo is empty." }, { status: 400 });
      }
      const logoFileName = toNonEmptyString(body.logo?.fileName) || undefined;
      const logoMimeType = toNonEmptyString(body.logo?.mimeType) || undefined;
      const logoExt = inferLogoExtension(logoFileName, logoMimeType);
      const firstChar = ownerProject.charAt(0).toLowerCase();
      logoInput = {
        fileBytes: logoBytes,
        fileName: logoFileName,
        mimeType: logoMimeType,
        filePath: `data/logos/${firstChar}/${ownerProject}.${logoExt}`,
      };
    }

    let yamlPullRequestUrl: string;
    let logoPullRequestUrl: string | null = null;
    let yamlFilePath: string;
    let logoFilePath: string | null = null;
    let yamlBranchName: string;
    let yamlTargetOwner: string;
    let logoBranchName: string | null = null;
    let combinedPullRequest = false;

    if (mode === "edit") {
      const result = await submitProjectEditContribution({
        auth: { token: githubToken },
        repositories,
        slug: ownerProject,
        patch: { displayName, description, websites, github, twitter, telegram },
        branch: { branchName },
        targetOwner,
        autoCreateFork,
        actorLabel,
      });

      yamlPullRequestUrl = result.pullRequest.pullRequestUrl;
      yamlFilePath = result.filePath;
      yamlBranchName = result.pullRequest.branchName;
      yamlTargetOwner = result.pullRequest.targetOwner;
    } else {
      const draftPayload = buildProjectPayloadFromDraft({
        name: ownerProject,
        displayName,
        description,
        websites,
        github,
        social: {
          ...(twitter ? { twitter: [twitter] } : {}),
          ...(telegram ? { telegram: [telegram] } : {}),
        },
      });

      const result = await submitProjectContribution({
        auth: { token: githubToken },
        yaml: { mode: "add", payload: draftPayload },
        repositories,
        targetOwner,
        autoCreateFork,
        branch: { branchName },
        validateYaml: true,
        actorLabel,
      });

      yamlPullRequestUrl = result.yaml.pullRequest.pullRequestUrl;
      yamlFilePath = result.yaml.filePath;
      yamlBranchName = result.yaml.pullRequest.branchName;
      yamlTargetOwner = result.yaml.pullRequest.targetOwner;
    }

    // Commit logo to the YAML branch (combined PR) when repos match, or open
    // a separate PR when they differ.
    if (logoInput) {
      const logoAction = mode === "edit" ? "Update" : "Add";
      const logoCommitMessage = `${logoAction} logo for ${displayName || ownerProject}`;

      if (repositoriesMatch(repositories.projects, repositories.logos)) {
        // Same repo — commit directly to the existing YAML branch.
        await commitFilesToBranch({
          auth: { token: githubToken },
          owner: yamlTargetOwner,
          repo: repositories.logos.repo,
          branch: yamlBranchName,
          files: [{
            filePath: logoInput.filePath,
            fileContent: logoInput.fileBytes,
            deleteOtherExtensions: true,
            slug: ownerProject,
          }],
          commitMessage: logoCommitMessage,
        });
        logoPullRequestUrl = yamlPullRequestUrl;
        logoFilePath = logoInput.filePath;
        logoBranchName = yamlBranchName;
        combinedPullRequest = true;
      } else {
        // Different repos — separate logo PR on its own branch.
        const pullRequestClient = createGitHubPullRequestClient({ token: githubToken });
        const logoPullRequest = await pullRequestClient.createOrUpdatePullRequest({
          upstream: repositories.logos,
          targetOwner,
          autoCreateFork,
          branchName,
          filePath: logoInput.filePath,
          fileContent: logoInput.fileBytes,
          commitMessage: logoCommitMessage,
          pullRequestTitle: logoCommitMessage,
          pullRequestBody: [
            `${mode === "edit" ? "Updated" : "Added"} project logo via gtp-frontend.`,
            "",
            `- slug: \`${ownerProject}\``,
            `- file: \`${logoInput.filePath}\``,
            `- source: ${actorLabel}`,
          ].join("\n"),
          deleteOtherExtensions: true,
        });
        logoPullRequestUrl = logoPullRequest.pullRequestUrl;
        logoFilePath = logoInput.filePath;
        logoBranchName = logoPullRequest.branchName;
      }
    }

    // Fire-and-forget Discord alert — don't block the response on it
    const discordWebhookUrl = process.env.DISCORD_CONTRACTS;
    if (discordWebhookUrl) {
      const action = mode === "edit" ? "edited" : "added";
      fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Someone ${action} a project (**${displayName || ownerProject}**) via gtp-frontend. [View PR](${yamlPullRequestUrl})`,
        }),
      }).catch((err) => console.warn("[project-contribution] Discord alert failed:", err));
    }

    return NextResponse.json({
      yamlPullRequestUrl,
      logoPullRequestUrl,
      yamlFilePath,
      logoFilePath,
      yamlBranchName,
      logoBranchName,
      combinedPullRequest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit project contribution." },
      { status: 500 },
    );
  }
}
