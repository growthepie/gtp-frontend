import type { ProjectRecord, ProjectSimilarityMatch } from "@openlabels/oli-sdk";
import { findSimilarProjectMatches } from "@openlabels/oli-sdk";
import type { ExistingProjectMatch, MatchField, ProjectFormState } from "./types";
import {
  asString,
  dedupeUrls,
  ensureAbsoluteUrl,
  extractSLD,
  firstUrlFromUnknown,
  normalizeUrlForComparison,
  normalizeUrlList,
  normalizeTelegramInput,
  normalizeTwitterInput,
  urlsFromUnknown,
} from "./utils";

export const readProjectWebsite = (project: ProjectRecord): string =>
  asString(project.website) || firstUrlFromUnknown(project.websites);

export const readProjectGithub = (project: ProjectRecord): string =>
  asString(project.main_github) || firstUrlFromUnknown(project.github);

export const readProjectWebsiteList = (project: ProjectRecord): string[] =>
  dedupeUrls([...urlsFromUnknown(project.website), ...urlsFromUnknown(project.websites)]);

export const readProjectGithubList = (project: ProjectRecord): string[] =>
  dedupeUrls([...urlsFromUnknown(project.main_github), ...urlsFromUnknown(project.github)]);

export const readProjectSocial = (project: ProjectRecord, platform: "twitter" | "telegram"): string => {
  const direct = asString(project[platform]);
  if (direct) return direct;
  if (project.social && typeof project.social === "object") {
    const socialValue = (project.social as Record<string, unknown>)[platform];
    return firstUrlFromUnknown(socialValue);
  }
  return "";
};

export const toDisplayName = (project: ProjectRecord): string =>
  asString(project.display_name) || asString(project.owner_project);

export const mapSimilarityMatch = (
  match: ProjectSimilarityMatch,
  field: MatchField,
): ExistingProjectMatch => ({
  owner_project: asString(match.project.owner_project),
  display_name: toDisplayName(match.project),
  confidence: match.confidence,
  field,
});

export const mergeMatches = (...groups: ExistingProjectMatch[][]): ExistingProjectMatch[] => {
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

export const runFallbackUrlMatch = (
  value: string,
  field: MatchField,
  projects: ProjectRecord[],
): ExistingProjectMatch[] => {
  const normalizedInput = normalizeUrlForComparison(value);
  if (!normalizedInput) return [];

  const exact: ExistingProjectMatch[] = [];
  const similar: ExistingProjectMatch[] = [];

  for (const project of projects) {
    const sourceValue = field === "website" ? readProjectWebsite(project) : readProjectGithub(project);
    const normalizedSource = normalizeUrlForComparison(sourceValue);
    if (!normalizedSource) continue;

    const inputSLD = extractSLD(normalizedInput);
    const sourceSLD = extractSLD(normalizedSource);

    let confidence: "exact" | "similar" | null = null;
    if (normalizedSource === normalizedInput) {
      confidence = "exact";
    } else if (inputSLD && sourceSLD && inputSLD === sourceSLD) {
      confidence = "similar";
    }
    if (!confidence) continue;

    const candidate: ExistingProjectMatch = {
      owner_project: asString(project.owner_project),
      display_name: toDisplayName(project),
      confidence,
      field,
    };
    if (!candidate.owner_project) continue;

    if (confidence === "exact") {
      exact.push(candidate);
    } else {
      similar.push(candidate);
    }
  }

  return [...exact, ...similar].slice(0, 5);
};

export const getSimilarityMatches = (
  value: string,
  fieldType: "name" | "website" | "github",
  field: MatchField,
  normalizedProjects: ProjectRecord[],
  ownerProjectToProjectData: Record<string, unknown>,
): ExistingProjectMatch[] => {
  if (!value.trim() || normalizedProjects.length === 0) return [];

  const sdkMatches = findSimilarProjectMatches(value, fieldType, normalizedProjects, 5).map((match) =>
    mapSimilarityMatch(match, field),
  );

  const isUrlField = field === "website" || field === "github";
  const normInput = normalizeUrlForComparison(value);
  const inputSLD = normInput ? extractSLD(normInput) : "";
  const filteredSdkMatches =
    isUrlField && inputSLD
      ? sdkMatches.filter((match) => {
          const project = ownerProjectToProjectData[match.owner_project] as ProjectRecord | undefined;
          if (!project) return false;
          const projectUrl =
            field === "website" ? readProjectWebsite(project) : readProjectGithub(project);
          const normProject = normalizeUrlForComparison(projectUrl);
          return normProject ? extractSLD(normProject) === inputSLD : false;
        })
      : sdkMatches;

  const fallbackMatches = runFallbackUrlMatch(value, field, normalizedProjects);
  return mergeMatches(filteredSdkMatches, fallbackMatches);
};

export const normalizeProjectFormForContribution = (formState: ProjectFormState) => ({
  description: formState.description.trim(),
  websites: normalizeUrlList(formState.website, formState.additional_websites),
  github: normalizeUrlList(formState.main_github, formState.additional_github),
  twitter: normalizeTwitterInput(formState.twitter),
  telegram: normalizeTelegramInput(formState.telegram),
});
