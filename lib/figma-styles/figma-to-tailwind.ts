import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = path.resolve(__dirname, "./output");
const TOKENS_CACHE_FILE = path.resolve(CACHE_DIR, "tokens.json");
const TAILWIND_THEME_FILE = path.resolve(CACHE_DIR, "tailwind-theme.js");
const TAILWIND_THEME_TS_FILE = path.resolve(CACHE_DIR, "tailwind-theme.ts");
const TAILWIND_PRESET_FILE = path.resolve(CACHE_DIR, "tailwind-preset.js");

interface DesignTokens {
  colors: Array<{ name: string; value: string }>;
  gradients: Array<{ name: string; value: string }>;
  fonts: Array<{ name: string; fontFamily: string }>; // name is slugified, fontFamily is raw
  typeStyles: Array<{
    name: string; // slugified name of the type style, e.g., "heading-large-xs"
    fontFamily: string; // raw font family name, e.g., "Raleway"
    fontSize: string;
    fontWeight?: number;
    lineHeight: string;
    letterSpacing: string;
  }>;
  spacePatterns: Array<{ name: string; value: string }>;
}

interface TailwindTheme {
  colors: Record<string, Record<string, string> | string>;
  backgroundImage: Record<string, string>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string; fontWeight?: string }]>;
  spacing: Record<string, string>;
}

function generateTailwindTheme(tokens: DesignTokens): Omit<TailwindTheme, 'colors'> & { colors: Record<string, Record<string, string> | string> } {
  const theme: Omit<TailwindTheme, 'colors'> & { colors: Record<string, Record<string, string> | string> } = {
    colors: {},
    backgroundImage: {},
    fontFamily: {},
    fontSize: {},
    spacing: {}
  };

  tokens.gradients.forEach(gradient => {
    theme.backgroundImage[gradient.name] = gradient.value;
  });

  tokens.fonts.forEach(font => {
    const fallbacks = font.fontFamily.toLowerCase().includes('mono') 
      ? ['monospace'] 
      : ['ui-sans-serif', 'system-ui', 'sans-serif'];
    theme.fontFamily[font.name] = [font.fontFamily, ...fallbacks];
  });

  tokens.typeStyles.forEach(style => {
    const config: any = {
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
    };
    if (style.fontWeight) {
      config.fontWeight = style.fontWeight.toString();
    }
    theme.fontSize[style.name] = [style.fontSize, config];
  });

  tokens.spacePatterns.forEach(space => {
    theme.spacing[space.name] = space.value;
  });

  return theme;
}

function generateColorScales(colors: Array<{ name: string; value: string }>): Record<string, Record<string, string> | string> {
  const colorGroups: Record<string, Record<string, string> | string> = {};
  colors.forEach(color => {
    const match = color.name.match(/^(?:(light|dark)-)?(.+?)(?:-(\d+))?$/);
    if (match) {
      const mode = match[1];
      const baseNamePart = match[2];
      const scale = match[3];
      const finalBaseName = mode ? `${mode}-${baseNamePart}` : baseNamePart;

      if (typeof colorGroups[finalBaseName] !== 'object' || colorGroups[finalBaseName] === null) {
        let existingDefaultValue: string | undefined = undefined;
        if (typeof colorGroups[finalBaseName] === 'string') {
            existingDefaultValue = colorGroups[finalBaseName] as string;
        }
        colorGroups[finalBaseName] = {};
        if (existingDefaultValue) {
            (colorGroups[finalBaseName] as Record<string, string>)['DEFAULT'] = existingDefaultValue;
        }
      }
      const group = colorGroups[finalBaseName] as Record<string, string>;
      if (scale) {
        group[scale] = color.value;
      } else {
        group['DEFAULT'] = color.value;
      }
    } else {
      colorGroups[color.name] = color.value; 
      console.warn(`Color name "${color.name}" ("${color.value}") could not be parsed into a scale and was added as a flat color.`);
    }
  });
  return colorGroups;
}

function generateTailwindFiles(tokens: DesignTokens) {
  const themeBase = generateTailwindTheme(tokens);
  const allColors = generateColorScales(tokens.colors);

  const jsContent = `/**
 * Tailwind Theme Generated from Figma
 * Generated on: ${new Date().toISOString()}
 */

const theme = {
  extend: {
    colors: ${JSON.stringify(allColors, null, 4).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
    backgroundImage: ${JSON.stringify(themeBase.backgroundImage, null, 4).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
    fontFamily: ${JSON.stringify(themeBase.fontFamily, null, 4).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
    fontSize: ${JSON.stringify(themeBase.fontSize, null, 4).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
    spacing: ${JSON.stringify(themeBase.spacing, null, 4).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
  }
};

module.exports = theme;
`;

  const tsContent = `/**
 * Tailwind Theme Generated from Figma
 * Generated on: ${new Date().toISOString()}
 */

export const colors = ${JSON.stringify(allColors, null, 2)} as const;
export const backgroundImage = ${JSON.stringify(themeBase.backgroundImage, null, 2)} as const;
export const fontFamily = ${JSON.stringify(themeBase.fontFamily, null, 2)} as const;
export const fontSize = ${JSON.stringify(themeBase.fontSize, null, 2)} as const;
export const spacing = ${JSON.stringify(themeBase.spacing, null, 2)} as const;

export const theme = {
  extend: {
    colors,
    backgroundImage,
    fontFamily,
    fontSize,
    spacing,
  }
} as const;

export default theme;
`;

  // Generate typography plugin string
  // We pass tokens.typeStyles and tokens.fonts to be stringified into the plugin function
  const typographyPluginFunctionString = `
    function({ addUtilities, theme }) {
      const typeStylesData = ${JSON.stringify(tokens.typeStyles, null, 6)};
      const fontsData = ${JSON.stringify(tokens.fonts, null, 6)};
      
      const utilities = {};
      typeStylesData.forEach(style => {
        const fontInfo = fontsData.find(f => f.fontFamily === style.fontFamily);
        
        // The key for theme('fontFamily') is the slugified name (fontInfo.name)
        const fontFamilyThemeKey = fontInfo ? fontInfo.name : null;

        if (!fontFamilyThemeKey) {
          console.warn(\`[Figma Plugin Gen] Could not find font theme key for style: \${style.name} (font family: \${style.fontFamily}). Skipping this utility.\`);
          return;
        }
        
        // Ensure the font family exists in the theme
        const themeFontFamily = theme('fontFamily');
        if (!themeFontFamily || !themeFontFamily[fontFamilyThemeKey]) {
          console.warn(\`[Figma Plugin Gen] Font family key "\${fontFamilyThemeKey}" not found in Tailwind theme for style: \${style.name}. Skipping this utility.\`);
          return;
        }

        const utilityClass = \`.type-\${style.name}\`; // e.g., .type-heading-large-xs
        
        const styleProperties = {
          fontFamily: themeFontFamily[fontFamilyThemeKey],
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
        };
        
        if (style.fontWeight) {
          styleProperties.fontWeight = style.fontWeight.toString();
        }
        
        utilities[utilityClass] = styleProperties;
      });
      
      addUtilities(utilities);
    }
  `;

  const presetContent = `/**
 * Tailwind Preset Generated from Figma
 * Generated on: ${new Date().toISOString()}
 * 
 * Usage in tailwind.config.js
 */
const plugin = require('tailwindcss/plugin');

module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(allColors, null, 6).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
      backgroundImage: ${JSON.stringify(themeBase.backgroundImage, null, 6).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
      fontFamily: ${JSON.stringify(themeBase.fontFamily, null, 6).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
      fontSize: ${JSON.stringify(themeBase.fontSize, null, 6).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
      spacing: ${JSON.stringify(themeBase.spacing, null, 6).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')},
    }
  },
  plugins: [
    plugin(${typographyPluginFunctionString})
  ]
};
`;

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(TAILWIND_THEME_FILE, jsContent);
  fs.writeFileSync(TAILWIND_THEME_TS_FILE, tsContent);
  fs.writeFileSync(TAILWIND_PRESET_FILE, presetContent);
  
  console.log('\n📝 Generated Tailwind theme files:');
  console.log(`  - ${path.basename(TAILWIND_THEME_FILE)} (in ${CACHE_DIR})`);
  console.log(`  - ${path.basename(TAILWIND_THEME_TS_FILE)} (in ${CACHE_DIR})`);
  console.log(`  - ${path.basename(TAILWIND_PRESET_FILE)} (in ${CACHE_DIR})`);
}

// Simple slugify, align with figma.ts if different
const slugify = (text: string): string => 
  text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '') 
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

function generateCSSVariables(tokens: DesignTokens) {
  const cssVarsFile = path.resolve(CACHE_DIR, "design-tokens.css");
  let cssContent = `/**
 * CSS Custom Properties Generated from Figma
 * Generated on: ${new Date().toISOString()}
 */

:root {
`;

  cssContent += '  /* Colors */\n';
  tokens.colors.forEach(color => {
    cssContent += `  --color-${color.name}: ${color.value};\n`;
  });

  cssContent += '\n  /* Gradients */\n';
  tokens.gradients.forEach(gradient => {
    cssContent += `  --gradient-${gradient.name}: ${gradient.value};\n`;
  });

  cssContent += '\n  /* Font Families */\n';
  tokens.fonts.forEach(font => {
    const primaryFont = JSON.stringify(font.fontFamily);
    const fallbacks = font.fontFamily.toLowerCase().includes('mono') 
      ? ['monospace'] 
      : ['ui-sans-serif', 'system-ui', 'sans-serif'];
    const fontFamilyValue = [primaryFont, ...fallbacks].join(', ');
    cssContent += `  --font-${font.name}: ${fontFamilyValue};\n`;
  });

  cssContent += '\n  /* Spacing */\n';
  tokens.spacePatterns.forEach(space => {
    cssContent += `  --spacing-${space.name}: ${space.value};\n`;
  });

  cssContent += '\n  /* Typography */\n';
  tokens.typeStyles.forEach(style => {
    cssContent += `  /* ${style.name} */\n`;
    const fontToken = tokens.fonts.find(f => f.fontFamily === style.fontFamily);
    const fontTokenName = fontToken ? fontToken.name : slugify(style.fontFamily); 
    cssContent += `  --type-${style.name}-font-family: var(--font-${fontTokenName});\n`;
    cssContent += `  --type-${style.name}-font-size: ${style.fontSize};\n`;
    cssContent += `  --type-${style.name}-line-height: ${style.lineHeight};\n`;
    cssContent += `  --type-${style.name}-letter-spacing: ${style.letterSpacing};\n`;
    if (style.fontWeight) {
      cssContent += `  --type-${style.name}-font-weight: ${style.fontWeight};\n`;
    }
  });

  cssContent += '}\n';
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(cssVarsFile, cssContent);
  console.log(`  - ${path.basename(cssVarsFile)} (in ${CACHE_DIR})`);
}

export { generateTailwindTheme, generateTailwindFiles, generateCSSVariables };