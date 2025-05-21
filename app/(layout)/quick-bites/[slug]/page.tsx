import { notFound } from 'next/navigation';
import Container, { PageContainer } from '@/components/layout/Container';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Title } from '@/components/layout/TextHeadingComponents';
import Heading from '@/components/layout/Heading';
import { Metadata } from 'next';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { getQuickBiteBySlug, getRelatedQuickBites } from '@/lib/mock/quickBitesData';
import ClientAuthorLink from '@/components/quick-bites/ClientAuthorLink';
import Block from '@/components/quick-bites/Block';
import { formatDate } from '@/lib/utils/formatters';
import { processMarkdownContent } from '@/lib/utils/markdownParser';
import RelatedQuickBites from '@/components/quick-bites/RelatedQuickBites';
import { Author } from '@/lib/types/quickBites';
import Link from 'next/link';
import QuickBiteClientContent from '@/components/quick-bites/QuickBiteClientContent';
import Icon from "@/components/layout/Icon";
import { useMediaQuery } from 'usehooks-ts';

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

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const QuickBite = getQuickBiteBySlug(params.slug);
  
//   if (!QuickBite) {
//     return {
//       title: 'Quick Bite Not Found',
//     };
//   }

//   return {
//     title: `${QuickBite.title} - growthepie Quick Bite`,
//     description: QuickBite.subtitle,
//     openGraph: {
//       title: QuickBite.title,
//       description: QuickBite.subtitle,
//       type: 'article',
//       authors: getAuthorNames(QuickBite.author),
//     },
//   };
// }

export default async function QuickBitePage({ params }: Props) {
  const QuickBite = getQuickBiteBySlug(params.slug);
  
  if (!QuickBite) {
    return notFound();
  }
  
  // Convert array of text content to structured blocks using our new markdown parser
  const contentBlocks = await processMarkdownContent(QuickBite.content);
  
  // Get related quick bites
  const relatedContent = QuickBite.related 
    ? getRelatedQuickBites(QuickBite.related)
    : [];
  
  return (
    <div className="">
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] mb-[15px]"
        isPageRoot
      >
        {/* Header section */}
        <div className=" flex flex-col-reverse lg:gap-y-0 gap-y-[10px] lg:flex-row w-full justify-between items-center h-fit">
          <div className='flex items-center h-[43px] gap-x-[8px] lg:w-auto w-full'>
            {/* Back button */}
            <Link className="lg:flex hidden items-center justify-center rounded-full w-[36px] h-[36px] bg-[#344240]" href={"/"}>
              <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
            </Link>   
            {/* Icon */}
            <div className='items-center justify-center w-[36px] h-[36px] md:flex hidden'>   
              {/* <GTPIcon icon={QuickBite.icon as GTPIconName} className={`object-contain `} size={"lg"} /> */}
              <GTPIcon icon="gtp-quick-bites" size="lg" />
            </div>
            {/* Title */} 
            <h1
              className={`leading-snug heading-large-md md:heading-large-lg xl:heading-large-xl flex items-center `}              
            >
              {QuickBite.title}
            </h1>
          </div>
          {/* Author section */}
          <div className="flex lg:justify-normal justify-between lg:w-auto w-full  items-center h-full gap-x-2 text-sm">
            <Link className="lg:hidden flex items-center justify-center rounded-full w-[36px] h-[36px] bg-[#344240]" href={"/"}>
              <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
            </Link>  
            <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse whitespace-nowrap'>
              {QuickBite.author && QuickBite.author.length > 1 && (
                <>
                  <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse'>
                    {QuickBite.author.map((author) => (
                      <>
                        <ClientAuthorLink 
                          key={author.name}
                          name={author.name} 
                          xUsername={author.xUsername} 
                        />
                        <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
                          <circle cx="3" cy="3" r="3" />
                        </svg>
                      </>
                    ))}
                  </div>
                </>
              )}
              <span className='text-xxs lg:text-sm'>{formatDate(QuickBite.date)}</span>
            </div>
          </div>

        </div>
        
        {/* Main content with blocks */}
        <div className="lg:pl-[45px] lg:pr-[120px]">
          <div className=" md:mx-auto">
            {contentBlocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </div>
        </div>

        {/* Content metadata and tags */}
        <div className="h-[34px] px-[15px] py-[5px] bg-[#1F2726] rounded-full flex items-center gap-x-[10px]">
          <span className="text-xxs text-[#5A6462]">Topics Discussed</span>
          <div className="flex items-center gap-x-[5px]">
            {QuickBite.topics?.map((topic) => (
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
          <QuickBiteClientContent 
            content={QuickBite.content}
            image={QuickBite.image}
            relatedQuickBites={relatedContent}
            topics={QuickBite.topics}
          />
        )}
      </Container>
    </div>
  );
}