import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Image from "next/image";
import Link from "next/link";
import DesktopEconomicsExplanationSVG from "@/public/economics/explanation.svg";
import DesktopEconomicsExplanationSVGLight from "@/public/economics/explanationlight.svg";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {  
  const metadata = await getPageMetadata(
    '/economics',
    {}
  );
  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/economics.png`,
          width: 1200,
          height: 627,
          alt: "growthepie.com",
        },
      ],
    },
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]"
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
          <Heading className="heading-large-xl leading-snug " as="h1">
            {"Onchain Economics"}
          </Heading>
        </div>
        <div className="text-[14px] mb-[30px]">
          Ethereum ecosystem economics of Layer 2s. This page contains a breakdown by revenue, costs, and profit. Only onchain revenue and costs are considered in this analysis.
        </div>
      </Container>
      <div>{children}</div>
      <Container className="mt-[30px]">
        <QuestionAnswer
          startOpen={true}
          // className="px-[0px]"
          // questionClassName="px-[30px]"
          question="Details"
          answer={
            <>
              <div className="pb-[10px]">
                <div>
                  Our Onchain Economics page breaks down how profitable Layer 2s operate:
                </div>
                <ul className="list-disc list-inside pt-[5px] text-[14px] space-y-[5px]">
                  <li><span className="font-bold">Profit</span> is defined as the difference between Revenue and Costs.</li>
                  <li><span className="font-bold">Revenue</span> is the total amount generated from transaction fees on the Layer 2.</li>
                  <li><span className="font-bold">Costs</span> are divided into two main components:</li>
                  <li className="list-none">
                    <ul className="list-disc list-inside pl-[20px] text-[14px] -mt-[5px]">
                      <li><span className="font-bold">L1 Costs <span className="align-super text-[0.8rem]">(1)</span></span> — refers to the transaction fees paid for settling operations on the Ethereum Layer 1 (L1) blockchain.</li>
                      <li><span className="font-bold">Blob Costs <span className="align-super text-[0.8rem]">(2)</span></span> — represents fees for data availability and can be further broken down:</li>
                      <li className="list-none">
                        <ul className="list-disc list-inside pl-[20px] text-[14px] space-y-[0px]">
                          <li><span className="font-bold">Beacon Chain <span className="align-super text-[0.8rem]">(a)</span></span> — fees associated with storing data on the Beacon Chain.</li>
                          <li><span className="font-bold">Alternative Data Availability Providers (Alt. DAs) <span className="align-super text-[0.8rem]">(b)</span></span> — for using alternative data availability services such as <Link className="underline" href="https://docs.celestia.org/learn/how-celestia-works/data-availability-layer" target="_blank">Celestia</Link>.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <HorizontalScrollContainer className="rounded-[30px]" includeMargin={false} forcedMinWidth={700}>
                <div className="relative w-full min-w-[700px] max-w-[960px] aspect-[1245/425] hidden dark:block">
                  <Image src={DesktopEconomicsExplanationSVG.src} alt="Economics Explanation" fill className="object-contain hidden dark:block" />
                  
                </div>
                <div className="relative w-full min-w-[700px] max-w-[960px] aspect-[1245/425] dark:hidden block">
                  <Image src={DesktopEconomicsExplanationSVGLight.src} alt="Economics Explanation" fill className="object-contain block dark:hidden" />
                </div>
              </HorizontalScrollContainer>
            </>
          }
          note={
            <>
              <div>Important Notes:</div>
              <ul className="list-disc list-inside pt-[5px] text-[14px]">
                <li>We only account for onchain, trackable costs.</li>
                <li>Server costs, offchain computations, and overheads (e.g., marketing, staffing) are <span className="font-semibold ">not included</span> in this analysis.</li>
              </ul>
            </>
          }
        />
      </Container >
    </>
  );
}