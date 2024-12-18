import { Metadata } from "next";
import { navigationItems } from "@/lib/navigation";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Image from "next/image";
import Link from "next/link";


type Props = {
  params: { metric: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Blockspace")
    ?.options.find((item) => item.urlKey === "chain-overview");

  if (option) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: option.page?.title,
      description: option.page?.description,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.xyz/v1/og_images/blockspace/chain-overview.png?date=${dateString}`,
            width: 1200,
            height: 627,
            alt: "growthepie.xyz",
          },
        ],
      },
    };
  }

  return {
    title: "Page not found",
    description: "Page not found",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return(
    <>
      <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]">
        <div className="flex items-center h-[43px] gap-x-[8px]">
          <Image
              src="/GTP-Metrics-Economics.svg"
              alt="GTP Chain"
              className="object-contain w-[36px] h-[36px]"
              height={36}
              width={36}
          />
          <Heading className="text-[36px] leading-snug " as="h1">ETH Wave</Heading>
        </div>
        <div className="text-[14px] mb-[30px]">
          Chart in progress
        </div>
      </Container>
      <div>{children}</div>
    </>
  )
    
}
