"use client"; // Error components must be Client Components

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { navigationItems } from "@/lib/navigation";
import { useMediaQuery } from "usehooks-ts";
import { track } from "@vercel/analytics";
import ErrorGen from "@/components/ErrorGen";

const Error = ({
  error,
  reset,
  message,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  message?: string | void;
}) => {
  return (
    <>
      <ErrorGen
        header={"Something went wrong ..."}
        subheader={
          " The page you requested currently has some issues and our devs have been notified. We can recommend checking out one of these pages:"
        }
      />
    </>
  );
};

Error.getInitialProps = ({ res, err, asPath }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, originalUrl: asPath };
};

export default Error;
