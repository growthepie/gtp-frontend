"use client";

import Icon from "@/components/layout/Icon";
import type { ProjectMode } from "./types";
import type { CSSProperties } from "react";

type EditSidebarProps = {
  activeStep: 0 | 1 | 2 | 3 | 4;
  isMetadataSubmitted: boolean;
  localMode: ProjectMode;
  ownerProject: string;
  hasBlockingErrors: boolean;
  formSuggestions: { icon: string; text: string }[];
  meaningfulRowsCount: number;
  rowErrorsCount: number;
  queueStats: { errors: number; warnings: number; suggestions: number; conversions: number };
  queueHasValidationResult: boolean;
  projectsError: string;
  activeStepOffsetTop: number;
};

export function EditSidebar({
  activeStep,
  isMetadataSubmitted,
  localMode,
  ownerProject,
  hasBlockingErrors,
  formSuggestions,
  meaningfulRowsCount,
  rowErrorsCount,
  queueStats,
  queueHasValidationResult,
  projectsError,
  activeStepOffsetTop,
}: EditSidebarProps) {
  return (
    <aside
      className="relative flex h-fit flex-col gap-y-[10px] xl:sticky xl:top-[100px] xl:pt-[var(--edit-sidebar-offset-top)]"
      style={{ "--edit-sidebar-offset-top": `${activeStepOffsetTop}px` } as CSSProperties}
    >
      {/* Tips card */}
      <div className="overflow-hidden rounded-[14px] border border-color-ui-shadow/40 bg-color-bg-default">
        <div className="flex items-center gap-x-[8px] border-b border-color-ui-shadow/40 px-[12px] py-[10px]">
          <Icon
            icon={
              activeStep === 0
                ? "feather:search"
                : activeStep === 2
                ? "feather:zap"
                : activeStep === 3
                ? "feather:help-circle"
                : activeStep === 4
                ? "feather:check-square"
                : isMetadataSubmitted
                ? "feather:check-circle"
                : localMode === "edit"
                ? "feather:edit-2"
                : "feather:plus-circle"
            }
            className="size-[14px] text-color-text-secondary"
          />
          <div className="text-sm font-medium">
            {activeStep === 0
              ? "Search Tips"
              : activeStep === 2
              ? "Contract Tips"
              : activeStep === 3
              ? "Wallet Tips"
              : activeStep === 4
              ? "Review Tips"
              : isMetadataSubmitted
              ? "Next Steps"
              : localMode === "edit"
              ? "Editing Tips"
              : "Adding Tips"}
          </div>
        </div>
        <div className={`flex flex-col ${activeStep === 2 || activeStep === 3 || activeStep === 4 || isMetadataSubmitted ? "gap-y-[6px] p-[10px]" : "gap-y-[8px] p-[12px]"}`}>
          {activeStep === 0 ? (
            <>
              <TipRow icon="feather:search">
                Search by project name, website, or owner_project key to check if it already exists.
              </TipRow>
              <TipRow icon="feather:alert-triangle" iconClassName="text-color-data-yellow">
                Duplicate entries fragment data and break attribution — always search first.
              </TipRow>
              <TipRow icon="feather:edit-2">
                Found it? Click <span className="font-medium">Edit</span> on the result to update the existing record instead.
              </TipRow>
              <TipRow icon="feather:type">
                Not found? Once you&apos;re sure it&apos;s new, click <span className="font-medium">Add project details</span> to begin.
              </TipRow>
            </>
          ) : activeStep === 2 ? (
            <>
              <TipRow icon="feather:zap">
                Start with <span className="font-mono">Smart Paste</span> to bulk-add contracts, then review chain and category.
              </TipRow>
              <TipRow icon="feather:link-2">
                <span className="font-mono">owner_project</span> defaults to the selected project, but you can switch it to any project or choose <span className="font-mono">No owner</span> for wrong-association attestations.
              </TipRow>
              <TipRow icon="feather:type">
                Use readable version suffixes like <span className="font-mono">Router v2.2</span>, not <span className="font-mono">2.2Router</span> or <span className="font-mono">RouterV2.2</span>.
              </TipRow>
              <TipRow icon="feather:tag">
                For fungible token contracts, use the ticker in all caps (for example <span className="font-mono">USDC</span>, <span className="font-mono">WETH</span>).
              </TipRow>
              <TipRow icon="feather:minimize-2">
                Keep names concise and self-explanatory; avoid project prefixes like <span className="font-mono">Uniswap Router</span>.
              </TipRow>
              <TipRow icon="feather:edit-3">
                Prefer human-readable names with spaces, and avoid underscores and quotes.
              </TipRow>
              <TipRow icon="feather:refresh-cw">
                Editing an existing contract entry will overwrite it after approval.
              </TipRow>
            </>
          ) : activeStep === 3 ? (
            <>
              <TipRow icon="feather:wallet">
                Connect the wallet that will sign the attestation transaction onchain.
              </TipRow>
              <TipRow icon="feather:message-circle">
                Answering the quick questions helps us understand your team, goals, and which metrics matter most to you.
              </TipRow>
              <TipRow icon="feather:bar-chart-2">
                That context helps us prioritize product improvements and support the kinds of submissions you care about.
              </TipRow>
              <TipRow icon="feather:arrow-right-circle">
                Once the wallet is connected and the questions are filled, continue to review before signing.
              </TipRow>
            </>
          ) : activeStep === 4 ? (
            <>
              <TipRow icon="feather:file-text">
                The review step shows the raw transaction input generated from the OLI framework payload.
              </TipRow>
              <TipRow icon="feather:eye">
                Use it to sanity-check the final attestation data before you sign.
              </TipRow>
              <TipRow icon="feather:pen-tool">
                Your labels are not added until you complete the wallet signature and submit the transaction.
              </TipRow>
              <TipRow icon="feather:alert-circle" iconClassName="text-color-data-yellow">
                If you close the wallet modal or reject the signature, nothing gets written onchain.
              </TipRow>
            </>
          ) : isMetadataSubmitted ? (
            <>
              <TipRow icon="feather:check" iconClassName="text-color-positive">
                Metadata PR submitted for <span className="font-mono">{ownerProject || "project"}</span>.
              </TipRow>
              <TipRow icon="feather:layers">
                Add contracts to the queue and keep owner slugs consistent.
              </TipRow>
              <TipRow icon="feather:shield">
                Validate rows, review transaction preview, then sign.
              </TipRow>
            </>
          ) : localMode === "edit" ? (
            <>
              <TipRow icon="feather:key">
                The <span className="font-mono font-medium">owner_project</span> key is the unique OSS identifier — it must match exactly (e.g. <span className="font-mono">uniswap</span>, <span className="font-mono">aave-v3</span>). Leave fields blank to keep existing values.
              </TipRow>
              <TipRow icon="feather:refresh-cw">
                Rebranded? Only update the <span className="font-medium">Display name</span> — the <span className="font-mono">owner_project</span> key cannot change.
              </TipRow>
              <TipRow icon="feather:file-text">
                Description must be 2–3 short, neutral sentences. No marketing language, superlatives, or first-person claims.
              </TipRow>
              <TipRow icon="feather:github">
                GitHub should point to the main org or repo (e.g. <span className="font-mono">https://github.com/Uniswap</span>), not a specific branch or file.
              </TipRow>
              <TipRow icon="feather:zap">
                Use Smart Paste to bulk-add contracts — paste any JSON, table, or freeform text with addresses and let AI extract, chain-detect, and classify them.
              </TipRow>
            </>
          ) : (
            <>
              <TipRow icon="feather:key">
                <span className="font-mono font-medium">owner_project</span> is the permanent OSS slug — lowercase, hyphenated, no TLD, max 60 chars (e.g. <span className="font-mono">aave-v3</span>, <span className="font-mono">uniswap</span>). It cannot be changed later.
              </TipRow>
              <TipRow icon="feather:cpu">
                Use <span className="font-medium">Profile from website</span> to auto-fill fields via AI. Always verify the output before submitting.
              </TipRow>
              <TipRow icon="feather:file-text">
                Description must be 2–3 short, neutral sentences about what the project does. Avoid marketing language, comparisons, or first-person phrasing.
              </TipRow>
              <TipRow icon="feather:at-sign">
                Twitter and Telegram accept handles (e.g. <span className="font-mono">@uniswap</span>) — they'll be converted to full URLs automatically.
              </TipRow>
            </>
          )}
        </div>
      </div>

      {/* Validation status card (only on step 1 when not yet submitted) */}
      {activeStep === 1 && !isMetadataSubmitted && (
        <div className="overflow-hidden rounded-[14px] border border-color-ui-shadow/40 bg-color-bg-default">
          <div className="flex items-center gap-x-[8px] border-b border-color-ui-shadow/40 px-[12px] py-[10px]">
            <Icon icon="feather:shield" className="size-[14px] text-color-text-secondary" />
            <div className="text-sm font-medium">Validation status</div>
          </div>
          <div className="flex flex-col gap-y-[6px] p-[12px]">
            <div
              className={`flex items-center gap-x-[8px] rounded-[8px] border px-[10px] py-[7px] text-xs ${
                hasBlockingErrors
                  ? "border-color-negative/30 bg-color-negative/10 text-color-negative"
                  : "border-color-positive/30 bg-color-positive/10 text-color-positive"
              }`}
            >
              <Icon
                icon={hasBlockingErrors ? "feather:alert-circle" : "feather:check-circle"}
                className="size-[13px] shrink-0"
              />
              <span>{hasBlockingErrors ? "Fix metadata field errors" : "Metadata fields look good"}</span>
            </div>

            {formSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-x-[8px] rounded-[8px] border border-color-ui-hover bg-color-bg-medium px-[10px] py-[7px] text-xs">
                <Icon icon={s.icon} className="mt-[1px] size-[12px] shrink-0 text-color-text-secondary" />
                <span className="text-color-text-primary">{s.text}</span>
              </div>
            ))}

            {meaningfulRowsCount > 0 ? (
              <>
                <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[7px] text-xs">
                  <Icon icon="feather:layers" className="size-[13px] shrink-0 text-color-text-secondary" />
                  <span className="text-color-text-primary">
                    {meaningfulRowsCount} {meaningfulRowsCount === 1 ? "row" : "rows"} in queue
                  </span>
                </div>
                {rowErrorsCount > 0 ? (
                  <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-negative/30 bg-color-negative/10 px-[10px] py-[7px] text-xs text-color-negative">
                    <Icon icon="feather:alert-circle" className="size-[13px] shrink-0" />
                    <span>{rowErrorsCount} {rowErrorsCount === 1 ? "row error" : "row errors"} — see inline</span>
                  </div>
                ) : queueStats.errors === 0 && queueHasValidationResult ? (
                  <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-positive/30 bg-color-positive/10 px-[10px] py-[7px] text-xs text-color-positive">
                    <Icon icon="feather:check-circle" className="size-[13px] shrink-0" />
                    <span>All queue rows valid</span>
                  </div>
                ) : null}
                {queueStats.warnings > 0 && (
                  <div className="flex items-center gap-x-[8px] rounded-[8px] border border-amber-500/30 bg-amber-500/10 px-[10px] py-[7px] text-xs text-amber-500">
                    <Icon icon="feather:alert-triangle" className="size-[13px] shrink-0" />
                    <span>{queueStats.warnings} {queueStats.warnings === 1 ? "warning" : "warnings"}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-ui-shadow bg-color-bg-medium px-[10px] py-[7px] text-xs">
                <Icon icon="feather:layers" className="size-[13px] shrink-0 text-color-text-secondary" />
                <span className="text-color-text-primary">No rows in queue yet</span>
              </div>
            )}

            {projectsError && (
              <div className="flex items-center gap-x-[8px] rounded-[8px] border border-color-negative/30 bg-color-negative/10 px-[10px] py-[7px] text-xs text-color-negative">
                <Icon icon="feather:alert-triangle" className="size-[13px] shrink-0" />
                <span>{projectsError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function TipRow({
  icon,
  iconClassName,
  children,
}: {
  icon: string;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-x-[8px]">
      <Icon icon={icon} className={`mt-[2px] size-[12px] shrink-0 text-color-text-secondary ${iconClassName ?? ""}`} />
      <span className="text-xs text-color-text-primary">{children}</span>
    </div>
  );
}
