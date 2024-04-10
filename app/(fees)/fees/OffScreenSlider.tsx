import FeesContainer from "@/components/layout/FeesContainer";

type SlidingFooterContainerProps = {
  children: React.ReactNode;
};

export default function OffScreenSlider({
  children,
}: SlidingFooterContainerProps) {
  return (
    <div className={"fixed w-full max-w-[650px] md:max-w-[900px] mx-auto bottom-0"}>
      <FeesContainer>
        {children}
      </FeesContainer>
    </div>
  );
}
