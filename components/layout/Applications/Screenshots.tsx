"use client"
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useCarousel } from "@/hooks/useCarousel";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";

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

// Hides scrollbars while keeping content natively scrollable
const noScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const ScreenshotsSection = memo(
  ({
    owner_project,
    screenshots,
  }: {
    owner_project: string;
    screenshots: ApplicationEnrichmentScreenshot[];
  }) => {
    const [open, setOpen] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [lastActiveIndex, setLastActiveIndex] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isExpanded = selectedIndex !== null;

    const {
      emblaRef,
      isScrolling,
    } = useCarousel({
      draggable: !isExpanded,
      align: "start",
      gap: 14,
    });

    const handleThumbClick = useCallback((index: number) => {
      setSelectedIndex(index);
      setLastActiveIndex(index);
      // Scroll card to top of viewport, then lock body scroll after it arrives
      const el = containerRef.current;
      if (el) {
        const offset = window.innerWidth >= 768 ? 100 : 15;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setTimeout(() => {
        document.body.style.overflow = "hidden";
      }, 550);
    }, []);

    const handleClose = useCallback(() => {
      setSelectedIndex(null);
      document.body.style.overflow = "";
    }, []);

    const handleNavigate = useCallback((direction: 1 | -1) => {
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        const next = (prev + direction + screenshots.length) % screenshots.length;
        setLastActiveIndex(next);
        return next;
      });
    }, [screenshots.length]);

    // Cleanup body scroll lock on unmount
    useEffect(() => {
      return () => { document.body.style.overflow = ""; };
    }, []);

    // Raise #content-panel above FloatingPortal badges (z-100) while expanded.
    // The sidebar NewBadge renders via FloatingPortal at the body level at z-100.
    // content-panel sits at z-10 in the root stacking context, so its entire
    // subtree (including our backdrop) always paints below those portals.
    // Temporarily bumping content-panel to z-150 makes it win at the root level.
    useEffect(() => {
      const panel = document.getElementById("content-panel");
      if (!panel) return;
      if (isExpanded) {
        panel.style.zIndex = "150";
      } else {
        panel.style.zIndex = "";
      }
      return () => {
        panel.style.zIndex = "";
      };
    }, [isExpanded]);

    // Keyboard navigation
    useEffect(() => {
      if (!isExpanded) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose();
        if (e.key === "ArrowLeft") handleNavigate(-1);
        if (e.key === "ArrowRight") handleNavigate(1);
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [isExpanded, handleClose, handleNavigate]);


    // Touch swipe for expanded view
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    }, []);
    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (touchStartX.current === null || !isExpanded) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) {
          handleNavigate(dx > 0 ? -1 : 1);
        }
        touchStartX.current = null;
      },
      [isExpanded, handleNavigate],
    );

    if (!screenshots.length) return null;

    return (
      <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
          style={{ zIndex: 120 }}
          onClick={handleClose}
        />
      )}
      <div
        ref={containerRef}
        className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none"
        style={{
          position: "relative",
          zIndex: isExpanded ? 130 : "auto",
          transition: "z-index 0s",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-x-[10px] cursor-pointer w-fit "
          onClick={() => isExpanded ? handleClose() : setOpen((v) => !v)}
        >
          <GTPIcon
            icon="in-button-right-monochrome"
            size="sm"
            className="!size-[14px]"
            containerClassName={`!size-[26px] !flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-transform duration-300 ${
              open ? "rotate-90" : "rotate-0"
            }`}
          />
          <div className="heading-large-md text-color-text-secondary">
            Screenshots
          </div>
        </div>

        {/* Gallery body — thumbnails when collapsed, scrollable image when expanded */}
        <div
          className="origin-top relative w-full overflow-hidden rounded-[16px] "
          style={{
            height: !open ? "0px" : isExpanded ? "calc(100vh - 200px)" : "187px",
            opacity: open ? 1 : 0,
            transition: "height 0.5s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease",
            marginTop: open ? "10px" : "0px",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Thumbnail carousel layer */}
          <div
            className="absolute inset-0"
            style={{
              opacity: isExpanded ? 0 : 1,
              pointerEvents: isExpanded ? "none" : "auto",
              transition: "opacity 0.3s ease",
            }}
          >
            <div
              ref={emblaRef}
              className="w-full h-full select-none overflow-hidden"
            >
              <div className="flex h-full max-w-[1440px] mx-auto" style={{ gap: 14 }}>
                {screenshots.map((shot, i) => {
                  const imageUrl = getAppScrapeAssetUrl(owner_project, shot.page_id, "screenshot.webp");
                  const title = shot.title?.trim() || `Screenshot ${i + 1}`;
                  const isHero = i === 0;

                  return (
                    <div
                      key={shot.page_id}
                      onClick={() => !isScrolling && handleThumbClick(i)}
                      className={`group relative h-full overflow-hidden rounded-[14px] cursor-pointer bg-color-bg-medium ${isHero ? "min-w-[480px]" : "min-w-[320px]"}`}
                      style={{ flex: isHero ? "1.5 0 0%" : "1 0 0%" }}
                    >
                      <img
                        src={imageUrl}
                        alt={title}
                        sizes="(max-width: 768px) 80vw, 25vw"
                        className="w-full h-full object-cover object-top opacity-0 transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.transition = "opacity 0.4s ease-in, transform 0.3s ease-out";
                          img.style.opacity = "1";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute bottom-0 inset-x-0 p-[14px] translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none">
                        <div className="truncate text-[13px] font-semibold text-white drop-shadow-md">
                          {title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expanded view layer */}
          <div
            className={`absolute inset-0 overflow-y-auto bg-black/70 rounded-[16px] ${noScrollbar}`}
            style={{
              opacity: isExpanded ? 1 : 0,
              pointerEvents: isExpanded ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
          >
            {selectedIndex !== null && (
              <div className="mx-auto w-full max-w-[1440px] min-h-full flex flex-col pb-[60px]">
                <img
                  src={getAppScrapeAssetUrl(owner_project, screenshots[selectedIndex].page_id, "screenshot.webp")}
                  alt={screenshots[selectedIndex].title?.trim() || `Screenshot ${selectedIndex + 1}`}
                  width={1600}
                  height={3200}
                  sizes="100vw"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>

          {/* Floating controls (only when expanded) */}
          {isExpanded && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Close button — top right */}
            <button
              onClick={handleClose}
              className="pointer-events-auto absolute top-[10px] right-[10px] inline-flex size-[32px] items-center justify-center rounded-full bg-black/30 backdrop-blur-[10px] backdrop-saturate-150 border border-white/10 hover:bg-black/50 transition-colors"
            >
              <GTPIcon icon={"gtp-close-monochrome"} size="sm" className="!size-[14px]" />
            </button>

            {/* Nav arrows — left/right edges */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={() => handleNavigate(-1)}
                  className="pointer-events-auto absolute left-[10px] top-1/2 -translate-y-1/2 inline-flex size-[32px] items-center justify-center rounded-full bg-black/30 backdrop-blur-[10px] backdrop-saturate-150 border border-white/10 hover:bg-black/50 transition-colors"
                >
                  <GTPIcon icon={"gtp-chevronleft-monochrome" as GTPIconName} size="sm" className="!size-[14px]" />
                </button>
                <button
                  onClick={() => handleNavigate(1)}
                  className="pointer-events-auto absolute right-[10px] top-1/2 -translate-y-1/2 inline-flex size-[32px] items-center justify-center rounded-full bg-black/30 backdrop-blur-[10px] backdrop-saturate-150 border border-white/10 hover:bg-black/50 transition-colors"
                >
                  <GTPIcon icon={"gtp-chevronright-monochrome" as GTPIconName} size="sm" className="!size-[14px]" />
                </button>
              </>
            )}

            {/* Bottom bar: info left, paging right */}
            <div className="absolute bottom-[10px] inset-x-[10px] pointer-events-auto flex items-end justify-between gap-[10px]">
              {/* Title + caption + link */}
              <div className="flex flex-col gap-[2px] rounded-[12px] bg-black/30 backdrop-blur-[10px] backdrop-saturate-150 border border-white/10 px-[12px] py-[8px] min-w-0">
                <Link className="flex gap-x-[5px] items-center" href={screenshots[selectedIndex ?? 0]?.url || "#"} target="_blank" rel="noopener noreferrer">
                  <span className="heading-small-xxs text-white/90 truncate">
                    {screenshots[selectedIndex ?? 0]?.title?.trim() || `Screenshot ${(selectedIndex ?? 0) + 1}`}
                  </span>
                  <GTPIcon icon={"feather:external-link" as GTPIconName} size="sm" className="!size-[10px] shrink-0 text-white/50" />
                </Link>
                {screenshots[selectedIndex ?? 0]?.caption && (
                  <span className="text-xxs text-white/50 line-clamp-2">
                    {screenshots[selectedIndex ?? 0]?.caption}
                  </span>
                )}
              </div>

              {/* Page dots */}
              {screenshots.length > 1 && (
                <div className="flex items-center gap-[6px] rounded-full bg-black/30 backdrop-blur-[10px] backdrop-saturate-150 border border-white/10 px-[10px] py-[8px] shrink-0">
                  {screenshots.map((shot, i) => (
                    <button
                      key={shot.page_id + "-dot"}
                      onClick={() => handleThumbClick(i)}
                      className={`shrink-0 rounded-full transition-all duration-200 ${
                        selectedIndex === i
                          ? "w-[18px] h-[6px] bg-white/90"
                          : "w-[6px] h-[6px] bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
      </>
    );
  },
);
ScreenshotsSection.displayName = "ScreenshotsSection";

export default ScreenshotsSection;
