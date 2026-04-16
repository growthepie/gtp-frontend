# Changelog: `feature/project-page` since `6a8025c`

**Base commit:** `6a8025c` — Merge from `growthepie:main` into `feature/project-page` (Feb 27, 2026)

**Branch:** `feature/project-page`
**Report generated:** 2026-03-11

---

## Phase 1 — API Foundation & GitHub Contribution Pipeline

**Feb 27 | Commits: `6170bded`, `0983ce02`, `5f2c6bd4`**

The first set of changes focused entirely on building the server-side pipeline for submitting project contributions as GitHub PRs.

### `6170bded` — GitHub API helpers & `.gitignore` hygiene

- `app/api/labels/project-contribution/route.ts` (+145): Added utility functions for constructing GitHub repository references, merging payloads, and structuring PR bodies. Scaffolding needed before multi-URL support could land.
- `.gitignore`: Added `*.env*.local` exclusion to prevent accidental secret leaks.
- `ProjectEditPageClient.tsx`: Minor — simplified key generation logic.

### `0983ce02` — Type-safe social profile merging

- `project-contribution/route.ts` only. Introduced TypeScript type guards (`isProjectUrlEntry`, `isProjectSocialProfile`) to safely distinguish URL types when merging social data (Twitter, Farcaster, etc.) into the OLI payload. Previous code relied on duck-typing which was fragile.

### `5f2c6bd4` — Multiple additional websites & GitHub URLs

- `ProjectEditPageClient.tsx` (+278): Added UI for entering multiple `additionalWebsites` and `additionalGitHub` URLs, with deduplication and validation logic inline.
- `project-contribution/route.ts` (+381, -115): Major expansion — the route now builds a complete OLI-spec payload handling: primary URL, additional URLs, social profiles, GitHub repos, and contract addresses. First time the full submission payload shape was close to spec-compliant.

---

## Phase 2 — Big PR Merge: Full Project Edit Flow

**Mar 2 | Commits: `8a93fb49` (PR #3), `a9dab58b`**

### `8a93fb49` — Feature/project page PR merge (#3) *(largest single commit)*

Squash-merged a large feature branch. Key additions:

- **`ProjectEditPageClient.tsx`** (3284 lines, new): The monolithic project edit form. Handles both "add new project" and "edit existing project" modes, wallet-gated submission, GitHub PR generation, Smart Paste + AI contract classification, per-field search dropdowns, and the contract address queue.
- **`app/(labels)/labels/project-edit/[add|edit|page].tsx`**: Three new route entry points for the labels edit flow.
- **`app/(layout)/applications/[add|edit]/page.tsx`**: Entry points from the applications section.
- **`app/(layout)/applications/[owner_project]/page.tsx`** (+523): Integrated the project edit intent and added the edit button to the project page.
- **`app/(layout)/applications/layout.tsx`** (+34): Updated layout to accommodate the edit flow routing.
- **`contexts/WalletContext.tsx`** (122 lines, new): Wagmi-based wallet connection context used to gate form submissions behind wallet signature.
- **`lib/project-edit-intent.ts`** (199 lines, new): Utility for encoding/decoding the "intent" object passed through the URL (project slug, mode, prefill data) so the edit page knows what to display.
- **`lib/project-edit-contract-seed.ts`** (92 lines, new): Logic to seed the contracts queue from an existing project's known contract data when opening in edit mode.
- **`app/api/labels/classify-contracts/route.ts`** (321 lines, new): Full two-step Gemini-powered contract classifier — preprocess freeform text → structured `{address, name, chain}[]` → classify to OLI category IDs.
- **`components/search/Components.tsx`** (+140): Extended global search to be usable as a controlled dropdown input in form fields.
- **`types/window-ethereum.d.ts`**, **`types/openlabels-oli-sdk-react.d.ts`**: Type declarations for wallet injection and the SDK's React bindings.
- **`package.json` / `yarn.lock`**: Added `@openlabels/oli-sdk@0.2.0`.

### `a9dab58b` — Transaction explorer URLs & duplicate detection

- `[owner_project]/page.tsx` (large refactor): Added a `EXPLORER_URLS` map covering ~20 chains so submitted contract addresses render with clickable block explorer links.
- `ProjectEditPageClient.tsx` (+151): Added comprehensive duplicate detection — prevents resubmitting the same contract address across the queue, catches address+chain combos already in the existing project data, and surfaces user-facing error states.

---

## Phase 3 — UX Polish & State Management

**Mar 5–6 | Commits: `caa764e9`, `2ff8fb11`**

### `caa764e9` — GTPButton for contract table, edit mode state in UIContext

- `ProjectEditPageClient.tsx` (large internal refactor): Migrated `ContractsTableRow` to use the `GTPButton` design system component instead of raw `<button>` elements for visual consistency. Streamlined URL/mode parsing logic.
- `components/search/Components.tsx` (+194): Added a controlled "selection" mode to `GlobalSearchBar` so it can render a selected value and allow clearing it — used by the `owner_project` field.
- `contexts/UIContext.tsx` (+7): Added `projectEditMode` state (`"add" | "edit" | null`) to the global UI context so layout components can conditionally suppress navigation elements while the edit form is open.

### `2ff8fb11` — Dropdown cap & submission change tracking

- `ProjectEditPageClient.tsx` (+62, -44): Two targeted fixes:
  1. Added `MAX_VISIBLE_SUGGESTIONS = 8` cap on dropdown results to prevent the list from growing off-screen.
  2. Added `hasChangedSinceSubmission` tracking — after a successful PR submission, the Submit button stays disabled until the user makes a new change, preventing accidental double-submissions.

---

## Phase 4 — Component Decomposition (Major Refactor)

**Mar 6 | Commit: `26afe7f8`**

### `26afe7f8` — Extract `_edit/` sub-components

`ProjectEditPageClient.tsx` had grown to ~4000 lines and was split into a proper component hierarchy under a new `_edit/` directory:

| New File | Purpose |
|---|---|
| `_edit/ContractsStep.tsx` (936 lines) | The entire contracts tab: table, add/edit row, Smart Paste panel |
| `_edit/ProjectDetailsStep.tsx` (583 lines) | The project details tab: all metadata fields with search dropdowns |
| `_edit/EditSidebar.tsx` (224 lines) | Sticky sidebar: submit button, PR status, wallet connection prompt |
| `_edit/FieldDropdown.tsx` (456 lines) | Reusable search dropdown component used by multiple fields |
| `_edit/useContractsQueue.tsx` (901 lines) | Custom hook encapsulating all contracts queue state and operations |
| `_edit/useProjectEditForm.ts` (731 lines) | Custom hook encapsulating project metadata form state |
| `_edit/types.ts` (56 lines) | Shared TypeScript interfaces (`ContractRow`, `ProjectFormState`, etc.) |
| `_edit/constants.ts` (38 lines) | Shared constants (chain options, category IDs, field definitions) |
| `_edit/projectDataUtils.ts` (149 lines) | Pure functions: fill form from API data, diff for PR payload |
| `_edit/utils.ts` (232 lines) | Misc helpers: URL normalization, address validation, dedup logic |

`ProjectEditPageClient.tsx` itself shrank from ~4000 to ~300 lines — now acting purely as an orchestrator composing the above pieces.

`components/search/Components.tsx` (+169): Further refinements to the search component to support the new `FieldDropdown` usage patterns.

---

## Phase 5 — Usage Category Icons

**Mar 10 | Commit: `0b81e373`** *(most recent)*

### `0b81e373` — `ApplicationIcon` `className` prop + usage category icon rendering

- **`Components.tsx`** (+35): Added optional `className` prop to `ApplicationIcon` for flexible sizing/styling. Added `usageCategoryIconRenderer` helper that maps OLI category IDs to icon elements — used to visually decorate rows in the contracts table.
- **`ContractsStep.tsx`** (+819, -279): Major visual upgrade to the contracts table. Each row now renders the usage category icon alongside the category name. Added `queueValidation` prop for per-row validation errors. Improved row editing UX.
- **`useContractsQueue.tsx`** (+53): Wired in usage category validation — validates that every row has a recognized category ID before allowing submission.
- **`ProjectEditPageClient.tsx`** (+3): Passed the new `usageCategoryIconRenderer` and `queueValidation` props down to `ContractsStep`.

---

## Currently Uncommitted Changes (Working Tree)

Several files are modified or untracked:

| File | Status | Notes |
|---|---|---|
| `ProjectEditPageClient.tsx` | Modified | In-progress work on top of `0b81e373` |
| `_edit/ContractsStep.tsx` | Modified | Further contracts UI changes |
| `_edit/FieldDropdown.tsx` | Modified | Dropdown refinements |
| `_edit/useContractsQueue.tsx` | Modified | Queue hook updates |
| `app/api/labels/classify-contracts/route.ts` | Modified | Classifier API changes |
| `app/api/labels/project-contribution/route.ts` | Modified | PR generation changes |
| `app/api/labels/survey/` | Untracked | New API route directory |
| `app/api/labels/usage-categories/` | Untracked | New API route for fetching usage category definitions |

---

## Overall File Change Summary

```
25 files changed, 6715 insertions(+), 4140 deletions(-)
```

| File | Change |
|---|---|
| `ProjectEditPageClient.tsx` | Net -3500 (monolith → orchestrator) |
| `_edit/ContractsStep.tsx` | +1237 (new) |
| `_edit/useContractsQueue.tsx` | +948 (new) |
| `_edit/useProjectEditForm.ts` | +731 (new) |
| `_edit/ProjectDetailsStep.tsx` | +583 (new) |
| `_edit/FieldDropdown.tsx` | +456 (new) |
| `_edit/utils.ts` | +232 (new) |
| `_edit/EditSidebar.tsx` | +224 (new) |
| `_edit/projectDataUtils.ts` | +149 (new) |
| `_edit/TableCellSelect.tsx` | +167 (new) |
| `_edit/types.ts` | +56 (new) |
| `_edit/constants.ts` | +38 (new) |
| `[owner_project]/page.tsx` | +1141 net |
| `project-contribution/route.ts` | +411 net |
| `components/search/Components.tsx` | +510 net |
| `Components.tsx` | +35 |
| `contexts/UIContext.tsx` | +7 |

---

## Architectural Arc

The overall trajectory went through four distinct stages:

1. **Server-side pipeline first** — built the GitHub PR generation and OLI payload construction before touching the UI.
2. **Monolith phase** — shipped the full project edit form as a single large file to get end-to-end functionality working.
3. **UX hardening** — iterated on submission safety (duplicate detection, change tracking), visual consistency (GTPButton), and discoverability (dropdown caps, edit mode context).
4. **Decomposition** — broke the monolith into a clean `_edit/` component architecture with dedicated hooks and utilities once the shape was stable.

The untracked `survey/` and `usage-categories/` directories suggest the next phase will add a survey/onboarding step and a categories reference endpoint.
