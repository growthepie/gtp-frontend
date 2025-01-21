import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "./Search";
import Controls from "./Controls";
import { ApplicationsDataProvider } from "./ApplicationsDataContext";


export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApplicationsDataProvider>
      <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px]" isPageRoot>
        <div className="flex items-center h-[43px] gap-x-[8px] ">
          <GTPIcon icon="gtp-project" size="lg" />
          <Heading className="heading-large-xl" as="h1">
            Applications
          </Heading>
        </div>
        <div className="text-sm">
          An overview of the most used applications across the Ethereum ecosystem.
        </div>
        <Search />
        <Controls />
      </Container>
      {children}
    </ApplicationsDataProvider>
  )
}