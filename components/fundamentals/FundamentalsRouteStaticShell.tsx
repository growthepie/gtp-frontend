// Server Component that emits a static, SEO-only metric shell at the layout
// level — sibling of <Providers>, so the prose lives in parse-time HTML and
// not the RSC stream. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
// fetch raw HTML without executing JS or CSS, so the shell's text is fully
// readable to them despite being visually hidden from sighted users.
//
// Visible UI is still rendered by the React app inside <Providers>; this
// shell is a parallel SEO surface, not a replacement. Mirrors the
// QuickBiteRouteStaticShell pattern.

import { headers } from "next/headers";
import Link from "next/link";
import {
  buildFaqEntries,
  canonicalUrlForMetric,
  findMetricConfig,
  nodeToString,
} from "@/lib/fundamentals/seo";

const FUNDAMENTALS_RE = /^\/fundamentals\/([^/?#]+)\/?$/;

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default async function FundamentalsRouteStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const m = pathname.match(FUNDAMENTALS_RE);
  if (!m) return null;
  const metric = decodeURIComponent(m[1]);

  const metricConfig = findMetricConfig(metric);
  if (!metricConfig) return null;

  const pageData = metricConfig.page;
  const title = pageData?.title || metricConfig.label || metric;
  const description = nodeToString(pageData?.description);
  const note = nodeToString(pageData?.note);
  const canonical = canonicalUrlForMetric(metric);
  const faqEntries = buildFaqEntries(metric, pageData);

  return (
    <div
      id="fundamentals-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="fundamentals"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/fundamentals">Fundamentals</Link>
          </li>
          <li>{title}</li>
        </ol>
      </nav>

      <article itemScope itemType="https://schema.org/Dataset">
        <header>
          <h1 itemProp="name">{title}</h1>
          {description && (
            <p itemProp="description">{description}</p>
          )}
          {note && <p>Note: {note}</p>}
          <p>
            <Link href={canonical} rel="canonical">
              View live data on growthepie
            </Link>
          </p>
        </header>

        {faqEntries.length > 0 && (
          <section aria-label="About this metric">
            <h2>About this metric</h2>
            <dl>
              {faqEntries.map((item, i) => (
                <div key={i}>
                  <dt>
                    <h3>{item.question}</h3>
                  </dt>
                  <dd>
                    <p>{item.answer}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </article>
    </div>
  );
}
