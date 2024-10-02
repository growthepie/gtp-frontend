import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Icon from "@/components/layout/Icon";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Container className="flex flex-col w-full pt-[65px] md:pt-[45px]" isPageRoot>

  // </Container>
  return (
    <>
      <Container
        className="flex flex-col w-full pt-[65px] md:pt-[30px] gap-y-[15px]"
        isPageRoot
      >
        <div className="flex items-center h-[43px] gap-x-[8px] ">
          <Icon
            icon={"gtp:donate"}
            className="object-contain w-[36px] h-[36px]"
            height={36}
            width={36}
          />
          <Heading className="text-[36px] leading-snug " as="h1">
            {"Donate"}
          </Heading>
        </div>
        <div className="text-[14px] mb-[30px]">
          growthepie.xyz started with an initial grant from the Ethereum
          Foundation back in February 2023. We decided to build the platform as
          a public good, because we want everyone to have free access to
          transparent data and visualizations, that everyone understands, not
          just the few.
        </div>
      </Container>
      <div>{children}</div>
      <Container>{""}</Container>
    </>
  );
}
