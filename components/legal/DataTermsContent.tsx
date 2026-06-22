import {
  dataTermsLastUpdated,
  dataTermsLastUpdatedIso,
  dataTermsSections,
} from "@/components/legal/dataTermsData";

type DataTermsContentProps = {
  headingClassName?: string;
  sectionClassName?: string;
};

export default function DataTermsContent({
  headingClassName = "text-[48px] mb-[30px] leading-snug",
  sectionClassName = "mb-8",
}: DataTermsContentProps) {
  return (
    <article itemScope itemType="https://schema.org/CreativeWork">
      <header className="mb-8">
        <h1 className={headingClassName} itemProp="name">
          Data &amp; API Terms
        </h1>
        <p className="mb-4 text-sm text-color-text-secondary">
          Last updated:{" "}
          <time dateTime={dataTermsLastUpdatedIso} itemProp="dateModified">
            {dataTermsLastUpdated}
          </time>
        </p>
        <p className="mb-4" itemProp="description">
          These terms explain how growthepie data and public API outputs may be
          used, shared, attributed, and accessed.
        </p>
      </header>

      {dataTermsSections.map((section) => (
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
