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

export default async function LegacyProjectEditEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const project = toFirstString(params.project);
  const focus = toFirstString(params.focus);

  const query = new URLSearchParams();
  if (project) {
    query.set("project", project);
  }
  if (focus) {
    query.set("focus", focus);
  }

  const target = query.toString() ? `/applications/edit?${query.toString()}` : "/applications/edit";
  redirect(target);
}
