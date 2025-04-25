// File: app/(layout)/quick-dives/page.tsx
// This is a server component (default in Next.js App Router)

import { Suspense } from 'react';
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";
import QuickDivesGrid from "@/components/quick-dives/QuickDivesGrid";
import Loading from "./loading";
import { getAllQuickDives } from '@/lib/mock/quickDivesData';

export default function QuickDivesIndexPage() {
  // Get all quick dives and sort by date (newest first)
  const quickDives = getAllQuickDives()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon="gtp-project"
            title="Quick Dives"
            as="h1"
          />
          <Description>
            In-depth looks at interesting blockchain development trends and technologies. 
            These quick dives provide focused analysis on specific features, updates, and innovations 
            across the Ethereum ecosystem.
          </Description>
        </Section>
        
        <Suspense fallback={<Loading />}>
          <Section className="mt-8">
            <QuickDivesGrid quickDives={quickDives} />
          </Section>
        </Suspense>
      </PageContainer>
    </PageRoot>
  );
}