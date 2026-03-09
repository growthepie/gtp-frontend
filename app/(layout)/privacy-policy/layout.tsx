import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/privacy-policy",
    {}
  );
  return metadata;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
