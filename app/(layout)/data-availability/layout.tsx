import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import next, { Metadata } from 'next';
import QuestionAnswer from "@/components/layout/QuestionAnswer";

import Link from "next/link";


type Props = {
    params: { metric: string };
};


export async function generateMetadata(): Promise<Metadata> {
    const currentDate = new Date();
    currentDate.setHours(2, 0, 0, 0);
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    
    return {
        title: "Data Availability Overview",
        description: "Overview of Data Availability Metrics",
        openGraph: {
            images: [
                {
                    url: `https://api.growthepie.xyz/v1/og_images/data-availability/overview.png?date=${dateString}`,
                    width: 1200,
                    height: 627,
                    alt: "growthepie.xyz",
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

    return(
        <>
            <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]" isPageRoot >
                <div className="flex items-center h-[43px] gap-x-[8px] ">
                    <Icon icon="gtp:gtp-data-availability" className="w-[24px] h-[24px]"/>
                    <Heading className="text-[36px] leading-snug " as="h1">
                    {"Data Availability Overview"}
                    </Heading>
                </div>
                <div className="text-[14px] mb-[30px]">
                This page shows an overview of common Data Availability (DA) solutions that are used by Layer 2s. DA is becoming more and more important for the modular Layer 2 architecture. Different solutions have different trade-offs with regards to scalability, costs, and security assumptions.
                </div>
            </Container>
            <div>
                {children}
            </div>
            <Container className="pt-[15px]">
            <QuestionAnswer
            startOpen={true}
            question="Details"
            answer={
                <>
                <div className="pb-[10px]">
                    <div>
                    Our Data Availability Overview page breaks down important metrics around DA:
                    </div>
                    <ul className="list-disc list-inside pt-[5px] text-[14px] space-y-[5px]">
                    <li>
                        <span className="font-bold">Data Posted:</span> The amount of data that was submitted to the DA layer. Different DA layers can handle different amounts of data based on their scaling capabilities.
                    </li>
                    <li>
                        <span className="font-bold">DA Fees Paid:</span> The fees collected by the DA layer for processing and storing data. This is influenced by the amount of data that was processed but also by the fee market structure and demand that a DA layer experiences.
                    </li>
                    <li>
                        <span className="font-bold">Fees/MB:</span> The average cost that a Layer 2 pays per Megabyte of data submitted. This value is important for Layer 2s since it directly influences their costs and with that potentially also the transaction costs that they pass on to their users.
                    </li>
                    <li>
                        <span className="font-bold">DA Consumers:</span> The Layer 2 networks that have submitted at least 100MB worth of data to the DA layer. Usually, a Layer 2 uses only a single DA layer. But it is also possible that Layer 2s switch between DA layers if this allows them to save costs.
                    </li>
                    </ul>
                </div>
                </>
            }
            note={
                <>
                <div>Important Notes:</div>
                <ul className="list-disc list-inside pt-[5px] text-[14px]">
                    <li>
                    In order to provide this type of analysis, we have to map Layer 2s / DA consumers to their respective onchain identifiers. This effort can easily be accessed in our{' '}
                    <Link className="underline" href="https://github.com/growthepie/gtp-dna/tree/main/economics_da" target="_blank">
                        GitHub mapping file
                    </Link>.
                    </li>
                    <li>
                    If you identify missing Layer 2s on this page, please head over to our{' '}
                    <Link className="underline" href="https://github.com/growthepie/gtp-dna/tree/main/economics_da" target="_blank">
                        GitHub
                    </Link>{' '}
                    and create a PR. This will help us to keep this page up-to-date.
                    </li>
                </ul>
                </>
            }
            />
        </Container>

        </>
    )
  }