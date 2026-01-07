"use client";
import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import { useLocalStorage } from "usehooks-ts";
import Subheading from "@/components/layout/Subheading";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Icon from "@/components/layout/ServerIcon";
import { text } from "stream/consumers";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useEffect, useRef, useState } from "react";

type IconValues = {
  [key: string]: GTPIconName;
};

type HeaderValues = {
  [key: string]: string;
};

type SubheaderValues = {
  [key: string]: string;
};


const textTogglesFirst: DynamicHeaderSectionProps = {
  iconValues: {
    total: "gtp-ethereumlogo",
    l2: "gtp-ethereumlogo",
  },
  headingValues: {
    total: "Ethereum Ecosystem Traction",
    l2: "Layer 2 Traction",
  },
  subheaderValues: {
    total: "These aggregated metrics across Ethereum Mainnet and all tracked Layer 2s give you a glimpse of the entire Ethereum ecosystem.",
    l2: "These aggregated metrics across all tracked Layer 2s give you a glimpse of the Ethereum Layer 2 ecosystem.",
  },
};

const textTogglesSecond: DynamicHeaderSectionProps = {
  iconValues: {
    total: "gtp-ethereum-weekly",
    l2: "gtp-ethereum-weekly",
  },
  headingValues: {
    total: "Ethereum Weekly Engagement",
    l2: "Layer 2 Weekly Engagement",
  },
  subheaderValues: {
    total: "Number of unique addresses interacting with one or multiple chains in the Ethereum ecosystem in a given week.",
    l2: "Number of unique addresses interacting with one or multiple Layer 2s in the Ethereum ecosystem in a given week.",
  },
};

export type DynamicHeaderSectionProps = {
  iconValues?: IconValues;
  selectedIconValues?: string;
  headingValues?: HeaderValues;
  selectedHeadingValue?: string;
  subheaderValues?: SubheaderValues;
  selectedSubheaderValue?: string;
  iconClassName?: string;
  headingClassName?: string;
  subheadingClassName?: string;
};
export const DynamicHeaderSection = ({
  iconValues, 
  selectedIconValues,
  headingValues, 
  selectedHeadingValue, 
  subheaderValues, 
  selectedSubheaderValue,
  iconClassName,
  headingClassName,
  subheadingClassName
}: DynamicHeaderSectionProps) => {
  return (
    <>
      <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
        {iconValues && selectedIconValues && (
          <motion.div
            initial={{ opacity: 0}}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <GTPIcon icon={iconValues[selectedIconValues] as GTPIconName} size="lg" className={iconClassName || ""} />
          </motion.div>
        )}
        {headingValues && selectedHeadingValue && (
        <Heading id="layer-2-traction-title" className={headingClassName || "heading-large-lg"}>
          <motion.span
            key={selectedHeadingValue} // Unique key forces animation on change
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {headingValues[selectedHeadingValue]}
          </motion.span>
          </Heading>
        )}
      </div>
      {subheaderValues && selectedSubheaderValue && (
      <Subheading className={subheadingClassName || "text-md px-[5px] md:px-0"} >
        
          <motion.span
          key={selectedSubheaderValue}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {subheaderValues[selectedSubheaderValue]}
          </motion.span>
        </Subheading>
      )}
    </>
  )
}


export const LandingFirstHeaders = () => {
  const [isFocusEnabled] = useLocalStorage("focusEnabled", false);

  return (
    <>
      <DynamicHeaderSection
        iconValues={textTogglesFirst.iconValues}
        selectedIconValues={isFocusEnabled ? "l2" : "total"}
        headingValues={textTogglesFirst.headingValues}
        selectedHeadingValue={isFocusEnabled ? "l2" : "total"}
        subheaderValues={textTogglesFirst.subheaderValues}
        selectedSubheaderValue={isFocusEnabled ? "l2" : "total"}
        headingClassName={"heading-large-lg"}
        subheadingClassName={"text-md px-[5px]"}
      />
    </>
  );
}

export const LandingSecondHeaders = () => {
  const [isFocusEnabled] = useLocalStorage("focusEnabled", false);

  return (
    <DynamicHeaderSection
      iconValues={textTogglesSecond.iconValues}
      selectedIconValues={isFocusEnabled ? "l2" : "total"}
      headingValues={textTogglesSecond.headingValues}
      selectedHeadingValue={isFocusEnabled ? "l2" : "total"}
      subheaderValues={textTogglesSecond.subheaderValues}
      selectedSubheaderValue={isFocusEnabled ? "l2" : "total"}
      headingClassName={"heading-large-lg"}
      subheadingClassName={"text-md px-[5px]"}
    />
  );
}

interface DynamicLabelProps {
  labels: Record<string, string> | string[];
  selectedLabel: string | number;
  className?: string;
}

export const DynamicLabel = ({ labels, selectedLabel, className }: DynamicLabelProps) => {
  const currentLabel = typeof labels === "object" && !Array.isArray(labels)
    ? labels[selectedLabel as string]
    : labels[selectedLabel as number];

  
  const [width, setWidth] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      setWidth(element.getBoundingClientRect().width);
    }
  }, [selectedLabel]);

  return (
    <div className="relative transition-all duration-300 ease-in-out overflow-hidden min-h-[21px] z-0" style={{ width: width }}>
      <AnimatePresence>
      <motion.div
      ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        key={selectedLabel}
        className={`absolute ${className || ""} z-10 top-0 bottom-0`}
      >
        {currentLabel}
      </motion.div>
      </AnimatePresence>
    </div>
  );
};