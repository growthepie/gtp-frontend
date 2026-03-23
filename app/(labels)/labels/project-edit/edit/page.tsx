import { redirect } from "next/navigation";
import {
  buildProjectEditHref,
  parseProjectEditIntent,
  type SearchParamValue,
} from "@/lib/project-edit-intent";

export default async function LegacyProjectEditEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const intent = parseProjectEditIntent({
    pathname: "/labels/project-edit/edit",
    params,
    defaultSource: "legacy",
  });

  redirect(
    buildProjectEditHref({
      mode: "edit",
      source: intent.source,
      project: intent.project || undefined,
      focus: intent.focus || undefined,
      start: intent.start,
    }),
  );
}
