import { ContentBlock } from '@/lib/types/blockTypes';
import { processMarkdownContent } from './markdownParser';
import { transformContentToBlocks } from './contentParser';

/**
 * Process content from any supported format to ContentBlocks
 * This function provides a unified interface for content processing,
 * regardless of whether the content comes from Markdown or other formats.
 */
export async function processContent(
  content: string[],
  format: 'markdown' | 'legacy' = 'markdown'
): Promise<ContentBlock[]> {
  try {
    if (!content || !Array.isArray(content)) {
      console.warn('Invalid content provided to processContent');
      return [];
    }

    // Use the appropriate parser based on content format
    if (format === 'markdown') {
      return await processMarkdownContent(content);
    } else {
      // For legacy content format
      return transformContentToBlocks(content);
    }
  } catch (error) {
    console.error('Error processing content:', error);
    return [];
  }
}

/**
 * Get a content preview by extracting a specified number of words
 * from the first paragraph block.
 */
export function getContentPreview(
  blocks: ContentBlock[],
  maxWords: number = 25
): string {
  try {
    // Find the first paragraph block
    const paragraphBlock = blocks.find(block => block.type === 'paragraph');
    
    if (!paragraphBlock) {
      return '';
    }
    
    // Extract the text content
    const content = paragraphBlock.content;
    
    // Split into words and take the first maxWords
    const words = content.split(/\s+/).slice(0, maxWords);
    
    // Join the words back together and add ellipsis if truncated
    const preview = words.join(' ');
    
    return words.length < content.split(/\s+/).length 
      ? `${preview}...` 
      : preview;
  } catch (error) {
    console.error('Error getting content preview:', error);
    return '';
  }
}

/**
 * Calculate estimated reading time for content blocks
 */
export function calculateReadingTime(blocks: ContentBlock[]): number {
  try {
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    
    // Count words in all text-based blocks
    let wordCount = 0;
    
    blocks.forEach(block => {
      if (block.type === 'paragraph' || block.type === 'heading' || 
          block.type === 'callout' || block.type === 'quote') {
        wordCount += block.content.split(/\s+/).length;
      }
    });
    
    // Add additional time for non-text blocks (images, charts, iframes)
    const nonTextBlocks = blocks.filter(block => 
      ['image', 'chart', 'iframe'].includes(block.type)
    ).length;
    
    // Assume each non-text block adds 10 seconds (1/6 minute)
    const additionalMinutes = nonTextBlocks * (1/6);
    
    // Calculate total minutes
    const minutes = wordCount / wordsPerMinute + additionalMinutes;
    
    // Round up to the nearest minute
    return Math.ceil(minutes);
  } catch (error) {
    console.error('Error calculating reading time:', error);
    return 1; // Default to 1 minute
  }
}