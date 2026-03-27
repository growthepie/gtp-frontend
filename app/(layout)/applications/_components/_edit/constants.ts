import type { AttestationDiagnostics } from "@openlabels/oli-sdk";
import type { ProjectFormState, QueueEditableField, SearchDropdownOption } from "./types";

export const OWNER_PROJECT_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

export const MAX_QUEUE_ROWS = 500;

export const QUEUE_EDITABLE_FIELDS: QueueEditableField[] = [
  "chain_id",
  "address",
  "contract_name",
  "owner_project",
  "usage_category",
];

export const EMPTY_FORM: ProjectFormState = {
  owner_project: "",
  display_name: "",
  description: "",
  website: "",
  additional_websites: [],
  main_github: "",
  additional_github: [],
  twitter: "",
  telegram: "",
};

export const EMPTY_QUEUE_DIAGNOSTICS: AttestationDiagnostics = {
  errors: [],
  warnings: [],
  conversions: [],
  suggestions: [],
};

export const NO_OWNER_PROJECT_OPTION: SearchDropdownOption = {
  value: "",
  label: "No owner (wrong association)",
};
