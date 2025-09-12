import Link from 'next/link';
import { SidebarLink, SidebarChainLink } from '@/lib/transform-navigation';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { usePathname } from 'next/navigation';
import {
  useFloating,
  FloatingPortal,
  offset,
  shift,
  autoUpdate,
  hide,
  useHover,
  useInteractions,
  useDismiss
} from '@floating-ui/react';
import { useMaster } from '@/contexts/MasterContext';
import { useTooltipContext } from './Sidebar';

type SidebarMenuItemProps = {
  item: SidebarLink | SidebarChainLink; // <<< accept both
  isOpen: boolean;
  isTopLevel?: boolean;
  onClose?: () => void;
};

const SidebarMenuItem = ({ item, isOpen, isTopLevel = false, onClose }: SidebarMenuItemProps) => {
  const { href, icon, label } = item;
  const isChain = item.type === 'chain-link';            // <<< discriminant
  const chainKey = isChain ? item.key : undefined;

  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const tooltipId = href;
  const isTooltipOpen = activeTooltipId === tooltipId;

  const pathname = usePathname();
  const { AllChainsByKeys } = useMaster();
  const chainColors = chainKey && AllChainsByKeys?.[chainKey]?.colors ? AllChainsByKeys[chainKey].colors : null;
  const isActive = pathname === href;

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: isTooltipOpen,
    onOpenChange: (open) => setActiveTooltipId(open ? tooltipId : null),
    placement: 'right',
    middleware: [offset({ mainAxis: isChain ? -46 : -44 }), shift(), hide()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  const hover = useHover(context, { enabled: !isOpen });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);

  const textStyle = isTopLevel ? 'heading-large-md' : 'heading-large-xs';
  const containerHeight = isTopLevel ? 'h-[44px]' : 'h-[36px]';
  const containerPadding = isTopLevel ? 'pl-0' : 'pl-[3px]';
  const iconSize = isTopLevel ? 'md' : 'sm';
  const iconContainer = isTopLevel ? 'size-[38px]' : 'size-[26px] bg-[#151A19] rounded-full';
  const gap = isTopLevel ? 'gap-x-[5px]' : 'gap-x-[15px]';
  const chainItemClasses = !isTopLevel && isChain ? '!h-[26px] !pl-0 !pr-0 !ml-[3px]' : '';
  const baseClasses = `flex items-center w-full rounded-l-full md:rounded-r-none rounded-r-full transition-colors duration-100 ${containerHeight} ${containerPadding}`;
  const inactiveClasses = `text-forest-500 ${isOpen ? 'hover:bg-medium-background' : ''}`;
  const activeClasses = 'bg-[#151A19] text-white';

  const getIconColor = () => {
    if ((isActive || isTooltipOpen) && chainColors) return chainColors.dark[1];
    if (isTooltipOpen) return '#CDD8D3';
    return '#5a6462';
  };

  const TooltipContent = () => (
    <div className={`flex items-center rounded-full bg-medium-background ${containerHeight} ${containerPadding} ${chainItemClasses} flex ${gap} !pr-4`}>
      <div className={`relative rounded-full ${iconContainer}`}>
        <GTPIcon
          icon={icon}
          size={iconSize}
          style={{ color: getIconColor(), position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className={`h-[36px] flex items-center justify-between whitespace-nowrap ${textStyle}`}>
        {label}
      </div>
    </div>
  );

  return (
    <>
      <Link
        ref={refs.setReference}
        {...getReferenceProps()}
        href={href}
        className={`${baseClasses} ${chainItemClasses} ${isActive ? activeClasses : inactiveClasses} flex ${gap}`}
        onClick={onClose}
      >
        <div className={`relative rounded-full ${iconContainer}`}>
          <GTPIcon
            icon={icon}
            size={iconSize}
            style={{ color: getIconColor(), position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className={`flex-1 h-[36px] flex items-center justify-between whitespace-nowrap ${textStyle} overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {label}
        </div>
      </Link>

      <FloatingPortal>
        {context.open && !middlewareData.hide?.referenceHidden && (
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, pointerEvents: 'none' }}
            className="z-50"
          >
            <TooltipContent />
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default SidebarMenuItem;
