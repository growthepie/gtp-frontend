import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Image from "next/image";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Container className="flex flex-col w-full pt-[65px] md:pt-[45px]" isPageRoot>

  // </Container>
  return (
    <>
      <Container className="flex flex-col justify-center mb-[5px] pt-[65px] md:pt-[45px] gap-y-[15px]">
        <div className="flex items-center h-[43px] gap-x-[8px]">
          <Image
            src="/GTP-Metrics-Economics.svg"
            alt="GTP Chain"
            className="object-contain w-[36px] h-[36px]"
            height={36}
            width={36}
          />
          <Heading className="text-[36px] leading-snug " as="h1">
            {"Onchain Economics"}
          </Heading>
        </div>
        <div className="text-[14px]">
          Aggregated metrics across all chains listed in the table below.
        </div>
      </Container>
      <div>{children}</div>
    </>
  );
}
