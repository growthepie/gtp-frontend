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
import type { ImpactRow } from "@/app/api/impact/route";
import { formatLinkText } from "./formatLinkText";

const GRID_COLUMNS = "grid-cols-[425px_minmax(100px,2000px)_120px]";

export default function ImpactSection() {
  const { data: impactData } = useSWR<ImpactRow[]>("/api/impact", {
    refreshInterval: 1000 * 60 * 5,
  });

  return (
    <section className="flex flex-col gap-y-[15px]">
      <SectionTitle icon="gtp-megaphone" title="Impact" as="h2" iconSize="md" />
      <SectionDescription className="w-full text-color-text-primary">
        growthepie data and visualizations are used across many different sites, publishers and media. Our main focus
        is to cater towards end users and builders wanting to get the best overview of the entire Ethereum ecosystem.
        The following people and institutions mention us or use our data regularly:
      </SectionDescription>
      <HorizontalScrollContainer includeMargin={false}>
        <GridTableHeader
          gridDefinitionColumns={GRID_COLUMNS}
          className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[48px] !pt-[10px] !pb-[3px] select-none"
        >
          <GridTableHeaderCell justify="start">Name</GridTableHeaderCell>
          <GridTableHeaderCell justify="start">Link</GridTableHeaderCell>
          <GridTableHeaderCell justify="end">Date</GridTableHeaderCell>
        </GridTableHeader>
        <VerticalScrollContainer height={39 * 9}>
          <div className="flex flex-col gap-y-[5px]">
            {impactData &&
              impactData.map((impactRow) => (
                <GridTableRow
                  gridDefinitionColumns={`${GRID_COLUMNS} justify-items-stretch`}
                  key={impactRow.name}
                  className="group text-[14px] gap-x-[15px] z-[2] !pl-[15px] !pr-[16px] h-[34px] select-none"
                  onClick={() => {
                    window.open(impactRow.url, "_blank");
                    track("clicked Impact Row", {
                      location: impactRow.name,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <div className="justify-center w-full truncate">{impactRow.name}</div>
                  <div className="flex gap-x-[10px]">
                    {impactRow.url && (
                      <Link
                        href={impactRow.url}
                        target="_blank"
                        className="w-full truncate text-forest-800"
                      >
                        {formatLinkText(impactRow.url)}
                      </Link>
                    )}
                  </div>
                  <div className="text-right">{impactRow.date.replace(/-/g, "/")}</div>
                </GridTableRow>
              ))}
          </div>
        </VerticalScrollContainer>
      </HorizontalScrollContainer>
    </section>
  );
}
