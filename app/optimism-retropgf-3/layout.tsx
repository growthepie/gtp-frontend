import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import Subheading from "@/components/layout/Subheading";
import Image from "next/image";
import Link from "next/link";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
        <div className="flex justify-between items-start w-full mb-[0px]">
          <div className="flex flex-col">
            <div className="flex flex-col md:flex-row mb-[15px] md:mb-[19px] items-start">
              <div className="flex items-center ">
                <Image
                  src="/GTP-Fundamentals.svg"
                  alt="GTP Chain"
                  className="object-contain w-[32px] h-[32px] mr-[8px]"
                  height={36}
                  width={36}
                />
                <Heading className="text-[36px] leading-snug " as="h1">
                  RetroPGF 3 Tracker
                </Heading>
              </div>
            </div>
          </div>
        </div>
        <Subheading
          className="text-[14px] mb-0"
          iconContainerClassName="items-center mb-0 relative"
        >
          This is a list of all 643 projects that are part of RPGF3. Voting by badgeholders is in progress until December 7th. A project needs at least 17 votes in order to receive funding through RPGF.
        </Subheading>
      </Container>

      <Container className="mt-[0px] -mb-[100px] !pr-0 2xl:!pr-[50px]">
        <div className="w-full overflow-x-scroll 2xl:overflow-x-visible z-100 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-[50px] 2xl:pr-0">
          <div className="min-w-[1330px]">{children}</div>
        </div>
      </Container>
    </>
  );
}
