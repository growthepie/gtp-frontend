"use client";

import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import { PageTitleAndDescriptionAndControls } from "./Components";
import type { ReactNode } from "react";

const HIDDEN_HEADER_ROUTES = new Set(["/applications/add", "/applications/edit"]);

export default function ApplicationsRouteHeader({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();
  if (HIDDEN_HEADER_ROUTES.has(pathname)) {
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
