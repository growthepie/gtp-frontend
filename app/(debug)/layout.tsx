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
      <body className="sbg-white sdark:bg-color-bg-default bg-transparent text-forest-900 dark:text-color-text-primary font-raleway">
        <Providers>{children}</Providers>
        <Analytics scriptSrc="/api/va/script.js" />
      </body>
    </html>
  );
}
