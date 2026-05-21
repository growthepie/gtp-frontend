// Server Component that emits crawler-readable privacy-policy content before
// the interactive app shell. This keeps legal/trust text visible to raw HTML
// crawlers that do not execute JavaScript or parse the RSC stream.

import { headers } from "next/headers";
import Link from "next/link";
import {
  privacyPolicyLastUpdated,
  privacyPolicyLastUpdatedIso,
  privacyPolicySections,
} from "@/components/legal/privacyPolicyData";

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

export default async function PrivacyPolicyStaticShell() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  if (pathname !== "/privacy-policy") return null;

  return (
    <div
      id="privacy-policy-static-shell"
      aria-hidden="true"
      style={SR_ONLY}
      data-prerender="privacy-policy"
    >
      <nav aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>Privacy Policy</li>
        </ol>
      </nav>

      <article itemScope itemType="https://schema.org/PrivacyPolicy">
        <header>
          <h1 itemProp="name">Privacy Policy and Data Protection</h1>
          <p>
            Last updated:{" "}
            <time dateTime={privacyPolicyLastUpdatedIso} itemProp="dateModified">
              {privacyPolicyLastUpdated}
            </time>
          </p>
          <p itemProp="description">
            This privacy policy explains how growthepie, operated by orbal
            GmbH, collects, uses, stores, and protects personal data in
            accordance with the General Data Protection Regulation.
          </p>
          <p>
            Canonical URL:{" "}
            <Link href="https://www.growthepie.com/privacy-policy">
              https://www.growthepie.com/privacy-policy
            </Link>
          </p>
        </header>

        {privacyPolicySections.map((section) => (
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
