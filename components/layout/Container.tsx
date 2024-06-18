type ContainerProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  isPageRoot?: boolean;
};

export default function Container({
  children,
  id,
  className = '',
  ref,
  style,
  isPageRoot = false,
}: ContainerProps) {

  if (isPageRoot) {
    return (
      <div
        id={id}
        className={`px-[20px] md:px-[50px] text-[#CDD8D3] ${className}`}
        ref={ref ?? null}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`px-[20px] md:px-[50px] text-[#CDD8D3] ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}
