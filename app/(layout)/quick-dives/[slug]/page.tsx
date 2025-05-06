// File: app/(layout)/quick-dives/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/Container';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Title } from '@/components/layout/TextHeadingComponents';
import Heading from '@/components/layout/Heading';
import { Metadata } from 'next';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { getQuickDiveBySlug, getRelatedQuickDives } from '@/lib/mock/quickDivesData';
import ClientAuthorLink from '@/components/quick-dives/ClientAuthorLink';
import Block from '@/components/quick-dives/Block';
import { formatDate } from '@/lib/utils/formatters';
import { processMarkdownContent } from '@/lib/utils/markdownParser';
import RelatedQuickDives from '@/components/quick-dives/RelatedQuickDives';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quickDive = getQuickDiveBySlug(params.slug);
  
  if (!quickDive) {
    return {
      title: 'Quick Dive Not Found',
    };
  }

  return {
    title: `${quickDive.title} - growthepie Quick Dive`,
    description: quickDive.subtitle,
    openGraph: {
      title: quickDive.title,
      description: quickDive.subtitle,
      type: 'article',
      authors: quickDive.author ? [quickDive.author.name] : undefined,
    },
  };
}

export default async function QuickDivePage({ params }: Props) {
  const quickDive = getQuickDiveBySlug(params.slug);
  
  if (!quickDive) {
    return notFound();
  }
  
  // Convert array of text content to structured blocks using our new markdown parser
  const contentBlocks = await processMarkdownContent(quickDive.content);
  
  // Get related quick dives
  const relatedContent = quickDive.related 
    ? getRelatedQuickDives(quickDive.related)
    : [];
  
  return (
    <div className="pt-[45px] md:pt-[30px]">
      <PageContainer>
        {/* Header section */}
        <div className="mb-6">
          <div className="flex items-center gap-x-2 text-xs text-forest-700 dark:text-forest-400 mb-4">
            <span>Quick Dive</span>
            <span className="mx-1">•</span>
            <span>{formatDate(quickDive.date)}</span>
            {quickDive.author && (
              <>
                <span className="mx-1">•</span>
                <ClientAuthorLink 
                  name={quickDive.author.name} 
                  xUsername={quickDive.author.xUsername} 
                />
              </>
            )}
          </div>
          
          <Title
            title={quickDive.title}
            icon={quickDive.icon as GTPIconName}
            as="h1"
          />
          
          <p className="text-lg md:text-xl mt-4 mb-8 max-w-4xl">
            {quickDive.subtitle}
          </p>
        </div>
        
        {/* Main content with blocks */}
        <div className="bg-forest-50 dark:bg-[#1F2726] rounded-xl p-6 md:p-8 mb-12 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {contentBlocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </div>
          
          {/* Content metadata and tags */}
          <div className="mt-12 pt-8 border-t border-forest-200 dark:border-forest-800">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-forest-100 dark:bg-forest-900 rounded-full text-xs">
                {quickDive.icon.replace(/-/g, ' ').replace('logo monochrome', '')}
              </span>
              <span className="px-3 py-1 bg-forest-100 dark:bg-forest-900 rounded-full text-xs">
                Layer 2
              </span>
              <span className="px-3 py-1 bg-forest-100 dark:bg-forest-900 rounded-full text-xs">
                Technical
              </span>
            </div>
          </div>
        </div>
        
        {/* Related content section */}
        {relatedContent.length > 0 && (
          <RelatedQuickDives relatedQuickDives={relatedContent} />
        )}
      </PageContainer>
    </div>
  );
}