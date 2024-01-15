import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contributors",
  description: "The people who made this project possible",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
