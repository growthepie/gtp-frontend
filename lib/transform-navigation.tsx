import { NavigationItem, navigationItems, navigationCategories } from '@/lib/navigation';
import { GTPIconName } from "@/icons/gtp-icon-names";
import { MasterResponse } from '@/types/api/MasterResponse';

// ----- NEW TYPES -----
// Normal link (can be top-level or sub-item)
export type SidebarLink = {
  type: 'link';
  label: string;
  icon: GTPIconName;
  href: string;
  isNew?: boolean;
  key?: string; // optional for normal links
};

// Section title within a group
export type SidebarSectionTitle = {
  type: 'title';
  label: string;
};

// Chain link subtype (explicit)
export type SidebarChainLink = {
  type: 'chain-link';
  label: string;
  icon: GTPIconName;
  href: string;
  isNew?: boolean;
  key: string; // chain key required
};

// Collapsible group of children
export type SidebarMenuGroup = {
  type: 'group';
  label: string;
  icon: GTPIconName;
  isNew?: boolean;
  children: (SidebarLink | SidebarChainLink | SidebarSectionTitle)[];
};

// A top-level item can be a direct link or a menu group
export type SidebarNavigationItem = SidebarLink | SidebarMenuGroup;

const BUCKET_ORDER = ['Layer 1', 'Arbitrum Orbit', 'Superchain', 'Others', 'Starkware', 'Based Rollups', 'Elastic Chain'];

export const transformNavigationToSidebar = (
  navItems: NavigationItem[],
  master?: MasterResponse
): SidebarNavigationItem[] => {
  return navItems.map((item): SidebarNavigationItem => {
    // Top-level direct link
    if (item.href) {
      return {
        type: 'link',
        label: item.label,
        icon: item.icon,
        href: item.href,
        isNew: item.newChild || false,
        key: item.key,
      } as SidebarLink;
    }

    // ---- Special bucketing for Chains → chain-link children
    if ((item.key === 'chains' || item.key === 'chains-rework') && master) {
      const children: (SidebarLink | SidebarChainLink | SidebarSectionTitle)[] = [];

      const chainsByBucket: { [bucket: string]: any[] } = Object.entries(master.chains).reduce(
        (acc, [chainKey, chainInfo]) => {
          if (!acc[chainInfo.bucket]) acc[chainInfo.bucket] = [];
          const navOption = item.options.find(opt => opt.key === chainKey);
          if (navOption && !navOption.hide) acc[chainInfo.bucket].push(navOption);
          return acc;
        },
        {} as { [bucket: string]: any[] }
      );

      const allBuckets = Object.keys(chainsByBucket);
      const knownBuckets = BUCKET_ORDER.filter(b => allBuckets.includes(b));
      const unknownBuckets = allBuckets.filter(b => !BUCKET_ORDER.includes(b)).sort();
      const finalBucketOrder = [...knownBuckets, ...unknownBuckets];

      finalBucketOrder.forEach(bucket => {
        const chainsInBucket = chainsByBucket[bucket];
        if (!chainsInBucket?.length) return;

        chainsInBucket.sort((a, b) => a.label.localeCompare(b.label));

        children.push({ type: 'title', label: bucket });

        chainsInBucket.forEach(option => {
          children.push({
            type: 'chain-link',               // <<< key change
            label: option.label,
            icon: option.icon,
            href: option.url || '#',
            isNew: option.showNew || false,
            key: option.key,                  // required
          } as SidebarChainLink);
        });
      });

      return {
        type: 'group',
        label: item.label,
        icon: item.icon,
        isNew: item.newChild || false,
        children,
      } as SidebarMenuGroup;
    }

    // ---- Default groups → normal link children + titled sections
    const children: (SidebarLink | SidebarChainLink | SidebarSectionTitle)[] = [];

    const categorized = new Map<string, typeof item.options>();
    const uncategorized: typeof item.options = [];
    item.options.forEach(option => {
      if (option.hide) return;
      if (option.category) {
        if (!categorized.has(option.category)) categorized.set(option.category, []);
        categorized.get(option.category)!.push(option);
      } else {
        uncategorized.push(option);
      }
    });

    // Uncategorized first
    uncategorized.forEach(option => {
      children.push({
        type: 'link',
        label: option.label,
        icon: option.icon,
        href: option.url || '#',
        isNew: option.showNew || false,
        key: option.key,
      } as SidebarLink);
    });

    // Categorized with section titles
    categorized.forEach((options, categoryKey) => {
      const categoryInfo = navigationCategories[categoryKey as keyof typeof navigationCategories];
      if (!categoryInfo) return;

      children.push({ type: 'title', label: categoryInfo.label });

      options.forEach(option => {
        children.push({
          type: 'link',
          label: option.label,
          icon: option.icon,
          href: option.url || '#',
          isNew: option.showNew || false,
          key: option.key,
        } as SidebarLink);
      });
    });

    return {
      type: 'group',
      label: item.label,
      icon: item.icon,
      isNew: item.newChild || false,
      children,
    } as SidebarMenuGroup;
  });
};

export const sidebarNavigationFromNav = transformNavigationToSidebar(navigationItems);
