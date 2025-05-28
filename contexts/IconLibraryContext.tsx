"use client";

import { ReactNode, useEffect, useState, useCallback, useMemo, createContext, useContext } from "react";
import tinycolor from 'tinycolor2'; // Import tinycolor
import { /* type imports */
  IconLibraryData,
  IconIndexEntry, // Import if needed by applySvgCustomizations args later
  HSLShifts,
  CustomizationMode, // Import updated type
  SolidColorOverrides, // Keep for derived value type
  GradientOverrides, // Keep for state type
} from '@/lib/icon-library/types'; // Adjust path
import { IconLibraryURLs } from "@/lib/urls";

// --- Customization State Types ---

export interface CustomizationState {
  mode: CustomizationMode;
  solidOverrides: SolidColorOverrides;
  gradientOverrides: GradientOverrides;
}

// --- Context State and Actions Types ---

interface IconLibraryState {
  libraryData: IconLibraryData | null;
  svgContentCache: Map<string, string | null>;
  isLoading: boolean;
  error: string | null;
  // Mode and Mode-Specific Values
  mode: CustomizationMode;
  hslShifts: HSLShifts;
  gradientOverrides: GradientOverrides;
  singleColorPickerValue: string; // State for the single picker
  // Other UI state (like selected format)
  selectedFormat: "SVG" | "PNG";
}

interface IconLibraryActions {
  setMode: (mode: CustomizationMode) => void;
  setHueShift: (value: number) => void;
  setSaturationShift: (value: number) => void;
  setLightnessShift: (value: number) => void;
  updateGradientStopOverride: (hash: string, index: number, color: string) => void;
  setSingleColorPickerValue: (color: string) => void; // Action for single picker
  setSelectedFormat: (format: "SVG" | "PNG") => void;
  resetCustomizations: () => void;
  getSvgContent: (filePath: string) => string | null | undefined;
  getDerivedSolidOverrides: () => SolidColorOverrides; // Keep getter for derived values
}

// Combine state and actions for the context value
type IconLibraryContextType = IconLibraryState & IconLibraryActions;

// --- Default Values (Revised) ---

export const DEFAULT_MODE: CustomizationMode = 'original';
export const DEFAULT_HSL_SHIFTS: HSLShifts = { hue: 0, saturation: 0, lightness: 0 };
export const DEFAULT_GRADIENT_OVERRIDES: GradientOverrides = {};
export const DEFAULT_SINGLE_COLOR = '#ffffff'; // Default single color (e.g., white)
export const DEFAULT_FORMAT = "SVG";

const IconLibraryContext = createContext<IconLibraryContextType | undefined>(undefined);

// --- Provider Component (Revised) ---

export const IconLibraryProvider: React.FC<{ children: ReactNode, indexPath?: string }> = ({
  children,
  indexPath = IconLibraryURLs.index,
}) => {
  const [libraryData, setLibraryData] = useState<IconLibraryData | null>(null);
  const [svgContentCache, setSvgContentCache] = useState<Map<string, string | null>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // --- State organized by feature ---
  const [mode, setModeState] = useState<CustomizationMode>(DEFAULT_MODE);
  const [hslShifts, setHslShifts] = useState<HSLShifts>(DEFAULT_HSL_SHIFTS);
  const [gradientOverrides, setGradientOverrides] = useState<GradientOverrides>(DEFAULT_GRADIENT_OVERRIDES);
  const [singleColorPickerValue, setSingleColorPickerValueState] = useState<string>(DEFAULT_SINGLE_COLOR);
  const [selectedFormat, setSelectedFormat] = useState<"SVG" | "PNG">(DEFAULT_FORMAT);

  // --- Data Fetching (Reset all state on fetch) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setLibraryData(null);
      setSvgContentCache(new Map());
      // Reset all customization state
      setModeState(DEFAULT_MODE);
      setHslShifts(DEFAULT_HSL_SHIFTS);
      setGradientOverrides(DEFAULT_GRADIENT_OVERRIDES);
      setSingleColorPickerValueState(DEFAULT_SINGLE_COLOR);
      setSelectedFormat(DEFAULT_FORMAT);

      try {
        // ... fetch index & svgs logic (no changes needed here) ...
        const indexResponse = await fetch(indexPath); if (!indexResponse.ok) throw new Error(`Index fetch failed`); const data: IconLibraryData = await indexResponse.json(); setLibraryData(data);
        if (data.icons?.length > 0) { const svgPaths = [...new Set(data.icons.map(i => i.filePath))]; const svgPromises = svgPaths.map(async fp => { try { const r = await fetch(`${IconLibraryURLs.base}${fp}`); return { filePath: fp, content: r.ok ? await r.text() : null }; } catch { return { filePath: fp, content: null }; } }); const results = await Promise.allSettled(svgPromises); setSvgContentCache(p => { const n = new Map(p); results.forEach(r => { if (r.status === 'fulfilled' && r.value) n.set(r.value.filePath, r.value.content); }); return n; }); }

      } catch (fetchError: any) { setError(fetchError.message || 'Error'); /* clear other states */ }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [indexPath]);

  // --- Derived Solid Overrides (Only for 'customPalette' mode via HSL) ---
  const derivedSolidOverrides = useMemo((): SolidColorOverrides => {
    // Only calculate if needed for customPalette (though calculated anyway by useMemo)
    if (!libraryData?.palette.uniqueSolidColors) return {};
    // ... HSL shift logic using tinycolor (same as before) ...
    const overrides: SolidColorOverrides = {};
    libraryData.palette.uniqueSolidColors.forEach(originalColor => {
      const color = tinycolor(originalColor); const hsl = color.toHsl();
      let newHue = ((hsl.h + hslShifts.hue) % 360 + 360) % 360;
      let newSat = Math.max(0, Math.min(100, hsl.s * 100 + hslShifts.saturation));
      let newLight = Math.max(0, Math.min(100, hsl.l * 100 + hslShifts.lightness));
      overrides[originalColor] = tinycolor({ h: newHue, s: newSat / 100, l: newLight / 100 }).toHexString();
    });
    return overrides;
  }, [libraryData?.palette.uniqueSolidColors, hslShifts]);

  // --- Action Implementations (Revised) ---
  const setMode = useCallback((newMode: CustomizationMode) => setModeState(newMode), []);
  const setHueShift = useCallback((v: number) => setHslShifts(p => ({ ...p, hue: v })), []);
  const setSaturationShift = useCallback((v: number) => setHslShifts(p => ({ ...p, saturation: v })), []);
  const setLightnessShift = useCallback((v: number) => setHslShifts(p => ({ ...p, lightness: v })), []);
  const updateGradientStopOverride = useCallback((hash: string, index: number, color: string) => {
    setGradientOverrides(prev => ({
      ...prev,
      [hash]: { ...prev[hash], stops: { ...(prev[hash]?.stops || {}), [index]: color } }
    }));
  }, []);
  const setSingleColorPickerValue = useCallback((color: string) => setSingleColorPickerValueState(color), []);
  const handleSetSelectedFormat = useCallback((format: "SVG" | "PNG") => setSelectedFormat(format), []);

  const resetCustomizations = useCallback(() => {
    setModeState(DEFAULT_MODE);
    setHslShifts(DEFAULT_HSL_SHIFTS);
    setGradientOverrides(DEFAULT_GRADIENT_OVERRIDES);
    setSingleColorPickerValueState(DEFAULT_SINGLE_COLOR);
    // Note: selectedFormat is UI preference, maybe don't reset it here? Or add separate reset.
  }, []);

  const getSvgContent = useCallback((fp: string) => svgContentCache.get(fp), [svgContentCache]);
  const getDerivedSolidOverrides = useCallback(() => derivedSolidOverrides, [derivedSolidOverrides]);

  // --- Context Value ---
  const contextValue = useMemo(
    () => ({
      libraryData, svgContentCache, isLoading, error, // Data/Loading
      mode, hslShifts, gradientOverrides, singleColorPickerValue, selectedFormat, // State
      setMode, setHueShift, setSaturationShift, setLightnessShift, // Actions
      updateGradientStopOverride, setSingleColorPickerValue,
      setSelectedFormat: handleSetSelectedFormat, resetCustomizations,
      getSvgContent, getDerivedSolidOverrides,
    }),
    [ /* Add all state and actions as dependencies */
      libraryData, svgContentCache, isLoading, error, mode, hslShifts,
      gradientOverrides, singleColorPickerValue, selectedFormat,
      setMode, setHueShift, setSaturationShift, setLightnessShift,
      updateGradientStopOverride, setSingleColorPickerValue, handleSetSelectedFormat,
      resetCustomizations, getSvgContent, getDerivedSolidOverrides // Include getter based on derived value
    ]
  );

  return (
    <IconLibraryContext.Provider value={contextValue}>
      {children}
    </IconLibraryContext.Provider>
  );
};

export const useIconLibrary = (): IconLibraryContextType => { /* ... */
  const context = useContext(IconLibraryContext);
  if (context === undefined) throw new Error('useIconLibrary needs IconLibraryProvider');
  return context;
};