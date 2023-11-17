import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px] -mb-14">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading
              className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]"
              as="h1"
            >
              Optimism RetroPGF 3 Tracker
            </Heading>
          </div>
        </div>
        {/* <Subheading
          className="text-[16px]"
          iconContainerClassName="items-center mb-[22px] md:mb-[32px] relative"
          leftIcon={
            <Icon
              icon="feather:search"
              className="relative w-5 h-5 md:w-6 md:h-6"
            />
          }
        >
          <p>Description</p>
        </Subheading> */}
      </Container>

      <Container className="mt-[30px] !pr-0 2xl:!pr-[50px]">
        <div className="w-full overflow-x-scroll 2xl:overflow-x-visible z-100 py-5 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-[50px] 2xl:pr-0">
          <div className="min-w-[1330px] ">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </div>
        </div>
      </Container>
    </>
  );
}
