"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import { validateAddressForChain } from "@openlabels/oli-sdk/validation";
import type { AttestationRowInput, BulkOnchainSubmitResult, OnchainSubmitResult, PreparedAttestation, ProjectRecord } from "@openlabels/oli-sdk";
import type { QueueEditableField, QueueSubmitPreview, SearchDropdownOption } from "./types";
import { asString, getTxExplorerUrl, toStringValue, truncateHex } from "./utils";
import { FieldDropdown, FieldDropdownButton, FieldInput } from "./FieldDropdown";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import type { ReactNode, ChangeEvent, RefObject } from "react";
import type { useBulkCsvAttestUI, useSingleAttestUI } from "@openlabels/oli-sdk/attest-ui";

type ContractsStepProps = {
  activeStep: 0 | 1 | 2 | 3 | 4;
  setActiveStep: (step: 0 | 1 | 2 | 3 | 4) => void;
  step2CardRef: RefObject<HTMLDivElement | null>;
  step3CardRef: RefObject<HTMLDivElement | null>;
  step4CardRef: RefObject<HTMLDivElement | null>;
  step2HeaderRef: RefObject<HTMLButtonElement | null>;
  step3HeaderRef: RefObject<HTMLButtonElement | null>;
  step4HeaderRef: RefObject<HTMLButtonElement | null>;

  // Queue
  bulkController: ReturnType<typeof useBulkCsvAttestUI>;
  singleController: ReturnType<typeof useSingleAttestUI>;
  meaningfulRows: AttestationRowInput[];
  isAddMode: boolean;
  ownerProject: string;
  normalizedProjects: ProjectRecord[];

  // Options
  chainOptions: SearchDropdownOption[];
  ownerProjectOptions: SearchDropdownOption[];
  usageCategoryOptions: SearchDropdownOption[];
  defaultQueueChainId: string;
  chainIconRenderer: (value: string) => ReactNode;
  usageCategoryIconRenderer: (value: string) => ReactNode;

  // Cell operations
  setQueueCellValue: (rowIndex: number, field: QueueEditableField, value: string) => void;
  addQueueRow: () => void;
  removeQueueRow: (rowIndex: number) => void;
  addressEditRow?: number | null;
  setAddressEditRow?: React.Dispatch<React.SetStateAction<number | null>>;
  getQueueRowErrorMessages: (rowIndex: number) => string[];

  // CSV
  csvInputRef: React.RefObject<HTMLInputElement>;
  onCsvInputChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;

  // Smart paste
  smartPasteOpen: boolean;
  setSmartPasteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  smartPasteText: string;
  setSmartPasteText: React.Dispatch<React.SetStateAction<string>>;
  isClassifying: boolean;
  classifyError: string | null;
  smartPasteChainMode: "auto" | "fixed";
  setSmartPasteChainMode: React.Dispatch<React.SetStateAction<"auto" | "fixed">>;
  smartPasteFixedChain: string;
  setSmartPasteFixedChain: React.Dispatch<React.SetStateAction<string>>;
  classifySmartPaste: () => Promise<void>;
  setClassifyError: React.Dispatch<React.SetStateAction<string | null>>;

  // Validation
  validateQueue: () => Promise<void>;
  queueError: string | null;
  queueHasValidationResult: boolean;
  queueStats: { errors: number; warnings: number; suggestions: number; conversions: number };

  // Wallet
  walletAddress: string | null | undefined;
  isConnectingWallet: boolean;
  walletError: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // Submit preview
  queueSubmitPreview: QueueSubmitPreview | null;
  setQueueSubmitPreview: React.Dispatch<React.SetStateAction<QueueSubmitPreview | null>>;
  isPreparingSubmitPreview: boolean;
  isSubmittingFromPreview: boolean;
  prepareQueueSubmitPreview: () => Promise<void>;
  confirmQueueSubmit: () => Promise<void>;
  submitError: string | null;

  // Submit results
  singleSubmitResult: OnchainSubmitResult | null;
  bulkSubmitResult: BulkOnchainSubmitResult | null;
  lastSubmitChainId: string;

  // Survey
  onSurveySubmit?: (data: { teamSize: string; goal: string; metric: string; other: string }) => void;
};

export function ContractsStep({
  activeStep,
  setActiveStep,
  step2CardRef,
  step3CardRef,
  step4CardRef,
  step2HeaderRef,
  step3HeaderRef,
  step4HeaderRef,
  bulkController,
  singleController,
  meaningfulRows,
  isAddMode,
  ownerProject,
  normalizedProjects,
  chainOptions,
  ownerProjectOptions,
  usageCategoryOptions,
  defaultQueueChainId,
  chainIconRenderer,
  usageCategoryIconRenderer,
  setQueueCellValue,
  addQueueRow,
  removeQueueRow,
  getQueueRowErrorMessages,
  csvInputRef,
  onCsvInputChange,
  smartPasteOpen,
  setSmartPasteOpen,
  smartPasteText,
  setSmartPasteText,
  isClassifying,
  classifyError,
  smartPasteChainMode,
  setSmartPasteChainMode,
  smartPasteFixedChain,
  setSmartPasteFixedChain,
  classifySmartPaste,
  setClassifyError,
  validateQueue,
  queueError,
  queueHasValidationResult,
  queueStats,
  walletAddress,
  isConnectingWallet,
  walletError,
  connectWallet,
  disconnectWallet,
  queueSubmitPreview,
  setQueueSubmitPreview,
  isPreparingSubmitPreview,
  isSubmittingFromPreview,
  prepareQueueSubmitPreview,
  confirmQueueSubmit,
  submitError,
  singleSubmitResult,
  bulkSubmitResult,
  lastSubmitChainId,
  onSurveySubmit,
}: ContractsStepProps) {
  const [activeRowDropdown, setActiveRowDropdown] = useState<string | null>(null);
  const [rowDropdownQuery, setRowDropdownQuery] = useState<Record<string, string>>({});
  const [tableContainerWidth, setTableContainerWidth] = useState(9999);
  const [nameColWidth, setNameColWidth] = useState(80);

  // Survey state
  const [surveyTeamSize, setSurveyTeamSize] = useState("");
  const [surveyGoal, setSurveyGoal] = useState("");
  const [surveyMetric, setSurveyMetric] = useState("");
  const [surveyOther, setSurveyOther] = useState("");

  // Error block
  const [errorExpanded, setErrorExpanded] = useState(false);
  const nameColWidthRef = useRef(80); // always-current ref used inside RAF closures
  const animFrameRef = useRef<number | null>(null);

  // canvas-based text measurement — synchronous, no DOM visibility dependency
  const measureTextPx = (text: string): number => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return 80;
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      return Math.ceil(ctx.measureText(text).width);
    } catch {
      return 80;
    }
  };

  const longestName = useMemo(() => {
    return bulkController.queue.rows.reduce((acc, row) => {
      const name = toStringValue(row.contract_name).trim();
      return name.length > acc.length ? name : acc;
    }, "Contract name"); // fallback matches the input placeholder
  }, [bulkController.queue.rows]);

  useEffect(() => {
    const w = measureTextPx(longestName);
    setNameColWidth(Math.max(60, Math.min(240, w + 24))); // +24 for cell padding
  }, [longestName]); // measureTextPx is stable (no deps)

  // Sync nameColWidth to ref and colgroup whenever it changes
  useEffect(() => {
    nameColWidthRef.current = nameColWidth;
    if (colNameRef.current) colNameRef.current.style.width = `${nameColWidth}px`;
  }, [nameColWidth]);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const colChainRef = useRef<HTMLTableColElement | null>(null);
  const colAddrRef = useRef<HTMLTableColElement | null>(null);
  const colNameRef = useRef<HTMLTableColElement | null>(null);
  const colOwnerRef = useRef<HTMLTableColElement | null>(null);
  const colUsageRef = useRef<HTMLTableColElement | null>(null);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Compute column widths — name is content-driven (fixed), others flex within remaining budget
  const getColWidths = (containerW: number, expanding: "chain" | "addr" | "owner" | "usage" | null, progress: number) => {
    const fixed = 32 + 46; // num + delete only
    const padding = 72;
    const totalBudget = Math.max(300, containerW - fixed - padding);
    const chainBase = 40;
    const nameW = nameColWidth; // content-driven, never stolen from
    const flexBudget = Math.max(200, totalBudget - chainBase - nameW);
    const addrBase = Math.max(100, Math.floor(flexBudget * 0.30));
    const ownerBase = Math.max(100, Math.floor(flexBudget * 0.38));
    const usageBase = Math.max(60, flexBudget - addrBase - ownerBase);

    if (!expanding || progress === 0) return { chain: chainBase, addr: addrBase, name: nameW, owner: ownerBase, usage: usageBase };

    if (expanding === "chain") {
      const target = Math.min(Math.floor(totalBudget * 0.30), 250);
      const delta = (target - chainBase) * progress;
      return { chain: chainBase + delta, addr: Math.max(70, addrBase - delta * 0.5), name: nameW, owner: Math.max(70, ownerBase - delta * 0.3), usage: Math.max(50, usageBase - delta * 0.2) };
    }
    if (expanding === "addr") {
      const target = Math.min(Math.floor(flexBudget * 0.50), 340);
      const delta = (target - addrBase) * progress;
      return { chain: chainBase, addr: addrBase + delta, name: nameW, owner: Math.max(70, ownerBase - delta * 0.55), usage: Math.max(50, usageBase - delta * 0.45) };
    }
    if (expanding === "owner") {
      const target = Math.min(Math.floor(flexBudget * 0.52), 280);
      const delta = (target - ownerBase) * progress;
      return { chain: chainBase, addr: Math.max(70, addrBase - delta * 0.5), name: nameW, owner: ownerBase + delta, usage: Math.max(50, usageBase - delta * 0.5) };
    }
    if (expanding === "usage") {
      const target = Math.min(Math.floor(flexBudget * 0.52), 280);
      const delta = (target - usageBase) * progress;
      return { chain: chainBase, addr: Math.max(70, addrBase - delta * 0.5), name: nameW, owner: Math.max(70, ownerBase - delta * 0.5), usage: usageBase + delta };
    }
    return { chain: chainBase, addr: addrBase, name: nameW, owner: ownerBase, usage: usageBase };
  };

  const applyColWidths = (widths: ReturnType<typeof getColWidths>) => {
    if (colChainRef.current) colChainRef.current.style.width = `${Math.round(widths.chain)}px`;
    if (colAddrRef.current) colAddrRef.current.style.width = `${Math.round(widths.addr)}px`;
    if (colNameRef.current) colNameRef.current.style.width = `${Math.round(widths.name)}px`;
    if (colOwnerRef.current) colOwnerRef.current.style.width = `${Math.round(widths.owner)}px`;
    if (colUsageRef.current) colUsageRef.current.style.width = `${Math.round(widths.usage)}px`;
  };

  // RAF-driven column width animation — directly mutates <col> elements (no re-render per frame)
  useEffect(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }

    const isChain = activeRowDropdown?.startsWith("chain-");
    const isAddr = activeRowDropdown?.startsWith("addr-");
    const isOwner = activeRowDropdown?.startsWith("owner-");
    const isUsage = activeRowDropdown?.startsWith("usage-");
    const expanding: "chain" | "addr" | "owner" | "usage" | null = isChain ? "chain" : isAddr ? "addr" : isOwner ? "owner" : isUsage ? "usage" : null;

    const containerW = tableContainerRef.current?.getBoundingClientRect().width ?? tableContainerWidth;
    // name col is excluded from animation — it is solely controlled by the nameColWidth effect
    const fromWidths = {
      chain: parseFloat(colChainRef.current?.style.width ?? "40") || 40,
      addr: parseFloat(colAddrRef.current?.style.width ?? "110") || 110,
      owner: parseFloat(colOwnerRef.current?.style.width ?? "110") || 110,
      usage: parseFloat(colUsageRef.current?.style.width ?? "70") || 70,
    };
    const toWidths = getColWidths(containerW, expanding, 1);

    const duration = 180;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      applyColWidths({
        chain: lerp(fromWidths.chain, toWidths.chain, eased),
        addr: lerp(fromWidths.addr, toWidths.addr, eased),
        name: nameColWidthRef.current, // always use the live measured value
        owner: lerp(fromWidths.owner, toWidths.owner, eased),
        usage: lerp(fromWidths.usage, toWidths.usage, eased),
      });
      if (t < 1) animFrameRef.current = requestAnimationFrame(step);
      else animFrameRef.current = null;
    };
    animFrameRef.current = requestAnimationFrame(step);

    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRowDropdown]);

  const filterRowOptions = (options: SearchDropdownOption[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options
      .filter((option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q))
      .slice(0, 80);
  };

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-row-dropdown-root='true']")) {
        setActiveRowDropdown(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    const measure = () => {
      const containerW = tableContainerRef.current?.getBoundingClientRect().width ?? 0;
      if (containerW <= 0) return;
      setTableContainerWidth(containerW);
      // Initialize col widths only when not animating
      if (!animFrameRef.current) {
        applyColWidths(getColWidths(containerW, null, 0));
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (tableContainerRef.current) observer.observe(tableContainerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (activeStep !== 2) return;

    const containerW = tableContainerRef.current?.getBoundingClientRect().width ?? 0;
    if (containerW <= 0 || animFrameRef.current) return;

    setTableContainerWidth(containerW);
    applyColWidths(getColWidths(containerW, null, 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, nameColWidth, bulkController.queue.rows.length]);

  // Auto-advance to step 3 when all rows pass validation
  useEffect(() => {
    if (activeStep === 2 && queueHasValidationResult && queueStats.errors === 0 && meaningfulRows.length > 0) {
      setActiveStep(3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueHasValidationResult, queueStats.errors, meaningfulRows.length]);

  const openChainDropdown = (rowIndex: number, selectedLabel: string) => {
    const key = `chain-${rowIndex}`;
    setRowDropdownQuery((prev) => ({ ...prev, [key]: selectedLabel }));
    setActiveRowDropdown(key);
  };

  return (
    <>
      {/* ── Step 2: Add Contracts ── */}
      <div ref={step2CardRef} className="rounded-[16px] border border-color-ui-shadow/40 bg-color-bg-default">
        <button
          ref={step2HeaderRef}
          type="button"
          onClick={() => setActiveStep(2)}
          className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
        >
          <div className="shrink-0 size-[26px] rounded-full border border-color-ui-shadow/40 flex items-center justify-center bg-color-bg-default hover:bg-color-ui-hover transition-colors">
            <Icon
              icon="feather:chevron-down"
              className={`size-[14px] text-color-text-secondary transition-transform ${activeStep === 2 ? "rotate-180" : ""}`}
            />
          </div>
          <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            (singleSubmitResult || bulkSubmitResult) || (queueHasValidationResult && queueStats.errors === 0 && meaningfulRows.length > 0 && activeStep > 2)
              ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
              : activeStep === 2
              ? "bg-color-text-primary text-color-bg-default"
              : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
          }`}>
            {(singleSubmitResult || bulkSubmitResult) || (queueHasValidationResult && queueStats.errors === 0 && meaningfulRows.length > 0 && activeStep > 2)
              ? <Icon icon="feather:check" className="size-[13px]" />
              : 2}
          </div>
          <GTPIcon icon="gtp-label-add" size="sm" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Add contracts</div>
            {activeStep !== 2 && (
              <div className="text-xs text-color-text-secondary mt-[2px] truncate">
                {meaningfulRows.length > 0
                  ? `${meaningfulRows.length} contract${meaningfulRows.length !== 1 ? "s" : ""} in queue`
                  : "Add contract addresses for attestation"}
              </div>
            )}
          </div>
        </button>

        {activeStep === 2 && (
          <div className="border-t border-color-ui-shadow/40 px-[20px] pb-[20px] pt-[16px]">
            {/* Toolbar */}
            <div className="mb-[12px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onCsvInputChange}
                />
                <GTPButton label="Upload CSV" variant="primary" size="sm" clickHandler={() => csvInputRef.current?.click()} />
                <GTPButton
                  label="Smart Paste"
                  variant={smartPasteOpen ? "highlight" : "primary"}
                  size="sm"
                  clickHandler={() => {
                    setSmartPasteOpen((v) => !v);
                    setClassifyError(null);
                  }}
                />
                <GTPButton label="Add row" variant="primary" size="sm" clickHandler={addQueueRow} />
              </div>

              {smartPasteOpen && (
                <div className="mt-[8px] rounded-[12px] border border-color-ui-shadow/40 bg-color-bg-medium px-[12px] py-[12px]">
                  <div className="mb-[10px] flex items-center gap-[8px]">
                    <GTPIcon icon="gtp-technology-monochrome" size="sm" className="shrink-0" />
                    <div className="min-w-0 flex flex-wrap items-center gap-[6px]">
                      <span className="text-xs font-medium text-color-text-primary">Smart Paste</span>
                    </div>
                  </div>

                  <div className="mb-[10px] flex flex-wrap items-center gap-[6px]">
                    <GTPButton
                      label="Auto-detect"
                      variant={smartPasteChainMode === "auto" ? "highlight" : "primary"}
                      size="sm"
                      disabled={isClassifying}
                      clickHandler={() => setSmartPasteChainMode("auto")}
                    />
                    {smartPasteChainMode === "auto" ? (
                      <GTPButton
                        label="All same chain"
                        variant="primary"
                        size="sm"
                        disabled={isClassifying}
                        clickHandler={() => setSmartPasteChainMode("fixed")}
                      />
                    ) : (
                      <FieldDropdownButton
                        options={chainOptions}
                        value={smartPasteFixedChain || defaultQueueChainId}
                        placeholder="Select chain"
                        onSelectOption={setSmartPasteFixedChain}
                        iconRenderer={chainIconRenderer}
                        disabled={isClassifying}
                        openOnMount
                        topOffset={32}
                        itemHeight={34}
                        maxVisible={7}
                        triggerButtonProps={{ size: "sm", variant: "primary", isSelected: true }}
                      />
                    )}
                  </div>

                  <textarea
                    className="min-h-[100px] w-full rounded-[22px] bg-color-bg-default px-[14px] py-[12px] text-sm font-mono border-none outline-none resize-y text-color-text-primary placeholder-color-text-secondary"
                    rows={5}
                    placeholder={`Paste contract data here — any format works:\n{\n  "router": "0xabc..."\n  "vault": "0xdef..."\n}`}
                    value={smartPasteText}
                    onChange={(e) => setSmartPasteText(e.target.value)}
                    disabled={isClassifying}
                  />

                  {classifyError && (
                    <div className="mt-[8px] rounded-[10px] border border-color-negative/40 bg-color-negative/10 p-[10px] text-xs text-color-negative">
                      <div className="flex items-start gap-[6px]">
                        <Icon icon="feather:alert-circle" className="size-[13px] shrink-0 mt-[1px]" />
                        <span>{classifyError}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
                    <GTPButton
                      label={isClassifying ? "Classifying..." : "Classify & add to queue"}
                      variant="highlight"
                      size="sm"
                      disabled={isClassifying || !smartPasteText.trim()}
                      clickHandler={classifySmartPaste}
                    />
                    <GTPButton
                      label="Cancel"
                      variant="primary"
                      size="sm"
                      disabled={isClassifying}
                      clickHandler={() => {
                        setSmartPasteOpen(false);
                        setSmartPasteText("");
                        setClassifyError(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contract table */}
            <div className="relative" ref={tableContainerRef}>
              <table className="w-full table-fixed text-xs border-separate border-spacing-y-[5px]">
                <colgroup>
                  <col style={{ width: "32px" }} />
                  <col ref={colChainRef} style={{ width: "40px" }} />
                  <col ref={colAddrRef} />
                  <col ref={colNameRef} />
                  <col ref={colOwnerRef} />
                  <col ref={colUsageRef} />
                  <col style={{ width: "46px" }} />
                </colgroup>
                <thead>
                  <tr className="text-xs text-color-text-primary">
                    <th className="pl-[8px] pr-[4px] pb-[4px] text-left font-normal" />
                    <th className="px-[4px] pb-[4px] text-center font-normal">Chain</th>
                    <th className="px-[6px] pb-[4px] text-left font-normal">Address</th>
                    <th className="px-[6px] pb-[4px] text-left font-normal">Name</th>
                    <th className="px-[6px] pb-[4px] text-left font-normal">Owner</th>
                    <th className="px-[6px] pb-[4px] text-left font-normal">Usage</th>
                    <th className="pb-[4px]" />
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Derive which field type is currently expanding (affects all rows)
                    const activeExpanding: "chain" | "addr" | "owner" | "usage" | null =
                      activeRowDropdown?.startsWith("chain-") ? "chain" :
                      activeRowDropdown?.startsWith("addr-") ? "addr" :
                      activeRowDropdown?.startsWith("owner-") ? "owner" :
                      activeRowDropdown?.startsWith("usage-") ? "usage" : null;
                    // Collapse owner/usage to icon-only when a different field type is expanding
                    const ownerCollapsed = activeExpanding !== null && activeExpanding !== "owner";
                    const usageCollapsed = activeExpanding !== null && activeExpanding !== "usage";
                    return bulkController.queue.rows.map((row, rowIndex) => {
                    const chainId = toStringValue(row.chain_id).trim() || defaultQueueChainId;
                    const rowOwnerProject = toStringValue(row.owner_project).trim();
                    const normalizedRowOwner = rowOwnerProject.toLowerCase();
                    const usageCategory = toStringValue(row.usage_category).trim();
                    const rowErrorMessages = getQueueRowErrorMessages(rowIndex);
                    const rowHasError = rowErrorMessages.length > 0;
                    const addressVal = toStringValue(row.address).trim();
                    const addressInvalid = rowHasError && (!addressVal || !!validateAddressForChain(addressVal, chainId));
                    const ownerExistsInProjects = normalizedProjects.some(
                      (project) => asString(project.owner_project).toLowerCase() === normalizedRowOwner,
                    );
                    const ownerMatchesPendingAddProject =
                      isAddMode &&
                      normalizedRowOwner !== "" &&
                      normalizedRowOwner === ownerProject.trim().toLowerCase();
                    const ownerInvalid =
                      rowHasError &&
                      rowOwnerProject !== "" &&
                      !ownerExistsInProjects &&
                      !ownerMatchesPendingAddProject;
                    const categoryInvalid =
                      rowHasError && usageCategory !== "" && !usageCategoryOptions.some((o) => o.value === usageCategory);
                    const hasData = addressVal !== "" || rowOwnerProject !== "" || usageCategory !== "";
                    const rowIsClean = queueHasValidationResult && !rowHasError && hasData;
                    const rowBg = rowHasError ? "bg-color-negative/[0.07]" : rowIsClean ? "bg-color-positive/[0.04]" : "";
                    const border = rowHasError ? "border-color-negative/30" : rowIsClean ? "border-color-positive/30" : "border-white/[0.1]";
                    const cellMid = `${rowBg} py-[4px] align-middle border-t border-b ${border}`;
                    const cellFirst = `${cellMid} border-l rounded-l-full pl-[10px] pr-[4px]`;
                    const cellLast = `${cellMid} border-r rounded-r-full pl-[2px] pr-[8px]`;
                    const chainDropdownKey = `chain-${rowIndex}`;
                    const addrEditKey = `addr-${rowIndex}`;
                    const ownerDropdownKey = `owner-${rowIndex}`;
                    const usageDropdownKey = `usage-${rowIndex}`;
                    const selectedChainLabel = chainOptions.find((o) => o.value === chainId)?.label ?? chainId;
                    const selectedOwnerLabel = rowOwnerProject
                      ? (ownerProjectOptions.find((o) => o.value === rowOwnerProject)?.label ?? rowOwnerProject)
                      : "";
                    const selectedUsageLabel = usageCategoryOptions.find((o) => o.value === usageCategory)?.label ?? usageCategory;
                    const ownerQuery =
                      activeRowDropdown === ownerDropdownKey
                        ? (rowDropdownQuery[ownerDropdownKey] ?? selectedOwnerLabel)
                        : selectedOwnerLabel;
                    const chainQuery =
                      activeRowDropdown === chainDropdownKey
                        ? (rowDropdownQuery[chainDropdownKey] ?? selectedChainLabel)
                        : selectedChainLabel;
                    const usageQuery =
                      activeRowDropdown === usageDropdownKey
                        ? (rowDropdownQuery[usageDropdownKey] ?? selectedUsageLabel)
                        : selectedUsageLabel;

                    return (
                      <Fragment key={rowIndex}>
                        <tr style={activeRowDropdown?.startsWith(`chain-${rowIndex}`) || activeRowDropdown?.startsWith(`addr-${rowIndex}`) || activeRowDropdown?.startsWith(`owner-${rowIndex}`) || activeRowDropdown?.startsWith(`usage-${rowIndex}`) ? { position: "relative", zIndex: 50 } : undefined}>
                          <td className={`${cellFirst} text-color-text-secondary text-xxs`}>
                            {rowIsClean
                              ? <Icon icon="feather:check" className="size-[12px] text-color-positive" />
                              : rowIndex + 1}
                          </td>
                          <td className={`${cellMid} px-[2px]`}>
                            <div className="relative flex items-center justify-center" data-row-dropdown-root="true">
                              <div
                                className="relative focus-within:z-50 w-full"
                              >
                                {activeRowDropdown === chainDropdownKey ? (
                                  <div className={`relative z-10 flex w-full items-center bg-color-bg-default rounded-full h-[24px] pl-[6px] pr-[8px] ${rowHasError ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}>
                                    <div className="mr-[4px] shrink-0 size-[15px] flex items-center justify-center">
                                      {chainIconRenderer(chainId)}
                                    </div>
                                    <input
                                      value={chainQuery}
                                      onChange={(e) => {
                                        const next = e.target.value;
                                        setRowDropdownQuery((prev) => ({ ...prev, [chainDropdownKey]: next }));
                                        setActiveRowDropdown(chainDropdownKey);
                                      }}
                                      onFocus={() => {
                                        setActiveRowDropdown(chainDropdownKey);
                                        setRowDropdownQuery((prev) => ({ ...prev, [chainDropdownKey]: selectedChainLabel }));
                                      }}
                                      placeholder="Select chain"
                                      className="flex-1 h-full bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
                                    />
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-full p-[2px] hover:bg-color-ui-hover transition-colors"
                                      onClick={() => setActiveRowDropdown(null)}
                                    >
                                      <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className={`size-[28px] rounded-full flex items-center justify-center transition-colors ${rowHasError ? "bg-color-negative/15 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
                                    onClick={() => openChainDropdown(rowIndex, selectedChainLabel)}
                                    title={selectedChainLabel || "Chain"}
                                  >
                                    {chainIconRenderer(chainId)}
                                  </button>
                                )}
                                {activeRowDropdown === chainDropdownKey && (
                                  <FieldDropdown
                                    options={filterRowOptions(chainOptions, chainQuery)}
                                    onSelectOption={(value) => {
                                      setQueueCellValue(rowIndex, "chain_id", value);
                                      setRowDropdownQuery((prev) => ({ ...prev, [chainDropdownKey]: "" }));
                                      setActiveRowDropdown(null);
                                    }}
                                    iconRenderer={chainIconRenderer}
                                    topOffset={24}
                                    itemHeight={34}
                                    maxVisible={5}
                                  />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={`${cellMid} pl-[2px] pr-[6px]`}>
                            <div className="w-full" data-row-dropdown-root="true">
                              {activeRowDropdown === addrEditKey ? (
                                <FieldInput
                                  value={toStringValue(row.address)}
                                  onChange={(value) => setQueueCellValue(rowIndex, "address", value)}
                                  placeholder="0x..."
                                  variant="row"
                                  mono
                                  autoFocus
                                  error={addressInvalid}
                                  onBlur={() => setActiveRowDropdown(null)}
                                />
                              ) : (
                                <div
                                  className={`flex w-full items-center rounded-full h-[24px] bg-color-bg-default pl-[6px] pr-[10px] cursor-text ${addressInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}
                                  onClick={() => setActiveRowDropdown(addrEditKey)}
                                >
                                  <div className="flex flex-1 min-w-0 font-mono text-xs text-color-text-primary overflow-hidden">
                                    {addressVal ? (
                                      <>
                                        <div
                                          className="min-w-0 overflow-hidden"
                                          style={{
                                            WebkitMaskImage: "linear-gradient(to right, black 20%, transparent)",
                                            maskImage: "linear-gradient(to right, black 20%, transparent)",
                                          }}
                                        >
                                          {addressVal.slice(0, -6)}
                                        </div>
                                        <span
                                          className="shrink-0"
                                          style={{
                                            WebkitMaskImage: "linear-gradient(to left, black 20%, transparent)",
                                            maskImage: "linear-gradient(to left, black 20%, transparent)",
                                          }}
                                        >
                                          {addressVal.slice(-6)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-color-text-secondary">0x...</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`${cellMid} pl-[2px] pr-[6px]`}>
                            <FieldInput
                              value={toStringValue(row.contract_name)}
                              onChange={(value) => setQueueCellValue(rowIndex, "contract_name", value)}
                              placeholder="Contract name"
                              variant="row"
                            />
                          </td>
                          <td className={`${cellMid} pl-[2px] pr-[6px]`}>
                            {ownerCollapsed ? (
                              <div className="flex items-center justify-center" data-row-dropdown-root="true">
                                <button
                                  type="button"
                                  className={`size-[28px] rounded-full flex items-center justify-center transition-colors ${ownerInvalid ? "bg-color-negative/15 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
                                  onClick={() => {
                                    setRowDropdownQuery((prev) => ({ ...prev, [ownerDropdownKey]: selectedOwnerLabel }));
                                    setActiveRowDropdown(ownerDropdownKey);
                                  }}
                                  title={selectedOwnerLabel || "Owner"}
                                >
                                  <ApplicationIcon owner_project={rowOwnerProject} size="sm" className="flex items-center justify-center select-none size-[28px]" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="relative focus-within:z-50 w-full"
                                data-row-dropdown-root="true"
                              >
                                <div className={`relative z-10 flex w-full items-center bg-color-bg-default rounded-full h-[24px] pl-[6px] pr-[8px] ${ownerInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}>
                                  <div className="mr-[4px] shrink-0 size-[18px] flex items-center justify-center">
                                    <ApplicationIcon owner_project={rowOwnerProject} size="sm" className="flex items-center justify-center select-none size-[18px]" />
                                  </div>
                                  <input
                                    value={ownerQuery}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      setRowDropdownQuery((prev) => ({ ...prev, [ownerDropdownKey]: next }));
                                      setActiveRowDropdown(ownerDropdownKey);
                                    }}
                                    onFocus={() => {
                                      setActiveRowDropdown(ownerDropdownKey);
                                      setRowDropdownQuery((prev) => ({ ...prev, [ownerDropdownKey]: selectedOwnerLabel }));
                                    }}
                                    placeholder="Select owner"
                                    className="flex-1 h-full min-w-0 bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
                                  />
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-full p-[2px] hover:bg-color-ui-hover transition-colors"
                                    onClick={() => setActiveRowDropdown((v) => (v === ownerDropdownKey ? null : ownerDropdownKey))}
                                  >
                                    <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                                  </button>
                                </div>
                                {activeRowDropdown === ownerDropdownKey && (
                                  <FieldDropdown
                                    options={filterRowOptions(ownerProjectOptions, ownerQuery)}
                                    onSelectOption={(value) => {
                                      setQueueCellValue(rowIndex, "owner_project", value);
                                      setRowDropdownQuery((prev) => ({ ...prev, [ownerDropdownKey]: "" }));
                                      setActiveRowDropdown(null);
                                    }}
                                    iconRenderer={(value) =>
                                      value
                                        ? <ApplicationIcon owner_project={value} size="sm" className="flex items-center justify-center select-none size-[18px]" />
                                        : <Icon icon="feather:unlink" className="size-[13px] text-color-text-secondary" />
                                    }
                                    showSecondaryValue
                                    topOffset={24}
                                    itemHeight={34}
                                    maxVisible={5}
                                  />
                                )}
                              </div>
                            )}
                          </td>
                          <td className={`${cellMid} pl-[2px] pr-[6px]`}>
                            {usageCollapsed ? (
                              <div className="flex items-center justify-center" data-row-dropdown-root="true">
                                <button
                                  type="button"
                                  className={`size-[28px] rounded-full flex items-center justify-center transition-colors ${categoryInvalid ? "bg-color-negative/15 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
                                  onClick={() => {
                                    setRowDropdownQuery((prev) => ({ ...prev, [usageDropdownKey]: selectedUsageLabel }));
                                    setActiveRowDropdown(usageDropdownKey);
                                  }}
                                  title={selectedUsageLabel || "Category"}
                                >
                                  {usageCategoryIconRenderer(usageCategory) ?? <Icon icon="feather:tag" className="size-[13px] text-color-text-secondary" />}
                                </button>
                              </div>
                            ) : (
                              <div
                                className="relative focus-within:z-50 w-full"
                                data-row-dropdown-root="true"
                              >
                                <div className={`relative z-10 flex w-full items-center bg-color-bg-default rounded-full h-[24px] pl-[8px] pr-[8px] ${categoryInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}>
                                  {usageCategoryIconRenderer(usageCategory) && (
                                    <div className="mr-[4px] shrink-0 size-[15px] flex items-center justify-center">
                                      {usageCategoryIconRenderer(usageCategory)}
                                    </div>
                                  )}
                                  <input
                                    value={usageQuery}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      setRowDropdownQuery((prev) => ({ ...prev, [usageDropdownKey]: next }));
                                      setActiveRowDropdown(usageDropdownKey);
                                    }}
                                    onFocus={() => {
                                      setActiveRowDropdown(usageDropdownKey);
                                      setRowDropdownQuery((prev) => ({ ...prev, [usageDropdownKey]: selectedUsageLabel }));
                                    }}
                                    placeholder="Select category"
                                    className="flex-1 h-full min-w-0 bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
                                  />
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-full p-[2px] hover:bg-color-ui-hover transition-colors"
                                    onClick={() => setActiveRowDropdown((v) => (v === usageDropdownKey ? null : usageDropdownKey))}
                                  >
                                    <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                                  </button>
                                </div>
                                {activeRowDropdown === usageDropdownKey && (
                                  <FieldDropdown
                                    options={filterRowOptions(usageCategoryOptions, usageQuery)}
                                    onSelectOption={(value) => {
                                      setQueueCellValue(rowIndex, "usage_category", value);
                                      setRowDropdownQuery((prev) => ({ ...prev, [usageDropdownKey]: "" }));
                                      setActiveRowDropdown(null);
                                    }}
                                    iconRenderer={usageCategoryIconRenderer}
                                    topOffset={24}
                                    itemHeight={34}
                                    maxVisible={5}
                                  />
                                )}
                              </div>
                            )}
                          </td>
                          <td className={cellLast}>
                            <div className="flex items-center justify-end">
                              <GTPButton
                                variant="primary"
                                size="sm"
                                leftIcon="in-button-close"
                                clickHandler={() => removeQueueRow(rowIndex)}
                              />
                            </div>
                          </td>
                        </tr>
                        {rowHasError && (
                          <tr>
                            <td colSpan={7} className="px-[8px] pb-[2px] pt-0">
                              <div className="flex items-start gap-x-[6px] pl-[2px]">
                                <div className="shrink-0 rounded-full border border-color-negative/50 bg-color-bg-default px-[7px] py-[2px] text-xxs font-semibold text-color-negative leading-[1.6]">
                                  #{rowIndex + 1}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-wrap gap-[4px]">
                                  {rowErrorMessages.map((error, i) => (
                                    <div key={i} className="rounded-full border border-color-negative/25 bg-color-bg-default px-[10px] py-[3px] text-xxs text-color-negative leading-[1.6] shadow-sm">
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  });
                  })()}
                  {meaningfulRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-[40px] text-center">
                        <div className="flex flex-col items-center gap-y-[8px] text-xs text-color-text-primary">
                          <Icon icon="feather:inbox" className="size-[20px] opacity-40" />
                          <span>No contracts in queue. Add a row or upload a CSV.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-[10px] flex items-center justify-end gap-x-[8px]">
              <GTPButton
                label={
                  bulkController.validation.isRunning || singleController.validation.isRunning
                    ? "Validating..."
                    : "Validate queue"
                }
                variant={queueHasValidationResult && queueStats.errors === 0 ? "primary" : "highlight"}
                size="sm"
                clickHandler={validateQueue}
                disabled={bulkController.validation.isRunning || singleController.validation.isRunning}
              />
              {queueHasValidationResult && queueStats.errors === 0 && meaningfulRows.length > 0 && (
                <GTPButton
                  label="Connect wallet"
                  variant="highlight"
                  size="sm"
                  rightIcon={"in-button-right" as any}
                  clickHandler={() => setActiveStep(3)}
                />
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Step 3: Connect Wallet ── */}
      <div ref={step3CardRef} className="rounded-[16px] border border-color-ui-shadow/40 bg-color-bg-default">
        <button
          ref={step3HeaderRef}
          type="button"
          onClick={() => setActiveStep(3)}
          className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
        >
          <div className="shrink-0 size-[26px] rounded-full border border-color-ui-shadow/40 flex items-center justify-center bg-color-bg-default hover:bg-color-ui-hover transition-colors">
            <Icon
              icon="feather:chevron-down"
              className={`size-[14px] text-color-text-secondary transition-transform ${activeStep === 3 ? "rotate-180" : ""}`}
            />
          </div>
          <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            walletAddress
              ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
              : activeStep === 3
              ? "bg-color-text-primary text-color-bg-default"
              : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
          }`}>
            {walletAddress ? <Icon icon="feather:check" className="size-[13px]" /> : 3}
          </div>
          <GTPIcon icon="gtp-wallet" size="sm" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Connect wallet</div>
            {activeStep !== 3 && (
              <div className="text-xs text-color-text-secondary mt-[2px] truncate">
                {walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : "Connect your wallet to sign attestations"}
              </div>
            )}
          </div>
        </button>

        {activeStep === 3 && (
          <div className="border-t border-color-ui-shadow/40 px-[20px] pb-[20px] pt-[16px] flex flex-col gap-y-[16px]">
            {/* Wallet connection */}
            <div className="flex flex-col gap-y-[12px]">
              <p className="text-xs text-color-text-primary">Connect your wallet to sign onchain attestations.</p>
              <div className="flex items-center justify-end gap-x-[8px]">
                {walletAddress ? (
                  <>
                    <div className="size-[8px] rounded-full bg-color-positive" />
                    <span className="text-sm text-color-text-primary">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
                    <GTPButton label="Disconnect" size="sm" variant="primary" clickHandler={disconnectWallet} />
                  </>
                ) : (
                  <GTPButton
                    label={isConnectingWallet ? "Connecting..." : "Connect wallet"}
                    size="sm"
                    variant="highlight"
                    leftIcon={"gtp-wallet" as any}
                    clickHandler={connectWallet}
                    disabled={isConnectingWallet}
                  />
                )}
              </div>
            </div>

            {/* Survey */}
            <div className="border-t border-color-ui-shadow/40 pt-[16px] flex flex-col gap-y-[12px]">
              <div className="text-sm font-medium">A few quick questions</div>

              <div className="flex flex-col gap-y-[10px]">
                {/* Team size */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">How big is your team?</label>
                  <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                    <input
                      value={surveyTeamSize}
                      onChange={(e) => setSurveyTeamSize(e.target.value)}
                      placeholder="e.g. Solo, 2–5, 10+"
                      className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                    />
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">What's your goal with submitting your labels?</label>
                  <textarea
                    value={surveyGoal}
                    onChange={(e) => setSurveyGoal(e.target.value)}
                    placeholder="e.g. Improve data accuracy, get visibility for our project..."
                    className="w-full rounded-[22px] bg-color-bg-medium px-[14px] py-[12px] text-sm border-none outline-none resize-none text-color-text-primary placeholder-color-text-secondary min-h-[72px]"
                  />
                </div>

                {/* Most important metric */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">What's the most important metric you are tracking?</label>
                  <div className="flex w-full items-center bg-color-bg-medium rounded-[22px] h-[44px] px-[14px]">
                    <input
                      value={surveyMetric}
                      onChange={(e) => setSurveyMetric(e.target.value)}
                      placeholder="e.g. TVL, daily active users, transaction volume..."
                      className="flex-1 h-full bg-transparent border-none outline-none text-sm text-color-text-primary placeholder-color-text-secondary"
                    />
                  </div>
                </div>

                {/* Anything else */}
                <div>
                  <label className="mb-[6px] block text-xs font-medium text-color-text-primary">
                    Anything else you'd like to tell us?{" "}
                    <span className="font-normal text-color-text-secondary">(what you miss on growthepie, etc.)</span>
                  </label>
                  <textarea
                    value={surveyOther}
                    onChange={(e) => setSurveyOther(e.target.value)}
                    placeholder="Share any feedback or feature requests..."
                    className="w-full rounded-[22px] bg-color-bg-medium px-[14px] py-[12px] text-sm border-none outline-none resize-none text-color-text-primary placeholder-color-text-secondary min-h-[72px]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-[4px] flex items-center justify-end gap-x-[8px]">
              <GTPButton
                label="Continue to review"
                variant="highlight"
                size="sm"
                rightIcon={"in-button-right" as any}
                clickHandler={() => {
                  onSurveySubmit?.({ teamSize: surveyTeamSize, goal: surveyGoal, metric: surveyMetric, other: surveyOther });
                  setActiveStep(4);
                }}
                className={
                  surveyTeamSize.trim() && surveyGoal.trim() && surveyMetric.trim()
                    ? "bg-color-text-primary text-color-bg-default"
                    : "border border-color-ui-shadow bg-color-bg-default"
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Step 4: Review & Submit ── */}
      <div ref={step4CardRef} className="rounded-[16px] border border-color-ui-shadow/40 bg-color-bg-default">
        <button
          ref={step4HeaderRef}
          type="button"
          onClick={() => setActiveStep(4)}
          className="w-full flex items-center gap-x-[12px] px-[16px] py-[14px] hover:bg-color-bg-medium/30 transition-colors text-left"
        >
          <div className="shrink-0 size-[26px] rounded-full border border-color-ui-shadow/40 flex items-center justify-center bg-color-bg-default hover:bg-color-ui-hover transition-colors">
            <Icon
              icon="feather:chevron-down"
              className={`size-[14px] text-color-text-secondary transition-transform ${activeStep === 4 ? "rotate-180" : ""}`}
            />
          </div>
          <div className={`shrink-0 size-[26px] rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            (singleSubmitResult || bulkSubmitResult)
              ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
              : activeStep === 4
              ? "bg-color-text-primary text-color-bg-default"
              : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
          }`}>
            {(singleSubmitResult || bulkSubmitResult) ? <Icon icon="feather:check" className="size-[13px]" /> : 4}
          </div>
          <GTPIcon icon={"gtp-checkmark-checked" as any} size="sm" className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Review & submit</div>
            {activeStep !== 4 && (
              <div className="text-xs text-color-text-secondary mt-[2px] truncate">
                {singleSubmitResult || bulkSubmitResult
                  ? "Attestation submitted"
                  : "Submit contract attestations onchain"}
              </div>
            )}
          </div>
        </button>

        {activeStep === 4 && (
          <div className="border-t border-color-ui-shadow/40 px-[20px] pb-[20px] pt-[16px] flex flex-col gap-y-[12px]">
            {!queueSubmitPreview ? (
              <div className="flex flex-col gap-y-[10px]">
                <p className="text-xs text-color-text-primary">Review your contract attestations before signing.</p>
                {!walletAddress && (
                  <p className="text-xs text-color-text-secondary">Connect your wallet in step 3 first.</p>
                )}
                <div className="flex items-center justify-end gap-x-[8px]">
                  <GTPButton
                    label={isPreparingSubmitPreview ? "Preparing preview..." : `Review & submit (${meaningfulRows.length})`}
                    size="sm"
                    variant="highlight"
                    disabled={meaningfulRows.length === 0 || isPreparingSubmitPreview || isSubmittingFromPreview}
                    clickHandler={prepareQueueSubmitPreview}
                    className={
                      walletAddress && meaningfulRows.length > 0 && !isPreparingSubmitPreview && !isSubmittingFromPreview
                        ? "bg-color-text-primary text-color-bg-default"
                        : "border border-color-ui-shadow bg-color-bg-default"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-[12px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-xs">
                <div className="font-semibold">Transaction preview</div>
                <div className="mt-[2px] text-color-text-primary">
                  Final validation passed. Review payloads before signing{" "}
                  {queueSubmitPreview.preparedRows.length} transaction
                  {queueSubmitPreview.preparedRows.length === 1 ? "" : "s"}.
                </div>

                <div className="mt-[8px] max-h-[260px] overflow-auto rounded-[10px] border border-color-ui-shadow">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-[0px] text-xxs">
                    <thead className="sticky top-0 bg-color-bg-default">
                      <tr className="text-color-text-primary">
                        <th className="px-[8px] py-[6px] text-left font-medium">#</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Chain</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Address</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Contract</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Owner</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Category</th>
                        <th className="px-[8px] py-[6px] text-left font-medium">Encoded data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueSubmitPreview.preparedRows.map((prepared, index) => (
                        <tr key={`${prepared.chainId}-${prepared.address}-${index}`}>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{index + 1}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{prepared.chainId}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{prepared.address}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{toStringValue(prepared.raw.contract_name)}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{toStringValue(prepared.raw.owner_project)}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px]">{toStringValue(prepared.raw.usage_category)}</td>
                          <td className="border-t border-color-ui-shadow px-[8px] py-[6px] font-mono">{truncateHex(prepared.encodedData)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-[10px] flex items-center justify-end gap-x-[8px]">
                  <GTPButton
                    label="Cancel"
                    size="sm"
                    variant="primary"
                    disabled={isSubmittingFromPreview}
                    clickHandler={() => setQueueSubmitPreview(null)}
                  />
                  <GTPButton
                    label={
                      isSubmittingFromPreview
                        ? "Waiting for signature..."
                        : queueSubmitPreview.preparedRows.length === 1
                        ? "Sign transaction"
                        : `Sign ${queueSubmitPreview.preparedRows.length} transactions`
                    }
                    size="sm"
                    variant="highlight"
                    disabled={isSubmittingFromPreview}
                    clickHandler={confirmQueueSubmit}
                    className={!isSubmittingFromPreview ? "bg-color-text-primary text-color-bg-default" : "border border-color-ui-shadow bg-color-bg-default"}
                  />
                </div>
              </div>
            )}

            {(submitError || walletError) && (
              <div className="rounded-[10px] border border-color-negative/30 bg-color-negative/10 p-[12px]">
                <button
                  type="button"
                  onClick={() => setErrorExpanded((v) => !v)}
                  className="flex w-full items-center gap-x-[8px] text-left"
                >
                  <Icon icon="feather:alert-circle" className="size-[14px] text-color-negative shrink-0" />
                  <div className="font-medium text-sm text-color-negative flex-1">Transaction failed</div>
                  <Icon
                    icon="feather:chevron-down"
                    className={`size-[14px] text-color-negative shrink-0 transition-transform ${errorExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {errorExpanded && (
                  <p className="mt-[8px] text-xs text-color-text-primary break-all">{submitError || walletError}</p>
                )}
              </div>
            )}

            {(singleSubmitResult || bulkSubmitResult) && (
              <div className="rounded-[10px] border border-color-positive/30 bg-color-positive/10 p-[12px]">
                <div className="flex items-center gap-x-[8px]">
                  <Icon icon="feather:check-circle" className="size-[14px] text-color-positive shrink-0" />
                  <div className="font-medium text-sm text-color-positive">Attestation submitted</div>
                </div>
                {singleSubmitResult && (
                  <div className="mt-[4px] text-xs text-color-text-primary">
                    Status: {singleSubmitResult.status}
                    {singleSubmitResult.txHash && (
                      <div className="mt-[2px]">
                        Tx:{" "}
                        <Link
                          href={getTxExplorerUrl(lastSubmitChainId, singleSubmitResult.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono underline hover:opacity-70 break-all"
                        >
                          {truncateHex(singleSubmitResult.txHash, 18, 16)}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {bulkSubmitResult && (
                  <div className="mt-[4px] text-xs text-color-text-primary">
                    Status: {bulkSubmitResult.status}
                    {bulkSubmitResult.txHash && (
                      <div className="mt-[2px]">
                        Tx:{" "}
                        <Link
                          href={getTxExplorerUrl(lastSubmitChainId, bulkSubmitResult.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono underline hover:opacity-70 break-all"
                        >
                          {truncateHex(bulkSubmitResult.txHash, 18, 16)}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
