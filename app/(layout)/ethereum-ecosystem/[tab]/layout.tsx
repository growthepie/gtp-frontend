
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ tab: string }>,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tab = (await params).tab;

  const metadata = await getPageMetadata(
    `/ethereum-ecosystem/${tab}`,
    {}
  );

  if (!metadata) {
    return {
      title: "Ethereum Ecosystem",
      description: "Explore the Ethereum ecosystem, including projects, applications, and more.",
    };
  }

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Container className="flex flex-col w-full pt-[65px] md:pt-[45px]" isPageRoot>

  // </Container>
  return (
    <>

      <div className="mb-[30px] select-none">{children}</div>

    </>
  );
}