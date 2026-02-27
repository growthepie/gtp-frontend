"use client";

import { ChangeEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createWalletClient, custom, defineChain } from "viem";
import Container from "@/components/layout/Container";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Title } from "@/components/layout/TextHeadingComponents";
import { useMaster } from "@/contexts/MasterContext";
import {
  buildProjectEditHref,
  getProjectEditIntentKey,
  parseProjectEditIntent,
} from "@/lib/project-edit-intent";
import {
  clearProjectEditContractSeed,
  readProjectEditContractSeed,
} from "@/lib/project-edit-contract-seed";
import {
  AttestClient,
  createDynamicWalletAdapter,
  fetchProjects,
  findSimilarProjectMatches,
  type AttestationDiagnostics,
  type AttestationRowInput,
  type BulkOnchainSubmitResult,
  type OnchainSubmitResult,
  type PreparedAttestation,
  type ProjectRecord,
  type ProjectSimilarityField,
  type ProjectSimilarityMatch,
} from "@openlabels/oli-sdk";
import { useBulkCsvAttestUI, useSingleAttestUI } from "@openlabels/oli-sdk/attest-ui";
import { validateAddressForChain } from "@openlabels/oli-sdk/validation";
import { useWalletConnection } from "@/contexts/WalletContext";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";

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

const EMPTY_FORM: ProjectFormState = {
  owner_project: "",
  display_name: "",
  description: "",
  website: "",
  main_github: "",
  twitter: "",
  telegram: "",
};

const EMPTY_QUEUE_DIAGNOSTICS: AttestationDiagnostics = {
  errors: [],
  warnings: [],
  conversions: [],
  suggestions: [],
};
const NO_OWNER_PROJECT_OPTION: SearchDropdownOption = {
  value: "",
  label: "No owner (wrong association)",
};

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

const extractCoreName = (website: string): string => {
  try {
    const hostname = new URL(ensureAbsoluteUrl(website)).hostname.replace(/^www\./, "");
    // Strip TLD(s): e.g. "huntergames.xyz" → "huntergames", "app.aave.com" → "aave"
    const parts = hostname.split(".");
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  } catch {
    return "";
  }
};

const hasMeaningfulRowData = (row: AttestationRowInput): boolean => {
  const address = toStringValue(row.address).trim();
  const contractName = toStringValue(row.contract_name).trim();
  const ownerProject = toStringValue(row.owner_project).trim();
  const usageCategory = toStringValue(row.usage_category).trim();
  return Boolean(address || contractName || ownerProject || usageCategory);
};

const hasRowDataExcludingOwner = (row: AttestationRowInput): boolean => {
  const address = toStringValue(row.address).trim();
  const contractName = toStringValue(row.contract_name).trim();
  const usageCategory = toStringValue(row.usage_category).trim();
  return Boolean(address || contractName || usageCategory);
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

const truncateMiddle = (addr: string, start = 12, end = 6): string => {
  if (!addr || addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
};

const TableCellSelect = ({
  value,
  placeholder,
  options,
  onSelect,
  showIcon,
  iconRenderer,
  iconOnly,
  width,
  error,
  triggerClassName,
}: {
  value: string;
  placeholder: string;
  options: SearchDropdownOption[];
  onSelect: (value: string) => void;
  showIcon?: boolean;
  iconRenderer?: (value: string) => ReactNode;
  iconOnly?: boolean;
  width?: string;
  error?: boolean;
  triggerClassName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 80);
    const s = search.toLowerCase();
    return options
      .filter((o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s))
      .slice(0, 80);
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const openPopup = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
    setSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const popup = open ? (
    <div
      ref={popupRef}
      style={popupStyle}
      className="p-[5px] bg-color-bg-medium rounded-[16px] shadow-[0px_0px_50px_0px_rgba(0,0,0,0.6)] flex flex-col"
    >
      <div className="w-full bg-color-ui-active rounded-[12px] flex flex-col overflow-hidden">
        <div className="px-[10px] py-[7px] border-b border-color-ui-shadow">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-color-text-secondary"
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={() => {
                onSelect(option.value);
                setOpen(false);
                setSearch("");
              }}
              className="w-full flex items-center gap-x-[8px] px-[10px] py-[7px] hover:bg-color-ui-hover text-left"
            >
              {(showIcon || iconRenderer) && (
                <div className="shrink-0 flex items-center justify-center size-[18px]">
                  {iconRenderer
                    ? iconRenderer(option.value)
                    : <ApplicationIcon owner_project={option.value} size="sm" />
                  }
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{option.label}</div>
                {showIcon && (
                  <div className="text-xxs text-color-text-secondary truncate">{option.value}</div>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-[10px] py-[8px] text-xs text-color-text-secondary">No options found</div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" style={width ? { width } : undefined}>
      {iconOnly ? (
        <button
          ref={triggerRef}
          type="button"
          className={`size-[28px] rounded-full flex items-center justify-center transition-colors ${error ? "bg-color-negative/15 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
          onClick={() => open ? (setOpen(false), setSearch("")) : openPopup()}
          title={value ? (options.find((o) => o.value === value)?.label ?? value) : placeholder}
        >
          {value && iconRenderer
            ? iconRenderer(value)
            : <Icon icon="feather:layers" className="size-[13px] text-color-text-secondary" />
          }
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className={`h-[24px] w-full flex items-center justify-between gap-x-[6px] rounded-full px-[10px] text-xs transition-colors ${error ? "bg-color-negative/20 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"} ${triggerClassName ?? ""}`}
          onClick={() => open ? (setOpen(false), setSearch("")) : openPopup()}
        >
          <span className="flex items-center gap-x-[6px] min-w-0 overflow-hidden">
            {value && iconRenderer && (
              <span className="shrink-0 flex items-center justify-center size-[15px]">
                {iconRenderer(value)}
              </span>
            )}
            <span className={`truncate ${value ? "" : "text-color-text-secondary"}`}>{value ? selectedLabel : placeholder}</span>
          </span>
          <Icon icon="feather:chevron-down" className="size-[10px] shrink-0 text-color-text-secondary" />
        </button>
      )}
      {typeof document !== "undefined" && popup && createPortal(popup, document.body)}
    </div>
  );
};

const FieldDropdown = ({
  suggestions,
  onSelect,
}: {
  suggestions: ProjectRecord[];
  onSelect: (p: ProjectRecord) => void;
}) => {
  if (!suggestions.length) return null;
  return (
    <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] p-[5px] bg-color-bg-medium rounded-[22px] shadow-[0px_0px_50px_0px_rgba(0,0,0,0.6)] flex flex-col">
      <div className="w-full bg-color-ui-active rounded-[16px] flex flex-col overflow-hidden">
        {suggestions.map((project, i) => (
          <button
            key={`${asString(project.owner_project)}-${i}`}
            type="button"
            onMouseDown={() => onSelect(project)}
            className="w-full flex items-center gap-x-[8px] px-[10px] py-[7px] hover:bg-color-ui-hover"
          >
            <div className="shrink-0">
              <ApplicationIcon owner_project={asString(project.owner_project)} size="sm" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-medium truncate">{toDisplayName(project)}</div>
              <div className="text-xxs text-color-text-secondary truncate leading-tight">
                {asString(project.owner_project)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ProjectEditPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const hydratedIntentRef = useRef("");
  const autofilledOwnerRef = useRef("");
  const importedContractSeedRef = useRef(false);
  const loadedFormRef = useRef<ProjectFormState>({ ...EMPTY_FORM });
  const websiteCheckTargetRef = useRef("");

  const { data: masterData, SupportedChainKeys } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const intent = useMemo(
    () =>
      parseProjectEditIntent({
        pathname: pathname || undefined,
        params: searchParams,
        defaultSource: "legacy",
      }),
    [pathname, searchParams],
  );
  const intentKey = useMemo(() => getProjectEditIntentKey(intent), [intent]);
  const mode: ProjectMode = intent.mode;
  const isAddMode = mode === "add";

  const [showMetadataForm, setShowMetadataForm] = useState(intent.start !== "website");
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
  const [lastValidatedQueueSignature, setLastValidatedQueueSignature] = useState("");
  const [lastValidatedQueueFlow, setLastValidatedQueueFlow] = useState<"single" | "bulk" | null>(null);
  const [lastValidatedSingleRowIndex, setLastValidatedSingleRowIndex] = useState<number | null>(null);
  const [singleSubmitResult, setSingleSubmitResult] = useState<OnchainSubmitResult | null>(null);
  const [bulkSubmitResult, setBulkSubmitResult] = useState<BulkOnchainSubmitResult | null>(null);
  const [contributionResult, setContributionResult] = useState<ContributionResult | null>(null);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);

  const [isProfiling, setIsProfiling] = useState(false);
  const [profilerError, setProfilerError] = useState("");
  const [profilerInfo, setProfilerInfo] = useState("");
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
  const [enhanceDescError, setEnhanceDescError] = useState("");
  const [enhanceDescInfo, setEnhanceDescInfo] = useState("");

  const [smartPasteOpen, setSmartPasteOpen] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [smartPasteChainMode, setSmartPasteChainMode] = useState<"auto" | "fixed">("auto");
  const [smartPasteFixedChain, setSmartPasteFixedChain] = useState("");

  const {
    walletAddress,
    isConnectingWallet,
    connectWallet: connectWalletFromContext,
    disconnectWallet: disconnectWalletFromContext,
  } = useWalletConnection();
  const [walletError, setWalletError] = useState<string | null>(null);
  const [activeDropdownField, setActiveDropdownField] = useState<keyof ProjectFormState | null>(null);
  const [addressEditRow, setAddressEditRow] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

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
    if (hydratedIntentRef.current === intentKey) {
      return;
    }
    hydratedIntentRef.current = intentKey;
    autofilledOwnerRef.current = "";

    setWebsiteChecked(false);
    setWebsiteCheckMatches([]);
    setProfilerError("");
    setProfilerInfo("");
    setShowMetadataForm(intent.start !== "website");

    setForm((prev) => {
      if (intent.mode === "add") {
        return {
          ...EMPTY_FORM,
          owner_project: intent.project || "",
          website: intent.website || "",
        };
      }
      return {
        ...prev,
        owner_project: intent.project || prev.owner_project,
        website: intent.website || prev.website,
      };
    });

    const normalizedWebsite = intent.website ? ensureAbsoluteUrl(intent.website) : "";
    setWebsiteCheckInput(normalizedWebsite);
    websiteCheckTargetRef.current = normalizedWebsite;
    setActiveStep(intent.focus === "contracts" ? 2 : 1);
  }, [intent, intentKey]);

  useEffect(() => {
    if (contributionResult) setActiveStep(2);
  }, [contributionResult]);

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

    setForm((prev) => {
      const updated: ProjectFormState = {
        ...prev,
        owner_project: asString(existingOwnerProject.owner_project) || prev.owner_project,
        display_name: asString(existingOwnerProject.display_name) || prev.display_name,
        description: asString(existingOwnerProject.description) || prev.description,
        website: readProjectWebsite(existingOwnerProject) || prev.website,
        main_github: readProjectGithub(existingOwnerProject) || prev.main_github,
        twitter: readProjectSocial(existingOwnerProject, "twitter") || prev.twitter,
        telegram: readProjectSocial(existingOwnerProject, "telegram") || prev.telegram,
      };
      loadedFormRef.current = updated;
      return updated;
    });

    autofilledOwnerRef.current = ownerKey;
  }, [existingOwnerProject, mode]);


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

  const ownerProjectSuggestions = useMemo(() => {
    const val = form.owner_project.trim().toLowerCase();
    if (!val) return [];
    return normalizedProjects
      .filter((p) => asString(p.owner_project).toLowerCase().includes(val))
      .slice(0, 6);
  }, [form.owner_project, normalizedProjects]);

  const displayNameSuggestions = useMemo(() => {
    const val = form.display_name.trim().toLowerCase();
    if (!val) return [];
    return normalizedProjects
      .filter(
        (p) =>
          asString(p.display_name).toLowerCase().includes(val) ||
          asString(p.owner_project).toLowerCase().includes(val),
      )
      .slice(0, 6);
  }, [form.display_name, normalizedProjects]);

  const websiteSuggestions = useMemo(() => {
    const val = normalizeUrlForComparison(form.website);
    if (!val) return [];
    return normalizedProjects
      .filter((p) => {
        const pUrl = normalizeUrlForComparison(readProjectWebsite(p));
        return pUrl && (pUrl.includes(val) || val.includes(pUrl));
      })
      .slice(0, 6);
  }, [form.website, normalizedProjects]);

  const githubSuggestions = useMemo(() => {
    const val = normalizeUrlForComparison(form.main_github);
    if (!val) return [];
    return normalizedProjects
      .filter((p) => {
        const pUrl = normalizeUrlForComparison(readProjectGithub(p));
        return pUrl && (pUrl.includes(val) || val.includes(pUrl));
      })
      .slice(0, 6);
  }, [form.main_github, normalizedProjects]);

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
  const collapsedOwnerProject = form.owner_project.trim();
  const collapsedDisplayName = form.display_name.trim() || collapsedOwnerProject;
  const collapsedLogoPath = ownerProjectToProjectData[collapsedOwnerProject]?.logo_path;
  const collapsedLogoSrc = logoUpload?.previewUrl
    || (collapsedLogoPath
      ? `https://api.growthepie.com/v1/apps/logos/${collapsedLogoPath}`
      : "");
  const hasWebsiteInSummary = Boolean(form.website.trim());
  const hasGithubInSummary = Boolean(form.main_github.trim());
  const hasTwitterInSummary = Boolean(form.twitter.trim());
  const hasTelegramInSummary = Boolean(form.telegram.trim());
  const hasCollapsedMetadataSummary = Boolean(
    collapsedDisplayName
    || collapsedLogoSrc
    || hasWebsiteInSummary
    || hasGithubInSummary
    || hasTwitterInSummary
    || hasTelegramInSummary,
  );
  const hasFormChanges = useMemo(() => {
    if (isAddMode) return true;
    if (logoUpload) return true;
    const loaded = loadedFormRef.current;
    return (Object.keys(form) as (keyof ProjectFormState)[]).some((k) => form[k] !== loaded[k]);
  }, [form, isAddMode, logoUpload]);
  const canSubmitContribution =
    !hasBlockingErrors &&
    !isSubmittingContribution &&
    Boolean(form.owner_project.trim()) &&
    Boolean(form.display_name.trim()) &&
    hasFormChanges;

  const formSuggestions = useMemo<{ icon: string; text: string }[]>(() => {
    if (!form.owner_project.trim() && !form.display_name.trim()) return [];
    const hints: { icon: string; text: string }[] = [];
    const descLen = form.description.trim().length;
    if (descLen === 0) {
      hints.push({ icon: "feather:file-text", text: "Add a description (aim for 350–500 characters)." });
    } else if (descLen < 350) {
      hints.push({ icon: "feather:file-text", text: `Description is ${descLen} chars — expand to 350–500 for best results.` });
    } else if (descLen > 500) {
      hints.push({ icon: "feather:file-text", text: `Description is ${descLen} chars — trim to under 500 for OSS directory.` });
    }
    const hasExistingLogo = !!ownerProjectToProjectData[form.owner_project.trim()]?.logo_path;
    if (!logoUpload && !hasExistingLogo) {
      hints.push({ icon: "feather:image", text: "No logo set — upload one to improve project visibility." });
    }
    if (!form.twitter.trim()) {
      hints.push({ icon: "feather:twitter", text: "Twitter / X handle missing — add it if the project has one." });
    }
    if (!form.telegram.trim()) {
      hints.push({ icon: "feather:send", text: "Telegram handle missing — add it if the project has one." });
    }
    return hints;
  }, [form, logoUpload, ownerProjectToProjectData]);

  const chainOptions = useMemo<SearchDropdownOption[]>(() => {
    if (!masterData) {
      return [];
    }

    const uniqueOptions = new Map<string, SearchDropdownOption>();

    for (const [chainKey, chain] of Object.entries(masterData.chains)) {
      if (!SupportedChainKeys.includes(chainKey)) {
        continue;
      }

      const chainIdRaw = (chain as { evm_chain_id?: unknown }).evm_chain_id;
      const chainId = typeof chainIdRaw === "number" || typeof chainIdRaw === "string"
        ? String(chainIdRaw).trim()
        : "";

      if (!chainId || chainId === "null" || chainId === "undefined") {
        continue;
      }

      const value = `eip155:${chainId}`;
      if (!uniqueOptions.has(value)) {
        uniqueOptions.set(value, {
          value,
          label: chain.name,
        });
      }
    }

    return Array.from(uniqueOptions.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [SupportedChainKeys, masterData]);

  const chainByEip155 = useMemo(() => {
    if (!masterData) return {} as Record<string, { urlKey: string; color: string }>;
    const map: Record<string, { urlKey: string; color: string }> = {};
    for (const [, chain] of Object.entries(masterData.chains)) {
      const c = chain as { evm_chain_id?: unknown; url_key?: string; colors?: { dark?: string[] } };
      const chainId = c.evm_chain_id != null ? String(c.evm_chain_id).trim() : "";
      if (!chainId || chainId === "null") continue;
      map[`eip155:${chainId}`] = {
        urlKey: c.url_key || "",
        color: c.colors?.dark?.[0] ?? "#CDD8D3",
      };
    }
    return map;
  }, [masterData]);

  const chainIconRenderer = useCallback(
    (value: string): ReactNode => {
      const info = chainByEip155[value];
      if (!info?.urlKey) return null;
      return (
        <Icon
          icon={`gtp:${info.urlKey}-logo-monochrome`}
          className="size-[15px] shrink-0"
          style={{ color: info.color }}
        />
      );
    },
    [chainByEip155],
  );

  const ownerProjectIconRenderer = useCallback(
    (value: string): ReactNode => {
      if (!value) {
        return <Icon icon="feather:unlink" className="size-[13px] text-color-text-secondary" />;
      }
      return <ApplicationIcon owner_project={value} size="sm" />;
    },
    [],
  );

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
    () => {
      const projectOptions = normalizedProjects
        .map((project) => ({
          value: asString(project.owner_project),
          label: toDisplayName(project),
        }))
        .filter((option) => option.value)
        .sort((a, b) => a.label.localeCompare(b.label));
      return [NO_OWNER_PROJECT_OPTION, ...projectOptions];
    },
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
      return {
        ...row,
        chain_id: toStringValue(row.chain_id).trim() || defaultQueueChainId,
        address: toStringValue(row.address).trim().toLowerCase(),
        contract_name: toStringValue(row.contract_name).trim(),
        owner_project: toStringValue(row.owner_project).trim(),
        usage_category: toStringValue(row.usage_category).trim(),
      };
    },
    [defaultQueueChainId],
  );

  useEffect(() => {
    if (importedContractSeedRef.current) {
      return;
    }
    if (mode !== "edit" || intent.source !== "application-page") {
      return;
    }

    const seed = readProjectEditContractSeed();
    if (!seed) {
      return;
    }

    const isStale = Date.now() - seed.created_at > 15 * 60 * 1000;
    const expectedOwner = (intent.project || form.owner_project).trim().toLowerCase();
    const seedOwner = seed.owner_project.trim().toLowerCase();
    if (isStale || (expectedOwner && seedOwner && expectedOwner !== seedOwner)) {
      clearProjectEditContractSeed();
      importedContractSeedRef.current = true;
      return;
    }

    const seededRows = seed.rows
      .map((row) =>
        prepareRowForQueue({
          chain_id: toStringValue(row.chain_id).trim(),
          address: toStringValue(row.address).trim(),
          contract_name: toStringValue(row.contract_name).trim(),
          owner_project: toStringValue(row.owner_project).trim() || form.owner_project.trim(),
          usage_category: toStringValue(row.usage_category).trim(),
        }),
      )
      .filter((row) => hasMeaningfulRowData(row))
      .slice(0, MAX_QUEUE_ROWS);

    clearProjectEditContractSeed();
    importedContractSeedRef.current = true;

    if (seededRows.length === 0) {
      return;
    }

    bulkController.queue.setRows(seededRows);
    setQueueError(null);
    setQueueErrorFromValidation(false);
    setSubmitError(null);
    setQueueSubmitPreview(null);
    setSingleSubmitResult(null);
    setBulkSubmitResult(null);
    setLastValidatedQueueFlow(null);
    setLastValidatedQueueSignature("");
    setLastValidatedSingleRowIndex(null);
    setShouldAutoValidateAfterImport(true);
    setActiveStep(2);
  }, [
    mode,
    intent.source,
    intent.project,
    form.owner_project,
    prepareRowForQueue,
    bulkController.queue,
  ]);

  const meaningfulRows = useMemo(() => {
    return bulkController.queue.rows
      .filter((row) => hasMeaningfulRowData(row))
      .map((row) => prepareRowForQueue(row));
  }, [bulkController.queue.rows, prepareRowForQueue]);

  const currentQueueSignature = useMemo(
    () => meaningfulRows.map(rowPreviewSignature).join("||"),
    [meaningfulRows],
  );

  const getSingleFlowRowIndex = useCallback(
    (row: AttestationRowInput): number => {
      const targetSignature = rowPreviewSignature(prepareRowForQueue(row));
      const sourceRowIndex = bulkController.queue.rows.findIndex(
        (candidateRow) => rowPreviewSignature(prepareRowForQueue(candidateRow)) === targetSignature,
      );
      return sourceRowIndex >= 0 ? sourceRowIndex : 0;
    },
    [bulkController.queue.rows, prepareRowForQueue],
  );

  const isSingleFlow = meaningfulRows.length <= 1;
  const lastSyncedSingleRowSignatureRef = useRef("");
  const singleRowSyncTarget = useMemo(() => {
    if (!isSingleFlow) {
      return null;
    }

    const fallbackRow: AttestationRowInput = {
      chain_id: defaultQueueChainId,
      owner_project: form.owner_project.trim(),
    };
    const row = meaningfulRows[0] || bulkController.queue.rows[0] || fallbackRow;
    return prepareRowForQueue(row);
  }, [
    bulkController.queue.rows,
    defaultQueueChainId,
    form.owner_project,
    isSingleFlow,
    meaningfulRows,
    prepareRowForQueue,
  ]);

  useEffect(() => {
    if (!singleRowSyncTarget) {
      lastSyncedSingleRowSignatureRef.current = "";
      return;
    }

    const nextSignature = rowPreviewSignature(singleRowSyncTarget);
    if (lastSyncedSingleRowSignatureRef.current === nextSignature) {
      return;
    }

    lastSyncedSingleRowSignatureRef.current = nextSignature;
    singleController.setRow(singleRowSyncTarget);
  }, [singleController, singleRowSyncTarget]);

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
    if (!lastValidatedQueueFlow) {
      return;
    }
    if (lastValidatedQueueSignature === currentQueueSignature) {
      return;
    }
    setLastValidatedQueueFlow(null);
    setLastValidatedQueueSignature("");
    setLastValidatedSingleRowIndex(null);
  }, [currentQueueSignature, lastValidatedQueueFlow, lastValidatedQueueSignature]);

  useEffect(() => {
    const rows = bulkController.queue.rows;

    if (!form.owner_project.trim() || rows.length === 0) {
      return;
    }
    const owner = form.owner_project.trim();
    let didPatchAnyRow = false;
    const nextRows = rows.map((row) => {
      const currentOwner = toStringValue(row.owner_project).trim();
      if (currentOwner || hasRowDataExcludingOwner(row)) {
        return row;
      }
      didPatchAnyRow = true;
      return { ...row, owner_project: owner };
    });
    if (!didPatchAnyRow) {
      return;
    }
    bulkController.queue.setRows(nextRows);
  }, [bulkController.queue, form.owner_project]);

  const mergeRowsIntoQueue = useCallback(
    (rows: AttestationRowInput[]) => {
      const incomingHaveAddresses = rows.some((r) => toStringValue(r.address).trim());
      const defaultOwner = form.owner_project.trim();
      const byRowKey = new Map<string, AttestationRowInput>();
      const pushRow = (raw: AttestationRowInput, applyDefaultOwner: boolean) => {
        const normalized = prepareRowForQueue(raw);
        const row =
          applyDefaultOwner && !toStringValue(normalized.owner_project).trim() && defaultOwner
            ? { ...normalized, owner_project: defaultOwner }
            : normalized;
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

      meaningfulRows.forEach((row) => {
        // When importing real rows (with addresses), skip placeholder rows that have no address
        if (incomingHaveAddresses && !toStringValue(row.address).trim()) return;
        pushRow(row, false);
      });
      rows.forEach((row) => pushRow(row, true));

      const merged = Array.from(byRowKey.values()).slice(0, MAX_QUEUE_ROWS);
      bulkController.queue.setRows(
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

  const hasCurrentQueueValidation =
    Boolean(lastValidatedQueueFlow) && lastValidatedQueueSignature === currentQueueSignature;

  const activeQueueDiagnostics = useMemo<AttestationDiagnostics>(() => {
    if (!hasCurrentQueueValidation) {
      return EMPTY_QUEUE_DIAGNOSTICS;
    }
    if (lastValidatedQueueFlow === "single") {
      return singleController.validation.result?.diagnostics ?? EMPTY_QUEUE_DIAGNOSTICS;
    }
    return bulkController.diagnostics.all;
  }, [
    hasCurrentQueueValidation,
    lastValidatedQueueFlow,
    singleController.validation.result,
    bulkController.diagnostics.all,
  ]);

  const queueHasValidationResult = useMemo(
    () =>
      hasCurrentQueueValidation &&
      (lastValidatedQueueFlow === "single"
        ? Boolean(singleController.validation.result)
        : Boolean(bulkController.validation.result)),
    [
      hasCurrentQueueValidation,
      lastValidatedQueueFlow,
      singleController.validation.result,
      bulkController.validation.result,
    ],
  );

  const getQueueRowErrorMessages = useCallback(
    (rowIndex: number): string[] => {
      if (!hasCurrentQueueValidation) {
        return [];
      }

      if (lastValidatedQueueFlow === "single") {
        if (rowIndex !== lastValidatedSingleRowIndex) {
          return [];
        }
        return (
          singleController.validation.result?.diagnostics.errors
            .map((diagnostic) => diagnostic.message)
            .filter(Boolean) ?? []
        );
      }

      return bulkController.diagnostics
        .getRow(rowIndex)
        .errors
        .map((diagnostic) => diagnostic.message)
        .filter(Boolean);
    },
    [
      hasCurrentQueueValidation,
      lastValidatedQueueFlow,
      lastValidatedSingleRowIndex,
      singleController.validation.result,
      bulkController,
    ],
  );

  const queueStats = useMemo(() => {
    const diagnostics = activeQueueDiagnostics;
    return {
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      suggestions: diagnostics.suggestions.length,
      conversions: diagnostics.conversions.length,
    };
  }, [activeQueueDiagnostics]);

  const rowErrors = useMemo(() => {
    return bulkController.queue.rows
      .map((_row, i) => ({
        rowIndex: i,
        errors: getQueueRowErrorMessages(i),
      }))
      .filter((x) => x.errors.length > 0 && hasMeaningfulRowData(bulkController.queue.rows[x.rowIndex]));
  }, [bulkController.queue.rows, getQueueRowErrorMessages]);

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
        const parsed = await bulkController.csv.parse(csvText, {
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

  const classifySmartPaste = useCallback(async () => {
    const text = smartPasteText.trim();
    if (!text) return;
    setIsClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch("/api/labels/classify-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          project: form.owner_project || "",
          chain_id: smartPasteChainMode === "fixed" && smartPasteFixedChain
            ? smartPasteFixedChain
            : defaultQueueChainId,
          auto_detect_chain: smartPasteChainMode === "auto",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Classification failed.");
      const rows = (data.rows ?? []) as AttestationRowInput[];
      if (rows.length === 0) {
        setClassifyError("No contract addresses found in the pasted text.");
        return;
      }
      mergeRowsIntoQueue(rows);
      setSmartPasteText("");
      setSmartPasteOpen(false);
    } catch (error: any) {
      setClassifyError(error?.message || "Classification failed.");
    } finally {
      setIsClassifying(false);
    }
  }, [smartPasteText, form.owner_project, mergeRowsIntoQueue, smartPasteChainMode, smartPasteFixedChain, defaultQueueChainId]);

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
        // In add mode the new project doesn't exist in the registry yet — inject it so the
        // validator accepts the owner_project slug without raising an "unknown project" error.
        const projectsForValidation =
          isAddMode && form.owner_project.trim()
            ? [...normalizedProjects, { owner_project: form.owner_project.trim() }]
            : normalizedProjects;

        if (isSingleFlow) {
          const row = meaningfulRows[0] || bulkController.queue.rows[0];
          if (!row) {
            setQueueError("Add at least one row before validating.");
            setQueueErrorFromValidation(true);
            setLastValidatedQueueFlow(null);
            setLastValidatedQueueSignature("");
            setLastValidatedSingleRowIndex(null);
            return null;
          }

          const normalizedRow = prepareRowForQueue(row);
          const sourceRowIndex = getSingleFlowRowIndex(normalizedRow);
          singleController.setRow(normalizedRow);
          const result = await singleController.validation.run({ projects: projectsForValidation });
          setLastValidatedQueueFlow("single");
          setLastValidatedQueueSignature(currentQueueSignature);
          setLastValidatedSingleRowIndex(sourceRowIndex);
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

        const bulkResult = await bulkController.validation.run({
          projects: projectsForValidation,
          maxRows: MAX_QUEUE_ROWS,
        });
        setLastValidatedQueueFlow("bulk");
        setLastValidatedQueueSignature(currentQueueSignature);
        setLastValidatedSingleRowIndex(null);
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
        setLastValidatedQueueFlow(null);
        setLastValidatedQueueSignature("");
        setLastValidatedSingleRowIndex(null);
        return null;
      }
    },
    [
      isAddMode,
      form.owner_project,
      isSingleFlow,
      meaningfulRows,
      bulkController,
      singleController,
      prepareRowForQueue,
      normalizedProjects,
      currentQueueSignature,
      getSingleFlowRowIndex,
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

  const fillFormFromProject = useCallback((project: ProjectRecord) => {
    const twitter = readProjectSocial(project, "twitter");
    const telegram = readProjectSocial(project, "telegram");
    const newForm: ProjectFormState = {
      owner_project: asString(project.owner_project),
      display_name: toDisplayName(project),
      description: asString(project.description),
      website: readProjectWebsite(project),
      main_github: readProjectGithub(project),
      twitter,
      telegram,
    };
    setForm(newForm);
    loadedFormRef.current = newForm;
    setContributionResult(null);
    setSubmitError(null);
    setActiveDropdownField(null);
  }, []);

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
            url: ensureAbsoluteUrl(website),
            coreName: extractCoreName(website),
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

  const enhanceDescription = useCallback(async () => {
    const website = form.website.trim();
    if (!website) {
      setEnhanceDescError("Add a website first to enhance the description.");
      return;
    }
    setEnhanceDescError("");
    setEnhanceDescInfo("");
    setIsEnhancingDesc(true);
    try {
      const response = await fetch("/api/labels/project-profiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ensureAbsoluteUrl(website),
          coreName: extractCoreName(website),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { yaml?: string; error?: string };
      if (!response.ok || !data.yaml) throw new Error(data.error || "Failed to enhance description.");
      const parsed = parseProfilerYaml(data.yaml);
      const enhancedDescription = parsed.description?.trim();
      if (enhancedDescription) {
        setForm((prev) => ({ ...prev, description: enhancedDescription }));
        setEnhanceDescInfo("Description enhanced by AI.");
      } else {
        setEnhanceDescError("No description returned. Try again.");
      }
    } catch (error: any) {
      setEnhanceDescError(error?.message || "Failed to enhance description.");
    } finally {
      setIsEnhancingDesc(false);
    }
  }, [form.website]);

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
    setWalletError(null);
    try {
      await connectWalletFromContext();
    } catch (error: any) {
      setWalletError(error?.message || "Wallet connection failed.");
    }
  }, [connectWalletFromContext]);

  const disconnectWallet = useCallback(() => {
    disconnectWalletFromContext();
  }, [disconnectWalletFromContext]);

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
      getWalletClient: async () => {
        const chainIdHex = await ethereum.request({ method: "eth_chainId" }) as string;
        const chainId = parseInt(chainIdHex, 16);
        const chain = defineChain({
          id: chainId,
          name: `Chain ${chainId}`,
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [] } },
        });
        return createWalletClient({
          account: walletAddress as `0x${string}`,
          transport: custom(ethereum),
          chain,
        }) as any;
      },
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
    bulkController.queue.addRow(row);
  }, [bulkController, defaultQueueChainId, form.owner_project, prepareRowForQueue]);

  const removeQueueRow = useCallback(
    (rowIndex: number) => {
      bulkController.queue.removeRow(rowIndex);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  const setQueueCellValue = useCallback(
    (rowIndex: number, field: QueueEditableField, value: string) => {
      bulkController.queue.setCell(rowIndex, field, value);
      setQueueError(null);
      setQueueErrorFromValidation(false);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  const switchToAddRoute = useCallback(() => {
    const website = form.website.trim() || websiteCheckInput.trim();
    router.push(
      buildProjectEditHref({
        mode: "add",
        source: intent.source,
        website: website || undefined,
        start: website ? "metadata" : "website",
      }),
    );
  }, [form.website, intent.source, router, websiteCheckInput]);

  const switchToEditRoute = useCallback(() => {
    const href = buildProjectEditHref({
      mode: "edit",
      source: intent.source,
      start: "metadata",
    });

    if (typeof window !== "undefined") {
      window.location.assign(href);
      return;
    }
    router.push(href);
  }, [intent.source, router]);

  const isMetadataSubmitted = Boolean(contributionResult);

  return (
    <Container className="pt-[30px] md:pt-[30px] pb-[60px] px-[16px] md:px-[32px]">
      <div className="w-full">
        <div className="flex w-full flex-col gap-y-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <div className="flex items-center h-[43px] gap-x-[8px]">
            <Title icon="gtp-project" title="Project Profile" as="h1" />
          </div>
          <div className="flex items-center rounded-full bg-color-bg-medium p-[3px] gap-x-[2px]">
            <button
              type="button"
              onClick={switchToAddRoute}
              className={`rounded-full px-[14px] py-[7px] text-sm transition-all ${
                isAddMode
                  ? "bg-color-text-primary text-color-bg-default"
                  : "text-color-text-secondary hover:text-color-text-primary"
              }`}
            >
              Add new
            </button>
            <button
              type="button"
              onClick={switchToEditRoute}
              className={`rounded-full px-[14px] py-[7px] text-sm transition-all ${
                !isAddMode
                  ? "bg-color-text-primary text-color-bg-default"
                  : "text-color-text-secondary hover:text-color-text-primary"
              }`}
            >
              Edit existing
            </button>
          </div>
        </div>
        <p className="text-[14px] leading-relaxed text-color-text-primary max-w-[820px]">
          Add or edit project metadata, then validate and submit contract attestations.
        </p>

        {/* Always-visible step accordion grid */}
        <div className="grid grid-cols-1 gap-x-[8px] gap-y-[8px] xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* Main column */}
          <div className="flex flex-col gap-y-[8px]">

            {/* ── Step 1 card ── */}
            <div className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden">
              {/* Clickable header */}
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
              >
                {/* Step badge */}
                <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  contributionResult
                    ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
                    : activeStep === 1
                    ? "bg-color-text-primary text-color-bg-default"
                    : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
                }`}>
                  {contributionResult ? <Icon icon="feather:check" className="size-[13px]" /> : 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{isAddMode ? "Add project details" : "Edit project details"}</div>
                  {activeStep !== 1 && (
                    hasCollapsedMetadataSummary ? (
                      <div className="mt-[3px] flex flex-col gap-y-[4px]">
                        <div className="flex min-w-0 items-center gap-x-[6px]">
                          <div className="relative size-[20px] shrink-0 overflow-hidden rounded-full border border-color-ui-shadow/60 bg-color-bg-medium">
                            {collapsedLogoSrc ? (
                              <Image
                                src={collapsedLogoSrc}
                                alt={collapsedDisplayName || "Project logo"}
                                fill
                                sizes="20px"
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <GTPIcon icon="gtp-project-monochrome" size="sm" className="text-color-ui-hover" />
                            )}
                          </div>
                          <div className="flex items-center gap-x-[4px] shrink-0">
                            <span
                              title={hasWebsiteInSummary ? "Website added" : "Website missing"}
                              className={`inline-flex size-[16px] items-center justify-center rounded-full border ${hasWebsiteInSummary ? "border-color-positive/35 bg-color-positive/10 text-color-positive" : "border-color-negative/35 bg-color-negative/10 text-color-negative"}`}
                            >
                              <Icon icon="feather:globe" className="size-[9px]" />
                            </span>
                            <span
                              title={hasGithubInSummary ? "GitHub added" : "GitHub missing"}
                              className={`inline-flex size-[16px] items-center justify-center rounded-full border ${hasGithubInSummary ? "border-color-positive/35 bg-color-positive/10 text-color-positive" : "border-color-negative/35 bg-color-negative/10 text-color-negative"}`}
                            >
                              <Icon icon="feather:github" className="size-[9px]" />
                            </span>
                            <span
                              title={hasTwitterInSummary ? "Twitter added" : "Twitter missing"}
                              className={`inline-flex size-[16px] items-center justify-center rounded-full border ${hasTwitterInSummary ? "border-color-positive/35 bg-color-positive/10 text-color-positive" : "border-color-negative/35 bg-color-negative/10 text-color-negative"}`}
                            >
                              <Icon icon="feather:twitter" className="size-[9px]" />
                            </span>
                            <span
                              title={hasTelegramInSummary ? "Telegram added" : "Telegram missing"}
                              className={`inline-flex size-[16px] items-center justify-center rounded-full border ${hasTelegramInSummary ? "border-color-positive/35 bg-color-positive/10 text-color-positive" : "border-color-negative/35 bg-color-negative/10 text-color-negative"}`}
                            >
                              <Icon icon="feather:send" className="size-[9px]" />
                            </span>
                          </div>
                          <div className="min-w-0 truncate text-xs text-color-text-secondary">
                            {collapsedDisplayName || "Project"}
                            {contributionResult ? " · PR submitted" : ""}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-color-text-secondary mt-[2px] truncate">
                        Fill in project information
                      </div>
                    )
                  )}
                </div>
                <Icon
                  icon="feather:chevron-down"
                  className={`size-[16px] shrink-0 text-color-text-secondary transition-transform ${activeStep === 1 ? "rotate-180" : ""}`}
                />
              </button>

              {/* Step 1 body */}
              {activeStep === 1 && (
                <div className="border-t border-color-ui-shadow/40">
                  {!showMetadataForm && isAddMode ? (
                    <div className="px-[20px] py-[16px]">
                      <div className="flex flex-col gap-y-[8px]">
                        <div className="text-base font-medium">Start with your website</div>
                        <p className="text-xs text-color-text-primary">
                          Enter your website to check if your project already exists in OSS directory.
                        </p>
                        <div className="flex flex-wrap items-center gap-[8px]">
                          <div className="flex min-w-[260px] flex-1 items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                            <input
                              value={websiteCheckInput}
                              onChange={(event) => setWebsiteCheckInput(event.target.value)}
                              placeholder="https://yourproject.xyz"
                              className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={checkWebsiteForExistingProjects}
                            disabled={isCheckingWebsite || !websiteCheckInput.trim()}
                            className={`h-[40px] rounded-full px-[14px] text-sm transition-all disabled:opacity-60 ${websiteCheckInput.trim() ? "bg-color-text-primary text-color-bg-default" : "border border-color-ui-shadow bg-color-bg-medium"}`}
                          >
                            {isCheckingWebsite ? "Checking..." : "Check website"}
                          </button>
                        </div>

                        {websiteChecked && websiteCheckMatches.length > 0 && (
                          <div className="rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px]">
                            <div className="text-xs font-medium">Project already found</div>
                            <p className="mt-[4px] text-xs text-color-text-primary">
                              We found matching entries. Open one of these in edit mode:
                            </p>
                            <div className="mt-[8px] flex flex-wrap gap-[8px]">
                              {websiteCheckMatches.map((match) => (
                                <Link
                                  key={`${match.owner_project}-${match.field}`}
                                  href={buildProjectEditHref({
                                    mode: "edit",
                                    source: "website-check",
                                    project: match.owner_project,
                                    focus: "contracts",
                                    start: "contracts",
                                  })}
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
                    </div>
                  ) : (
                    <div className="px-[20px] pb-[20px] pt-[16px]">
                      <div className="mb-[14px] text-sm font-medium">Project identity</div>
                      <div className="flex gap-x-[16px]">
                  {/* Logo column */}
                  <div className="flex shrink-0 flex-col items-center gap-y-[8px]">
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
                        <Image
                          src={logoUpload.previewUrl}
                          alt="Project logo preview"
                          fill
                          sizes="84px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : ownerProjectToProjectData[form.owner_project.trim()]?.logo_path ? (
                        <Image
                          src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[form.owner_project.trim()].logo_path}`}
                          alt={form.owner_project}
                          fill
                          sizes="84px"
                          className="object-cover"
                        />
                      ) : (
                        <GTPIcon icon="gtp-project-monochrome" size="lg" className="text-color-ui-hover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon icon="feather:edit-2" className="text-white size-[16px]" />
                      </span>
                    </button>
                    {isAddMode && (
                      <button
                        type="button"
                        disabled={isProfiling}
                        onClick={() => runProfiler()}
                        className="flex items-center gap-x-[5px] whitespace-nowrap rounded-full border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[5px] text-[10px] disabled:opacity-60"
                      >
                        <Icon icon="feather:cpu" className="size-[10px]" />
                        {isProfiling ? "Profiling..." : "Profile"}
                      </button>
                    )}
                    {isAddMode && profilerError && <p className="max-w-[84px] text-center text-[10px] text-color-negative">{profilerError}</p>}
                    {isAddMode && profilerInfo && <p className="max-w-[84px] text-center text-[10px] text-color-positive">{profilerInfo}</p>}
                    {logoUpload?.fileName && <p className="max-w-[84px] truncate text-center text-[10px] text-color-text-secondary">{logoUpload.fileName}</p>}
                  </div>
                  {/* Fields grid */}
                  <div className="min-w-0 flex-1 grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                    <div>
                      <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Owner project key</label>
                    <div className="relative">
                      <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                        <input
                          value={form.owner_project}
                          onChange={(event) =>
                            updateField("owner_project", normalizeOwnerProjectInput(event.target.value))
                          }
                          onFocus={() => setActiveDropdownField("owner_project")}
                          onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                          placeholder="owner_project"
                          className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      {activeDropdownField === "owner_project" && (
                        <FieldDropdown suggestions={ownerProjectSuggestions} onSelect={fillFormFromProject} />
                      )}
                    </div>
                    {validationErrors.owner_project ? (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.owner_project}</p>
                    ) : (
                      <p className="mt-[6px] text-xs text-color-text-primary">
                        Use a short lowercase key, for example: uniswap.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Display name</label>
                    <div className="relative">
                      <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                        <input
                          value={form.display_name}
                          onChange={(event) => updateField("display_name", event.target.value)}
                          onFocus={() => setActiveDropdownField("display_name")}
                          onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                          placeholder="Project name"
                          className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      {activeDropdownField === "display_name" && (
                        <FieldDropdown suggestions={displayNameSuggestions} onSelect={fillFormFromProject} />
                      )}
                    </div>
                    {validationErrors.display_name && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.display_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Website</label>
                    <div className="relative">
                      <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                        <input
                          value={form.website}
                          onChange={(event) => updateField("website", event.target.value)}
                          onFocus={() => setActiveDropdownField("website")}
                          onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                          placeholder="https://"
                          className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      {activeDropdownField === "website" && (
                        <FieldDropdown suggestions={websiteSuggestions} onSelect={fillFormFromProject} />
                      )}
                    </div>
                    {validationErrors.website && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.website}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-color-text-primary">GitHub</label>
                    <div className="relative">
                      <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                        <input
                          value={form.main_github}
                          onChange={(event) => updateField("main_github", event.target.value)}
                          onFocus={() => setActiveDropdownField("main_github")}
                          onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                          placeholder="https://github.com/your-org"
                          className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      {activeDropdownField === "main_github" && (
                        <FieldDropdown suggestions={githubSuggestions} onSelect={fillFormFromProject} />
                      )}
                    </div>
                    {validationErrors.main_github && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.main_github}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Twitter / X <span className="font-normal text-color-text-secondary">(optional)</span></label>
                    <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                      <input
                        value={form.twitter}
                        onChange={(event) => updateField("twitter", event.target.value)}
                        placeholder="https://x.com/yourproject"
                        className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                      />
                    </div>
                    {validationErrors.twitter && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.twitter}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Telegram <span className="font-normal text-color-text-secondary">(optional)</span></label>
                    <div className="flex w-full items-center bg-color-bg-default rounded-[22px] h-[44px] px-[14px]">
                      <input
                        value={form.telegram}
                        onChange={(event) => updateField("telegram", event.target.value)}
                        placeholder="https://t.me/yourproject"
                        className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                      />
                    </div>
                    {validationErrors.telegram && (
                      <p className="mt-[6px] text-xs text-color-negative">{validationErrors.telegram}</p>
                    )}
                  </div>
                  </div>{/* end fields grid */}
                </div>{/* end logo + fields flex */}

                <div className="mt-[12px]">
                  <div className="mb-[6px] flex items-center justify-between gap-[8px]">
                    <label className="text-xs font-medium text-color-text-primary">Description</label>
                    {!isAddMode && (
                      <button
                        type="button"
                        disabled={isEnhancingDesc}
                        onClick={enhanceDescription}
                        className="flex items-center gap-x-[5px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[4px] text-[11px] text-color-text-primary transition-colors hover:border-color-ui-hover disabled:opacity-50"
                      >
                        <Icon icon="feather:cpu" className="size-[10px]" />
                        {isEnhancingDesc ? "Enhancing..." : "Enhance with AI"}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Short project description"
                    className="min-h-[100px] w-full rounded-[22px] bg-color-bg-default px-[14px] py-[12px] text-sm border-none outline-none resize-y text-color-text-primary placeholder-color-text-secondary"
                  />
                  {enhanceDescError && <p className="mt-[5px] text-xs text-color-negative">{enhanceDescError}</p>}
                  {enhanceDescInfo && <p className="mt-[5px] text-xs text-color-positive">{enhanceDescInfo}</p>}
                </div>

                <div className="mt-[14px] flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!canSubmitContribution}
                    onClick={submitProjectContribution}
                    className={`rounded-full px-[14px] py-[9px] text-sm transition-all disabled:opacity-60 ${canSubmitContribution ? "bg-color-text-primary text-color-bg-default" : "border border-color-ui-shadow bg-color-bg-default"}`}
                  >
                    {isSubmittingContribution
                      ? "Creating PR..."
                      : isAddMode
                        ? "Add project"
                        : "Edit project"}
                  </button>
                </div>

                {submitError && <p className="mt-[8px] text-xs text-color-negative">{submitError}</p>}
                {contributionResult && (
                  <div className="mt-[10px] rounded-[10px] border border-color-ui-shadow bg-color-bg-medium p-[10px] text-sm">
                    <div className="font-medium text-color-text-primary">Contribution created</div>
                    <div className="mt-[6px] flex flex-wrap gap-[6px]">
                      <Link
                        href={contributionResult.yamlPullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-x-[5px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[10px] py-[5px] text-xs hover:bg-color-ui-hover transition-colors"
                      >
                        <Icon icon="feather:git-pull-request" className="size-[11px] shrink-0" />
                        YAML PR
                      </Link>
                      {contributionResult.logoPullRequestUrl && (
                        <Link
                          href={contributionResult.logoPullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-x-[5px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[10px] py-[5px] text-xs hover:bg-color-ui-hover transition-colors"
                        >
                          <Icon icon="feather:git-pull-request" className="size-[11px] shrink-0" />
                          Logo PR
                        </Link>
                      )}
                    </div>
                  </div>
                )}
                {contributionResult && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="mt-[10px] inline-flex items-center gap-x-[6px] rounded-full bg-color-text-primary px-[14px] py-[8px] text-xs text-color-bg-default"
                  >
                    Continue to contracts
                    <Icon icon="feather:arrow-right" className="size-[12px]" />
                  </button>
                )}
              </div>
              )}
            </div>
          )}
          </div>

          {/* ── Step 2 card ── */}
          <div className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden">
            {/* Clickable header */}
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
            >
              <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                (singleSubmitResult || bulkSubmitResult)
                  ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
                  : activeStep === 2
                  ? "bg-color-text-primary text-color-bg-default"
                  : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
              }`}>
                {(singleSubmitResult || bulkSubmitResult) ? <Icon icon="feather:check" className="size-[13px]" /> : 2}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Add contracts</div>
                {activeStep !== 2 && (
                  <div className="text-xs text-color-text-secondary mt-[2px] truncate">
                    {singleSubmitResult || bulkSubmitResult ? "Attestation submitted"
                      : meaningfulRows.length > 0 ? `${meaningfulRows.length} contract${meaningfulRows.length !== 1 ? "s" : ""} in queue`
                      : "Add contract addresses for attestation"}
                  </div>
                )}
              </div>
              <Icon
                icon="feather:chevron-down"
                className={`size-[16px] shrink-0 text-color-text-secondary transition-transform ${activeStep === 2 ? "rotate-180" : ""}`}
              />
            </button>

            {/* Step 2 body */}
            {activeStep === 2 && (
              <div className="border-t border-color-ui-shadow/40 px-[20px] pb-[20px] pt-[16px]">
                <div className="mb-[12px] flex items-center justify-between gap-[10px]">
                  <div>
                    <h2 className="heading-small-md flex items-center gap-x-[8px]">
                      <GTPIcon icon="gtp-labeled" size="sm" className="shrink-0" />
                      Add your contracts
                    </h2>
                    <div className="text-xs text-color-text-primary mt-[2px]">
                      Validate queue rows and submit onchain attestations.
                    </div>
                  </div>

                  <div className="flex items-center gap-[8px]">
                    {walletAddress ? (
                      <button
                        type="button"
                        className="flex items-center gap-x-[6px] h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[12px] text-xs"
                        onClick={disconnectWallet}
                      >
                        <div className="size-[6px] rounded-full bg-color-positive shrink-0" />
                        {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-x-[6px] h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[12px] text-xs"
                        onClick={connectWallet}
                        disabled={isConnectingWallet}
                      >
                        <div className="size-[6px] rounded-full bg-color-text-secondary/40 shrink-0" />
                        {isConnectingWallet ? "Connecting..." : "Connect wallet"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-[12px]">
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
                      className={`h-[36px] rounded-full border px-[12px] text-xs transition-colors ${
                        smartPasteOpen
                          ? "border-color-accent bg-color-accent/10 text-color-accent"
                          : "border-color-ui-shadow bg-color-bg-default"
                      }`}
                      onClick={() => {
                        setSmartPasteOpen((v) => !v);
                        setClassifyError(null);
                      }}
                    >
                      Smart Paste
                    </button>
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={addQueueRow}
                    >
                      Add row
                    </button>
                    <div className="h-[20px] w-px bg-color-ui-shadow" />
                    <button
                      type="button"
                      className="h-[36px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                      onClick={validateQueue}
                      disabled={bulkController.validation.isRunning || singleController.validation.isRunning}
                    >
                      {bulkController.validation.isRunning || singleController.validation.isRunning
                        ? "Validating..."
                        : "Validate queue"}
                    </button>
                    <div className="h-[20px] w-px bg-color-ui-shadow" />
                    <button
                      type="button"
                      className={`h-[36px] rounded-full px-[14px] text-xs transition-all ${!walletAddress || meaningfulRows.length === 0 || isPreparingSubmitPreview || isSubmittingFromPreview ? "border border-color-ui-shadow bg-color-bg-default opacity-60 cursor-not-allowed" : "bg-color-text-primary text-color-bg-default"}`}
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

                  {smartPasteOpen && (
                    <div className="mt-[8px] rounded-[22px] border border-white/[0.1] px-[16px] py-[14px]">
                      {/* Header */}
                      <div className="mb-[12px] flex items-center gap-[8px]">
                        <Icon icon="feather:zap" className="size-[13px] shrink-0 text-color-text-primary" />
                        <div className="min-w-0 flex flex-wrap items-baseline gap-x-[6px]">
                          <span className="text-xs font-semibold text-color-text-primary">Smart Paste</span>
                          <span className="text-xxs text-color-text-secondary">
                            Paste any text with contract addresses — AI extracts, detects chains, and classifies them.
                          </span>
                        </div>
                      </div>

                      {/* Chain mode */}
                      <div className="mb-[10px] flex flex-wrap items-center gap-[6px]">
                        <span className="text-xxs text-color-text-primary/60 shrink-0">Chain:</span>
                        <button
                          type="button"
                          className={`h-[26px] rounded-full px-[12px] text-xs transition-colors ${
                            smartPasteChainMode === "auto"
                              ? "bg-color-text-primary text-color-bg-default"
                              : "bg-color-bg-default hover:bg-color-ui-hover"
                          }`}
                          onClick={() => setSmartPasteChainMode("auto")}
                          disabled={isClassifying}
                        >
                          Auto-detect
                        </button>
                        <button
                          type="button"
                          className={`h-[26px] rounded-full px-[12px] text-xs transition-colors ${
                            smartPasteChainMode === "fixed"
                              ? "bg-color-text-primary text-color-bg-default"
                              : "bg-color-bg-default hover:bg-color-ui-hover"
                          }`}
                          onClick={() => setSmartPasteChainMode("fixed")}
                          disabled={isClassifying}
                        >
                          All same chain
                        </button>
                        {smartPasteChainMode === "fixed" && (
                          <select
                            className="h-[26px] rounded-full bg-color-bg-default px-[10px] text-xs border-none outline-none"
                            value={smartPasteFixedChain || defaultQueueChainId}
                            onChange={(e) => setSmartPasteFixedChain(e.target.value)}
                            disabled={isClassifying}
                          >
                            {chainOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {smartPasteChainMode === "auto" && (
                          <span className="text-xxs text-color-text-secondary">
                            Falls back to{" "}
                            <span className="text-color-text-primary">
                              {chainOptions.find((o) => o.value === defaultQueueChainId)?.label ?? defaultQueueChainId}
                            </span>{" "}
                            if chain not detected
                          </span>
                        )}
                      </div>

                      {/* Textarea */}
                      <textarea
                        className="w-full rounded-[16px] bg-color-bg-default px-[14px] py-[10px] text-xs font-mono resize-none placeholder:text-color-text-secondary focus:outline-none"
                        rows={5}
                        placeholder={`Paste contract data here — any format works:\n{\n  "router": "0xabc..."\n  "vault": "0xdef..."\n}`}
                        value={smartPasteText}
                        onChange={(e) => setSmartPasteText(e.target.value)}
                        disabled={isClassifying}
                      />

                      {/* Error */}
                      {classifyError && (
                        <div className="mt-[8px] flex items-center gap-[6px] rounded-full border border-color-negative/30 bg-color-negative/10 px-[12px] py-[5px] text-xxs text-color-negative">
                          <Icon icon="feather:alert-circle" className="size-[12px] shrink-0" />
                          {classifyError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-[10px] flex items-center gap-[8px]">
                        <button
                          type="button"
                          className="h-[36px] rounded-full bg-color-text-primary px-[18px] text-xs font-medium text-color-bg-default disabled:opacity-40 transition-opacity"
                          onClick={classifySmartPaste}
                          disabled={isClassifying || !smartPasteText.trim()}
                        >
                          {isClassifying ? "Classifying…" : "Classify & add to queue"}
                        </button>
                        <button
                          type="button"
                          className="h-[36px] rounded-full border border-white/[0.1] bg-color-bg-default px-[16px] text-xs font-medium text-color-text-primary hover:bg-color-ui-hover transition-colors"
                          onClick={() => {
                            setSmartPasteOpen(false);
                            setSmartPasteText("");
                            setClassifyError(null);
                          }}
                          disabled={isClassifying}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-xs border-separate border-spacing-y-[5px]">
                    <colgroup>
                      <col className="w-[32px]" />
                      <col className="w-[44px]" />
                      <col className="w-[24%]" />
                      <col className="w-[18%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                      <col className="w-[46px]" />
                    </colgroup>
                    <thead>
                      <tr className="text-xs text-color-text-primary">
                        <th className="pl-[8px] pr-[4px] pb-[4px] text-left font-normal" />
                        <th className="px-[4px] pb-[4px] text-center font-normal">Chain</th>
                        <th className="px-[6px] pb-[4px] text-left font-normal">Address</th>
                        <th className="px-[6px] pb-[4px] text-left font-normal">Contract name</th>
                        <th className="px-[6px] pb-[4px] text-left font-normal">Owner project</th>
                        <th className="px-[6px] pb-[4px] text-left font-normal">Usage category</th>
                        <th className="pb-[4px]" />
                      </tr>
                    </thead>
                    <tbody>
                      {bulkController.queue.rows.map((row, rowIndex) => {
                        const chainId = toStringValue(row.chain_id).trim() || defaultQueueChainId;
                        const ownerProject = toStringValue(row.owner_project).trim();
                        const normalizedOwnerProject = ownerProject.toLowerCase();
                        const usageCategory = toStringValue(row.usage_category).trim();
                        const rowErrorMessages = getQueueRowErrorMessages(rowIndex);
                        const rowHasError = rowErrorMessages.length > 0;

                        const addressVal = toStringValue(row.address).trim();
                        const addressInvalid = rowHasError && (!addressVal || !!validateAddressForChain(addressVal, chainId));
                        const ownerExistsInProjects = normalizedProjects.some(
                          (project) => asString(project.owner_project).toLowerCase() === normalizedOwnerProject,
                        );
                        const ownerMatchesPendingAddProject =
                          isAddMode &&
                          normalizedOwnerProject !== "" &&
                          normalizedOwnerProject === form.owner_project.trim().toLowerCase();
                        const ownerInvalid =
                          rowHasError &&
                          ownerProject !== "" &&
                          !ownerExistsInProjects &&
                          !ownerMatchesPendingAddProject;
                        const categoryInvalid = rowHasError && usageCategory !== "" && !usageCategoryOptions.some((o) => o.value === usageCategory);

                        const rowBg = rowHasError ? "bg-color-negative/[0.07]" : "";
                        const border = rowHasError ? "border-color-negative/30" : "border-white/[0.1]";
                        const cellMid = `${rowBg} py-[4px] align-middle border-t border-b ${border}`;
                        const cellFirst = `${cellMid} border-l rounded-l-full pl-[10px] pr-[4px]`;
                        const cellLast = `${cellMid} border-r rounded-r-full pl-[2px] pr-[8px]`;
                        const isEditingAddress = addressEditRow === rowIndex;

                        return (
                          <Fragment key={`${rowIndex}-${rowPreviewSignature(row)}`}>
                            <tr>
                            {/* # */}
                            <td className={`${cellFirst} text-color-text-secondary text-xxs`}>
                              {rowIndex + 1}
                            </td>
                            {/* Chain — icon only */}
                            <td className={`${cellMid} px-[2px]`}>
                              <div className="flex items-center justify-center">
                                <TableCellSelect
                                  value={chainId}
                                  placeholder="Chain"
                                  options={chainOptions}
                                  onSelect={(value) => setQueueCellValue(rowIndex, "chain_id", value)}
                                  iconRenderer={chainIconRenderer}
                                  iconOnly
                                />
                              </div>
                            </td>
                            {/* Address — truncated display / edit toggle */}
                            <td className={`${cellMid} pl-0 pr-[6px]`}>
                              {isEditingAddress ? (
                                <input
                                  autoFocus
                                  value={toStringValue(row.address)}
                                  className={`h-[24px] w-full rounded-full pl-[6px] pr-[10px] font-mono text-xs border-none outline-none ${addressInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : "bg-color-bg-default"}`}
                                  placeholder="0x..."
                                  onChange={(event) => setQueueCellValue(rowIndex, "address", event.target.value)}
                                  onBlur={() => setAddressEditRow(null)}
                                />
                              ) : (
                                <button
                                  type="button"
                                  className={`h-[24px] w-full rounded-full pl-[6px] pr-[10px] font-mono text-xs text-left border-none outline-none transition-colors ${addressInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : "bg-color-bg-default hover:bg-color-ui-hover"} ${!addressVal ? "text-color-text-secondary" : ""}`}
                                  onClick={() => setAddressEditRow(rowIndex)}
                                >
                                  {addressVal ? truncateMiddle(addressVal) : "0x…"}
                                </button>
                              )}
                            </td>
                            {/* Contract name */}
                            <td className={`${cellMid} pl-0 pr-[6px]`}>
                              <input
                                value={toStringValue(row.contract_name)}
                                className="h-[24px] w-full rounded-full bg-color-bg-default pl-[6px] pr-[10px] text-xs border-none outline-none"
                                placeholder="Contract name"
                                onChange={(event) => setQueueCellValue(rowIndex, "contract_name", event.target.value)}
                              />
                            </td>
                            {/* Owner project */}
                            <td className={`${cellMid} pl-0 pr-[6px]`}>
                              <TableCellSelect
                                value={ownerProject}
                                placeholder="Select owner"
                                options={ownerProjectOptions}
                                onSelect={(value) => setQueueCellValue(rowIndex, "owner_project", value)}
                                showIcon
                                iconRenderer={ownerProjectIconRenderer}
                                error={ownerInvalid}
                                triggerClassName="pl-[6px]"
                              />
                            </td>
                            {/* Usage category */}
                            <td className={`${cellMid} pl-0 pr-[6px]`}>
                              <TableCellSelect
                                value={usageCategory}
                                placeholder="Select category"
                                options={usageCategoryOptions}
                                onSelect={(value) => setQueueCellValue(rowIndex, "usage_category", value)}
                                error={categoryInvalid}
                                triggerClassName="pl-[6px]"
                              />
                            </td>
                            {/* Delete */}
                            <td className={cellLast}>
                              <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => removeQueueRow(rowIndex)}
                                className="flex items-center justify-center opacity-40 transition-opacity hover:opacity-100"
                              >
                                <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#gtp-search-clear-gradient)" />
                                  <path fillRule="evenodd" clipRule="evenodd" d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z" fill="#CDD8D3" />
                                  <defs>
                                    <linearGradient id="gtp-search-clear-gradient" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#FE5468" />
                                      <stop offset="1" stopColor="#FFDF27" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              </button>
                              </div>
                            </td>
                            </tr>
                            {rowHasError && (
                              <tr>
                                <td colSpan={7} className="px-[8px] pb-[2px] pt-0">
                                  <div className="flex items-start gap-x-[6px] pl-[2px]">
                                    <div className="shrink-0 rounded-full border border-color-negative/50 bg-color-bg-default px-[7px] py-[2px] text-xxs font-semibold text-color-negative leading-[1.6]">
                                      #{rowIndex + 1}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-wrap gap-[4px]">
                                      {rowErrorMessages.map((error, i) => (
                                        <div key={i} className="rounded-full border border-color-negative/25 bg-color-bg-default px-[10px] py-[3px] text-xxs text-color-negative leading-[1.6] shadow-sm">
                                          {error}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {meaningfulRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-[40px] text-center">
                            <div className="flex flex-col items-center gap-y-[8px] text-xs text-color-text-primary">
                              <Icon icon="feather:inbox" className="size-[20px] opacity-40" />
                              <span>No contracts in queue. Add a row or upload a CSV.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {queueSubmitPreview && (
                  <div className="mt-[10px] rounded-[12px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-xs">
                    <div className="font-semibold">Transaction preview</div>
                    <div className="mt-[2px] text-color-text-primary">
                      Final validation passed. Review payloads before signing{" "}
                      {queueSubmitPreview.preparedRows.length} transaction
                      {queueSubmitPreview.preparedRows.length === 1 ? "" : "s"}.
                    </div>

                    <div className="mt-[8px] max-h-[260px] overflow-auto rounded-[10px] border border-color-ui-shadow">
                      <table className="w-full min-w-[760px] border-separate border-spacing-y-[0px] text-xxs">
                        <thead className="sticky top-0 bg-color-bg-default">
                          <tr className="text-color-text-primary">
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

                {(submitError || walletError) && (
                  <div className="mt-[10px] rounded-[12px] border border-color-negative/50 bg-color-negative/10 px-[12px] py-[10px] text-xs">
                    {submitError || walletError}
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
              </div>
            )}
          </div>

        </div>

            {(activeStep === 1 || activeStep === 2) && (
              <aside className="relative flex h-fit flex-col gap-y-[10px] xl:sticky xl:top-[100px]">
                <div className="overflow-hidden rounded-[14px] border border-color-ui-shadow/40">
                  <div className="flex items-center gap-x-[8px] border-b border-color-ui-shadow/40 px-[12px] py-[10px]">
                    <Icon
                      icon={activeStep === 2 ? "feather:zap" : isMetadataSubmitted ? "feather:check-circle" : mode === "edit" ? "feather:edit-2" : "feather:plus-circle"}
                      className="size-[14px] text-color-text-secondary"
                    />
                    <div className="text-sm font-medium">
                      {activeStep === 2 ? "Contract Tips" : isMetadataSubmitted ? "Next Steps" : mode === "edit" ? "Editing Tips" : "Adding Tips"}
                    </div>
                  </div>
                  <div className={`flex flex-col ${activeStep === 2 || isMetadataSubmitted ? "gap-y-[6px] p-[10px]" : "gap-y-[8px] p-[12px]"}`}>
                    {activeStep === 2 ? (
                      <>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:zap" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Start with <span className="font-mono">Smart Paste</span> to bulk-add contracts, then review chain and category.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:link-2" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            <span className="font-mono">owner_project</span> defaults to the selected project, but you can switch it to any project or choose <span className="font-mono">No owner</span> for wrong-association attestations.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:type" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Use readable version suffixes like <span className="font-mono">Router v2.2</span>, not <span className="font-mono">2.2Router</span> or <span className="font-mono">RouterV2.2</span>.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:tag" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            For fungible token contracts, use the ticker in all caps (for example <span className="font-mono">USDC</span>, <span className="font-mono">WETH</span>).
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:minimize-2" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Keep names concise and self-explanatory; avoid project prefixes like <span className="font-mono">Uniswap Router</span>.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:edit-3" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Prefer human-readable names with spaces, and avoid underscores and quotes.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:refresh-cw" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Editing an existing contract entry will overwrite it after approval.
                          </span>
                        </div>
                      </>
                    ) : isMetadataSubmitted ? (
                      <>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:check" className="mt-[2px] size-[12px] shrink-0 text-color-positive" />
                          <span className="text-xs text-color-text-primary">
                            Metadata PR submitted for <span className="font-mono">{form.owner_project || "project"}</span>.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:layers" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Add contracts to the queue and keep owner slugs consistent.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:shield" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Validate rows, review transaction preview, then sign.
                          </span>
                        </div>
                      </>
                    ) : mode === "edit" ? (
                      <>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:key" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            The <span className="font-mono font-medium">owner_project</span> key is the unique OSS identifier — it must match exactly (e.g. <span className="font-mono">uniswap</span>, <span className="font-mono">aave-v3</span>). Leave fields blank to keep existing values.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:refresh-cw" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Rebranded? Only update the <span className="font-medium">Display name</span> — the <span className="font-mono">owner_project</span> key cannot change. Consider appending the old name in parentheses, e.g. <span className="font-mono">Sky (formerly MakerDAO)</span>.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:file-text" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Description must be 2–3 short, neutral sentences. No marketing language, superlatives, or first-person claims.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:github" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            GitHub should point to the main org or repo (e.g. <span className="font-mono">https://github.com/Uniswap</span>), not a specific branch or file.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:zap" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Use Smart Paste to bulk-add contracts — paste any JSON, table, or freeform text with addresses and let AI extract, chain-detect, and classify them.
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:key" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            <span className="font-mono font-medium">owner_project</span> is the permanent OSS slug — lowercase, hyphenated, no TLD, max 60 chars (e.g. <span className="font-mono">aave-v3</span>, <span className="font-mono">uniswap</span>). It cannot be changed later.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:cpu" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Use <span className="font-medium">Profile from website</span> to auto-fill fields via AI. The profiler extracts name, description, and website — always verify the output before submitting.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:file-text" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Description must be 2–3 short, neutral sentences about what the project does. Avoid marketing language, comparisons, or first-person phrasing.
                          </span>
                        </div>
                        <div className="flex items-start gap-x-[8px]">
                          <Icon icon="feather:at-sign" className="mt-[2px] size-[12px] shrink-0 text-color-text-secondary" />
                          <span className="text-xs text-color-text-primary">
                            Twitter and Telegram accept handles (e.g. <span className="font-mono">@uniswap</span>) — they'll be converted to full URLs automatically.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              {activeStep === 1 && !isMetadataSubmitted && (
              <div className="overflow-hidden rounded-[14px] border border-color-ui-shadow/40">
                <div className="flex items-center gap-x-[8px] border-b border-color-ui-shadow/40 px-[12px] py-[10px]">
                  <Icon icon="feather:shield" className="size-[14px] text-color-text-secondary" />
                  <div className="text-sm font-medium">Validation status</div>
                </div>
                <div className="flex flex-col gap-y-[6px] p-[12px]">
                  <div
                    className={`flex items-center gap-x-[8px] rounded-[8px] border px-[10px] py-[7px] text-xs ${
                      hasBlockingErrors
                        ? "border-color-negative/30 bg-color-negative/10 text-color-negative"
                        : "border-color-positive/30 bg-color-positive/10 text-color-positive"
                    }`}
                  >
                    <Icon
                      icon={hasBlockingErrors ? "feather:alert-circle" : "feather:check-circle"}
                      className="size-[13px] shrink-0"
                    />
                    <span>{hasBlockingErrors ? "Fix metadata field errors" : "Metadata fields look good"}</span>
                  </div>
                  {formSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-x-[8px] rounded-[8px] border border-color-ui-hover bg-color-bg-medium px-[10px] py-[7px] text-xs">
                      <Icon icon={s.icon} className="mt-[1px] size-[12px] shrink-0 text-color-text-secondary" />
                      <span className="text-color-text-primary">{s.text}</span>
                    </div>
                  ))}

                  {/* Queue rows status */}
                  {meaningfulRows.length > 0 ? (
                    <>
                      <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[7px] text-xs">
                        <Icon icon="feather:layers" className="size-[13px] shrink-0 text-color-text-secondary" />
                        <span className="text-color-text-primary">
                          {meaningfulRows.length} {meaningfulRows.length === 1 ? "row" : "rows"} in queue
                        </span>
                      </div>

                      {rowErrors.length > 0 ? (
                        <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-negative/30 bg-color-negative/10 px-[10px] py-[7px] text-xs text-color-negative">
                          <Icon icon="feather:alert-circle" className="size-[13px] shrink-0" />
                          <span>{rowErrors.length} {rowErrors.length === 1 ? "row error" : "row errors"} — see inline</span>
                        </div>
                      ) : queueStats.errors === 0 && queueHasValidationResult ? (
                        <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-positive/30 bg-color-positive/10 px-[10px] py-[7px] text-xs text-color-positive">
                          <Icon icon="feather:check-circle" className="size-[13px] shrink-0" />
                          <span>All queue rows valid</span>
                        </div>
                      ) : null}

                      {queueStats.warnings > 0 && (
                        <div className="flex items-center gap-x-[8px] rounded-[8px] border border-amber-500/30 bg-amber-500/10 px-[10px] py-[7px] text-xs text-amber-500">
                          <Icon icon="feather:alert-triangle" className="size-[13px] shrink-0" />
                          <span>{queueStats.warnings} {queueStats.warnings === 1 ? "warning" : "warnings"}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[7px] text-xs">
                      <Icon icon="feather:layers" className="size-[13px] shrink-0 text-color-text-secondary" />
                      <span className="text-color-text-primary">No rows in queue yet</span>
                    </div>
                  )}

                  {projectsError && (
                    <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-negative/30 bg-color-negative/10 px-[10px] py-[7px] text-xs text-color-negative">
                      <Icon icon="feather:alert-triangle" className="size-[13px] shrink-0" />
                      <span>{projectsError}</span>
                    </div>
                  )}
                </div>
              </div>
              )}
              </aside>
            )}
          </div>
      </div>
    </div>
  </Container>
);
}
