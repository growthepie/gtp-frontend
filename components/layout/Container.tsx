type ContainerProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
};

export default function Container({
  children,
  id,
  ref,
  className = "",
  style,
}: ContainerProps) {
  return (
    <div
      id={id}
      className={`px-[20px] md:px-[64px] text-[#CDD8D3] ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}
