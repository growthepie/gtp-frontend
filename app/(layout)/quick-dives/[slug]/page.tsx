// File: app/(layout)/quick-dives/[slug]/page.tsx
// This is a server component (default in Next.js App Router)

import { Suspense } from 'react';
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";
import QuickDiveClientContent from "@/components/quick-dives/QuickDiveClientContent";
import Loading from "./loading";
import { getQuickDiveBySlug, getRelatedQuickDives } from '@/lib/mock/quickDivesData';
import { notFound } from 'next/navigation';

// Import the client component wrapper for the author link
import dynamic from 'next/dynamic';

// Dynamically import the client component with no SSR
const ClientAuthorLink = dynamic(
  () => import('@/components/quick-dives/ClientAuthorLink'),
  { ssr: false }
);

// Function to format date - can be used server-side
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function QuickDivePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const quickDiveData = getQuickDiveBySlug(slug);

  if (!quickDiveData) {
    return notFound();
  }

  // Get related quick dives data
  const relatedQuickDives = getRelatedQuickDives(quickDiveData.related);

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon={quickDiveData.icon as any}
            title={quickDiveData.title}
            as="h1"
          />
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <Description>{quickDiveData.subtitle}</Description>
            <div className="flex items-center justify-between md:justify-end gap-x-4 mt-2 md:mt-0">
              {quickDiveData.author && (
                <ClientAuthorLink 
                  name={quickDiveData.author.name} 
                  xUsername={quickDiveData.author.xUsername}
                />
              )}
              <div className="text-xs text-forest-800 dark:text-forest-400">
                {formatDate(quickDiveData.date)}
              </div>
            </div>
          </div>
        </Section>
      </PageContainer>
      
      <Suspense fallback={<Loading />}>
        <QuickDiveClientContent 
          content={quickDiveData.content}

          image={quickDiveData.image}
          relatedQuickDives={relatedQuickDives}
        />
      </Suspense>
    </PageRoot>
  );
}