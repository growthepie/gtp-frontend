"use client";

import { notFound } from 'next/navigation';
import Container from '@/components/layout/Container';
import { GTPIcon } from '@/components/layout/GTPIcon';
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
import { ContentBlock } from '@/lib/types/blockTypes';
import { Fragment, useEffect, useState } from 'react';
import ShowLoading from '@/components/layout/ShowLoading';
import { processDynamicContent } from '@/lib/utils/dynamicContent'; // Import the new utility
import { QuickBiteProvider } from '@/contexts/QuickBiteContext';
import { useMaster } from '@/contexts/MasterContext';
import { getChainInfoFromUrl } from '@/lib/chains';
import { TitleButtonLink } from '@/components/layout/TextHeadingComponents';

type Props = {
  params: { slug: string };
};

export default function QuickBitePage({ params }: Props) {
  const { AllChainsByKeys } = useMaster();
  const [QuickBite, setQuickBite] = useState<QuickBiteData | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [relatedContent, setRelatedContent] = useState<QuickBiteWithSlug[]>([]);
  const [showNotFound, setShowNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContentBlocks = async () => {
      try {
        setIsLoading(true);
        
        const quickBite = getQuickBiteBySlug(params.slug);
        if (!quickBite) {
          setShowNotFound(true);
          return;
        }

        // Get related quick bites
        const relatedQuickBites = quickBite.related 
          ? getRelatedQuickBites(quickBite.related)
          : [];
        setRelatedContent(relatedQuickBites);

        // Process dynamic content BEFORE processing markdown
        const processedContent = await processDynamicContent(quickBite.content);
        
        // Update the quick bite with processed content
        const updatedQuickBite = {
          ...quickBite,
          content: processedContent
        };
        setQuickBite(updatedQuickBite);

        // Process markdown with the dynamic content already resolved
        const blocks = await processMarkdownContent(processedContent);
        setContentBlocks(blocks);
        
      } catch (error) {
        console.error('Error processing quick bite content:', error);
        setShowNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContentBlocks();
  }, [params.slug]);

  if (showNotFound) {
    return notFound();
  }
  
  return (
    <>
      <ShowLoading 
        dataLoading={[isLoading || !QuickBite || !contentBlocks.length]} 
        dataValidating={[]} 
      />
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
          <QuickBiteProvider>
            <div className="lg:pl-[45px] lg:pr-[120px]">
              <div className=" md:mx-auto">
                {contentBlocks.map((block) => {
                  
                  return <Block key={block.id} block={block} />
                })}
              </div>
            </div>
          </QuickBiteProvider>

          {/* Content metadata and tags */}
          <div className="h-[34px] px-[15px] py-[5px] bg-[#1F2726] rounded-full flex items-center gap-x-[10px]">
            <span className="text-xxs text-[#5A6462]">Topics Discussed</span>
            <div className="flex items-center gap-x-[5px]">
              {QuickBite && QuickBite.topics && QuickBite.topics.map((topic) => {
                let resolvedIcon: GTPIconName | undefined = topic.icon;
                let resolvedColor = topic.color;
                
                if (topic.url.startsWith('/chains/') && !topic.icon) {
                  const chainInfo = getChainInfoFromUrl(topic.url, AllChainsByKeys);
                  if (chainInfo) {
                    resolvedIcon = chainInfo.icon as GTPIconName;
                    resolvedColor = chainInfo.color;
                  }
                }
                
                return (
                  <Link key={topic.url} href={topic.url} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-medium-background">
                    <GTPIcon icon={resolvedIcon || "chain-dark"} size="sm" style={{ color: resolvedColor }} />
                    <div className="text-xs">{topic.name}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Related content section */}
          {relatedContent.length > 0 && QuickBite && (
            <QuickBiteClientContent 
              content={QuickBite.content}
              image={QuickBite.image}
              relatedQuickBites={relatedContent}
              topics={QuickBite.topics?.map(topic => ({
                ...topic,
                icon: topic.icon || ""
              }))}
            />
          )}
        </Container>
      </div>
    </>
  );
}