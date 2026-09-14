import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export default function SectionHeader({
  icon,
  title,
  description,
  children,
}: {
  icon: GTPIconName;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-y-[15px]">
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={icon} size="md" />
        <div className="heading-large-lg">{title}</div>
      </div>
      {description && <div className="text-md text-color-text-secondary max-w-[720px]">{description}</div>}
      {children}
    </div>
  );
}
