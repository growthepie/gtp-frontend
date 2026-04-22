"use client";

import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import { PageTitleAndDescriptionAndControls } from "./Components";
import type { ReactNode } from "react";

// Hide the overview header on any sub-route under /applications/ (e.g. /applications/uniswap,
// /applications/add, /applications/edit) — those pages render their own UI.
const APPLICATION_SUBROUTE = /^\/applications\/[^/]+/;

export default function ApplicationsRouteHeader({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();
  if (APPLICATION_SUBROUTE.test(pathname)) {
    return null;
  }

  if (children) {
    return <>{children}</>;
  }

  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot>
      <PageTitleAndDescriptionAndControls />
    </Container>
  );
}
