import { ContentBlock, ParagraphBlock, HeadingBlock, ImageBlock, CalloutBlock, ChartBlock, generateBlockId } from '@/lib/types/blockTypes';

/**
 * Transforms an array of text content into structured content blocks
 * This is a simple implementation that treats each string as a paragraph block
 * In a real application, you could parse markdown, HTML, or a custom format
 */
export function transformContentToBlocks(content: string[]): ContentBlock[] {
  if (!content || !Array.isArray(content)) {
    return [];
  }

  const blocks: ContentBlock[] = [];
  
  for (let i = 0; i < content.length; i++) {
    const text = content[i];
    
    // Simple heuristic: if the text starts with # treat it as a heading
    if (text.startsWith('# ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'heading',
        content: text.substring(2),
        level: 1
      } as HeadingBlock);
    } 
    else if (text.startsWith('## ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'heading',
        content: text.substring(3),
        level: 2
      } as HeadingBlock);
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
          
          blocks.push({
            id: generateBlockId(),
            type: 'image',
            src: actualSrc,
            alt,
            caption,
            width,
            height,
            className
          } as ImageBlock);
        } else {
          blocks.push({
            id: generateBlockId(),
            type: 'image',
            src,
            alt,
            caption
          } as ImageBlock);
        }
      }
    }
    // For backward compatibility: If text contains image markers [image:url:alt], extract and create an image block
    else if (text.match(/\[image:(.*?):(.*?)\]/)) {
      const match = text.match(/\[image:(.*?):(.*?)\]/);
      if (match && match.length >= 3) {
        blocks.push({
          id: generateBlockId(),
          type: 'image',
          src: match[1],
          alt: match[2] || 'Image'
        } as ImageBlock);
      }
    }
    // If text starts with ```chart, treat it as a chart block
    else if (text.startsWith('```chart')) {
      // Handle chart blocks specially
      try {
        // First check if this is the beginning of a chart block
        if (text === '```chart') {
          // If it's just the opening marker, the next element should be the JSON data
          if (i + 1 < content.length) {
            const jsonString = content[i + 1];
            // And the one after that should be the closing marker
            const closingMarker = content[i + 2] === '```' ? content[i + 2] : null;
            
            if (closingMarker) {
              // We have a complete chart block
              const chartConfig = JSON.parse(jsonString);
              
              // Get chart type from config or default to line
              const chartType = chartConfig.type || 'line';
              
              // Extract chart data
              const data = chartConfig.data || [];
              
              // Extract any additional options
              const options = chartConfig.options || {};
              
              // Get title, subtitle, dimensions
              const { title, subtitle, width, height, caption, margins } = chartConfig;
              
              blocks.push({
                id: generateBlockId(),
                type: 'chart',
                margins,
                chartType,
                data,
                options,
                title,
                subtitle,
                width,
                height,
                caption
              } as ChartBlock);
              
              // Skip the next two items since we've processed them
              i += 2;
              continue;
            }
          }
        }
        
        // If we get here, try the original approach as fallback
        const jsonMatch = text.match(/```chart([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const chartConfig = JSON.parse(jsonMatch[1].trim());
          
          const chartType = chartConfig.type || 'line';
          const data = chartConfig.data || [];
          const options = chartConfig.options || {};
          const { title, subtitle, width, height, caption, margins } = chartConfig;
          
          blocks.push({
            id: generateBlockId(),
            type: 'chart',
            margins,
            chartType,
            data,
            options,
            title,
            subtitle,
            width,
            height,
            caption
          } as ChartBlock);
        } else {
          // If no match, treat it as a paragraph
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: text
          } as ParagraphBlock);
        }
      } catch (e) {
        // If parsing fails, return a paragraph with error message
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: `Error parsing chart data: ${e.message}`
        } as ParagraphBlock);
      }
    }
    // If text starts with > treat it as a callout
    else if (text.startsWith('> ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'callout',
        content: text.substring(2),
        icon: 'gtp-info'
      } as CalloutBlock);
    }
    // Default to paragraph
    else {
      blocks.push({
        id: generateBlockId(),
        type: 'paragraph',
        content: text
      } as ParagraphBlock);
    }
  }
  
  return blocks;
}

/**
 * In a more complex implementation, you could extend this function to:
 * - Parse markdown or other markup formats
 * - Handle nested blocks
 * - Support more block types
 * - Convert JSON or other data formats to block structure
 */