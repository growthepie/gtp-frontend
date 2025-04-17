"use client";

import { useState } from "react";
import Header from "../../(icons)/icons/Header";
import Footer from "../../(icons)/icons/Footer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { iconNames, GTPIconName } from "@/icons/gtp-icon-names";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getIcon } from "@iconify/react";

type IconStyleOption = "gradient" | "monochrome";

const IconsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"SVG" | "PNG">("SVG");
  const [selectedStyles, setSelectedStyles] = useState<IconStyleOption[]>(["gradient"]);

  const filteredIcons = iconNames.filter((iconName) => {
    // Filter by search query
    const matchesSearch = iconName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    // Filter by style preference
    if (selectedStyles.length === 0 || selectedStyles.length === 2) {
      // If none or both styles are selected, show all icons
      return true;
    } else if (selectedStyles.includes("monochrome")) {
      // Only monochrome selected
      return iconName.endsWith("-monochrome");
    } else if (selectedStyles.includes("gradient")) {
      // Only gradient selected
      return !iconName.endsWith("-monochrome");
    }
    
    return true;
  });

  const handleCopySvg = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
      await navigator.clipboard.writeText(svgText);
      alert(`Copied ${iconName}.svg to clipboard!`);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  };

  const handleDownloadSvg = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      saveAs(blob, `${iconName}.svg`);
    } catch (err) {
      console.error("Failed to download SVG:", err);
    }
  };

  const handleDownloadPng = async (iconName: string) => {
    try {
      const svgText = await fetchSvgText(iconName);
      const pngBlob = await svgToPngBlob(svgText);
      saveAs(pngBlob, `${iconName}.png`);
    } catch (err) {
      console.error("Failed to download PNG:", err);
    }
  };

  const handleDownloadAll = async (format: "SVG" | "PNG") => {
    const zip = new JSZip();

    for (const iconName of filteredIcons) {
      try {
        const svgText = await fetchSvgText(iconName);

        if (format === "SVG") {
          // Just store the raw SVG
          zip.file(`${iconName}.svg`, svgText);
        } else {
          // Convert to PNG using a canvas approach
          const pngBlob = await svgToPngBlob(svgText);
          const arrayBuffer = await blobToArrayBuffer(pngBlob);
          zip.file(`${iconName}.png`, arrayBuffer);
        }
      } catch (err) {
        console.error(`Failed to process ${iconName}`, err);
      }
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `growthepie_icons_${format.toLowerCase()}.zip`);
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
    }
  };

  const fetchSvgText = async (iconName: string): Promise<string> => {
    const iconData = getIcon(`gtp:${iconName}`);
  
    if (!iconData) {
      throw new Error(`Icon "${iconName}" not found in the Iconify registry.`);
    }
  
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconData.width || 24} ${iconData.height || 24}" fill="currentColor">${iconData.body}</svg>`;
  };

  const svgToPngBlob = async (svgText: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const blobUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.src = blobUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          return reject(new Error("Could not get canvas context"));
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(blobUrl);
          if (!pngBlob) {
            return reject(new Error("Could not create PNG blob"));
          }
          resolve(pngBlob);
        }, "image/png");
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      };
    });
  };

  const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Could not convert blob to ArrayBuffer"));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  return (
    <div className="flex flex-col h-screen">
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
          flex-grow
          overflow-y-auto
          pt-[118px] md:pt-[175px]
          flex
          justify-center
          mb-[120px]
        "
      >
        <div
          className="
            w-[1307px]
            flex
            flex-col
            gap-[30px]
          "
        >
          {/* Title */}
          <div className="w-full flex justify-between mx-auto">
            <h1 className="text-[28px] leading-[128%] font-bold">
              Copy or download icons from growthepie's icon set.
            </h1>
          </div>

          {/* Icon Cards */}
          <div
            className="
              w-full
              flex 
              flex-wrap 
              gap-[15px] 
              mx-auto
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
      <Footer />
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
