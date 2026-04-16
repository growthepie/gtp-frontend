import { redirect } from "next/navigation";
import {
  buildProjectEditHref,
  parseProjectEditIntent,
  type SearchParamValue,
} from "@/lib/project-edit-intent";

export default async function LegacyProjectEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const intent = parseProjectEditIntent({
    pathname: "/labels/project-edit",
    params,
    defaultSource: "legacy",
  });

  redirect(
    buildProjectEditHref({
      mode: intent.mode,
      source: intent.source,
      project: intent.project || undefined,
      website: intent.website || undefined,
      focus: intent.focus || undefined,
      start: intent.start,
    }),
  );
}
