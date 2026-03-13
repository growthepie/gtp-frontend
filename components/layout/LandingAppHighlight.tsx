"use client";
import { useEffect, useMemo, useState } from "react";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { GTPIcon } from "./GTPIcon";
import Heading from "./Heading";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "@react-hook/media-query";
export default function LandingAppHighlight() {

    const { filteredProjectsData } = useProjectsMetadata();
    const [randomIndices, setRandomIndices] = useState<number[] | null>(null);
    const is2xl = useMediaQuery("(min-width: 1536px)");
    const isXL = useMediaQuery("(min-width: 1280px)");

    useEffect(() => {
        if (!filteredProjectsData || randomIndices !== null) return;
        const iconIndex = filteredProjectsData.types.indexOf("logo_path");
        const ownerIndex = filteredProjectsData.types.indexOf("owner_project");
        if (iconIndex === -1) return;
        const dataLen = filteredProjectsData.data.length;
        const indices: number[] = [];
        const seenOwners = new Set<string>();
        let attempts = 0;
        while (indices.length < 7 && attempts < dataLen * 3) {
            attempts++;
            const idx = Math.floor(Math.random() * dataLen);
            const project = filteredProjectsData.data[idx];
            const owner = ownerIndex !== -1 ? project?.[ownerIndex] : null;
            if (
                typeof project?.[iconIndex] === "string" &&
                !indices.includes(idx) &&
                (ownerIndex === -1 || (typeof owner === "string" && !seenOwners.has(owner)))
            ) {
                indices.push(idx);
                if (typeof owner === "string") seenOwners.add(owner);
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRandomIndices(indices);
    }, [filteredProjectsData, randomIndices]);

    const randomProjects = useMemo(() => {
        if (!filteredProjectsData || !randomIndices) return [];
        return randomIndices.map((i) => filteredProjectsData.data[i]);
    }, [filteredProjectsData, randomIndices]);
   
    return (

        <div className="flex w-full gap-[10px] h-full">
            {/* Large left card — width derived from height via aspect-square */}
            <Link className="flex justify-center relative aspect-square h-full rounded-[15px] bg-color-bg-default border-color-bg-medium border-[1px]"
                href={`/applications/${randomProjects?.length > 0 ? randomProjects[0][filteredProjectsData?.types?.indexOf("owner_project") ?? 0] : ""}`}
            >
                <div className="absolute top-[15px] heading-large-sm text-color-text-primary"> Explore Apps </div>
                <div className="absolute inset-0 flex items-center justify-center pt-[45px]">
                    <div className="relative h-full aspect-square">
                        <Image
                            src={`https://api.growthepie.com/v1/apps/logos/${randomProjects?.length > 0 ? randomProjects[0][filteredProjectsData?.types?.indexOf("logo_path") ?? 0] : ""}`}
                            fill={true}
                            className="rounded-full px-[10px] py-[10px] object-contain"
                            alt={randomProjects?.length > 0 ? randomProjects[0][filteredProjectsData?.types?.indexOf("display_name") ?? 0] : ""}
                        />
                    </div>
                </div>
            </Link>

            {/* Right 2×2 grid — same height, width = height (square overall) */}
            <div className={`grid grid-cols-${is2xl ? 3 :  isXL ? 2 : 1} grid-rows-2 gap-[10px] w-full h-full`}>
                {randomProjects.slice(1, is2xl ? 7 : isXL ? 5 : 3).map((project, index) => (
                    <Link className="relative  rounded-[15px] bg-color-bg-default border-color-bg-medium border-[1px]"
                        key={index + project[filteredProjectsData?.types?.indexOf("display_name") ?? 0]}
                        href={`/applications/${project[filteredProjectsData?.types?.indexOf("owner_project") ?? 0]}`}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative h-full aspect-square">
                                <Image
                                    src={`https://api.growthepie.com/v1/apps/logos/${project[filteredProjectsData?.types?.indexOf("logo_path") ?? 0]}`}
                                    fill={true}
                                    className="rounded-full px-[10px] py-[10px] object-contain"
                                    alt={project[filteredProjectsData?.types?.indexOf("display_name") ?? 0]}
                                />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>

    );
}