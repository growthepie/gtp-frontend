import Container, { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import { Metadata } from "next";
import { Title } from "@/components/layout/TextHeadingComponents";

export const metadata: Metadata = {
  title: "Contributors",
  description: "The people who made this project possible",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          {/* <div
            className="flex gap-x-[8px] items-center"
          >
            <GTPIcon icon="gtp-compass" size="lg" />
            <Heading
              className="leading-[120%] text-[36px] md:text-[36px] break-inside-avoid "
              as="h1"
            >
              Contributors
            </Heading>
          </div> */}
          <Title
            title="Contributors"
            icon="gtp-compass"
            as="h1"
          />
          <Description>
            Meet the team and the people who make it happen. Being a public good, we rely on grants and public funding rounds, such as Gitcoin, Octant or Giveth.
            Please support us whenever a round is active.
          </Description>
        </Section>
      </PageContainer>
      <div>{children}</div>
    </PageRoot>
  );
}
