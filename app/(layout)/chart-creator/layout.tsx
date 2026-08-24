import { notFound } from "next/navigation";
import { IS_PRODUCTION } from "@/lib/helpers";

export default function ChartCreatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (IS_PRODUCTION) {
    notFound();
  }

  return children;
}
