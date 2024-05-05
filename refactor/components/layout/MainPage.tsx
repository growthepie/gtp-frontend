import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Icon from "@/components/layout/ServerIcon";
// import ShowLoading from "@/components/layout/ShowLoading";
import Subheading from "@/components/layout/Subheading";
import SwiperContainer from "@/components/layout/SwiperContainer";
import Link from "next/link";
import Image from "next/image";
import PageTitle from "./PageTitle";
// import { LandingURL } from "@/lib/urls";

type MainPageProps = {
  children: React.ReactNode;
};

export default async function MainPage({ children }: MainPageProps) {
  return <>{children}</>;
}
