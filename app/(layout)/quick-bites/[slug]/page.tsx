"use client";

import { notFound } from 'next/navigation';
import Container, { PageContainer } from '@/components/layout/Container';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { Title } from '@/components/layout/TextHeadingComponents';
import Heading from '@/components/layout/Heading';
import { Metadata } from 'next';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { getQuickBiteBySlug, getRelatedQuickBites } from '@/lib/quick-bites/quickBites';
import ClientAuthorLink from '@/components/quick-bites/ClientAuthorLink';
import Block from '@/components/quick-bites/Block';
import { formatDate } from '@/lib/utils/formatters';
import { processMarkdownContent } from '@/lib/utils/markdownParser';
import RelatedQuickBites from '@/components/quick-bites/RelatedQuickBites';
import { Author, QuickBiteData, QuickBiteWithSlug } from '@/lib/types/quickBites';
import Link from 'next/link';
import QuickBiteClientContent from '@/components/quick-bites/QuickBiteClientContent';
import Icon from "@/components/layout/Icon";
import { useMediaQuery } from 'usehooks-ts';
import { ContentBlock } from '@/lib/types/blockTypes';
import { Fragment, useEffect, useState } from 'react';
import ShowLoading from '@/components/layout/ShowLoading';

type Props = {
  params: { slug: string };
};

export default function QuickBitePage({ params }: Props) {
  const [QuickBite, setQuickBite] = useState<QuickBiteData | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [relatedContent, setRelatedContent] = useState<QuickBiteWithSlug[]>([]);
  const [showNotFound, setShowNotFound] = useState(false);

  useEffect(() => {
    const fetchContentBlocks = async () => {
      const QuickBite = getQuickBiteBySlug(params.slug);
      if (!QuickBite) {
        setShowNotFound(true);
        return;
      }

      setQuickBite(QuickBite);

      // Get related quick bites
      const relatedQuickBites = QuickBite.related 
      ? getRelatedQuickBites(QuickBite.related)
      : [];

      setRelatedContent(relatedQuickBites);

      const blocks = await processMarkdownContent(QuickBite.content);
      setContentBlocks(blocks);
    };
    fetchContentBlocks();
  }, [params.slug]);

  
  // Convert array of text content to structured blocks using our new markdown parser
  // const contentBlocks = processMarkdownContent(QuickBite.content);

  
  

  if (showNotFound) {
    return notFound();
  }
  
  return (
    <>
    <ShowLoading dataLoading={[!QuickBite, !contentBlocks, !relatedContent]} dataValidating={[]} />
    <div className="">
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] mb-[15px]"
        isPageRoot
      >
        {/* Header section */}
        <div className=" flex flex-col-reverse lg:gap-y-0 gap-y-[10px] lg:flex-row w-full justify-between items-center h-fit">
          <div className='flex items-center h-[43px] gap-x-[8px] lg:w-auto w-full'>
            {/* Back button */}
            <Link className="lg:flex hidden items-center justify-center rounded-full w-[36px] h-[36px] bg-[#344240] hover:bg-[#5A6462]" href={"/"}>
              <Icon icon="feather:arrow-left" className="size-[26px] text-[#CDD8D3]" />
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
              {QuickBite && QuickBite.title}
            </h1>
          </div>
          {/* Author section */}
          <div className="flex lg:justify-normal justify-between lg:w-auto w-full  items-center h-full gap-x-2 text-sm">
            <Link className="lg:hidden flex items-center justify-center rounded-full w-[36px] h-[36px] bg-[#344240]" href={"/"}>
              <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
            </Link>  
            <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse whitespace-nowrap'>
              {QuickBite && QuickBite.author && (
                <>
                  <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse'>
                    {QuickBite.author.map((author) => (
                      <Fragment key={author.xUsername}>
                        <ClientAuthorLink 
                          name={author.name} 
                          xUsername={author.xUsername} 
                        />
                        <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
                          <circle cx="3" cy="3" r="3" />
                        </svg>
                      </Fragment>
                    ))}
                  </div>
                </>
              )}
              <span className='text-xxs lg:text-sm'>{QuickBite && formatDate(QuickBite.date)}</span>
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
            {QuickBite && QuickBite.topics && QuickBite.topics.map((topic) => (
              <Link
                key={topic.url}
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
        {relatedContent.length > 0 && QuickBite && (
          <QuickBiteClientContent 
            content={QuickBite.content}
            image={QuickBite.image}
            relatedQuickBites={relatedContent}
            topics={QuickBite.topics}
          />
        )}
      </Container>
    </div>
    </>
  );
}