type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
};

export default function Container({
  children,
  ref,
  className = "",
}: ContainerProps) {
  return (
    <div className={`px-[20px] md:px-[64px] ${className}`} ref={ref ?? null}>{children}</div>
  );
}
