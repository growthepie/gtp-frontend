"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  useEffect(() => {
    setProjectEditMode(true);
    return () => setProjectEditMode(false);
  }, [setProjectEditMode]);

  const {
    walletAddress,
    isConnectingWallet,
    connectWallet: connectWalletFromContext,
    disconnectWallet: disconnectWalletFromContext,
  } = useWalletConnection();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [hoveredTab, setHoveredTab] = useState<"find" | "add" | null>(null);

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

  // Restore global search bar project selection
  useEffect(() => {
    const handler = (e: Event) => {
      const ownerProject = (e as CustomEvent<{ ownerProject: string }>).detail?.ownerProject;
      if (!ownerProject) return;
      // Prefer the apps dataset (has logo_path etc.), fall back to full OSS directory
      const appsProject = ownerProjectToProjectData[ownerProject] as ProjectRecord | undefined;
      const project =
        appsProject ??
        (formHook.normalizedProjects.find(
          (p) => String(p.owner_project).toLowerCase() === ownerProject.toLowerCase(),
        ) as ProjectRecord | undefined);
      if (!project) return;
      fillFormFromProject(project);
      setActiveStep(1);
    };
    window.addEventListener("projectEditSelectProject", handler);
    return () => window.removeEventListener("projectEditSelectProject", handler);
  }, [fillFormFromProject, ownerProjectToProjectData, formHook.normalizedProjects]);

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

  // ── Tabs: switchToAdd / switchToFind ───────────────────────────────────────

  const switchToAdd = () => {
    formHook.switchToAdd();
    setActiveStep(1);
  };

  const switchToFind = () => {
    formHook.switchToFind();
    setActiveStep(1);
  };

  // Handle "Add manually" from global search bar
  useEffect(() => {
    const handler = (e: Event) => {
      const { field, value } = (e as CustomEvent<{ field: string; value: string }>).detail ?? {};
      if (!field || !value) return;
      switchToAdd();
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
      switchToAdd();
      updateField("website", website);
      runProfiler(website);
    };
    window.addEventListener("projectEditAiProfile", handler);
    return () => window.removeEventListener("projectEditAiProfile", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMetadataSubmitted = Boolean(contributionResult);

  // collapsed logo for tab display
  const collapsedLogoPathFromData = ownerProjectToProjectData[form.owner_project.trim()]?.logo_path;
  const tabLogoSrc =
    logoUpload?.previewUrl ||
    (collapsedLogoPathFromData
      ? `https://api.growthepie.com/v1/apps/logos/${collapsedLogoPathFromData}`
      : "");

  return (
    <Container className="pt-[30px] md:pt-[30px] pb-[60px] px-[16px] md:px-[32px]">
      <div className="w-full">
        <div className="flex w-full flex-col gap-y-[16px]">

          {/* ── Tabs: Find existing / Add new ── */}
          <div className="w-full h-[46px] relative flex gap-[5px] items-center overflow-y-hidden">
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
            <div className="flex flex-col gap-y-[8px]">
              <ProjectDetailsStep
                activeStep={activeStep}
                setActiveStep={setActiveStep}
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
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
