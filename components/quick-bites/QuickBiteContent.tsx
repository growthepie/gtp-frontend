// File: components/quick-dives/QuickBiteContent.tsx
'use client'; // Add this directive to mark it as a client component

import React from 'react';
import { PageContainer } from '@/components/layout/Container';
import Image from 'next/image';

interface QuickBiteContentProps {
  content: string[];
  image: string;
}

const QuickBiteContent: React.FC<QuickBiteContentProps> = ({ content, image }) => {
  return (
    <PageContainer className="">
      <div className="bg-forest-50 dark:bg-[#1F2726] rounded-[15px] overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Content section */}
            <div className="flex-1">
              {content.map((paragraph, index) => (
                <p key={index} className="mb-4 text-sm md:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* Image section */}
            <div className="w-full md:w-[40%] min-h-[300px] relative">
              <div className="w-full h-full min-h-[300px] relative rounded-lg overflow-hidden">
                {/* Fallback if image doesn't exist */}
                <div className="absolute inset-0 bg-forest-200 dark:bg-forest-800 flex items-center justify-center">
                  <span className="text-forest-700 dark:text-forest-300">
                    Chart/Image
                  </span>
                </div>
                
                {/* Actual image - uncomment when real images are available */}
                {/* 
                <Image
                  src={image}
                  alt="Quick Bite visualization"
                  fill
                  className="object-cover"
                /> 
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default QuickBiteContent;