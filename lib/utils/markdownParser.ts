import { ContentBlock, generateBlockId } from '@/lib/types/blockTypes';

// Simple utility to convert markdown to raw HTML without remark
// This is a placeholder - we'll use react-markdown for actual rendering at component level
export async function markdownToHtml(markdown: string): Promise<string> {
  // We're not actually converting to HTML here since we'll use react-markdown
  // Just returning the raw markdown that will be handled by the component
  return markdown;
}

// Process markdown array into structured blocks
export async function processMarkdownContent(content: string[]): Promise<ContentBlock[]> {
  if (!content || !Array.isArray(content)) {
    console.warn('Invalid content provided to processMarkdownContent');
    return [];
  }

  const blocks: ContentBlock[] = [];
  
  for (let i = 0; i < content.length; i++) {
    try {
      const text = content[i];
      
      // Handle chart blocks
      if (text.startsWith('```chart')) {
        // Check if next line contains JSON data
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          // And check if the line after that is the closing marker
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          
          if (closingMarker) {
            const chartBlock = parseChartBlock(jsonString);
            if (chartBlock) {
              blocks.push(chartBlock);
              i += 2; // Skip the next two lines
              continue;
            }
          }
        }
      }
      // Handle iframe blocks
      else if (text.startsWith('```iframe')) {
        // Check if next line contains JSON data
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          // And check if the line after that is the closing marker
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          
          if (closingMarker) {
            const iframeBlock = parseIframeBlock(jsonString);
            if (iframeBlock) {
              blocks.push(iframeBlock);
              i += 2; // Skip the next two lines
              continue;
            }
          }
        }
      }
      // Handle code blocks
      else if (text.startsWith('```')) {
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
        }
      }
      // Handle headings
      else if (/^#{1,6}\s/.test(text)) {
        const match = text.match(/^(#{1,6})\s/);
        if (!match) {
          // If no match (shouldn't happen due to the test above, but TypeScript needs this)
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: text
          });
          continue;
        }
        const level = match[1].length;
        const content = text.replace(/^#{1,6}\s/, '');
        
        blocks.push({
          id: generateBlockId(),
          type: 'heading',
          content,
          level: level as 1 | 2 | 3 | 4 | 5 | 6
        });
        continue;
      }
      // Handle images with special attributes
      else if (text.startsWith('![') && text.includes('](')) {
        blocks.push(parseImageBlock(text));
      }
      // Handle callouts/blockquotes
      else if (text.startsWith('> ')) {
        blocks.push({
          id: generateBlockId(),
          type: 'callout',
          content: text.substring(2), // No HTML conversion
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
      // Handle list items
      else if (text.startsWith('- ')) {
        blocks.push({
          id: generateBlockId(),
          type: 'list',
          content: text.substring(2), // Remove the '- ' prefix
          items: [text.substring(2)] // Start with the first item
        });
      }
      // Default to paragraph
      else {
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: parseBoldText(text) // Process bold text in paragraphs
        });
      }
    } catch (error) {
      console.error(`Error processing content block at index ${i}:`, error);
      // Add a fallback paragraph block with error info in development
      if (process.env.NODE_ENV === 'development') {
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          content: `Error processing content: ${error.message}`
        });
      }
    }
  }
  
  return blocks;
}

// Helper function to parse chart blocks
function parseChartBlock(jsonString: string): ContentBlock | null {
  try {
    const chartConfig = JSON.parse(jsonString);
    return {
      id: generateBlockId(),
      type: 'chart',
      chartType: chartConfig.type || 'line',
      data: chartConfig.data || [],
      options: chartConfig.options || {},
      title: chartConfig.title,
      subtitle: chartConfig.subtitle,
      width: chartConfig.width || '100%',
      height: chartConfig.height || 400,
      caption: chartConfig.caption,
      stacking: chartConfig.stacking || null,
      showXAsDate: chartConfig.showXAsDate || false,
      dataAsJson: chartConfig.dataAsJson || null,
      seeMetricURL: chartConfig.seeMetricURL || null
    };
  } catch (error) {
    console.error('Error parsing chart data:', error);
    return null;
  }
}

// Helper function to parse iframe blocks
function parseIframeBlock(jsonString: string): ContentBlock | null {
  try {
    const iframeConfig = JSON.parse(jsonString);
    return {
      id: generateBlockId(),
      type: 'iframe',
      src: iframeConfig.src || '',
      title: iframeConfig.title || 'Embedded content',
      width: iframeConfig.width || '100%',
      height: iframeConfig.height || '500px',
      caption: iframeConfig.caption || ''
    };
  } catch (error) {
    console.error('Error parsing iframe data:', error);
    return null;
  }
}

// Helper function to parse image blocks
function parseImageBlock(imageText: string): ContentBlock {
  // Extract image properties from markdown-style text with attributes
  const altTextMatch = imageText.match(/!\[(.*?)\]/);
  const srcMatch = imageText.match(/\]\((.*?)(?:\s*\||\))/);
  const captionMatch = imageText.match(/\)\s*"(.*?)"\s*$/);
  
  const alt = altTextMatch ? altTextMatch[1] || 'Image' : 'Image';
  const src = srcMatch ? srcMatch[1] || '' : '';
  const caption = captionMatch ? captionMatch[1] : '';
  
  // Parse attributes if present
  const attributesMatch = imageText.match(/\|\s*(.*?)\)/);
  const attributes = attributesMatch ? attributesMatch[1] : '';
  
  let width, height, align;
  
  if (attributes) {
    attributes.split(',').forEach(attr => {
      const [key, value] = attr.trim().split('=');
      if (key === 'width') width = value;
      if (key === 'height') height = value;
      if (key === 'align') align = value;
    });
  }
  
  return {
    id: generateBlockId(),
    type: 'image',
    src,
    alt,
    caption,
    width: width || '100%',
    height: height || 'auto',
    className: align ? `text-${align}` : ''
  };
}

// Helper function to parse bold text in paragraphs
function parseBoldText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}