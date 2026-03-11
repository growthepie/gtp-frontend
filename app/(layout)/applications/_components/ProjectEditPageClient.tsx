"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { useMaster } from "@/contexts/MasterContext";
import { useUIContext } from "@/contexts/UIContext";
import {
  getProjectEditIntentKey,
  parseProjectEditIntent,
} from "@/lib/project-edit-intent";
import { useWalletConnection } from "@/contexts/WalletContext";
import type { ProjectRecord } from "@openlabels/oli-sdk";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useProjectEditForm } from "./_edit/useProjectEditForm";
import { useContractsQueue } from "./_edit/useContractsQueue";
import { ProjectDetailsStep } from "./_edit/ProjectDetailsStep";
import { ContractsStep } from "./_edit/ContractsStep";
import { EditSidebar } from "./_edit/EditSidebar";

export default function ProjectEditPageClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: masterData, SupportedChainKeys } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const intent = useMemo(
    () =>
      parseProjectEditIntent({
        pathname: pathname || undefined,
        params: searchParams,
        defaultSource: "legacy",
      }),
    [pathname, searchParams],
  );
  const intentKey = useMemo(() => getProjectEditIntentKey(intent), [intent]);

  const setProjectEditMode = useUIContext((state) => state.setProjectEditMode);
  const setSearchBarCaptureActive = useUIContext((state) => state.setSearchBarCaptureActive);

  useEffect(() => {
    setProjectEditMode(true);
    return () => {
      setProjectEditMode(false);
      setSearchBarCaptureActive(false);
    };
  }, [setProjectEditMode, setSearchBarCaptureActive]);

  const {
    walletAddress,
    isConnectingWallet,
    connectWallet: connectWalletFromContext,
    disconnectWallet: disconnectWalletFromContext,
  } = useWalletConnection();

  const initialActiveStep = useMemo<0 | 1 | 2 | 3 | 4>(() => {
    if (intent.mode === "add") {
      return 0;
    }
    if (intent.start === "contracts") {
      return 2;
    }
    return 1;
  }, [intent.mode, intent.start]);

  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3 | 4>(
    initialActiveStep,
  );
  const [hoveredTab, setHoveredTab] = useState<"find" | "add" | null>(null);
  const [editSearchCaptureActive, setEditSearchCaptureActive] = useState(false);
  const [sidebarOffsetTop, setSidebarOffsetTop] = useState(0);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const mainColumnRef = useRef<HTMLDivElement | null>(null);
  const projectDetailsCardRef = useRef<HTMLDivElement | null>(null);
  const contractsCardRef = useRef<HTMLDivElement | null>(null);
  const walletCardRef = useRef<HTMLDivElement | null>(null);
  const reviewCardRef = useRef<HTMLDivElement | null>(null);
  const projectDetailsHeaderRef = useRef<HTMLButtonElement | null>(null);
  const contractsHeaderRef = useRef<HTMLButtonElement | null>(null);
  const walletHeaderRef = useRef<HTMLButtonElement | null>(null);
  const reviewHeaderRef = useRef<HTMLButtonElement | null>(null);
  const hasHandledInitialStepScrollRef = useRef(false);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const sidebarMeasureFrameRef = useRef<number | null>(null);
  const scrollSettleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form hook ──────────────────────────────────────────────────────────────

  const formHook = useProjectEditForm({
    intent,
    intentKey,
    searchParams,
    ownerProjectToProjectData,
  });

  const {
    form,
    setForm,
    logoUpload,
    localMode,
    isAddMode,
    contributionResult,
    normalizedProjects,
    collapsedLogoSrc,
    validationErrors,
    hasBlockingErrors,
    canSubmitContribution,
    hasFormChangedSinceSubmission,
    formSuggestions,
    ownerProjectSuggestions,
    displayNameSuggestions,
    websiteSuggestions,
    githubSuggestions,
    allProjectMatches,
    activeDropdownField,
    setActiveDropdownField,
    fileInputRef,
    updateField,
    updateAdditionalUrlField,
    addAdditionalUrlField,
    removeAdditionalUrlField,
    fillFormFromProject,
    onLogoChange,
    runProfiler,
    isProfiling,
    profilerError,
    profilerInfo,
    enhanceDescription,
    isEnhancingDesc,
    enhanceDescError,
    enhanceDescInfo,
    submitError,
    isSubmittingContribution,
    projectsError,
  } = formHook;

  // submitProjectContribution needs setActiveStep — wrap it
  const submitProjectContribution = async () => {
    await formHook.submitProjectContribution(setActiveStep);
  };

  const clearProjectEditSearchMode = useCallback(() => {
    if (typeof window === "undefined") return;
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete("search_mode");
    const nextQuery = decodeURIComponent(nextParams.toString());
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  // Restore global search bar project selection
  useEffect(() => {
    const resolveProject = (ownerProject?: string) => {
      if (!ownerProject) return;
      const appsProject = ownerProjectToProjectData[ownerProject] as ProjectRecord | undefined;
      return (
        appsProject ??
        (formHook.normalizedProjects.find(
          (p) => String(p.owner_project).toLowerCase() === ownerProject.toLowerCase(),
        ) as ProjectRecord | undefined)
      );
    };

    const handleSelectProject = (e: Event) => {
      const ownerProject = (e as CustomEvent<{ ownerProject: string }>).detail?.ownerProject;
      const project = resolveProject(ownerProject);
      if (!project) return;
      fillFormFromProject(project);
      setEditSearchCaptureActive(false);
      setActiveStep(1);
      clearProjectEditSearchMode();
    };

    const handleSelectProjectContracts = (e: Event) => {
      const ownerProject = (e as CustomEvent<{ ownerProject: string }>).detail?.ownerProject;
      const project = resolveProject(ownerProject);
      if (!project) return;
      fillFormFromProject(project);
      setEditSearchCaptureActive(false);
      setActiveStep(2);
      clearProjectEditSearchMode();
    };
    window.addEventListener("projectEditSelectProject", handleSelectProject);
    window.addEventListener("projectEditSelectProjectContracts", handleSelectProjectContracts);
    return () => {
      window.removeEventListener("projectEditSelectProject", handleSelectProject);
      window.removeEventListener("projectEditSelectProjectContracts", handleSelectProjectContracts);
    };
  }, [clearProjectEditSearchMode, fillFormFromProject, ownerProjectToProjectData, formHook.normalizedProjects]);

  // ── Queue hook ─────────────────────────────────────────────────────────────

  const queueHook = useContractsQueue({
    ownerProject: form.owner_project,
    normalizedProjects,
    isAddMode,
    mode: intent.mode,
    intent,
    masterData,
    SupportedChainKeys: SupportedChainKeys ?? [],
    walletAddress,
    isConnectingWallet,
    connectWalletFromContext,
    disconnectWalletFromContext,
    setActiveStep,
  });

  // ── Survey → Airtable ──────────────────────────────────────────────────────

  const handleSurveySubmit = useCallback(
    (data: { teamSize: string; goal: string; metric: string; other: string }) => {
      fetch("/api/labels/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          projectName: form.display_name || form.owner_project,
          walletAddress: walletAddress ?? "",
        }),
      })
        .then((res) => res.json().then((json) => {
          if (!res.ok) console.error("[survey] error", res.status, json);
        }))
        .catch((err) => console.error("[survey] fetch failed:", err));
    },
    [form.display_name, form.owner_project, walletAddress],
  );

  // ── Tabs: switchToAdd / switchToFind ───────────────────────────────────────

  const switchToAdd = () => {
    formHook.switchToAdd();
    setEditSearchCaptureActive(false);
    setActiveStep(0);
    clearProjectEditSearchMode();
  };

  const switchToFind = () => {
    formHook.switchToFind();
    setEditSearchCaptureActive(true);
    setActiveStep(0);

    if (typeof window !== "undefined") {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("search");
      nextParams.set("search_mode", "edit");
      nextParams.delete("query");
      const nextQuery = decodeURIComponent(nextParams.toString());
      const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
      window.history.replaceState(null, "", nextUrl);
      window.dispatchEvent(new CustomEvent("focusSearchInput"));
    }
  };

  // Handle "Add manually" from global search bar
  useEffect(() => {
    const handler = (e: Event) => {
      const { field, value } = (e as CustomEvent<{ field: string; value: string }>).detail ?? {};
      if (!field || !value) return;
      formHook.switchToAdd();
      setEditSearchCaptureActive(false);
      setActiveStep(1);
      clearProjectEditSearchMode();
      updateField(field as keyof typeof form, value as any);
    };
    window.addEventListener("projectEditAddManually", handler);
    return () => window.removeEventListener("projectEditAddManually", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle "AI Profile" from global search bar
  useEffect(() => {
    const handler = (e: Event) => {
      const { website } = (e as CustomEvent<{ website: string }>).detail ?? {};
      if (!website) return;
      formHook.switchToAdd();
      setEditSearchCaptureActive(false);
      setActiveStep(1);
      clearProjectEditSearchMode();
      updateField("website", website);
      runProfiler(website);
    };
    window.addEventListener("projectEditAiProfile", handler);
    return () => window.removeEventListener("projectEditAiProfile", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearProjectEditSearchMode]);

  // ── Manage capture when in add-mode step 0 (without URL-driven focus mode) ──
  useEffect(() => {
    const capture = (isAddMode && activeStep === 0) || editSearchCaptureActive;
    setSearchBarCaptureActive(capture);

    // Disable legacy `search=true` focus mode on the add flow.
    if (isAddMode) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("search") === "true") {
        url.searchParams.delete("search");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, [isAddMode, activeStep, editSearchCaptureActive, setSearchBarCaptureActive]);

  const isMetadataSubmitted = Boolean(contributionResult);

  // collapsed logo for tab display
  const collapsedLogoPathFromData = ownerProjectToProjectData[form.owner_project.trim()]?.logo_path;
  const tabLogoSrc =
    logoUpload?.previewUrl ||
    (collapsedLogoPathFromData
      ? `https://api.growthepie.com/v1/apps/logos/${collapsedLogoPathFromData}`
      : "");

  const scrollStepIntoView = useCallback((step: 0 | 1 | 2 | 3 | 4) => {
    const target =
      step === 0
        ? tabsRef.current
        : step === 1
        ? projectDetailsCardRef.current
        : step === 2
        ? contractsCardRef.current
        : step === 3
        ? walletCardRef.current
        : reviewCardRef.current;

    if (!target || typeof window === "undefined") {
      return;
    }

    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
    }

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    scrollAnimationFrameRef.current = window.requestAnimationFrame(() => {
      scrollAnimationFrameRef.current = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const scrollRoot = document.scrollingElement ?? document.documentElement;
        const maxScrollTop = Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
        const centeredTop = window.scrollY + rect.top - Math.max(0, (window.innerHeight - rect.height) / 2);

        window.scrollTo({
          top: Math.min(Math.max(centeredTop, 0), maxScrollTop),
          behavior,
        });

        scrollAnimationFrameRef.current = null;
      });
    });
  }, [clearProjectEditSearchMode]);

  useEffect(() => {
    if (!hasHandledInitialStepScrollRef.current) {
      hasHandledInitialStepScrollRef.current = true;
      return;
    }

    scrollStepIntoView(activeStep);
    if (scrollSettleTimeoutRef.current !== null) {
      clearTimeout(scrollSettleTimeoutRef.current);
    }
    scrollSettleTimeoutRef.current = setTimeout(() => {
      scrollStepIntoView(activeStep);
      scrollSettleTimeoutRef.current = null;
    }, 220);
  }, [activeStep, scrollStepIntoView]);

  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
      if (sidebarMeasureFrameRef.current !== null) {
        cancelAnimationFrame(sidebarMeasureFrameRef.current);
      }
      if (scrollSettleTimeoutRef.current !== null) {
        clearTimeout(scrollSettleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const measureSidebarOffset = () => {
      const mainColumn = mainColumnRef.current;
      const target =
        activeStep === 1
          ? projectDetailsHeaderRef.current
          : activeStep === 2
          ? contractsHeaderRef.current
          : activeStep === 3
          ? walletHeaderRef.current
          : activeStep === 4
          ? reviewHeaderRef.current
          : null;

      if (!mainColumn || !target || typeof window === "undefined" || window.innerWidth < 1280) {
        setSidebarOffsetTop(0);
        return;
      }

      const mainRect = mainColumn.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setSidebarOffsetTop(Math.max(0, Math.round(targetRect.top - mainRect.top)));
    };

    const scheduleSidebarMeasurement = () => {
      if (sidebarMeasureFrameRef.current !== null) {
        cancelAnimationFrame(sidebarMeasureFrameRef.current);
      }

      sidebarMeasureFrameRef.current = window.requestAnimationFrame(() => {
        measureSidebarOffset();
        sidebarMeasureFrameRef.current = null;
      });
    };

    scheduleSidebarMeasurement();
    window.addEventListener("resize", scheduleSidebarMeasurement);

    const resizeObserver = new ResizeObserver(() => {
      scheduleSidebarMeasurement();
    });

    if (mainColumnRef.current) resizeObserver.observe(mainColumnRef.current);
    if (projectDetailsHeaderRef.current) resizeObserver.observe(projectDetailsHeaderRef.current);
    if (contractsHeaderRef.current) resizeObserver.observe(contractsHeaderRef.current);
    if (walletHeaderRef.current) resizeObserver.observe(walletHeaderRef.current);
    if (reviewHeaderRef.current) resizeObserver.observe(reviewHeaderRef.current);

    return () => {
      window.removeEventListener("resize", scheduleSidebarMeasurement);
      resizeObserver.disconnect();
      if (sidebarMeasureFrameRef.current !== null) {
        cancelAnimationFrame(sidebarMeasureFrameRef.current);
        sidebarMeasureFrameRef.current = null;
      }
    };
  }, [activeStep]);

  return (
    <Container className="pt-[30px] md:pt-[30px] pb-[60px] px-[16px] md:px-[32px]">
      <div className="w-full">
        <div className="flex w-full flex-col gap-y-[16px]">

          {/* ── Tabs: Find existing / Add new ── */}
          <div ref={tabsRef} className="w-full h-[46px] relative flex gap-[5px] items-center overflow-y-hidden">
            {/* Find existing tab */}
            <div
              className={`relative transition-all duration-300 flex items-center justify-between rounded-full cursor-pointer flex-1
                ${!isAddMode
                  ? "bg-color-ui-active border-2 border-color-bg-medium h-[46px] heading-large-sm md:heading-large-md"
                  : "border-2 bg-color-bg-medium h-[38px] border-color-bg-medium hover:bg-color-ui-hover hover:h-[42px]"}
                ${hoveredTab === "find" || !isAddMode ? "pl-[10px] pr-[35px]" : "px-[10px]"}`}
              style={{ zIndex: !isAddMode ? 100 : hoveredTab === "find" ? 110 : 10 }}
              onClick={switchToFind}
              onMouseEnter={() => setHoveredTab("find")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <div className="flex items-center justify-center h-full gap-x-[15px]">
                {tabLogoSrc && !isAddMode ? (
                  <div className="relative size-[36px] shrink-0 overflow-hidden rounded-[4px] border border-color-ui-shadow/60">
                    <Image src={tabLogoSrc} alt={form.display_name || "Project"} fill sizes="36px" unoptimized className="object-cover" />
                  </div>
                ) : (
                  <GTPIcon
                    icon={(!isAddMode ? "gtp-project" : "gtp-project-monochrome") as any}
                    className={`transition-all duration-300 ${!isAddMode ? "!size-[28px]" : "lg:!size-[24px]"}`}
                  />
                )}
                <div className="transition-all duration-300 overflow-hidden whitespace-nowrap">
                  {!isAddMode && form.display_name ? form.display_name : "Edit existing project"}
                </div>
              </div>
            </div>

            {/* Add new tab */}
            <div
              className={`relative transition-all duration-300 flex items-center justify-between rounded-full cursor-pointer flex-1
                ${isAddMode
                  ? "bg-color-ui-active border-2 border-color-bg-medium h-[46px] heading-large-sm md:heading-large-md"
                  : "border-2 bg-color-bg-medium h-[38px] border-color-bg-medium hover:bg-color-ui-hover hover:h-[42px]"}
                ${hoveredTab === "add" || isAddMode ? "pl-[10px] pr-[35px]" : "px-[10px]"}`}
              style={{ zIndex: isAddMode ? 100 : hoveredTab === "add" ? 110 : 20 }}
              onClick={switchToAdd}
              onMouseEnter={() => setHoveredTab("add")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <div className="flex items-center justify-center h-full gap-x-[15px]">
                <GTPIcon
                  icon={(isAddMode ? "gtp-plus" : "gtp-plus-monochrome") as any}
                  className={`transition-all duration-300 ${isAddMode ? "!size-[28px]" : "lg:!size-[24px]"}`}
                />
                <div className="transition-all duration-300 overflow-hidden whitespace-nowrap">
                  Add new project
                </div>
              </div>
            </div>
          </div>

          {/* ── Main layout grid ── */}
          <div className="grid grid-cols-1 gap-x-[8px] gap-y-[8px] xl:grid-cols-[minmax(0,1fr)_300px]">

            {/* Main column */}
            <div ref={mainColumnRef} className="flex flex-col gap-y-[8px]">

              <ProjectDetailsStep
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                cardRef={projectDetailsCardRef}
                headerRef={projectDetailsHeaderRef}
                form={form}
                setForm={setForm}
                logoUpload={logoUpload}
                collapsedLogoSrc={collapsedLogoSrc}
                isAddMode={isAddMode}
                ownerProjectToProjectData={ownerProjectToProjectData}
                fileInputRef={fileInputRef}
                onLogoChange={onLogoChange}
                updateField={updateField}
                updateAdditionalUrlField={updateAdditionalUrlField}
                addAdditionalUrlField={addAdditionalUrlField}
                removeAdditionalUrlField={removeAdditionalUrlField}
                fillFormFromProject={fillFormFromProject}
                activeDropdownField={activeDropdownField}
                setActiveDropdownField={setActiveDropdownField}
                ownerProjectSuggestions={ownerProjectSuggestions}
                displayNameSuggestions={displayNameSuggestions}
                websiteSuggestions={websiteSuggestions}
                githubSuggestions={githubSuggestions}
                validationErrors={validationErrors}
                isProfiling={isProfiling}
                profilerError={profilerError}
                profilerInfo={profilerInfo}
                runProfiler={runProfiler}
                isEnhancingDesc={isEnhancingDesc}
                enhanceDescError={enhanceDescError}
                enhanceDescInfo={enhanceDescInfo}
                enhanceDescription={enhanceDescription}
                allProjectMatches={allProjectMatches}
                submitError={submitError}
                contributionResult={contributionResult}
                hasFormChangedSinceSubmission={hasFormChangedSinceSubmission}
                canSubmitContribution={canSubmitContribution}
                isSubmittingContribution={isSubmittingContribution}
                submitProjectContribution={submitProjectContribution}
              />

              <ContractsStep
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                step2CardRef={contractsCardRef}
                step3CardRef={walletCardRef}
                step4CardRef={reviewCardRef}
                step2HeaderRef={contractsHeaderRef}
                step3HeaderRef={walletHeaderRef}
                step4HeaderRef={reviewHeaderRef}
                bulkController={queueHook.bulkController}
                singleController={queueHook.singleController}
                meaningfulRows={queueHook.meaningfulRows}
                isAddMode={isAddMode}
                ownerProject={form.owner_project}
                normalizedProjects={normalizedProjects}
                chainOptions={queueHook.chainOptions}
                ownerProjectOptions={queueHook.ownerProjectOptions}
                usageCategoryOptions={queueHook.usageCategoryOptions}
                defaultQueueChainId={queueHook.defaultQueueChainId}
                chainIconRenderer={queueHook.chainIconRenderer}
                usageCategoryIconRenderer={queueHook.usageCategoryIconRenderer}
                setQueueCellValue={queueHook.setQueueCellValue}
                addQueueRow={queueHook.addQueueRow}
                removeQueueRow={queueHook.removeQueueRow}
                addressEditRow={queueHook.addressEditRow}
                setAddressEditRow={queueHook.setAddressEditRow}
                getQueueRowErrorMessages={queueHook.getQueueRowErrorMessages}
                csvInputRef={queueHook.csvInputRef}
                onCsvInputChange={queueHook.onCsvInputChange}
                smartPasteOpen={queueHook.smartPasteOpen}
                setSmartPasteOpen={queueHook.setSmartPasteOpen}
                smartPasteText={queueHook.smartPasteText}
                setSmartPasteText={queueHook.setSmartPasteText}
                isClassifying={queueHook.isClassifying}
                classifyError={queueHook.classifyError}
                smartPasteChainMode={queueHook.smartPasteChainMode}
                setSmartPasteChainMode={queueHook.setSmartPasteChainMode}
                smartPasteFixedChain={queueHook.smartPasteFixedChain}
                setSmartPasteFixedChain={queueHook.setSmartPasteFixedChain}
                classifySmartPaste={queueHook.classifySmartPaste}
                setClassifyError={queueHook.setClassifyError}
                validateQueue={queueHook.validateQueue}
                queueError={queueHook.queueError}
                queueHasValidationResult={queueHook.queueHasValidationResult}
                queueStats={queueHook.queueStats}
                walletAddress={walletAddress}
                isConnectingWallet={isConnectingWallet}
                walletError={queueHook.walletError}
                connectWallet={queueHook.connectWallet}
                disconnectWallet={queueHook.disconnectWallet}
                queueSubmitPreview={queueHook.queueSubmitPreview}
                setQueueSubmitPreview={queueHook.setQueueSubmitPreview}
                isPreparingSubmitPreview={queueHook.isPreparingSubmitPreview}
                isSubmittingFromPreview={queueHook.isSubmittingFromPreview}
                prepareQueueSubmitPreview={queueHook.prepareQueueSubmitPreview}
                confirmQueueSubmit={queueHook.confirmQueueSubmit}
                submitError={submitError}
                singleSubmitResult={queueHook.singleSubmitResult}
                bulkSubmitResult={queueHook.bulkSubmitResult}
                lastSubmitChainId={queueHook.lastSubmitChainId}
                onSurveySubmit={handleSurveySubmit}
              />
            </div>

            {/* Sidebar */}
            <EditSidebar
              activeStep={activeStep}
              isMetadataSubmitted={isMetadataSubmitted}
              localMode={localMode}
              ownerProject={form.owner_project}
              hasBlockingErrors={hasBlockingErrors}
              formSuggestions={formSuggestions}
              meaningfulRowsCount={queueHook.meaningfulRows.length}
              rowErrorsCount={queueHook.rowErrors.length}
              queueStats={queueHook.queueStats}
              queueHasValidationResult={queueHook.queueHasValidationResult}
              projectsError={projectsError}
              activeStepOffsetTop={sidebarOffsetTop}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
