import { getPageMetadata } from "@/lib/metadata";
import { getAllProjectsMetadata } from "@/lib/projects-metadata";
import { serializeJsonLd } from "@/utils/json-ld";

type Props = { params: { owner_project: string } };

const normalizeValue = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return undefined;
  return trimmed;
};

export default async function Head({ params }: Props) {
  const ownerProject = params.owner_project;

  let projectName = ownerProject;
  let projectDescription: string | undefined;
  let projectWebsite: string | undefined;
  let projectTwitter: string | undefined;
  let projectGithub: string | undefined;
  let projectLogoPath: string | undefined;
  let projectMainCategory: string | undefined;
  let projectSubCategory: string | undefined;

  try {
    const projects = await getAllProjectsMetadata();
    const project = projects[ownerProject];
    if (project) {
      projectName = project.displayName || ownerProject;
      projectDescription = normalizeValue(project.description);
      projectWebsite = normalizeValue(project.website);
      projectTwitter = normalizeValue(project.twitter);
      projectGithub = normalizeValue(project.mainGithub);
      projectLogoPath = normalizeValue(project.logoPath);
      projectMainCategory = normalizeValue(project.mainCategory);
      projectSubCategory = normalizeValue(project.subCategory);
    }
  } catch {}

  const metadata = await getPageMetadata("/applications/[slug]", {
    name: projectName,
  });

  const canonical = `https://www.growthepie.com/applications/${ownerProject}`;
  const description = projectDescription || metadata.description;
  const appId = `${canonical}#app`;

  const sameAs = [
    projectWebsite,
    projectTwitter ? `https://x.com/${projectTwitter}` : undefined,
    projectGithub ? `https://github.com/${projectGithub}` : undefined,
  ].filter(Boolean) as string[];

  const applicationCategory = [
    projectMainCategory,
    projectSubCategory,
  ].filter(Boolean) as string[];

  const appEntity = {
    "@type": "SoftwareApplication",
    "@id": appId,
    name: projectName,
    description,
    ...(projectWebsite ? { url: projectWebsite } : {}),
    ...(projectLogoPath
      ? { image: `https://api.growthepie.com/v1/apps/logos/${projectLogoPath}` }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(applicationCategory.length ? { applicationCategory } : {}),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": "https://www.growthepie.com/#website",
    },
    mainEntity: {
      "@id": appId,
    },
    inLanguage: "en",
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.growthepie.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Applications",
        item: "https://www.growthepie.com/applications",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: projectName,
        item: canonical,
      },
    ],
  };

  const graphs = [webPage, breadcrumbs, appEntity];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
    </>
  );
}
