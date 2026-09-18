import { getPageMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata("/sales", {});
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
