import { headers } from "next/headers";
import Link from "next/link";
import { getSeoSummaryEntry, type SeoSummaryEntry } from "@/lib/seo-summaries";

const SEO_ROUTE_PATTERNS = [
  {
    family: "chains" as const,
    label: "Chains",
    href: "/chains",
    pattern: /^\/chains\/([^/?#]+)\/?$/,
  },
  {
    family: "fundamentals" as const,
    label: "Fundamentals",
    href: "/fundamentals",
    pattern: /^\/fundamentals\/([^/?#]+)\/?$/,
  },
  {
    family: "apps" as const,
    label: "Applications",
    href: "/applications",
    pattern: /^\/applications\/(?!add\/?$|edit\/?$)([^/?#]+)\/?$/,
  },
];

const getRouteMatch = (pathname: string) => {
  for (const route of SEO_ROUTE_PATTERNS) {
    const match = pathname.match(route.pattern);
    if (match?.[1]) {
      return {
        ...route,
        slug: match[1],
      };
    }
  }

  return null;
};

const renderFacts = (facts?: string[]) => {
  const validFacts = facts?.filter((fact) => typeof fact === "string" && fact);
  if (!validFacts?.length) return null;

  return (
    <section aria-label="Key facts">
      <h2>Key facts</h2>
      <ul>
        {validFacts.map((fact, index) => (
          <li key={index}>{fact}</li>
        ))}
      </ul>
    </section>
  );
};

const renderSources = (sourceUrls?: string[]) => {
  const urls = sourceUrls?.filter((url) => typeof url === "string" && url);
  if (!urls?.length) return null;

  return (
    <section aria-label="Data sources">
      <h2>Data sources</h2>
      <ul>
        {urls.map((url) => (
          <li key={url}>
            <a href={url}>{url}</a>
          </li>
        ))}
      </ul>
    </section>
  );
};

const SummaryArticle = ({
  entry,
  sectionLabel,
  sectionHref,
}: {
  entry: SeoSummaryEntry;
  sectionLabel: string;
  sectionHref: string;
}) => {
  const title = entry.title || `${entry.name} analytics`;

  return (
    <article itemScope itemType="https://schema.org/WebPage">
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href={sectionHref}>{sectionLabel}</Link>
          </li>
          <li>{entry.name}</li>
        </ol>
      </nav>

      <header>
        <h1 itemProp="name">{title}</h1>
        {entry.summary && <p itemProp="description">{entry.summary}</p>}
        {entry.canonical_url && (
          <p>
            <a href={entry.canonical_url} rel="canonical">
              View live data on growthepie
            </a>
          </p>
        )}
        {entry.last_updated_utc && (
          <p>
            Last updated:{" "}
            <time dateTime={entry.last_updated_utc}>
              {entry.last_updated_utc}
            </time>
          </p>
        )}
      </header>

      {renderFacts(entry.facts)}

      {entry.methodology && (
        <section aria-label="Methodology">
          <h2>Methodology</h2>
          <p>{entry.methodology}</p>
        </section>
      )}

      {renderSources(entry.source_urls)}
    </article>
  );
};

export default async function SeoSummaryRouteStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const routeMatch = getRouteMatch(pathname);
  if (!routeMatch) return null;

  const entry = await getSeoSummaryEntry(routeMatch.family, routeMatch.slug);
  if (!entry) return null;

  return (
    <div
      id={`${routeMatch.family}-seo-summary-static-shell`}
      className="sr-only"
      aria-hidden="true"
      data-prerender={`${routeMatch.family}-seo-summary`}
    >
      <SummaryArticle
        entry={entry}
        sectionLabel={routeMatch.label}
        sectionHref={routeMatch.href}
      />
    </div>
  );
}
