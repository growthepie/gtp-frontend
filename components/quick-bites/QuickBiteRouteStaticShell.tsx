// Server Component that emits a static, SEO-only article shell at the layout
// level — sibling of <Providers>, so the prose lives in parse-time HTML and
// not the RSC stream. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
// fetch raw HTML without executing JS or CSS, so the shell's text is fully
// readable to them despite being visually hidden from sighted users.
//
// Visible UI is still rendered by the React app inside <Providers>; this
// shell is a parallel SEO surface, not a replacement.

import { headers } from "next/headers";
import Link from "next/link";
import { processArticle } from "@/lib/quick-bites/articleProcessor";
import { formatDate } from "@/lib/utils/formatters";

const QUICK_BITE_RE = /^\/quick-bites\/([^/?#]+)\/?$/;

// sr-only style: in the DOM (so HTML parsers see it) but visually hidden.
// aria-hidden so screen-reader users don't get duplicated content with the
// visible interactive React app.
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

export default async function QuickBiteRouteStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const m = pathname.match(QUICK_BITE_RE);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (slug === "index") return null;

  let processed;
  try {
    processed = await processArticle(slug);
  } catch (e) {
    console.error(`QuickBiteRouteStaticShell failed for "${slug}":`, e);
    return null;
  }
  if (!processed) return null;

  const { qb, prose, faq } = processed;
  const siteUrl = "https://www.growthepie.com";
  const canonical = `${siteUrl}/quick-bites/${slug}`;

  return (
    <div
      id="quickbite-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="quick-bite"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/quick-bites">Quick Bites</Link>
          </li>
          <li>{qb.title}</li>
        </ol>
      </nav>

      <article itemScope itemType="https://schema.org/TechArticle">
        <header>
          <h1 itemProp="headline">{qb.title}</h1>
          {qb.subtitle && (
            <p className="quickbite-deck" itemProp="description">
              {qb.subtitle}
            </p>
          )}
          {qb.date && (
            <p>
              Published{" "}
              <time dateTime={qb.date} itemProp="datePublished">
                {formatDate(qb.date)}
              </time>
              {qb.author && qb.author.length > 0 && (
                <>
                  {" "}by{" "}
                  <span itemProp="author">
                    {qb.author.map((a, i) => (
                      <span key={a.xUsername || a.name}>
                        {i > 0 && ", "}
                        {a.name}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </p>
          )}
          <p>
            <Link href={canonical} rel="canonical">
              Read on growthepie
            </Link>
          </p>
        </header>

        {prose.length > 0 && (
          <section className="quickbite-prose" itemProp="articleBody">
            {renderProse(prose)}
          </section>
        )}

        {faq && faq.length > 0 && (
          <section aria-label="Frequently asked questions">
            <h2>Frequently asked questions</h2>
            <dl>
              {faq.map((item, i) => (
                <div key={i}>
                  <dt>
                    <h3>{item.q}</h3>
                  </dt>
                  <dd>
                    <p>{item.a}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {qb.topics && qb.topics.length > 0 && (
          <section aria-label="Topics discussed">
            <h2>Topics discussed</h2>
            <ul>
              {qb.topics.map((t, i) => (
                <li key={i}>
                  {t.url ? <Link href={t.url}>{t.name}</Link> : t.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {qb.related && qb.related.length > 0 && (
          <section aria-label="Related quick bites">
            <h2>Related</h2>
            <ul>
              {qb.related.map((r) => (
                <li key={r}>
                  <Link href={`/quick-bites/${r}`}>{r}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}

// Group consecutive `li` chunks into a single <ul>, render headings/paragraphs
// as their respective tags. Keeps document structure semantic.
function renderProse(chunks: { tag: "h2" | "h3" | "h4" | "p" | "li"; text: string }[]) {
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${key++}`}>
        {listBuffer.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const c of chunks) {
    if (c.tag === "li") {
      listBuffer.push(c.text);
      continue;
    }
    flushList();
    if (c.tag === "h2") out.push(<h2 key={`k-${key++}`}>{c.text}</h2>);
    else if (c.tag === "h3") out.push(<h3 key={`k-${key++}`}>{c.text}</h3>);
    else if (c.tag === "h4") out.push(<h4 key={`k-${key++}`}>{c.text}</h4>);
    else out.push(<p key={`k-${key++}`}>{c.text}</p>);
  }
  flushList();
  return out;
}
