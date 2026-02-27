export const PROJECT_EDIT_CONTRACT_SEED_STORAGE_KEY =
  "gtp:project-edit:contracts-seed:v1";

export type ProjectEditContractSeedRow = {
  chain_id: string;
  address: string;
  contract_name: string;
  owner_project: string;
  usage_category: string;
};

export type ProjectEditContractSeedPayload = {
  version: 1;
  source: "application-page";
  owner_project: string;
  created_at: number;
  rows: ProjectEditContractSeedRow[];
};

const isSeedRow = (value: unknown): value is ProjectEditContractSeedRow => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.chain_id === "string" &&
    typeof row.address === "string" &&
    typeof row.contract_name === "string" &&
    typeof row.owner_project === "string" &&
    typeof row.usage_category === "string"
  );
};

export const writeProjectEditContractSeed = (
  payload: ProjectEditContractSeedPayload,
): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      PROJECT_EDIT_CONTRACT_SEED_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // no-op: localStorage may be unavailable (private mode / blocked storage)
  }
};

export const readProjectEditContractSeed =
  (): ProjectEditContractSeedPayload | null => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(PROJECT_EDIT_CONTRACT_SEED_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<ProjectEditContractSeedPayload>;
      if (
        parsed.version !== 1 ||
        parsed.source !== "application-page" ||
        typeof parsed.owner_project !== "string" ||
        typeof parsed.created_at !== "number" ||
        !Array.isArray(parsed.rows) ||
        !parsed.rows.every(isSeedRow)
      ) {
        return null;
      }
      return {
        version: 1,
        source: "application-page",
        owner_project: parsed.owner_project,
        created_at: parsed.created_at,
        rows: parsed.rows,
      };
    } catch {
      return null;
    }
  };

export const clearProjectEditContractSeed = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(PROJECT_EDIT_CONTRACT_SEED_STORAGE_KEY);
  } catch {
    // no-op
  }
};
