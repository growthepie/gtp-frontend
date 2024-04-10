import Container from "@/components/layout/Container";

type SlidingFooterContainerProps = {
  children: React.ReactNode;
};

export default function OffScreenSlider({
  children,
}: SlidingFooterContainerProps) {
  return (
    <Container className={"!px-0 fixed w-[calc(100vw-0px)] md:w-[945px] mx-auto bottom-0"}>
      <Container className={`w-full`}>
        {children}
      </Container>
    </Container>
  );
}
