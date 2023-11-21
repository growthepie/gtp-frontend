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

      <Container className="mt-[0px] !pr-0 min-[1037px]:!pr-[50px]">
        <div className="w-full overflow-x-scroll min-[1037px]:overflow-x-visible z-100 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-[50px] min-[1037px]:pr-0">
          <div className="min-w-[850px]">{children}</div>
        </div>
      </Container>
      <Container className="-mb-[100px] pt-4 md:w-full flex flex-col md:flex-row space-y-[10px] md:space-x-[10px] text-sm md:text-sm xl:text-sm justify-end items-start">
        <div className="flex items-center justify-center mt-3">
          <div className="font-bold">
            Links
          </div>
        </div>
        <Link
          href={"https://vote.optimism.io/retropgf/3/"}
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-2 py-1"
          rel="noreferrer"
          target="_blank"
        >
          <Icon icon="feather:external-link" className="w-4 h-4" />
          <div>Optimism Agora</div>
        </Link>
        <Link
          href={"https://retropgfhub.com/retropgf3/"}
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-2 py-1"
          rel="noreferrer"
          target="_blank"
        >
          <Icon icon="feather:external-link" className="w-4 h-4" />
          <div>RetroPGF Hub</div>
        </Link>
        <Link
          href={"https://www.pairwise.vote/"}
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-2 py-1"
          rel="noreferrer"
          target="_blank"
        >
          <Icon icon="feather:external-link" className="w-4 h-4" />
          <div>Pairwise</div>
        </Link>
        <Link
          href={"https://www.opensource.observer/explore/"}
          className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-2 py-1"
          rel="noreferrer"
          target="_blank"
        >
          <Icon icon="feather:external-link" className="w-4 h-4" />
          <div>Open Source Observer</div>
        </Link>
      </Container>
    </>
  );
}
