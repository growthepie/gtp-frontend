import Heading from "@/components/layout/Heading";
import "./PageTitle.css";

type PageTitleProps = {
  title: string;
  subtitle: string;
};

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="page-title-container">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
    </div>
  );
}
