import { ContentBlock, ParagraphBlock, HeadingBlock, ImageBlock, CalloutBlock, generateBlockId } from '@/lib/types/blockTypes';

/**
 * Transforms an array of text content into structured content blocks
 * This is a simple implementation that treats each string as a paragraph block
 * In a real application, you could parse markdown, HTML, or a custom format
 */
export function transformContentToBlocks(content: string[]): ContentBlock[] {
  if (!content || !Array.isArray(content)) {
    return [];
  }

  return content.map((text, index) => {
    // Simple heuristic: if the text starts with # treat it as a heading
    if (text.startsWith('# ')) {
      return {
        id: generateBlockId(),
        type: 'heading',
        content: text.substring(2),
        level: 1
      } as HeadingBlock;
    } 
    else if (text.startsWith('## ')) {
      return {
        id: generateBlockId(),
        type: 'heading',
        content: text.substring(3),
        level: 2
      } as HeadingBlock;
    }
    // If text starts with ![] syntax (markdown image), create an image block
    else if (text.startsWith('![') && text.includes('](') && text.endsWith(')')) {
      const altTextMatch = text.match(/!\[(.*?)\]/);
      const srcMatch = text.match(/\]\((.*?)\)/);
      
      if (altTextMatch && srcMatch) {
        const alt = altTextMatch[1] || 'Image';
        const src = srcMatch[1] || '';
        const captionMatch = text.match(/\)\s*"(.*?)"\s*$/);
        const caption = captionMatch ? captionMatch[1] : '';
        
        // Check if there are additional parameters
        const paramsMatch = src.match(/(.*?)\s*\|\s*(.*)/);
        if (paramsMatch) {
          const actualSrc = paramsMatch[1];
          const params = paramsMatch[2].split(',').map(p => p.trim());
          
          const widthParam = params.find(p => p.startsWith('width='));
          const heightParam = params.find(p => p.startsWith('height='));
          const alignParam = params.find(p => p.startsWith('align='));
          
          const width = widthParam ? widthParam.split('=')[1] : undefined;
          const height = heightParam ? heightParam.split('=')[1] : undefined;
          const className = alignParam ? `text-${alignParam.split('=')[1]}` : '';
          
          return {
            id: generateBlockId(),
            type: 'image',
            src: actualSrc,
            alt,
            caption,
            width,
            height,
            className
          } as ImageBlock;
        }
        
        return {
          id: generateBlockId(),
          type: 'image',
          src,
          alt,
          caption
        } as ImageBlock;
      }
    }
    // For backward compatibility: If text contains image markers [image:url:alt], extract and create an image block
    else if (text.match(/\[image:(.*?):(.*?)\]/)) {
      const match = text.match(/\[image:(.*?):(.*?)\]/);
      if (match && match.length >= 3) {
        return {
          id: generateBlockId(),
          type: 'image',
          src: match[1],
          alt: match[2] || 'Image'
        } as ImageBlock;
      }
    }
    // If text starts with > treat it as a callout
    else if (text.startsWith('> ')) {
      return {
        id: generateBlockId(),
        type: 'callout',
        content: text.substring(2),
        icon: 'gtp-info'
      } as CalloutBlock;
    }
    
    // Default to paragraph
    return {
      id: generateBlockId(),
      type: 'paragraph',
      content: text
    } as ParagraphBlock;
  });
}

/**
 * In a more complex implementation, you could extend this function to:
 * - Parse markdown or other markup formats
 * - Handle nested blocks
 * - Support more block types
 * - Convert JSON or other data formats to block structure
 */