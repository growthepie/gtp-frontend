type ShrinkPriorityProps = {
  children: React.ReactNode;
  className?: string;
};

export const ShrinkPriorityContainer = ({
  children,
  className,
}: ShrinkPriorityProps) => {
  return <div className={`flex ${className ?? ""}`}>{children}</div>;
};

type ShrinkPriorityChildrenProps = {
  children: React.ReactNode;
  className?: string;
};

export const ShrinkFirst = ({
  children,
  className,
}: ShrinkPriorityChildrenProps) => {
  return <div className={` ${className ?? ""}`}>{children}</div>;
};

export const ShrinkSecond = ({
  children,
  className,
}: ShrinkPriorityChildrenProps) => {
  return <div className={`${className ?? ""}`}>{children}</div>;
};
