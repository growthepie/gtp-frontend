// Shared layout classNames for quick-bite content blocks.
//
// Container queries (@container + @[Xpx]:) are used so the breakpoint responds
// to the actual content width — independent of sidenav state — instead of the
// viewport. Tweak the threshold here and every quick-bite that uses these
// constants picks it up.

export const QB_SIDE_BY_SIDE_CHARTS =
  "flex flex-col @[750px]:grid @[750px]:grid-cols-2 @[750px]:items-start gap-[15px]";

export const QB_SIDE_BY_SIDE_CHARTS_REVERSE =
  "flex flex-col-reverse @[750px]:grid @[750px]:grid-cols-2 @[750px]:items-center gap-[15px]";
