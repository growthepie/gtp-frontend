import Container, { PageRoot, PageContainer } from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Icon from "@/components/layout/Icon";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <Container className="flex flex-col w-full pt-[65px] md:pt-[45px]" isPageRoot>

  // </Container>
  return (
    <PageRoot className="pt-[30px]">
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
