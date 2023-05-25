type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div className={`px-[20px] md:px-[50px] ${className}`}>{children}</div>
  );
}
