import Container from "@/components/layout/Container";
import Description from "@/components/layout/Description";
import GTPIcon from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contributors",
  description: "The people who made this project possible",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Container
        className="pt-[45px] md:pt-[45px] gap-y-[15px]"
        isPageRoot
      >
        <div
          className="flex gap-x-[8px] items-center pb-[15px]"
        >
          <div className="w-[36px] h-[36px]">
            <GTPIcon icon="gtp-compass" size="lg" />
          </div>
          <Heading
            className="leading-[120%] text-[36px] md:text-[36px] break-inside-avoid "
            as="h1"
          >
            Contributors
          </Heading>
        </div>
        <Description>
          Meet the team and the people who make it happen. Being a public good, we rely on grants and public funding rounds, such as Gitcoin, Octant or Giveth.
          Please support us whenever a round is active.
        </Description>
      </Container>
      <div>{children}</div>
    </>
  );
}
