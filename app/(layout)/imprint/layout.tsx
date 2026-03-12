import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/imprint",
    {}
  );
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: metadata.canonical
      ? { canonical: metadata.canonical }
      : undefined,
    robots,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
