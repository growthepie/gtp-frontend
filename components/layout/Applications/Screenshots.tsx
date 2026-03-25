"use client"
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import { Icon } from "@iconify/react";

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
    const stripRef = useRef<HTMLDivElement>(null);

    const isExpanded = selectedIndex !== null;

    const handleThumbClick = useCallback((index: number) => {
      setSelectedIndex(index);
      setLastActiveIndex(index);
    }, []);

    const handleClose = useCallback(() => {
      setSelectedIndex(null);
    }, []);

    const handleNavigate = useCallback((direction: 1 | -1) => {
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        const next = (prev + direction + screenshots.length) % screenshots.length;
        setLastActiveIndex(next);
        return next;
      });
    }, [screenshots.length]);

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

    // Ensure the last viewed thumbnail stays in view when closing
    useEffect(() => {
      if (!isExpanded && stripRef.current) {
        const thumbs = stripRef.current.children;
        if (thumbs[lastActiveIndex]) {
          thumbs[lastActiveIndex].scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }
    }, [isExpanded, lastActiveIndex]);

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
      <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none">

        {/* Header */}
        <div
          className="flex items-center gap-x-[10px] cursor-pointer w-fit mb-3"
          onClick={() => setOpen((v) => !v)}
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

        {/* Collapsible Gallery Body */}
        <div
          className="transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-top relative w-full overflow-hidden rounded-[16px]"
          style={{
            height: open ? (isExpanded ? "75vh" : "187px") : "0px",
            maxHeight: open ? (isExpanded ? "900px" : "187px") : "0px",
            opacity: open ? 1 : 0,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Strip (Flex container morphs layout based on selectedIndex) */}
          <div
            ref={stripRef}
            className={`flex w-full h-full items-center ${noScrollbar} ${
              isExpanded ? "overflow-hidden" : "overflow-x-auto snap-x snap-mandatory"
            }`}
          >
            {screenshots.map((shot, i) => {
              const imageUrl = getAppScrapeAssetUrl(owner_project, shot.page_id, "screenshot.webp");
              const title = shot.title?.trim() || `Screenshot ${i + 1}`;
              const isActive = selectedIndex === i;

              return (
                <div
                  key={shot.page_id}
                  onClick={() => !isActive && handleThumbClick(i)}
                  className={`group relative shrink-0 h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${
                    isExpanded
                      ? isActive
                        ? "w-full mr-0 opacity-100 rounded-[16px] bg-[#0A0A0A] shadow-inner"
                        : "w-0 mr-0 opacity-0 scale-95 pointer-events-none"
                      : "min-w-[360px] md:w-[360px] mr-[14px] opacity-100 rounded-[14px] snap-center cursor-pointer hover:-translate-y-1 bg-color-bg-medium ring-1 ring-black/5"
                  }`}
                >
                  {/* Layer 1: Thumbnail View (Crossfades out when active) */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? "opacity-0" : "opacity-100"}`}>
                    <img
                      src={imageUrl}
                      alt={title}
                      sizes="(max-width: 768px) 80vw, 25vw"
                      className="object-cover object-top transition-all duration-[6000ms] ease-in-out group-hover:object-bottom scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
                    <div className="absolute bottom-0 inset-x-0 p-[14px] translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="truncate text-[13px] font-semibold text-white drop-shadow-md">
                        {title}
                      </div>
                    </div>
                  </div>

                  {/* Layer 2: Expanded Scrollable View (Crossfades in when active) */}
                  <div className={`absolute inset-0 overflow-y-auto w-full h-full ${noScrollbar} transition-opacity duration-500 delay-100 ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
                    <div className="mx-auto w-full max-w-[1200px] min-h-full flex flex-col pb-[100px]">
                      <img
                        src={imageUrl}
                        alt={title}
                        width={1600}
                        height={3200}
                        sizes="100vw"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlay Controls (Fades in over the active image) */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              isExpanded ? "opacity-100 z-20" : "opacity-0 z-0"
            }`}
          >
            {/* Bottom Bar */}
            <div className="absolute bottom-0 inset-x-0 flex items-start justify-between p-[15px] pt-[45px] bg-gradient-to-t from-black to-transparent">
              <div className="pointer-events-none flex flex-col gap-1 max-w-[70%]">
                <Link className={`flex gap-x-[5px] items-center ${isExpanded ? "pointer-events-auto" : "pointer-events-none"}`} href={screenshots[selectedIndex ?? 0]?.url || "#"} target="_blank" rel="noopener noreferrer">
                  <div className="heading-sm text-white drop-shadow-lg truncate">
                    {screenshots[selectedIndex ?? 0]?.title?.trim() || `Screenshot ${(selectedIndex ?? 0) + 1}`}
                  </div>
                    <GTPIcon icon={"feather:external-link" as GTPIconName} size="sm"  />
                </Link>
                <div className="text-sm text-white/80 line-clamp-2 drop-shadow-md min-h-[50px]">
                  {screenshots[selectedIndex ?? 0]?.caption}
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
              </div>
            </div>
            <button
              onClick={handleClose}
              className="pointer-events-auto absolute top-[15px] right-[15px] inline-flex size-[36px] items-center justify-center rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all shadow-lg"
            >
              <GTPIcon icon={"gtp-close-monochrome"} size="sm" />
            </button>

            {/* Side Navigation Arrows */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={() => handleNavigate(-1)}
                  className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 inline-flex size-[44px] items-center justify-center rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-105 shadow-xl"
                >
                  <Icon icon="feather:chevron-left" className="size-[22px]" />
                </button>
                <button
                  onClick={() => handleNavigate(1)}
                  className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 inline-flex size-[44px] items-center justify-center rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-105 shadow-xl"
                >
                  <Icon icon="feather:chevron-right" className="size-[22px]" />
                </button>
              </>
            )}

            {/* Floating Mini-Nav (Bottom) */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
                <div className="pointer-events-auto flex gap-[8px] p-[8px] rounded-[16px] bg-black/50 backdrop-blur-lg border border-white/10 shadow-2xl overflow-x-auto max-w-[90%] md:max-w-[70%] noScrollbar">
                  {screenshots.map((shot, i) => (
                    <button
                      key={shot.page_id + "-mini"}
                      onClick={() => handleThumbClick(i)}
                      className={`relative shrink-0 w-[45px] h-[30px] rounded-[8px] overflow-hidden transition-all duration-300 ${
                        selectedIndex === i
                          ? "ring-2 ring-white scale-105 opacity-100"
                          : "opacity-50 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img
                        src={getAppScrapeAssetUrl(owner_project, shot.page_id, "thumb.webp")}
                        alt=""
                        className="object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  },
);
ScreenshotsSection.displayName = "ScreenshotsSection";

export default ScreenshotsSection;
