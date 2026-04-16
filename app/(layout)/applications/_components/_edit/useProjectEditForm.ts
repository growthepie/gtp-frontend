"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ProjectRecord } from "@openlabels/oli-sdk";
import { fetchProjects } from "@openlabels/oli-sdk";
import type { parseProjectEditIntent } from "@/lib/project-edit-intent";
import type {
  ContributionResult,
  ExistingProjectMatch,
  LogoUploadState,
  MatchField,
  ProjectFormState,
  ProjectMode,
} from "./types";
import { EMPTY_FORM, OWNER_PROJECT_PATTERN } from "./constants";
import {
  areStringArraysEqual,
  asString,
  ensureAbsoluteUrl,
  extractCoreName,
  extractSLD,
  isValidHttpUrl,
  mergeUrlLists,
  normalizeTelegramInput,
  normalizeOwnerProjectInput,
  normalizeTwitterInput,
  normalizeUrlForComparison,
  normalizeUrlList,
  parseProfilerYaml,
} from "./utils";
import {
  getSimilarityMatches,
  mergeMatches,
  normalizeProjectFormForContribution,
  readProjectGithub,
  readProjectGithubList,
  readProjectSocial,
  readProjectWebsite,
  readProjectWebsiteList,
  toDisplayName,
} from "./projectDataUtils";

type Intent = ReturnType<typeof parseProjectEditIntent>;

type UseProjectEditFormParams = {
  intent: Intent;
  intentKey: string;
  searchParams: ReadonlyURLSearchParams | null;
  ownerProjectToProjectData: Record<string, unknown>;
};

export type ProjectEditFormReturn = {
  // State
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  logoUpload: LogoUploadState;
  setLogoUpload: React.Dispatch<React.SetStateAction<LogoUploadState>>;
  localMode: ProjectMode;
  setLocalMode: React.Dispatch<React.SetStateAction<ProjectMode>>;
  isAddMode: boolean;
  contributionResult: ContributionResult | null;
  setContributionResult: React.Dispatch<React.SetStateAction<ContributionResult | null>>;
  isSubmittingContribution: boolean;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  isProfiling: boolean;
  profilerError: string;
  profilerInfo: string;
  isEnhancingDesc: boolean;
  enhanceDescError: string;
  enhanceDescInfo: string;
  projectsError: string;
  activeDropdownField: keyof ProjectFormState | null;
  setActiveDropdownField: React.Dispatch<React.SetStateAction<keyof ProjectFormState | null>>;

  // Computed
  projects: ProjectRecord[];
  normalizedProjects: ProjectRecord[];
  existingOwnerProject: ProjectRecord | undefined;
  collapsedLogoSrc: string;
  validationErrors: Partial<Record<keyof ProjectFormState, string>>;
  hasBlockingErrors: boolean;
  hasFormChanges: boolean;
  canSubmitContribution: boolean;
  hasFormChangedSinceSubmission: boolean;
  formSuggestions: { icon: string; text: string }[];
  ownerProjectSuggestions: ProjectRecord[];
  displayNameSuggestions: ProjectRecord[];
  websiteSuggestions: ProjectRecord[];
  githubSuggestions: ProjectRecord[];
  allProjectMatches: ExistingProjectMatch[];

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement>;
  loadedFormRef: React.MutableRefObject<ProjectFormState>;
  loadedWebsiteUrlsRef: React.MutableRefObject<string[]>;
  loadedGithubUrlsRef: React.MutableRefObject<string[]>;
  submittedFormSnapshotRef: React.MutableRefObject<{ form: ProjectFormState; hasLogo: boolean } | null>;

  // Callbacks
  updateField: <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => void;
  updateAdditionalUrlField: (key: "additional_websites" | "additional_github", index: number, value: string) => void;
  addAdditionalUrlField: (key: "additional_websites" | "additional_github") => void;
  removeAdditionalUrlField: (key: "additional_websites" | "additional_github", index: number) => void;
  fillFormFromProject: (project: ProjectRecord) => void;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  runProfiler: (websiteOverride?: string) => Promise<boolean>;
  enhanceDescription: () => Promise<void>;
  submitProjectContribution: (setActiveStep: (step: 1 | 2 | 3 | 4) => void) => Promise<void>;
  switchToAdd: () => void;
  switchToFind: () => void;
};

export function useProjectEditForm({
  intent,
  intentKey,
  searchParams,
  ownerProjectToProjectData,
}: UseProjectEditFormParams): ProjectEditFormReturn {
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const hydratedIntentRef = useRef("");
  const autofilledOwnerRef = useRef("");
  const loadedFormRef = useRef<ProjectFormState>({ ...EMPTY_FORM });
  const submittedFormSnapshotRef = useRef<{ form: ProjectFormState; hasLogo: boolean } | null>(null);
  const loadedWebsiteUrlsRef = useRef<string[]>([]);
  const loadedGithubUrlsRef = useRef<string[]>([]);

  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [logoUpload, setLogoUpload] = useState<LogoUploadState>(null);
  const [selectedProjectLogoPath, setSelectedProjectLogoPath] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState<ProjectMode>(intent.mode);
  const isAddMode = localMode === "add";

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsError, setProjectsError] = useState("");

  const [contributionResult, setContributionResult] = useState<ContributionResult | null>(null);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isProfiling, setIsProfiling] = useState(false);
  const [profilerError, setProfilerError] = useState("");
  const [profilerInfo, setProfilerInfo] = useState("");
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
  const [enhanceDescError, setEnhanceDescError] = useState("");
  const [enhanceDescInfo, setEnhanceDescInfo] = useState("");

  const [activeDropdownField, setActiveDropdownField] = useState<keyof ProjectFormState | null>(null);

  // Load projects
  const loadProjects = useCallback(async (activeRef?: { current: boolean }) => {
    setProjectsError("");
    try {
      const data = await fetchProjects();
      if (activeRef && !activeRef.current) return;
      setProjects(data);
    } catch {
      if (activeRef && !activeRef.current) return;
      setProjects([]);
      setProjectsError("Could not load OSS directory projects. Duplicate checks are limited.");
    }
  }, []);

  useEffect(() => {
    const activeRef = { current: true };
    loadProjects(activeRef);
    return () => { activeRef.current = false; };
  }, [loadProjects]);

  // Hydrate form from intent
  useEffect(() => {
    if (hydratedIntentRef.current === intentKey) return;
    hydratedIntentRef.current = intentKey;
    autofilledOwnerRef.current = "";

    setLocalMode(intent.mode);
    setProfilerError("");
    setProfilerInfo("");
    setLogoUpload(null);

    const extraMainGithub = searchParams?.get("main_github") || "";
    const extraTwitter = searchParams?.get("twitter") || "";
    const extraDisplayName = searchParams?.get("display_name") || "";

    setForm((prev) => {
      if (intent.mode === "add") {
        return {
          ...EMPTY_FORM,
          owner_project: intent.project || "",
          website: intent.website || "",
          main_github: extraMainGithub,
          twitter: extraTwitter,
          display_name: extraDisplayName,
        };
      }
      return {
        ...prev,
        owner_project: intent.project || prev.owner_project,
        website: intent.website || prev.website,
        ...(extraMainGithub && { main_github: extraMainGithub }),
        ...(extraTwitter && { twitter: extraTwitter }),
        ...(extraDisplayName && { display_name: extraDisplayName }),
      };
    });
  }, [intent, intentKey, searchParams]);

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
      if (owner) map.set(owner, project);
    }
    return map;
  }, [normalizedProjects]);

  const normalizedOwnerProject = form.owner_project.trim().toLowerCase();
  const existingOwnerProject = normalizedOwnerProject
    ? projectsByOwner.get(normalizedOwnerProject)
    : undefined;

  // Auto-fill form when editing an existing project
  useEffect(() => {
    if (!existingOwnerProject || localMode !== "edit") return;
    const ownerKey = asString(existingOwnerProject.owner_project).toLowerCase();
    if (!ownerKey || ownerKey === autofilledOwnerRef.current) return;

    setForm((prev) => {
      const websiteList = readProjectWebsiteList(existingOwnerProject);
      const githubList = readProjectGithubList(existingOwnerProject);
      const updated: ProjectFormState = {
        ...prev,
        owner_project: asString(existingOwnerProject.owner_project) || prev.owner_project,
        display_name: asString(existingOwnerProject.display_name) || prev.display_name,
        description: asString(existingOwnerProject.description) || prev.description,
        website: websiteList[0] || prev.website,
        additional_websites: websiteList.slice(1),
        main_github: githubList[0] || prev.main_github,
        additional_github: githubList.slice(1),
        twitter: readProjectSocial(existingOwnerProject, "twitter") || prev.twitter,
        telegram: readProjectSocial(existingOwnerProject, "telegram") || prev.telegram,
      };
      loadedFormRef.current = updated;
      loadedWebsiteUrlsRef.current = websiteList;
      loadedGithubUrlsRef.current = githubList;
      return updated;
    });
    autofilledOwnerRef.current = ownerKey;
  }, [existingOwnerProject, localMode]);

  const collapsedOwnerProject = form.owner_project.trim();
  const collapsedLogoPath =
    (ownerProjectToProjectData[collapsedOwnerProject] as { logo_path?: string } | undefined)?.logo_path
    ?? selectedProjectLogoPath;
  const collapsedLogoSrc =
    logoUpload?.previewUrl ||
    (collapsedLogoPath ? `https://api.growthepie.com/v1/apps/logos/${collapsedLogoPath}` : "");

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof ProjectFormState, string>> = {};
    if (!form.owner_project.trim()) {
      errors.owner_project = "Owner project key is required.";
    } else if (!OWNER_PROJECT_PATTERN.test(form.owner_project.trim())) {
      errors.owner_project = "Use lowercase letters and numbers with '-' or '_' between words.";
    } else if (localMode === "add" && existingOwnerProject) {
      errors.owner_project = "This key already exists. Switch to edit mode or use another key.";
    } else if (localMode === "edit" && !existingOwnerProject) {
      errors.owner_project = "Project key not found in OSS directory.";
    }
    if (!form.display_name.trim()) {
      errors.display_name = "Display name is required.";
    }
    if (form.website.trim() && !isValidHttpUrl(form.website)) {
      errors.website = "Enter a valid website URL (for example https://example.com).";
    } else if (form.additional_websites.some((url) => url.trim() && !isValidHttpUrl(url))) {
      errors.website = "Every website URL must be valid.";
    }
    if (form.main_github.trim() && !isValidHttpUrl(form.main_github)) {
      errors.main_github = "Enter a valid GitHub URL.";
    } else if (form.additional_github.some((url) => url.trim() && !isValidHttpUrl(url))) {
      errors.main_github = "Every GitHub URL must be valid.";
    }
    if (form.twitter.trim() && !isValidHttpUrl(normalizeTwitterInput(form.twitter))) {
      errors.twitter = "Enter a valid X/Twitter URL or handle.";
    }
    if (form.telegram.trim() && !isValidHttpUrl(normalizeTelegramInput(form.telegram))) {
      errors.telegram = "Enter a valid Telegram URL or handle.";
    }
    return errors;
  }, [existingOwnerProject, form, localMode]);

  const hasBlockingErrors = Object.values(validationErrors).some(Boolean);

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

  const hasFormChangedSinceSubmission = useMemo(() => {
    if (!contributionResult) return false;
    const snap = submittedFormSnapshotRef.current;
    if (!snap) return false;
    const formChanged = (Object.keys(form) as (keyof ProjectFormState)[]).some((k) => form[k] !== snap.form[k]);
    return formChanged || Boolean(logoUpload) !== snap.hasLogo;
  }, [contributionResult, form, logoUpload]);

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
    const hasExistingLogo = !!(ownerProjectToProjectData[form.owner_project.trim()] as { logo_path?: string } | undefined)?.logo_path;
    if (!logoUpload && !hasExistingLogo) {
      hints.push({ icon: "feather:image", text: "No logo set — upload one to improve project visibility." });
    }
    if (!form.twitter.trim()) hints.push({ icon: "ri:twitter-x-fill", text: "X (Twitter) handle missing — add it if the project has one." });
    if (!form.telegram.trim()) hints.push({ icon: "feather:send", text: "Telegram handle missing — add it if the project has one." });
    return hints;
  }, [form, logoUpload, ownerProjectToProjectData]);

  const ownerProjectSuggestions = useMemo(() => {
    const val = form.owner_project.trim().toLowerCase();
    if (!val) return [];
    const matchScore = (p: ProjectRecord): number => {
      const owner = asString(p.owner_project).toLowerCase();
      const name = asString(p.display_name).toLowerCase();
      if (owner === val || name === val) return 0;
      if (owner.startsWith(val) || name.startsWith(val)) return 1;
      return 2;
    };
    return normalizedProjects
      .filter((p) => {
        const owner = asString(p.owner_project).toLowerCase();
        const name = asString(p.display_name).toLowerCase();
        return owner.includes(val) || name.includes(val);
      })
      .sort((a, b) => matchScore(a) - matchScore(b))
      .slice(0, 6);
  }, [form.owner_project, normalizedProjects]);

  const displayNameSuggestions = useMemo(() => {
    const val = form.display_name.trim().toLowerCase();
    if (!val) return [];
    const matchScore = (p: ProjectRecord): number => {
      const owner = asString(p.owner_project).toLowerCase();
      const name = asString(p.display_name).toLowerCase();
      if (name === val || owner === val) return 0;
      if (name.startsWith(val) || owner.startsWith(val)) return 1;
      return 2;
    };
    return normalizedProjects
      .filter((p) =>
        asString(p.display_name).toLowerCase().includes(val) ||
        asString(p.owner_project).toLowerCase().includes(val),
      )
      .sort((a, b) => matchScore(a) - matchScore(b))
      .slice(0, 6);
  }, [form.display_name, normalizedProjects]);

  const websiteSuggestions = useMemo(() => {
    const val = normalizeUrlForComparison(form.website);
    if (!val) return [];
    const inputSLD = extractSLD(val);
    return normalizedProjects
      .filter((p) => {
        const pUrl = normalizeUrlForComparison(readProjectWebsite(p));
        return pUrl && extractSLD(pUrl) === inputSLD;
      })
      .slice(0, 6);
  }, [form.website, normalizedProjects]);

  const githubSuggestions = useMemo(() => {
    const val = normalizeUrlForComparison(form.main_github);
    if (!val) return [];

    // For path-based platforms (github.com, gitlab.com, etc.) the SLD is always
    // the platform name, so SLD-matching hits every project on that platform.
    // Match by org/user path segment instead.
    const valParts = val.split("/");
    const valHost = valParts[0];
    const valOrg = valParts[1]?.toLowerCase() || "";
    const isPathBased = /^(github|gitlab|bitbucket)\./.test(valHost);

    if (isPathBased && valOrg) {
      return normalizedProjects
        .filter((p) => {
          const pUrl = normalizeUrlForComparison(readProjectGithub(p));
          if (!pUrl) return false;
          const pParts = pUrl.split("/");
          return pParts[0] === valHost && pParts[1]?.toLowerCase() === valOrg;
        })
        .slice(0, 6);
    }

    const inputSLD = extractSLD(val);
    return normalizedProjects
      .filter((p) => {
        const pUrl = normalizeUrlForComparison(readProjectGithub(p));
        return pUrl && extractSLD(pUrl) === inputSLD;
      })
      .slice(0, 6);
  }, [form.main_github, normalizedProjects]);

  const allProjectMatches = useMemo((): ExistingProjectMatch[] => {
    if (!isAddMode) return [];
    const ownerMatches: ExistingProjectMatch[] = existingOwnerProject
      ? [{ owner_project: asString(existingOwnerProject.owner_project), display_name: toDisplayName(existingOwnerProject), confidence: "exact", field: "owner_project" }]
      : ownerProjectSuggestions.map((p) => ({ owner_project: asString(p.owner_project), display_name: toDisplayName(p), confidence: "similar" as const, field: "owner_project" as MatchField }));
    const displayMatches: ExistingProjectMatch[] = displayNameSuggestions.map((p) => ({
      owner_project: asString(p.owner_project),
      display_name: toDisplayName(p),
      confidence: "similar" as const,
      field: "owner_project" as MatchField,
    }));
    const websiteMatches = form.website.trim()
      ? getSimilarityMatches(ensureAbsoluteUrl(form.website), "website", "website", normalizedProjects, ownerProjectToProjectData)
      : [];
    const githubMatches = form.main_github.trim()
      ? getSimilarityMatches(ensureAbsoluteUrl(form.main_github), "github", "github", normalizedProjects, ownerProjectToProjectData)
      : [];
    return mergeMatches(ownerMatches, displayMatches, websiteMatches, githubMatches).slice(0, 5);
  }, [isAddMode, existingOwnerProject, ownerProjectSuggestions, displayNameSuggestions, form.website, form.main_github, normalizedProjects, ownerProjectToProjectData]);

  // Callbacks
  const updateField = useCallback(<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
    setContributionResult(null);
    setSubmitError(null);
    if (key === "owner_project") { setLogoUpload(null); setSelectedProjectLogoPath(null); }
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateAdditionalUrlField = useCallback((
    key: "additional_websites" | "additional_github",
    index: number,
    value: string,
  ) => {
    setContributionResult(null);
    setSubmitError(null);
    setForm((prev) => {
      const nextValues = [...prev[key]];
      nextValues[index] = value;
      return { ...prev, [key]: nextValues };
    });
  }, []);

  const addAdditionalUrlField = useCallback((key: "additional_websites" | "additional_github") => {
    setContributionResult(null);
    setSubmitError(null);
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  }, []);

  const removeAdditionalUrlField = useCallback((key: "additional_websites" | "additional_github", index: number) => {
    setContributionResult(null);
    setSubmitError(null);
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  }, []);

  const fillFormFromProject = useCallback((project: ProjectRecord) => {
    const websiteList = readProjectWebsiteList(project);
    const githubList = readProjectGithubList(project);
    const twitter = readProjectSocial(project, "twitter");
    const telegram = readProjectSocial(project, "telegram");
    const newForm: ProjectFormState = {
      owner_project: asString(project.owner_project),
      display_name: toDisplayName(project),
      description: asString(project.description),
      website: websiteList[0] || "",
      additional_websites: websiteList.slice(1),
      main_github: githubList[0] || "",
      additional_github: githubList.slice(1),
      twitter,
      telegram,
    };
    const logoPath = (project as unknown as { logo_path?: string | null }).logo_path;
    setSelectedProjectLogoPath(typeof logoPath === "string" ? logoPath : null);
    setLogoUpload(null);
    setForm(newForm);
    loadedFormRef.current = newForm;
    loadedWebsiteUrlsRef.current = websiteList;
    loadedGithubUrlsRef.current = githubList;
    setContributionResult(null);
    setSubmitError(null);
    setActiveDropdownField(null);
    setLocalMode("edit");
  }, []);

  const onLogoChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setLogoUpload({ base64: result, fileName: file.name, mimeType: file.type, previewUrl: result });
    };
    reader.readAsDataURL(file);
  }, []);

  const runProfiler = useCallback(async (websiteOverride?: string): Promise<boolean> => {
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
        body: JSON.stringify({ url: ensureAbsoluteUrl(website), coreName: extractCoreName(website) }),
      });
      const data = (await response.json().catch(() => ({}))) as { yaml?: string; error?: string };
      if (!response.ok || !data.yaml) throw new Error(data.error || "Failed to run profiler.");
      const parsed = parseProfilerYaml(data.yaml);
      setForm((prev) => ({
        ...prev,
        owner_project: parsed.owner_project ? normalizeOwnerProjectInput(parsed.owner_project) : prev.owner_project,
        display_name: parsed.display_name || prev.display_name,
        description: parsed.description || prev.description,
        website: parsed.website || ensureAbsoluteUrl(prev.website),
      }));
      setProfilerInfo("AI profile completed. Review values before submitting.");
      return true;
    } catch (error: any) {
      setProfilerError(error?.message || "Failed to run profiler.");
      return false;
    } finally {
      setIsProfiling(false);
    }
  }, [form.website]);

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
        body: JSON.stringify({ url: ensureAbsoluteUrl(website), coreName: extractCoreName(website) }),
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

  const submitProjectContribution = useCallback(async (setActiveStep: (step: 1 | 2 | 3 | 4) => void) => {
    if (!canSubmitContribution) return;

    setIsSubmittingContribution(true);
    setSubmitError(null);
    setContributionResult(null);

    try {
      const projectPayload: {
        owner_project: string;
        display_name: string;
        description?: string;
        websites?: string[];
        github?: string[];
        twitter?: string;
        telegram?: string;
      } = {
        owner_project: form.owner_project.trim().toLowerCase(),
        display_name: form.display_name.trim(),
      };

      const normalizedCurrent = normalizeProjectFormForContribution(form);
      if (localMode === "add") {
        if (normalizedCurrent.description) projectPayload.description = normalizedCurrent.description;
        if (normalizedCurrent.websites.length > 0) projectPayload.websites = normalizedCurrent.websites;
        if (normalizedCurrent.github.length > 0) projectPayload.github = normalizedCurrent.github;
        if (normalizedCurrent.twitter) projectPayload.twitter = normalizedCurrent.twitter;
        if (normalizedCurrent.telegram) projectPayload.telegram = normalizedCurrent.telegram;
      } else {
        const normalizedLoaded = normalizeProjectFormForContribution(loadedFormRef.current);
        if (normalizedCurrent.description && normalizedCurrent.description !== normalizedLoaded.description) {
          projectPayload.description = normalizedCurrent.description;
        }
        const mergedWebsites = mergeUrlLists(normalizedCurrent.websites, loadedWebsiteUrlsRef.current);
        const mergedGithub = mergeUrlLists(normalizedCurrent.github, loadedGithubUrlsRef.current);
        const originalWebsites = normalizeUrlList(loadedFormRef.current.website, loadedFormRef.current.additional_websites);
        const originalGithub = normalizeUrlList(loadedFormRef.current.main_github, loadedFormRef.current.additional_github);
        if (mergedWebsites.length > 0 && !areStringArraysEqual(mergedWebsites, originalWebsites)) {
          projectPayload.websites = mergedWebsites;
        }
        if (mergedGithub.length > 0 && !areStringArraysEqual(mergedGithub, originalGithub)) {
          projectPayload.github = mergedGithub;
        }
        if (normalizedCurrent.twitter && normalizedCurrent.twitter !== normalizedLoaded.twitter) {
          projectPayload.twitter = normalizedCurrent.twitter;
        }
        if (normalizedCurrent.telegram && normalizedCurrent.telegram !== normalizedLoaded.telegram) {
          projectPayload.telegram = normalizedCurrent.telegram;
        }
      }

      const response = await fetch("/api/labels/project-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: localMode,
          project: projectPayload,
          logo: logoUpload
            ? { base64: logoUpload.base64, fileName: logoUpload.fileName, mimeType: logoUpload.mimeType }
            : undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        yamlPullRequestUrl?: string;
        logoPullRequestUrl?: string | null;
        yamlBranchName?: string;
        logoBranchName?: string | null;
        combinedPullRequest?: boolean;
      };

      if (!response.ok || !data.yamlPullRequestUrl) {
        throw new Error(data.error || "Failed to submit project contribution.");
      }

      submittedFormSnapshotRef.current = { form: { ...form }, hasLogo: Boolean(logoUpload) };
      setContributionResult({
        yamlPullRequestUrl: data.yamlPullRequestUrl,
        logoPullRequestUrl: data.logoPullRequestUrl ?? null,
        yamlBranchName: data.yamlBranchName,
        logoBranchName: data.logoBranchName,
        combinedPullRequest: data.combinedPullRequest ?? false,
      });
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to submit project contribution.");
    } finally {
      setIsSubmittingContribution(false);
    }
  }, [canSubmitContribution, form, localMode, logoUpload]);

  const switchToAdd = useCallback(() => {
    setLocalMode("add");
    setForm({ ...EMPTY_FORM });
    setLogoUpload(null);
    setContributionResult(null);
    setSubmitError(null);
    setProfilerInfo("");
    setProfilerError("");
    autofilledOwnerRef.current = "";
    loadedWebsiteUrlsRef.current = [];
    loadedGithubUrlsRef.current = [];
  }, []);

  const switchToFind = useCallback(() => {
    setLocalMode("edit");
    setForm({ ...EMPTY_FORM });
    setLogoUpload(null);
    setContributionResult(null);
    setSubmitError(null);
    setProfilerInfo("");
    setProfilerError("");
    autofilledOwnerRef.current = "";
    loadedWebsiteUrlsRef.current = [];
    loadedGithubUrlsRef.current = [];
  }, []);

  return {
    form, setForm,
    logoUpload, setLogoUpload,
    localMode, setLocalMode,
    isAddMode,
    contributionResult, setContributionResult,
    isSubmittingContribution,
    submitError, setSubmitError,
    isProfiling, profilerError, profilerInfo,
    isEnhancingDesc, enhanceDescError, enhanceDescInfo,
    projectsError,
    activeDropdownField, setActiveDropdownField,
    projects, normalizedProjects,
    existingOwnerProject,
    collapsedLogoSrc,
    validationErrors, hasBlockingErrors,
    hasFormChanges, canSubmitContribution, hasFormChangedSinceSubmission,
    formSuggestions,
    ownerProjectSuggestions, displayNameSuggestions, websiteSuggestions, githubSuggestions,
    allProjectMatches,
    fileInputRef,
    loadedFormRef, loadedWebsiteUrlsRef, loadedGithubUrlsRef, submittedFormSnapshotRef,
    updateField, updateAdditionalUrlField, addAdditionalUrlField, removeAdditionalUrlField,
    fillFormFromProject, onLogoChange,
    runProfiler, enhanceDescription, submitProjectContribution,
    switchToAdd, switchToFind,
  };
}
