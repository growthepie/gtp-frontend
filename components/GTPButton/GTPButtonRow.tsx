import GTPTabButtonSet from "./GTPTabButtonSet";

export default function GTPButtonRow({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <GTPTabButtonSet className={` ${className ?? ""}`} style={style ?? undefined}>
      {children}
    </GTPTabButtonSet>
  );
}
