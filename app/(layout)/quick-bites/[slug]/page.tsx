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
  
    //              <Title
              //   title={QuickBite.title}
              //   icon={QuickBite.icon as GTPIconName}
              //   as="h1"
              //   backArrow={true}
              //   backArrowLink={"/"}
              // />

  // <div class="flex items-center min-h-[43px] gap-x-[8px]">
  //   <div class="size-[36px] bg-[#344240] rounded-full flex justify-center items-center cursor-pointer">
  //     <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="size-[26px] text-[#CDD8D3] iconify iconify--feather" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m7 7l-7-7l7-7"></path></svg>
  //   </div>
  //   <div class="flex-1 flex items-center min-h-[43px] gap-x-[8px]">
  //     <div class="flex items-center justify-center select-none bg-[#151A19] rounded-full size-[36px]">
  //       <div class="flex items-center justify-center size-[36px] bg-[#151A19] !bg-transparent rounded-full">
  //         <div class="w-[24px] h-[24px] ">
  //           <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="w-[24px] h-[24px] text-[#5A6462] iconify iconify--gtp" width="1em" height="1em" viewBox="0 0 15 15"><g fill="none"><g clip-path="url(#iconifyReact5701)"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 0C1.58723 0.000253659 0.0329508 1.53489 0.000976562 3.44009L0 3.44141V12.5C0 13.5 1 15 2.5 15H15V3H4V0H3.5C3.50016 0 3.49984 0 3.5 0ZM3 1.05011C2.82627 1.08541 2.65908 1.13872 2.50047 1.20802C1.61752 1.5938 1.00047 2.47484 1.00047 3.5L1 10.051C1.52509 9.51494 2.22118 9.14702 3 9.03551V1.05011ZM3.50047 10C3.14492 10 2.80671 10.0742 2.50047 10.208C1.61752 10.5938 1.00047 11.4748 1.00047 12.5C1.00047 12.7098 1.12735 13.1091 1.44008 13.4665C1.73626 13.805 2.10473 14 2.5 14H14V4H4V10H3.50047Z" fill="url(#iconifyReact5699)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 6C5.44772 6 5 6.44772 5 7V11C5 11.5523 5.44772 12 6 12H10C10.5523 12 11 11.5523 11 11V7C11 6.44772 10.5523 6 10 6H6ZM8.40849 7.27134C8.24739 6.90955 7.75261 6.90955 7.59151 7.27134L7.34195 7.8318C7.27637 7.97907 7.14205 8.0805 6.98703 8.09982L6.39709 8.17333C6.01626 8.22078 5.86337 8.70988 6.14463 8.98093L6.58033 9.40082C6.69482 9.51116 6.74613 9.67528 6.7159 9.83449L6.60086 10.4404C6.52659 10.8315 6.92688 11.1338 7.26181 10.9395L7.78065 10.6386C7.91699 10.5595 8.08301 10.5595 8.21935 10.6386L8.73819 10.9395C9.07312 11.1338 9.47341 10.8315 9.39914 10.4404L9.2841 9.83449C9.25387 9.67528 9.30518 9.51116 9.41967 9.40082L9.85537 8.98093C10.1366 8.70988 9.98374 8.22078 9.60291 8.17333L9.01297 8.09982C8.85795 8.0805 8.72363 7.97907 8.65805 7.8318L8.40849 7.27134Z" fill="url(#iconifyReact5700)"></path></g><defs><linearGradient id="iconifyReact5699" x1="7.5" y1="0" x2="7.5" y2="15" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor"></stop></linearGradient><linearGradient id="iconifyReact5700" x1="8" y1="6" x2="12.0447" y2="11.6864" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor"></stop></linearGradient><clipPath id="iconifyReact5701"><rect width="15" height="15" fill="white"></rect></clipPath></defs></g></svg>
  //         </div>
  //       </div>
  //     </div>
  //     <h1 class="font-bold heading-large-lg lg:heading-large-xl min-h-[36px] flex-1">
  //       <span>Infinitism (ERC-4337) - Account Abstraction</span>
  //     </h1>
  //   </div>
  // </div>
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
              <GTPIcon icon={QuickBite.icon as GTPIconName} className={`object-contain `} size={"lg"} />
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