// Server Component that emits crawler-readable data-terms content before the
// interactive app shell.

import { headers } from "next/headers";
import Link from "next/link";
import {
  dataTermsLastUpdated,
  dataTermsLastUpdatedIso,
  dataTermsSections,
} from "@/components/legal/dataTermsData";

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

export default async function DataTermsStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  if (pathname !== "/data-terms") return null;

  return (
    <div
      id="data-terms-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="data-terms"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Data and API Terms</li>
        </ol>
      </nav>

      <article itemScope itemType="https://schema.org/CreativeWork">
        <header>
          <h1 itemProp="name">Data and API Terms</h1>
          <p>
            Last updated:{" "}
            <time dateTime={dataTermsLastUpdatedIso} itemProp="dateModified">
              {dataTermsLastUpdated}
            </time>
          </p>
          <p itemProp="description">
            These terms explain how growthepie data and public API outputs may
            be used, shared, attributed, and accessed.
          </p>
          <p>
            Canonical URL:{" "}
            <Link href="https://www.growthepie.com/data-terms">
              https://www.growthepie.com/data-terms
            </Link>
          </p>
        </header>

        {dataTermsSections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
