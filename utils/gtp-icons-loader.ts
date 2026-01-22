import { BASE_URL } from "@/lib/helpers";
import { addCollection, iconExists, listIcons } from "@iconify/react";
import type { IconifyJSON } from "@iconify/react";

class GTPIconsLoader {
  private static instance: GTPIconsLoader;
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  static getInstance(): GTPIconsLoader {
    if (!GTPIconsLoader.instance) {
      GTPIconsLoader.instance = new GTPIconsLoader();
    }
    return GTPIconsLoader.instance;
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    
    // If icons are already loaded, call immediately
    if (this.isLoaded) {
      callback();
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  async loadIcons(): Promise<void> {
    if (this.isLoaded) return;
    
    // Return existing promise if already loading
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }
    
    this.isLoading = true;
    
    this.loadPromise = this._performLoad();
    return this.loadPromise;
  }

  private async _performLoad(): Promise<void> {
    try {
      // console.log("[GTPIconsLoader] Starting icon load...");
      
      // Optimized fetch with cache control
      const fetchOptions: RequestInit = {
        method: 'GET',
        // Use cache when available (preloaded resources will be cached - see (layout)/head.tsx)
        cache: 'force-cache',
        credentials: 'same-origin',
      };

      // Fetch both icon sets
      const [gtpIcons, gtpFigmaIcons] = await Promise.all<[Promise<IconifyJSON>, Promise<IconifyJSON>]>([
        fetch(`/gtp.json`, fetchOptions).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch gtp.json: ${res.status}`);
          return res.json();
        }),
        fetch(`/gtp-figma-export.json`, fetchOptions).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch gtp-figma-export.json: ${res.status}`);
          return res.json();
        })
      ]);
      
      // console.log("[GTPIconsLoader] JSON files fetched, adding collections...");
      const currentIcons = listIcons(undefined, "gtp");

      // filter out icons that are already loaded
      const filterLoadedIcons = (iconSet: IconifyJSON): IconifyJSON => {
        const filteredIcons: IconifyJSON = {
          prefix: iconSet.prefix,
          icons: {},
          width: iconSet.width,
          height: iconSet.height,
        };
        for (const iconName in iconSet.icons) {
          const fullIconName = `${iconSet.prefix}:${iconName}`;
          if (!currentIcons.includes(fullIconName)) {
            filteredIcons.icons[iconName] = iconSet.icons[iconName];
          }
        }
        return filteredIcons;
      };

      const gtpIconsToAdd = filterLoadedIcons(gtpIcons);
      const gtpFigmaIconsToAdd = filterLoadedIcons(gtpFigmaIcons);

      // Add collections immediately (no setTimeout needed)
      addCollection(gtpIconsToAdd);
      addCollection(gtpFigmaIconsToAdd);
      
      // Optional: Verify a sample icon exists to ensure collections are loaded
      // You can check for a known icon from your collection
      const testIcon = 'gtp:donate'; // Replace with an icon you know exists
      const maxRetries = 10;
      let retries = 0;
      
      while (retries < maxRetries && !iconExists(testIcon)) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (iconExists(testIcon)) {
        // console.log(`[GTPIconsLoader] Icons loaded successfully (verified ${testIcon} exists)`);
      } else {
        console.warn(`[GTPIconsLoader] Icons added but verification failed for ${testIcon}`);
      }
      
      // NOW mark as loaded and notify listeners
      
      this.isLoaded = true;
      this.isLoading = false;
      
      // Notify all listeners
      // console.log(`[GTPIconsLoader] Notifying ${this.listeners.size} listeners`);
      this.listeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error("[GTPIconsLoader] Error in listener callback:", error);
        }
      });
      
    } catch (error) {
      console.error("[GTPIconsLoader] Failed to load icon sets:", error);
      this.isLoading = false;
      this.loadPromise = null;
      throw error; // Re-throw to allow retry
    }
  }

  get loaded(): boolean {
    return this.isLoaded;
  }

  // Method to manually check if specific icon exists (useful for debugging)
  iconExists(iconName: string): boolean {
    return iconExists(iconName);
  }
}

export const gtpIconsLoader = GTPIconsLoader.getInstance();

// Hook for components to use
import { useState, useEffect, useRef } from 'react';

export const useGTPIconsLoader = () => {
  const [isLoaded, setIsLoaded] = useState(gtpIconsLoader.loaded);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Always check current state first
    if (gtpIconsLoader.loaded) {
      setIsLoaded(true);
      return;
    }

    // Subscribe for updates
    unsubscribeRef.current = gtpIconsLoader.subscribe(() => {
      setIsLoaded(true);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return isLoaded;
};