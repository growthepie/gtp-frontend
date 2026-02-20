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

export default async function LegacyProjectEditAddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const website = toFirstString(params.website);
  const query = new URLSearchParams();

  if (website) {
    query.set("website", website);
  }

  const target = query.toString() ? `/applications/add?${query.toString()}` : "/applications/add";
  redirect(target);
}
