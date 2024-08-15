// lib/apiRoot.ts
import { cookies } from "next/headers";
import { IS_PRODUCTION } from "./helpers";

export type ApiRoot = "v1" | "dev";
const API_ROOTS = ["v1", "dev"];

export function getApiRoot(): ApiRoot {
  // Server-side

  if (!IS_PRODUCTION) {
    const cookieStore = cookies();
    // return (cookieStore.get("apiRoot")?.value as ApiRoot) || "v1";
    let root = cookieStore.get("apiRoot")?.value || "v1";
    // root = JSON.parse(root);
    return API_ROOTS.includes(root) ? (root as ApiRoot) : "v1";
  }

  return "v1";
}

export async function apiFetch(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const apiRoot = getApiRoot();

  console.log("apiRootServer::url", url);
  let newUrl = url;
  if (url.includes("api.growthepie.xyz")) {
    newUrl = url.replace("/v1/", `/${apiRoot}/`);
  }

  console.log("apiRootServer::url", url);

  return fetch(newUrl, options);
  // const response = await fetch(newUrl, options);
  // if (!response.ok) {
  //   throw new Error(`HTTP error! status: ${response.status}`);
  // }
  // return response.json();
}
