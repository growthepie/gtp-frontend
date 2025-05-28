// src/components/icons/CustomizationControls.tsx
"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  DEFAULT_SINGLE_COLOR,
  DEFAULT_MODE,
  useIconLibrary,
} from '@/contexts/IconLibraryContext'; // Adjust path
import {
  CustomizationMode,
  UniqueGradientStructure,
  CollapsedGradient
} from '@/lib/icon-library/types';
import { throttle } from 'lodash';

const THROTTLE_WAIT = 100;

// Helper to generate a CSS linear gradient string from stops
// Note: Assumes offsets are valid CSS percentage/length units or 0-1 numbers
function getCssGradientPreview(stops: Array<{ color: string; offset?: string }>): string {
  if (!stops || stops.length === 0) {
    return 'linear-gradient(to right, #ccc, #ccc)'; // Fallback for empty stops
  }
  // Ensure offsets are percentages for CSS gradient syntax
  const cssStops = stops.map(stop => {
    let offsetPercent = 50; // Default if offset is invalid
    if (stop.offset) {
      try {
        const offsetNum = parseFloat(stop.offset);
        if (!isNaN(offsetNum)) {
          // Convert 0-1 offset to percentage
          offsetPercent = Math.max(0, Math.min(100, offsetNum * 100));
        } else if (stop.offset.endsWith('%')) {
          offsetPercent = Math.max(0, Math.min(100, parseFloat(stop.offset)));
        }
      } catch (e) { /* ignore parse error, use default */ }
    }
    // Use the effective color (considering overrides) for the preview
    // This requires getting the current color similar to getPickerColor logic
    // For simplicity here, we assume `stop.color` is the one to display
    // A more accurate preview would need the *current* color from state.
    return `${stop.color} ${offsetPercent}%`;
  }).join(', ');

  return `linear-gradient(to right, ${cssStops})`;
}


// Helper component for Radio Input + Label
const ModeRadioOption: React.FC<{
  value: CustomizationMode;
  currentMode: CustomizationMode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
  children: React.ReactNode;
}> = ({ value, currentMode, onChange, title, children }) => (
  <label
    className="flex items-center gap-1.5 cursor-pointer text-xs text-[#CDD8D3] hover:text-white transition-colors relative pl-4"
    title={title}
  >
    {/* Custom Radio Circle */}
    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-[#5A6462] transition-colors ${currentMode === value ? 'bg-forest-500 border-forest-500' : ''}`}></span>
    {/* Hidden Actual Radio */}
    <input
      type="radio"
      name="mode"
      value={value}
      checked={currentMode === value}
      onChange={onChange}
      className="sr-only" // Visually hidden but accessible
    />
    {children}
  </label>
);

const CustomizationControls: React.FC = () => {
  const {
    libraryData,
    mode, // Get mode directly
    hslShifts,
    gradientOverrides, // Keep for customPalette mode
    singleColorPickerValue, // Get new state
    setMode,
    updateGradientStopOverride,
    setHueShift,
    setSaturationShift,
    setLightnessShift,
    setSingleColorPickerValue, // Get new action
    resetCustomizations,
  } = useIconLibrary();

  const throttledSetHueShift = useCallback(
    throttle((value: number) => setHueShift(value), THROTTLE_WAIT, { leading: true, trailing: true }),
    [setHueShift] // Dependency is the original setter function
  );

  const throttledSetSaturationShift = useCallback(
    throttle((value: number) => setSaturationShift(value), THROTTLE_WAIT, { leading: true, trailing: true }),
    [setSaturationShift]
  );

  const throttledSetLightnessShift = useCallback(
    throttle((value: number) => setLightnessShift(value), THROTTLE_WAIT, { leading: true, trailing: true }),
    [setLightnessShift]
  );

  const throttledSetSingleColor = useCallback(
    throttle((value: string) => setSingleColorPickerValue(value), THROTTLE_WAIT, { leading: true, trailing: true }),
    [setSingleColorPickerValue]
  );

  // Need to throttle the *entire* logic within handleCollapsedGradientUpdate
  // because it calls updateGradientStopOverride multiple times potentially
  const throttledUpdateCollapsedGradient = useCallback(
    throttle((collapsedGradient: CollapsedGradient, uiStopIndex: number, newColor: string) => {
      const originalColorBeingChanged = collapsedGradient.stops[uiStopIndex]?.color;
      if (!originalColorBeingChanged) return;
      // Find the original gradient structure once (assuming gradientHashMap is stable via useMemo)
      // Note: gradientHashMap needs to be accessible here or passed in. Let's recalculate inside for simplicity, or lift memo higher.
      const tempHashMap = new Map<string, UniqueGradientStructure>(); // Recalculate or access memoized version
      libraryData?.palette.uniqueGradients.forEach(g => tempHashMap.set(g.hash, g));

      collapsedGradient.originalHashes.forEach(hash => {
        const originalGradient = tempHashMap.get(hash); // Use map lookup
        if (!originalGradient) return;
        const stopIndexInOriginal = originalGradient.stops.findIndex(stop => stop.color === originalColorBeingChanged);
        if (stopIndexInOriginal !== -1) {
          updateGradientStopOverride(hash, stopIndexInOriginal, newColor); // Call original setter
        } else { console.warn(/* ... */); }
      });
    }, THROTTLE_WAIT, { leading: true, trailing: true }),
    [libraryData?.palette.uniqueGradients, updateGradientStopOverride] // Dependencies
  );

  // --- Gradient Grouping Logic (Copied from previous CustomizationPanel) ---
  const gradientHashMap = useMemo(() => {
    const map = new Map<string, UniqueGradientStructure>();
    libraryData?.palette.uniqueGradients.forEach(g => map.set(g.hash, g));
    return map;
  }, [libraryData?.palette.uniqueGradients]);

  const collapsedGradients = useMemo((): CollapsedGradient[] => {
    if (!libraryData?.palette.uniqueGradients) return [];
    const map = new Map<string, CollapsedGradient>();
    libraryData.palette.uniqueGradients.forEach(gradient => {
      const sortedColors = gradient.stops.map(s => s.color).sort();
      const colorSignature = sortedColors.join('|');
      let entry = map.get(colorSignature);
      if (!entry) {
        entry = { colorSignature, originalHashes: [gradient.hash], stops: gradient.stops.map(s => ({ color: s.color })) };
        map.set(colorSignature, entry);
      } else { entry.originalHashes.push(gradient.hash); }
    });
    return Array.from(map.values()).sort((a, b) => a.colorSignature.localeCompare(b.colorSignature));
  }, [libraryData?.palette.uniqueGradients]);

  const handleCollapsedGradientUpdate = (
    collapsedGradient: CollapsedGradient, uiStopIndex: number, newColor: string
  ) => {
    const originalColorBeingChanged = collapsedGradient.stops[uiStopIndex]?.color;
    if (!originalColorBeingChanged) return;
    collapsedGradient.originalHashes.forEach(hash => {
      const originalGradient = gradientHashMap.get(hash);
      if (!originalGradient) return;
      const stopIndexInOriginal = originalGradient.stops.findIndex(stop => stop.color === originalColorBeingChanged);
      if (stopIndexInOriginal !== -1) { updateGradientStopOverride(hash, stopIndexInOriginal, newColor); }
      else { console.warn(`Color ${originalColorBeingChanged} not found in ${hash}`); }
    });
  };

  const getPickerColor = (
    collapsedGradient: CollapsedGradient, uiStopIndex: number
  ): string => {
    const originalColor = collapsedGradient.stops[uiStopIndex]?.color;
    if (!originalColor) return '#000000';
    for (const hash of collapsedGradient.originalHashes) {
      const originalGradient = gradientHashMap.get(hash);
      if (!originalGradient) continue;
      const stopIndexInOriginal = originalGradient.stops.findIndex(stop => stop.color === originalColor);
      if (stopIndexInOriginal !== -1) {
        const overrideColor = gradientOverrides[hash]?.stops[stopIndexInOriginal];
        if (overrideColor !== undefined) return overrideColor;
      }
    }
    return originalColor;
  };
  // --- End Gradient Logic ---

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.value as CustomizationMode);
  };

  // Function to get stops with CURRENT colors for the preview
  const getCurrentPreviewStops = (cGradient: CollapsedGradient): Array<{ color: string; offset?: string }> => {
    // Find the *original* structure using the first hash to get offsets
    const representativeOriginalHash = cGradient.originalHashes[0];
    const originalStructure = gradientHashMap.get(representativeOriginalHash);

    return cGradient.stops.map((representativeStop, uiIndex) => {
      const currentEffectiveColor = getPickerColor(cGradient, uiIndex);
      // Get offset from the original structure if possible
      const originalOffset = originalStructure?.stops[uiIndex]?.offset;
      return {
        color: currentEffectiveColor,
        offset: originalOffset // Pass offset for CSS generation
      };
    });
  };

  // Determine if any customizations are active for the reset button
  const hasCustomizations = mode !== 'original' && (
    hslShifts.hue !== 0 || hslShifts.saturation !== 0 || hslShifts.lightness !== 0 ||
    Object.keys(gradientOverrides).length > 0 ||
    (mode === 'singleColorPicker' && singleColorPickerValue !== '#ffffff') // Assuming #fff is default
  );

  // Cleanup throttled functions on unmount
  useEffect(() => {
    return () => {
      throttledSetHueShift.cancel();
      throttledSetSaturationShift.cancel();
      throttledSetLightnessShift.cancel();
      throttledSetSingleColor.cancel();
      throttledUpdateCollapsedGradient.cancel();
    };
  }, [throttledSetHueShift, throttledSetSaturationShift, throttledSetLightnessShift, throttledSetSingleColor, throttledUpdateCollapsedGradient])

  if (!libraryData) return <div className='p-4 text-xs text-gray-400'>Loading palette...</div>; // Placeholder

  return (
    <div className='space-y-4 p-3'>
      {/* Mode Selection */}
      <div>
        {/* Section Title */}
        <h4 className="font-medium text-xs mb-1.5 text-[#5A6462] uppercase tracking-wider">Mode</h4>
        {/* Grid layout for radio options */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <ModeRadioOption value="original" currentMode={mode} onChange={handleModeChange} title="Display original icon colors">
            Original
          </ModeRadioOption>
          <ModeRadioOption value="currentColor" currentMode={mode} onChange={handleModeChange} title="Use CSS 'color' property to style">
            CSS Color
          </ModeRadioOption>
          <ModeRadioOption value="singleColorPicker" currentMode={mode} onChange={handleModeChange} title="Set one color for the entire icon">
            Single Color
          </ModeRadioOption>
          <ModeRadioOption value="customPalette" currentMode={mode} onChange={handleModeChange} title="Advanced: Shift solids, edit gradients">
            Custom Palette
          </ModeRadioOption>
        </div>
      </div>

      {/* --- Single Color Picker --- */}
      {mode === 'singleColorPicker' && (
        <div>
          <h4 className="font-medium text-xs mb-1 text-[#5A6462] uppercase tracking-wider">Select Color</h4>
          <div className="flex items-center justify-start"> {/* Align left */}
            <input
              type="color"
              value={singleColorPickerValue}
              onChange={(e) => throttledSetSingleColor(e.target.value)}
              // Basic styling attempt for native picker
              className="w-8 h-8 p-0 border border-white/10 rounded-md cursor-pointer bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none focus:outline-none focus:ring-1 focus:ring-forest-600 focus:ring-offset-1 focus:ring-offset-[#151A19]"
              aria-label="Select single color"
            />
          </div>
        </div>
      )}


      {/* --- Custom Palette Controls --- */}
      {mode === 'customPalette' && (
        <>
          {/* Gradient Controls */}
          {collapsedGradients.length > 0 && (
            <div>
              <h4 className="font-medium text-xs mb-1.5 text-[#5A6462] uppercase tracking-wider">Gradients</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#5A6462]/60 hover:scrollbar-thumb-[#5A6462]/90 scrollbar-track-transparent scrollbar-thumb-rounded-full">
                {collapsedGradients.map((cGradient) => {
                  // Generate preview based on current effective colors and original offsets
                  const currentStopsForPreview = getCurrentPreviewStops(cGradient);
                  const gradientPreviewStyle = getCssGradientPreview(currentStopsForPreview);

                  return (
                    <div key={cGradient.colorSignature}>
                      {/* Info Text */}
                      <span className="text-[10px] text-[#5A6462] block mb-1 truncate" title={`${cGradient.stops.map(s => s.color).join(' → ')} (${cGradient.originalHashes.length} variants)`}>
                        {cGradient.stops.map(s => s.color).join(' → ')} ({cGradient.originalHashes.length})
                      </span>
                      {/* Gradient Preview Bar */}
                      <div className="relative">
                        <div className="h-4 w-full rounded border border-white/10 mb-1.5" style={{ background: gradientPreviewStyle }}></div>
                        <div className="absolute inset-0 flex items-center justify-between">
                          {currentStopsForPreview.map((stop, index) => (
                            <input
                              key={index}
                              type="color"
                              value={stop.color}
                              onChange={(e) => throttledUpdateCollapsedGradient(cGradient, index, e.target.value)}

                              className="z-10 w-6 h-6 p-0 border-2 rounded-[5px] border-[#5A6462] cursor-pointer bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded [&::-moz-color-swatch]:border-none focus:outline-none"


                            ></input>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HSL Shift Controls */}
          <div>
            <h4 className="font-medium text-xs mb-1 text-[#5A6462] uppercase tracking-wider">Shift Colors (Chains & Socials only)</h4>
            <div className='space-y-2'>
              {/* Hue */}
              <label className='block text-xs font-medium text-[#CDD8D3] opacity-90' htmlFor="hue-slider">Hue ({hslShifts.hue}°)</label>
              <input
                id="hue-slider"
                type="range" min="-180" max="180" step="1" value={hslShifts.hue}
                onChange={(e) => throttledSetHueShift(parseInt(e.target.value, 10))}
                onDoubleClick={() => setHueShift(0)}
                className="w-full h-1.5 bg-[#344240] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest-600 focus:ring-offset-1 focus:ring-offset-[#151A19] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest-500 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-forest-500"
                title='Shift Hue (-180 to 180). Double-click to reset.'
              />
              {/* Saturation */}
              <label className='block text-xs font-medium text-[#CDD8D3] opacity-90' htmlFor="saturation-slider">Saturation ({hslShifts.saturation}%)</label>
              <input
                id="saturation-slider"
                type="range" min="-100" max="100" step="1" value={hslShifts.saturation}
                onChange={(e) => throttledSetSaturationShift(parseInt(e.target.value, 10))}
                onDoubleClick={() => setSaturationShift(0)}
                className="w-full h-1.5 bg-[#344240] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest-600 focus:ring-offset-1 focus:ring-offset-[#151A19] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest-500 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-forest-500"
                title='Shift Saturation (-100% to 100%). Double-click to reset.'
              />
              {/* Lightness */}
              <label className='block text-xs font-medium text-[#CDD8D3] opacity-90' htmlFor="lightness-slider">Lightness ({hslShifts.lightness}%)</label>
              <input
                id="lightness-slider"
                type="range" min="-100" max="100" step="1" value={hslShifts.lightness}
                onChange={(e) => throttledSetLightnessShift(parseInt(e.target.value, 10))}
                onDoubleClick={() => setLightnessShift(0)}
                className="w-full h-1.5 bg-[#344240] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest-600 focus:ring-offset-1 focus:ring-offset-[#151A19] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest-500 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-forest-500"
                title='Shift Lightness (-100% to 100%). Double-click to reset.'
              />
            </div>
          </div>
        </>
      )}

      {/* Reset Button (conditional) */}
      {hasCustomizations && (
        <button
          onClick={resetCustomizations}
          className="mt-3 w-full px-3 py-1.5 text-xs font-medium rounded-full bg-red-800/60 hover:bg-red-800/90 text-red-100 transition-colors focus:outline-none focus:ring-1 focus:ring-red-600 focus:ring-offset-1 focus:ring-offset-[#151A19]"
        >
          Reset Customizations
        </button>
      )}
    </div>
  );
};

export default CustomizationControls;