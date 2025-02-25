import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import next, { Metadata } from 'next';
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { headers } from 'next/headers';
import Link from "next/link";


type Props = {
    params: { metric: string };
};


export async function generateMetadata(): Promise<Metadata> {
    const currentDate = new Date();
    currentDate.setHours(2, 0, 0, 0);
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    
    return {
        title: "Ethereum Layer 2 - Data Availability Metrics",
        description: "Comprehensive analytics on Layer 2 data availability solutions, tracking posted data volumes, fees, and costs across Celestia, Ethereum Blobs, and other DA providers. Compare Layer 2 networks by DA consumption, monitor historical trends, and analyze cost efficiency with up-to-date metrics and visualizations for Ethereum scaling solutions.",
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
    params,
  }: {
    children: React.ReactNode;
    params: { metric: string };
  }) {
    
  
   

    return(
        <>

            <div>
                {children}
            </div>


        </>
    )
  }