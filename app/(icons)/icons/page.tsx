// app/(icons)/icons/page.tsx
"use client";

import { Fragment, useMemo, useState, useEffect, ReactNode } from "react"; // Import useEffect
import Header from "../../(icons)/icons/Header";
import Footer from "../../(icons)/icons/Footer";
import { GTPIcon } from "@/components/layout/GTPIcon";
// ... other imports
import { useToast } from "@/components/toast/GTPToast";
import { buildInvertedIndex, iconSearchStrings } from "@/icons/gtp-icon-names";
import { useIconLibrary, } from "@/contexts/IconLibraryContext";
import { IconIndexEntry, CustomizationMode } from "@/lib/icon-library/types";
import { applySvgCustomizations, convertSvgToPngBlob, getSvgAtWidthAndHeight, triggerBlobDownload, triggerDownload } from "@/lib/icon-library/clientSvgUtils";
import JSZip from "jszip"; // Ensure JSZip is imported
import { saveAs } from "file-saver"; // Ensure saveAs is imported

// Import the Provider and Hook
import { IconPageUIContext, IconPageUIProvider, IconPageUIState, useIconPageUI } from './IconPageUIContext'; // Adjust path if needed
import ShowLoading from "@/components/layout/ShowLoading";

type IconStyleOption = "gradient" | "monochrome";

// Constants for icons...
const invertedIndex = buildInvertedIndex(iconSearchStrings);

const DEFAULT_ICON_SIZE = 24;

// --- Component containing state and provider setup ---
const IconsPageWithProvider = () => {
  const { libraryData, isLoading, error, getSvgContent, mode, singleColorPickerValue, getDerivedSolidOverrides, gradientOverrides} = useIconLibrary();
  const [isZipping, setIsZipping] = useState(false);
  const { addToast } = useToast();

  // State lives here now!
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"SVG" | "PNG">("SVG");
  const [selectedStyles, setSelectedStyles] = useState<IconStyleOption[]>(["gradient"]);
  const [selectedSize, setSelectedSize] = useState<number>(DEFAULT_ICON_SIZE);
  const [iconsCount, setIconsCount] = useState<number>(0); // Derived count

  // --- Filtering Logic (Uses local state) ---
  const filteredIconNames = useMemo(() => {
    if (!libraryData?.icons) return [];
    const allIconNames = libraryData.icons.map(icon => icon.name);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const gtpIcons = allIconNames.filter(iconName => iconName.startsWith("gtp-"));
    const otherIcons = allIconNames.filter(iconName => !iconName.startsWith("gtp-"));
    const orderedIconNames = [...gtpIcons.sort(), ...otherIcons.sort()];
    let searchMatches: Set<string> = new Set();
    if (normalizedQuery) {
      const namesFromIndex = invertedIndex[normalizedQuery] || [];
      namesFromIndex.forEach(name => searchMatches.add(name));
      if (normalizedQuery.length > 1) {
        Object.keys(invertedIndex).forEach(keyword => {
          if (keyword.includes(normalizedQuery)) {
            invertedIndex[keyword].forEach(name => searchMatches.add(name));
          }
        });
      }
      orderedIconNames.forEach(iconName => {
        if (iconName.toLowerCase().includes(normalizedQuery)) {
          searchMatches.add(iconName);
        }
      });
    }
    return orderedIconNames.filter((iconName) => {
      if (normalizedQuery.length > 0 && !searchMatches.has(iconName)) return false;
      // Example style filtering logic - adjust as needed
      const iconData = libraryData.icons.find(i => i.name === iconName);
      // Determine if icon matches selectedStyles (needs proper logic based on your data)
      const isMonochrome = iconData?.filePath.includes('/mono/'); // Example heuristic
      const isGradient = !isMonochrome; // Example heuristic

      if (selectedStyles.length === 0 || selectedStyles.length === 2) return true; // Show all
      if (selectedStyles.includes('monochrome') && isMonochrome) return true;
      if (selectedStyles.includes('gradient') && isGradient) return true;
      return false;
    });
  }, [searchQuery, selectedStyles, libraryData?.icons]);

  const filteredIconNameSet = useMemo(() => new Set(filteredIconNames), [filteredIconNames]);

  // --- Update derived icon count ---
  useEffect(() => {
    setIconsCount(filteredIconNames.length);
  }, [filteredIconNames.length]);

  // --- Grouping Logic ---
  const groupedIcons = useMemo(() => {
    // ... (grouping logic remains the same)
    if (!libraryData?.icons) return null;
    const categoryOrder = ['gtp-logos', 'gtp-actions', 'gtp-navigation', /* etc */];
    const groups = libraryData.icons.reduce((acc, icon) => {
      const key = icon.category || 'uncategorized';
      if (!acc[key]) acc[key] = { category: key, icons: [] };
      acc[key].icons.push(icon);
      return acc;
    }, {} as Record<string, { category: string; icons: IconIndexEntry[] }>);
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
    sortedGroupKeys.forEach(key => {
      groups[key].icons.sort((a, b) => a.name.localeCompare(b.name));
    });
    return sortedGroupKeys.map(key => groups[key]);
  }, [libraryData?.icons]);


  // --- Download All Handler (Defined here, has access to everything) ---
  const handleDownloadAll = async () => { // No format needed, uses component's state
    if (!libraryData || isZipping) return;

    const iconsToZip = libraryData.icons.filter(icon => filteredIconNameSet.has(icon.name));
    if (iconsToZip.length === 0) {
      addToast({ title: 'No Icons', message: 'No icons match the current filters.', type: 'warning' });
      return;
    }

    setIsZipping(true);
    const format = selectedFormat; // SVG or PNG from state
    const formatLower = format.toLowerCase(); // svg or png
    const zipFilename = `growthepie-icons-${formatLower}.zip`;

    addToast({ title: 'Preparing Download', message: `Preparing ${iconsToZip.length} icons as ${format}...`, type: 'info', duration: 3000 });

    try {
      const zip = new JSZip();
      let processedCount = 0;
      const totalCount = iconsToZip.length;

      for (const icon of iconsToZip) {
        const rawSvg = getSvgContent(icon.filePath);
        if (!rawSvg) {
            console.warn(`Skipping ${icon.name}: Could not get SVG content.`);
            continue; // Skip if SVG content is unavailable
        }

        // Apply customizations regardless of format, as PNG needs the final SVG
        const modifiedSvg = applySvgCustomizations(
          rawSvg,
          icon,
          mode,
          singleColorPickerValue,
          getDerivedSolidOverrides(),
          gradientOverrides
        );

        const filePath = `${icon.type || 'icons'}/${icon.category || 'general'}/${icon.name}.${formatLower}`;

        if (format === "SVG") {
          zip.file(filePath, modifiedSvg);
        } else { // PNG format
          // Convert the *modified* SVG to PNG blob
          const pngBlob = await convertSvgToPngBlob(modifiedSvg, selectedSize, selectedSize);
          if (pngBlob) {
            zip.file(filePath, pngBlob);
          } else {
            console.warn(`Skipping ${icon.name}: Failed to convert to PNG.`);
            addToast({ title: 'Conversion Warning', message: `Could not convert ${icon.name} to PNG.`, type: 'warning', duration: 2000 });
          }
        }
        processedCount++;
        // Optional: Add progress update toast here if needed, but might be too noisy
        // if (processedCount % 10 === 0 || processedCount === totalCount) {
        //   addToast({ title: 'Zipping Progress', message: `${processedCount} / ${totalCount} icons processed...`, type: 'info', duration: 1000 });
        // }
      }

      if (processedCount === 0 && totalCount > 0) {
        throw new Error("No icons could be processed for the ZIP file.");
      }

      addToast({ title: 'Generating ZIP', message: 'Compressing files...', type: 'info', duration: 4000 });
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });

      triggerBlobDownload(zipFilename, zipBlob);
      addToast({ title: 'Download Started', message: zipFilename, type: 'success' });

    } catch (err: any) {
      console.error("Failed to generate ZIP:", err);
      addToast({ title: 'ZIP Failed', message: err.message || 'Could not generate ZIP file.', type: 'error' });
    } finally {
      setIsZipping(false);
    }
  };


  // --- Rendering ---
  if (error) return <div className="p-4 text-center text-red-500">Error loading library: {error}</div>;


  // Provide state and setters to the context
  return (
    <>
    <ShowLoading dataLoading={[isLoading]} dataValidating={[isLoading]}>

    </ShowLoading>
    <IconPageUIProviderWrapper
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedFormat={selectedFormat}
      setSelectedFormat={setSelectedFormat}
      selectedSize={selectedSize}
      setSelectedSize={setSelectedSize}
      iconsCount={iconsCount}
      onDownloadAllRequest={handleDownloadAll} // Pass the actual handler
    >
      {/* Header no longer needs props */}
      <Header />

      {/* Main content */}
      <main className="pt-[110px] md:pt-[175px] flex justify-center pb-[215px] md:pb-[180px]">
        <div className="max-w-[1427px] w-full px-[20px] md:px-[60px] flex flex-col gap-[30px]">
          {/* Title */}
          <div className="w-full flex justify-between mx-auto">
            <h1 className="pl-[15px] heading-large-sm md:heading-large-lg">
              Copy or download icons from growthepie's icon set.
            </h1>
          </div>
          {/* Icon Grid */}
          <div className="w-full flex flex-wrap justify-start gap-[15px]">
            {groupedIcons && groupedIcons.length > 0 ? (
              groupedIcons.map(({ category, icons }) => {
                const visibleIconsInGroup = icons.filter(icon => filteredIconNameSet.has(icon.name));
                if (visibleIconsInGroup.length === 0) return null;
                return (
                  <Fragment key={category}>
                    <h2 className="w-full heading-small-xxs capitalize px-[15px]">
                      {category.replace(/-/g, ' ')}
                    </h2>
                    {visibleIconsInGroup.map((icon) => (
                      <IconCard key={icon.name} icon={icon} />
                    ))}
                  </Fragment>
                );
              })
            ) : (<div className="w-full text-center py-10 text-gray-500">No groups.</div>)}
            {filteredIconNames.length === 0 && searchQuery && (<div className="w-full text-center py-10 text-gray-500">No icons match "{searchQuery}".</div>)}
            {filteredIconNames.length === 0 && !searchQuery && selectedStyles.length > 0 && (<div className="w-full text-center py-10 text-gray-500">No icons match filters.</div>)}
          </div>
        </div>
      </main>

      {/* Footer no longer needs props */}
      <Footer />
    </IconPageUIProviderWrapper>
    </>
  );
};


// --- Wrapper for the Provider to accept props ---
// This allows IconsPageWithProvider to manage state and pass it down cleanly

interface IconPageUIProviderWrapperProps extends IconPageUIState {
  children: ReactNode;
  setSearchQuery: (value: string) => void;
  setSelectedFormat: React.Dispatch<React.SetStateAction<"SVG" | "PNG">>;
  setSelectedSize: React.Dispatch<React.SetStateAction<number>>;
  onDownloadAllRequest: () => void; // Simplified trigger
}

const IconPageUIProviderWrapper: React.FC<IconPageUIProviderWrapperProps> = ({
  children,
  searchQuery,
  setSearchQuery,
  selectedFormat,
  setSelectedFormat,
  selectedSize,
  setSelectedSize,
  iconsCount,
  onDownloadAllRequest,
}) => {
  // The context value combines state from props and the download trigger
  const contextValue = {
    searchQuery,
    selectedFormat,
    selectedSize,
    iconsCount,
    setSearchQuery,
    setSelectedFormat,
    setSelectedSize,
    triggerDownloadAll: onDownloadAllRequest, // Map the prop to the context name
    setIconsCount: () => { }, // No-op setter needed? Or remove from type if count is read-only downstream
  };

  return (
    <IconPageUIContext.Provider value={contextValue}>
      {children}
    </IconPageUIContext.Provider>
  );
};


export default IconsPageWithProvider; // Export the component that sets up the provider

// Remember to define IconCard component here or import it
interface IconCardProps {
  icon: IconIndexEntry;
}
const IconCard: React.FC<IconCardProps> = ({ icon }) => {
  const { selectedSize, selectedFormat } = useIconPageUI();
  const {
    getSvgContent,
    mode, // Get current mode
    singleColorPickerValue, // Get single color value
    getDerivedSolidOverrides, // Get function for HSL-shifted colors
    gradientOverrides, // Get current gradient overrides
  } = useIconLibrary();
  const { addToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const rawSvgContent = getSvgContent(icon.filePath);

  const displaySvgContent = useMemo(() => {
    if (!rawSvgContent) return null;
    // Call applySvgCustomizations with all necessary arguments based on mode
    return applySvgCustomizations(
      rawSvgContent,
      icon,
      mode,
      singleColorPickerValue,
      getDerivedSolidOverrides(), // Get the HSL-shifted solids
      gradientOverrides
    );
  }, [rawSvgContent, icon, mode, singleColorPickerValue, getDerivedSolidOverrides, gradientOverrides]); // Add dependencies

  const handleCopy = async () => {
    if (!displaySvgContent) return;
    try {
      if (selectedFormat === "PNG") {
        const pngBlob = await convertSvgToPngBlob(displaySvgContent, selectedSize, selectedSize);
        if (pngBlob) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        } else {
          throw new Error("Failed to convert SVG to PNG.");
        }
      } else {
        // adjust size to selectedSize
        const svgString = getSvgAtWidthAndHeight(displaySvgContent, selectedSize, selectedSize);
        await navigator.clipboard.writeText(svgString);
      }
      setIsCopied(true);

      addToast({ title: 'Copied to Clipboard', message: `${icon.name}`, type: 'success' });
    } catch (err: any) { addToast({ title: 'Copy Failed', message: err.message || 'Could not copy SVG content.', type: 'error' }); }
    finally { setTimeout(() => setIsCopied(false), 500); }
  };

  const handleDownload = async () => {
    if (!displaySvgContent || isDownloading) return;

    const format = selectedFormat.toLowerCase(); // 'svg' or 'png'
    const filename = `${icon.name}.${format}`;

    setIsDownloading(true);
    addToast({ title: 'Preparing Download', message: filename, type: 'info', duration: 1500 }); // Slightly longer duration

    try {
      if (selectedFormat === "PNG") {
        // --- PNG Download Logic ---
        const pngBlob = await convertSvgToPngBlob(displaySvgContent, selectedSize, selectedSize);
        if (pngBlob) {
          triggerBlobDownload(filename, pngBlob);
          addToast({ title: 'Download Started', message: filename, type: 'success' });
        } else {
          throw new Error("Failed to convert SVG to PNG."); // Trigger catch block
        }
      } else {
        // --- SVG Download Logic (existing) ---
        triggerDownload(filename, displaySvgContent, 'image/svg+xml');
        addToast({ title: 'Download Started', message: filename, type: 'success' });
      }
    } catch (err: any) {
      console.error("Download failed:", err);
      addToast({ title: 'Download Failed', message: err.message || `Could not prepare ${format}.`, type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (displaySvgContent === undefined) return <div className="icon-card w-[95px] h-[60px] bg-[#1F2726]/50 rounded-[11px] animate-pulse"></div>;
  if (displaySvgContent === null) return <div className="icon-card w-[95px] h-[60px] bg-red-900/20 rounded-[11px] flex items-center justify-center text-xs text-red-400">{icon.name} (Err)</div>;

  return (
    <div className="group flex flex-col justify-between items-center bg-[#1F2726] hover:bg-[#5A6462] rounded-[11px] py-[5px] px-[13px] transition-transform transform hover:scale-105" title={icon.name}>
      <div 
      style={{ width: `${selectedSize}px`, height: `${selectedSize}px` }}
      className="icon-preview text-white flex items-center justify-center" 
      dangerouslySetInnerHTML={{ __html: displaySvgContent }} 
      />
      <div className="relative w-[69px] flex justify-center mt-1">
        <span className="group-hover:hidden text-xs text-center h-[21px] truncate">{icon.name}</span>
        <div className="hidden group-hover:flex flex-row items-center gap-[10px] h-[15px]">
          <button onClick={handleCopy}><GTPIcon icon={isCopied ? "gtp-checkmark-checked" : "gtp-copy"} size="sm" className="w-[15px] h-[15px]" /></button>
          <button onClick={handleDownload}><GTPIcon icon="gtp-download" size="sm" className="w-[15px] h-[15px]" /></button>
        </div>
      </div>
    </div>
  );
};