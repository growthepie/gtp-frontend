"use client";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "../Search";
import Controls from "../Controls";
import { AggregatedDataRow, useApplicationsData } from "../ApplicationsDataContext";
import { ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GridTableChainIcon } from "@/components/layout/GridTable";
import { useMaster } from "@/contexts/MasterContext";
import {
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
  GridTableContainer,
} from "@/components/layout/GridTable";
import { GTPIconName } from "@/icons/gtp-icon-names";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { formatNumber } from "@/lib/chartUtils";
import { useLocalStorage } from "usehooks-ts";
import { Virtuoso } from "react-virtuoso";
import { set } from "lodash";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import { useApplicationDetailsData } from "../ApplicationDetailsDataContext";
import { useProjectsMetadata } from "../ProjectsMetadataContext";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const projectData = ownerProjectToProjectData[owner_project];

  if (!projectData) {
    return null;
  }

  return (
    <Container>
      <div className="flex items-center h-[43px] gap-x-[8px] ">
      </div>
    </Container>
  );

  
}