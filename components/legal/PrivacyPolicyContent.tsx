import {
  privacyPolicyLastUpdated,
  privacyPolicySections,
} from "@/components/legal/privacyPolicyData";

type PrivacyPolicyContentProps = {
  headingClassName?: string;
  sectionClassName?: string;
};

export default function PrivacyPolicyContent({
  headingClassName = "text-[48px] mb-[30px] leading-snug",
  sectionClassName = "mb-8",
}: PrivacyPolicyContentProps) {
  return (
    <article itemScope itemType="https://schema.org/PrivacyPolicy">
      <header className="mb-8">
        <h1 className={headingClassName} itemProp="name">
          Privacy Policy &amp; Data Protection
        </h1>
        <p className="mb-4 text-sm text-color-text-secondary">
          Last updated:{" "}
          <time dateTime="2026-05-21" itemProp="dateModified">
            {privacyPolicyLastUpdated}
          </time>
        </p>
        <p className="mb-4" itemProp="description">
          This privacy policy explains how growthepie, operated by orbal GmbH,
          collects, uses, stores, and protects personal data in accordance with
          the General Data Protection Regulation.
        </p>
      </header>

      {privacyPolicySections.map((section) => (
        <section key={section.title} className={sectionClassName}>
          <h2 className="mb-3 text-2xl font-semibold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-4">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="list-disc space-y-2 pl-6">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
