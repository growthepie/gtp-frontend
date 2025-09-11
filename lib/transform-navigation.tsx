import { NavigationItem, navigationItems, navigationCategories } from '@/lib/navigation';

import { GTPIconName } from "@/icons/gtp-icon-names";
import { MasterResponse } from '@/types/api/MasterResponse';

// Represents a single link in the sidebar
export type SidebarLink = {
  type: 'link';
  label: string;
  icon: GTPIconName;
  href: string;
  isNew?: boolean;
};

// Represents a section title within a menu group
export type SidebarSectionTitle = {
    type: 'title';
    label:string;
};

// Represents a collapsible group of links
export type SidebarMenuGroup = {
  type: 'group';
  label: string;
  icon: GTPIconName;
  isNew?: boolean;
  // Children can be links or section titles
  children: (SidebarLink | SidebarSectionTitle)[];
};

// A top-level item can be a direct link or a menu group
export type SidebarNavigationItem = SidebarLink | SidebarMenuGroup;

const BUCKET_ORDER = ['Layer 1', 'Arbitrum Orbit', 'Superchain', 'Others', 'Starkware', 'Based Rollups', 'Elastic Chain'];

// Transform navigation.tsx data into sidebar-navigation.tsx format
export const transformNavigationToSidebar = (navItems: NavigationItem[], master?: MasterResponse): SidebarNavigationItem[] => {
  return navItems.map((item): SidebarNavigationItem => {
    // If item has href, it's a direct link (regardless of options)
    if (item.href) {
      return {
        type: 'link',
        label: item.label,
        icon: item.icon,
        href: item.href,
        isNew: item.newChild || false,
      } as SidebarLink;
    }

    // --- START: Special bucketing logic for Chains ---
    if ((item.key === 'chains' || item.key === 'chains-rework') && master) {
      const children: (SidebarLink | SidebarSectionTitle)[] = [];

      // Group master.chains by bucket (this part is unchanged)
      const chainsByBucket: { [bucket: string]: any[] } = Object.entries(master.chains).reduce(
        (acc, [chainKey, chainInfo]) => {
          if (!acc[chainInfo.bucket]) {
            acc[chainInfo.bucket] = [];
          }
          const navOption = item.options.find(opt => opt.key === chainKey);
          if (navOption && !navOption.hide) {
            acc[chainInfo.bucket].push(navOption);
          }
          return acc;
        },
        {} as { [bucket: string]: any[] }
      );

      // --- NEW: Custom sorting logic for buckets ---
      const allBuckets = Object.keys(chainsByBucket);
      
      // Separate known buckets (from our order array) from unknown ones
      const knownBuckets = BUCKET_ORDER.filter(bucket => allBuckets.includes(bucket));
      const unknownBuckets = allBuckets
        .filter(bucket => !BUCKET_ORDER.includes(bucket))
        .sort(); // Sort any unknown buckets alphabetically

      // Combine them so known buckets are first, in order, followed by sorted unknown ones
      const finalBucketOrder = [...knownBuckets, ...unknownBuckets];
      
      // Iterate using our newly sorted bucket order
      finalBucketOrder.forEach(bucket => {
        const chainsInBucket = chainsByBucket[bucket];
        if (chainsInBucket.length === 0) return;

        // Sort chains alphabetically within each bucket
        chainsInBucket.sort((a, b) => a.label.localeCompare(b.label));
        
        // Add the bucket title
        children.push({
          type: 'title',
          label: bucket,
        });

        // Add the links for this bucket
        chainsInBucket.forEach(option => {
          children.push({
            type: 'link',
            label: option.label,
            icon: option.icon,
            href: option.url || '#',
            isNew: option.showNew || false,
          });
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
    // --- END: Special bucketing logic for Chains ---

    // --- Default logic for all other groups ---
    const children: (SidebarLink | SidebarSectionTitle)[] = [];
    
    // Group options by category
    const categorizedOptions = new Map<string, typeof item.options>();
    const uncategorizedOptions: typeof item.options = [];

    item.options.forEach(option => {
      if (!option.hide) {
        if (option.category) {
          if (!categorizedOptions.has(option.category)) {
            categorizedOptions.set(option.category, []);
          }
          categorizedOptions.get(option.category)!.push(option);
        } else {
          uncategorizedOptions.push(option);
        }
      }
    });

    // Add uncategorized options first
    uncategorizedOptions.forEach(option => {
      children.push({
        type: 'link',
        label: option.label,
        icon: option.icon,
        href: option.url || '#',
        isNew: option.showNew || false,
      } as SidebarLink);
    });

    // Add categorized options with section titles
    categorizedOptions.forEach((options, categoryKey) => {
      const categoryInfo = navigationCategories[categoryKey as keyof typeof navigationCategories];
      if (categoryInfo) {
        // Add section title
        children.push({
          type: 'title',
          label: categoryInfo.label,
        } as SidebarSectionTitle);

        // Add options in this category
        options.forEach(option => {
          children.push({
            type: 'link',
            label: option.label,
            icon: option.icon,
            href: option.url || '#',
            isNew: option.showNew || false,
          } as SidebarLink);
        });
      }
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


// Export the transformed navigation (static version without chains)
export const sidebarNavigationFromNav = transformNavigationToSidebar(navigationItems);