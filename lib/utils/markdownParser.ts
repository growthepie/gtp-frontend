// File: lib/utils/markdownParser.ts
import { ContentBlock, FaqBlock, generateBlockId, ChartBlock, ChartToggleBlock } from '@/lib/types/blockTypes';

// Simple utility to convert markdown to raw HTML without remark
// This is a placeholder - we'll use react-markdown for actual rendering at component level
export async function markdownToHtml(markdown: string): Promise<string> {
  // We're not actually converting to HTML here since we'll use react-markdown
  // Just returning the raw markdown that will be handled by the component
  return markdown;
}

// Helper function to parse showInMenu from JSON configurations
function parseShowInMenu(config: any): boolean | undefined {
  if (config && typeof config.showInMenu === 'boolean') {
    return config.showInMenu;
  }
  return undefined; // Default to showing in menu
}

// Process markdown array into structured blocks
export async function processMarkdownContent(content: string[]): Promise<ContentBlock[]> {
  if (!content || !Array.isArray(content)) {
    console.warn('Invalid content provided to processMarkdownContent');
    return [];
  }

  let blocks: ContentBlock[] = [];
  
  for (let i = 0; i < content.length; i++) {
    try {
      const text = content[i];

      // Handle container blocks
      if (text.startsWith('```container')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          if (closingMarker) {
            // Await the parsing of the container block
            const containerBlock = await parseContainerBlock(jsonString);
            if (containerBlock) {
              blocks.push(containerBlock);
              i += 2; // Skip the JSON and closing marker
              continue;
            }
          }
        }
      }

      // Handle title button blocks
      else if (text.startsWith('```titleButton')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          if (closingMarker) {
            const titleButtonBlock = parseTitleButtonBlock(jsonString);
            if (titleButtonBlock) {
              blocks.push(titleButtonBlock);
              i += 2; // Skip the JSON and closing marker
              continue;
            }
          }
        }
      }
      
      // Handle dropdown blocks - ADD THIS SECTION
      else if (text.startsWith('```dropdown')) {
        // Check if the next line contains JSON data
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          // And check if the line after that is the closing marker
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          
          if (closingMarker) {
            const dropdownBlock = parseDropdownBlock(jsonString);
            if (dropdownBlock) {
              blocks.push(dropdownBlock);
              i += 2; // Important: Skip the JSON and closing marker lines
              continue;
            }
          }
        }
      }
      // Handle FAQ blocks
      else if (text.startsWith('```faq')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';

          if (closingMarker) {
            const faqBlock = parseFaqBlock(jsonString);
            if (faqBlock) {
              blocks.push(faqBlock);
              i += 2;
              continue;
            }
          }
        }
      }
      // Handle chart toggle blocks
      else if (text.startsWith('```chart-toggle')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';
          if (closingMarker) {
            const chartToggleBlock = parseChartToggleBlock(jsonString);
            if (chartToggleBlock) {
              blocks.push(chartToggleBlock);
              i += 2;
              continue;
            }
          }
        }
      }
      // Handle chart blocks
      else if (text.startsWith('```chart')) {
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
      // Handle kpi-cards blocks
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
      // Handle live metrics row blocks
      else if (text.startsWith('```live-metrics-row')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';

          if (closingMarker) {
            const liveMetricsRowBlock = parseLiveMetricsRowBlock(jsonString);
            if (liveMetricsRowBlock) {
              blocks.push(liveMetricsRowBlock);
              i += 2;
              continue;
            }
          }
        }
      }
      // Handle live metrics blocks
      else if (text.startsWith('```live-metrics')) {
        if (i + 1 < content.length) {
          const jsonString = content[i + 1];
          const closingMarker = i + 2 < content.length && content[i + 2] === '```';

          if (closingMarker) {
            const liveMetricsBlock = parseLiveMetricsBlock(jsonString);
            if (liveMetricsBlock) {
              blocks.push(liveMetricsBlock);
              i += 2;
              continue;
            }
          }
        }
      }
      // Handle headings
      else if (/^#{1,6}\s/.test(text)) {
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
      // Handle blank/whitespace-only lines as spacers
      else if (!text || text.trim().length === 0) {
        blocks.push({ id: generateBlockId(), type: 'spacer', height: 15 });
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
  
  const faqBlocks = blocks.filter((block): block is FaqBlock => block.type === 'faq');
  if (faqBlocks.length) {
    const nonFaqBlocks = blocks.filter((block) => block.type !== 'faq');
    blocks = [...nonFaqBlocks, ...faqBlocks];
  }

  return blocks;
}

async function parseContainerBlock(jsonString: string): Promise<ContentBlock | null> {
  try {
    const containerConfig = JSON.parse(jsonString);
    
    if (!Array.isArray(containerConfig.blocks)) {
      console.error('Error parsing container: `blocks` property must be an array.');
      return null;
    }

    // This part is correct, it processes each group of strings into a group of blocks
    const processedNestedBlocks = await Promise.all(
      containerConfig.blocks.map((blockContent: string[]) => processMarkdownContent(blockContent))
    );

    return {
      id: generateBlockId(),
      type: 'container',
      // Pass the nested array directly to the block
      blocks: processedNestedBlocks, 
      className: containerConfig.className || '',
    };
  } catch (error) {
    console.error('Error parsing container data:', error);
    return null;
  }
}

function parseTitleButtonBlock(jsonString: string): ContentBlock | null {
  try {
    const titleButtonConfig = JSON.parse(jsonString);
    return {
      id: generateBlockId(),
      type: 'titleButton',
      text: titleButtonConfig.text || '',
      url: titleButtonConfig.url || '',
      className: titleButtonConfig.className || '',
    };
  } catch (error) {
    console.error('Error parsing title button data:', error);
    return null;
  }
}

function parseDropdownBlock(jsonString: string): ContentBlock | null {
  try {
    const dropdownConfig = JSON.parse(jsonString);
    
    // Handle JSON-based dropdown (loads options from API)
    if (dropdownConfig.readFromJSON === true) {
      // Validate JSON data configuration
      if (!dropdownConfig.jsonData || typeof dropdownConfig.jsonData !== 'object') {
        console.error('Error parsing dropdown data: jsonData must be provided when readFromJSON is true');
        return null;
      }

      const { url, pathToOptions, valueField, labelField } = dropdownConfig.jsonData;
      if (!url || !pathToOptions) {
        console.error('Error parsing dropdown data: jsonData must include url and pathToOptions');
        return null;
      }

      const block = {
        id: generateBlockId(),
        type: 'dropdown' as const,
        label: dropdownConfig.label || '',
        placeholder: dropdownConfig.placeholder || 'Select an option...',
        description: dropdownConfig.description || '',
        defaultValue: dropdownConfig.defaultValue || '',
        allowEmpty: dropdownConfig.allowEmpty || false,
        searchable: dropdownConfig.searchable !== false, // Default to true
        disabled: dropdownConfig.disabled || false,
        className: dropdownConfig.className || '',
        exclusive: dropdownConfig.exclusive || false,
        inclusive: dropdownConfig.inclusive || false,
        readFromJSON: true,
        jsonData: {
          url,
          pathToOptions,
          valueField: valueField || 'value', // Default to 'value'
          labelField: labelField || 'label'  // Default to 'label'
        },
        showInMenu: parseShowInMenu(dropdownConfig),
        stateKey: dropdownConfig.stateKey || undefined,
        multiSelect: dropdownConfig.multiSelect || false
      };

      return block;
    } else {
      // Handle inline options (original behavior)
      // Validate required fields for inline options
      if (!Array.isArray(dropdownConfig.options)) {
        console.error('Error parsing dropdown data: options must be an array when readFromJSON is false or not specified');
        return null;
      }

      // Validate each option has required fields
      const validOptions = dropdownConfig.options.every((option: any) => 
        option && 
        typeof option.value === 'string' && 
        typeof option.label === 'string'
      );

      if (!validOptions) {
        console.error('Error parsing dropdown data: each option must have value and label properties');
        return null;
      }

      const block = {
        id: generateBlockId(),
        type: 'dropdown' as const,
        label: dropdownConfig.label || '',
        placeholder: dropdownConfig.placeholder || 'Select an option...',
        description: dropdownConfig.description || '',
        options: dropdownConfig.options,
        defaultValue: dropdownConfig.defaultValue || '',
        allowEmpty: dropdownConfig.allowEmpty || false,
        searchable: dropdownConfig.searchable !== false, // Default to true
        disabled: dropdownConfig.disabled || false,
        exclusive: dropdownConfig.exclusive || false,
        inclusive: dropdownConfig.inclusive || false,
        className: dropdownConfig.className || '',
        readFromJSON: false,
        showInMenu: parseShowInMenu(dropdownConfig),
        stateKey: dropdownConfig.stateKey || undefined,
        multiSelect: dropdownConfig.multiSelect || false
      };
      
      return block;
    }
  } catch (error) {
    console.error('Error parsing dropdown data:', error);
    return null;
  }
}

function parseFaqBlock(jsonString: string): ContentBlock | null {
  try {
    const faqConfig = JSON.parse(jsonString);

    const rawItems = Array.isArray(faqConfig?.items)
      ? faqConfig.items
      : Array.isArray(faqConfig)
        ? faqConfig
        : Array.isArray(faqConfig?.faq)
          ? faqConfig.faq
          : [];

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      console.error('Error parsing FAQ data: items array is required.');
      return null;
    }

    const items = rawItems
      .map((item: any) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const question = String(item.question ?? item.q ?? '').trim();
        const answerRaw = String(item.answer ?? item.a ?? '').trim();

        if (!question && !answerRaw) {
          return null;
        }

        return {
          question,
          answer: parseBoldText(answerRaw),
        };
      })
      .filter((item): item is { question: string; answer: string } => Boolean(item));

    if (!items.length) {
      console.error('Error parsing FAQ data: no valid FAQ items found.');
      return null;
    }

    const layout = faqConfig.layout === 'list' ? 'list' : 'accordion';
    const description = typeof faqConfig.description === 'string'
      ? parseBoldText(faqConfig.description)
      : '';

    return {
      id: generateBlockId(),
      type: 'faq',
      title: faqConfig.title || faqConfig.heading || '',
      description,
      className: faqConfig.className || '',
      layout,
      items,
      showInMenu: parseShowInMenu(faqConfig),
    };
  } catch (error) {
    console.error('Error parsing FAQ data:', error);
    return null;
  }
}

// Corrected helper function to parse kpi-cards blocks
function parseKpiCardsBlock(jsonString: string): ContentBlock | null {
  try {
    const kpiCardsConfig = JSON.parse(jsonString);

    if (!Array.isArray(kpiCardsConfig.items) && !Array.isArray(kpiCardsConfig)) {
      console.error('Error parsing kpi cards data: The provided JSON must contain an items array or be an array itself.');
      return null;
    }

    // Handle both formats: direct array or object with items property
    const kpiCardsArray = Array.isArray(kpiCardsConfig) ? kpiCardsConfig : kpiCardsConfig.items;

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
      className: kpiCardsConfig.className || '',
      showInMenu: parseShowInMenu(kpiCardsConfig)
    };
    return block;
  } catch (error) {
    console.error('Error parsing kpi cards data:', error);
    return null;
  }
}

function parseLiveMetricsBlock(jsonString: string): ContentBlock | null {
  try {
    const liveMetricsConfig = JSON.parse(jsonString);
    const hasFeeDisplayRows =
      Array.isArray(liveMetricsConfig?.feeDisplayRows) &&
      liveMetricsConfig.feeDisplayRows.length > 0;
    const hasChart = Boolean(liveMetricsConfig?.chart);

    if (!liveMetricsConfig?.dataUrl) {
      console.error('Error parsing live metrics data: dataUrl is required.');
      return null;
    }

    if (hasChart && hasFeeDisplayRows) {
      console.warn('Live metrics block configured with both chart and feeDisplayRows. chart will be ignored.');
    }

    if (hasFeeDisplayRows && liveMetricsConfig.feeDisplayRows.length > 1) {
      console.warn('Live metrics block supports only one feeDisplayRow currently. Extra rows will be ignored.');
    }

    return {
      id: generateBlockId(),
      type: 'live-metrics',
      title: liveMetricsConfig.title || '',
      icon: liveMetricsConfig.icon || undefined,
      className: liveMetricsConfig.className || '',
      layout: liveMetricsConfig.layout || undefined,
      chartHeightClassName: liveMetricsConfig.chartHeightClassName || undefined,
      dataUrl: liveMetricsConfig.dataUrl,
      dataPath: liveMetricsConfig.dataPath || undefined,
      historyUrl: liveMetricsConfig.historyUrl || undefined,
      historyPath: liveMetricsConfig.historyPath || undefined,
      refreshInterval: liveMetricsConfig.refreshInterval || undefined,
      metricsLeft: liveMetricsConfig.metricsLeft || undefined,
      metricsRight: liveMetricsConfig.metricsRight || undefined,
      liveMetric: liveMetricsConfig.liveMetric || undefined,
      chart: hasFeeDisplayRows ? undefined : liveMetricsConfig.chart || undefined,
      feeDisplayRows: hasFeeDisplayRows ? liveMetricsConfig.feeDisplayRows.slice(0, 1) : undefined,
      showInMenu: parseShowInMenu(liveMetricsConfig),
    };
  } catch (error) {
    console.error('Error parsing live metrics data:', error);
    return null;
  }
}

function parseLiveMetricsRowBlock(jsonString: string): ContentBlock | null {
  try {
    const liveMetricsConfig = JSON.parse(jsonString);
    const items = Array.isArray(liveMetricsConfig?.items) ? liveMetricsConfig.items : [];

    if (!items.length) {
      console.error('Error parsing live metrics row data: items array is required.');
      return null;
    }

    const parsedItems = items.slice(0, 3).map((item: any) => {
      const hasFeeDisplayRows = Array.isArray(item?.feeDisplayRows) && item.feeDisplayRows.length > 0;
      const hasChart = Boolean(item?.chart);

      if (hasChart && hasFeeDisplayRows) {
        console.warn(`Live metrics row item "${item?.title || 'unknown'}" has both chart and feeDisplayRows. chart will be ignored.`);
      }

      if (hasFeeDisplayRows && item.feeDisplayRows.length > 1) {
        console.warn(`Live metrics row item "${item?.title || 'unknown'}" supports only one feeDisplayRow currently. Extra rows will be ignored.`);
      }

      return {
        ...item,
        chart: hasFeeDisplayRows ? undefined : item?.chart,
        feeDisplayRows: hasFeeDisplayRows ? item?.feeDisplayRows.slice(0, 1) : undefined,
      };
    });

    return {
      id: generateBlockId(),
      type: 'live-metrics-row',
      items: parsedItems,
      className: liveMetricsConfig.className || '',
      showInMenu: parseShowInMenu(liveMetricsConfig),
    };
  } catch (error) {
    console.error('Error parsing live metrics row data:', error);
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
      margins: chartConfig.margins || 'normal',
      chartType: chartConfig.type || 'line',
      data: chartConfig.data || [],
      options: chartConfig.options || {},
      title: chartConfig.title,
      subtitle: chartConfig.subtitle,
      width: chartConfig.width || '100%',
      height: chartConfig.height || 400,
      caption: chartConfig.caption,
      disableTooltipSort: chartConfig.disableTooltipSort || false,
      // stacking: chartConfig.stacking || null,
      showXAsDate: chartConfig.showXAsDate || false,
      showZeroTooltip: chartConfig.showZeroTooltip ?? true,
      showTotalTooltip: chartConfig.showTotalTooltip ?? false,
      dataAsJson: chartConfig.dataAsJson || null,
      seeMetricURL: chartConfig.seeMetricURL || null,
      yAxisLine: chartConfig.yAxisLine || [],
      showInMenu: parseShowInMenu(chartConfig),
      filterOnStateKey: chartConfig.filterOnStateKey || undefined
    };
  } catch (error) {
    console.error('Error parsing chart data:', error);
    return null;
  }
}

function parseChartToggleBlock(jsonString: string): ChartToggleBlock | null {
  try {
    const toggleConfig = JSON.parse(jsonString);

    if (!Array.isArray(toggleConfig.charts) || toggleConfig.charts.length === 0) {
      console.error('Error parsing chart toggle data: charts array is required.');
      return null;
    }

    const charts = toggleConfig.charts
      .map((chartConfig: any, index: number) => {
        if (!chartConfig || typeof chartConfig !== 'object') {
          return null;
        }

        const parsedChart = parseChartBlock(JSON.stringify(chartConfig));

        if (parsedChart && parsedChart.type === 'chart') {
          const toggleLabelSource =
            typeof chartConfig.toggleLabel === 'string'
              ? chartConfig.toggleLabel
              : typeof chartConfig.label === 'string'
                ? chartConfig.label
                : parsedChart.title;

          const toggleLabel =
            typeof toggleLabelSource === 'string' && toggleLabelSource.trim().length > 0
              ? toggleLabelSource.trim()
              : `Chart ${index + 1}`;

          const chart: ChartBlock = {
            ...(parsedChart as ChartBlock),
            toggleLabel,
            suppressWrapperSpacing: true,
            showInMenu: false,
          };

          return chart;
        }

        return null;
      })
      .filter((chart): chart is ChartBlock => chart !== null);

    if (!charts.length) {
      console.error('Error parsing chart toggle data: no valid charts provided.');
      return null;
    }

    const defaultIndex =
      typeof toggleConfig.defaultIndex === 'number'
        ? Math.min(Math.max(0, toggleConfig.defaultIndex), charts.length - 1)
        : 0;

    const layout = toggleConfig.layout === 'segmented' ? 'segmented' : 'tabs';
    const description =
      typeof toggleConfig.description === 'string'
        ? parseBoldText(toggleConfig.description)
        : '';

    const block: ChartToggleBlock = {
      id: generateBlockId(),
      type: 'chart-toggle',
      title: toggleConfig.title || '',
      description,
      className: toggleConfig.className || '',
      layout,
      defaultIndex,
      charts,
      showInMenu: parseShowInMenu(toggleConfig),
    };

    return block;
  } catch (error) {
    console.error('Error parsing chart toggle data:', error);
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

      const { url, pathToRowData, pathToColumnKeys } = tableConfig.jsonData;
      if (!url || !pathToRowData) {
        console.error('Error parsing table data: jsonData must include url and pathToRowData');
        return null;
      }

      const block = {
        id: generateBlockId(),
        type: 'table' as const,
        content: tableConfig.content || '',
        className: tableConfig.className || '',
        columnOrder: Array.isArray(tableConfig.columnOrder) ? tableConfig.columnOrder : undefined,
        columnSortBy: tableConfig.columnSortBy || undefined,
        columnDefinitions: tableConfig.columnDefinitions || {},
        readFromJSON: true,
        jsonData: {
          url,
          pathToRowData,
          pathToColumnKeys // Optional - component will auto-discover if not provided
        },
        scrollable: tableConfig.scrollable,
        rowBar: tableConfig.rowBar || undefined,
        cardView: tableConfig.cardView || undefined,
        showInMenu: parseShowInMenu(tableConfig),
        filterOnStateKey: tableConfig.filterOnStateKey || undefined
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
        columnOrder: Array.isArray(tableConfig.columnOrder) ? tableConfig.columnOrder : undefined,
        columnDefinitions: tableConfig.columnDefinitions || {},
        columnSortBy: tableConfig.columnSortBy || undefined,
        readFromJSON: false,
        rowData: tableConfig.rowData,
        scrollable: tableConfig.scrollable,
        rowBar: tableConfig.rowBar || undefined,
        cardView: tableConfig.cardView || undefined,
        showInMenu: parseShowInMenu(tableConfig),
        filterOnStateKey: tableConfig.filterOnStateKey || undefined
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
      caption: iframeConfig.caption || '',
      showInMenu: parseShowInMenu(iframeConfig)
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
      className: imageConfig.className || '',
      showInMenu: parseShowInMenu(imageConfig)
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
  
  let width, height, align, showInMenu;
  
  if (attributes) {
    attributes.split(',').forEach(attr => {
      const [key, value] = attr.trim().split('=');
      if (key === 'width') width = value;
      if (key === 'height') height = value;
      if (key === 'align') align = value;
      if (key === 'showInMenu') showInMenu = value === 'true';
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
    className: align ? `text-${align}` : '',
    showInMenu
  };
}

// Helper function to parse bold text in paragraphs
function parseBoldText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
