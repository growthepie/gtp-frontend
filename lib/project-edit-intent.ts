export type ProjectEditMode = "add" | "edit";

export type ProjectEditSource =
  | "applications-list"
  | "application-page"
  | "website-check"
  | "legacy";

export type ProjectEditFocus = "metadata" | "contracts";

export type ProjectEditStart = "website" | "metadata" | "contracts";

export type SearchParamValue = string | string[] | null | undefined;

export type SearchParamsRecord = Record<string, SearchParamValue>;

type SearchParamsLike = {
  get: (key: string) => string | null;
};

export type ParsedProjectEditIntent = {
  mode: ProjectEditMode;
  source: ProjectEditSource;
  project: string;
  website: string;
  focus: ProjectEditFocus | "";
  start: ProjectEditStart;
};

export type BuildProjectEditIntentInput = {
  mode: ProjectEditMode;
  source?: ProjectEditSource;
  project?: string;
  website?: string;
  focus?: ProjectEditFocus;
  start?: ProjectEditStart;
};

const VALID_MODES: ProjectEditMode[] = ["add", "edit"];
const VALID_SOURCES: ProjectEditSource[] = [
  "applications-list",
  "application-page",
  "website-check",
  "legacy",
];
const VALID_FOCUSES: ProjectEditFocus[] = ["metadata", "contracts"];
const VALID_STARTS: ProjectEditStart[] = ["website", "metadata", "contracts"];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toFirstString = (value: SearchParamValue): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0].trim();
  }
  return "";
};

const readParam = (params: SearchParamsRecord | SearchParamsLike, key: string): string => {
  if ("get" in params && typeof params.get === "function") {
    return (params.get(key) || "").trim();
  }
  return toFirstString(params[key]);
};

const normalizeMode = (value: string): ProjectEditMode | null => {
  const candidate = value.toLowerCase();
  return VALID_MODES.includes(candidate as ProjectEditMode)
    ? (candidate as ProjectEditMode)
    : null;
};

const normalizeSource = (value: string): ProjectEditSource | null => {
  const candidate = value.toLowerCase();
  return VALID_SOURCES.includes(candidate as ProjectEditSource)
    ? (candidate as ProjectEditSource)
    : null;
};

const normalizeFocus = (value: string): ProjectEditFocus | "" => {
  const candidate = value.toLowerCase();
  return VALID_FOCUSES.includes(candidate as ProjectEditFocus)
    ? (candidate as ProjectEditFocus)
    : "";
};

const normalizeStart = (value: string): ProjectEditStart | null => {
  const candidate = value.toLowerCase();
  return VALID_STARTS.includes(candidate as ProjectEditStart)
    ? (candidate as ProjectEditStart)
    : null;
};

const inferModeFromPath = (pathname?: string): ProjectEditMode | null => {
  if (!pathname) {
    return null;
  }
  if (pathname.endsWith("/applications/edit") || pathname.endsWith("/edit")) {
    return "edit";
  }
  if (pathname.endsWith("/applications/add") || pathname.endsWith("/add")) {
    return "add";
  }
  return null;
};

const inferStart = ({
  mode,
  focus,
  start,
  website,
}: {
  mode: ProjectEditMode;
  focus: ProjectEditFocus | "";
  start: ProjectEditStart | null;
  website: string;
}): ProjectEditStart => {
  if (start) {
    return start;
  }

  if (focus === "contracts") {
    return "contracts";
  }

  if (mode === "add") {
    return isNonEmptyString(website) ? "metadata" : "website";
  }

  return "metadata";
};

export const parseProjectEditIntent = ({
  pathname,
  params,
  defaultSource = "legacy",
}: {
  pathname?: string;
  params: SearchParamsRecord | SearchParamsLike;
  defaultSource?: ProjectEditSource;
}): ParsedProjectEditIntent => {
  const modeParam = normalizeMode(readParam(params, "mode"));
  const project = readParam(params, "project");
  const website = readParam(params, "website");
  const sourceParam = normalizeSource(readParam(params, "source"));
  const focus = normalizeFocus(readParam(params, "focus"));
  const startParam = normalizeStart(readParam(params, "start"));

  const modeFromPath = inferModeFromPath(pathname);
  const mode = modeFromPath || modeParam || (project ? "edit" : "add");

  return {
    mode,
    source: sourceParam || defaultSource,
    project,
    website,
    focus,
    start: inferStart({ mode, focus, start: startParam, website }),
  };
};

export const buildProjectEditHref = ({
  mode,
  source,
  project,
  website,
  focus,
  start,
}: BuildProjectEditIntentInput): string => {
  const basePath = `/applications/${mode}`;
  const query = new URLSearchParams();

  if (source) {
    query.set("source", source);
  }
  if (isNonEmptyString(project)) {
    query.set("project", project.trim());
  }
  if (isNonEmptyString(website)) {
    query.set("website", website.trim());
  }
  if (focus) {
    query.set("focus", focus);
  }
  if (start) {
    query.set("start", start);
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

export const getProjectEditIntentKey = (intent: ParsedProjectEditIntent): string =>
  [intent.mode, intent.source, intent.project, intent.website, intent.focus, intent.start]
    .join("|")
    .toLowerCase();
