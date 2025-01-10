"use client";

import Header from "../../(icons)/icons/Header";
import Footer from "../../(icons)/icons/Footer";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { iconNames, GTPIconName } from "@/icons/gtp-icon-names";

const IconsPage = () => {
  return (
    <div className="flex flex-col h-screen">
      {/* Header*/}
      <Header downloadCSV={() => {}} downloadJSON={() => {}} />

      {/* Scrollable Container*/}
      <main
        className="
          flex-grow
          overflow-y-auto
          pt-[118px] md:pt-[175px]
          flex
          justify-center
          mb-[100px]
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
              Copy or download icons from growthepie’s icon set.
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
            {iconNames.map((iconName) => (
              <IconCard iconName={iconName as GTPIconName} key={iconName} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer downloadCSV={() => {}} downloadJSON={() => {}} />
    </div>
  );
};

export default IconsPage;

/* ---------------------------------------------
   Icon Card
   ---------------------------------------------
   - Shows iconName by default, truncated if too long
   - On hover: name is hidden, replaced by copy & download icons
   - 'title={iconName}' provides a native tooltip with the full name
*/
type IconCardProps = {
  iconName: GTPIconName;
};

const IconCard = ({ iconName }: IconCardProps) => {
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
      <GTPIcon 
        icon={iconName} 
        size="md" 
        className="w-[24px] h-[24px]" 
      />

      {/* Name vs. Copy/Download Icons */}
      <div className="relative w-[69px] flex justify-center mt-1">
        <span className="group-hover:hidden text-sm text-center h-[21px] truncate">
          {iconName}
        </span>
        <div className="hidden group-hover:flex flex-row items-center gap-[10px] h-[15px]">
          <GTPIcon icon="gtp-copy" size="sm" className="w-[15px] h-[15px]" />
          <GTPIcon icon="gtp-download-monochrome" size="sm" className="w-[15px] h-[15px]" />
        </div>
      </div>
    </div>
  );
};
