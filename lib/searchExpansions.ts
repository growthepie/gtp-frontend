/**
 * Search term expansions for grouped results (sections with subheadings only).
 * When the user types an exact short term, we also match the listed normalized
 * terms for the specified buckets. Add or edit entries here to control which
 * sections (Applications, Blockspace, Quick Bites, Chains) get expanded matches.
 */
export type SearchExpansionBucket = "Applications" | "Blockspace" | "Quick Bites" | "Chains";

const SEARCH_EXPANSIONS: Record<string, Partial<Record<SearchExpansionBucket, string[]>>> = {
  defi: {
    Applications: ["finance"],
    Blockspace: ["finance"],
    "Quick Bites": ["finance"],
  },
  rwa: {
    Applications: ["realworldassets"],
    Blockspace: ["realworldassets"],
    "Quick Bites": ["realworldassets"],
  },
  rwas: {
    Applications: ["realworldassets"],
    Blockspace: ["realworldassets"],
    "Quick Bites": ["realworldassets"],
  },
  cex: {
    Applications: ["centralizedexchange"],
    Blockspace: ["centralizedexchange"],
    "Quick Bites": ["centralizedexchange"],
  },
  dex: {
    Applications: ["decentralizedexchange"],
    Blockspace: ["decentralizedexchange"],
    "Quick Bites": ["decentralizedexchange"],
  },
  da: {
    "Quick Bites": ["dataavailability"],
  },
  "realworldusecase": {
    Applications: ["realworlduse-case", "realworldusecase"],
    Blockspace: ["realworlduse-case", "realworldusecase"],
    "Quick Bites": ["realworlduse-case", "realworldusecase"],
  },
  "realworldusecases": {
    Applications: ["realworlduse-case", "realworldusecase"],
    Blockspace: ["realworlduse-case", "realworldusecase"],
    "Quick Bites": ["realworlduse-case", "realworldusecase"],
  },
};

/**
 * Short queries that should show the full bucket (all options, no subheading).
 * Key = normalized query (e.g. "da"), value = exact bucket label (e.g. "Data Availability").
 */
export const BUCKET_SHORT_QUERIES: Record<string, string> = {
  da: "Data Availability",
};

/**
 * Returns the bucket label to use as a full-bucket match for this short query, or null.
 */
export function getBucketLabelForShortQuery(normalizedQuery: string): string | null {
  return BUCKET_SHORT_QUERIES[normalizedQuery] ?? null;
}

/**
 * Normalized group labels to exclude from matches per query per bucket.
 * E.g. for "cex" we match "centralized exchange" but exclude "decentralized exchange".
 */
const SEARCH_EXCLUSIONS: Record<string, Partial<Record<SearchExpansionBucket, string[]>>> = {
  cex: {
    Applications: ["decentralizedexchange"],
    Blockspace: ["decentralizedexchange"],
    "Quick Bites": ["decentralizedexchange"],
  },
};

/**
 * Returns the search terms used for grouped results (subheading sections) in this bucket.
 * When this bucket has expansion terms for the query, only those are returned (so e.g. "cex"
 * matches only "centralized exchange", not "decentralized exchange"). When there are no
 * expansion terms, the raw normalized query is used.
 */
export function getExpandedSearchTermsForBucket(
  normalizedQuery: string,
  bucketLabel: string
): string[] {
  const bucketExpansions = SEARCH_EXPANSIONS[normalizedQuery]?.[bucketLabel as SearchExpansionBucket] ?? [];
  if (bucketExpansions.length > 0) return bucketExpansions;
  return [normalizedQuery];
}

/**
 * Returns normalized group labels to exclude for this query in this bucket.
 * Any group whose normalized label is in this list is filtered out.
 */
export function getExcludedGroupLabelsForBucket(
  normalizedQuery: string,
  bucketLabel: string
): string[] {
  return SEARCH_EXCLUSIONS[normalizedQuery]?.[bucketLabel as SearchExpansionBucket] ?? [];
}
