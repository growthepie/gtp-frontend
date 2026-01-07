#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Comprehensive color mapping
// IMPORTANT: Most components only have dark mode colors without "dark:" prefix
// because the app defaulted to dark mode. So we map dark mode hex values to
// the CSS variable classes (which handle both light and dark modes automatically)
const COLOR_REPLACEMENTS = {
  // === DARK MODE COLORS (most common - used without dark: prefix) ===
  // These are the colors actually used in most components since app defaulted to dark

  // Dark mode backgrounds
  'bg-\\[#1F2726\\]': 'bg-color-bg-default', // Dark mode default bg
  'bg-\\[#1f2726\\]': 'bg-color-bg-default',
  'bg-background': 'bg-color-bg-default', // #1F2726 dark

  'bg-\\[#344240\\]': 'bg-color-bg-medium', // Dark mode medium bg
  'bg-\\[#344240\\]': 'bg-color-bg-medium',
  'bg-medium-background': 'bg-color-bg-medium',

  'bg-\\[#5A6462\\]': 'bg-color-ui-hover', // Dark mode hover
  'bg-\\[#5a6462\\]': 'bg-color-ui-hover',
  'bg-forest-800': 'bg-color-ui-hover',
  'bg-hover': 'bg-color-ui-hover',

  'bg-\\[#151A19\\]': 'bg-color-ui-active', // Dark mode active
  'bg-\\[#151a19\\]': 'bg-color-ui-active',
  'bg-forest-1000': 'bg-color-ui-active',
  'bg-active-black': 'bg-color-ui-active',

  // Dark mode text colors
  'text-\\[#CDD8D3\\]': 'text-color-text-primary', // Dark mode primary text
  'text-\\[#cdd8d3\\]': 'text-color-text-primary',
  'text-forest-500': 'text-color-text-primary',
  'text-active': 'text-color-text-primary', // active was #CDD8D3

  'text-\\[#151A19\\]': 'text-color-text-black', // Dark mode "black" text
  'text-\\[#151a19\\]': 'text-color-text-black',
  'text-active-black': 'text-color-text-black',
  'text-forest-1000': 'text-color-text-black',

  // Dark mode accent colors (these stay same in both modes)
  'text-\\[#FE5468\\]': 'text-color-accent-red',
  'text-\\[#fe5468\\]': 'text-color-accent-red',

  'text-\\[#FFDF27\\]': 'text-color-accent-yellow',
  'text-\\[#ffdf27\\]': 'text-color-accent-yellow',

  'text-\\[#1DF7EF\\]': 'text-color-accent-turquoise',
  'text-\\[#1df7ef\\]': 'text-color-accent-turquoise',

  'text-\\[#10808C\\]': 'text-color-accent-petrol',
  'text-\\[#10808c\\]': 'text-color-accent-petrol',

  'text-\\[#4CFF7E\\]': 'text-color-positive',
  'text-\\[#4cff7e\\]': 'text-color-positive',
  'text-positive': 'text-color-positive',

  'text-\\[#FF3838\\]': 'text-color-negative',
  'text-\\[#ff3838\\]': 'text-color-negative',
  'text-negative': 'text-color-negative',

  // Dark mode borders
  'border-\\[#344240\\]': 'border-color-border', // Dark mode border is #344240
  'border-\\[#344240\\]': 'border-color-border',
  'border-medium-background': 'border-color-border',
  'border-forest-700': 'border-color-border',

  // === LIGHT MODE COLORS (rarely used) ===
  // Keep these for the few places that might have explicit light mode

  'bg-\\[#F5FAF8\\]': 'bg-color-bg-default', // Light mode default
  'bg-\\[#f5faf8\\]': 'bg-color-bg-default',
  'bg-forest-100': 'bg-color-bg-default',

  'bg-\\[#E6EAE8\\]': 'bg-color-bg-medium', // Light mode medium
  'bg-\\[#e6eae8\\]': 'bg-color-bg-medium',

  'bg-\\[#A5A8A7\\]': 'bg-color-ui-hover', // Light mode hover
  'bg-\\[#a5a8a7\\]': 'bg-color-ui-hover',

  'bg-\\[#E9EFEC\\]': 'bg-color-ui-active', // Light mode active
  'bg-\\[#e9efec\\]': 'bg-color-ui-active',

  // Light mode text (when used which is rare)
  'text-\\[#1F2726\\]': 'text-color-text-primary', // Light mode primary is dark green
  'text-\\[#1f2726\\]': 'text-color-text-primary',

  'text-\\[#111111\\]': 'text-color-text-black', // Light mode black
  'text-\\[#111111\\]': 'text-color-text-black',

  // Light mode borders
  'border-\\[#C7D2CD\\]': 'border-color-border', // Light mode border
  'border-\\[#c7d2cd\\]': 'border-color-border',

  // === EXPLICIT DARK MODE PREFIXES (when they exist) ===
  'dark:bg-\\[#1F2726\\]': 'bg-color-bg-default',
  'dark:bg-\\[#1f2726\\]': 'bg-color-bg-default',
  'dark:bg-background': 'bg-color-bg-default',

  'dark:text-\\[#CDD8D3\\]': 'text-color-text-primary',
  'dark:text-\\[#cdd8d3\\]': 'text-color-text-primary',

  // Hover states
  'hover:bg-\\[#5A6462\\]': 'hover:bg-color-ui-hover',
  'hover:bg-\\[#5a6462\\]': 'hover:bg-color-ui-hover',
  'hover:bg-forest-800': 'hover:bg-color-ui-hover',
  'hover:text-\\[#CDD8D3\\]': 'hover:text-color-text-primary',
  'hover:text-\\[#cdd8d3\\]': 'hover:text-color-text-primary',
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changeCount = 0;

  // Replace each pattern
  Object.entries(COLOR_REPLACEMENTS).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(regex, replacement);
    }
  });

  // Handle style prop colors
  // Map hex colors to CSS variables (these are mostly dark mode values)
  const styleColorMap = {
    // Dark mode colors (most common)
    '#CDD8D3': 'var(--text-primary)', // Dark mode text
    '#cdd8d3': 'var(--text-primary)',
    '#5A6462': 'var(--ui-hover)', // Dark mode hover
    '#5a6462': 'var(--ui-hover)',
    '#1F2726': 'var(--bg-default)', // Dark mode background
    '#1f2726': 'var(--bg-default)',
    '#344240': 'var(--bg-medium)', // Dark mode medium bg
    '#344240': 'var(--bg-medium)',
    '#151A19': 'var(--ui-active)', // Dark mode active/black
    '#151a19': 'var(--ui-active)',

    // Accent colors (same in both modes)
    '#FE5468': 'var(--accent-red)',
    '#fe5468': 'var(--accent-red)',
    '#FFDF27': 'var(--accent-yellow)',
    '#ffdf27': 'var(--accent-yellow)',
    '#1DF7EF': 'var(--accent-turquoise)',
    '#1df7ef': 'var(--accent-turquoise)',
    '#10808C': 'var(--accent-petrol)',
    '#10808c': 'var(--accent-petrol)',

    // Status colors
    '#4CFF7E': 'var(--positive)',
    '#4cff7e': 'var(--positive)',
    '#FF3838': 'var(--negative)',
    '#ff3838': 'var(--negative)',

    // Light mode colors (less common)
    '#F5FAF8': 'var(--bg-default)', // Light mode bg
    '#f5faf8': 'var(--bg-default)',
    '#E6EAE8': 'var(--bg-medium)', // Light mode medium
    '#e6eae8': 'var(--bg-medium)',
    '#111111': 'var(--text-black)', // Light mode black text
    '#C7D2CD': 'var(--border)', // Light mode border
    '#c7d2cd': 'var(--border)',
  };

  Object.entries(styleColorMap).forEach(([hex, cssVar]) => {
    const styleRegex = new RegExp(`style={{([^}]*color:\\s*['"\`]?)${hex.replace('#', '\\#')}`, 'g');
    const matches = content.match(styleRegex);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(styleRegex, `style={{$1rgb(${cssVar})`);
    }
  });

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated ${changeCount} colors in ${path.basename(filePath)}`);
    return { filePath, changeCount, success: true };
  }

  return { filePath, changeCount: 0, success: false };
}

// Main execution
console.log('🎨 Starting Color Migration...\n');

const patterns = [
  'app/**/*.{tsx,jsx}',
  'components/**/*.{tsx,jsx}',
  'pages/**/*.{tsx,jsx}',
];

let totalFiles = 0;
let totalChanges = 0;
let migratedFiles = [];

patterns.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(file => {
    totalFiles++;
    const result = migrateFile(file);
    if (result.success) {
      migratedFiles.push(result.filePath);
      totalChanges += result.changeCount;
    }
  });
});

console.log('\n📊 Migration Summary:');
console.log(`Files scanned: ${totalFiles}`);
console.log(`Files migrated: ${migratedFiles.length}`);
console.log(`Total replacements: ${totalChanges}`);

// Save migration log
const logContent = {
  timestamp: new Date().toISOString(),
  filesScanned: totalFiles,
  filesMigrated: migratedFiles.length,
  totalReplacements: totalChanges,
  migratedFiles: migratedFiles,
};

fs.writeFileSync('color-migration-log.json', JSON.stringify(logContent, null, 2));
console.log('\n📝 Migration log saved to color-migration-log.json');