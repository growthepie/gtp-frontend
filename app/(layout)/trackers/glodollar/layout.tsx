import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/trackers/glodollar",
    {}
  );
  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
