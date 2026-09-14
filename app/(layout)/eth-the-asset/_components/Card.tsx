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
      className={`rounded-[15px] bg-color-bg-default shadow-standard flex flex-col gap-y-[12px] ${padded ? "p-[15px]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
