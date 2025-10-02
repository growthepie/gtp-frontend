// File: app/(layout)/quick-bites/page.tsx
import { PageContainer } from '@/components/layout/Container';
import { Title } from '@/components/layout/TextHeadingComponents';
import { Metadata } from 'next';
import QuickBitesGrid from '@/components/quick-bites/QuickBitesGrid';
import { getAllQuickBites } from '@/lib/quick-bites/quickBites';

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
    <div className="pt-[15px]">
      <PageContainer>
        <Title
          title="Quick Bites"
          icon="gtp-quick-bites"
          as="h1"
        />
        
        <p className="text-md md:text-sm mb-4">
          Short and focused analyses of specific topics or trends in the Ethereum ecosystem.
        </p>
        
        <QuickBitesGrid QuickBites={sortedQuickBites} IsLanding={false} />
      </PageContainer>
    </div>
  );
}