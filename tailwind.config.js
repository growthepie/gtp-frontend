const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    fontWeight: {
      thin: "100",
      hairline: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "500",
      bold: "700",
      extrabold: "800",
      "extra-bold": "800",
      black: "900",
    },
    extend: {
      transitionProperty: {
        height: "height",
      },
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        raleway: ["var(--font-raleway)", "sans-serif"],
        sans: ["var(--font-raleway)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-fira-mono)", ...defaultTheme.fontFamily.mono], 
        num: ["var(--font-fira-sans)", "sans-serif"],
        "source-code-pro": ["var(--font-source-code-pro)", "sans-serif"],
      },
      fontSize: {
        'xxxs': '9px',
        'xxs': '10px',
        'xs': '12px',
        'sm': '14px',
        'md': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '60px',
      },
      lineHeight: {
        snug: "1.2",
      },
      transitionProperty: {
        height: "height",
        width: "width",
      },
      screens: {
        cxl: "1100px",
        exl: "1330px",
        mdl: "1000px",
        xs: "480px",
        "2xs": "420px",
        "3xs": "340px",
      },
      colors: {
        positive: "#4CFF7E",
        negative: "#FF3838",
        forest: {
          DEFAULT: "#293332",
          50: "#EAECEB", // updated
          100: "#F0F5F3",
          200: "#B5C4C3",
          300: "#9FB2B0",
          400: "#88A09D",
          500: "#CDD8D3",
          600: "#5F7775",
          700: "#364240",
          800: "#5A6462",
          900: "#2A3433",
          950: "#1B2524",
          1000: "#151A19",
        },
        hover: "#5A6462",
        active: "#CDD8D3",
        "background": "#1F2726",
        "medium-background": "#344240",
        "active-black": "#151A19",
        
      },
      animation: {
        shake: "shake 0.5s ease-in-out infinite",
        glint: 'glint 8s linear infinite',
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
        glint: {
          '0%': { transform: 'translateX(-100%) skewX(-20deg) skewY(-35deg)' },
          '10%': { transform: 'translateX(50%) skewX(-20deg) skewY(-35deg)' },
          '20%': { transform: 'translateX(100%) skewX(-20deg) skewY(-35deg)' },
          '100%': { transform: 'translateX(100%) skewX(-20deg) skewY(-35deg)' },
        },
      },
      zIndex: { 
        ...defaultTheme.zIndex,
        'context-menu': '9000',
        'global-search-tooltip': '8100',
        'global-search': '8001',
        'global-search-backdrop': '8000',
        'dropdown': '100',
        'chart': '20',
      },
      transitionDuration: {
        ...defaultTheme.transitionDuration,
        'sidebar': '200ms',
      },
      transitionTimingFunction: {
        ...defaultTheme.transitionTimingFunction,
        'sidebar': 'cubic-bezier(0.5, 0, 0.5, 1.0)',
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar")({ nocompatible: true }),
    require("@tailwindcss/container-queries"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-utility": {
          "scrollbar-width": "thin",
          "scrollbar-gutter": "stable both-edges",
          "&::-webkit-scrollbar": {
            width: "12px",
          },
          "&::-webkit-scrollbar-track": {
            "background-color": "rgba(34, 85, 50, 0.05)",
            "border-radius": "12px",
          },
          "&::-webkit-scrollbar-thumb": {
            "background-color": "#2d2f2e",
            "border-radius": "12px",
            border: "3px solid rgba(34, 85, 50, 0.05)",
          },
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
    function({ addUtilities, theme }) {
      // Define base styles for each category
      const baseStyles = {
        'heading-large': {
          fontFamily: theme("fontFamily.raleway"),
          fontWeight: '700', // bold
          lineHeight: '120%',
        },
        'heading-small': {
          fontFamily: theme('fontFamily.raleway'),
          fontWeight: '700', // bold
          lineHeight: '120%',
        },
        'heading-caps': {
          fontFamily: theme('fontFamily.raleway'),
          fontWeight: '700', // bold
          fontVariant: 'all-small-caps',
          fontFeatureSettings: '"pnum" on, "lnum" on',
          lineHeight: '120%',
        },
        'numbers': {
          fontFamily: theme('fontFamily.num'),
          fontWeight: '500', // medium
          letterSpacing: '0.05em', // 5%
          lineHeight: '100%',
          textRendering: 'optimizeLegibility',
          fontFeatureSettings: '"tnum" on, "lnum" on !important',
        },
        'text': {
          fontFamily: theme('fontFamily.raleway'),
          fontWeight: '500', // medium
          lineHeight: '150%',
          fontFeatureSettings: '"pnum" on, "lnum" on',
        },
      };

      // Define size variants for each category
      const sizeVariants = {
        'heading-large': {
          'xxxs': '10px',
          'xxs': '12px',
          'xs': '14px',
          'sm': '16px',
          'md': '20px',
          'lg': '30px',
          'xl': '36px',
          '2xl': '48px',
          '3xl': '60px',
          '4xl': '72px',
          '5xl': '80px',
          '6xl': '92px',
        },
        'heading-small': {
          'xxxs': '10px',
          'xxs': '12px',
          'xs': '14px',
          'sm': '16px',
          'md': '20px',
          'lg': '24px',
          'xl': '30px',
          '2xl': '36px',
          '3xl': '48px',
          '4xl': '60px',
          '5xl': '72px',
          '6xl': '80px',
        },
        'heading-caps': {
          'xxxs': '10px',
          'xxs': '12px',
          'xs': '14px',
          'sm': '16px',
          'md': '20px',
          'lg': '24px',
          'xl': '30px',
          '2xl': '36px',
          '3xl': '48px',
          '4xl': '60px',
          '5xl': '72px',
          '6xl': '80px',
        },
        'numbers': {
          'xxxs': '9px',
          'xxs': '10px',
          'xs': '12px',
          'sm': '14px',
          'md': '16px',
          'lg': '18px',
          'xl': '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
          '5xl': '48px',
          '6xl': '60px',
        },
        'text': {
          'xxxs': '9px',
          'xxs': '10px',
          'xs': '12px',
          'sm': '14px',
          'md': '16px',
          'lg': '18px',
          'xl': '20px',
          '2xl': '24px',
          '3xl': '30px',
          '4xl': '36px',
          '5xl': '48px',
          '6xl': '60px',
        },
      };

      const newUtilities = {};

      // Iterate over each category to generate utilities
      Object.keys(baseStyles).forEach(category => {
        // Base class (e.g., .heading-large)
        newUtilities[`.${category}`] = baseStyles[category];

        // Size variants (e.g., .heading-large-xxxs)
        Object.entries(sizeVariants[category]).forEach(([size, fontSize]) => {
          newUtilities[`.${category}-${size}`] = {
            ...baseStyles[category],
            fontSize: fontSize,
          };
        });
      });

      // Add the generated utilities to Tailwind
      addUtilities(newUtilities, ['responsive']);
    },
  ],
};



