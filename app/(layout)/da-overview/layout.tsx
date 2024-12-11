import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";


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
                    Metrics around Data Availability (DA).
                </div>
            </Container>
            <Container>
                {children}
            </Container>
        </>
    )
  }