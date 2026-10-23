// File: app/(layout)/quick-bites/page.tsx
import { PageContainer } from '@/components/layout/Container';
import { Title } from '@/components/layout/TextHeadingComponents';
import { Metadata } from 'next';
import QuickBitesBrowser from '@/components/quick-bites/QuickBitesBrowser';
import { getListedQuickBites } from '@/lib/quick-bites/themes';

export const metadata: Metadata = {
  title: 'Quick Bites - growthepie',
  description: 'Short and focused articles of specific topics or trends in the Ethereum ecosystem'
};

export default function QuickBitesPage() {
  // Published Quick Bites, newest first
  const quickBites = getListedQuickBites();



  return (
    <div className="pt-[15px]">
      <PageContainer>
        <Title
          title="Quick Bites"
          icon="gtp-quick-bites"
          as="h1"
        />
        
        <p className="text-md md:text-sm mb-4">
          Short and focused articles of specific topics or trends in the Ethereum ecosystem.
        </p>
        
        <QuickBitesBrowser quickBites={quickBites} activeTopic="all" />
      </PageContainer>
    </div>
  );
}