import { GTPIcon } from "@/components/layout/GTPIcon";

// Marks a number/visual that isn't backed by a live growthepie data source —
// per the page's "live where possible, clearly-labeled illustrative elsewhere"
// data policy. Keep this on anything that isn't wired to a real endpoint.
export default function IllustrativeTag({ label = "illustrative" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-x-[4px] px-[8px] py-[2px] rounded-full bg-color-bg-medium w-fit">
      <GTPIcon icon="gtp-info-monochrome" size="sm" className="!w-[10px] !h-[10px]" />
      <span className="heading-caps-xxs text-color-text-secondary">{label}</span>
    </div>
  );
}
