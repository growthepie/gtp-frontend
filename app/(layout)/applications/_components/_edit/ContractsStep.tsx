"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import { validateAddressForChain } from "@openlabels/oli-sdk/validation";
import type { AttestationRowInput, BulkOnchainSubmitResult, OnchainSubmitResult, PreparedAttestation, ProjectRecord } from "@openlabels/oli-sdk";
import type { QueueEditableField, QueueSubmitPreview, SearchDropdownOption } from "./types";
import { asString, getTxExplorerUrl, toStringValue, truncateHex, truncateMiddle } from "./utils";
import { FieldDropdown, FieldDropdownButton, FieldInput } from "./FieldDropdown";
import type { ReactNode, ChangeEvent } from "react";
import type { useBulkCsvAttestUI, useSingleAttestUI } from "@openlabels/oli-sdk/attest-ui";

type ContractsStepProps = {
  activeStep: 1 | 2 | 3 | 4;
  setActiveStep: (step: 1 | 2 | 3 | 4) => void;

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

  // Cell operations
  setQueueCellValue: (rowIndex: number, field: QueueEditableField, value: string) => void;
  addQueueRow: () => void;
  removeQueueRow: (rowIndex: number) => void;
  addressEditRow: number | null;
  setAddressEditRow: React.Dispatch<React.SetStateAction<number | null>>;
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
};

export function ContractsStep({
  activeStep,
  setActiveStep,
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
  setQueueCellValue,
  addQueueRow,
  removeQueueRow,
  addressEditRow,
  setAddressEditRow,
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
}: ContractsStepProps) {
  const [activeRowDropdown, setActiveRowDropdown] = useState<string | null>(null);
  const [rowDropdownQuery, setRowDropdownQuery] = useState<Record<string, string>>({});
  const [expandedChainFieldWidth, setExpandedChainFieldWidth] = useState(180);
  const [expandedOwnerFieldWidth, setExpandedOwnerFieldWidth] = useState(210);
  const [expandedUsageFieldWidth, setExpandedUsageFieldWidth] = useState(190);
  const chainMeasureRef = useRef<HTMLDivElement | null>(null);
  const ownerMeasureRef = useRef<HTMLDivElement | null>(null);
  const usageMeasureRef = useRef<HTMLDivElement | null>(null);

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
    const measureExpandedWidths = () => {
      const measuredChain = chainMeasureRef.current?.offsetWidth ?? 0;
      const measuredOwner = ownerMeasureRef.current?.offsetWidth ?? 0;
      const measuredUsage = usageMeasureRef.current?.offsetWidth ?? 0;

      if (measuredChain > 0) {
        setExpandedChainFieldWidth(Math.max(160, measuredChain));
      }
      if (measuredOwner > 0) {
        setExpandedOwnerFieldWidth(Math.max(190, measuredOwner));
      }
      if (measuredUsage > 0) {
        setExpandedUsageFieldWidth(Math.max(170, measuredUsage));
      }
    };
    measureExpandedWidths();
    window.addEventListener("resize", measureExpandedWidths);
    return () => window.removeEventListener("resize", measureExpandedWidths);
  }, [chainOptions.length, ownerProjectOptions.length, usageCategoryOptions.length]);

  const openChainDropdown = (rowIndex: number, selectedLabel: string) => {
    const key = `chain-${rowIndex}`;
    setRowDropdownQuery((prev) => ({ ...prev, [key]: selectedLabel }));
    setActiveRowDropdown(key);
    const measured = chainMeasureRef.current?.offsetWidth ?? 0;
    if (measured > 0) {
      setExpandedChainFieldWidth(Math.max(160, measured));
    }
  };

  return (
    <>
      {/* ── Step 2: Add Contracts ── */}
      <div className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden bg-color-bg-default">
        <button
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
            (singleSubmitResult || bulkSubmitResult)
              ? "bg-color-positive/15 border border-color-positive/30 text-color-positive"
              : activeStep === 2
              ? "bg-color-text-primary text-color-bg-default"
              : "bg-color-bg-medium border border-color-ui-shadow/60 text-color-text-secondary"
          }`}>
            {(singleSubmitResult || bulkSubmitResult) ? <Icon icon="feather:check" className="size-[13px]" /> : 2}
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
            <div className="relative overflow-x-auto">
              {/* Hidden measurement block for chain field expanded width */}
              <div className="absolute opacity-0 pointer-events-none -z-10">
                <div ref={chainMeasureRef} className="rounded-[22px] p-[8px] w-fit">
                  <div className="flex flex-col gap-y-[6px] pt-[24px]">
                    {chainOptions.slice(0, 5).map((option) => (
                      <div key={option.value} className="flex items-center gap-x-[6px] h-[24px] pl-[6px] pr-[10px] whitespace-nowrap">
                        <div className="shrink-0 size-[15px] flex items-center justify-center">
                          {chainIconRenderer(option.value)}
                        </div>
                        <div className="text-xs">{option.label}</div>
                        <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={ownerMeasureRef} className="rounded-[22px] p-[8px] w-fit">
                  <div className="flex flex-col gap-y-[6px] pt-[24px]">
                    {ownerProjectOptions.slice(0, 5).map((option) => (
                      <div key={option.value} className="flex items-center gap-x-[6px] h-[24px] pl-[8px] pr-[10px] whitespace-nowrap">
                        <div className="text-xs">{option.label}</div>
                        <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={usageMeasureRef} className="rounded-[22px] p-[8px] w-fit">
                  <div className="flex flex-col gap-y-[6px] pt-[24px]">
                    {usageCategoryOptions.slice(0, 5).map((option) => (
                      <div key={option.value} className="flex items-center gap-x-[6px] h-[24px] pl-[8px] pr-[10px] whitespace-nowrap">
                        <div className="text-xs">{option.label}</div>
                        <Icon icon="feather:chevron-down" className="size-[10px] text-color-text-secondary" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <table className="w-full min-w-[860px] table-auto text-xs border-separate border-spacing-y-[5px]">
                <thead>
                  <tr className="text-xs text-color-text-primary">
                    <th className="w-[32px] pl-[8px] pr-[4px] pb-[4px] text-left font-normal" />
                    <th className="w-[72px] px-[4px] pb-[4px] text-left font-normal">Chain</th>
                    <th className="min-w-[170px] px-[6px] pb-[4px] text-left font-normal">Address</th>
                    <th className="min-w-[170px] px-[6px] pb-[4px] text-left font-normal">Contract name</th>
                    <th className="min-w-[170px] px-[6px] pb-[4px] text-left font-normal">Owner project</th>
                    <th className="min-w-[170px] px-[6px] pb-[4px] text-left font-normal">Usage category</th>
                    <th className="w-[46px] pb-[4px]" />
                  </tr>
                </thead>
                <tbody>
                  {bulkController.queue.rows.map((row, rowIndex) => {
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
                    const rowBg = rowHasError ? "bg-color-negative/[0.07]" : "";
                    const border = rowHasError ? "border-color-negative/30" : "border-white/[0.1]";
                    const cellMid = `${rowBg} py-[4px] align-middle border-t border-b ${border}`;
                    const cellFirst = `${cellMid} border-l rounded-l-full pl-[10px] pr-[4px]`;
                    const cellLast = `${cellMid} border-r rounded-r-full pl-[2px] pr-[8px]`;
                    const isEditingAddress = addressEditRow === rowIndex;
                    const chainDropdownKey = `chain-${rowIndex}`;
                    const ownerDropdownKey = `owner-${rowIndex}`;
                    const usageDropdownKey = `usage-${rowIndex}`;
                    const selectedChainLabel = chainOptions.find((o) => o.value === chainId)?.label ?? chainId;
                    const selectedOwnerLabel = ownerProjectOptions.find((o) => o.value === rowOwnerProject)?.label ?? rowOwnerProject;
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
                        <tr>
                          <td className={`${cellFirst} text-color-text-secondary text-xxs`}>{rowIndex + 1}</td>
                          <td className={`${cellMid} px-[2px]`}>
                            <div className="relative flex items-center justify-center" data-row-dropdown-root="true">
                              <div
                                className="relative focus-within:z-50 transition-[width] duration-300"
                                style={{
                                  width:
                                    activeRowDropdown === chainDropdownKey
                                      ? `${Math.min(expandedChainFieldWidth, 320)}px`
                                      : "28px",
                                }}
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
                          <td className={`${cellMid} pl-0 pr-[6px]`}>
                            {isEditingAddress ? (
                              <FieldInput
                                value={toStringValue(row.address)}
                                onChange={(value) => setQueueCellValue(rowIndex, "address", value)}
                                placeholder="0x..."
                                variant="row"
                                mono
                                autoFocus
                                error={addressInvalid}
                                onBlur={() => setAddressEditRow(null)}
                              />
                            ) : (
                              <button
                                type="button"
                                className={`h-[24px] w-full rounded-full pl-[6px] pr-[10px] font-mono text-xs text-left border-none outline-none transition-colors ${addressInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : "bg-color-bg-default hover:bg-color-ui-hover"} ${!addressVal ? "text-color-text-secondary" : ""}`}
                                onClick={() => setAddressEditRow(rowIndex)}
                              >
                                {addressVal ? truncateMiddle(addressVal) : "0x…"}
                              </button>
                            )}
                          </td>
                          <td className={`${cellMid} pl-0 pr-[6px]`}>
                            <FieldInput
                              value={toStringValue(row.contract_name)}
                              onChange={(value) => setQueueCellValue(rowIndex, "contract_name", value)}
                              placeholder="Contract name"
                              variant="row"
                            />
                          </td>
                          <td className={`${cellMid} pl-0 pr-[6px]`}>
                            <div
                              className="relative focus-within:z-50 transition-[width] duration-300"
                              data-row-dropdown-root="true"
                              style={{
                                width:
                                  activeRowDropdown === ownerDropdownKey
                                    ? `${Math.min(expandedOwnerFieldWidth, 360)}px`
                                    : "100%",
                              }}
                            >
                              <div className={`relative z-10 flex w-full items-center bg-color-bg-default rounded-full h-[24px] pl-[6px] pr-[8px] ${ownerInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}>
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
                                  className="flex-1 h-full bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
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
                                  showSecondaryValue
                                  topOffset={24}
                                  itemHeight={34}
                                  maxVisible={5}
                                />
                              )}
                            </div>
                          </td>
                          <td className={`${cellMid} pl-0 pr-[6px]`}>
                            <div
                              className="relative focus-within:z-50 transition-[width] duration-300"
                              data-row-dropdown-root="true"
                              style={{
                                width:
                                  activeRowDropdown === usageDropdownKey
                                    ? `${Math.min(expandedUsageFieldWidth, 320)}px`
                                    : "100%",
                              }}
                            >
                              <div className={`relative z-10 flex w-full items-center bg-color-bg-default rounded-full h-[24px] pl-[8px] pr-[8px] ${categoryInvalid ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""}`}>
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
                                  className="flex-1 h-full bg-transparent border-none outline-none text-xs text-color-text-primary placeholder-color-text-secondary"
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
                                  topOffset={24}
                                  itemHeight={34}
                                  maxVisible={5}
                                />
                              )}
                            </div>
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
                  })}
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

            <div className="mt-[10px] flex justify-end">
              <GTPButton
                label={
                  bulkController.validation.isRunning || singleController.validation.isRunning
                    ? "Validating..."
                    : "Validate queue"
                }
                variant="highlight"
                size="sm"
                clickHandler={validateQueue}
                disabled={bulkController.validation.isRunning || singleController.validation.isRunning}
              />
            </div>

            {queueError && (
              <div className="mt-[8px] rounded-[12px] border border-color-negative/50 bg-color-negative/10 px-[12px] py-[10px] text-xs">
                {queueError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 3: Connect Wallet ── */}
      <div className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden bg-color-bg-default">
        <button
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
          <div className="border-t border-color-ui-shadow/40 px-[20px] pb-[20px] pt-[16px] flex flex-col gap-y-[12px]">
            <p className="text-xs text-color-text-primary">Connect your wallet to sign onchain attestations.</p>
            {walletAddress ? (
              <div className="flex items-center gap-x-[10px]">
                <div className="size-[8px] rounded-full bg-color-positive" />
                <span className="text-sm text-color-text-primary">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
                <GTPButton label="Disconnect" size="sm" variant="primary" clickHandler={disconnectWallet} />
              </div>
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
            {walletError && <p className="text-xs text-color-negative">{walletError}</p>}
          </div>
        )}
      </div>

      {/* ── Step 4: Review & Submit ── */}
      <div className="rounded-[16px] border border-color-ui-shadow/40 overflow-hidden bg-color-bg-default">
        <button
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
                <GTPButton
                  label={isPreparingSubmitPreview ? "Preparing preview..." : `Review & submit (${meaningfulRows.length})`}
                  size="sm"
                  variant="highlight"
                  disabled={!walletAddress || meaningfulRows.length === 0 || isPreparingSubmitPreview || isSubmittingFromPreview}
                  clickHandler={prepareQueueSubmitPreview}
                />
                {!walletAddress && (
                  <p className="text-xs text-color-text-secondary">Connect your wallet in step 3 first.</p>
                )}
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

                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                    onClick={() => setQueueSubmitPreview(null)}
                    disabled={isSubmittingFromPreview}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="h-[34px] rounded-full border border-color-ui-shadow bg-color-bg-default px-[12px] text-xs"
                    onClick={confirmQueueSubmit}
                    disabled={isSubmittingFromPreview}
                  >
                    {isSubmittingFromPreview
                      ? "Waiting for signature..."
                      : queueSubmitPreview.preparedRows.length === 1
                      ? "Sign transaction"
                      : `Sign ${queueSubmitPreview.preparedRows.length} transactions`}
                  </button>
                </div>
              </div>
            )}

            {(submitError || walletError) && (
              <div className="rounded-[12px] border border-color-negative/50 bg-color-negative/10 px-[12px] py-[10px] text-xs">
                {submitError || walletError}
              </div>
            )}

            {(singleSubmitResult || bulkSubmitResult) && (
              <div className="rounded-[12px] border border-color-ui-shadow bg-color-bg-medium px-[12px] py-[10px] text-xs">
                <div className="font-semibold">Attestation submitted</div>
                {singleSubmitResult && (
                  <div className="mt-[4px]">
                    Status: {singleSubmitResult.status}
                    {singleSubmitResult.txHash && (
                      <div className="mt-[2px]">
                        Tx:{" "}
                        <Link
                          href={getTxExplorerUrl(lastSubmitChainId, singleSubmitResult.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono underline hover:opacity-70"
                        >
                          {truncateHex(singleSubmitResult.txHash, 18, 16)}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {bulkSubmitResult && (
                  <div className="mt-[4px]">
                    Status: {bulkSubmitResult.status}
                    {bulkSubmitResult.txHash && (
                      <div className="mt-[2px]">
                        Tx:{" "}
                        <Link
                          href={getTxExplorerUrl(lastSubmitChainId, bulkSubmitResult.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono underline hover:opacity-70"
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
