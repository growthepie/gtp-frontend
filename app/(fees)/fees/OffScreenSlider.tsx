import FeesContainer from "@/components/layout/FeesContainer";
import React from "react";

type SlidingFooterContainerProps = {
  children: React.ReactNode;
  floatingChildren?: React.ReactNode;
};

export default React.forwardRef(function OffScreenSlider(
  { children, floatingChildren }: SlidingFooterContainerProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div
      className={
        "fixed bottom-[80px] md:bottom-0 left-0 right-0 flex justify-center"
      }
      ref={ref}
    >
      {floatingChildren}
      <FeesContainer className="max-w-full md:min-w-[650px] md:max-w-[750px]">
        {children}
      </FeesContainer>
    </div>
  );
});
