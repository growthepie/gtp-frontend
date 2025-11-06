"use client";

import React from 'react';
import { FaqBlock as FaqBlockType } from '@/lib/types/blockTypes';
import QuestionAnswer from '@/components/layout/QuestionAnswer';
import Heading from '@/components/layout/Heading';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface FaqBlockProps {
  block: FaqBlockType;
}

const parseMarkdownLinksToHtml = (text: string): string => {
  if (!text) return '';

  const standardLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const reverseLinkRegex = /\(([^)]+)\)\[(https?:\/\/[^\]]+)\]/g;
  const doubleBracketLinkRegex = /\[\(([^)]+)\)\[(https?:\/\/[^\]]+)\]\]/g;

  let result = text.replace(
    standardLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );

  result = result.replace(
    reverseLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );

  result = result.replace(
    doubleBracketLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );

  return result;
};

const toMarkup = (value?: string) => ({
  __html: parseMarkdownLinksToHtml(value || ''),
});

export const FaqBlock: React.FC<FaqBlockProps> = ({ block }) => {
  const isListLayout = block.layout === 'list';
  const title = (block.title || 'Frequently Asked Questions').trim();
  const description = block.description?.trim();

  return (
    <section className={`my-[25px] md:my-[40px] ${block.className || ''}`}>
      <div className="flex items-center gap-x-2 mb-[15px]">
        <div className="flex items-center space-x-2">
          <GTPIcon icon="gtp-faq" size="lg" />
          <Heading className="heading-large-lg">
            <div>{title}</div>
          </Heading>
        </div>
      </div>

      {description && (
        <p
          className="text-xs md:text-sm text-color-text-secondary mb-[20px]"
          dangerouslySetInnerHTML={toMarkup(description)}
        />
      )}

      <div className="flex flex-col space-y-[15px]">
        {block.items.map((item, index) => (
          <QuestionAnswer
            key={`${item.question}-${index}`}
            question={item.question}
            answer={
              <div>{item.answer}</div>
            }
            className="bg-color-bg-default"
            questionClassName=""
            answerClassName=""
            startOpen={isListLayout}
          />
        ))}
      </div>
    </section>
  );
};

export default FaqBlock;

