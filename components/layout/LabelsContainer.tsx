import React from "react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  passedRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  // ref?: React.Ref<HTMLDivElement>;
};

export default React.forwardRef(function Container(
  { children, className = "", passedRef, style }: ContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <div
      className={`px-[20px] md:px-[60px] ${className}`}
      ref={ref}
      style={style}
    >
      {children}
    </div>
  );
});