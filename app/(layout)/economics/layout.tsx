import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
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
      <Container
        className="flex flex-col w-full pt-[65px] md:pt-[30px] gap-y-[15px]"
        isPageRoot
      >
        <div className="flex items-center h-[43px] gap-x-[8px] ">
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
        <div className="text-[14px] mb-[15px]">
          Aggregated metrics across all chains listed in the table below.
        </div>
      </Container>
      <div>{children}</div>
      <Container>
        <QuestionAnswer
          className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
          question="More about this page"
          answer={
            <>
              Our Onchain Economics page breaks down how profitable L2s operate.
              Profit is the difference between cost and revenue. Onchain costs
              can be divided into two parts: L1-cost and Blob-cost. For L1-cost,
              we consider the sum of fees each L2 pays for settling on L1, using
              Ethereum calldata as data availability or type-3 blob-carrying
              transactions. Blob-cost refers to beacon chain blob fees or fees
              by alternative data availability services such as Celestia. It is
              important to note that we only consider onchain trackable costs;
              server fees or other overhead are not considered. Revenue is
              calculated from all fees paid by users on the L2. Additionally,
              the blob data in MBs is tracked, representing the total size of
              all blobs posted per L2.
            </>
          }
        />
      </Container>
    </>
  );
}
