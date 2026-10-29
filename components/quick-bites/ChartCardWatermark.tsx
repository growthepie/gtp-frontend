import ChartWatermark from "@/components/layout/ChartWatermark";

/**
 * The growthepie watermark as placed in a Quick Bite chart card. Shared by ChartWrapper
 * and ChartSkeleton so the skeleton's watermark sits exactly where the loaded chart's
 * will, and nothing jumps when the chart replaces it. `height` is the card's height.
 */
export default function ChartCardWatermark({ height }: { height?: number | string }) {
  return (
    <div
      className="absolute bottom-[27.5%] md:bottom-[18.5%] left-[40px] md:left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-[4] opacity-40"
      style={{ height: typeof height === "number" ? height - 147 + "px" : "100%" }}
    >
      <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
    </div>
  );
}
