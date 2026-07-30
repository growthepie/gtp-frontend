"use client";
import Link from "next/link";
import Icon from "./Icon";
import { track } from "@/lib/tracking";

export default function HeaderLinks() {
  return (
    <>
      <Link
        href="https://twitter.com/growthepie_eth"
        target="_blank"
        rel="noopener"
        onClick={() => {
          track("clicked Twitter link", {
            location: "desktop header",
            page: window.location.pathname,
          });
        }}
      >
        <Icon icon="gtp:twitter" className="h-6 w-[24px]" />
      </Link>

      <Link
        href="https://www.github.com/growthepie"
        target="_blank"
        rel="noopener"
        className="w-6 h-6 dark:text-forest-200 text-forest-900"
        onClick={() => {
          track("clicked Github link", {
            location: "desktop header",
            page: window.location.pathname,
          });
        }}
      >
        <Icon icon="cib:github" className="h-6 w-6" />
      </Link>
    </>
  );
}
