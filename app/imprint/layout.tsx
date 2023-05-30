import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Imprint",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
