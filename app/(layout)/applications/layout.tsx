import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";

import Image from "next/image";
import Icon from "@/components/layout/Icon";
import { GTPIcon } from "@/components/layout/GTPIcon";
import Search from "./Search";
import Controls from "./Controls";
import { ApplicationsDataProvider } from "./ApplicationsDataContext";
import { ApplicationsURLs } from "@/lib/urls";
import { TimespanProvider } from "./TimespanContext";
import ReactDOM from 'react-dom';

// prefetch data for all timeframes
export function PreloadResources() {
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_1d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_7d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_30d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_90d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_365d'), { as: 'fetch' });
  ReactDOM.preload(ApplicationsURLs.overview.replace('_test', '_max'), { as: 'fetch' });

  return null;
}


export default async function Layout({
  children, params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { owner_project } = params;

  return (
    <TimespanProvider>
      <ApplicationsDataProvider>
        <PreloadResources />
        {children}
      </ApplicationsDataProvider>
    </TimespanProvider>
  )
}