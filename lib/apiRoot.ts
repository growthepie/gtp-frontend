"use client";
import { IS_PRODUCTION } from "./helpers";

export type ApiRoot = "v1" | "dev";

export function getApiRoot(): ApiRoot {
  if (!IS_PRODUCTION && typeof window !== "undefined") {
    // Client-side
    // return JSON.parse(localStorage.getItem("apiRoot") || "v1") as ApiRoot;
    let root = localStorage.getItem("apiRoot");
    root = typeof root === "string" ? JSON.parse(root) : root;
    return root ? (root as ApiRoot) : "v1";
  }

  return "v1";
}

export async function apiFetch(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const apiRoot = getApiRoot();

  let newUrl = url;
  console.log("apiRoot::url", url);
  if (url.includes("api.growthepie.xyz")) {
    newUrl = url.replace("/v1/", `/${apiRoot}/`);
  }

  console.log("apiRoot::url", url);
  return fetch(newUrl, options);
  // const response = await fetch(newUrl, options);
  // if (!response.ok) {
  //   throw new Error(`HTTP error! status: ${response.status}`);
  // }
  // return response.json();
}
