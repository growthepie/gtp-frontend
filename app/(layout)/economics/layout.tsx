import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Image from "next/image";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
      <div className="flex items-center mb-[5px]">
        <Image
          src="/GTP-Metrics-Economics.svg"
          alt="GTP Chain"
          className="object-contain w-[32px] h-[32px] mr-[8px]"
          height={36}
          width={36}
        />
        <Heading className="text-[36px] leading-snug " as="h1">
          {"Economics"}
        </Heading>
      </div>
      <div>{children}</div>
    </Container>
  );
}
