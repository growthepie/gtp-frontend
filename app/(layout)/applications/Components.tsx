"use client";
import Image from "next/image";
import { useApplicationsData } from "./ApplicationsDataContext";


type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const ApplicationIcon = ({ owner_project, size }: ApplicationIconProps) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  const sizeClassMap = {
    sm: "w-[15px] h-[15px]",
    md: "w-[24px] h-[24px]",
    lg: "w-[36px] h-[36px]",
  };

  const sizePixelMap = {
    sm: 15,
    md: 24,
    lg: 36,
  };

  return (
    <div className={`select-none ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="rounded-full select-none"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`${sizeClassMap[size]} bg-forest-950 rounded-full`}></div>
      )}
    </div>
  );
}

export const ApplicationDisplayName = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project;
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].description : "";
}