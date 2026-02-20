import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;

const toFirstString = (value: SearchParamValue): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0] || null;
  }
  return null;
};

export default async function LegacyProjectEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const mode = toFirstString(params.mode);
  const project = toFirstString(params.project);
  const website = toFirstString(params.website);
  const focus = toFirstString(params.focus);

  const targetBase = mode === "edit" || project ? "/applications/edit" : "/applications/add";
  const query = new URLSearchParams();

  if (project) {
    query.set("project", project);
  }
  if (website) {
    query.set("website", website);
  }
  if (focus) {
    query.set("focus", focus);
  }

  const target = query.toString() ? `${targetBase}?${query.toString()}` : targetBase;
  redirect(target);
}
