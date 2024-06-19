import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <Head /> */}
      <body className="sbg-white sdark:bg-[#1F2726] bg-transparent text-forest-900 dark:text-forest-500 font-raleway">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
