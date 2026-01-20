import { EmblaCarouselType } from "embla-carousel";

export type PaginationType = "dots" | "progress" | "none";

export type CarouselBreakpoint = {
  slidesPerView: number;
  gap?: number;
  centered?: boolean;
};

export type CarouselBreakpoints = {
  [width: number]: CarouselBreakpoint;
};

export type SidebarAwareBreakpoints = {
  sidebarOpen: CarouselBreakpoints;
  sidebarClosed: CarouselBreakpoints;
};

/**
 * Responsive minSlideWidth configuration.
 * Can be a simple number or an object mapping viewport widths to values.
 * 
 * @example
 * // Simple: always 280px
 * minSlideWidth={280}
 * 
 * @example
 * // Responsive: 280px default, 350px at 1280px+
 * minSlideWidth={{ 0: 280, 1280: 350 }}
 */
export type ResponsiveMinSlideWidth = number | { [breakpoint: number]: number };

export type CarouselProps = {
  /** Unique identifier for accessibility */
  ariaId?: string;
  /** Carousel content */
  children: React.ReactNode;
  /** Height class for the carousel container (e.g., "h-[145px] md:h-[183px]") */
  heightClass?: string;
  /** Pagination style */
  pagination?: PaginationType;
  /** Show navigation arrows */
  arrows?: boolean;
  /** Enable focus mode with opacity/scale transitions */
  focusMode?: boolean;
  /** Focus mode inactive slide opacity (default: 0.4) */
  focusOpacity?: number;
  /** Focus mode inactive slide scale (default: 0.92) */
  focusScale?: number;
  /** Gap between slides in pixels (default: 15) */
  gap?: number;
  /** 
   * Minimum slide width in pixels. When specified, the carousel will 
   * automatically calculate how many slides fit based on container width.
   * Can be a number or responsive object mapping breakpoints to values.
   * This takes precedence over breakpoints.
   */
  minSlideWidth?: ResponsiveMinSlideWidth;
  /**
   * Maximum slides to show at once (only used with minSlideWidth)
   */
  maxSlidesPerView?: number;
  /** Responsive breakpoints (ignored if minSlideWidth is set) */
  breakpoints?: CarouselBreakpoints;
  /** Enable sidebar-aware breakpoints */
  sidebarAware?: boolean;
  /** Custom sidebar-aware breakpoints override */
  sidebarBreakpoints?: SidebarAwareBreakpoints;
  /** Horizontal padding - responsive (mobile/desktop) */
  padding?: { mobile: number; desktop: number };
  /** Enable looping */
  loop?: boolean;
  /** Enable drag/swipe */
  draggable?: boolean;
  /** Auto-hide controls when content fits without scrolling */
  autoHideControls?: boolean;
  /** Alignment of slides */
  align?: "start" | "center" | "end";
  /** Additional className for wrapper */
  className?: string;
  /** Add right padding on md+ screens (used for landing page layout) */
  desktopRightPadding?: boolean;
  /** Bottom offset for pagination dots (default: -15) */
  bottomOffset?: number;
  /** Callback when slide changes */
  onSlideChange?: (index: number) => void;
  /** Callback when carousel is ready */
  onInit?: (api: EmblaCarouselType) => void;
};

export type UseCarouselOptions = {
  breakpoints?: CarouselBreakpoints;
  sidebarAware?: boolean;
  sidebarBreakpoints?: SidebarAwareBreakpoints;
  loop?: boolean;
  draggable?: boolean;
  align?: "start" | "center" | "end";
  gap?: number;
  onSlideChange?: (index: number) => void;
  onInit?: (api: EmblaCarouselType) => void;
};

export type UseCarouselReturn = {
  emblaRef: (node: HTMLElement | null) => void;
  emblaApi: EmblaCarouselType | undefined;
  selectedIndex: number;
  scrollSnaps: number[];
  canScrollPrev: boolean;
  canScrollNext: boolean;
  hasOverflow: boolean;
  slidesInView: number[];
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  progress: number;
  isReady: boolean;
};