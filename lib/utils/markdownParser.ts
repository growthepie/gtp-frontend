import { ContentBlock, generateBlockId } from '@/lib/types/blockTypes';

// Simple utility to convert markdown to raw HTML without remark
// This is a placeholder - we'll use react-markdown for actual rendering at component level
export async function markdownToHtml(markdown: string): Promise<string> {
  // We're not actually converting to HTML here since we'll use react-markdown
  // Just returning the raw markdown that will be handled by the component
  return markdown;
}

// Process markdown array into structured blocks
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
        // ... (existing chart logic is correct)
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
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
      // Handle table blocks
      else if (text.startsWith('```table')) {
        // Check if the next line contains JSON data
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          // And check if the line after that is the closing marker
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          
          if (closingMarker) {
            const tableBlock = parseTableBlock(jsonString);
            if (tableBlock) {
              blocks.push(tableBlock);
              i += 2; // Important: Skip the JSON and closing marker lines
              continue;
            }
          }
        }
      }
      // Handle iframe blocks
      else if (text.startsWith('```iframe')) {
        // ... (existing iframe logic is correct)
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
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
      // Handle image blocks (JSON format)
      else if (text.startsWith('```image')) {
        // ... (existing image logic is correct)
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          if (closingMarker) {
            const imageJsonBlock = parseImageJsonBlock(jsonString);
            if (imageJsonBlock) {
              blocks.push(imageJsonBlock);
              i += 2; // Skip JSON data and closing marker
              continue;
            }
          }
        }
      }
      // START OF FIX: Correctly handle kpi-cards blocks
      else if (text.startsWith('```kpi-cards')) {
        // Check if the next line contains JSON data
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          // And check if the line after that is the closing marker
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          
          if (closingMarker) {
            const kpiCardsBlock = parseKpiCardsBlock(jsonString);
            if (kpiCardsBlock) {
              blocks.push(kpiCardsBlock);
              i += 2; // Important: Skip the JSON and closing marker lines
              continue;
            }
          }
        }
      }
      // END OF FIX
      // Handle code blocks
      else if (text.startsWith('```')) {
        // ... (existing code block logic is correct)
        const language = text.substring(3).trim();
        let codeContent = '';
        let j = i + 1;
        while (j < content.length && !content[j].startsWith('```')) {
          codeContent += content[j] + '\n';
          j++;
        }
        if (j < content.length && content[j] === '```') {
          blocks.push({ id: generateBlockId(), type: 'code', content: codeContent.trim(), language });
          i = j;
          continue;
        }
      }
      // Handle headings
      else if (/^#{1,6}\s/.test(text)) {
        // ... (existing heading logic is correct)
        const match = text.match(/^(#{1,6})\s/);
        if (!match) {
          blocks.push({ id: generateBlockId(), type: 'paragraph', content: text });
          continue;
        }
        const level = match[1].length;
        const content = text.replace(/^#{1,6}\s/, '');
        blocks.push({ id: generateBlockId(), type: 'heading', content, level: level as 1 | 2 | 3 | 4 | 5 | 6 });
        continue;
      }
      // Handle images with special attributes
      else if (text.startsWith('![') && text.includes('](')) {
        blocks.push(parseImageBlock(text));
      }
      // Handle callouts/blockquotes
      else if (text.startsWith('> ')) {
        blocks.push({ id: generateBlockId(), type: 'callout', content: text.substring(2), icon: 'gtp-info' });
      }
      // Handle dividers
      else if (text === '---') {
        blocks.push({ id: generateBlockId(), type: 'divider' });
      }
      // Handle list items
      else if (text.startsWith('- ')) {
        blocks.push({ id: generateBlockId(), type: 'list', content: text.substring(2), items: [text.substring(2)] });
      }
      // Default to paragraph
      else {
        blocks.push({ id: generateBlockId(), type: 'paragraph', content: parseBoldText(text) });
      }
    } catch (error) {
      console.error(`Error processing content block at index ${i}:`, error);
      if (process.env.NODE_ENV === 'development') {
        blocks.push({ id: generateBlockId(), type: 'paragraph', content: `Error processing content: ${error.message}` });
      }
    }
  }
  
  return blocks;
}

// Corrected helper function to parse kpi-cards blocks
function parseKpiCardsBlock(jsonString: string): ContentBlock | null {
  try {
    const kpiCardsArray = JSON.parse(jsonString);

    if (!Array.isArray(kpiCardsArray)) {
      console.error('Error parsing kpi cards data: The provided JSON is not an array.');
      return null;
    }

    // Ensure each item has the correct structure
    const validCards = kpiCardsArray.map(card => ({
      title: card.title || '',
      value: card.value || '',
      description: card.description || '',
      icon: card.icon || '',
      info: card.info || ''
    }));

    const block = {
      id: generateBlockId(),
      type: 'kpi-cards' as const,
      items: validCards,
      className: ''
    };
    return block;
  } catch (error) {
    console.error('Error parsing kpi cards data:', error);
    return null;
  }
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

// Helper function to parse table blocks
function parseTableBlock(jsonString: string): ContentBlock | null {
  try {
    const tableConfig = JSON.parse(jsonString);

    // Check if this is a JSON-based table (reads from external source)
    if (tableConfig.readFromJSON === true) {
      // Validate JSON data configuration
      if (!tableConfig.jsonData || typeof tableConfig.jsonData !== 'object') {
        console.error('Error parsing table data: jsonData must be provided when readFromJSON is true');
        return null;
      }

      const { url, pathToRowData, pathToColumnKeys, pathToTypes } = tableConfig.jsonData;
      if (!url || !pathToRowData || !pathToColumnKeys || !pathToTypes) {
        console.error('Error parsing table data: jsonData must include url, pathToRowData, pathToColumnKeys, and pathToTypes');
        return null;
      }

      const block = {
        id: generateBlockId(),
        type: 'table' as const,
        content: tableConfig.content || '',
        className: tableConfig.className || '',
        columnSortBy: tableConfig.columnSortBy || undefined,
        readFromJSON: true,
        jsonData: tableConfig.jsonData
      };
      return block;
    } else {
      // Original inline data structure
      if (!tableConfig.columnKeys || typeof tableConfig.columnKeys !== 'object') {
        console.error('Error parsing table data: columnKeys must be an object when readFromJSON is false');
        return null;
      }

      if (!tableConfig.rowData || typeof tableConfig.rowData !== 'object') {
        console.error('Error parsing table data: rowData must be an object when readFromJSON is false');
        return null;
      }

      // Validate that each column key has the required structure
      for (const [key, config] of Object.entries(tableConfig.columnKeys)) {
        if (!config || typeof config !== 'object' || typeof (config as any).sortByValue !== 'boolean') {
          console.error(`Error parsing table data: columnKeys.${key} must have sortByValue boolean property`);
          return null;
        }
      }

      const block = {
        id: generateBlockId(),
        type: 'table' as const,
        content: tableConfig.content || '',
        className: tableConfig.className || '',
        columnKeys: tableConfig.columnKeys,
        columnSortBy: tableConfig.columnSortBy || undefined,
        readFromJSON: false,
        rowData: tableConfig.rowData
      };
      return block;
    }
  } catch (error) {
    console.error('Error parsing table data:', error);
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

// Helper function to parse image blocks (from JSON)
function parseImageJsonBlock(jsonString: string): ContentBlock | null {
  try {
    const imageConfig = JSON.parse(jsonString);
    return {
      id: generateBlockId(),
      type: 'image',
      src: imageConfig.src || '',
      alt: imageConfig.alt || 'Image',
      width: imageConfig.width, // Keep as string/number or undefined
      height: imageConfig.height, // Keep as string/number or undefined
      caption: imageConfig.caption || '',
      className: imageConfig.className || ''
    };
  } catch (error) {
    console.error('Error parsing image JSON data:', error);
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