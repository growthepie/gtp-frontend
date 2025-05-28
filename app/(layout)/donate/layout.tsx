import { PageRoot, PageContainer } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";
import { getPageMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/donate",
    {}
  );
  return metadata;
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Container className="flex flex-col w-full pt-[65px] md:pt-[45px]" isPageRoot>

  // </Container>
  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer>
        <Title
          id="Community"
          icon="gtp-donate"
          title="Donate"
        />
        <Description>
          growthepie.xyz started with an initial grant from the Ethereum
          Foundation back in February 2023. We decided to build the platform as
          a public good, because we want everyone to have free access to
          transparent data and visualizations, that everyone understands, not
          just the few.
        </Description>
      </PageContainer>
      {children}
    </PageRoot>
  );
}
