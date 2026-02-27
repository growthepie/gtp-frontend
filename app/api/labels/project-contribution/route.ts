import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  DEFAULT_CONTRIBUTION_REPOSITORIES,
  buildProjectPayloadFromDraft,
  createGitHubPullRequestClient,
  ensureProjectFilePath,
  inferLogoExtension,
  submitProjectContribution,
} from "@openlabels/oli-sdk";
import type { GitHubRepositoryRef } from "@openlabels/oli-sdk/contributions";
import { isMap, isSeq, parseDocument, YAMLMap, YAMLSeq } from "yaml";

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
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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

const toNonEmptyStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toNonEmptyString(entry)).filter(Boolean);
};

const dedupeUrls = (values: string[]): string[] => {
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
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

type EditMetadataPatch = {
  displayName: string;
  description?: string;
  websites?: string[];
  github?: string[];
  twitter?: string;
  telegram?: string;
};

const ensureRootMap = (document: ReturnType<typeof parseDocument>): YAMLMap => {
  if (isMap(document.contents)) {
    return document.contents as YAMLMap;
  }
  const map = document.createNode({}) as YAMLMap;
  document.contents = map;
  return map;
};

const ensureMapAtKey = (
  document: ReturnType<typeof parseDocument>,
  map: YAMLMap,
  key: string,
): YAMLMap => {
  const existing = map.get(key, true);
  if (isMap(existing)) {
    return existing as YAMLMap;
  }

  const next = document.createNode({}) as YAMLMap;
  map.set(key, next);
  return next;
};

const ensureSeqAtKey = (
  document: ReturnType<typeof parseDocument>,
  map: YAMLMap,
  key: string,
): YAMLSeq => {
  const existing = map.get(key, true);
  if (isSeq(existing)) {
    return existing as YAMLSeq;
  }

  const next = document.createNode([]) as YAMLSeq;
  map.set(key, next);
  return next;
};

const setUrlEntry = (
  document: ReturnType<typeof parseDocument>,
  sequence: YAMLSeq,
  index: number,
  url: string,
) => {
  const existing = sequence.items[index];
  if (isMap(existing)) {
    (existing as YAMLMap).set("url", url);
    return;
  }
  sequence.items[index] = document.createNode({ url });
};

const applyAdditiveUrlPatch = (
  document: ReturnType<typeof parseDocument>,
  map: YAMLMap,
  key: string,
  urls?: string[],
) => {
  if (!urls || urls.length === 0) return;

  const sequence = ensureSeqAtKey(document, map, key);
  urls.forEach((url, index) => {
    if (index < sequence.items.length) {
      setUrlEntry(document, sequence, index, url);
      return;
    }
    sequence.add(document.createNode({ url }));
  });
};

const applyAdditiveSocialPatch = (
  document: ReturnType<typeof parseDocument>,
  map: YAMLMap,
  platform: "twitter" | "telegram",
  url?: string,
) => {
  if (!url) return;

  const social = ensureMapAtKey(document, map, "social");
  const sequence = ensureSeqAtKey(document, social, platform);
  if (sequence.items.length === 0) {
    sequence.add(document.createNode({ url }));
    return;
  }

  setUrlEntry(document, sequence, 0, url);
};

const patchExistingProjectYaml = (
  yamlText: string,
  patch: EditMetadataPatch,
): string => {
  const document = parseDocument(yamlText, {
    keepSourceTokens: true,
  });
  if (document.errors.length > 0) {
    throw new Error(`Could not parse existing project YAML: ${document.errors[0]?.message || "unknown error"}`);
  }

  const root = ensureRootMap(document);
  root.set("display_name", patch.displayName);
  if (patch.description) {
    root.set("description", patch.description);
  }
  applyAdditiveUrlPatch(document, root, "websites", patch.websites);
  applyAdditiveUrlPatch(document, root, "github", patch.github);
  applyAdditiveSocialPatch(document, root, "twitter", patch.twitter);
  applyAdditiveSocialPatch(document, root, "telegram", patch.telegram);

  return String(document);
};

const fetchExistingProjectFile = async (input: {
  token: string;
  repository: GitHubRepositoryRef;
  ownerProject: string;
}): Promise<{ filePath: string; yamlText: string }> => {
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
  return { filePath, yamlText };
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

    const draftInput = {
      name: ownerProject,
      displayName,
      description,
      websites,
      github,
      social: {
        ...(twitter ? { twitter: [twitter] } : {}),
        ...(telegram ? { telegram: [telegram] } : {}),
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

    const targetOwner = process.env.OLI_GITHUB_TARGET_OWNER || undefined;
    const autoCreateFork = parseBooleanEnv(process.env.OLI_GITHUB_AUTO_CREATE_FORK, true);
    const branchPrefix = process.env.OLI_GITHUB_BRANCH_PREFIX || undefined;
    const actorLabel = "gtp-frontend";

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

    let yamlPullRequestUrl: string;
    let logoPullRequestUrl: string | null = null;
    let yamlFilePath: string;
    let logoFilePath: string | null = null;
    let yamlBranchName: string;
    let logoBranchName: string | null = null;

    if (mode === "edit") {
      const existingFile = await fetchExistingProjectFile({
        token: githubToken,
        repository: repositories.projects,
        ownerProject,
      });
      const patchedYamlText = patchExistingProjectYaml(existingFile.yamlText, {
        displayName,
        description,
        websites,
        github,
        twitter,
        telegram,
      });
      if (patchedYamlText === existingFile.yamlText) {
        return NextResponse.json(
          { error: "No metadata changes detected for this project." },
          { status: 400 },
        );
      }

      const pullRequestClient = createGitHubPullRequestClient({
        token: githubToken,
      });
      const yamlTitle = `Update ${displayName || ownerProject} project`;
      const yamlPullRequest = await pullRequestClient.createOrUpdatePullRequest({
        upstream: repositories.projects,
        targetOwner,
        autoCreateFork,
        branchPrefix,
        filePath: existingFile.filePath,
        fileContent: patchedYamlText,
        fileContentEncoding: "utf8",
        commitMessage: yamlTitle,
        pullRequestTitle: yamlTitle,
        pullRequestBody: [
          "Updated OSS-directory project metadata via gtp-frontend.",
          "",
          `- slug: \`${ownerProject}\``,
          `- file: \`${existingFile.filePath}\``,
          `- source: ${actorLabel}`,
        ].join("\n"),
      });

      yamlPullRequestUrl = yamlPullRequest.pullRequestUrl;
      yamlFilePath = existingFile.filePath;
      yamlBranchName = yamlPullRequest.branchName;

      if (logoContribution) {
        const logoExtension = inferLogoExtension(
          logoContribution.fileName,
          logoContribution.mimeType,
        );
        const computedLogoPath = `logos/images/${ownerProject}.${logoExtension}`;
        const logoTitle = `Update logo for ${displayName || ownerProject}`;
        const logoPullRequest = await pullRequestClient.createOrUpdatePullRequest({
          upstream: repositories.logos,
          targetOwner,
          autoCreateFork,
          branchPrefix,
          filePath: computedLogoPath,
          fileContent: logoContribution.fileBytes,
          commitMessage: logoTitle,
          pullRequestTitle: logoTitle,
          pullRequestBody: [
            "Updated project logo via gtp-frontend.",
            "",
            `- slug: \`${ownerProject}\``,
            `- file: \`${computedLogoPath}\``,
            `- source: ${actorLabel}`,
          ].join("\n"),
        });
        logoPullRequestUrl = logoPullRequest.pullRequestUrl;
        logoFilePath = computedLogoPath;
        logoBranchName = logoPullRequest.branchName;
      }
    } else {
      const result = await submitProjectContribution({
        auth: { token: githubToken },
        yaml: {
          mode,
          payload: draftPayload,
          existingProjectName: undefined,
        },
        logo: logoContribution,
        repositories,
        targetOwner,
        autoCreateFork,
        branchPrefix,
        validateYaml: true,
        actorLabel,
      });

      yamlPullRequestUrl = result.yaml.pullRequest.pullRequestUrl;
      logoPullRequestUrl = result.logo?.pullRequest.pullRequestUrl || null;
      yamlFilePath = result.yaml.filePath;
      logoFilePath = result.logo?.filePath || null;
      yamlBranchName = result.yaml.pullRequest.branchName;
      logoBranchName = result.logo?.pullRequest.branchName || null;
    }

    return NextResponse.json({
      yamlPullRequestUrl,
      logoPullRequestUrl,
      yamlFilePath,
      logoFilePath,
      yamlBranchName,
      logoBranchName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit project contribution." },
      { status: 500 },
    );
  }
}
