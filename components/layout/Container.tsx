type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
};

export default function Container({
  children,
  ref,
  className = "",
  style,
}: ContainerProps) {
  return (
    <div
      className={`px-[20px] md:px-[64px] ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}
