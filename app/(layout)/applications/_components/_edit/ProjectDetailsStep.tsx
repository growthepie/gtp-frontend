"use client";

import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import { buildProjectEditHref } from "@/lib/project-edit-intent";
import type { ProjectRecord } from "@openlabels/oli-sdk";
import type {
  ContributionResult,
  ExistingProjectMatch,
  LogoUploadState,
  ProjectFormState,
} from "./types";
import { ensureAbsoluteUrl, isValidHttpUrl, normalizeOwnerProjectInput } from "./utils";
import { FieldDropdown } from "./FieldDropdown";
import { useState } from "react";
import type { ChangeEvent, RefObject } from "react";

type ProjectDetailsStepProps = {
  activeStep: 0 | 1 | 2 | 3 | 4;
  setActiveStep: (step: 0 | 1 | 2 | 3 | 4) => void;
  cardRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLButtonElement | null>;

  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  logoUpload: LogoUploadState;
  collapsedLogoSrc: string;
  isAddMode: boolean;

  ownerProjectToProjectData: Record<string, any>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;

  // Field callbacks
  updateField: <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => void;
  updateAdditionalUrlField: (key: "additional_websites" | "additional_github", index: number, value: string) => void;
  addAdditionalUrlField: (key: "additional_websites" | "additional_github") => void;
  removeAdditionalUrlField: (key: "additional_websites" | "additional_github", index: number) => void;
  fillFormFromProject: (project: ProjectRecord) => void;

  // Dropdown
  activeDropdownField: keyof ProjectFormState | null;
  setActiveDropdownField: React.Dispatch<React.SetStateAction<keyof ProjectFormState | null>>;
  ownerProjectSuggestions: ProjectRecord[];
  displayNameSuggestions: ProjectRecord[];
  websiteSuggestions: ProjectRecord[];
  githubSuggestions: ProjectRecord[];

  // Validation
  validationErrors: Partial<Record<keyof ProjectFormState, string>>;

  // AI Profiler
  isProfiling: boolean;
  profilerError: string;
  profilerInfo: string;
  runProfiler: (websiteOverride?: string) => Promise<boolean>;

  // Enhance description
  isEnhancingDesc: boolean;
  enhanceDescError: string;
  enhanceDescInfo: string;
  enhanceDescription: () => Promise<void>;

  // Duplicate detection
  allProjectMatches: ExistingProjectMatch[];

  // Submission
  submitError: string | null;
  isMetadataSubmitted: boolean;
  contributionResult: ContributionResult | null;
  hasFormChanges: boolean;
  hasFormChangedSinceSubmission: boolean;
  canSubmitContribution: boolean;
  isSubmittingContribution: boolean;
  submitProjectContribution: () => Promise<void>;
  continueWithoutEdits: () => void;
};

export function ProjectDetailsStep({
  activeStep,
  setActiveStep,
  cardRef,
  headerRef,
  form,
  setForm,
  logoUpload,
  collapsedLogoSrc,
  isAddMode,
  ownerProjectToProjectData,
  fileInputRef,
  onLogoChange,
  updateField,
  updateAdditionalUrlField,
  addAdditionalUrlField,
  removeAdditionalUrlField,
  fillFormFromProject,
  activeDropdownField,
  setActiveDropdownField,
  ownerProjectSuggestions,
  displayNameSuggestions,
  websiteSuggestions,
  githubSuggestions,
  validationErrors,
  isProfiling,
  profilerError,
  profilerInfo,
  runProfiler,
  isEnhancingDesc,
  enhanceDescError,
  enhanceDescInfo,
  enhanceDescription,
  allProjectMatches,
  submitError,
  isMetadataSubmitted,
  contributionResult,
  hasFormChanges,
  hasFormChangedSinceSubmission,
  canSubmitContribution,
  isSubmittingContribution,
  submitProjectContribution,
  continueWithoutEdits,
}: ProjectDetailsStepProps) {
  const [showPrConfirm, setShowPrConfirm] = useState(false);
  const [missingExpanded, setMissingExpanded] = useState(false);
  const [expandedCheckIndices, setExpandedCheckIndices] = useState<Set<number>>(new Set());

  const showContinueWithoutEdits =
    !isAddMode &&
    !hasFormChanges &&
    !isSubmittingContribution &&
    !(Boolean(contributionResult) && !hasFormChangedSinceSubmission);
  const existingLogoPath = ownerProjectToProjectData[form.owner_project.trim()]?.logo_path;
  const hasLogoSubmission = Boolean(
    contributionResult?.combinedPullRequest || contributionResult?.logoPullRequestUrl,
  );
  const successMessage = !hasLogoSubmission
    ? "Your project detail changes were received. Maintainers will review them."
    : contributionResult?.combinedPullRequest
    ? existingLogoPath
      ? "Your project detail changes and logo update were received in one PR. Maintainers will review them."
      : "Your project detail changes and logo addition were received in one PR. Maintainers will review them."
    : existingLogoPath
    ? "Your project detail changes and logo update were received. Maintainers will review them."
    : "Your project detail changes and logo addition were received. Maintainers will review them.";

  return (
    <>
    <div ref={cardRef} className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden bg-color-bg-default">
      {/* Clickable header */}
      <button
        ref={headerRef}
        type="button"
        onClick={() => setActiveStep(1)}
        className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
      >
        <div className="shrink-0 size-[26px] rounded-full border border-color-ui-shadow/40 flex items-center justify-center bg-color-bg-default hover:bg-color-ui-hover transition-colors">
          <Icon
            icon="feather:chevron-down"
            className={`size-[14px] text-color-text-secondary transition-transform ${activeStep === 1 ? "rotate-180" : ""}`}
          />
        </div>
        <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
          isMetadataSubmitted
            ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
            : activeStep === 1
            ? "bg-color-text-primary text-color-bg-default"
            : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
        }`}>
          {isMetadataSubmitted ? <Icon icon="feather:check" className="size-[13px]" /> : 1}
        </div>
        {collapsedLogoSrc ? (
          <div className="relative size-[24px] shrink-0 overflow-hidden rounded-[4px] border border-color-ui-shadow/60">
            <Image src={collapsedLogoSrc} alt={form.display_name || "Project"} fill sizes="24px" unoptimized className="object-cover" />
          </div>
        ) : (
          <GTPIcon icon="gtp-project-monochrome" size="sm" className="shrink-0" />
        )}
        <div className="text-sm font-medium min-w-0 truncate flex-1">
          {form.display_name || (isAddMode ? "Add project details" : "Edit project details")}
        </div>
        {activeStep !== 1 && (
          (["website", "main_github", "twitter", "telegram"] as const).some((f) => form[f].trim()) || form.description.trim().length > 0
        ) && (
          <div className="flex items-center gap-[5px] flex-wrap justify-end shrink-0">
            {(["website", "main_github", "twitter", "telegram"] as const).map((field) => {
              const icons = { website: "feather:globe", main_github: "ri:github-fill", twitter: "ri:twitter-x-fill", telegram: "feather:send" };
              const labels = { website: "Website", main_github: "GitHub", twitter: "X", telegram: "Telegram" };
              const filled = form[field].trim();
              return (
                <div key={field} className={`flex items-center gap-x-[8px] px-[15px] rounded-[20px] h-[26px] border ${filled ? "bg-color-positive/10 border-color-positive/30 text-color-positive" : "bg-color-negative/10 border-color-negative/30 text-color-negative"}`}>
                  <Icon icon={icons[field]} className="!w-[12px] !h-[12px] xs:!w-[15px] xs:!h-[15px]" />
                  <div className="text-xs whitespace-nowrap">{labels[field]}</div>
                </div>
              );
            })}
            <div className={`flex items-center gap-x-[8px] px-[15px] rounded-[20px] h-[26px] border ${
              form.description.trim().length >= 50
                ? "bg-color-positive/10 border-color-positive/30 text-color-positive"
                : form.description.trim().length > 0
                ? "bg-color-data-yellow/10 border-color-data-yellow/30 text-color-data-yellow"
                : "bg-color-negative/10 border-color-negative/30 text-color-negative"
            }`}>
              <Icon icon="feather:file-text" className="!w-[12px] !h-[12px] xs:!w-[15px] xs:!h-[15px]" />
              <div className="text-xs whitespace-nowrap">Description</div>
            </div>
          </div>
        )}
        <span className="sr-only">{activeStep === 1 ? "Collapse" : "Expand"} step 1</span>
      </button>

      {activeStep === 1 && (
        <div className="border-t border-color-ui-shadow/40">
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
                  className="group relative flex size-[84px] items-center justify-center overflow-hidden rounded-[8px] border border-color-ui-shadow bg-color-bg-medium"
                >
                  {collapsedLogoSrc ? (
                    <Image src={collapsedLogoSrc} alt={form.owner_project || "Project logo"} fill sizes="84px" unoptimized className="object-cover" />
                  ) : (
                    <GTPIcon icon="gtp-project-monochrome" size="lg" className="text-color-ui-hover" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <Icon icon="feather:edit-2" className="text-white size-[16px]" />
                  </span>
                </button>
                {logoUpload?.fileName && (
                  <p className="max-w-[84px] truncate text-center text-[10px] text-color-text-secondary">{logoUpload.fileName}</p>
                )}
              </div>

              {/* Fields grid */}
              <div className="min-w-0 flex-1 grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                {/* Website */}
                <div className="sm:col-span-2">
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Website</label>
                  <div className="relative focus-within:z-50">
                    {(() => {
                      const abs = ensureAbsoluteUrl(form.website.trim());
                      const isValidWebsite =
                        isAddMode &&
                        abs.startsWith("http") &&
                        !abs.toLowerCase().includes("github.com") &&
                        !abs.toLowerCase().includes("twitter.com") &&
                        !abs.toLowerCase().includes("x.com");
                      return (
                        <div className="relative z-10 flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] pl-[14px] pr-[4px]">
                          <input
                            value={form.website}
                            onChange={(e) => updateField("website", e.target.value)}
                            onFocus={() => setActiveDropdownField("website")}
                            onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                            placeholder="https://yourproject.xyz"
                            className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                          />
                          {form.website.trim() && (
                            <GTPButton variant="highlight" size="sm" label="Default" className="shrink-0 mr-[4px]" />
                          )}
                          {isValidWebsite && (
                            <GTPButton
                              label={isProfiling ? "Profiling..." : "AI Profile"}
                              variant="highlight"
                              size="sm"
                              leftIconOverride={<Icon icon="feather:cpu" className="size-[13px] shrink-0" />}
                              disabled={isProfiling}
                              clickHandler={() => runProfiler()}
                            />
                          )}
                        </div>
                      );
                    })()}
                    {activeDropdownField === "website" && (
                      <FieldDropdown suggestions={websiteSuggestions} onSelect={fillFormFromProject} />
                    )}
                  </div>
                  {validationErrors.website && (
                    <p className="mt-[6px] text-xs text-color-negative">{validationErrors.website}</p>
                  )}
                  {isAddMode && form.website.trim() && !isProfiling && !profilerError && !profilerInfo && (
                    <p className="mt-[5px] text-xxs text-color-text-secondary flex items-center gap-x-[4px]">
                      <Icon icon="feather:clock" className="size-[10px] shrink-0" />
                      AI profiling can take 10–30 seconds
                    </p>
                  )}
                  {isAddMode && (profilerError || profilerInfo) && (
                    <div className="mt-[4px] flex items-center gap-x-[6px]">
                      {profilerError && <p className="text-xs text-color-negative">{profilerError}</p>}
                      {profilerInfo && <p className="text-xs text-color-positive">{profilerInfo}</p>}
                    </div>
                  )}
                  {form.additional_websites.map((value, index) => (
                    <div key={`website-extra-${index}`} className="mt-[6px] flex items-center gap-[6px]">
                      <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[38px] px-[14px]">
                        <input
                          value={value}
                          onChange={(e) => updateAdditionalUrlField("additional_websites", index, e.target.value)}
                          placeholder="Additional website URL"
                          className="flex-1 h-full bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      <GTPButton
                        variant="highlight"
                        size="sm"
                        leftIcon="in-button-up"
                        clickHandler={() => {
                          const newPrimary = form.additional_websites[index];
                          const newAdditional = [form.website, ...form.additional_websites.filter((_, i) => i !== index)].filter(Boolean);
                          setForm((prev) => ({ ...prev, website: newPrimary, additional_websites: newAdditional }));
                        }}
                      />
                      <GTPButton
                        variant="primary"
                        size="sm"
                        leftIcon="in-button-close"
                        clickHandler={() => removeAdditionalUrlField("additional_websites", index)}
                      />
                    </div>
                  ))}
                  <GTPButton  
                    variant="primary"
                    size="sm"
                    leftIcon="in-button-plus"
                    clickHandler={() => addAdditionalUrlField("additional_websites")}
                    className="mt-[6px]"
                  />
                </div>

                {/* Owner project key */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Owner project key</label>
                  {isAddMode ? (
                    <div className="relative focus-within:z-50">
                      <div className="relative z-10 flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                        <input
                          value={form.owner_project}
                          onChange={(e) => updateField("owner_project", normalizeOwnerProjectInput(e.target.value))}
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
                  ) : (
                    <div className="flex w-full items-center bg-color-bg-medium/50 rounded-[22px] h-[44px] px-[14px] opacity-60 cursor-not-allowed select-none">
                      <span className="flex-1 text-sm text-color-text-primary">{form.owner_project}</span>
                      <Icon icon="feather:lock" className="size-[12px] text-color-text-secondary shrink-0" />
                    </div>
                  )}
                  {validationErrors.owner_project ? (
                    <p className="mt-[6px] text-xs text-color-negative">{validationErrors.owner_project}</p>
                  ) : isAddMode ? (
                    <p className="mt-[6px] text-xs text-color-text-primary">Use a short lowercase key, for example: uniswap.</p>
                  ) : null}
                </div>

                {/* Display name */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">Display name</label>
                  <div className="relative focus-within:z-50">
                    <div className="relative z-10 flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                      <input
                        value={form.display_name}
                        onChange={(e) => updateField("display_name", e.target.value)}
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

                {/* GitHub */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">GitHub</label>
                  <div className="relative focus-within:z-50">
                    <div className="relative z-10 flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] pl-[14px] pr-[4px]">
                      <input
                        value={form.main_github}
                        onChange={(e) => updateField("main_github", e.target.value)}
                        onFocus={() => setActiveDropdownField("main_github")}
                        onBlur={() => setTimeout(() => setActiveDropdownField(null), 150)}
                        placeholder="https://github.com/your-org"
                        className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                      />
                      {form.main_github.trim() && (
                        <GTPButton variant="highlight" size="sm" label="Default" className="shrink-0 mr-[4px]" />
                      )}
                    </div>
                    {activeDropdownField === "main_github" && (
                      <FieldDropdown suggestions={githubSuggestions} onSelect={fillFormFromProject} />
                    )}
                  </div>
                  {validationErrors.main_github && (
                    <p className="mt-[6px] text-xs text-color-negative">{validationErrors.main_github}</p>
                  )}
                  {form.additional_github.map((value, index) => (
                    <div key={`github-extra-${index}`} className="mt-[6px] flex items-center gap-[6px]">
                      <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[38px] px-[14px]">
                        <input
                          value={value}
                          onChange={(e) => updateAdditionalUrlField("additional_github", index, e.target.value)}
                          placeholder="Additional GitHub URL"
                          className="flex-1 h-full bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
                        />
                      </div>
                      <GTPButton
                        variant="highlight"
                        size="sm"
                        leftIcon="in-button-up"
                        clickHandler={() => {
                          const newPrimary = form.additional_github[index];
                          const newAdditional = [form.main_github, ...form.additional_github.filter((_, i) => i !== index)].filter(Boolean);
                          setForm((prev) => ({ ...prev, main_github: newPrimary, additional_github: newAdditional }));
                        }}
                      />
                      <GTPButton
                        variant="primary"
                        size="sm"
                        leftIcon="in-button-close"
                        clickHandler={() => removeAdditionalUrlField("additional_github", index)}
                      />
                    </div>
                  ))}
                  <GTPButton
                    variant="primary"
                    size="sm"
                    leftIcon="in-button-plus"
                    clickHandler={() => addAdditionalUrlField("additional_github")}
                    className="mt-[6px]"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">
                    Twitter / X <span className="font-normal text-color-text-secondary">(optional)</span>
                  </label>
                  <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                    <input
                      value={form.twitter}
                      onChange={(e) => updateField("twitter", e.target.value)}
                      placeholder="https://x.com/yourproject"
                      className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                    />
                  </div>
                  {validationErrors.twitter && (
                    <p className="mt-[6px] text-xs text-color-negative">{validationErrors.twitter}</p>
                  )}
                </div>

                {/* Telegram */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">
                    Telegram <span className="font-normal text-color-text-secondary">(optional)</span>
                  </label>
                  <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                    <input
                      value={form.telegram}
                      onChange={(e) => updateField("telegram", e.target.value)}
                      placeholder="https://t.me/yourproject"
                      className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                    />
                  </div>
                  {validationErrors.telegram && (
                    <p className="mt-[6px] text-xs text-color-negative">{validationErrors.telegram}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-[12px]">
              <div className="mb-[6px]">
                <label className="text-xs font-medium text-color-text-primary">Description</label>
              </div>
              <div className="relative">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Short project description"
                  className="min-h-[100px] w-full rounded-[22px] bg-color-bg-medium px-[14px] py-[12px] text-sm border-none outline-none resize-y text-color-text-primary placeholder-color-text-secondary pb-[40px]"
                />
                {!isAddMode && (
                  <button
                    type="button"
                    disabled={isEnhancingDesc}
                    onClick={enhanceDescription}
                    className="absolute bottom-[10px] right-[10px] flex items-center gap-x-[5px] rounded-full border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[4px] text-[11px] text-color-text-primary transition-colors hover:border-color-ui-hover disabled:opacity-50"
                  >
                    <Icon icon="feather:cpu" className="size-[10px]" />
                    {isEnhancingDesc ? "Enhancing..." : "Enhance with AI"}
                  </button>
                )}
              </div>
              {enhanceDescError && <p className="mt-[5px] text-xs text-color-negative">{enhanceDescError}</p>}
              {enhanceDescInfo && <p className="mt-[5px] text-xs text-color-positive">{enhanceDescInfo}</p>}
            </div>

            {/* Duplicate warning */}
            {isAddMode && allProjectMatches.length > 0 && (
              <div className="mt-[14px] rounded-[10px] border border-color-data-yellow/40 bg-color-data-yellow/10 p-[12px]">
                <div className="flex items-center gap-x-[8px]">
                  <Icon icon="feather:alert-triangle" className="size-[14px] text-color-data-yellow shrink-0" />
                  <div className="font-medium text-sm text-color-data-yellow">Similar projects already exist</div>
                </div>
                <p className="mt-[4px] text-xs text-color-text-primary">Check if your project is already listed before adding.</p>
                <div className="mt-[8px] flex flex-col gap-y-[6px]">
                  {allProjectMatches.map((match) => (
                    <div key={match.owner_project} className="flex items-center justify-between gap-x-[8px]">
                      <div className="flex items-center gap-x-[6px] min-w-0">
                        <ApplicationIcon owner_project={match.owner_project} size="sm" />
                        <span className="text-xs font-medium truncate">{match.display_name}</span>
                        <span className="text-xxs text-color-text-secondary shrink-0">({match.owner_project})</span>
                        <span className={`shrink-0 rounded-full px-[6px] py-[1px] text-xxs border ${match.confidence === "exact" ? "border-color-negative/40 bg-color-negative/10 text-color-negative" : "border-color-data-yellow/40 bg-color-data-yellow/10 text-color-data-yellow"}`}>
                          {match.confidence}
                        </span>
                        <span className="shrink-0 rounded-full border border-color-ui-shadow bg-color-bg-medium px-[6px] py-[1px] text-xxs text-color-text-secondary">
                          {match.field}
                        </span>
                      </div>
                      <Link
                        href={buildProjectEditHref({ mode: "edit", project: match.owner_project })}
                        className="shrink-0 inline-flex items-center gap-x-[4px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[8px] py-[3px] text-xxs hover:bg-color-ui-hover transition-colors"
                      >
                        Edit
                        <Icon icon="feather:external-link" className="size-[9px]" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error / success */}
            {submitError && <p className="mt-[8px] text-xs text-color-negative">{submitError}</p>}
            {contributionResult && !hasFormChangedSinceSubmission && (
              <div className="mt-[14px] rounded-[10px] border border-color-positive/30 bg-color-positive/10 p-[12px]">
                <div className="flex items-center gap-x-[8px]">
                  <Icon icon="feather:check-circle" className="size-[14px] text-color-positive shrink-0" />
                  <div className="font-medium text-sm text-color-positive">Changes submitted — awaiting approval</div>
                </div>
                <p className="mt-[4px] text-xs text-color-text-primary">{successMessage}</p>
                <div className="mt-[8px] flex flex-wrap gap-[6px]">
                  <Link
                    href={contributionResult.yamlPullRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-x-[5px] rounded-full border border-color-positive/30 bg-color-positive/10 px-[10px] py-[5px] text-xs text-color-positive hover:bg-color-positive/20 transition-colors"
                  >
                    <Icon icon="feather:git-pull-request" className="size-[11px] shrink-0" />
                    Track PR on GitHub
                    <Icon icon="feather:external-link" className="size-[10px] shrink-0" />
                  </Link>
                  {contributionResult.logoPullRequestUrl && !contributionResult.combinedPullRequest && (
                    <Link
                      href={contributionResult.logoPullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-x-[5px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[10px] py-[5px] text-xs hover:bg-color-ui-hover transition-colors"
                    >
                      <Icon icon="feather:git-pull-request" className="size-[11px] shrink-0" />
                      Logo PR
                      <Icon icon="feather:external-link" className="size-[10px] shrink-0" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-[14px] flex items-center justify-end gap-x-[8px]">
              <GTPButton
                variant="highlight"
                size="sm"
                label={isSubmittingContribution
                  ? "Creating PR..."
                  : isAddMode
                  ? "Add project"
                  : "Save edits"}
                disabled={!canSubmitContribution || (Boolean(contributionResult) && !hasFormChangedSinceSubmission)}
                clickHandler={() => {
                  if (isAddMode) {
                    setShowPrConfirm(true);
                  } else {
                    submitProjectContribution();
                  }
                }}
                className={`rounded-full px-[14px] py-[9px] text-sm transition-all disabled:opacity-60 ${(canSubmitContribution && !(Boolean(contributionResult) && !hasFormChangedSinceSubmission)) ? "bg-color-text-primary text-color-bg-default" : "border border-color-ui-shadow bg-color-bg-default"}`}
              />
              {showContinueWithoutEdits && (
                <GTPButton
                  variant="highlight"
                  size="sm"
                  label="Continue without edits"
                  rightIcon="in-button-right"
                  clickHandler={continueWithoutEdits}
                  className="rounded-full px-[14px] py-[9px] text-sm"
                />
              )}
              {contributionResult && !hasFormChangedSinceSubmission && (
                <GTPButton
                  variant="highlight"
                  size="sm"
                  label="Continue to contracts"
                  rightIcon="in-button-right"
                  clickHandler={() => setActiveStep(2)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* PR confirmation modal */}

    {showPrConfirm && (() => {
      const hasGithub = Boolean(form.main_github.trim());
      const hasSocials = Boolean(form.twitter.trim() || form.telegram.trim());
      const hasDescription = Boolean(form.description.trim());

      const circlePills = [
        { field: "logo",          icon: "feather:image",     filled: Boolean(logoUpload) },
        { field: "owner_project", icon: "feather:key",       filled: Boolean(form.owner_project.trim()) },
        { field: "website",       icon: "feather:globe",     filled: Boolean(form.website.trim()) },
        { field: "main_github",   icon: "ri:github-fill",    filled: Boolean(form.main_github.trim()) },
        { field: "twitter",       icon: "ri:twitter-x-fill",   filled: Boolean(form.twitter.trim()) },
        { field: "telegram",      icon: "feather:send",      filled: Boolean(form.telegram.trim()) },
        { field: "description",   icon: "feather:file-text", filled: Boolean(form.description.trim()) },
      ] as const;

      const checks = [
        {
          show: true,
          icon: "feather:key",
          question: <>Is <span className="font-mono">{form.owner_project || "owner_project"}</span> easy to search and recognise?</>,
          detail: "Use a simple, lowercase, hyphenated slug — no TLDs, no version numbers.",
        },
        {
          show: hasGithub,
          icon: "ri:github-fill",
          question: "Is the GitHub linking to your organisation, not a personal account or individual repo?",
          detail: form.main_github,
        },
        {
          show: hasSocials,
          icon: "feather:at-sign",
          question: "Are the social links pointing to your project's accounts, not a personal profile?",
          detail: [form.twitter, form.telegram].filter(Boolean).join("  ·  "),
        },
        {
          show: hasDescription,
          icon: "feather:file-text",
          question: "Is the description neutral and non-marketing?",
          detail: "2–3 short factual sentences. No superlatives, claims, or first-person phrasing.",
        },
      ].filter((c) => c.show);

      const missingRequired = [
        ...(!logoUpload           ? [{ icon: "feather:image",    hint: "No logo uploaded — your project won't have an image in listings." }] : []),
        ...(!form.owner_project.trim() ? [{ icon: "feather:key",      hint: "A slug is required — lowercase, hyphenated, no TLDs." }] : []),
        ...(!hasDescription       ? [{ icon: "feather:file-text", hint: "No description added — include 2–3 short, factual sentences." }] : []),
      ];

      const missingOptional = [
        ...(!form.main_github.trim() ? [{ icon: "ri:github-fill",  hint: "No GitHub linked — add your org URL, not a personal account or individual repo." }] : []),
        ...(!form.twitter.trim()     ? [{ icon: "ri:twitter-x-fill",  hint: "No X (Twitter) linked — add your project's account, not a personal profile." }] : []),
        ...(!form.telegram.trim()    ? [{ icon: "feather:send",     hint: "No Telegram linked — add your project's channel or group." }] : []),
      ];

      const totalMissing = missingRequired.length + missingOptional.length;

      return (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => { setShowPrConfirm(false); setMissingExpanded(false); setExpandedCheckIndices(new Set()); }}
        >
          <div
            className="mx-[16px] w-full max-w-[440px] rounded-[20px] border border-color-ui-shadow/40 bg-color-bg-default p-[24px] shadow-[0px_8px_40px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-x-[8px] mb-[4px]">
              <Icon icon="feather:git-pull-request" className="size-[16px] text-color-text-primary shrink-0" />
              <div className="text-sm font-semibold">Ready to create a pull request?</div>
            </div>

            <p className="text-sm text-color-text-secondary mb-[12px]">
              This will open a GitHub PR for maintainer review. Before submitting, confirm the following:
            </p>

            {/* Field status circles — centered */}
            <div className="flex items-center justify-center gap-x-[4px] mb-[16px]">
              {circlePills.map(({ field, icon, filled }) => (
                <div
                  key={field}
                  className={`size-[24px] rounded-full border flex items-center justify-center ${
                    filled
                      ? "bg-color-positive/10 border-color-positive/30 text-color-positive"
                      : "bg-color-negative/10 border-color-negative/30 text-color-negative"
                  }`}
                >
                  <Icon icon={icon} className="!w-[11px] !h-[11px]" />
                </div>
              ))}
            </div>

            {/* Question checklist */}
            {checks.length > 0 && (
              <div className="flex flex-col gap-y-[6px] mb-[12px]">
                {checks.map((c, i) => {
                  const detailOpen = expandedCheckIndices.has(i);
                  const toggleDetail = () => setExpandedCheckIndices((prev) => {
                    const next = new Set(prev);
                    next.has(i) ? next.delete(i) : next.add(i);
                    return next;
                  });
                  return (
                    <div key={i} className="rounded-[10px] border border-color-ui-shadow/30 bg-color-bg-medium overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center gap-x-[10px] px-[12px] py-[10px] text-left"
                        onClick={c.detail ? toggleDetail : undefined}
                      >
                        <Icon icon={c.icon} className="mt-[1px] size-[13px] shrink-0 text-color-text-primary" />
                        <span className="text-xs text-color-text-primary flex-1">{c.question}</span>
                        {c.detail && (
                          <Icon icon={detailOpen ? "feather:chevron-up" : "feather:chevron-down"} className="size-[11px] shrink-0 text-color-text-secondary" />
                        )}
                      </button>
                      {detailOpen && c.detail && (
                        <div className="px-[12px] pb-[10px]">
                          <span className="text-[11px] text-color-text-primary/60">{c.detail}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expandable still-missing card */}
            {totalMissing > 0 && (
              <div className="rounded-[10px] border border-color-negative/30 bg-color-negative/10 mb-[16px] overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-x-[6px] px-[12px] py-[8px]"
                  onClick={() => setMissingExpanded((v) => !v)}
                >
                  <div className="flex items-center gap-x-[6px]">
                    <Icon icon="feather:alert-circle" className="size-[12px] text-color-negative shrink-0" />
                    <span className="text-xs font-medium text-color-negative">
                      Still missing <span className="font-normal opacity-70">({totalMissing} item{totalMissing !== 1 ? "s" : ""})</span>
                    </span>
                  </div>
                  <Icon icon={missingExpanded ? "feather:chevron-up" : "feather:chevron-down"} className="size-[12px] text-color-negative/70 shrink-0" />
                </button>
                {missingExpanded && (
                  <div className="flex flex-col gap-y-[4px] px-[12px] pb-[10px]">
                    {missingRequired.map((m, i) => (
                      <div key={i} className="flex items-start gap-x-[6px]">
                        <Icon icon={m.icon} className="mt-[2px] size-[11px] shrink-0 text-color-negative/70" />
                        <span className="text-[11px] text-color-negative/80">{m.hint}</span>
                      </div>
                    ))}
                    {missingOptional.length > 0 && (
                      <>
                        {missingRequired.length > 0 && <div className="border-t border-color-negative/20 my-[4px]" />}
                        <div className="flex items-center gap-x-[6px] mb-[2px]">
                          <Icon icon="feather:info" className="size-[11px] text-color-negative/60 shrink-0" />
                          <span className="text-[11px] font-medium text-color-negative/70">Optional but recommended</span>
                        </div>
                        {missingOptional.map((m, i) => (
                          <div key={i} className="flex items-start gap-x-[6px]">
                            <Icon icon={m.icon} className="mt-[2px] size-[11px] shrink-0 text-color-negative/50" />
                            <span className="text-[11px] text-color-negative/60">{m.hint}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-x-[8px]">
              <button
                type="button"
                className="rounded-full border border-color-ui-shadow bg-color-bg-default px-[14px] py-[8px] text-sm text-color-text-primary hover:bg-color-ui-hover transition-colors"
                onClick={() => { setShowPrConfirm(false); setMissingExpanded(false); setExpandedCheckIndices(new Set()); }}
              >
                Go back
              </button>
              <GTPButton
                variant="highlight"
                size="sm"
                label="Yes, create PR"
                clickHandler={() => {
                  setShowPrConfirm(false);
                  setMissingExpanded(false);
                  submitProjectContribution();
                }}
              />
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
