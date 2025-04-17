"use client";

import { useMemo, useState } from "react";
import Header from "../../(icons)/icons/Header";
import Footer from "../../(icons)/icons/Footer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { iconNames, GTPIconName } from "@/icons/gtp-icon-names";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getIcon } from "@iconify/react";
import { blobToArrayBuffer, svgToPngBlob, fetchSvgText } from "@/lib/iconUtiils";
import { useToast } from "@/components/toast/GTPToast";
import { buildInvertedIndex, iconSearchStrings } from "@/icons/gtp-icon-names";

type IconStyleOption = "gradient" | "monochrome";

// show "gtp-" first (alphabetically), then the rest
const gtpIcons = iconNames.filter(iconName => iconName.startsWith("gtp-"));
const otherIcons = iconNames.filter(iconName => !iconName.startsWith("gtp-"));
const orderedIconNames = [...gtpIcons.sort((a, b) => a.localeCompare(b)), ...otherIcons.sort((a, b) => a.localeCompare(b))];
const invertedIndex = buildInvertedIndex(iconSearchStrings);

const IconsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"SVG" | "PNG">("SVG");
  const [selectedStyles, setSelectedStyles] = useState<IconStyleOption[]>(["gradient"]);

  // toast
  const { addToast } = useToast();

  const filteredIcons = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    let searchMatches: Set<string> = new Set(); 
    if (normalizedQuery) {
      // Add names found via the inverted index
      const namesFromIndex = invertedIndex[normalizedQuery] || [];
      namesFromIndex.forEach(name => searchMatches.add(name));

      // Exact keyword match (fastest)
      const exactMatches = invertedIndex[normalizedQuery] || [];
      exactMatches.forEach(name => searchMatches.add(name));

      // Partial keyword match (iterate index keys)
      if (normalizedQuery.length > 1) { 
          Object.keys(invertedIndex).forEach(keyword => {
              if (keyword.includes(normalizedQuery)) {
                  invertedIndex[keyword].forEach(name => searchMatches.add(name));
              }
          });
      }

      // Partial name match (iterate all icon names)
      orderedIconNames.forEach(iconName => {
        if (iconName.toLowerCase().includes(normalizedQuery)) {
          searchMatches.add(iconName);
        }
      });
    }

    return orderedIconNames.filter((iconName) => {
      if (normalizedQuery.length > 0 && searchMatches && !searchMatches.has(iconName)) {
        return false;
      }
    
      if (selectedStyles.length === 0 || selectedStyles.length === 2) {
        return true;
      } else if (selectedStyles.includes("monochrome")) {
        return iconName.endsWith("-monochrome");
      } else if (selectedStyles.includes("gradient")) {
        return !iconName.endsWith("-monochrome");
      }

      return true;
    });

  }, [searchQuery, selectedStyles]);

  const handleCopySvg = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
        await navigator.clipboard.writeText(svgText);
        addToast({
          title: "Copied",
          message: `${iconName} has been copied to your clipboard.`,
          type: "success",
        });
    } catch (err) {
      addToast({
        title: "Failed to copy",
        message: `${iconName} has failed to copy to your clipboard.`,
        type: "error",
      });
      console.error("Failed to copy SVG:", err);
    }
  };

  const handleDownloadSvg = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      saveAs(blob, `${iconName}.svg`);
      addToast({
        title: "Downloaded",
        message: `${iconName}.svg has been downloaded.`,
        type: "success",
      });
    } catch (err) {
      addToast({
        title: "Failed to download",
        message: `${iconName}.svg has failed to download.`,
        type: "error",
      });
      console.error("Failed to download SVG:", err);
    }
  };

  const handleDownloadPng = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
      const pngBlob = await svgToPngBlob(svgText);
      saveAs(pngBlob, `${iconName}.png`);
      addToast({
        message: `Downloaded ${iconName}.png`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to download PNG:", err);
    }
  };

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleDownloadAll = async (format: "SVG" | "PNG") => {
    setIsDownloadingAll(true);
    const zip = new JSZip();
    let processErrors = 0;
    
    try {
      // Create an array of promises for all icon processing
      const downloadPromises = filteredIcons.map(async (iconName) => {
        try {
          const svgText = await fetchSvgText(iconName);
          
          if (format === "SVG") {
            // Store the raw SVG
            zip.file(`${iconName}.svg`, svgText);
          } else {
            // Convert to PNG 
            const pngBlob = await svgToPngBlob(svgText);
            const arrayBuffer = await blobToArrayBuffer(pngBlob);
            zip.file(`${iconName}.png`, arrayBuffer);
          }
          
          return { success: true, iconName };
        } catch (err) {
          processErrors++;
          console.error(`Failed to process ${iconName}:`, err);
          return { success: false, iconName, error: err };
        }
      });
      
      const results = await Promise.all(downloadPromises);
      
      if (processErrors > 0) {
        addToast({
          message: `Completed with ${processErrors} errors. Downloaded ${results.length - processErrors} of ${results.length} icons.`,
          type: "warning",
        });
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `growthepie_icons_${format.toLowerCase()}.zip`);
      
      addToast({
        message: `Successfully downloaded ZIP file with ${results.length - processErrors} icons.`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
      
      addToast({
        message: "Failed to generate ZIP file.",
        type: "error",
        action: {
          label: "Try Again",
          onClick: () => handleDownloadAll(format)
        }
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };



  

  return (
    <div className="flex flex-col min-h-screen"> 
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        iconsCount={filteredIcons.length}
        onDownloadAll={handleDownloadAll}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedStyles={selectedStyles}
        setSelectedStyles={setSelectedStyles}
      />

      {/* Main content */}
      <main
        className="
          pt-[110px] md:pt-[175px] 
          flex
          justify-center
          pb-[215px] md:pb-[180px]
        "
      >
        <div
          className="
            max-w-[1315px]
            w-full
            px-[20px]
            md:px-[60px]
            flex
            flex-col
            gap-[30px]
          "
        >
          {/* <LabelsContainer className="pt-[110px] md:pt-[175px] w-full flex items-end sm:items-center justify-between md:justify-start gap-x-[10px] z-[21]">
            <h1 className="text-[20px] md:text-[30px] pl-[15px] leading-[120%] font-bold z-[19]">
              Smart Contracts on Ethereum Layer 2s
            </h1>
          </LabelsContainer> */}
          {/* Title */}
          <div
            className="
              w-full
              flex
              flex-wrap
              justify-center
              gap-[15px]
            "
          >
          <div className="w-full flex justify-between mx-auto">
            <h1 className="pl-[15px] heading-large-sm md:heading-large-lg">
              Copy or download icons from growthepie's icon set.
            </h1>
            {/* Any other elements that should be beside the title */}
          </div>
          </div>

          {/* Icon Cards - Grid Container */}
          <div
            className="
              w-full
              flex
              flex-wrap
              justify-center
              gap-[15px]
            "
          >
          
            {filteredIcons.map((iconName) => (
              <IconCard
                key={iconName}
                iconName={iconName as GTPIconName}
                onCopy={() => handleCopySvg(iconName)}
                // Switch between SVG/PNG downloads based on selectedFormat
                onDownload={
                  selectedFormat === "SVG"
                    ? () => handleDownloadSvg(iconName)
                    : () => handleDownloadPng(iconName)
                }
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        iconsCount={filteredIcons.length}
        onDownloadAll={handleDownloadAll}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedStyles={selectedStyles}
        setSelectedStyles={setSelectedStyles}
       />
    </div>
  );
};

export default IconsPage;

type IconCardProps = {
  iconName: GTPIconName;
  onCopy: () => void;
  onDownload: () => void;
};

const IconCard = ({ iconName, onCopy, onDownload }: IconCardProps) => {
  return (
    <div
      className="
        group
        flex flex-col 
        justify-between 
        items-center
        w-[95px] 
        h-[60px]
        bg-[#1F2726]
        hover:bg-[#5A6462]
        rounded-[11px]
        pt-[5px] 
        pr-[13px] 
        pb-[5px] 
        pl-[13px]
        transition-transform 
        transform 
        hover:scale-105
      "
      aria-label={`Icon card: ${iconName}`}
      title={iconName}
    >
      {/* Main Icon (24x24) */}
      <GTPIcon icon={iconName} size="md" className="w-[24px] h-[24px]" />

      {/* Name vs. Copy/Download */}
      <div className="relative w-[69px] flex justify-center mt-1">
        <span className="group-hover:hidden text-sm text-center h-[21px] truncate">
          {iconName}
        </span>
        <div className="hidden group-hover:flex flex-row items-center gap-[10px] h-[15px]">
          {/* Copy */}
          <button onClick={onCopy}>
            <GTPIcon icon="gtp-copy" size="sm" className="w-[15px] h-[15px]" />
          </button>
          {/* Single Download (SVG or PNG) */}
          <button onClick={onDownload}>
            <GTPIcon icon="gtp-download" size="sm" className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
