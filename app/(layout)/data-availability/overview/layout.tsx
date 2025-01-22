import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { Metadata } from 'next';

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
        </>
    )
  }