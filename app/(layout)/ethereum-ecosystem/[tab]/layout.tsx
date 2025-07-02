
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {  
  const metadata = await getPageMetadata(
    '/ethereum-ecosystem',
    {}
  );
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