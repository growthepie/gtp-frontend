// Pure utility functions — no React, no side effects

export const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}`;
  return "";
};

export const cleanYamlValue = (value: string): string =>
  value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+#.*$/, "")
    .trim();

export const ensureAbsoluteUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

export const normalizeOwnerProjectInput = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/-{2,}/g, "-");

export const normalizeTwitterInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
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

export const normalizeTelegramInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("t.me/")) {
    return ensureAbsoluteUrl(trimmed);
  }
  const handle = trimmed.replace(/^@/, "");
  return handle ? `https://t.me/${handle}` : "";
};

export const areStringArraysEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((v, i) => v === right[i]);

export const isValidHttpUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(ensureAbsoluteUrl(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const extractSLD = (normalizedUrl: string): string => {
  const host = normalizedUrl.split("/")[0];
  const parts = host.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : host;
};

export const normalizeUrlForComparison = (value: string): string => {
  if (!value.trim()) return "";
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

export const parseYamlScalar = (yamlText: string, key: string): string => {
  const match = yamlText.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match?.[1] ? cleanYamlValue(match[1]) : "";
};

export const parseFirstUrlInBlock = (yamlText: string, blockKey: string): string => {
  const blockMatch = yamlText.match(
    new RegExp(`^\\s*${blockKey}:\\s*(?:\\r?\\n)([\\s\\S]*?)(?=^\\s*[a-zA-Z_]+:|\\Z)`, "m"),
  );
  if (!blockMatch?.[1]) return "";
  const urlMatch = blockMatch[1].match(/-\s*url:\s*(.+)/);
  return urlMatch?.[1] ? cleanYamlValue(urlMatch[1]) : "";
};

export const parseProfilerYaml = (yamlText: string): Partial<import("./types").ProjectFormState> => {
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

export const dedupeUrls = (values: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    deduped.push(trimmed);
  }
  return deduped;
};

export const mergeUrlLists = (formUrls: string[], originalUrls: string[]): string[] =>
  dedupeUrls([...formUrls, ...originalUrls.map(ensureAbsoluteUrl).filter(Boolean)]);

export const firstUrlFromUnknown = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "url" in entry && typeof (entry as { url?: unknown }).url === "string") {
        return (entry as { url: string }).url;
      }
    }
  }
  if (value && typeof value === "object" && "url" in value && typeof (value as { url?: unknown }).url === "string") {
    return (value as { url: string }).url;
  }
  return "";
};

export const urlsFromUnknown = (value: unknown): string[] => {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) {
    const urls: string[] = [];
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) {
        urls.push(entry.trim());
        continue;
      }
      if (entry && typeof entry === "object" && "url" in entry && typeof (entry as { url?: unknown }).url === "string") {
        const url = (entry as { url: string }).url.trim();
        if (url) urls.push(url);
      }
    }
    return dedupeUrls(urls);
  }
  if (value && typeof value === "object" && "url" in value && typeof (value as { url?: unknown }).url === "string") {
    const url = (value as { url: string }).url.trim();
    return url ? [url] : [];
  }
  return [];
};

export const normalizeUrlList = (primary: string, additional: string[]): string[] =>
  dedupeUrls(
    [primary, ...additional]
      .map((v) => ensureAbsoluteUrl(v))
      .filter((v) => v.length > 0),
  );

export const extractCoreName = (website: string): string => {
  try {
    const hostname = new URL(ensureAbsoluteUrl(website)).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  } catch {
    return "";
  }
};

export const truncateHex = (value: string, start = 14, end = 12): string => {
  if (!value || value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

export const truncateMiddle = (addr: string, start = 12, end = 6): string => {
  if (!addr || addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
};

export const getTxExplorerUrl = (_chainId: string, txHash: string): string =>
  `https://base.blockscout.com/tx/${txHash}`;

export const getAttestationUrl = (_chainId: string, uid: string): string =>
  `https://base.easscan.org/attestation/view/${uid}`;

export const hasMeaningfulRowData = (row: { address?: unknown; contract_name?: unknown; owner_project?: unknown; usage_category?: unknown }): boolean => {
  const address = toStringValue(row.address).trim();
  const contractName = toStringValue(row.contract_name).trim();
  const ownerProject = toStringValue(row.owner_project).trim();
  const usageCategory = toStringValue(row.usage_category).trim();
  return Boolean(address || contractName || ownerProject || usageCategory);
};

export const getQueueRowKey = (chainId: string, address: string, ownerProject: string): string =>
  `${chainId}::${address}::${ownerProject}`;

export const rowPreviewSignature = (row: { chain_id?: unknown; address?: unknown; contract_name?: unknown; owner_project?: unknown; usage_category?: unknown }): string =>
  JSON.stringify({
    chain_id: toStringValue(row.chain_id).trim(),
    address: toStringValue(row.address).trim().toLowerCase(),
    contract_name: toStringValue(row.contract_name).trim(),
    owner_project: toStringValue(row.owner_project).trim(),
    usage_category: toStringValue(row.usage_category).trim(),
  });
