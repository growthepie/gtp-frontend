import FeesContainer from "@/components/layout/FeesContainer";
import React from "react";

type SlidingFooterContainerProps = {
  children: React.ReactNode;
};

export default React.forwardRef(function OffScreenSlider(
  { children }: SlidingFooterContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <div className={"fixed w-full max-w-[650px] md:max-w-[900px] mx-auto bottom-0"} ref={ref}>
      <FeesContainer>
        {children}
      </FeesContainer>
    </div>
  );
});
