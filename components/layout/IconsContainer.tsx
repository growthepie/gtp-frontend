import React from "react";

type IconsContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const IconsContainer = React.forwardRef<HTMLDivElement, IconsContainerProps>(
  ({ children, className = "", style }, ref) => {
    return (
      <div
        className={`flex flex-wrap justify-center items-center gap-4 px-4 md:px-16 ${className}`}
        ref={ref}
        style={style}
      >
        {children}
      </div>
    );
  }
);

IconsContainer.displayName = "IconsContainer";

export default IconsContainer;
