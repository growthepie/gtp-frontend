import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipGeneral } from "@/components/GTPComponents/GTPTooltip";
import type { Placement } from "@floating-ui/dom";

/**
 * The platform's i-button, styled like the metric charts on /ethereum-ecosystem/metrics:
 * method notes and sources go in its tooltip instead of a footnote. Sits right after a
 * title (section or card) or at the end of a tab bar. Used on /eth and in Quick Bites.
 */
export default function GTPInfoButton({
  label,
  children,
  placement = "top-start",
  className = "",
  color = "rgb(var(--text-secondary))",
}: {
  /** Accessible name, e.g. "About this chart". */
  label: string;
  children: React.ReactNode;
  placement?: Placement;
  className?: string;
  /** Icon colour; secondary text by default, as on the metrics page. */
  color?: string;
}) {
  return (
    <GTPTooltipNew
      placement={placement}
      unstyled
      trigger={
        <button type="button" aria-label={label} className={`shrink-0 inline-flex items-center justify-center hover:cursor-pointer ${className}`}>
          <GTPIcon icon="gtp-info-monochrome" size="sm" className="pointer-events-auto" style={{ color }} />
        </button>
      }
      positionOffset={{ mainAxis: 0, crossAxis: 0 }}
    >
      <GTPTooltipGeneral width={350}>
        <div className="pl-[20px] flex flex-col gap-y-[8px]">{children}</div>
      </GTPTooltipGeneral>
    </GTPTooltipNew>
  );
}
