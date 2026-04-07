import { redirect } from "next/navigation";
import {
  buildProjectEditHref,
  parseProjectEditIntent,
  type SearchParamValue,
} from "@/lib/project-edit-intent";

export default async function LegacyProjectEditAddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const intent = parseProjectEditIntent({
    pathname: "/labels/project-edit/add",
    params,
    defaultSource: "legacy",
  });

  redirect(
    buildProjectEditHref({
      mode: "add",
      source: intent.source,
      website: intent.website || undefined,
      start: intent.start,
      focus: intent.focus || undefined,
    }),
  );
}
