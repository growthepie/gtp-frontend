"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import { QUICK_BITE_TOPICS, QuickBiteTopicKey, getQuickBiteTopicUrl } from "@/lib/quick-bites/themes";

/**
 * The Quick Bites topic tab bar ("All" + every topic). Each button opens its topic page
 * (/quick-bites or /quick-bites/topic/<key>), keeping `queryString` (active filters).
 * Used on /quick-bites, the topic pages and the landing page.
 */
export default function QuickBitesTopicBar({
  activeTopic,
  queryString = "",
}: {
  /** Highlighted button; null highlights none (e.g. on the landing page). */
  activeTopic: QuickBiteTopicKey | "all" | null;
  queryString?: string;
}) {
  const router = useRouter();

  // The topic pages are small and static: prefetch them so switching is instant.
  useEffect(() => {
    router.prefetch("/quick-bites");
    QUICK_BITE_TOPICS.forEach((topic) => router.prefetch(getQuickBiteTopicUrl(topic.key)));
  }, [router]);

  const goTo = (key: QuickBiteTopicKey | "all") => {
    if (key === activeTopic) return;
    const path = key === "all" ? "/quick-bites" : getQuickBiteTopicUrl(key);
    // Within Quick Bites the bar stays where it is; from elsewhere, open at the top.
    router.push(queryString ? `${path}?${queryString}` : path, { scroll: activeTopic === null });
  };

  return (
    // The buttons always fill the bar's width (also each row once it wraps).
    <GTPButtonContainer>
      <GTPButtonRow wrap className="flex-auto [&>*]:flex-1 [&>*>button]:w-full">
        <GTPButton label="All" size="sm" isSelected={activeTopic === "all"} clickHandler={() => goTo("all")} />
        {QUICK_BITE_TOPICS.map((topic) => (
          <GTPButton
            key={topic.key}
            label={topic.shortLabel ?? topic.label}
            size="sm"
            isSelected={activeTopic === topic.key}
            clickHandler={() => goTo(topic.key)}
          />
        ))}
      </GTPButtonRow>
    </GTPButtonContainer>
  );
}
