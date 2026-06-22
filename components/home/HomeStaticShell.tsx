import { headers } from "next/headers";
import Link from "next/link";
import { HOME_FAQ } from "@/lib/home/homeFaq";

export default async function HomeStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  if (pathname !== "/" && pathname !== "") return null;

  return (
    <div
      id="home-static-shell"
      className="sr-only"
      aria-hidden="true"
      data-prerender="home"
    >
      <article itemScope itemType="https://schema.org/WebPage">
        <header>
          <h1 itemProp="name">growthepie — Ethereum Ecosystem Analytics</h1>
          <p itemProp="description">
            growthepie is the open analytics platform for the Ethereum
            ecosystem. We track real-time and historical metrics across Ethereum
            Mainnet and 27+ Layer 2 networks — including daily active addresses,
            transaction counts, throughput (TPS), fees paid, stablecoin market
            cap, total value locked (TVL), and onchain application revenue. Data
            is updated daily or in real-time via our public API.
          </p>
        </header>

        <nav aria-label="Main sections">
          <ul>
            <li>
              <Link href="/fundamentals">
                Fundamentals — cross-chain metric comparisons
              </Link>
            </li>
            <li>
              <Link href="/chains">
                Chains — individual Layer 2 analytics
              </Link>
            </li>
            <li>
              <Link href="/quick-bites">
                Quick Bites — data-driven research articles
              </Link>
            </li>
            <li>
              <Link href="/answers">
                Answers — direct answers to common Ethereum questions
              </Link>
            </li>
            <li>
              <Link href="/applications">
                Applications — onchain application analytics
              </Link>
            </li>
            <li>
              <Link href="/api">
                Public API — open data access for developers
              </Link>
            </li>
          </ul>
        </nav>

        <section aria-label="About">
          <p>
            The Ethereum ecosystem includes Ethereum Mainnet (L1) and Layer 2
            scaling networks such as Arbitrum, OP Mainnet, Base, zkSync Era,
            Scroll, Linea, and many others. All dates and timestamps use UTC.
            All data is open and free to use.
          </p>
        </section>

        {/* Visible (sr-only) FAQ prose for AI crawlers. The machine-readable
            FAQPage is now emitted as JSON-LD by HomeRouteSchemas (both driven
            by lib/home/homeFaq.ts), so no schema.org microdata is needed here. */}
        <section aria-label="Frequently Asked Questions">
          <h2>Frequently Asked Questions</h2>
          {HOME_FAQ.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
