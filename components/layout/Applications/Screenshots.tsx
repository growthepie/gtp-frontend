"use client"
import { memo, useState, useCallback, useEffect } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Image from "next/image";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { GrayOverlay } from "@/components/layout/Backgrounds";

type ApplicationEnrichmentScreenshot = {
    alt_text: string | null;
    caption: string | null;
    page_id: string;
    priority: number | null;
    title: string | null;
    url: string | null;
};

function getAppScrapeAssetUrl(
    ownerProject: string,
    pageId: string,
    filename: string,
  ) {
    return `https://api.growthepie.com/v1/apps/scrape/${ownerProject}/${pageId}/${filename}`;
}

const ScreenshotsSection = memo(({
    owner_project,
    screenshots,
  }: {
    owner_project: string;
    screenshots: ApplicationEnrichmentScreenshot[];
  }) => {
    const [open, setOpen] = useState(true);
    const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  
    if (!screenshots.length) {
      return null;
    }
  
    return (
      <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none">
        {/* Header: toggle + "Screenshots" */}
        <div
          className="flex items-center gap-x-[10px] cursor-pointer w-fit"
          onClick={() => setOpen((v) => !v)}
        >
          <GTPIcon
            icon="in-button-right-monochrome"
            size="sm"
            className="!size-[14px]"
            containerClassName={`!size-[26px] !flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-all duration-300 ${
              open ? "rotate-90" : "rotate-0"
            }`}
          />
          <div className="heading-large-md text-color-text-secondary">Screenshots</div>
        </div>
  
        {/* Collapsible body */}
        <div
          style={{
            maxHeight: open ? 380 : 0,
            paddingTop: open ? "12px" : 0,
            overflow: "hidden",
            opacity: open ? 1 : 0,
            transition: "max-height 0.35s ease-in-out, opacity 0.3s ease-in-out, padding-top 0.3s ease-in-out",
          }}
        >
          <div className="flex h-[220px] gap-x-[10px] overflow-x-auto pb-[4px]">
            {screenshots.map((shot, i) => {
              const imageUrl = getAppScrapeAssetUrl(
                owner_project,
                shot.page_id,
                "thumb.webp",
              );
              const title = shot.title?.trim() || `Screenshot ${i + 1}`;
              const caption = shot.caption?.trim();
  
              return (
                <button
                  key={shot.page_id}
                  type="button"
                  onClick={() => setSelectedScreenshotIndex(i)}
                  className="group relative flex min-w-[220px] items-end overflow-hidden rounded-[16px] bg-color-bg-medium text-left transition-all duration-300 hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-[#d4f500]/60"
                  style={{
                    flex: i === 0 ? 2 : 1,
                  }}
                  title={title}
                >
                  <Image
                    src={imageUrl}
                    alt={shot.alt_text?.trim() || title}
                    fill
                    sizes="(max-width: 768px) 80vw, 25vw"
                    className="object-cover [object-position:center_top] scale-[1.01] transform-gpu transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute -inset-[1px] bg-[linear-gradient(180deg,rgba(5,12,11,0.08)_0%,rgba(5,12,11,0.16)_38%,rgba(5,12,11,0.88)_100%)]" />
                  <div className="relative z-[1] w-full px-[12px] py-[12px]">
                    <div className="truncate text-[13px] font-semibold text-white">
                      {title}
                    </div>
                    {caption && (
                      <div className="mt-[2px] line-clamp-2 text-[11px] leading-[1.35] text-white/75">
                        {caption}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <ScreenshotsLightbox
          owner_project={owner_project}
          screenshots={screenshots}
          selectedIndex={selectedScreenshotIndex}
          onClose={() => setSelectedScreenshotIndex(null)}
          onSelect={setSelectedScreenshotIndex}
        />
      </div>
    );
  });
  ScreenshotsSection.displayName = "ScreenshotsSection";


  const ScreenshotsLightbox = memo(({
    owner_project,
    screenshots,
    selectedIndex,
    onClose,
    onSelect,
  }: {
    owner_project: string;
    screenshots: ApplicationEnrichmentScreenshot[];
    selectedIndex: number | null;
    onClose: () => void;
    onSelect: (index: number) => void;
  }) => {
    const selectedScreenshot =
      selectedIndex !== null ? screenshots[selectedIndex] : null;
  
    const selectPrevious = useCallback(() => {
      if (selectedIndex === null) return;
      onSelect((selectedIndex - 1 + screenshots.length) % screenshots.length);
    }, [onSelect, screenshots.length, selectedIndex]);
  
    const selectNext = useCallback(() => {
      if (selectedIndex === null) return;
      onSelect((selectedIndex + 1) % screenshots.length);
    }, [onSelect, screenshots.length, selectedIndex]);
  
    useEffect(() => {
      if (selectedIndex === null) {
        return;
      }
  
      const previousOverflow = document.body.style.overflow;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
        if (event.key === "ArrowLeft") {
          selectPrevious();
        }
        if (event.key === "ArrowRight") {
          selectNext();
        }
      };
  
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
  
      return () => {
        document.body.style.overflow = previousOverflow;
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [onClose, selectNext, selectPrevious, selectedIndex]);
  
    if (!selectedScreenshot || selectedIndex === null) {
      return null;
    }
  
    const imageUrl = getAppScrapeAssetUrl(
      owner_project,
      selectedScreenshot.page_id,
      "screenshot.webp",
    );
    const title =
      selectedScreenshot.title?.trim() || `Screenshot ${selectedIndex + 1}`;
    const caption = selectedScreenshot.caption?.trim();
    const sourceUrl = selectedScreenshot.url?.trim();
  
    return createPortal(
      <>
        <GrayOverlay onClick={onClose} zIndex={1200} />
        <div
          className="fixed inset-0 z-[1201] flex items-center justify-center p-[10px] md:p-[24px]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="relative flex h-full max-h-[calc(100vh-20px)] w-full max-w-[1440px] flex-col overflow-hidden rounded-[24px] bg-color-bg-medium p-[5px] shadow-[0px_0px_50px_0px_#000000]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-[5px]">
              <div className="flex items-center justify-between gap-[10px] rounded-[20px] bg-color-bg-default px-[15px] py-[10px] md:px-[20px]">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-color-text-primary">
                    {title}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-color-text-secondary">
                    {selectedIndex + 1} / {screenshots.length}
                  </div>
                </div>
                <div className="flex items-center gap-[5px]">
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden items-center rounded-full bg-color-bg-medium px-[12px] py-[8px] text-[11px] font-medium text-color-text-primary transition-colors hover:bg-color-ui-hover md:inline-flex"
                    >
                      Visit page
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex size-[36px] items-center justify-center rounded-full bg-color-bg-medium text-color-text-primary transition-colors hover:bg-color-ui-hover"
                    aria-label="Close screenshots viewer"
                  >
                    <Icon icon="feather:x" className="size-[18px]" />
                  </button>
                </div>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-[5px] md:grid-cols-[minmax(0,1fr)_280px]">
                <div className="relative min-h-[320px] overflow-hidden rounded-[20px] bg-color-bg-default">
                  <div className="h-full overflow-auto px-[12px] py-[12px] md:px-[18px] md:py-[18px]">
                    <div className="mx-auto flex min-h-full w-full max-w-[980px] items-start justify-center">
                      <Image
                        src={imageUrl}
                        alt={selectedScreenshot.alt_text?.trim() || title}
                        width={1600}
                        height={2400}
                        sizes="100vw"
                        priority
                        className="h-auto w-full rounded-[16px] bg-color-bg-medium"
                      />
                    </div>
                  </div>
  
                  {screenshots.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={selectPrevious}
                        className="absolute left-[12px] top-1/2 inline-flex size-[42px] -translate-y-1/2 items-center justify-center rounded-full bg-color-bg-medium text-color-text-primary shadow-standard transition-colors hover:bg-color-ui-hover"
                        aria-label="Previous screenshot"
                      >
                        <Icon icon="feather:chevron-left" className="size-[20px]" />
                      </button>
                      <button
                        type="button"
                        onClick={selectNext}
                        className="absolute right-[12px] top-1/2 inline-flex size-[42px] -translate-y-1/2 items-center justify-center rounded-full bg-color-bg-medium text-color-text-primary shadow-standard transition-colors hover:bg-color-ui-hover"
                        aria-label="Next screenshot"
                      >
                        <Icon icon="feather:chevron-right" className="size-[20px]" />
                      </button>
                    </>
                  )}
                </div>
  
                <div className="flex min-h-0 flex-col gap-[5px]">
                  <div className="rounded-[20px] bg-color-bg-default px-[14px] py-[14px] md:px-[16px]">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-color-text-secondary">
                      Screenshot details
                    </div>
                    {caption ? (
                      <div className="mt-[8px] text-[13px] leading-[1.55] text-color-text-primary">
                        {caption}
                      </div>
                    ) : (
                      <div className="mt-[8px] text-[13px] leading-[1.55] text-color-text-secondary">
                        No caption provided for this capture.
                      </div>
                    )}
                  </div>
  
                  <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-[20px] bg-color-bg-default md:overflow-y-auto md:overflow-x-hidden">
                    <div className="flex gap-[10px] p-[12px] md:flex-col md:p-[14px]">
                      {screenshots.map((shot, index) => {
                        const thumbUrl = getAppScrapeAssetUrl(
                          owner_project,
                          shot.page_id,
                          "thumb.webp",
                        );
                        const thumbTitle =
                          shot.title?.trim() || `Screenshot ${index + 1}`;
                        const isActive = selectedIndex === index;
  
                        return (
                          <button
                            key={shot.page_id}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={`group flex min-w-[144px] gap-[10px] rounded-[16px] p-[8px] text-left transition-all ${
                              isActive
                                ? "bg-color-bg-medium shadow-standard"
                                : "bg-color-bg-default hover:bg-color-bg-medium"
                            }`}
                          >
                            <div className="relative h-[74px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-color-bg-medium">
                              <Image
                                src={thumbUrl}
                                alt={shot.alt_text?.trim() || thumbTitle}
                                fill
                                sizes="160px"
                                className="object-cover [object-position:center_top]"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-[12px] font-semibold text-color-text-primary">
                                {thumbTitle}
                              </div>
                              <div className="mt-[4px] text-[10px] uppercase tracking-[0.16em] text-color-text-secondary">
                                {index + 1} / {screenshots.length}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>,
      document.body,
    );
  });
  ScreenshotsLightbox.displayName = "ScreenshotsLightbox";


  export default ScreenshotsSection;