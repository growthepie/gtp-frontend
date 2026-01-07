// File: components/quick-dives/blocks/ImageBlock.tsx
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import { ImageBlock as ImageBlockType } from '@/lib/types/blockTypes';

interface ImageBlockProps {
  block: ImageBlockType;
}

const parseMarkdownLinksToHtml = (text: string): string => {
  if (!text) return '';
  // Regex to find links in markdown format [text](url) or (text)[url] or [(text)[url]]
  const standardLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const reverseLinkRegex = /\(([^)]+)\)\[(https?:\/\/[^\]]+)\]/g;
  const doubleBracketLinkRegex = /\[\(([^)]+)\)\[(https?:\/\/[^\]]+)\]\]/g;
  
  // Replace standard format [text](url)
  let result = text.replace(
    standardLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  // Replace reverse format (text)[url]
  result = result.replace(
    reverseLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  // Replace double bracket format [(text)[url]]
  result = result.replace(
    doubleBracketLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  return result;
};

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  // State to control the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCssDimension = (value: string | number | undefined, defaultValue: string): string => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'number') return `${value}px`;
    // Check if it's a string that is just a number (e.g., "800")
    if (/^\d+(\.\d+)?$/.test(String(value))) return `${String(value)}px`;
    return String(value); // Assumed to be "100%", "auto", "50vw", etc.
  };

  // More robust parsing for aspectRatio
  const numericWidth = block.width ? parseFloat(String(block.width)) : NaN;
  const numericHeight = block.height ? parseFloat(String(block.height)) : NaN;
  const aspectRatio = !isNaN(numericWidth) && !isNaN(numericHeight) 
    ? `${numericWidth} / ${numericHeight}` 
    : '16 / 9';

  // Extract values with proper defaults
  const width = getCssDimension(block.width, '100%');
  const alt = block.alt || 'Displayed image';
  const src = block.src || '';
  const caption = block.caption || '';

  // Process caption for links
  const captionWithLinks = parseMarkdownLinksToHtml(caption);

  // Check if the image source is valid enough to be displayed and opened
  const isImageAvailable = !!src;

  const className = block.className || 'md:w-3/5 mx-auto';
  
  return (
    // Use a Fragment to render the figure and the modal as siblings
    <>
      <figure className="my-8">
        <div
          role={isImageAvailable ? "button" : undefined}
          tabIndex={isImageAvailable ? 0 : -1}
          onClick={() => isImageAvailable && setIsModalOpen(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && isImageAvailable && setIsModalOpen(true)}
          className={`w-auto
            ${isImageAvailable ? '' : 'cursor-default'}
            ${className}`}
          style={{ 

          }}
          aria-label={isImageAvailable ? `View full image: ${alt}` : undefined}
        >
            <div style={{ aspectRatio }} className='relative w-full overflow-hidden rounded-lg cursor-pointer hover:shadow-lg transition-transform duration-300 ease-in-out'>
              {isImageAvailable ? (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={true}
                  quality={90}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-color-text-primary">
                  <span>Image not available</span>
                </div>
              )}
            </div>
        </div>
        {caption && (
          <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
            <span dangerouslySetInnerHTML={{ __html: captionWithLinks }} />
          </figcaption>
        )}
      </figure>

      {/* Render the modal, which will only be visible when isModalOpen is true */}
      {isImageAvailable && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          src={src}
          alt={alt}
          caption={captionWithLinks}
        />
      )}
    </>
  );
};

import { createPortal } from 'react-dom';

interface ImageModalProps {
  src: string;
  alt: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ src, alt, caption, isOpen, onClose }) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore background scrolling
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  // Use a portal to render the modal at the root of the document
  // This helps avoid z-index and styling conflicts.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose} // Close on backdrop click
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="relative max-w-[90vw] lg:max-w-[70vw] max-h-[90vh] w-full bg-white dark:bg-neutral-900 rounded-lg shadow-xl flex flex-col p-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >

        <div className="flex-grow overflow-auto">
           {/* We use next/image here for optimization, giving it large intrinsic dimensions.
               CSS will handle making it fit the container responsively. */}
          <Image
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
            priority // Prioritize loading the large image since it's the user's focus
            quality={90}
          />
        </div>
        
        {caption && (
          <figcaption className="mt-3 flex-shrink-0 text-center text-sm text-neutral-600 dark:text-neutral-400">
            <span dangerouslySetInnerHTML={{ __html: caption }} />
          </figcaption>
        )}
      </div>
    </div>,
    document.body
  );
};