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
import RelatedQuickBites from '@/components/RelatedQuickBites';
import { Author, QuickBiteData, QuickBiteWithSlug } from '@/lib/types/quickBites';
import Link from 'next/link';
import QuickBiteClientContent from '@/components/quick-bites/QuickBiteClientContent';
import Icon from "@/components/layout/Icon";
import { ContentBlock } from '@/lib/types/blockTypes';
import { Fragment, useEffect, useState } from 'react';
import ShowLoading from '@/components/layout/ShowLoading';
import { processDynamicContent } from '@/lib/utils/dynamicContent';
import { QuickBiteProvider } from '@/contexts/QuickBiteContext';
import { useMaster } from '@/contexts/MasterContext';
import { getChainInfoFromUrl } from '@/lib/chains';
import { TitleButtonLink } from '@/components/layout/TextHeadingComponents';
import { SmartBackButton } from '@/components/SmartBackButton';
import { useTheme } from 'next-themes';
import { useUIContext } from '@/contexts/UIContext';

type Props = {
  params: { slug: string };
};

export default function ClientQuickBitePage({ params }: Props) {
  const { AllChainsByKeys } = useMaster();
  const setEthUsdSwitchEnabled = useUIContext((state) => state.setEthUsdSwitchEnabled);
  const [QuickBite, setQuickBite] = useState<QuickBiteData | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [relatedContent, setRelatedContent] = useState<QuickBiteWithSlug[]>([]);
  const [showNotFound, setShowNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const quickBite = getQuickBiteBySlug(params.slug);
    setEthUsdSwitchEnabled(quickBite?.ethUsdSwitchEnabled === true);
  }, [params.slug, setEthUsdSwitchEnabled]);

  useEffect(() => {
    const fetchContentBlocks = async () => {
      try {
        setIsLoading(true);
        
        const quickBite = getQuickBiteBySlug(params.slug);
        if (!quickBite) {
          setShowNotFound(true);
          return;
        }

        const relatedQuickBites = quickBite.related
          ? quickBite.related
              .map(slug => {
                const data = getQuickBiteBySlug(slug);
                return data ? { ...data, slug } : null;
              })
              .filter((item): item is QuickBiteWithSlug => item !== null)
          : [];
        setRelatedContent(relatedQuickBites);

        const processedContent = await processDynamicContent(quickBite.content);
        const updatedQuickBite = { ...quickBite, content: processedContent };
        setQuickBite(updatedQuickBite);

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
              <SmartBackButton />
              <div className='items-center justify-center w-[36px] h-[36px] md:flex hidden'>   
                <GTPIcon icon="gtp-quick-bites" size="lg" />
              </div>
              <h1 className={`leading-snug heading-large-md md:heading-large-lg xl:heading-large-xl flex items-center `}>
                {QuickBite && QuickBite.title}
              </h1>
            </div>

            {/* Author section */}
            <div className="flex lg:justify-normal justify-between lg:w-auto w-full  items-center h-full gap-x-2 text-sm">
              <Link className="lg:hidden flex items-center justify-center rounded-full w-[36px] h-[36px] bg-color-bg-medium" href={"/"}>
                <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
              </Link>  
              <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse whitespace-nowrap'>
                {QuickBite && QuickBite.author && (
                  <>
                    <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse'>
                      {QuickBite.author.map((author) => (
                        <Fragment key={author.xUsername}>
                          <ClientAuthorLink name={author.name} xUsername={author.xUsername} />
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
          
          {/* Main content */}
          <QuickBiteProvider>
            <div className="lg:pl-[45px] lg:pr-[120px]">
              <div className=" md:mx-auto">
                {contentBlocks.map((block) => (
                  <Block key={block.id} block={block} />
                ))}
              </div>
            </div>
          </QuickBiteProvider>

          {/* Topics */}
          <div className="h-[34px] px-[15px] py-[5px] bg-color-bg-default rounded-full flex items-center gap-x-[10px]">
            <span className="text-xxs text-color-text-secondary">Topics Discussed</span>
            <div className="flex items-center gap-x-[5px]">
              {QuickBite && QuickBite.topics && QuickBite.topics.map((topic) => {
                let resolvedIcon: GTPIconName | undefined = topic.icon;
                let resolvedColor = topic.color;
                
                if (topic.url.startsWith('/chains/') && !topic.icon) {
                  const chainInfo = getChainInfoFromUrl(topic.url, AllChainsByKeys, theme as "light" | "dark");
                  if (chainInfo) {
                    resolvedIcon = chainInfo.icon as GTPIconName;
                    resolvedColor = chainInfo.color;
                  }
                }
                
                return topic.url ? (
                  <Link key={topic.url} href={topic.url} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium">
                    <GTPIcon icon={resolvedIcon || "chain-dark"} size="sm" style={{ color: resolvedColor }} />
                    <div className="text-xs">{topic.name}</div>
                  </Link>
                ) : (
                  <div key={topic.name} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium">
                    <GTPIcon icon={resolvedIcon || "chain-dark"} size="sm" style={{ color: resolvedColor }} />
                    <div className="text-xs">{topic.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <RelatedQuickBites slug={params.slug} />
        </Container>
      </div>
    </>
  );
}
