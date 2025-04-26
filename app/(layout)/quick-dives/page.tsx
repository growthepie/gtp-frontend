import { PageContainer } from '@/components/layout/Container';
import { Title } from '@/components/layout/TextHeadingComponents';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Metadata } from 'next';
import QuickDivesGrid from '@/components/quick-dives/QuickDivesGrid';
import { getAllQuickDives } from '@/lib/mock/quickDivesData';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quick Dives - growthepie',
  description: 'Deep dives into Ethereum L2 technologies, trends, and updates.'
};

export default function QuickDivesPage() {
  // Get all quick dives and add slug property
  const quickDives = getAllQuickDives().map(dive => ({
    ...dive,
    slug: dive.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
  }));

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