import { ContentBlock, ParagraphBlock, HeadingBlock, ImageBlock, CalloutBlock, ChartBlock, IframeBlock, CodeBlock, QuoteBlock, DividerBlock, generateBlockId } from '@/lib/types/blockTypes';

/**
 * Transforms an array of text content into structured content blocks
 * This handles multiple block types including iframes for embedded content
 */
export function transformContentToBlocks(content: string[]): ContentBlock[] {
  if (!content || !Array.isArray(content)) {
    return [];
  }

  const blocks: ContentBlock[] = [];
  
  for (let i = 0; i < content.length; i++) {
    const text = content[i];
    
    // Handle headings with multiple levels
    if (/^#{1,6}\s/.test(text)) {
      const level = text.match(/^(#{1,6})\s/)[1].length;
      const content = text.replace(/^#{1,6}\s/, '');
      
      blocks.push({
        id: generateBlockId(),
        type: 'heading',
        content,
        level: level as 1|2|3|4|5|6
      });
    } 
    // Handle images with advanced configuration options
    else if (text.startsWith('![') && text.includes('](')) {
      const altTextMatch = text.match(/!\[(.*?)\]/);
      const srcMatch = text.match(/\]\((.*?)(?:\s*\||\))/);
      const captionMatch = text.match(/\)\s*"(.*?)"\s*$/);
      
      if (altTextMatch && srcMatch) {
        const alt = altTextMatch[1] || 'Image';
        const src = srcMatch[1] || '';
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
          
          blocks.push({
            id: generateBlockId(),
            type: 'image',
            src: actualSrc,
            alt,
            caption,
            width,
            height,
            className
          });
        } else {
          blocks.push({
            id: generateBlockId(),
            type: 'image',
            src,
            alt,
            caption
          });
        }
      }
    }
    // Handle chart blocks
    else if (text === '```chart') {
      // Check if next line contains JSON data
      if (i + 1 < content.length && i + 2 < content.length && content[i + 2] === '```') {
        try {
          const jsonString = content[i + 1];
          const chartConfig = JSON.parse(jsonString);
          
          blocks.push({
            id: generateBlockId(),
            type: 'chart',
            chartType: chartConfig.type || 'line',
            data: chartConfig.data || [],
            options: chartConfig.options || {},
            title: chartConfig.title,
            subtitle: chartConfig.subtitle,
            width: chartConfig.width || '100%',
            height: chartConfig.height || 400,
            caption: chartConfig.caption
          });
          
          // Skip the next two lines
          i += 2;
          continue;
        } catch (e) {
          // If parsing fails, treat as a paragraph
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: `Error parsing chart data: ${e.message}`
          });
        }
      } else {
        // If not a properly formed chart block, treat as a paragraph
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: text
        });
      }
    }
    // Handle iframe blocks - NEW
    else if (text === '```iframe') {
      // Check if next line contains JSON data
      if (i + 1 < content.length && i + 2 < content.length && content[i + 2] === '```') {
        try {
          const jsonString = content[i + 1];
          const iframeConfig = JSON.parse(jsonString);
          
          blocks.push({
            id: generateBlockId(),
            type: 'iframe',
            src: iframeConfig.src || '',
            title: iframeConfig.title || 'Embedded content',
            width: iframeConfig.width || '100%',
            height: iframeConfig.height || '500px',
            caption: iframeConfig.caption || ''
          });
          
          // Skip the next two lines
          i += 2;
          continue;
        } catch (e) {
          // If parsing fails, treat as a paragraph
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: `Error parsing iframe data: ${e.message}`
          });
        }
      } else {
        // If not a properly formed iframe block, treat as a paragraph
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: text
        });
      }
    }
    // Handle code blocks
    else if (text.startsWith('```') && !text.startsWith('```chart') && !text.startsWith('```iframe')) {
      const language = text.substring(3).trim();
      let codeContent = '';
      let j = i + 1;
      
      // Collect all content until closing ```
      while (j < content.length && !content[j].startsWith('```')) {
        codeContent += content[j] + '\n';
        j++;
      }
      
      if (j < content.length && content[j] === '```') {
        blocks.push({
          id: generateBlockId(),
          type: 'code',
          content: codeContent.trim(),
          language
        });
        
        i = j; // Skip to after the closing ```
        continue;
      } else {
        // If no closing tag, treat as regular paragraph
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: text
        });
      }
    }
    // Handle callouts
    else if (text.startsWith('> ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'callout',
        content: text.substring(2),
        icon: 'gtp-info'
      });
    }
    // Handle dividers
    else if (text === '---') {
      blocks.push({
        id: generateBlockId(),
        type: 'divider'
      });
    }
    // Handle quotes
    else if (text.startsWith('> ') && text.includes(' — ')) {
      const contentMatch = text.match(/^>\s*(.*?)\s*—\s*(.*?)$/);
      if (contentMatch) {
        blocks.push({
          id: generateBlockId(),
          type: 'quote',
          content: contentMatch[1],
          attribution: contentMatch[2]
        });
      } else {
        // Fallback to callout if not a proper quote
        blocks.push({
          id: generateBlockId(),
          type: 'callout',
          content: text.substring(2),
          icon: 'gtp-info'
        });
      }
    }
    // Default to paragraph
    else {
      blocks.push({
        id: generateBlockId(),
        type: 'paragraph',
        content: text
      });
    }
  }
  
  return blocks;
}