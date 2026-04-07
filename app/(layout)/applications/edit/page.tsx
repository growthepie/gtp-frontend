import { Metadata } from "next";
import ProjectEditPageClient from "../_components/ProjectEditPageClient";

export const metadata: Metadata = {
  title: "Edit Project | growthepie",
  description: "Edit your project details and label smart contracts with usage categories on the Open Labels Initiative. Help improve onchain data transparency for the Ethereum ecosystem.",
};

export default function EditProjectPage() {
  return <ProjectEditPageClient />;
}
