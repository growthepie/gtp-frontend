import type { PreparedAttestation } from "@openlabels/oli-sdk";

export type ProjectMode = "add" | "edit";

export type ProjectFormState = {
  owner_project: string;
  display_name: string;
  description: string;
  website: string;
  additional_websites: string[];
  main_github: string;
  additional_github: string[];
  twitter: string;
  telegram: string;
};

export type LogoUploadState = {
  base64: string;
  fileName: string;
  mimeType: string;
  previewUrl: string;
} | null;

export type ContributionResult = {
  yamlPullRequestUrl: string;
  logoPullRequestUrl: string | null;
  yamlBranchName?: string;
  logoBranchName?: string | null;
  combinedPullRequest?: boolean;
};

export type MatchField = "owner_project" | "website" | "github";

export type ExistingProjectMatch = {
  owner_project: string;
  display_name: string;
  confidence: "exact" | "similar";
  field: MatchField;
};

export type QueueSubmitPreview = {
  flow: "single" | "bulk";
  preparedRows: PreparedAttestation[];
  rowsSignature: string;
};

export type QueueEditableField =
  | "chain_id"
  | "address"
  | "contract_name"
  | "owner_project"
  | "usage_category";

export type SearchDropdownOption = {
  value: string;
  label: string;
};
