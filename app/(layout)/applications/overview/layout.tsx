import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "../Search";
import Controls from "../Controls";
import { ApplicationsDataProvider } from "../ApplicationsDataContext";
import { ApplicationsURLs } from "@/lib/urls";
import ReactDOM from "react-dom";

// prefetch data for all timeframes
export function PreloadResources() {
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', '1d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', '7d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', '30d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', '90d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', '365d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('{timespan}', 'max'), { as: 'fetch' });

  return null;
}

export default async function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { owner_project } = params;

  return (
    <>
      <PreloadResources />
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
    </>
  )
}