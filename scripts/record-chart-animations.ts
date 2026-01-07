import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://local.growthepie.xyz:3000';
const MASTER_API_URL = 'https://api.growthepie.com/v1/master.json';
const OUTPUT_DIR = 'C:\\Users\\Pie\\fireworks';
const METRIC_URL_KEY = 'transaction-count';
const METRIC_API_KEY = 'txcount'; // From MetricURLKeyToAPIKey mapping
const ANIMATION_DURATION_MS = 7000; // 7 seconds buffer (3.65s animation + 0.95s firework + buffer)
// Note: Playwright records as .webm format. Files will be saved as .webm

interface MasterResponse {
  chains: {
    [key: string]: {
      deployment: 'PROD' | 'DEV';
      [key: string]: any;
    };
  };
  metrics: {
    [key: string]: {
      supported_chains: string[];
      [key: string]: any;
    };
  };
}

async function fetchMasterData(): Promise<MasterResponse> {
  console.log('Fetching master data from API...');
  const response = await fetch(MASTER_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch master data: ${response.statusText}`);
  }
  return await response.json();
}

function getSupportedChains(master: MasterResponse): string[] {
  const metric = master.metrics[METRIC_API_KEY];
  if (!metric) {
    throw new Error(`Metric ${METRIC_API_KEY} not found in master data`);
  }

  // Filter chains that are PROD and supported by the metric
  const supportedChains = metric.supported_chains || [];
  const prodChains = Object.keys(master.chains).filter(
    (key) => master.chains[key].deployment === 'PROD'
  );

  // Return intersection of supported chains and PROD chains
  return supportedChains.filter((chain) => prodChains.includes(chain));
}

async function ensureOutputDirectory(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating output directory: ${OUTPUT_DIR}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function waitForChartToLoad(page: Page): Promise<void> {
  console.log('Waiting for chart to load...');
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for Highcharts container to be visible
  // Highcharts typically creates a container with class 'highcharts-container'
  await page.waitForSelector('.highcharts-container', { timeout: 30000 });
  
  // Wait a bit more for data to render
  await page.waitForTimeout(1000);
  
  console.log('Chart loaded');
}

async function recordAnimation(
  browser: Browser,
  chain: string,
  outputPath: string
): Promise<void> {
  console.log(`\nRecording animation for chain: ${chain}`);
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.dirname(outputPath),
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  
  try {
    const url = `${BASE_URL}/embed/fundamentals/${METRIC_URL_KEY}?timespan=365d&scale=cumulative&chains=${chain}`;
    console.log(`Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    
    await waitForChartToLoad(page);
    
    console.log('Pressing spacebar to trigger animation...');
    await page.keyboard.press('Space');
    
    // Wait for animation to complete (including firework)
    console.log(`Waiting ${ANIMATION_DURATION_MS}ms for animation to complete...`);
    await page.waitForTimeout(ANIMATION_DURATION_MS);
    
    // Close page to finalize video
    await page.close();
    await context.close();
    
    // Playwright saves video with a random name, we need to find and rename it
    // The video is saved in the same directory as outputPath
    const videoDir = path.dirname(outputPath);
    const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
    
    if (videoFiles.length > 0) {
      // Get the most recent video file (should be the one we just created)
      const videoFilesWithStats = videoFiles.map((f) => ({
        name: f,
        path: path.join(videoDir, f),
        mtime: fs.statSync(path.join(videoDir, f)).mtime,
      }));
      videoFilesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      const latestVideo = videoFilesWithStats[0];
      // Playwright saves as .webm, so we use .webm extension
      const finalOutputPath = path.join(OUTPUT_DIR, `${chain}.webm`);
      
      // Rename to our desired output path
      fs.renameSync(latestVideo.path, finalOutputPath);
      console.log(`✓ Saved recording to: ${finalOutputPath}`);
    } else {
      throw new Error('No video file was created');
    }
  } catch (error) {
    await page.close();
    await context.close();
    throw error;
  }
}

async function main() {
  console.log('Starting chart animation recording script...\n');
  
  try {
    // Ensure output directory exists
    await ensureOutputDirectory();
    
    // Fetch master data
    const master = await fetchMasterData();
    
    // Get supported chains
    const chains = getSupportedChains(master);
    console.log(`\nFound ${chains.length} supported chains: ${chains.join(', ')}\n`);
    
    if (chains.length === 0) {
      console.log('No chains to record. Exiting.');
      return;
    }
    
    // Launch browser
    console.log('Launching browser...');
    const browser = await chromium.launch({
      headless: false, // We need to see the page for recording
    });
    
    // Record each chain
    const results: { chain: string; success: boolean; error?: string }[] = [];
    
    for (const chain of chains) {
      try {
        const outputPath = path.join(OUTPUT_DIR, `${chain}.mp4`);
        await recordAnimation(browser, chain, outputPath);
        results.push({ chain, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to record ${chain}: ${errorMessage}`);
        results.push({ chain, success: false, error: errorMessage });
      }
    }
    
    // Close browser
    await browser.close();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('Recording Summary:');
    console.log('='.repeat(50));
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    
    console.log(`✓ Successful: ${successful.length}/${results.length}`);
    if (successful.length > 0) {
      console.log('  Chains:', successful.map((r) => r.chain).join(', '));
    }
    
    if (failed.length > 0) {
      console.log(`\n✗ Failed: ${failed.length}/${results.length}`);
      failed.forEach((r) => {
        console.log(`  ${r.chain}: ${r.error}`);
      });
    }
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

