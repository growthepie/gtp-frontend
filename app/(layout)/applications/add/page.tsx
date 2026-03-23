import { Metadata } from "next";
import ProjectEditPageClient from "../_components/ProjectEditPageClient";

export const metadata: Metadata = {
  title: "Add Project | growthepie",
  description: "Add a new project to the Open Labels Initiative. Register your project details and label your smart contracts with usage categories to improve onchain data transparency.",
};

export default function AddProjectPage() {
  return <ProjectEditPageClient />;
}
