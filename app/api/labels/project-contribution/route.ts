import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  DEFAULT_CONTRIBUTION_REPOSITORIES,
  buildProjectPayloadFromDraft,
  ensureProjectFilePath,
  parseProjectYaml,
  reorderProjectPayload,
  submitProjectContribution,
} from "@openlabels/oli-sdk";
import type {
  GitHubRepositoryRef,
  ProjectSocialProfile,
  ProjectUrlEntry,
  ProjectYamlPayload,
} from "@openlabels/oli-sdk/contributions";

// ---------------------------------------------------------------------------
// In-memory rate limiter — 5 requests per IP per hour
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_LOGO_BASE64_BYTES = 700_000; // ~500 KB binary

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs: number } {
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
  main_github?: string;
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
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const toSingleUrlList = (value: unknown): string[] | undefined => {
  const url = toNonEmptyString(value);
  return url ? [url] : undefined;
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const decodeBase64Bytes = (value: string): Uint8Array => {
  const normalized = value.includes(",") ? value.split(",").pop() || "" : value;
  const buffer = Buffer.from(normalized, "base64");
  return new Uint8Array(buffer);
};

const encodeContentPath = (value: string): string =>
  value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const decodeGitHubFileContent = (content: string): string =>
  Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");

const toRepositoryRef = (input: {
  owner: string;
  repo: string;
  baseBranch: string;
}): GitHubRepositoryRef => ({
  owner: input.owner,
  repo: input.repo,
  baseBranch: input.baseBranch,
});

const resolveContributionRepositories = () => ({
  projects: toRepositoryRef({
    owner: process.env.OLI_PROJECTS_REPO_OWNER || DEFAULT_CONTRIBUTION_REPOSITORIES.projects.owner,
    repo: process.env.OLI_PROJECTS_REPO_NAME || DEFAULT_CONTRIBUTION_REPOSITORIES.projects.repo,
    baseBranch:
      process.env.OLI_PROJECTS_REPO_BASE_BRANCH ||
      DEFAULT_CONTRIBUTION_REPOSITORIES.projects.baseBranch ||
      "main",
  }),
  logos: toRepositoryRef({
    owner: process.env.OLI_LOGOS_REPO_OWNER || DEFAULT_CONTRIBUTION_REPOSITORIES.logos.owner,
    repo: process.env.OLI_LOGOS_REPO_NAME || DEFAULT_CONTRIBUTION_REPOSITORIES.logos.repo,
    baseBranch:
      process.env.OLI_LOGOS_REPO_BASE_BRANCH ||
      DEFAULT_CONTRIBUTION_REPOSITORIES.logos.baseBranch ||
      "main",
  }),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProjectUrlEntry = (value: unknown): value is ProjectUrlEntry =>
  isRecord(value) &&
  typeof value.url === "string" &&
  value.url.trim().length > 0;

const isProjectUrlEntryArray = (value: unknown): value is ProjectUrlEntry[] =>
  Array.isArray(value) && value.every(isProjectUrlEntry);

const toProjectSocialProfile = (
  value: unknown,
): ProjectSocialProfile | undefined => {
  if (!isRecord(value)) return undefined;

  const social: ProjectSocialProfile = {};
  for (const [platform, entries] of Object.entries(value)) {
    if (isProjectUrlEntryArray(entries)) {
      social[platform] = entries;
    }
  }

  return social;
};

const mergeEditPayload = (
  existingPayload: ProjectYamlPayload,
  draftPayload: ProjectYamlPayload,
): ProjectYamlPayload => {
  const merged: ProjectYamlPayload = {
    ...existingPayload,
    ...draftPayload,
    name:
      typeof existingPayload.name === "string" && existingPayload.name.trim()
        ? existingPayload.name.trim()
        : draftPayload.name,
    version:
      typeof existingPayload.version === "number"
        ? existingPayload.version
        : draftPayload.version,
  };

  // Merge partial social updates (twitter/telegram from UI) without dropping other platforms.
  if (Object.prototype.hasOwnProperty.call(draftPayload, "social")) {
    const existingSocial = toProjectSocialProfile(existingPayload.social);
    const draftSocial = toProjectSocialProfile(draftPayload.social);

    if (existingSocial || draftSocial) {
      const mergedSocial: ProjectSocialProfile = {
        ...(existingSocial || {}),
        ...(draftSocial || {}),
      };
      merged.social = mergedSocial;
    }
  }

  return reorderProjectPayload(merged);
};

const fetchExistingProjectPayload = async (input: {
  token: string;
  repository: GitHubRepositoryRef;
  ownerProject: string;
}): Promise<ProjectYamlPayload> => {
  const filePath = ensureProjectFilePath(input.ownerProject);
  const ref = input.repository.baseBranch || "main";
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(input.repository.owner)}/${encodeURIComponent(input.repository.repo)}/contents/${encodeContentPath(filePath)}?ref=${encodeURIComponent(ref)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Could not load existing project YAML for edit mode (${filePath}): HTTP ${response.status} ${body}`,
    );
  }

  const payload = (await response.json()) as { content?: string; encoding?: string };
  if (!payload.content || payload.encoding !== "base64") {
    throw new Error(
      `Unexpected GitHub content response for ${filePath}. Missing base64-encoded content.`,
    );
  }

  const yamlText = decodeGitHubFileContent(payload.content);
  return parseProjectYaml(yamlText);
};

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
    if (!ownerProject || !displayName) {
      return NextResponse.json(
        { error: "owner_project and display_name are required." },
        { status: 400 },
      );
    }

    const draftInput = {
      name: ownerProject,
      displayName,
      description: toNonEmptyString(body.project.description) || undefined,
      websites: toSingleUrlList(body.project.website),
      github: toSingleUrlList(body.project.main_github),
      social: {
        ...(toNonEmptyString(body.project.twitter) ? { twitter: [toNonEmptyString(body.project.twitter)] } : {}),
        ...(toNonEmptyString(body.project.telegram) ? { telegram: [toNonEmptyString(body.project.telegram)] } : {}),
      },
    };

    const repositories = resolveContributionRepositories();
    const draftPayload = buildProjectPayloadFromDraft(draftInput);

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

    const payload =
      mode === "edit"
        ? mergeEditPayload(
            await fetchExistingProjectPayload({
              token: githubToken,
              repository: repositories.projects,
              ownerProject,
            }),
            draftPayload,
          )
        : draftPayload;

    const logoBase64 = rawLogoBase64;
    let logoContribution:
      | {
          mode: ProjectContributionMode;
          slug: string;
          fileBytes: Uint8Array;
          fileName?: string;
          mimeType?: string;
        }
      | undefined;
    if (logoBase64) {
      const logoBytes = decodeBase64Bytes(logoBase64);
      if (logoBytes.length === 0) {
        return NextResponse.json({ error: "Uploaded logo is empty." }, { status: 400 });
      }

      logoContribution = {
        mode,
        slug: ownerProject,
        fileBytes: logoBytes,
        fileName: toNonEmptyString(body.logo?.fileName) || undefined,
        mimeType: toNonEmptyString(body.logo?.mimeType) || undefined,
      };
    }

    const result = await submitProjectContribution({
      auth: { token: githubToken },
      yaml: {
        mode,
        payload,
        existingProjectName: mode === "edit" ? ownerProject : undefined,
      },
      logo: logoContribution,
      repositories,
      targetOwner: process.env.OLI_GITHUB_TARGET_OWNER || undefined,
      autoCreateFork: parseBooleanEnv(process.env.OLI_GITHUB_AUTO_CREATE_FORK, true),
      branchPrefix: process.env.OLI_GITHUB_BRANCH_PREFIX || undefined,
      validateYaml: true,
      actorLabel: "gtp-frontend",
    });

    return NextResponse.json({
      yamlPullRequestUrl: result.yaml.pullRequest.pullRequestUrl,
      logoPullRequestUrl: result.logo?.pullRequest.pullRequestUrl || null,
      yamlFilePath: result.yaml.filePath,
      logoFilePath: result.logo?.filePath || null,
      yamlBranchName: result.yaml.pullRequest.branchName,
      logoBranchName: result.logo?.pullRequest.branchName || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit project contribution." },
      { status: 500 },
    );
  }
}
