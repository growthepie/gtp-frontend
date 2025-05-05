// File: components/quick-dives/QuickDiveClientContent.tsx
'use client';

import React from 'react';
import { PageContainer } from '@/components/layout/Container';
import QuickDiveContent from './QuickDiveContent';
import RelatedQuickDives from './RelatedQuickDives';
import { QuickDiveWithSlug } from '@/lib/types/quickDives';

interface QuickDiveData {
  title: string;
  subtitle: string;
  content: string[];
  image: string;
  date: string;
  icon: string;
  related: string[];
}

interface QuickDiveClientContentProps {
  content: string[];
  image: string;
  relatedQuickDives: QuickDiveWithSlug[];
}

const QuickDiveClientContent: React.FC<QuickDiveClientContentProps> = ({
  content,
  image,
  relatedQuickDives
}) => {
  return (
    <>
      <QuickDiveContent content={content} image={image} />
      
      <PageContainer>
        <RelatedQuickDives relatedQuickDives={relatedQuickDives} />
      </PageContainer>
    </>
  );
};

export default QuickDiveClientContent;