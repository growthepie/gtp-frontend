import type { ReactNode } from "react";

/**
 * Renders a URL as "domain/rest", with the domain highlighted and the path muted.
 */
export const formatLinkText = (url: string): ReactNode => {
  const urlParts = url.split("/");
  let domain = url.includes("://") ? urlParts[2] : urlParts[0];
  const rest = urlParts.slice(3).join("/");

  domain = domain.replace("www.", "");

  return (
    <span className="text-color-text-primary">
      <span className="group-hover:underline">{domain}</span>
      <span className="text-forest-800 group-hover:underline">/{rest}</span>
    </span>
  );
};
