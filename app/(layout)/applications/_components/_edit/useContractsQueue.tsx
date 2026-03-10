"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createWalletClient, custom, defineChain } from "viem";
import Icon from "@/components/layout/Icon";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import {
  clearProjectEditContractSeed,
  readProjectEditContractSeed,
} from "@/lib/project-edit-contract-seed";
import {
  AttestClient,
  createDynamicWalletAdapter,
  type AttestationDiagnostics,
  type AttestationRowInput,
  type BulkOnchainSubmitResult,
  type OnchainSubmitResult,
  type PreparedAttestation,
  type ProjectRecord,
} from "@openlabels/oli-sdk";
import { useBulkCsvAttestUI, useSingleAttestUI } from "@openlabels/oli-sdk/attest-ui";
import type { parseProjectEditIntent } from "@/lib/project-edit-intent";
import type { ProjectMode, QueueEditableField, QueueSubmitPreview, SearchDropdownOption } from "./types";
import { EMPTY_QUEUE_DIAGNOSTICS, MAX_QUEUE_ROWS, NO_OWNER_PROJECT_OPTION, QUEUE_EDITABLE_FIELDS } from "./constants";
import { hasMeaningfulRowData, getQueueRowKey, rowPreviewSignature, toStringValue } from "./utils";
import { toDisplayName } from "./projectDataUtils";
import { asString } from "./utils";

type Intent = ReturnType<typeof parseProjectEditIntent>;

type UseContractsQueueParams = {
  ownerProject: string;
  normalizedProjects: ProjectRecord[];
  isAddMode: boolean;
  mode: ProjectMode;
  intent: Intent;
  masterData: any;
  SupportedChainKeys: string[];
  walletAddress: string | null | undefined;
  isConnectingWallet: boolean;
  connectWalletFromContext: () => Promise<void>;
  disconnectWalletFromContext: () => void;
  setActiveStep: (step: 1 | 2 | 3 | 4) => void;
};

export type ContractsQueueReturn = {
  // Controllers
  bulkController: ReturnType<typeof useBulkCsvAttestUI>;
  singleController: ReturnType<typeof useSingleAttestUI>;

  // Queue state
  queueError: string | null;
  setQueueError: React.Dispatch<React.SetStateAction<string | null>>;
  queueErrorFromValidation: boolean;
  setQueueErrorFromValidation: React.Dispatch<React.SetStateAction<boolean>>;
  queueSubmitPreview: QueueSubmitPreview | null;
  setQueueSubmitPreview: React.Dispatch<React.SetStateAction<QueueSubmitPreview | null>>;
  isPreparingSubmitPreview: boolean;
  isSubmittingFromPreview: boolean;
  singleSubmitResult: OnchainSubmitResult | null;
  setSingleSubmitResult: React.Dispatch<React.SetStateAction<OnchainSubmitResult | null>>;
  bulkSubmitResult: BulkOnchainSubmitResult | null;
  setBulkSubmitResult: React.Dispatch<React.SetStateAction<BulkOnchainSubmitResult | null>>;
  lastSubmitChainId: string;
  addressEditRow: number | null;
  setAddressEditRow: React.Dispatch<React.SetStateAction<number | null>>;

  // Smart paste
  smartPasteOpen: boolean;
  setSmartPasteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  smartPasteText: string;
  setSmartPasteText: React.Dispatch<React.SetStateAction<string>>;
  isClassifying: boolean;
  classifyError: string | null;
  setClassifyError: React.Dispatch<React.SetStateAction<string | null>>;
  smartPasteChainMode: "auto" | "fixed";
  setSmartPasteChainMode: React.Dispatch<React.SetStateAction<"auto" | "fixed">>;
  smartPasteFixedChain: string;
  setSmartPasteFixedChain: React.Dispatch<React.SetStateAction<string>>;

  // Wallet
  walletError: string | null;
  setWalletError: React.Dispatch<React.SetStateAction<string | null>>;

  // Computed / options
  chainOptions: SearchDropdownOption[];
  chainByEip155: Record<string, { urlKey: string; color: string }>;
  chainIconRenderer: (value: string) => ReactNode;
  ownerProjectIconRenderer: (value: string) => ReactNode;
  usageCategoryIconRenderer: (value: string) => ReactNode;
  usageCategoryOptions: SearchDropdownOption[];
  ownerProjectOptions: SearchDropdownOption[];
  defaultQueueChainId: string;
  meaningfulRows: AttestationRowInput[];
  currentQueueSignature: string;
  isSingleFlow: boolean;
  activeQueueDiagnostics: AttestationDiagnostics;
  queueHasValidationResult: boolean;
  hasCurrentQueueValidation: boolean;
  queueStats: { errors: number; warnings: number; suggestions: number; conversions: number };
  rowErrors: { rowIndex: number; errors: string[] }[];

  // Refs
  csvInputRef: React.RefObject<HTMLInputElement>;

  // Callbacks
  prepareRowForQueue: (row: AttestationRowInput) => AttestationRowInput;
  mergeRowsIntoQueue: (rows: AttestationRowInput[]) => void;
  importCsvFile: (file: File) => Promise<void>;
  classifySmartPaste: () => Promise<void>;
  onCsvInputChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  runQueueValidation: () => Promise<{ flow: "single" | "bulk"; rows: AttestationRowInput[] } | null>;
  validateQueue: () => Promise<void>;
  prepareQueueSubmitPreview: () => Promise<void>;
  confirmQueueSubmit: () => Promise<void>;
  addQueueRow: () => void;
  removeQueueRow: (rowIndex: number) => void;
  setQueueCellValue: (rowIndex: number, field: QueueEditableField, value: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getQueueRowErrorMessages: (rowIndex: number) => string[];
};

export function useContractsQueue({
  ownerProject,
  normalizedProjects,
  isAddMode,
  mode,
  intent,
  masterData,
  SupportedChainKeys,
  walletAddress,
  isConnectingWallet,
  connectWalletFromContext,
  disconnectWalletFromContext,
  setActiveStep,
}: UseContractsQueueParams): ContractsQueueReturn {
  const csvInputRef = useRef<HTMLInputElement>(null!);
  const importedContractSeedRef = useRef(false);
  const prevOwnerProjectRef = useRef("");
  const lastSyncedSingleRowSignatureRef = useRef("");

  // Queue error state
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueErrorFromValidation, setQueueErrorFromValidation] = useState(false);
  const [queueSubmitPreview, setQueueSubmitPreview] = useState<QueueSubmitPreview | null>(null);
  const [isPreparingSubmitPreview, setIsPreparingSubmitPreview] = useState(false);
  const [isSubmittingFromPreview, setIsSubmittingFromPreview] = useState(false);
  const [shouldAutoValidateAfterImport, setShouldAutoValidateAfterImport] = useState(false);
  const [lastValidatedQueueSignature, setLastValidatedQueueSignature] = useState("");
  const [lastValidatedQueueFlow, setLastValidatedQueueFlow] = useState<"single" | "bulk" | null>(null);
  const [lastValidatedSingleRowIndex, setLastValidatedSingleRowIndex] = useState<number | null>(null);
  const [singleSubmitResult, setSingleSubmitResult] = useState<OnchainSubmitResult | null>(null);
  const [bulkSubmitResult, setBulkSubmitResult] = useState<BulkOnchainSubmitResult | null>(null);
  const [lastSubmitChainId, setLastSubmitChainId] = useState("");
  const [addressEditRow, setAddressEditRow] = useState<number | null>(null);

  // Smart paste state
  const [smartPasteOpen, setSmartPasteOpen] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [smartPasteChainMode, setSmartPasteChainMode] = useState<"auto" | "fixed">("auto");
  const [smartPasteFixedChain, setSmartPasteFixedChain] = useState("");

  // Wallet state
  const [walletError, setWalletError] = useState<string | null>(null);

  // ── Chain options ─────────────────────────────────────────────────────────

  const chainOptions = useMemo<SearchDropdownOption[]>(() => {
    if (!masterData) return [];
    const uniqueOptions = new Map<string, SearchDropdownOption>();
    for (const [chainKey, chain] of Object.entries(masterData.chains)) {
      if (!SupportedChainKeys.includes(chainKey)) continue;
      const chainIdRaw = (chain as { evm_chain_id?: unknown }).evm_chain_id;
      const chainId =
        typeof chainIdRaw === "number" || typeof chainIdRaw === "string"
          ? String(chainIdRaw).trim()
          : "";
      if (!chainId || chainId === "null" || chainId === "undefined") continue;
      const value = `eip155:${chainId}`;
      if (!uniqueOptions.has(value)) {
        uniqueOptions.set(value, { value, label: (chain as { name: string }).name });
      }
    }
    // Add Starknet (non-EVM, hardcoded)
    uniqueOptions.set("starknet:SN_MAIN", { value: "starknet:SN_MAIN", label: "Starknet" });
    return Array.from(uniqueOptions.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [SupportedChainKeys, masterData]);

  const chainByEip155 = useMemo(() => {
    if (!masterData) return {} as Record<string, { urlKey: string; color: string }>;
    const map: Record<string, { urlKey: string; color: string }> = {};
    for (const [, chain] of Object.entries(masterData.chains)) {
      const c = chain as { evm_chain_id?: unknown; url_key?: string; colors?: { dark?: string[] } };
      const chainId = c.evm_chain_id != null ? String(c.evm_chain_id).trim() : "";
      if (!chainId || chainId === "null") continue;
      map[`eip155:${chainId}`] = {
        urlKey: c.url_key || "",
        color: c.colors?.dark?.[0] ?? "#CDD8D3",
      };
    }
    // Add Starknet (non-EVM, hardcoded)
    map["starknet:SN_MAIN"] = { urlKey: "starknet", color: "#EC796B" };
    return map;
  }, [masterData]);

  const chainIconRenderer = useCallback(
    (value: string): ReactNode => {
      const info = chainByEip155[value];
      if (!info?.urlKey) return null;
      return (
        <Icon
          icon={`gtp:${info.urlKey}-logo-monochrome`}
          className="size-[15px] shrink-0"
          style={{ color: info.color }}
        />
      );
    },
    [chainByEip155],
  );

  const ownerProjectIconRenderer = useCallback(
    (value: string): ReactNode => {
      if (!value) {
        return <Icon icon="feather:unlink" className="size-[13px] text-color-text-secondary" />;
      }
      return <ApplicationIcon owner_project={value} size="sm" />;
    },
    [],
  );

  const usageCategoryOptions = useMemo<SearchDropdownOption[]>(() => {
    if (!masterData?.blockspace_categories?.sub_categories) return [];
    return Object.entries(masterData.blockspace_categories.sub_categories)
      .map(([categoryKey, categoryLabel]) => ({
        value: categoryKey,
        label: categoryLabel as string,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [masterData]);

  const subToMainCategory = useMemo(() => {
    if (!masterData?.blockspace_categories?.mapping) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const [mainKey, subKeys] of Object.entries(masterData.blockspace_categories.mapping)) {
      for (const subKey of (subKeys as string[])) {
        map[subKey] = mainKey;
      }
    }
    return map;
  }, [masterData]);

  const USAGE_MAIN_ICONS: Record<string, string> = {
    defi: "gtp-defi",
    finance: "gtp-defi",
    nft: "gtp-nft",
    token_transfers: "gtp-tokentransfers",
    utility: "gtp-utilities",
    social: "gtp-socials",
    cefi: "gtp-cefi",
    cross_chain: "gtp-crosschain",
    collectibles: "gtp-nft",
    unlabeled: "gtp-unlabeled",
  };

  const usageCategoryIconRenderer = useCallback(
    (value: string): ReactNode => {
      if (!value) return null;
      const mainCat = subToMainCategory[value] ?? value;
      const iconName = USAGE_MAIN_ICONS[mainCat];
      if (!iconName) return null;
      return (
        <Icon
          icon={`gtp:${iconName}-monochrome`}
          className="size-[15px] shrink-0 text-color-text-secondary"
        />
      );
    },
    [subToMainCategory],
  );

  const ownerProjectOptions = useMemo<SearchDropdownOption[]>(
    () => {
      const projectOptions = normalizedProjects
        .map((project) => ({
          value: asString(project.owner_project),
          label: toDisplayName(project),
        }))
        .filter((option) => option.value)
        .sort((a, b) => a.label.localeCompare(b.label));
      return [NO_OWNER_PROJECT_OPTION, ...projectOptions];
    },
    [normalizedProjects],
  );

  const defaultQueueChainId = useMemo(() => {
    const baseOption = chainOptions.find((option) => option.value === "eip155:8453");
    if (baseOption) return baseOption.value;
    return chainOptions[0]?.value || "eip155:8453";
  }, [chainOptions]);

  // ── Attest controllers ────────────────────────────────────────────────────

  const attestClient = useMemo(
    () => new AttestClient({ fetchProjects: async () => normalizedProjects }),
    [normalizedProjects],
  );

  const singleController = useSingleAttestUI(attestClient, {
    mode: "simpleProfile",
    initialRow: {
      chain_id: defaultQueueChainId,
      owner_project: ownerProject.trim(),
    },
    validationOptions: { projects: normalizedProjects },
  });

  const bulkController = useBulkCsvAttestUI(attestClient, {
    mode: "simpleProfile",
    initialRows: [{ chain_id: defaultQueueChainId, owner_project: ownerProject.trim() }],
    initialColumns: QUEUE_EDITABLE_FIELDS,
    allowedFields: QUEUE_EDITABLE_FIELDS,
    validationOptions: { projects: normalizedProjects, maxRows: MAX_QUEUE_ROWS },
  });

  // ── Row helpers ───────────────────────────────────────────────────────────

  const prepareRowForQueue = useCallback(
    (row: AttestationRowInput): AttestationRowInput => ({
      ...row,
      chain_id: toStringValue(row.chain_id).trim() || defaultQueueChainId,
      address: toStringValue(row.address).trim().toLowerCase(),
      contract_name: toStringValue(row.contract_name).trim(),
      owner_project: toStringValue(row.owner_project).trim(),
      usage_category: toStringValue(row.usage_category).trim(),
    }),
    [defaultQueueChainId],
  );

  const meaningfulRows = useMemo(
    () =>
      bulkController.queue.rows
        .filter((row) => hasMeaningfulRowData(row))
        .map((row) => prepareRowForQueue(row)),
    [bulkController.queue.rows, prepareRowForQueue],
  );

  const currentQueueSignature = useMemo(
    () => `${bulkController.queue.rows.length}:${meaningfulRows.map(rowPreviewSignature).join("||")}`,
    [meaningfulRows, bulkController.queue.rows.length],
  );

  const isSingleFlow = meaningfulRows.length <= 1;

  const getSingleFlowRowIndex = useCallback(
    (row: AttestationRowInput): number => {
      const targetSignature = rowPreviewSignature(prepareRowForQueue(row));
      const sourceRowIndex = bulkController.queue.rows.findIndex(
        (candidateRow) =>
          rowPreviewSignature(prepareRowForQueue(candidateRow)) === targetSignature,
      );
      return sourceRowIndex >= 0 ? sourceRowIndex : 0;
    },
    [bulkController.queue.rows, prepareRowForQueue],
  );

  // ── Sync single-flow row to singleController ──────────────────────────────

  const singleRowSyncTarget = useMemo(() => {
    if (!isSingleFlow) return null;
    const fallbackRow: AttestationRowInput = {
      chain_id: defaultQueueChainId,
      owner_project: ownerProject.trim(),
    };
    const row = meaningfulRows[0] || bulkController.queue.rows[0] || fallbackRow;
    return prepareRowForQueue(row);
  }, [bulkController.queue.rows, defaultQueueChainId, ownerProject, isSingleFlow, meaningfulRows, prepareRowForQueue]);

  useEffect(() => {
    if (!singleRowSyncTarget) {
      lastSyncedSingleRowSignatureRef.current = "";
      return;
    }
    const nextSignature = rowPreviewSignature(singleRowSyncTarget);
    if (lastSyncedSingleRowSignatureRef.current === nextSignature) return;
    lastSyncedSingleRowSignatureRef.current = nextSignature;
    singleController.setRow(singleRowSyncTarget);
  }, [singleController, singleRowSyncTarget]);

  // ── Invalidate preview/validation when queue changes ─────────────────────

  useEffect(() => {
    if (!queueSubmitPreview) return;
    if (queueSubmitPreview.rowsSignature === currentQueueSignature) return;
    setQueueSubmitPreview(null);
  }, [currentQueueSignature, queueSubmitPreview]);

  useEffect(() => {
    if (!lastValidatedQueueFlow) return;
    if (lastValidatedQueueSignature === currentQueueSignature) return;
    setLastValidatedQueueFlow(null);
    setLastValidatedQueueSignature("");
    setLastValidatedSingleRowIndex(null);
  }, [currentQueueSignature, lastValidatedQueueFlow, lastValidatedQueueSignature]);

  // ── Patch queue rows when owner project changes ───────────────────────────

  useEffect(() => {
    const newOwner = ownerProject.trim();
    const prevOwner = prevOwnerProjectRef.current;
    prevOwnerProjectRef.current = newOwner;
    if (!newOwner || newOwner === prevOwner) return;
    const rows = bulkController.queue.rows;
    if (rows.length === 0) return;
    let didPatch = false;
    const nextRows = rows.map((row) => {
      const currentOwner = toStringValue(row.owner_project).trim();
      if (currentOwner === "" || currentOwner === prevOwner) {
        didPatch = true;
        return { ...row, owner_project: newOwner };
      }
      return row;
    });
    if (!didPatch) return;
    bulkController.queue.setRows(nextRows);
  }, [ownerProject, bulkController.queue]);

  // ── Seed import (from application page) ──────────────────────────────────

  useEffect(() => {
    if (importedContractSeedRef.current) return;
    if (mode !== "edit" || intent.source !== "application-page") return;
    const seed = readProjectEditContractSeed();
    if (!seed) return;
    const isStale = Date.now() - seed.created_at > 15 * 60 * 1000;
    const expectedOwner = (intent.project || ownerProject).trim().toLowerCase();
    const seedOwner = seed.owner_project.trim().toLowerCase();
    if (isStale || (expectedOwner && seedOwner && expectedOwner !== seedOwner)) {
      clearProjectEditContractSeed();
      importedContractSeedRef.current = true;
      return;
    }
    const seededRows = seed.rows
      .map((row) =>
        prepareRowForQueue({
          chain_id: toStringValue(row.chain_id).trim(),
          address: toStringValue(row.address).trim(),
          contract_name: toStringValue(row.contract_name).trim(),
          owner_project: toStringValue(row.owner_project).trim() || ownerProject.trim(),
          usage_category: toStringValue(row.usage_category).trim(),
        }),
      )
      .filter((row) => hasMeaningfulRowData(row))
      .slice(0, MAX_QUEUE_ROWS);
    clearProjectEditContractSeed();
    importedContractSeedRef.current = true;
    if (seededRows.length === 0) return;
    bulkController.queue.setRows(seededRows);
    setQueueError(null);
    setQueueErrorFromValidation(false);
    setQueueSubmitPreview(null);
    setSingleSubmitResult(null);
    setBulkSubmitResult(null);
    setLastSubmitChainId("");
    setLastValidatedQueueFlow(null);
    setLastValidatedQueueSignature("");
    setLastValidatedSingleRowIndex(null);
    setShouldAutoValidateAfterImport(true);
    setActiveStep(2);
  }, [mode, intent.source, intent.project, ownerProject, prepareRowForQueue, bulkController.queue, setActiveStep]);

  // ── Queue operations ──────────────────────────────────────────────────────

  const mergeRowsIntoQueue = useCallback(
    (rows: AttestationRowInput[]) => {
      const incomingHaveAddresses = rows.some((r) => toStringValue(r.address).trim());
      const defaultOwner = ownerProject.trim();
      const byRowKey = new Map<string, AttestationRowInput>();

      const pushRow = (raw: AttestationRowInput, applyDefaultOwner: boolean) => {
        const normalized = prepareRowForQueue(raw);
        const row =
          applyDefaultOwner && !toStringValue(normalized.owner_project).trim() && defaultOwner
            ? { ...normalized, owner_project: defaultOwner }
            : normalized;
        if (!hasMeaningfulRowData(row)) return;
        const rowKey = getQueueRowKey(
          toStringValue(row.chain_id).trim(),
          toStringValue(row.address).trim().toLowerCase(),
          toStringValue(row.owner_project).trim(),
        );
        if (!byRowKey.has(rowKey)) byRowKey.set(rowKey, row);
      };

      meaningfulRows.forEach((row) => {
        if (incomingHaveAddresses && !toStringValue(row.address).trim()) return;
        pushRow(row, false);
      });
      rows.forEach((row) => pushRow(row, true));

      const merged = Array.from(byRowKey.values()).slice(0, MAX_QUEUE_ROWS);
      bulkController.queue.setRows(
        merged.length > 0
          ? merged
          : [prepareRowForQueue({ chain_id: defaultQueueChainId, owner_project: ownerProject.trim() })],
      );
    },
    [bulkController, defaultQueueChainId, ownerProject, meaningfulRows, prepareRowForQueue],
  );

  const importCsvFile = useCallback(
    async (file: File) => {
      const csvText = await file.text();
      setQueueError(null);
      setQueueErrorFromValidation(false);
      setQueueSubmitPreview(null);
      setSingleSubmitResult(null);
      setBulkSubmitResult(null);
      try {
        const parsed = await bulkController.csv.parse(csvText, {
          projects: normalizedProjects,
          allowedFields: QUEUE_EDITABLE_FIELDS,
        });
        mergeRowsIntoQueue(parsed.rows);
        setShouldAutoValidateAfterImport(true);
      } catch (error: any) {
        setQueueError(error?.message || "CSV parsing failed.");
        setQueueErrorFromValidation(false);
      }
    },
    [bulkController, mergeRowsIntoQueue, normalizedProjects],
  );

  const classifySmartPaste = useCallback(async () => {
    const text = smartPasteText.trim();
    if (!text) return;
    setIsClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch("/api/labels/classify-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          project: ownerProject || "",
          chain_id:
            smartPasteChainMode === "fixed" && smartPasteFixedChain
              ? smartPasteFixedChain
              : defaultQueueChainId,
          auto_detect_chain: smartPasteChainMode === "auto",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Classification failed.");
      const rows = (data.rows ?? []) as AttestationRowInput[];
      if (rows.length === 0) {
        setClassifyError("No contract addresses found in the pasted text.");
        return;
      }
      mergeRowsIntoQueue(rows);
      setSmartPasteText("");
      setSmartPasteOpen(false);
    } catch (error: any) {
      setClassifyError(error?.message || "Classification failed.");
    } finally {
      setIsClassifying(false);
    }
  }, [smartPasteText, ownerProject, mergeRowsIntoQueue, smartPasteChainMode, smartPasteFixedChain, defaultQueueChainId]);

  const onCsvInputChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importCsvFile(file);
    event.target.value = "";
  }, [importCsvFile]);

  // ── Validation ────────────────────────────────────────────────────────────

  const hasCurrentQueueValidation =
    Boolean(lastValidatedQueueFlow) && lastValidatedQueueSignature === currentQueueSignature;

  const runQueueValidation = useCallback(
    async (): Promise<{ flow: "single" | "bulk"; rows: AttestationRowInput[] } | null> => {
      try {
        const projectsForValidation =
          isAddMode && ownerProject.trim()
            ? [...normalizedProjects, { owner_project: ownerProject.trim() } as ProjectRecord]
            : normalizedProjects;

        if (isSingleFlow) {
          const row = meaningfulRows[0] || bulkController.queue.rows[0];
          if (!row) {
            setQueueError("Add at least one row before validating.");
            setQueueErrorFromValidation(true);
            setLastValidatedQueueFlow(null);
            setLastValidatedQueueSignature("");
            setLastValidatedSingleRowIndex(null);
            return null;
          }
          const normalizedRow = prepareRowForQueue(row);
          const sourceRowIndex = getSingleFlowRowIndex(normalizedRow);
          singleController.setRow(normalizedRow);
          const result = await singleController.validation.run({ projects: projectsForValidation });
          setLastValidatedQueueFlow("single");
          setLastValidatedQueueSignature(currentQueueSignature);
          setLastValidatedSingleRowIndex(sourceRowIndex);
          if (!result.valid) {
            const message = result.diagnostics.errors[0]?.message || "Single row validation failed.";
            setQueueError(message);
            setQueueErrorFromValidation(true);
            return null;
          }
          setQueueError(null);
          setQueueErrorFromValidation(false);
          return { flow: "single", rows: [result.row] };
        }

        const bulkResult = await bulkController.validation.run({
          projects: projectsForValidation,
          maxRows: MAX_QUEUE_ROWS,
        });
        setLastValidatedQueueFlow("bulk");
        setLastValidatedQueueSignature(currentQueueSignature);
        setLastValidatedSingleRowIndex(null);
        if (!bulkResult.valid) {
          const message = bulkResult.diagnostics.errors[0]?.message || "Bulk validation failed.";
          setQueueError(message);
          setQueueErrorFromValidation(true);
          return null;
        }
        setQueueError(null);
        setQueueErrorFromValidation(false);
        return { flow: "bulk", rows: bulkResult.validRows };
      } catch (error: any) {
        setQueueError(error?.message || "Validation failed.");
        setQueueErrorFromValidation(true);
        setLastValidatedQueueFlow(null);
        setLastValidatedQueueSignature("");
        setLastValidatedSingleRowIndex(null);
        return null;
      }
    },
    [
      isAddMode,
      ownerProject,
      isSingleFlow,
      meaningfulRows,
      bulkController,
      singleController,
      prepareRowForQueue,
      normalizedProjects,
      currentQueueSignature,
      getSingleFlowRowIndex,
    ],
  );

  const validateQueue = useCallback(async () => {
    await runQueueValidation();
  }, [runQueueValidation]);

  useEffect(() => {
    if (!shouldAutoValidateAfterImport) return;
    let cancelled = false;
    const validateAfterImport = async () => {
      await runQueueValidation();
      if (!cancelled) setShouldAutoValidateAfterImport(false);
    };
    void validateAfterImport();
    return () => { cancelled = true; };
  }, [runQueueValidation, shouldAutoValidateAfterImport]);

  // ── Diagnostics ───────────────────────────────────────────────────────────

  const activeQueueDiagnostics = useMemo<AttestationDiagnostics>(() => {
    if (!hasCurrentQueueValidation) return EMPTY_QUEUE_DIAGNOSTICS;
    if (lastValidatedQueueFlow === "single") {
      return singleController.validation.result?.diagnostics ?? EMPTY_QUEUE_DIAGNOSTICS;
    }
    return bulkController.diagnostics.all;
  }, [hasCurrentQueueValidation, lastValidatedQueueFlow, singleController.validation.result, bulkController.diagnostics.all]);

  const queueHasValidationResult = useMemo(
    () =>
      hasCurrentQueueValidation &&
      (lastValidatedQueueFlow === "single"
        ? Boolean(singleController.validation.result)
        : Boolean(bulkController.validation.result)),
    [hasCurrentQueueValidation, lastValidatedQueueFlow, singleController.validation.result, bulkController.validation.result],
  );

  const getQueueRowErrorMessages = useCallback(
    (rowIndex: number): string[] => {
      if (!hasCurrentQueueValidation) return [];
      if (lastValidatedQueueFlow === "single") {
        if (rowIndex !== lastValidatedSingleRowIndex) return [];
        return (
          singleController.validation.result?.diagnostics.errors
            .map((diagnostic) => diagnostic.message)
            .filter(Boolean) ?? []
        );
      }
      return bulkController.diagnostics
        .getRow(rowIndex)
        .errors
        .map((diagnostic) => diagnostic.message)
        .filter(Boolean);
    },
    [hasCurrentQueueValidation, lastValidatedQueueFlow, lastValidatedSingleRowIndex, singleController.validation.result, bulkController],
  );

  const queueStats = useMemo(() => {
    const diagnostics = activeQueueDiagnostics;
    return {
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      suggestions: diagnostics.suggestions.length,
      conversions: diagnostics.conversions.length,
    };
  }, [activeQueueDiagnostics]);

  const rowErrors = useMemo(
    () =>
      bulkController.queue.rows
        .map((_row, i) => ({
          rowIndex: i,
          errors: getQueueRowErrorMessages(i),
        }))
        .filter((x) => x.errors.length > 0 && hasMeaningfulRowData(bulkController.queue.rows[x.rowIndex])),
    [bulkController.queue.rows, getQueueRowErrorMessages],
  );

  // ── Wallet ────────────────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setWalletError(null);
    try {
      await connectWalletFromContext();
    } catch (error: any) {
      setWalletError(error?.message || "Wallet connection failed.");
    }
  }, [connectWalletFromContext]);

  const disconnectWallet = useCallback(() => {
    disconnectWalletFromContext();
  }, [disconnectWalletFromContext]);

  const buildWalletAdapter = useCallback(() => {
    if (!walletAddress) throw new Error("Connect wallet before submitting attestations.");
    if (!(window as any).ethereum?.request) throw new Error("Injected wallet provider not found.");
    const ethereum = (window as any).ethereum;
    const primaryWallet = {
      address: walletAddress,
      connector: { name: "Injected" },
      switchNetwork: async (chainId: number) => {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      },
      getWalletClient: async () => {
        const chainIdHex = await ethereum.request({ method: "eth_chainId" }) as string;
        const chainId = parseInt(chainIdHex, 16);
        const chain = defineChain({
          id: chainId,
          name: `Chain ${chainId}`,
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [] } },
        });
        return createWalletClient({
          account: walletAddress as `0x${string}`,
          transport: custom(ethereum),
          chain,
        }) as any;
      },
    };
    return createDynamicWalletAdapter(primaryWallet);
  }, [walletAddress]);

  // ── Submit preview / confirm ──────────────────────────────────────────────

  const prepareQueueSubmitPreview = useCallback(async () => {
    setQueueSubmitPreview(null);
    setSingleSubmitResult(null);
    setBulkSubmitResult(null);
    setLastSubmitChainId("");
    if (!walletAddress) {
      setWalletError("Connect wallet before submitting attestations.");
      return;
    }
    setIsPreparingSubmitPreview(true);
    try {
      const validation = await runQueueValidation();
      if (!validation) return;
      const preparedRows = await Promise.all(
        validation.rows.map((row) =>
          attestClient.prepareSingleAttestation(row, {
            mode: "simpleProfile",
            projects: normalizedProjects,
            validate: false,
          }),
        ),
      );
      if (preparedRows.length === 0) {
        setWalletError("No valid rows available for transaction preview.");
        return;
      }
      setQueueSubmitPreview({
        flow: validation.flow,
        preparedRows,
        rowsSignature: validation.rows.map(rowPreviewSignature).join("||"),
      });
    } catch (error: any) {
      setWalletError(error?.message || "Could not prepare transaction preview.");
    } finally {
      setIsPreparingSubmitPreview(false);
    }
  }, [walletAddress, runQueueValidation, attestClient, normalizedProjects]);

  const confirmQueueSubmit = useCallback(async () => {
    if (!queueSubmitPreview) return;
    setWalletError(null);
    let walletAdapter: ReturnType<typeof createDynamicWalletAdapter>;
    try {
      walletAdapter = buildWalletAdapter();
    } catch (error: any) {
      setWalletError(error?.message || "Could not build wallet adapter.");
      return;
    }
    setIsSubmittingFromPreview(true);
    try {
      setLastSubmitChainId(queueSubmitPreview.preparedRows[0]?.chainId ?? "");
      if (queueSubmitPreview.flow === "single") {
        const result = await attestClient.submitSingleOnchain(
          queueSubmitPreview.preparedRows[0],
          walletAdapter,
        );
        setSingleSubmitResult(result);
      } else {
        const result = await attestClient.submitBulkOnchain(
          queueSubmitPreview.preparedRows,
          walletAdapter,
        );
        setBulkSubmitResult(result);
      }
      setQueueSubmitPreview(null);
    } catch (error: any) {
      setWalletError(error?.message || "Attestation submission failed.");
    } finally {
      setIsSubmittingFromPreview(false);
    }
  }, [attestClient, buildWalletAdapter, queueSubmitPreview]);

  // ── Row CRUD ──────────────────────────────────────────────────────────────

  const addQueueRow = useCallback(() => {
    const firstRowChainId = toStringValue(bulkController.queue.rows[0]?.chain_id).trim() || defaultQueueChainId;
    const row = prepareRowForQueue({
      chain_id: firstRowChainId,
      owner_project: ownerProject.trim(),
    });
    bulkController.queue.addRow(row);
  }, [bulkController, defaultQueueChainId, ownerProject, prepareRowForQueue]);

  const removeQueueRow = useCallback(
    (rowIndex: number) => {
      bulkController.queue.removeRow(rowIndex);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  const setQueueCellValue = useCallback(
    (rowIndex: number, field: QueueEditableField, value: string) => {
      bulkController.queue.setCell(rowIndex, field, value);
      setQueueError(null);
      setQueueErrorFromValidation(false);
      setQueueSubmitPreview(null);
    },
    [bulkController],
  );

  return {
    bulkController,
    singleController,
    queueError,
    setQueueError,
    queueErrorFromValidation,
    setQueueErrorFromValidation,
    queueSubmitPreview,
    setQueueSubmitPreview,
    isPreparingSubmitPreview,
    isSubmittingFromPreview,
    singleSubmitResult,
    setSingleSubmitResult,
    bulkSubmitResult,
    setBulkSubmitResult,
    lastSubmitChainId,
    addressEditRow,
    setAddressEditRow,
    smartPasteOpen,
    setSmartPasteOpen,
    smartPasteText,
    setSmartPasteText,
    isClassifying,
    classifyError,
    setClassifyError,
    smartPasteChainMode,
    setSmartPasteChainMode,
    smartPasteFixedChain,
    setSmartPasteFixedChain,
    walletError,
    setWalletError,
    chainOptions,
    chainByEip155,
    chainIconRenderer,
    ownerProjectIconRenderer,
    usageCategoryIconRenderer,
    usageCategoryOptions,
    ownerProjectOptions,
    defaultQueueChainId,
    meaningfulRows,
    currentQueueSignature,
    isSingleFlow,
    activeQueueDiagnostics,
    queueHasValidationResult,
    hasCurrentQueueValidation,
    queueStats,
    rowErrors,
    csvInputRef,
    prepareRowForQueue,
    mergeRowsIntoQueue,
    importCsvFile,
    classifySmartPaste,
    onCsvInputChange,
    runQueueValidation,
    validateQueue,
    prepareQueueSubmitPreview,
    confirmQueueSubmit,
    addQueueRow,
    removeQueueRow,
    setQueueCellValue,
    connectWallet,
    disconnectWallet,
    getQueueRowErrorMessages,
  };
}
