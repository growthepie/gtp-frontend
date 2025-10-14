import { TimespanProvider } from "./_contexts/TimespanContext";
import { MetricsProvider } from "./_contexts/MetricsContext";
import { SortProvider } from "./_contexts/SortContext";
import Container from "@/components/layout/Container";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Heading from "@/components/layout/Heading";
import Search from "./_components/Search";
import Controls from "./_components/Controls";
import { ApplicationsDataProvider } from "./_contexts/ApplicationsDataContext";
import { PageTitleAndDescriptionAndControls } from "./_components/Components";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";


export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    '/applications',
    {}
  );
  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
      <TimespanProvider timespans={{
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
        };
      }}>
        <MetricsProvider>
          <SortProvider defaultOrder="desc" defaultKey="txcount">
            <ProjectsMetadataProvider>
              <ApplicationsDataProvider>
                {/* <Container className="sticky top-0 z-[10] flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot> */}
                <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot>
                  <PageTitleAndDescriptionAndControls />
                </Container>
                  {children}
              </ApplicationsDataProvider>
            </ProjectsMetadataProvider>
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
  )
}