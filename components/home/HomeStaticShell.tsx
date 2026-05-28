import { headers } from "next/headers";
import Link from "next/link";

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

        <section aria-label="Frequently Asked Questions" itemScope itemType="https://schema.org/FAQPage">
          <h2>Frequently Asked Questions</h2>

          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What&apos;s growthepie?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">
                growthepie is the open analytics platform for the Ethereum
                ecosystem — empowering builders with actionable insights to grow
                the pie. From Mainnet to Layer 2s and onchain applications,
                explore open data on usage, growth, and adoption.
              </p>
            </div>
          </div>

          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What&apos;s up with the name &quot;growthepie&quot;?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">
                We view Ethereum&apos;s different scaling solutions as
                complementary technologies for the ecosystem that enable more
                use cases, rather than competitors vying for market share. We
                believe the space is a positive-sum game where each unique
                flavor of Layer 2 technology brings its own benefits, and
                together they are &quot;growing the pie&quot; for everyone. Our
                brand name is always one word and lowercase: growthepie.
              </p>
            </div>
          </div>

          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">
              What&apos;s the difference between Ethereum Mainnet and the
              Ethereum ecosystem?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">
                Ethereum Mainnet, also called Ethereum L1, is the Ethereum
                blockchain that launched in 2015. The Ethereum ecosystem
                includes many blockchains built on top of Ethereum Mainnet
                (Layer 2s). These blockchains settle to Ethereum Mainnet and
                benefit from some of its security guarantees. Not all of these
                chains run the EVM — Layer 2s can also use other VMs (CairoVM,
                SVM, FuelVM, etc.). Settling to Ethereum Mainnet defines the
                ecosystem, not the VM.
              </p>
            </div>
          </div>

          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What are Quick Bites?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">
                Quick Bites are short, data-driven articles on specific topics
                or trends in the Ethereum ecosystem. You can browse all of them
                on the Quick Bites page at growthepie.com/quick-bites.
              </p>
            </div>
          </div>

          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">Are the dates on this website my regional timezone or UTC?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">
                All dates on our website use UTC time. This makes it easier to
                aggregate data and avoid confusion when people in different
                timezones share charts.
              </p>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
