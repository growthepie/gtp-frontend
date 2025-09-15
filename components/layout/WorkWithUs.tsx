// components/layout/WorkWithUs.tsx
"use client";
import { useState } from "react";
import ExpandableMenu, { ExpandableMenuItem, Placement } from "@/components/layout/FloatingBar/ExpandableMenu";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

type WorkWithUsProps = {
  placement: Placement;
  mobile?: boolean;
};

export default function WorkWithUs({ placement = "bottom-end", mobile = false }: WorkWithUsProps) {
  const [open, setOpen] = useState(false);

  const items: ExpandableMenuItem[] = [
    {
      id: "linkedin",
      label: "Connect on LinkedIn",
      href: "https://www.linkedin.com/company/growthepie/",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: <GTPIcon icon={"feather:linkedin" as GTPIconName} size="sm" />
    },
    {
      id: "discord",
      label: "Join our Discord",
      href: "https://discord.gg/fxjJFe7QyN",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: <GTPIcon icon={"discord-monochrome" as GTPIconName} size="sm" />
    },
    {
      id: "email",
      label: "Send an email",
      href: "mailto:contact@growthepie.com",
      icon: <GTPIcon icon={"gtp-message-monochrome" as GTPIconName} size="sm" />
    },
    {
      id: "form",
      label: "Want to get listed? Fill in the form.",
      href: "https://forms.office.com/e/wWzMs6Zc3A",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: <GTPIcon icon={"gtp-backgroundinformation-monochrome" as GTPIconName} size="sm" />
    },
  ];

  return (
    <div className={`relative pointer-events-auto shrink-0`}>
      <ExpandableMenu
        items={items}
        open={open}
        onOpenChange={setOpen}
        openOn="both"
        placement={placement}
        collapsedSize={{ width: mobile ? 44 : 170, height: 44 }}
        expandedSize={{ width: 286, height: 166 }}
        className="pointer-events-auto shrink-0"
        triggerClassName="!px-0 md:!px-[5px]"
        renderTrigger={({ open, props }) => (
          <button
            {...props}
            type="button"
            className={`relative flex items-center w-full h-full rounded-full overflow-hidden ${open ? '' : ''}`}
            aria-label="Notifications"
          >
            <GTPIcon 
              icon="gtp-socials" size="md"
              containerClassName={`!size-[44px] min-w-[44px] flex items-center justify-center`}
             />
            {/* <div className="heading-small-sm">Work with us</div> */}
            <div className={`heading-small-sm whitespace-nowrap ${open ? 'opacity-100' : 'opacity-0'} md:opacity-100 transition-opacity duration-500`}>
              Work with us
            </div>
          </button>
        )}
      />
    </div>
  );
}