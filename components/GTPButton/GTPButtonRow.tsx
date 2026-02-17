import GTPTabButtonSet from "./GTPTabButtonSet";

export default function GTPButtonRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GTPTabButtonSet className={`w-full lg:w-auto ${className ?? ""}`}>
      {children}
    </GTPTabButtonSet>
  );
}
