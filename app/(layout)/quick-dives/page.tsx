// File: app/(layout)/quick-dives/page.tsx
import { PageContainer } from '@/components/layout/Container';
import { Title } from '@/components/layout/TextHeadingComponents';
import { Metadata } from 'next';
import QuickDivesGrid from '@/components/quick-dives/QuickDivesGrid';
import { getAllQuickDives } from '@/lib/mock/quickDivesData';

export const metadata: Metadata = {
  title: 'Quick Dives - growthepie',
  description: 'Deep dives into Ethereum L2 technologies, trends, and updates.'
};

export default function QuickDivesPage() {
  // Get all quick dives (now with built-in caching)
  const quickDives = getAllQuickDives();

  // Sort by date (newest first)
  const sortedQuickDives = [...quickDives].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <div className="pt-[45px] md:pt-[30px]">
      <PageContainer>
        <Title
          title="Quick Dives"
          icon="gtp-metrics-activeaddresses"
          as="h1"
        />
        
        <p className="text-md md:text-lg mb-12">
          Short, focused analyses of key developments and technologies in the Ethereum ecosystem.
        </p>
        
        <QuickDivesGrid quickDives={sortedQuickDives} />
      </PageContainer>
    </div>
  );
}