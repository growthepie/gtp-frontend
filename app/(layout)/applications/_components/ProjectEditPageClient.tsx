"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createWalletClient, custom } from "viem";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { useMaster } from "@/contexts/MasterContext";
import {
  AttestClient,
  createDynamicWalletAdapter,
  fetchProjects,
  findSimilarProjectMatches,
  getProjectValidation,
  type AttestationRowInput,
  type BulkOnchainSubmitResult,
  type OnchainSubmitResult,
  type PreparedAttestation,
  type ProjectRecord,
  type ProjectSimilarityField,
  type ProjectSimilarityMatch,
} from "@openlabels/oli-sdk";
import { useBulkCsvAttestUI, useSingleAttestUI } from "@openlabels/oli-sdk/react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

type ProjectMode = "add" | "edit";

type ProjectFormState = {
  owner_project: string;
  display_name: string;
  description: string;
  website: string;
  main_github: string;
  twitter: string;
  telegram: string;
};

type LogoUploadState = {
  base64: string;
  fileName: string;
  mimeType: string;
  previewUrl: string;
} | null;

type ContributionResult = {
  yamlPullRequestUrl: string;
  logoPullRequestUrl: string | null;
  yamlBranchName?: string;
  logoBranchName?: string | null;
};

type MatchField = "owner_project" | "website" | "github";

type ExistingProjectMatch = {
  owner_project: string;
  display_name: string;
  confidence: "exact" | "similar";
  field: MatchField;
};

type QueueSubmitPreview = {
  flow: "single" | "bulk";
  preparedRows: PreparedAttestation[];
  rowsSignature: string;
};

type QueueEditableField =
  | "chain_id"
  | "address"
  | "contract_name"
  | "owner_project"
  | "usage_category";

type QueueDropdownField = "chain_id" | "owner_project" | "usage_category";

type SearchDropdownOption = {
  value: string;
  label: string;
};

const OWNER_PROJECT_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
const MAX_QUEUE_ROWS = 500;
const QUEUE_EDITABLE_FIELDS: QueueEditableField[] = [
  "chain_id",
  "address",
  "contract_name",
  "owner_project",
  "usage_category",
];
const QUEUE_DROPDOWN_FIELDS: QueueDropdownField[] = [
  "chain_id",
  "owner_project",
  "usage_category",
];

const EMPTY_FORM: ProjectFormState = {
  owner_project: "",
  display_name: "",
  description: "",
  website: "",
  main_github: "",
  twitter: "",
  telegram: "",
};

const PROFILER_BASE_PROMPT = `You are a focused website profiler that outputs a strict YAML record. Given one or more URLs, visit and look for other sources, then return:

YAML schema (exact keys, in this order):
version: 7
name: <slug, lowercase hyphenated, <=60 chars, ASCII, no TLD>
display_name: <human readable brand/project name>
description: <2-3 short, neutral sentences. No marketing language>
websites:
  - url: <canonical absolute URL of the site you profiled>
social:
  twitter:
    - url: <absolute URL to profile>
  x:
    - url: <absolute URL to profile>
  discord:
    - url: <absolute URL>
  telegram:
    - url: <absolute URL>
github:
  - url: <absolute GitHub org/repo URL>

How to work:
- Always browse the provided URL(s). Prefer the homepage. Follow redirects and use the final URL in websites[0].url.
- Then search web for mentions of the project name.
- Keep description non-promotional and factual.
- Do not guess absent social links.
- Return YAML only.`;

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  return "";
};

const cleanYamlValue = (value: string): string =>
  value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+#.*$/, "")
    .trim();

const ensureAbsoluteUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const normalizeOwnerProjectInput = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/-{2,}/g, "-");

const normalizeTwitterInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.includes("x.com/") ||
    trimmed.includes("twitter.com/")
  ) {
    return ensureAbsoluteUrl(trimmed);
  }
  const handle = trimmed.replace(/^@/, "");
  return handle ? `https://x.com/${handle}` : "";
};

const normalizeTelegramInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("t.me/")) {
    return ensureAbsoluteUrl(trimmed);
  }
  const handle = trimmed.replace(/^@/, "");
  return handle ? `https://t.me/${handle}` : "";
};

const isValidHttpUrl = (value: string): boolean => {
  if (!value.trim()) {
    return true;
  }
  try {
    const parsed = new URL(ensureAbsoluteUrl(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeUrlForComparison = (value: string): string => {
  if (!value.trim()) {
    return "";
  }
  try {
    const parsed = new URL(ensureAbsoluteUrl(value));
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  }
};

const parseYamlScalar = (yamlText: string, key: string): string => {
  const match = yamlText.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match?.[1] ? cleanYamlValue(match[1]) : "";
};

const parseFirstUrlInBlock = (yamlText: string, blockKey: string): string => {
  const blockMatch = yamlText.match(
    new RegExp(`^\\s*${blockKey}:\\s*(?:\\r?\\n)([\\s\\S]*?)(?=^\\s*[a-zA-Z_]+:|\\Z)`, "m"),
  );
  if (!blockMatch?.[1]) {
    return "";
  }
  const urlMatch = blockMatch[1].match(/-\s*url:\s*(.+)/);
  return urlMatch?.[1] ? cleanYamlValue(urlMatch[1]) : "";
};

const parseProfilerYaml = (yamlText: string): Partial<ProjectFormState> => {
  const sanitized = yamlText
    .trim()
    .replace(/^```(?:yaml|yml)?\s*/i, "")
    .replace(/\s*```$/, "");

  return {
    owner_project: parseYamlScalar(sanitized, "name"),
    display_name: parseYamlScalar(sanitized, "display_name"),
    description: parseYamlScalar(sanitized, "description"),
    website: parseFirstUrlInBlock(sanitized, "websites"),
    main_github: parseFirstUrlInBlock(sanitized, "github"),
    twitter:
      parseFirstUrlInBlock(sanitized, "twitter") || parseFirstUrlInBlock(sanitized, "x"),
    telegram: parseFirstUrlInBlock(sanitized, "telegram"),
  };
};

const firstUrlFromUnknown = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string") {
        return entry;
      }
      if (
        entry &&
        typeof entry === "object" &&
        "url" in entry &&
        typeof (entry as { url?: unknown }).url === "string"
      ) {
        return (entry as { url: string }).url;
      }
    }
  }
  if (
    value &&
    typeof value === "object" &&
    "url" in value &&
    typeof (value as { url?: unknown }).url === "string"
  ) {
    return (value as { url: string }).url;
  }
  return "";
};

const readProjectWebsite = (project: ProjectRecord): string =>
  asString(project.website) || firstUrlFromUnknown(project.websites);

const readProjectGithub = (project: ProjectRecord): string =>
  asString(project.main_github) || firstUrlFromUnknown(project.github);

const readProjectSocial = (project: ProjectRecord, platform: "twitter" | "telegram"): string => {
  const direct = asString(project[platform]);
  if (direct) {
    return direct;
  }
  if (project.social && typeof project.social === "object") {
    const socialValue = (project.social as Record<string, unknown>)[platform];
    return firstUrlFromUnknown(socialValue);
  }
  return "";
};

const toDisplayName = (project: ProjectRecord): string =>
  asString(project.display_name) || asString(project.owner_project);

const mapSimilarityMatch = (
  match: ProjectSimilarityMatch,
  field: MatchField,
): ExistingProjectMatch => ({
  owner_project: asString(match.project.owner_project),
  display_name: toDisplayName(match.project),
  confidence: match.confidence,
  field,
});

const mergeMatches = (...groups: ExistingProjectMatch[][]): ExistingProjectMatch[] => {
  const byOwner = new Map<string, ExistingProjectMatch>();
  for (const group of groups) {
    for (const match of group) {
      const key = match.owner_project.toLowerCase();
      const existing = byOwner.get(key);
      if (!existing || (existing.confidence === "similar" && match.confidence === "exact")) {
        byOwner.set(key, match);
      }
    }
  }
  return Array.from(byOwner.values());
};

const runFallbackUrlMatch = (
  value: string,
  field: MatchField,
  projects: ProjectRecord[],
): ExistingProjectMatch[] => {
  const normalizedInput = normalizeUrlForComparison(value);
  if (!normalizedInput) {
    return [];
  }

  const exact: ExistingProjectMatch[] = [];
  const similar: ExistingProjectMatch[] = [];

  for (const project of projects) {
    const sourceValue =
      field === "website" ? readProjectWebsite(project) : readProjectGithub(project);
    const normalizedSource = normalizeUrlForComparison(sourceValue);
    if (!normalizedSource) {
      continue;
    }

    let confidence: "exact" | "similar" | null = null;
    if (normalizedSource === normalizedInput) {
      confidence = "exact";
    } else if (
      normalizedSource.startsWith(normalizedInput) ||
      normalizedInput.startsWith(normalizedSource) ||
      normalizedSource.includes(normalizedInput) ||
      normalizedInput.includes(normalizedSource)
    ) {
      confidence = "similar";
    }

    if (!confidence) {
      continue;
    }

    const candidate: ExistingProjectMatch = {
      owner_project: asString(project.owner_project),
      display_name: toDisplayName(project),
      confidence,
      field,
    };
    if (!candidate.owner_project) {
      continue;
    }

    if (confidence === "exact") {
      exact.push(candidate);
    } else {
      similar.push(candidate);
    }
  }

  return [...exact, ...similar].slice(0, 5);
};

const buildProfilerPrompt = (website: string): string =>
  `${PROFILER_BASE_PROMPT}\n\nURL(s) to profile:\n- ${ensureAbsoluteUrl(
    website,
  )}\n\nReturn YAML only.`;

const hasMeaningfulRowData = (row: AttestationRowInput): boolean => {
  const address = toStringValue(row.address).trim();
  const contractName = toStringValue(row.contract_name).trim();
  const ownerProject = toStringValue(row.owner_project).trim();
  const usageCategory = toStringValue(row.usage_category).trim();
  return Boolean(address || contractName || ownerProject || usageCategory);
};

const getQueueRowKey = (
  chainId: string,
  address: string,
  ownerProject: string,
): string => `${chainId}::${address}::${ownerProject}`;

const rowPreviewSignature = (row: AttestationRowInput): string =>
  JSON.stringify({
    chain_id: toStringValue(row.chain_id).trim(),
    address: toStringValue(row.address).trim().toLowerCase(),
    contract_name: toStringValue(row.contract_name).trim(),
    owner_project: toStringValue(row.owner_project).trim(),
    usage_category: toStringValue(row.usage_category).trim(),
  });

const truncateHex = (value: string, start = 14, end = 12): string => {
  if (!value || value.length <= start + end + 3) {
    return value;
  }
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const withCurrentDropdownOption = (
  options: SearchDropdownOption[],
  currentValue: string,
): SearchDropdownOption[] => {
  const normalizedCurrent = currentValue.trim();
  if (!normalizedCurrent) {
    return options;
  }
  if (options.some((option) => option.value === normalizedCurrent)) {
    return options;
  }
  return [{ value: normalizedCurrent, label: normalizedCurrent }, ...options];
};

export default function ProjectEditPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractsSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const initializedFromQueryRef = useRef(false);
  const autofilledOwnerRef = useRef("");
  const websiteCheckTargetRef = useRef("");

  const { data: masterData, SupportedChainKeys } = useMaster();

  const mode: ProjectMode = pathname.endsWith("/edit") ? "edit" : "add";
  const isAddMode = mode === "add";

  const [showMetadataForm, setShowMetadataForm] = useState(!isAddMode);
  const [websiteCheckInput, setWebsiteCheckInput] = useState("");
  const [websiteCheckMatches, setWebsiteCheckMatches] = useState<ExistingProjectMatch[]>([]);
  const [websiteChecked, setWebsiteChecked] = useState(false);
  const [isCheckingWebsite, setIsCheckingWebsite] = useState(false);

  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [logoUpload, setLogoUpload] = useState<LogoUploadState>(null);

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueErrorFromValidation, setQueueErrorFromValidation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [queueSubmitPreview, setQueueSubmitPreview] = useState<QueueSubmitPreview | null>(null);
  const [isPreparingSubmitPreview, setIsPreparingSubmitPreview] = useState(false);
  const [isSubmittingFromPreview, setIsSubmittingFromPreview] = useState(false);
  const [shouldAutoValidateAfterImport, setShouldAutoValidateAfterImport] = useState(false);
  const [singleSubmitResult, setSingleSubmitResult] = useState<OnchainSubmitResult | null>(null);
  const [bulkSubmitResult, setBulkSubmitResult] = useState<BulkOnchainSubmitResult | null>(null);
  const [contributionResult, setContributionResult] = useState<ContributionResult | null>(null);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);

  const [isProfiling, setIsProfiling] = useState(false);
  const [profilerError, setProfilerError] = useState("");
  const [profilerInfo, setProfilerInfo] = useState("");

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const loadProjects = useCallback(async (activeRef?: { current: boolean }) => {
    setIsLoadingProjects(true);
    setProjectsError("");
    try {
      const data = await fetchProjects();
      if (activeRef && !activeRef.current) {
        return;
      }
      setProjects(data);
    } catch {
      if (activeRef && !activeRef.current) {
        return;
      }
      setProjects([]);
      setProjectsError("Could not load OSS directory projects. Duplicate checks are limited.");
    } finally {
      if (!activeRef || activeRef.current) {
        setIsLoadingProjects(false);
      }
    }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    loadProjects(activeRef);
    return () => {
      activeRef.current = false;
    };
  }, [loadProjects]);

  useEffect(() => {
    if (!isAddMode) {
      setShowMetadataForm(true);
      return;
    }
    setShowMetadataForm(false);
  }, [isAddMode]);

  useEffect(() => {
    if (initializedFromQueryRef.current) {
      return;
    }

    const projectParam = asString(searchParams.get("project"));
    const websiteParam = asString(searchParams.get("website"));

    setForm((prev) => ({
      ...prev,
      owner_project: projectParam || prev.owner_project,
      website: websiteParam || prev.website,
    }));

    if (websiteParam) {
      setWebsiteCheckInput(websiteParam);
    }
    if (!isAddMode || projectParam) {
      setShowMetadataForm(true);
    }

    initializedFromQueryRef.current = true;
  }, [isAddMode, searchParams]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus !== "contracts" || !contractsSectionRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      contractsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
    return () => clearTimeout(timer);
  }, [searchParams, showMetadataForm]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.request) {
      return;
    }

    const syncAccounts = async () => {
      try {
        const accounts = (await window.ethereum?.request({
          method: "eth_accounts",
        })) as string[];
        if (Array.isArray(accounts) && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch {
        // no-op
      }
    };

    void syncAccounts();
  }, []);

  const normalizedProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        owner_project: asString(project.owner_project),
        display_name: asString(project.display_name),
        website: readProjectWebsite(project),
        main_github: readProjectGithub(project),
      })),
    [projects],
  );

  const projectsByOwner = useMemo(() => {
    const map = new Map<string, ProjectRecord>();
    for (const project of normalizedProjects) {
      const owner = asString(project.owner_project).toLowerCase();
      if (owner) {
        map.set(owner, project);
      }
    }
    return map;
  }, [normalizedProjects]);

  const normalizedOwnerProject = form.owner_project.trim().toLowerCase();
  const existingOwnerProject = normalizedOwnerProject
    ? projectsByOwner.get(normalizedOwnerProject)
    : undefined;

  useEffect(() => {
    if (!existingOwnerProject || mode !== "edit") {
      return;
    }
    const ownerKey = asString(existingOwnerProject.owner_project).toLowerCase();
    if (!ownerKey || ownerKey === autofilledOwnerRef.current) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      owner_project: asString(existingOwnerProject.owner_project) || prev.owner_project,
      display_name: asString(existingOwnerProject.display_name) || prev.display_name,
      description: asString(existingOwnerProject.description) || prev.description,
      website: readProjectWebsite(existingOwnerProject) || prev.website,
      main_github: readProjectGithub(existingOwnerProject) || prev.main_github,
      twitter: readProjectSocial(existingOwnerProject, "twitter") || prev.twitter,
      telegram: readProjectSocial(existingOwnerProject, "telegram") || prev.telegram,
    }));

    autofilledOwnerRef.current = ownerKey;
  }, [existingOwnerProject, mode]);

  const ownerValidation = useMemo(() => {
    if (!normalizedOwnerProject || normalizedProjects.length === 0) {
      return null;
    }
    return getProjectValidation(normalizedOwnerProject, normalizedProjects);
  }, [normalizedOwnerProject, normalizedProjects]);

  const ownerSuggestionMatches = useMemo(() => {
    if (!ownerValidation?.suggestions?.length) {
      return [];
    }
    return ownerValidation.suggestions
      .map((owner) => projectsByOwner.get(owner.toLowerCase()))
      .filter((project): project is ProjectRecord => Boolean(project))
      .map((project) => ({
        owner_project: asString(project.owner_project),
        display_name: toDisplayName(project),
        confidence: "similar" as const,
        field: "owner_project" as const,
      }));
  }, [ownerValidation, projectsByOwner]);

  const getSimilarityMatches = useCallback(
    (
      value: string,
      fieldType: ProjectSimilarityField,
      field: MatchField,
      sourceProjects = normalizedProjects,
    ): ExistingProjectMatch[] => {
      if (!value.trim() || sourceProjects.length === 0) {
        return [];
      }
      const sdkMatches = findSimilarProjectMatches(value, fieldType, sourceProjects, 5).map((match) =>
        mapSimilarityMatch(match, field),
      );
      const fallbackMatches = runFallbackUrlMatch(value, field, sourceProjects);
      return mergeMatches(sdkMatches, fallbackMatches);
    },
    [normalizedProjects],
  );

  const websiteMatches = useMemo(
    () => getSimilarityMatches(form.website, "website", "website"),
    [form.website, getSimilarityMatches],
  );

  const githubMatches = useMemo(
    () => getSimilarityMatches(form.main_github, "github", "github"),
    [form.main_github, getSimilarityMatches],
  );

  const allExistingMatches = useMemo(
    () => mergeMatches(ownerSuggestionMatches, websiteMatches, githubMatches),
    [ownerSuggestionMatches, websiteMatches, githubMatches],
  );

  const checkWebsiteForExistingProjects = useCallback(async () => {
    const input = websiteCheckInput.trim();
    if (!input) {
      return;
    }
    setIsCheckingWebsite(true);
    setWebsiteChecked(false);
    try {
      const website = ensureAbsoluteUrl(input);
      websiteCheckTargetRef.current = website;
      setForm((prev) => ({ ...prev, website }));

      const matches = getSimilarityMatches(website, "website", "website");
      setWebsiteCheckMatches(matches);
      setWebsiteChecked(true);
    } finally {
      setIsCheckingWebsite(false);
    }
  }, [getSimilarityMatches, websiteCheckInput]);

  const startManualProjectFlow = useCallback(() => {
    setShowMetadataForm(true);
    setProfilerError("");
    setProfilerInfo("");
    if (websiteCheckTargetRef.current) {
      setForm((prev) => ({
        ...prev,
        website: websiteCheckTargetRef.current,
      }));
    }
  }, []);

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof ProjectFormState, string>> = {};

    if (!form.owner_project.trim()) {
      errors.owner_project = "Owner project key is required.";
    } else if (!OWNER_PROJECT_PATTERN.test(form.owner_project.trim())) {
      errors.owner_project = "Use lowercase letters and numbers with '-' or '_' between words.";
    } else if (mode === "add" && existingOwnerProject) {
      errors.owner_project = "This key already exists. Switch to edit mode or use another key.";
    } else if (mode === "edit" && !existingOwnerProject) {
      errors.owner_project = "Project key not found in OSS directory.";
    }

    if (!form.display_name.trim()) {
      errors.display_name = "Display name is required.";
    }

    if (form.website.trim() && !isValidHttpUrl(form.website)) {
      errors.website = "Enter a valid website URL (for example https://example.com).";
    }
    if (form.main_github.trim() && !isValidHttpUrl(form.main_github)) {
      errors.main_github = "Enter a valid GitHub URL.";
    }
    if (form.twitter.trim() && !isValidHttpUrl(normalizeTwitterInput(form.twitter))) {
      errors.twitter = "Enter a valid X/Twitter URL or handle.";
    }
    if (form.telegram.trim() && !isValidHttpUrl(normalizeTelegramInput(form.telegram))) {
      errors.telegram = "Enter a valid Telegram URL or handle.";
    }

    return errors;
  }, [existingOwnerProject, form, mode]);

  const hasBlockingErrors = Object.values(validationErrors).some(Boolean);
  const canSubmitContribution =
    !hasBlockingErrors &&
    !isSubmittingContribution &&
    Boolean(form.owner_project.trim()) &&
    Boolean(form.display_name.trim());

  const chainOptions = useMemo<SearchDropdownOption[]>(() => {
    if (!masterData) {
      return [];
    }

    return Object.entries(masterData.chains)
      .filter(([chainKey]) => SupportedChainKeys.includes(chainKey))
      .map(([chainKey, chain]) => ({
        value: `eip155:${chain.evm_chain_id}`,
        label: chain.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [SupportedChainKeys, masterData]);

  const usageCategoryOptions = useMemo<SearchDropdownOption[]>(() => {
    if (!masterData?.blockspace_categories?.sub_categories) {
      return [];
    }
    return Object.entries(masterData.blockspace_categories.sub_categories)
      .map(([categoryKey, categoryLabel]) => ({
        value: categoryKey,
        label: categoryLabel,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [masterData]);

  const ownerProjectOptions = useMemo<SearchDropdownOption[]>(
    () =>
      normalizedProjects
        .map((project) => ({
          value: asString(project.owner_project),
          label: toDisplayName(project),
        }))
        .filter((option) => option.value)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [normalizedProjects],
  );

  const defaultQueueChainId = useMemo(() => {
    const baseOption = chainOptions.find((option) => option.value === "eip155:8453");
    if (baseOption) {
      return baseOption.value;
    }
    return chainOptions[0]?.value || "eip155:8453";
  }, [chainOptions]);

  const attestClient = useMemo(
    () =>
      new AttestClient({
        fetchProjects: async () => normalizedProjects,
      }),
    [normalizedProjects],
  );

  const singleController = useSingleAttestUI(attestClient, {
    mode: "simpleProfile",
    initialRow: {
      chain_id: defaultQueueChainId,
      owner_project: form.owner_project.trim(),
    },
    validationOptions: {
      projects: normalizedProjects,
    },
  });

  const bulkController = useBulkCsvAttestUI(attestClient, {
    mode: "simpleProfile",
    initialRows: [
      {
        chain_id: defaultQueueChainId,
        owner_project: form.owner_project.trim(),
      },
    ],
    initialColumns: QUEUE_EDITABLE_FIELDS,
    allowedFields: QUEUE_EDITABLE_FIELDS,
    validationOptions: {
      projects: normalizedProjects,
      maxRows: MAX_QUEUE_ROWS,
    },
  });

  const prepareRowForQueue = useCallback(
    (row: AttestationRowInput): AttestationRowInput => {
      const ownerFallback = form.owner_project.trim();
      return {
        ...row,
        chain_id: toStringValue(row.chain_id).trim() || defaultQueueChainId,
        address: toStringValue(row.address).trim().toLowerCase(),
        contract_name: toStringValue(row.contract_name).trim(),
        owner_project: toStringValue(row.owner_project).trim() || ownerFallback,
        usage_category: toStringValue(row.usage_category).trim(),
      };
    },
    [defaultQueueChainId, form.owner_project],
  );

  const meaningfulRows = useMemo(() => {
    return bulkController.rows
      .filter((row) => hasMeaningfulRowData(row))
      .map((row) => prepareRowForQueue(row));
  }, [bulkController.rows, prepareRowForQueue]);

  const currentQueueSignature = useMemo(
    () => meaningfulRows.map(rowPreviewSignature).join("||"),
    [meaningfulRows],
  );

  const isSingleFlow = meaningfulRows.length <= 1;

  const syncSingleFormFromQueue = useCallback(() => {
    if (!isSingleFlow) {
      return;
    }
    const row = meaningfulRows[0] || bulkController.rows[0];
    if (!row) {
      singleController.setRow(
        prepareRowForQueue({
          chain_id: defaultQueueChainId,
          owner_project: form.owner_project.trim(),
        }),
      );
      return;
    }
    singleController.setRow(prepareRowForQueue(row));
  }, [
    bulkController.rows,
    defaultQueueChainId,
    form.owner_project,
    isSingleFlow,
    meaningfulRows,
    prepareRowForQueue,
    singleController,
  ]);

  useEffect(() => {
    syncSingleFormFromQueue();
  }, [isSingleFlow, syncSingleFormFromQueue]);

  useEffect(() => {
    if (!queueSubmitPreview) {
      return;
    }
    if (queueSubmitPreview.rowsSignature === currentQueueSignature) {
      return;
    }
    setQueueSubmitPreview(null);
  }, [currentQueueSignature, queueSubmitPreview]);

  useEffect(() => {
    if (!form.owner_project.trim() || bulkController.rows.length === 0) {
      return;
    }
    const owner = form.owner_project.trim();
    const nextRows = bulkController.rows.map((row) => {
      const currentOwner = toStringValue(row.owner_project).trim();
      if (currentOwner) {
        return row;
      }
      return { ...row, owner_project: owner };
    });
    bulkController.setRows(nextRows);
  }, [bulkController, form.owner_project]);

  const mergeRowsIntoQueue = useCallback(
    (rows: AttestationRowInput[]) => {
      const byRowKey = new Map<string, AttestationRowInput>();
      const pushRow = (raw: AttestationRowInput) => {
        const row = prepareRowForQueue(raw);
        if (!hasMeaningfulRowData(row)) {
          return;
        }
        const rowKey = getQueueRowKey(
          toStringValue(row.chain_id).trim(),
          toStringValue(row.address).trim().toLowerCase(),
          toStringValue(row.owner_project).trim(),
        );
        if (!byRowKey.has(rowKey)) {
          byRowKey.set(rowKey, row);
        }
      };

      meaningfulRows.forEach(pushRow);
      rows.forEach(pushRow);

      const merged = Array.from(byRowKey.values()).slice(0, MAX_QUEUE_ROWS);
      bulkController.setRows(
        merged.length > 0
          ? merged
          : [
              prepareRowForQueue({
                chain_id: defaultQueueChainId,
                owner_project: form.owner_project.trim(),
              }),
            ],
      );
    },
    [bulkController, defaultQueueChainId, form.owner_project, meaningfulRows, prepareRowForQueue],
  );

  const queueStats = useMemo(() => {
    const diagnostics = bulkController.diagnostics;
    return {
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      suggestions: diagnostics.suggestions.length,
      conversions: diagnostics.conversions.length,
    };
  }, [bulkController.diagnostics]);

  const importCsvFile = useCallback(
    async (file: File) => {
      const csvText = await file.text();
      setQueueError(null);
      setQueueErrorFromValidation(false);
      setSubmitError(null);
      setSingleSubmitResult(null);
      setBulkSubmitResult(null);
      setQueueSubmitPreview(null);

      try {
        const parsed = await bulkController.parseCsvText(csvText, {
          projects: normalizedProjects,
          allowedFields: QUEUE_EDITABLE_FIELDS,
        });
        mergeRowsIntoQueue(parsed.rows);
        setShouldAutoValidateAfterImport(true);
      } catch (error: any) {
        setQueueError(error?.message || "CSV parsing failed.");
        setQueueErrorFromValidation(false);
      }
    },
    [bulkController, mergeRowsIntoQueue, normalizedProjects],
  );

  const onCsvInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await importCsvFile(file);
    event.target.value = "";
  };

  const runQueueValidation = useCallback(
    async (): Promise<{ flow: "single" | "bulk"; rows: AttestationRowInput[] } | null> => {
      try {
        if (isSingleFlow) {
          const row = meaningfulRows[0] || bulkController.rows[0];
          if (!row) {
            setQueueError("Add at least one row before validating.");
            setQueueErrorFromValidation(true);
            return null;
          }

          const normalizedRow = prepareRowForQueue(row);
          singleController.setRow(normalizedRow);
          const result = await singleController.validate({ projects: normalizedProjects });
          if (!result.valid) {
            const message = result.diagnostics.errors[0]?.message || "Single row validation failed.";
            setQueueError(message);
            setQueueErrorFromValidation(true);
            return null;
          }

          setQueueError(null);
          setQueueErrorFromValidation(false);
          return {
            flow: "single",
            rows: [result.row],
          };
        }

        const bulkResult = await bulkController.validate({
          projects: normalizedProjects,
          maxRows: MAX_QUEUE_ROWS,
        });
        if (!bulkResult.valid) {
          const message = bulkResult.diagnostics.errors[0]?.message || "Bulk validation failed.";
          setQueueError(message);
          setQueueErrorFromValidation(true);
          return null;
        }

        setQueueError(null);
        setQueueErrorFromValidation(false);
        return {
          flow: "bulk",
          rows: bulkResult.validRows,
        };
      } catch (error: any) {
        setQueueError(error?.message || "Validation failed.");
        setQueueErrorFromValidation(true);
        return null;
      }
    },
    [
      isSingleFlow,
      meaningfulRows,
      bulkController,
      singleController,
      prepareRowForQueue,
      normalizedProjects,
    ],
  );

  const validateQueue = useCallback(async () => {
    setSubmitError(null);
    await runQueueValidation();
  }, [runQueueValidation]);

  useEffect(() => {
    if (!shouldAutoValidateAfterImport) {
      return;
    }

    let cancelled = false;
    const validateAfterImport = async () => {
      await runQueueValidation();
      if (!cancelled) {
        setShouldAutoValidateAfterImport(false);
      }
    };

    void validateAfterImport();
    return () => {
      cancelled = true;
    };
  }, [runQueueValidation, shouldAutoValidateAfterImport]);

  const updateField = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
    setContributionResult(null);
    setSubmitError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        return;
      }
      setLogoUpload({
        base64: result,
        fileName: file.name,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const runProfiler = useCallback(
    async (websiteOverride?: string) => {
      const website = (websiteOverride || form.website).trim();
      if (!website) {
        setProfilerError("Add a website first to run AI Project Profiler.");
        return false;
      }

      setProfilerError("");
      setProfilerInfo("");
      setIsProfiling(true);

      try {
        const response = await fetch("/api/labels/project-profiler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: buildProfilerPrompt(website),
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          yaml?: string;
          error?: string;
        };

        if (!response.ok || !data.yaml) {
          throw new Error(data.error || "Failed to run profiler.");
        }

        const parsed = parseProfilerYaml(data.yaml);
        setForm((prev) => ({
          ...prev,
          owner_project: parsed.owner_project
            ? normalizeOwnerProjectInput(parsed.owner_project)
            : prev.owner_project,
          display_name: parsed.display_name || prev.display_name,
          description: parsed.description || prev.description,
          website: parsed.website || ensureAbsoluteUrl(prev.website),
          main_github: parsed.main_github || prev.main_github,
          twitter: parsed.twitter || prev.twitter,
          telegram: parsed.telegram || prev.telegram,
        }));

        setShowMetadataForm(true);
        setProfilerInfo("AI profile completed. Review values before submitting.");
        return true;
      } catch (error: any) {
        setProfilerError(error?.message || "Failed to run profiler.");
        return false;
      } finally {
        setIsProfiling(false);
      }
    },
    [form.website],
  );

  const submitProjectContribution = async () => {
    if (!canSubmitContribution) {
      return;
    }

    setIsSubmittingContribution(true);
    setSubmitError(null);
    setContributionResult(null);

    try {
      const response = await fetch("/api/labels/project-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          project: {
            owner_project: form.owner_project.trim().toLowerCase(),
            display_name: form.display_name.trim(),
            description: form.description.trim(),
            website: ensureAbsoluteUrl(form.website),
            main_github: ensureAbsoluteUrl(form.main_github),
            twitter: normalizeTwitterInput(form.twitter),
            telegram: normalizeTelegramInput(form.telegram),
          },
          logo: logoUpload
            ? {
                base64: logoUpload.base64,
                fileName: logoUpload.fileName,
                mimeType: logoUpload.mimeType,
              }
            : undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        yamlPullRequestUrl?: string;
        logoPullRequestUrl?: string | null;
        yamlBranchName?: string;
        logoBranchName?: string | null;
      };

      if (!response.ok || !data.yamlPullRequestUrl) {
        throw new Error(data.error || "Failed to submit project contribution.");
      }

      setContributionResult({
        yamlPullRequestUrl: data.yamlPullRequestUrl,
        logoPullRequestUrl: data.logoPullRequestUrl ?? null,
        yamlBranchName: data.yamlBranchName,
        logoBranchName: data.logoBranchName,
      });
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to submit project contribution.");
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const connectWallet = useCallback(async () => {
    if (!window.ethereum?.request) {
      setWalletError("No injected wallet found. Install a wallet extension to submit attestations.");
      return;
    }
    setWalletError(null);
    setIsConnectingWallet(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletError("No wallet account returned.");
      }
    } catch (error: any) {
      setWalletError(error?.message || "Wallet connection failed.");
    } finally {
      setIsConnectingWallet(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  const buildWalletAdapter = useCallback(() => {
    if (!walletAddress) {
      throw new Error("Connect wallet before submitting attestations.");
    }
    if (!window.ethereum?.request) {
      throw new Error("Injected wallet provider not found.");
    }

    const ethereum = window.ethereum;
    const primaryWallet = {
      address: walletAddress,
      connector: { name: "Injected" },
      switchNetwork: async (chainId: number) => {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      },
      getWalletClient: async () =>
        createWalletClient({
          account: walletAddress as `0x${string}`,
          transport: custom(ethereum),
        }) as any,
    };

    return createDynamicWalletAdapter(primaryWallet);
  }, [walletAddress]);

  const prepareQueueSubmitPreview = useCallback(async () => {
    setSubmitError(null);
    setSingleSubmitResult(null);
    setBulkSubmitResult(null);
    setQueueSubmitPreview(null);

    if (!walletAddress) {
      setSubmitError("Connect wallet before submitting attestations.");
      return;
    }

    setIsPreparingSubmitPreview(true);
    try {
      const validation = await runQueueValidation();
      if (!validation) {
        return;
      }

      const preparedRows = await Promise.all(
        validation.rows.map((row) =>
          attestClient.prepareSingleAttestation(row, {
            mode: "simpleProfile",
            projects: normalizedProjects,
            validate: false,
          }),
        ),
      );

      if (preparedRows.length === 0) {
        setSubmitError("No valid rows available for transaction preview.");
        return;
      }

      setQueueSubmitPreview({
        flow: validation.flow,
        preparedRows,
        rowsSignature: validation.rows.map(rowPreviewSignature).join("||"),
      });
    } catch (error: any) {
      setSubmitError(error?.message || "Could not prepare transaction preview.");
    } finally {
      setIsPreparingSubmitPreview(false);
    }
  }, [walletAddress, runQueueValidation, attestClient, normalizedProjects]);

  const confirmQueueSubmit = useCallback(async () => {
    if (!queueSubmitPreview) {
      return;
    }

    setSubmitError(null);
    setWalletError(null);

    let walletAdapter: ReturnType<typeof createDynamicWalletAdapter>;
    try {
      walletAdapter = buildWalletAdapter();
    } catch (error: any) {
      setWalletError(error?.message || "Could not build wallet adapter.");
      return;
    }

    setIsSubmittingFromPreview(true);
    try {
      if (queueSubmitPreview.flow === "single") {
        const result = await attestClient.submitSingleOnchain(
          queueSubmitPreview.preparedRows[0],
          walletAdapter,
        );
        setSingleSubmitResult(result);
      } else {
        const result = await attestClient.submitBulkOnchain(
          queueSubmitPreview.preparedRows,
          walletAdapter,
        );
        setBulkSubmitResult(result);
      }
      setQueueSubmitPreview(null);
    } catch (error: any) {
      setSubmitError(error?.message || "Attestation submission failed.");
    } finally {
      setIsSubmittingFromPreview(false);
    }
  }, [attestClient, buildWalletAdapter, queueSubmitPreview]);

  const addQueueRow = useCallback(() => {
    const row = prepareRowForQueue({
      chain_id: defaultQueueChainId,
      owner_project: form.owner_project.trim(),
    });
    bulkController.addRow(row);
  }, [bulkController, defaultQueueChainId, form.owner_project, prepareRowForQueue]);

  const removeQueueRow = useCallback(
    (rowIndex: number) => {
      bulkController.removeRow(rowIndex);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  const setQueueCellValue = useCallback(
    (rowIndex: number, field: QueueEditableField, value: string) => {
      bulkController.setCell(rowIndex, field, value);
      setQueueError(null);
      setQueueErrorFromValidation(false);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  const switchToAddRoute = () => {
    router.push("/applications/add");
  };

  const switchToEditRoute = () => {
    const owner = form.owner_project.trim();
    if (owner) {
      router.push(`/applications/edit?project=${owner}`);
      return;
    }
    router.push("/applications/edit");
  };

  const visibleQueueError = useMemo(() => {
    if (!queueError) {
      return null;
    }
    if (queueErrorFromValidation) {
      return `Validation: ${queueError}`;
    }
    return queueError;
  }, [queueError, queueErrorFromValidation]);

  const activeQueueView = isSingleFlow ? "single" : "bulk";

  return (
    <Container className="pt-[45px] md:pt-[30px] pb-[80px]">
      <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-y-[14px]">
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <div className="flex flex-col gap-y-[4px]">
            <Heading as="h1" className="heading-large-md md:heading-large-lg">
              Project Profile
            </Heading>
            <p className="text-sm text-color-text-secondary">
              Add or edit project metadata, then validate and submit contract attestations.
            </p>
          </div>
          <div className="flex items-center gap-x-[8px]">
            <button
              type="button"
              onClick={switchToAddRoute}
              className={`rounded-full px-[14px] py-[8px] text-sm transition-all ${
                isAddMode
                  ? "bg-color-text-primary text-color-bg-default"
                  : "bg-color-bg-medium text-color-text-secondary hover:text-color-text-primary"
              }`}
            >
              Add new
            </button>
            <button
              type="button"
              onClick={switchToEditRoute}
              className={`rounded-full px-[14px] py-[8px] text-sm transition-all ${
                !isAddMode
                  ? "bg-color-text-primary text-color-bg-default"
                  : "bg-color-bg-medium text-color-text-secondary hover:text-color-text-primary"
              }`}
            >
              Edit existing
            </button>
          </div>
        </div>

        {!showMetadataForm && isAddMode && (
          <section className="rounded-[16px] border border-color-ui-shadow bg-color-bg-default p-[14px]">
            <div className="flex flex-col gap-y-[8px]">
              <div className="text-base font-medium">Start with your website</div>
              <p className="text-xs text-color-text-secondary">
                Enter your website to check if your project already exists in OSS directory.
              </p>
              <div className="flex flex-wrap items-center gap-[8px]">
                <input
                  value={websiteCheckInput}
                  onChange={(event) => setWebsiteCheckInput(event.target.value)}
                  placeholder="https://yourproject.xyz"
                  className="h-[40px] min-w-[260px] flex-1 rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                />
                <button
                  type="button"
                  onClick={checkWebsiteForExistingProjects}
                  disabled={isCheckingWebsite || !websiteCheckInput.trim()}
                  className="h-[40px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[14px] text-sm disabled:opacity-60"
                >
                  {isCheckingWebsite ? "Checking..." : "Check website"}
                </button>
              </div>

              {websiteChecked && websiteCheckMatches.length > 0 && (
                <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px]">
                  <div className="text-xs font-medium">Project already found</div>
                  <p className="mt-[4px] text-xs text-color-text-secondary">
                    We found matching entries. Open one of these in edit mode:
                  </p>
                  <div className="mt-[8px] flex flex-wrap gap-[8px]">
                    {websiteCheckMatches.map((match) => (
                      <Link
                        key={`${match.owner_project}-${match.field}`}
                        href={`/applications/edit?project=${match.owner_project}&focus=contracts`}
                        className="inline-flex items-center gap-x-[6px] rounded-full bg-color-bg-default px-[10px] py-[5px] text-xs hover:bg-color-ui-hover"
                      >
                        <span className="font-medium">{match.display_name}</span>
                        <span className="text-color-text-secondary">({match.field})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {websiteChecked && websiteCheckMatches.length === 0 && (
                <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px]">
                  <div className="text-xs font-medium">
                    No matching website found in OSS directory.
                  </div>
                  <div className="mt-[8px] flex flex-wrap gap-[8px]">
                    <button
                      type="button"
                      onClick={startManualProjectFlow}
                      className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                    >
                      Add metadata manually
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        startManualProjectFlow();
                        await runProfiler(websiteCheckTargetRef.current || websiteCheckInput);
                      }}
                      className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                    >
                      Use AI profiler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {showMetadataForm && (
          <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-y-[14px]">
              <section className="rounded-[16px] border border-color-ui-shadow bg-color-bg-default p-[14px]">
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <div className="flex flex-col gap-y-[2px]">
                    <div className="text-base font-medium">AI Project Profiler</div>
                    <div className="text-xs text-color-text-secondary">
                      Use the Website field to auto-fill project metadata.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isProfiling}
                    onClick={() => runProfiler()}
                    className="rounded-full border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[8px] text-sm disabled:opacity-60"
                  >
                    {isProfiling ? "Profiling..." : "Profile from website"}
                  </button>
                </div>
                {profilerError && <p className="mt-[8px] text-xs text-color-negative">{profilerError}</p>}
                {profilerInfo && <p className="mt-[8px] text-xs text-color-positive">{profilerInfo}</p>}
              </section>

              <section className="rounded-[16px] border border-color-ui-shadow bg-color-bg-default p-[14px]">
                <div className="mb-[12px] text-sm font-medium">Project logo</div>
                <div className="mb-[14px] flex items-start gap-x-[12px]">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={onLogoChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative flex size-[84px] items-center justify-center overflow-hidden rounded-full border border-color-ui-shadow bg-color-bg-medium"
                    >
                      {logoUpload?.previewUrl ? (
                        <img
                          src={logoUpload.previewUrl}
                          alt="Project logo preview"
                          className="size-full object-cover"
                        />
                      ) : (
                        <GTPIcon icon="gtp-project-monochrome" size="lg" className="text-color-ui-hover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon icon="feather:edit-2" className="text-white size-[16px]" />
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-y-[3px] pt-[4px]">
                    <div className="text-xs text-color-text-secondary">
                      Upload a project logo (optional).
                    </div>
                    <div className="text-xs text-color-text-secondary">
                      {logoUpload?.fileName || "No logo selected yet."}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-[12px] md:grid-cols-2">
                  <div>
                    <label className="mb-[6px] block text-xs text-color-text-secondary">Owner project key</label>
                    <input
                      value={form.owner_project}
                      onChange={(event) =>
                        updateField("owner_project", normalizeOwnerProjectInput(event.target.value))
                      }
                      placeholder="owner_project"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.owner_project ? (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.owner_project}</p>
                    ) : (
                      <p className="mt-[6px] text-xs text-color-text-secondary">
                        Use a short lowercase key, for example: uniswap.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs text-color-text-secondary">Display name</label>
                    <input
                      value={form.display_name}
                      onChange={(event) => updateField("display_name", event.target.value)}
                      placeholder="Project name"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.display_name && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.display_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs text-color-text-secondary">Website</label>
                    <input
                      value={form.website}
                      onChange={(event) => updateField("website", event.target.value)}
                      placeholder="https://"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.website && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.website}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs text-color-text-secondary">GitHub</label>
                    <input
                      value={form.main_github}
                      onChange={(event) => updateField("main_github", event.target.value)}
                      placeholder="https://github.com/your-org"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.main_github && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.main_github}</p>
                    )}
                  </div>
                </div>

                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    className="rounded-full bg-color-bg-medium px-[10px] py-[5px] text-xs text-color-text-primary"
                  >
                    Add Twitter / X
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-color-bg-medium px-[10px] py-[5px] text-xs text-color-text-primary"
                  >
                    Add Telegram
                  </button>
                </div>

                <div className="mt-[8px] grid grid-cols-1 gap-[12px] md:grid-cols-2">
                  <div>
                    <input
                      value={form.twitter}
                      onChange={(event) => updateField("twitter", event.target.value)}
                      placeholder="https://x.com/yourproject or @yourproject"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.twitter && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.twitter}</p>
                    )}
                  </div>

                  <div>
                    <input
                      value={form.telegram}
                      onChange={(event) => updateField("telegram", event.target.value)}
                      placeholder="https://t.me/yourproject or @yourproject"
                      className="h-[42px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] text-sm outline-none focus:border-color-ui-hover"
                    />
                    {validationErrors.telegram && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.telegram}</p>
                    )}
                  </div>
                </div>

                <div className="mt-[12px]">
                  <label className="mb-[6px] block text-xs text-color-text-secondary">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Short project description"
                    className="min-h-[92px] w-full rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-sm outline-none focus:border-color-ui-hover"
                  />
                </div>

                {allExistingMatches.length > 0 && (
                  <div className="mt-[12px] rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px]">
                    <div className="text-xs font-medium text-color-text-primary">
                      Your project might already exist.
                    </div>
                    <div className="mt-[4px] text-xs text-color-text-secondary">
                      We check by project key, website and GitHub.
                    </div>
                    <div className="mt-[8px] flex flex-wrap gap-[8px]">
                      {allExistingMatches.map((match) => (
                        <Link
                          key={`${match.owner_project}-${match.field}`}
                          href={`/applications/${match.owner_project}`}
                          className="inline-flex items-center gap-x-[6px] rounded-full bg-color-bg-default px-[10px] py-[5px] text-xs hover:bg-color-ui-hover"
                        >
                          <span className="font-medium">{match.display_name}</span>
                          <span className="text-color-text-secondary">({match.field})</span>
                          {match.confidence === "exact" && (
                            <span className="text-color-positive">exact</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-[14px] rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px]">
                  <div className="flex flex-wrap items-center justify-between gap-[10px]">
                    <div className="flex flex-col gap-y-[2px]">
                      <div className="text-sm font-medium">Submit project contribution</div>
                      <div className="text-xs text-color-text-secondary">
                        Creates a YAML pull request and optionally a logo pull request.
                      </div>
                      <div className="text-xs text-color-text-secondary">
                        {logoUpload
                          ? "Logo update selected."
                          : "No logo update selected. This will create a YAML-only pull request."}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canSubmitContribution}
                      onClick={submitProjectContribution}
                      className="rounded-full border border-color-ui-shadow bg-color-bg-default px-[14px] py-[9px] text-sm disabled:opacity-60"
                    >
                      {isSubmittingContribution ? "Creating GitHub PR..." : "Create GitHub PR"}
                    </button>
                  </div>
                </div>

                {submitError && <p className="mt-[8px] text-xs text-color-negative">{submitError}</p>}
                {contributionResult && (
                  <div className="mt-[10px] rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px] text-sm">
                    <div className="font-medium text-color-text-primary">Contribution created</div>
                    <div className="mt-[6px] flex flex-col gap-y-[4px]">
                      <Link
                        href={contributionResult.yamlPullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        YAML PR
                      </Link>
                      {contributionResult.logoPullRequestUrl && (
                        <Link
                          href={contributionResult.logoPullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          Logo PR
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section
                ref={contractsSectionRef}
                className="rounded-[16px] border border-color-ui-shadow bg-color-bg-default p-[14px]"
              >
                <div className="mb-[12px] flex items-center justify-between gap-[10px]">
                  <div>
                    <h2 className="heading-small-md">Add your contracts</h2>
                    <div className="text-xs text-color-text-secondary mt-[2px]">
                      Validate queue rows and submit onchain attestations.
                    </div>
                  </div>

                  <div className="flex items-center gap-[8px]">
                    {walletAddress ? (
                      <button
                        type="button"
                        className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[12px] text-xs"
                        onClick={disconnectWallet}
                      >
                        {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[12px] text-xs"
                        onClick={connectWallet}
                        disabled={isConnectingWallet}
                      >
                        {isConnectingWallet ? "Connecting..." : "Connect wallet"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-[12px] grid grid-cols-2 gap-[8px] text-xs md:grid-cols-4">
                  <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[8px]">
                    Queue rows: <span className="font-semibold">{meaningfulRows.length}</span>
                  </div>
                  <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[8px]">
                    Errors: <span className="font-semibold">{queueStats.errors}</span>
                  </div>
                  <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[8px]">
                    Warnings: <span className="font-semibold">{queueStats.warnings}</span>
                  </div>
                  <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[8px]">
                    Suggestions: <span className="font-semibold">{queueStats.suggestions}</span>
                  </div>
                </div>

                <div className="mb-[12px] rounded-[12px] border border-color-ui-shadow bg-color-bg-medium p-[12px]">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={onCsvInputChange}
                    />
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={() => csvInputRef.current?.click()}
                    >
                      Upload CSV
                    </button>
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={addQueueRow}
                    >
                      Add row
                    </button>
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={validateQueue}
                      disabled={bulkController.validation.loading || singleController.validation.loading}
                    >
                      {bulkController.validation.loading || singleController.validation.loading
                        ? "Validating..."
                        : "Validate queue"}
                    </button>
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={prepareQueueSubmitPreview}
                      disabled={
                        !walletAddress ||
                        meaningfulRows.length === 0 ||
                        isPreparingSubmitPreview ||
                        isSubmittingFromPreview
                      }
                    >
                      {isPreparingSubmitPreview
                        ? "Preparing preview..."
                        : isSubmittingFromPreview
                        ? "Submitting..."
                        : `Review & submit (${meaningfulRows.length})`}
                    </button>
                  </div>

                  {bulkController.csv.result && (
                    <div className="mt-[8px] grid grid-cols-2 gap-[8px] text-xs md:grid-cols-4">
                      <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-default px-[10px] py-[8px]">
                        Parsed rows:{" "}
                        <span className="font-semibold">{bulkController.csv.result.rows.length}</span>
                      </div>
                      <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-default px-[10px] py-[8px]">
                        CSV errors:{" "}
                        <span className="font-semibold">
                          {bulkController.csv.result.diagnostics.errors.length}
                        </span>
                      </div>
                      <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-default px-[10px] py-[8px]">
                        CSV warnings:{" "}
                        <span className="font-semibold">
                          {bulkController.csv.result.diagnostics.warnings.length}
                        </span>
                      </div>
                      <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-default px-[10px] py-[8px]">
                        Suggestions:{" "}
                        <span className="font-semibold">
                          {bulkController.csv.result.diagnostics.suggestions.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-[12px] border border-color-ui-shadow">
                  <table className="w-full min-w-[980px] border-separate border-spacing-y-0 text-xs">
                    <thead className="bg-color-bg-medium">
                      <tr className="text-color-text-secondary">
                        <th className="px-[8px] py-[8px] text-left font-medium">#</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Chain</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Address</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Contract name</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Owner project</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Usage category</th>
                        <th className="px-[8px] py-[8px] text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkController.rows.map((row, rowIndex) => {
                        const chainId = toStringValue(row.chain_id).trim() || defaultQueueChainId;
                        const ownerProject = toStringValue(row.owner_project).trim();
                        const usageCategory = toStringValue(row.usage_category).trim();
                        const rowDiagnostics = bulkController.getRowDiagnostics(rowIndex);
                        const rowError = rowDiagnostics.errors[0]?.message;

                        return (
                          <tr key={`${rowIndex}-${rowPreviewSignature(row)}`}>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              {rowIndex + 1}
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <select
                                value={chainId}
                                className="h-[34px] w-[160px] rounded-[8px] border border-color-ui-shadow bg-color-bg-default px-[8px]"
                                onChange={(event) =>
                                  setQueueCellValue(rowIndex, "chain_id", event.target.value)
                                }
                              >
                                {withCurrentDropdownOption(chainOptions, chainId).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <input
                                value={toStringValue(row.address)}
                                className="h-[34px] w-[240px] rounded-[8px] border border-color-ui-shadow bg-color-bg-default px-[8px]"
                                placeholder="0x..."
                                onChange={(event) =>
                                  setQueueCellValue(rowIndex, "address", event.target.value)
                                }
                              />
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <input
                                value={toStringValue(row.contract_name)}
                                className="h-[34px] w-[180px] rounded-[8px] border border-color-ui-shadow bg-color-bg-default px-[8px]"
                                placeholder="Contract name"
                                onChange={(event) =>
                                  setQueueCellValue(rowIndex, "contract_name", event.target.value)
                                }
                              />
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <select
                                value={ownerProject}
                                className="h-[34px] w-[180px] rounded-[8px] border border-color-ui-shadow bg-color-bg-default px-[8px]"
                                onChange={(event) =>
                                  setQueueCellValue(rowIndex, "owner_project", event.target.value)
                                }
                              >
                                <option value="">Select owner_project</option>
                                {withCurrentDropdownOption(ownerProjectOptions, ownerProject).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <select
                                value={usageCategory}
                                className="h-[34px] w-[180px] rounded-[8px] border border-color-ui-shadow bg-color-bg-default px-[8px]"
                                onChange={(event) =>
                                  setQueueCellValue(rowIndex, "usage_category", event.target.value)
                                }
                              >
                                <option value="">Select category</option>
                                {withCurrentDropdownOption(usageCategoryOptions, usageCategory).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-t border-color-ui-shadow px-[8px] py-[8px] align-top">
                              <button
                                type="button"
                                className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[10px] text-xxs"
                                onClick={() => removeQueueRow(rowIndex)}
                              >
                                Remove
                              </button>
                              {rowError && (
                                <div className="mt-[6px] max-w-[180px] text-xxs text-color-negative">
                                  {rowError}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {queueSubmitPreview && (
                  <div className="mt-[10px] rounded-[12px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-xs">
                    <div className="font-semibold">Transaction preview</div>
                    <div className="mt-[2px] text-color-text-secondary">
                      Final validation passed. Review payloads before signing{" "}
                      {queueSubmitPreview.preparedRows.length} transaction
                      {queueSubmitPreview.preparedRows.length === 1 ? "" : "s"}.
                    </div>

                    <div className="mt-[8px] max-h-[260px] overflow-auto rounded-[10px] border border-color-ui-shadow">
                      <table className="w-full min-w-[760px] border-separate border-spacing-y-[0px] text-xxs">
                        <thead className="sticky top-0 bg-color-bg-default">
                          <tr className="text-color-text-secondary">
                            <th className="px-[8px] py-[6px] text-left font-medium">#</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Chain</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Address</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Contract</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Owner</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Category</th>
                            <th className="px-[8px] py-[6px] text-left font-medium">Encoded data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queueSubmitPreview.preparedRows.map((prepared, index) => (
                            <tr key={`${prepared.chainId}-${prepared.address}-${index}`}>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {index + 1}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {prepared.chainId}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {prepared.address}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {toStringValue(prepared.raw.contract_name)}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {toStringValue(prepared.raw.owner_project)}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">
                                {toStringValue(prepared.raw.usage_category)}
                              </td>
                              <td className="border-t border-color-ui-shadow px-[8px] py-[6px] font-mono">
                                {truncateHex(prepared.encodedData)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-[10px] flex flex-wrap gap-[8px]">
                      <button
                        type="button"
                        className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                        onClick={() => setQueueSubmitPreview(null)}
                        disabled={isSubmittingFromPreview}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                        onClick={confirmQueueSubmit}
                        disabled={isSubmittingFromPreview}
                      >
                        {isSubmittingFromPreview
                          ? "Waiting for signature..."
                          : queueSubmitPreview.preparedRows.length === 1
                          ? "Sign transaction"
                          : `Sign ${queueSubmitPreview.preparedRows.length} transactions`}
                      </button>
                    </div>
                  </div>
                )}

                {(visibleQueueError || submitError || walletError) && (
                  <div className="mt-[10px] rounded-[12px] border border-color-negative/50 bg-color-negative/10 px-[12px] py-[10px] text-xs">
                    {visibleQueueError || submitError || walletError}
                  </div>
                )}

                {(singleSubmitResult || bulkSubmitResult) && (
                  <div className="mt-[10px] rounded-[12px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-xs">
                    <div className="font-semibold">Attestation submitted</div>
                    {singleSubmitResult && (
                      <div className="mt-[4px]">
                        Status: {singleSubmitResult.status}
                        {singleSubmitResult.txHash && (
                          <div className="mt-[2px]">
                            Tx:{" "}
                            <span className="font-mono">{truncateHex(singleSubmitResult.txHash, 18, 16)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {bulkSubmitResult && (
                      <div className="mt-[4px]">
                        Status: {bulkSubmitResult.status}
                        {bulkSubmitResult.txHash && (
                          <div className="mt-[2px]">
                            Tx:{" "}
                            <span className="font-mono">{truncateHex(bulkSubmitResult.txHash, 18, 16)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            <aside className="flex h-fit flex-col gap-y-[10px]">
              <div className="rounded-[14px] border border-color-ui-shadow bg-color-bg-default p-[12px]">
                <div className="text-sm font-medium">
                  {mode === "edit" ? "Editing Tips" : "Adding Tips"}
                </div>
                <ul className="mt-[8px] flex list-disc flex-col gap-y-[6px] pl-[16px] text-xs text-color-text-secondary">
                  {mode === "edit" ? (
                    <>
                      <li>Use the existing owner_project key to patch the right OSS entry.</li>
                      <li>Change only fields that need updates, then validate queue rows.</li>
                      <li>Use focus=contracts links to jump directly to contract attestations.</li>
                    </>
                  ) : (
                    <>
                      <li>Start with website check to avoid duplicate project entries.</li>
                      <li>Use AI profiler for fast draft metadata, then verify manually.</li>
                      <li>Prepare queue rows with CSV or manual input before submitting.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="rounded-[14px] border border-color-ui-shadow bg-color-bg-default p-[12px]">
                <div className="text-sm font-medium">Validation status</div>
                <div className="mt-[8px] flex flex-col gap-y-[6px] text-xs text-color-text-secondary">
                  <div className="flex items-center gap-x-[6px]">
                    <Icon icon={hasBlockingErrors ? "feather:alert-circle" : "feather:check-circle"} />
                    <span>{hasBlockingErrors ? "Fix metadata field errors" : "Metadata required fields look good"}</span>
                  </div>
                  <div className="flex items-center gap-x-[6px]">
                    <Icon icon={isLoadingProjects ? "feather:loader" : "feather:search"} />
                    <span>
                      {isLoadingProjects
                        ? "Checking existing projects..."
                        : `Directory check ready (${normalizedProjects.length} projects loaded).`}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-[6px]">
                    <Icon icon={activeQueueView === "single" ? "feather:file-text" : "feather:layers"} />
                    <span>Queue mode: {activeQueueView === "single" ? "Single row" : "Bulk rows"}</span>
                  </div>
                  {projectsError && <p className="text-color-negative">{projectsError}</p>}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Container>
  );
}
