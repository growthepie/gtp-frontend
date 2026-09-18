"use client";
import Link from "next/link";
import useSWR from "swr";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { SectionDescription, SectionTitle } from "@/components/layout/TextHeadingComponents";
import { track } from "@/lib/tracking";
import type { PlatformUpdateRow } from "@/app/api/platform-updates/route";
import { formatLinkText } from "./formatLinkText";

const GRID_COLUMNS = "grid-cols-[425px_minmax(100px,2000px)_120px]";

export default function PlatformUpdatesSection() {
  const { data: updateData } = useSWR<PlatformUpdateRow[]>("/api/platform-updates", {
    refreshInterval: 1000 * 60 * 5,
  });

  return (
    <section className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-calendar-clean" title="Platform Updates" as="h2" iconSize="md" />
      <SectionDescription className="w-full text-color-text-primary">
        Our public change log. A list with bigger feature releases and their announcements. We keep building!
      </SectionDescription>
      <HorizontalScrollContainer includeMargin={false}>
        <GridTableHeader
          gridDefinitionColumns={GRID_COLUMNS}
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[48px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">Product Feature</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Announcement Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date Released</GridTableHeaderCell>
        </GridTableHeader>
        <VerticalScrollContainer height={39 * 9}>
          <div className="flex flex-col gap-y-[5px]">
            {updateData &&
              updateData.map((updateRow) => (
                <GridTableRow
                  gridDefinitionColumns={`${GRID_COLUMNS} justify-items-stretch`}
                  key={updateRow.name}
                  className="group text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
                  onClick={() => {
                    window.open(updateRow.url, "_blank");
                    track("clicked Platform Update Row", {
                      location: updateRow.name,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <div className="flex items-center w-full h-full">{updateRow.name}</div>
                  <div className="flex">
                    <Link
                      href={updateRow.url}
                      target="_blank"
                      className="w-full truncate text-forest-800"
                    >
                      {formatLinkText(updateRow.url)}
                    </Link>
                  </div>
                  <div className="flex items-center justify-end w-full h-full gap-x-[3px]">
                    {updateRow.date.replace(/-/g, "/")}
                  </div>
                </GridTableRow>
              ))}
          </div>
        </VerticalScrollContainer>
      </HorizontalScrollContainer>
    </section>
  );
}
