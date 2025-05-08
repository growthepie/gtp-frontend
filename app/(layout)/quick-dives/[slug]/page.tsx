// File: app/(layout)/quick-dives/[slug]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import Container, { PageContainer } from '@/components/layout/Container';
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
import AuthorsList from '@/components/quick-dives/AuthorsList';


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
      authors: quickDive.authors ? quickDive.authors.map(author => author.name) : undefined,
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
    ? getRelatedQuickDives(quickDive.related).map(dive => ({
        ...dive,
        slug: dive.slug || dive.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
      }))
    : [];
  
  return (
    <div className="">
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] mb-[15px]"
        isPageRoot
      >
        {/* Header section */}
        <div className="flex w-full justify-between items-center h-fit">
          
          <div className=''>
              <Title
                title={quickDive.title}
                icon={quickDive.icon as GTPIconName}
                as="h1"
              />

          </div>
          <div className="flex items-center h-full gap-x-2 text-sm">
            <span>{formatDate(quickDive.date)}</span>
            <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
              <circle cx="3" cy="3" r="3" />
            </svg>
            {/* Author list */}
            {quickDive.authors && quickDive.authors.length > 0 && (
              <AuthorsList authors={quickDive.authors} className="mb-4" />
            )}
          </div>
        </div>
        
  
        
        {/* Main content with blocks */}
        <div className="">
          <div className="mx-auto">
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
      </Container>
    </div>
  );
}