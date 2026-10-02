export default function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-[15px] bg-color-bg-default shadow-standard flex flex-col gap-y-[10px] ${padded ? "p-[15px]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** The house callout shape (CalloutBlock.tsx): tinted panel + left rule, full-size text. */
export function Callout({
  children,
  color = "border-color-ui-hover",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`p-[15px] bg-color-bg-medium rounded-[15px] border-l-4 ${color} text-xs md:text-sm`}>{children}</div>
  );
}
