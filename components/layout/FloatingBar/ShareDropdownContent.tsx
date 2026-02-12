"use client";

import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../GTPIcon";

type ShareDropdownContentProps = {
  onClose: () => void;
};

const itemClassName = "flex w-full items-center gap-x-[10px] justify-start text-sm font-semibold hover:bg-color-ui-hover px-[22px] py-[5px] transition-colors duration-200";

export default function ShareDropdownContent({ onClose }: ShareDropdownContentProps) {
  const getCurrentUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const handleCopyLink = async () => {
    const currentUrl = getCurrentUrl();
    if (!currentUrl) {
      onClose();
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      // Intentionally swallow clipboard errors to avoid blocking dropdown close.
    } finally {
      onClose();
    }
  };

  const openShareTarget = (builder: (url: string) => string) => {
    const currentUrl = getCurrentUrl();
    if (!currentUrl || typeof window === "undefined") {
      onClose();
      return;
    }

    window.open(builder(currentUrl), "_blank", "noopener,noreferrer");
    onClose();
  };

  const items: {
    id: string;
    label: string;
    icon: GTPIconName;
    onClick: () => void;
  }[] = [
    {
      id: "copy-link",
      label: "Copy Link",
      icon: "gtp-copy-monochrome",
      onClick: handleCopyLink,
    },
    {
      id: "share-email",
      label: "Share via Email",
      icon: "gtp-email-monochrome",
      onClick: () =>
        openShareTarget((currentUrl) =>
          `mailto:?subject=${encodeURIComponent("Check out this chart on growthepie")}&body=${encodeURIComponent(currentUrl)}`,
        ),
    },
    {
      id: "share-x",
      label: "Share on X",
      icon: "x-monochrome",
      onClick: () =>
        openShareTarget((currentUrl) =>
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(
            "Check out this chart on growthepie",
          )}`,
        ),
    },
    {
      id: "share-reddit",
      label: "Share on Reddit",
      icon: "reddit-monochrome",
      onClick: () =>
        openShareTarget((currentUrl) =>
          `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(
            "Check out this chart on growthepie",
          )}`,
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-y-[2px] py-[10px]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={itemClassName}
          onClick={item.onClick}
        >
          <GTPIcon
            icon={item.icon}
            className="!h-[16px] !w-[16px]"
            containerClassName="!h-[16px] !w-[16px]"
          />
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
