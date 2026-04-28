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
import { Author, QuickBiteData, QuickBiteWithSlug, Topic } from '@/lib/types/quickBites';
import Link from 'next/link';
import QuickBiteClientContent from '@/components/quick-bites/QuickBiteClientContent';
import Icon from "@/components/layout/Icon";
import { ContentBlock } from '@/lib/types/blockTypes';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import ShowLoading from '@/components/layout/ShowLoading';
import { processDynamicContent } from '@/lib/utils/dynamicContent';
import { QuickBiteProvider } from '@/contexts/QuickBiteContext';
import { useMaster } from '@/contexts/MasterContext';
import { getChainInfoFromUrl } from '@/lib/chains';
import { TitleButtonLink } from '@/components/layout/TextHeadingComponents';
import { SmartBackButton } from '@/components/SmartBackButton';
import { useTheme } from 'next-themes';
import { useUIContext } from '@/contexts/UIContext';
import { GTPTooltipNew } from '@/components/tooltip/GTPTooltip';

type Props = {
  params: { slug: string };
};

const normalizeChainAlias = (value: string) => value.toLowerCase().replace(/[\s:_-]+/g, "");

const parseChainUrlKey = (value: string): string | null => {
  const match = value.match(/\/chains\/([^/?#]+)/i);
  return match?.[1] || null;
};

const extractPathCandidates = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  const candidates = new Set<string>([trimmed]);
  const dotParts = trimmed.split(".");
  dotParts.forEach((part) => {
    const token = part.trim();
    if (!token) return;
    candidates.add(token);
    candidates.add(token.replace(/[_-]+/g, " "));
  });

  return Array.from(candidates);
};

const extractSeriesChainCandidates = (series: unknown): string[] => {
  if (!series || typeof series !== "object") return [];

  const entry = series as Record<string, unknown>;
  const candidates: string[] = [];
  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    candidates.push(trimmed);

    const withoutChainWord = trimmed.replace(/\bchain\b/gi, "").trim();
    if (withoutChainWord && withoutChainWord !== trimmed) {
      candidates.push(withoutChainWord);
    }

    const urlKey = parseChainUrlKey(trimmed);
    if (urlKey) {
      candidates.push(urlKey);
    }
  };

  pushCandidate(entry.key);
  pushCandidate(entry.urlKey);
  pushCandidate(entry.name);
  pushCandidate(entry.url);

  return candidates;
};

const extractDataAsJsonChainCandidates = (dataAsJson: unknown): string[] => {
  if (!dataAsJson || typeof dataAsJson !== "object") return [];

  const jsonConfig = dataAsJson as Record<string, unknown>;
  const candidates: string[] = [];
  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    candidates.push(trimmed);
    candidates.push(...extractPathCandidates(trimmed));
  };

  const metaEntries = Array.isArray(jsonConfig.meta) ? jsonConfig.meta : [];
  metaEntries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const metaEntry = entry as Record<string, unknown>;
    pushCandidate(metaEntry.name);
    pushCandidate(metaEntry.nameFromPath);
    pushCandidate(metaEntry.pathToData);
    pushCandidate(metaEntry.url);
  });

  const dynamicSeries = jsonConfig.dynamicSeries;
  if (dynamicSeries && typeof dynamicSeries === "object") {
    const dynamicConfig = dynamicSeries as Record<string, unknown>;
    const names = dynamicConfig.names;
    if (typeof names === "string") {
      pushCandidate(names);
    } else if (Array.isArray(names)) {
      names.forEach(pushCandidate);
    }
    pushCandidate(dynamicConfig.pathToData);
    pushCandidate(dynamicConfig.url);
  }

  const pieData = jsonConfig.pieData;
  if (Array.isArray(pieData)) {
    pieData.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      pushCandidate((entry as Record<string, unknown>).name);
    });
  } else if (pieData && typeof pieData === "object") {
    const pieConfig = pieData as Record<string, unknown>;
    pushCandidate(pieConfig.pathToData);
    pushCandidate(pieConfig.url);
  }

  return candidates;
};

const getChartSeriesCandidates = (data: unknown): string[] => {
  if (!Array.isArray(data)) return [];

  const candidates: string[] = [];
  data.forEach((series) => {
    candidates.push(...extractSeriesChainCandidates(series));
  });

  return candidates;
};

const collectChainCandidatesFromBlocks = (blocks: ContentBlock[]): string[] => {
  const candidates: string[] = [];

  const walk = (block: ContentBlock) => {
    if (block.type === "chart") {
      candidates.push(...getChartSeriesCandidates(block.data));
      candidates.push(...extractDataAsJsonChainCandidates(block.dataAsJson));
      return;
    }

    if (block.type === "chart-toggle") {
      block.charts.forEach((chart) => {
        candidates.push(...getChartSeriesCandidates(chart.data));
        candidates.push(...extractDataAsJsonChainCandidates(chart.dataAsJson));
      });
      return;
    }

    if (block.type === "container") {
      block.blocks.forEach((group) => group.forEach(walk));
    }
  };

  blocks.forEach(walk);
  return candidates;
};

const appendChartChainTopics = (
  topics: Topic[],
  blocks: ContentBlock[],
  allChainsByKeys: ReturnType<typeof useMaster>["AllChainsByKeys"],
): Topic[] => {
  const chainAliasToMeta = new Map<
    string,
    {
      key: string;
      name: string;
      urlKey: string;
    }
  >();

  Object.values(allChainsByKeys || {}).forEach((chain) => {
    const aliases = [chain.key, chain.urlKey, chain.label, chain.name_short]
      .filter(Boolean)
      .map((alias) => normalizeChainAlias(String(alias)));

    aliases.forEach((alias) => {
      if (!chainAliasToMeta.has(alias)) {
        chainAliasToMeta.set(alias, {
          key: chain.key,
          name: chain.label,
          urlKey: chain.urlKey,
        });
      }
    });
  });

  if (chainAliasToMeta.size === 0) {
    return topics;
  }

  const existingTopicUrls = new Set(
    topics.map((topic) => topic.url).filter((url): url is string => typeof url === "string" && url.length > 0),
  );

  const seenChainKeys = new Set<string>();
  const topicsToAppend: Topic[] = [];
  const candidateAliases = collectChainCandidatesFromBlocks(blocks);

  candidateAliases.forEach((candidate) => {
    const normalized = normalizeChainAlias(candidate);
    if (!normalized) return;

    const matchedChain = chainAliasToMeta.get(normalized);
    if (!matchedChain) return;
    if (seenChainKeys.has(matchedChain.key)) return;

    const chainUrl = `/chains/${matchedChain.urlKey}`;
    if (existingTopicUrls.has(chainUrl)) {
      seenChainKeys.add(matchedChain.key);
      return;
    }

    seenChainKeys.add(matchedChain.key);
    existingTopicUrls.add(chainUrl);
    topicsToAppend.push({
      name: matchedChain.name,
      url: chainUrl,
    });
  });

  return topicsToAppend.length > 0 ? [...topics, ...topicsToAppend] : topics;
};

export default function ClientQuickBitePage({ params }: Props) {
  const TOPIC_GAP_PX = 5;
  const { AllChainsByKeys } = useMaster();
  const setEthUsdSwitchEnabled = useUIContext((state) => state.setEthUsdSwitchEnabled);
  const [QuickBite, setQuickBite] = useState<QuickBiteData | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [relatedContent, setRelatedContent] = useState<QuickBiteWithSlug[]>([]);
  const [showNotFound, setShowNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleTopicCount, setVisibleTopicCount] = useState(0);
  const [topicViewportWidth, setTopicViewportWidth] = useState(0);
  const { theme } = useTheme();
  const topicViewportRef = useRef<HTMLDivElement | null>(null);
  const topicMeasureRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const morePillMeasureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const quickBiteWithChartTopics = useMemo(() => {
    if (!QuickBite) return null;
    if (QuickBite.autoAddChartChainsToTopics !== true) return QuickBite;
    if (!contentBlocks.length) return QuickBite;

    const baseTopics = QuickBite.topics || [];
    const updatedTopics = appendChartChainTopics(baseTopics, contentBlocks, AllChainsByKeys);

    if (updatedTopics === baseTopics) {
      return QuickBite;
    }

    return {
      ...QuickBite,
      topics: updatedTopics,
    };
  }, [QuickBite, contentBlocks, AllChainsByKeys]);

  const resolvedTopics = useMemo(
    () =>
      (quickBiteWithChartTopics?.topics || []).map((topic, index) => {
        let resolvedIcon: GTPIconName | undefined = topic.icon;
        let resolvedColor = topic.color;

        if (topic.url.startsWith('/chains/') && !topic.icon) {
          const chainInfo = getChainInfoFromUrl(topic.url, AllChainsByKeys, theme as "light" | "dark");
          if (chainInfo) {
            resolvedIcon = chainInfo.icon as GTPIconName;
            resolvedColor = chainInfo.color;
          }
        }

        return {
          ...topic,
          resolvedIcon: resolvedIcon || "chain-dark",
          resolvedColor,
          key: topic.url ? `${topic.url}-${index}` : `${topic.name}-${index}`,
        };
      }),
    [quickBiteWithChartTopics?.topics, AllChainsByKeys, theme],
  );

  const visibleTopics = useMemo(
    () => resolvedTopics.slice(0, visibleTopicCount),
    [resolvedTopics, visibleTopicCount],
  );
  const hiddenTopics = useMemo(
    () => resolvedTopics.slice(visibleTopicCount),
    [resolvedTopics, visibleTopicCount],
  );

  useEffect(() => {
    const viewport = topicViewportRef.current;
    if (!viewport || typeof window === "undefined") {
      return;
    }

    const updateWidth = () => {
      setTopicViewportWidth(viewport.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [resolvedTopics.length]);

  useEffect(() => {
    const totalTopics = resolvedTopics.length;

    if (totalTopics === 0) {
      setVisibleTopicCount(0);
      return;
    }

    if (topicViewportWidth <= 0) {
      setVisibleTopicCount(totalTopics);
      return;
    }

    const chipWidths = resolvedTopics.map((topic) => topicMeasureRefs.current[topic.key]?.offsetWidth || 0);
    if (chipWidths.some((width) => width === 0)) {
      return;
    }

    let nextVisibleCount = 0;

    for (let visibleCount = totalTopics; visibleCount >= 0; visibleCount -= 1) {
      const hiddenCount = totalTopics - visibleCount;
      const morePillWidth = hiddenCount > 0 ? morePillMeasureRefs.current[hiddenCount]?.offsetWidth || 0 : 0;

      if (hiddenCount > 0 && morePillWidth === 0) {
        continue;
      }

      const visibleTopicsWidth = chipWidths.slice(0, visibleCount).reduce((sum, width) => sum + width, 0);
      const itemCount = visibleCount + (hiddenCount > 0 ? 1 : 0);
      const totalGapWidth =
        hiddenCount > 0
          ? 0
          : itemCount > 1
            ? (itemCount - 1) * TOPIC_GAP_PX
            : 0;
      const totalWidth = visibleTopicsWidth + morePillWidth + totalGapWidth;

      if (totalWidth <= topicViewportWidth) {
        nextVisibleCount = visibleCount;
        break;
      }
    }

    setVisibleTopicCount((currentCount) =>
      currentCount === nextVisibleCount ? currentCount : nextVisibleCount,
    );
  }, [resolvedTopics, topicViewportWidth, TOPIC_GAP_PX]);

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
                {quickBiteWithChartTopics && quickBiteWithChartTopics.title}
              </h1>
            </div>

            {/* Author section */}
            <div className="flex lg:justify-normal justify-between lg:w-auto w-full  items-center h-full gap-x-2 text-sm">
              <Link className="lg:hidden flex items-center justify-center rounded-full w-[36px] h-[36px] bg-color-bg-medium" href={"/"}>
                <Icon icon={'fluent:arrow-left-32-filled'} className={`w-[20px] h-[25px]`}  />
              </Link>  
              <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse whitespace-nowrap'>
                {quickBiteWithChartTopics && quickBiteWithChartTopics.author && (
                  <>
                    <div className='flex items-center gap-x-[5px] md:flex-row flex-row-reverse'>
                      {quickBiteWithChartTopics.author.map((author) => (
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
                <span className='text-xxs lg:text-sm'>{quickBiteWithChartTopics && formatDate(quickBiteWithChartTopics.date)}</span>
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
          <div className="relative h-[34px] px-[15px] py-[5px] bg-color-bg-default rounded-full flex items-center gap-x-[10px]">
            <span className="text-xxs text-color-text-secondary whitespace-nowrap">Topics Discussed</span>
            <div
              ref={topicViewportRef}
              className={`flex items-center min-w-0 flex-1 overflow-hidden ${
                hiddenTopics.length > 0 ? "justify-between" : "gap-x-[5px]"
              }`}
            >
              {visibleTopics.map((topic) =>
                topic.url ? (
                  <Link key={topic.key} href={topic.url} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium whitespace-nowrap">
                    <GTPIcon icon={topic.resolvedIcon} size="sm" style={{ color: topic.resolvedColor }} />
                    <div className="text-xs whitespace-nowrap">{topic.name}</div>
                  </Link>
                ) : (
                  <div key={topic.key} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium whitespace-nowrap">
                    <GTPIcon icon={topic.resolvedIcon} size="sm" style={{ color: topic.resolvedColor }} />
                    <div className="text-xs whitespace-nowrap">{topic.name}</div>
                  </div>
                ),
              )}
              {hiddenTopics.length > 0 && (
                <GTPTooltipNew
                  size="sm"
                  placement="bottom-start"
                  allowInteract={true}
                  containerClass="!pr-[10px]"
                  trigger={
                    <div className="w-auto pl-[5px] pr-[8px] py-[3px] rounded-full bg-color-bg-medium text-xxs cursor-pointer whitespace-nowrap">
                      {`+ ${hiddenTopics.length} more`}
                    </div>
                  }
                >
                  <div className="flex flex-wrap gap-[5px] max-w-[420px]">
                    {hiddenTopics.map((topic) =>
                      topic.url ? (
                        <Link key={`hidden-${topic.key}`} href={topic.url} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium">
                          <GTPIcon icon={topic.resolvedIcon} size="sm" style={{ color: topic.resolvedColor }} />
                          <div className="text-xs">{topic.name}</div>
                        </Link>
                      ) : (
                        <div key={`hidden-${topic.key}`} className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium">
                          <GTPIcon icon={topic.resolvedIcon} size="sm" style={{ color: topic.resolvedColor }} />
                          <div className="text-xs">{topic.name}</div>
                        </div>
                      ),
                    )}
                  </div>
                </GTPTooltipNew>
              )}
            </div>
            <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none opacity-0 whitespace-nowrap">
              <div className="flex items-center gap-x-[5px]">
                {resolvedTopics.map((topic) => (
                  <div
                    key={`measure-${topic.key}`}
                    ref={(node) => {
                      topicMeasureRefs.current[topic.key] = node;
                    }}
                    className="flex items-center gap-x-[5px] rounded-full w-fit pl-[5px] pr-[10px] py-[3px] bg-color-bg-medium whitespace-nowrap"
                  >
                    <GTPIcon icon={topic.resolvedIcon} size="sm" style={{ color: topic.resolvedColor }} />
                    <div className="text-xs whitespace-nowrap">{topic.name}</div>
                  </div>
                ))}
                {resolvedTopics.map((_, index) => {
                  const hiddenCount = index + 1;
                  return (
                    <div
                      key={`measure-more-${hiddenCount}`}
                      ref={(node) => {
                        morePillMeasureRefs.current[hiddenCount] = node;
                      }}
                      className="w-auto pl-[5px] pr-[8px] py-[3px] rounded-full bg-color-bg-medium text-xxs whitespace-nowrap"
                    >
                      {`+ ${hiddenCount} more`}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <RelatedQuickBites slug={params.slug} />
        </Container>
      </div>
    </>
  );
}
