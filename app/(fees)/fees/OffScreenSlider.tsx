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
      className={"fixed w-full max-w-[650px] md:max-w-[980px] mx-auto bottom-0"}
      ref={ref}
    >
      {floatingChildren}
      <FeesContainer>{children}</FeesContainer>
    </div>
  );
});
