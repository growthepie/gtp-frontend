"use client";
import { cloneElement, isValidElement, memo, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import Link from "next/link";
import Image from "next/image";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useSearchParams } from "next/navigation";
import { getGTPTooltipContainerClass, GTP_TOOLTIP_SIZE_CLASS_MAP, GTPTooltipSize } from "./tooltipShared";

import { computePosition, flip, shift, offset, arrow, Placement, autoUpdate } from '@floating-ui/dom';
import { FloatingPortal, safePolygon, useDismiss, useFloating, useHover, useInteractions, useMergeRefs, useRole } from "@floating-ui/react";
import { CSSTransition } from "react-transition-group";

const APPLICATION_LINK_PREFIXES = ["", "https://x.com/", "https://github.com/"] as const;
const APPLICATION_LINK_ICONS = ["feather:monitor", "ri:twitter-x-fill", "ri:github-fill"] as const;
const APPLICATION_LINK_KEYS = ["website", "twitter", "main_github"] as const;

interface GTPTooltipNewProps {
  children: ReactNode;
  size?: GTPTooltipSize;
  triggerElement?: HTMLElement | null;
  positionOffset?: {
    mainAxis: number;
    crossAxis: number;
  }
  isOpen?: boolean;
  trigger?: ReactNode;
  defaultOpen?: boolean;
  placement?: Placement;
  portalId?: string;
  enableHover?: boolean;
  allowInteract?: boolean;
  containerClass?: string;
  unstyled?: boolean;
  // New animation props
  animationDuration?: number;
  onOpenChange?: (open: boolean) => void;
}

export const GTPTooltipNew = ({
  children,
  size = "sm",
  containerClass = "",
  triggerElement,
  positionOffset = { mainAxis: 0, crossAxis: 0 },
  isOpen: controlledIsOpen,
  trigger,
  defaultOpen = false,
  placement = "bottom-start",
  portalId = "tooltip-portal",
  enableHover = true,
  allowInteract = true,
  unstyled = false,
  onOpenChange,
}: GTPTooltipNewProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

  // Ref for the tooltip node itself, required by CSSTransition
  const tooltipNodeRef = useRef<HTMLDivElement | null>(null); // <-- Add ref for tooltip node

  const handleOpenChange = (nextOpen: boolean) => {
    // call onOpenChange if it is defined
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
    
    // if controlledIsOpen is undefined, update uncontrolledIsOpen
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(nextOpen);
    }
    // Note: If you have a controlled component, the parent needs to handle the open state change
    // and pass the new `isOpen` prop down for the animation to trigger.
  };

  const { refs, floatingStyles, context, update } = useFloating({
    open: isOpen,
    placement,
    middleware: [
      offset({
        mainAxis: positionOffset.mainAxis,
        crossAxis: positionOffset.crossAxis,
      }),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
    onOpenChange: handleOpenChange,
  });

  useEffect(() => {
    if (!triggerElement) {
      return;
    }

    refs.setReference(triggerElement);
    update();
  }, [triggerElement, refs, update]);

  const hover = useHover(context, {
    enabled: enableHover,
    move: false,
    handleClose: allowInteract ? safePolygon() : undefined,
    delay: { open: 0, close: allowInteract ? 50 : 0 },
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    referencePress: !allowInteract,
    escapeKey: true,
  });

  const role = useRole(context, {
    role: allowInteract ? "dialog" : "tooltip",
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  // Manual handlers (unchanged, but their effect on `isOpen` now triggers animation)
  const manualTriggerProps = {
      onMouseEnter: (e: React.MouseEvent) => {
          if (enableHover && controlledIsOpen === undefined) {
              // Check if the tooltip is not already open or entering
              // Use context.open instead of isOpen directly here for better sync with floating-ui state
              if (!context.open) {
                  setUncontrolledIsOpen(true);
              }
          }
      },
      onMouseLeave: (e: React.MouseEvent) => {
          // floating-ui's useHover handles mouse leave with delay and safePolygon better
          // We can rely on useHover's onOpenChange for closing in hover scenarios
      },
      onClick: (e: React.MouseEvent) => {
          if (controlledIsOpen === undefined) {
              setUncontrolledIsOpen(prev => !prev);
          }
      }
  };


  // Tooltip content renderer function
  const renderTooltipContent = () => (
    <FloatingPortal id={portalId}>
      <CSSTransition
        in={isOpen} // Control the transition based on the `isOpen` state
        nodeRef={tooltipNodeRef} // Pass the ref of the actual element being animated
        timeout={100} // Duration in ms (should match CSS transition duration)
        classNames="tooltip-fade" // Prefix for CSS classes (e.g., tooltip-fade-enter, tooltip-fade-exit-active)
        mountOnEnter // Add the element to the DOM only when entering
        unmountOnExit // Remove the element from the DOM after exiting
      >
        <div
          ref={(node) => { // <-- Assign ref here AND to floating-ui
            tooltipNodeRef.current = node;
            refs.setFloating(node);
          }}
          style={floatingStyles}
          className={`${unstyled ? containerClass : `${getGTPTooltipContainerClass(size)} ${containerClass}`} z-50`}
          {...getFloatingProps({
            // No need for onMouseLeave here anymore if allowInteract is false,
            // useHover + CSSTransition handles it
          })}
        >
          {children}
        </div>
      </CSSTransition>
    </FloatingPortal>
  );

  const triggerRef = isValidElement(trigger)
    ? ((trigger as any).ref as React.Ref<HTMLElement> | undefined)
    : undefined;
  const mergedTriggerRef = useMergeRefs<HTMLElement>([refs.setReference, triggerRef]);

  // --- Trigger Handling ---
  if (trigger) {
    if (!isValidElement(trigger)) {
      console.error("Tooltip trigger must be a valid React element");
      return null;
    }

    const clonedTrigger = cloneElement(
      trigger,
      {
        ref: mergedTriggerRef,
        onMouseEnter: (e: React.MouseEvent) => {
          // Handle hover manually since getReferenceProps handler isn't working
          if (enableHover && !isOpen) {
            handleOpenChange(true);
          }
          // Call original handler if it exists
          (trigger as React.ReactElement<any>).props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          if (enableHover && !allowInteract) {
            handleOpenChange(false);
          }
          // Call original handler if it exists
          (trigger as React.ReactElement<any>).props.onMouseLeave?.(e);
        },
        onClick: (e: React.MouseEvent) => {
          if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(prev => !prev);
          }
          // Call original handler if it exists
          (trigger as React.ReactElement<any>).props.onClick?.(e);
        },
      } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> }
    );

    return (
      <>
        {clonedTrigger}
        {renderTooltipContent()} {/* Use the render function */}
      </>
    );
  }

  // Regular non-wrapping tooltip pattern (Should not be reached if triggerElement is always provided)
  // This pattern is less common with floating-ui v1 where the reference needs to be managed.
  // If you intend to use this, ensure `triggerElement` is valid.
  if (!triggerElement) {
      console.warn("GTPTooltipNew used without a trigger or triggerElement. Tooltip cannot be positioned.");
      return null; // Or render children only? Decide based on expected usage.
  }

  // If triggerElement is provided directly (no wrapping)
  // We assume the triggerElement already has the necessary props applied externally
  // via getReferenceProps() or manual handlers that call setUncontrolledIsOpen/control isOpen.
  return renderTooltipContent(); // Use the render function
};
interface TooltipProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TooltipSizeClassMap = {
  sm: GTP_TOOLTIP_SIZE_CLASS_MAP.sm,
  md: GTP_TOOLTIP_SIZE_CLASS_MAP.md,
  lg: GTP_TOOLTIP_SIZE_CLASS_MAP.lg,
}

export const Tooltip = ({ children, size = "sm", className }: TooltipProps) => {
  return (
    <div className={`flex flex-col gap-y-[5px] ${TooltipSizeClassMap[size]} py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default text-color-text-primary text-xs shadow-standard ${className}`}>
      {children}
    </div>
  );
};

export default Tooltip;


type TooltipHeaderProps = {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  rightIcon?: React.ReactNode;
  href?: string;
}

export const TooltipHeader = ({ title, icon, className, rightIcon, href }: TooltipHeaderProps) => {
  if(href) {
    return (
      <Link href={href} className={`flex w-full gap-x-[10px] pl-[20px] h-[18px] items-center ${className}`}>
        {icon && <>{icon}</>}
        {title && <div className="heading-small-xs h-[18px] flex items-center">{title}</div>}
        {rightIcon && <>{rightIcon}</>}
      </Link>
    );
  }
  return (
    <div className={`flex w-full gap-x-[10px] pl-[20px] h-[18px] items-center ${className}`}>
      {icon && <>{icon}</>}
      {title && <div className="heading-small-xs h-[18px] flex items-center">{title}</div>}
      {rightIcon && <>{rightIcon}</>}
    </div>
  );
};

type TooltipBodyProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const TooltipBody = ({ children, className, onClick }: TooltipBodyProps) => {
  let stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  }
  return (
    <div className={`flex flex-col w-full ${className}`} onClick={onClick ? onClick : stopPropagation}>
      {children}
    </div>
  );
};


type TooltipFooterProps = {
  children: React.ReactNode;
  className?: string;
}

export const TooltipFooter = ({ children, className }: TooltipFooterProps) => {
  return <div className={`flex flex-col w-full ${className}`}>{children}</div>;
};


export const ExampleTooltip = () => {
  return (
    <Tooltip size="lg">
      <TooltipHeader title="Total Ethereum Ecosystem" icon={<GTPIcon icon="gtp-metrics-ethereum-ecosystem" size="sm" />} />
      <TooltipBody>
        <div className="pl-[20px]">Network maturity as introduced by ethereum.org. We review the network's progress towards Ethereum alignment (rollup stages 0-2), total value secured (TVS), time live in production, and risk considerations. These levels help track network development and provide a standardized way for the community to evaluate progress.</div>
      </TooltipBody>
      <TooltipFooter>
        <div className="pl-[20px]">Find out more <Link href="https://ethereum.org/en/networks/networks-maturity/" target="_blank" className="underline">here</Link>.</div>
      </TooltipFooter>
    </Tooltip>
  );
};



type OLIContractTooltipProps = {
  icon: GTPIconName;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  project_name: string;
  message?: string | React.ReactNode;
  href?: string;
  contractAddress?: string;
  chain?: string | number;
}

export const OLIContractTooltip = ({ icon, project_name, iconClassName, iconStyle, message="Contract information not available.", href, contractAddress, chain }: OLIContractTooltipProps) => {
  // Generate the OLI attestation URL with contract address and chain parameters
  const generateOLIUrl = () => {
    if (contractAddress && chain) {
      const baseURL = 'https://www.openlabelsinitiative.org/attest';
      const params = new URLSearchParams({
        address: contractAddress,
        chain: chain.toString()
      });
      return `${baseURL}?${params.toString()}#single-attestation`;
    }
    return 'https://www.openlabelsinitiative.org/attest';
  };

  const attestationUrl = href || generateOLIUrl();

  return (
    <>
      <TooltipHeader title={project_name} icon={
        <div className="size-[24px] flex items-center justify-center rounded-full bg-color-ui-active">
          <GTPIcon icon={icon} size="sm" className={iconClassName} style={iconStyle} />
        </div>
        } />
      <TooltipBody>
        <div className="pl-[20px]">{message}</div>
      </TooltipBody>
      <TooltipFooter className="h-[64px] flex flex-col justify-end">
        <div className="pl-[20px] flex flex-col gap-y-[5px]">
          <div className="text-xxs">Are you the developer or you know the project's contracts?</div>
          {/* OLI Button */}
          <Link href={attestationUrl} target="_blank" className="mx-auto flex items-center justify-center p-[1px] rounded-full bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)] w-fit h-[24px]">
            <div className="flex items-center pl-[15px] pr-[5px] gap-x-[8px] h-full bg-forest-50 dark:bg-forest-900 rounded-full transition-all duration-300" style={{ width: "fit-content" }}>
              <div className="whitespace-nowrap overflow-hidden heading-small-xxs">
                {contractAddress && chain ? 'Attest this contract' : 'See more here.'}
              </div>
              <div className="size-[15px] bg-color-bg-medium rounded-full flex items-center justify-center">
                <div className="size-[15px] flex items-center justify-center">
                  <GTPIcon icon={"feather:arrow-right" as GTPIconName} size="sm" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </TooltipFooter>
    </>
  );
}

type GTPApplicationTooltipProps = {
  owner_project?: string;
  project_name?: string;
}


export const GTPApplicationTooltip = memo(({ owner_project, project_name }: GTPApplicationTooltipProps) => {
  const { ownerProjectToProjectData, projectNameToProjectData } = useProjectsMetadata();

  const projectData = useMemo(() => {
    if (owner_project) return ownerProjectToProjectData[owner_project];
    if (project_name) return projectNameToProjectData[project_name];
    return null;
  }, [owner_project, project_name, ownerProjectToProjectData, projectNameToProjectData]);

  const descriptionPreview = useMemo(() => {
    if (!projectData || !projectData.description) return "";
    const chars = projectData.description.length;
    const firstPart = projectData.description.slice(0, Math.min(100, chars));

    return firstPart.split(" ").slice(0, -1).join(" ");

  }, [projectData]);

  // console.log(projectData, owner_project, project_name);

  if (!projectData) return null;

  return (
    <>
      <TooltipHeader
        title={projectData.display_name}
        icon={
          projectData.logo_path ? (
            <Image
              src={`https://api.growthepie.com/v1/apps/logos/${projectData.logo_path}`}
              width={15}
              height={15}
              className="select-none rounded-full"
              alt={projectData.display_name}
              onDragStart={(e) => e.preventDefault()}
              loading="eager"
              priority={true}
            />
          ) : (
            <div className={`flex items-center justify-center size-[15px] bg-color-ui-active rounded-full`}>
              <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[12px] text-[#5A6462]" containerClassName="flex items-center justify-center" />
            </div>
          )
        }
        rightIcon={
          projectData.on_apps_page ? (
            <div className="flex flex-1 items-center justify-end">
              <div className="size-[18px] bg-color-bg-medium rounded-full flex items-center justify-center">
                <GTPIcon icon={"feather:arrow-right" as GTPIconName} size="sm" />
              </div>
            </div>
          ) : null
        }
        href={projectData.on_apps_page ? `/applications/${projectData.owner_project}` : undefined}
      />
      <TooltipBody className="pl-[20px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="text-xs">
            {descriptionPreview}...
          </div>
        </div>
      </TooltipBody>
      <TooltipFooter className="flex items-start pl-[20px]">
        <GTPApplicationLinks owner_project={projectData.owner_project} showUrl={true} />
      </TooltipFooter>
    </>
  );
});

GTPApplicationTooltip.displayName = 'GTPApplicationTooltip';

export const GTPApplicationLinks = memo(({ owner_project, showUrl}: { owner_project: string, showUrl?: boolean }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  
  // default hover key should be the first link that is not empty
  const defaultHoverKey = useMemo(() => {
    if (!ownerProjectToProjectData[owner_project]) return "website";
    return (
      APPLICATION_LINK_KEYS.find((key) => ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project][key]) ||
      "website"
    );
  }, [ownerProjectToProjectData, owner_project]);

  const [currentHoverKey, setCurrentHover] = useState(defaultHoverKey);

  const formatUrl = (url: string) => {
    // remove https:// and trailing slash
    return url.replace("https://", "").replace(/\/$/, "");
  }

  if(!ownerProjectToProjectData[owner_project]) return null;
  
  if(showUrl) {
    return (
    <div className="flex flex-col gap-y-[5px]">
      <div className="flex items-center gap-x-[5px]" onMouseLeave={() => setCurrentHover(defaultHoverKey)}>
      {ownerProjectToProjectData[owner_project] && APPLICATION_LINK_KEYS.map((key, index) => {
        if(!ownerProjectToProjectData[owner_project][key]) return null;

        return (
        <div key={index} className="h-[15px] w-[15px]" onMouseEnter={() => setCurrentHover(key)}>
          {ownerProjectToProjectData[owner_project][key] && <Link
            href={`${APPLICATION_LINK_PREFIXES[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
          >
            <GTPIcon
              icon={APPLICATION_LINK_ICONS[index] as GTPIconName}
              size="sm"
              className="select-none"
            />
          </Link>}
        </div>
        )
      })}
      </div>
      <div className="text-xxs text-[#5A6462]">
        {`${formatUrl(
          APPLICATION_LINK_PREFIXES[APPLICATION_LINK_KEYS.indexOf(currentHoverKey as (typeof APPLICATION_LINK_KEYS)[number])] +
            ownerProjectToProjectData[owner_project][currentHoverKey],
        ).replace("https://", "")}`}
      </div>
    </div>
    );
  }

  return (
    <div className="flex items-center gap-x-[5px]">
      {ownerProjectToProjectData[owner_project] && APPLICATION_LINK_KEYS.map((key, index) => (
        <div key={index} className="h-[15px] w-[15px]">
          {ownerProjectToProjectData[owner_project][key] && <Link
            href={`${APPLICATION_LINK_PREFIXES[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
          >
            <GTPIcon
              icon={APPLICATION_LINK_ICONS[index] as GTPIconName}
              size="sm"
              className="select-none"
            />
          </Link>}
        </div>
      ))}
    </div>
  );
});

GTPApplicationLinks.displayName = 'GTPApplicationLinks';
