// File: app/(layout)/quick-bites/page.tsx
import { PageContainer } from '@/components/layout/Container';
import { Title } from '@/components/layout/TextHeadingComponents';
import { Metadata } from 'next';
import QuickBitesGrid from '@/components/quick-bites/QuickBitesGrid';
import { getAllQuickBites } from '@/lib/mock/quickBitesData';

export const metadata: Metadata = {
  title: 'Quick Bites - growthepie',
  description: 'Short and focused analyses of specific topics or trends in the Ethereum ecosystem'
};

export default function QuickBitesPage() {
  // Get all quick bites (now with built-in caching)
  const QuickBites = getAllQuickBites();

  // Sort by date (newest first)
  const sortedQuickBites = [...QuickBites].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <div className="pt-[45px] md:pt-[30px]">
      <PageContainer>
        <Title
          title="Quick Bites"
          icon="gtp-metrics-activeaddresses"
          as="h1"
        />
        
        <p className="text-md md:text-lg mb-12">
          Short and focused analyses of specific topics or trends in the Ethereum ecosystem.
        </p>
        
        <QuickBitesGrid QuickBites={sortedQuickBites} />
      </PageContainer>
    </div>
  );
}