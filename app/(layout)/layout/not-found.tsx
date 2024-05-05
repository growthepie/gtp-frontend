"use client";
import Link from "next/link";
import { headers } from "next/headers";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import Icon from "@/components/layout/Icon";
import { navigationItems } from "@/lib/navigation";
import ErrorGen from "@/components/ErrorGen";

export default function NotFound() {
  return (
    <>
      <ErrorGen
        header={"404 Page Not Found ..."}
        subheader={
          "The page you requested was not found. We can recommend checking out one of these pages:"
        }
      />
    </>
  );
}
