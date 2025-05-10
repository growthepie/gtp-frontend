// File: app/(layout)/quick-dives/[slug]/page.tsx
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
import { Author } from '@/lib/types/quickDives';
import Link from 'next/link';


type Props = {
  params: { slug: string };
};

const getAuthorNames = (authors: Author[] | undefined): string[] => {
  if (!authors) return [];
  return authors.map(a => a.name);
};

const getFirstAuthor = (author: Author | Author[] | undefined): Author | undefined => {
  if (!author) return undefined;
  return Array.isArray(author) ? author[0] : author;
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
      authors: getAuthorNames(quickDive.author),
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
            <span>Quick Dive</span>
            <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
              <circle cx="3" cy="3" r="3" />
            </svg>
            <span>{formatDate(quickDive.date)}</span>
            {quickDive.author && quickDive.author.length > 0 && (
              <>
                {quickDive.author.map((author) => (
                  <>
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
                      <circle cx="3" cy="3" r="3" />
                    </svg>
                    <ClientAuthorLink 
                      key={author.name}
                      name={author.name} 
                      xUsername={author.xUsername} 
                    />
                  </>
                ))}

              </>
            )}
          </div>

        </div>
        
        {/* Main content with blocks */}
        <div className="pl-[45px] pr-[120px]">
          <div className="mx-auto">
            {contentBlocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </div>
          

        </div>
                {/* Content metadata and tags */}


        <div className="h-[34px] px-[15px] py-[5px] bg-[#1F2726] rounded-full flex items-center gap-x-[10px]">
          <span className="text-xxs text-[#5A6462]">Topics Discussed</span>
          <div className="flex items-center gap-x-[5px]">
            {quickDive.topics?.map((topic) => (
              <Link
                key={topic.name}
                href={topic.url}
                className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-medium-background"
                
              >
                <GTPIcon 
                  icon={topic.icon as GTPIconName} 
                  size="sm" 
                  style={{ color: topic.color }}
                />
                <div className="text-xs">
                  {topic.name}
                </div>
              </Link>
            ))}
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