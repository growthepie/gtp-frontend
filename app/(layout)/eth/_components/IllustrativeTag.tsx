import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPIcon } from "@/components/layout/GTPIcon";

const EXPLAINER =
  "growthepie doesn't track this metric yet, so the figure here is an example of the shape of the data — not a live measurement.";

/**
 * Marks a figure that isn't backed by a live growthepie data source. Quiet by
 * design: a single dot-sized affordance that carries its explanation on hover,
 * rather than a chip competing with the content beside it.
 */
export default function IllustrativeTag({ label = "Illustrative figure" }: { label?: string }) {
  return (
    <GTPTooltipNew
      placement="top-start"
      size="md"
      allowInteract={false}
      trigger={
        <div className="flex items-center gap-x-[4px] text-color-text-primary/70 cursor-help w-fit">
          <GTPIcon icon="gtp-info-monochrome" size="sm" className="!w-[12px] !h-[12px]" />
          <span className="heading-small-xxxs">{label}</span>
        </div>
      }
      containerClass="flex flex-col gap-y-[10px]"
    >
      <div className="px-[15px] text-xs max-w-[260px]">{EXPLAINER}</div>
    </GTPTooltipNew>
  );
}

/** A section-level footnote for sections where several figures are illustrative. */
export function IllustrativeNote({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-color-text-primary/70">{children}</div>;
}
