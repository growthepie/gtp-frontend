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
      height: {
        'xs': '15px',
        'sm': '24px',
        'md': '28px',
        'lg': '36px',
        'xl': '44px',
        '2xl': '56px',
        '3xl': '86px',
        '4xl': '148px',
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
        "color-bg-default": "rgb(var(--bg-default) / <alpha-value>)",
        "color-bg-default-0": "rgb(var(--bg-default-0) / <alpha-value>)",
        "color-bg-medium": "rgb(var(--bg-medium) / <alpha-value>)",
        "color-bg-medium-50": "rgb(var(--bg-medium-50) / <alpha-value>)",
        "color-bg-main": "rgb(var(--bg-main) / <alpha-value>)",
        "color-ui-hover": "rgb(var(--ui-hover) / <alpha-value>)",
        "color-ui-active": "rgb(var(--ui-active) / <alpha-value>)",
        "color-ui-shadow": "rgb(var(--ui-shadow) / <alpha-value>)",
        "color-text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "color-text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "color-accent-red": "rgb(var(--accent-red) / <alpha-value>)",
        "color-accent-yellow": "rgb(var(--accent-yellow) / <alpha-value>)",
        "color-accent-petrol": "rgb(var(--accent-petrol) / <alpha-value>)",
        "color-accent-turquoise": "rgb(var(--accent-turquoise) / <alpha-value>)",
        "color-positive": "rgb(var(--positive) / <alpha-value>)",
        "color-negative": "rgb(var(--negative) / <alpha-value>)",
        "chains-arbitrum-nova": "rgb(var(--chains-arbitrum-nova) / <alpha-value>)",
        "chains-arbitrum-one": "rgb(var(--chains-arbitrum-one) / <alpha-value>)",
        "chains-b3": "rgb(var(--chains-b3) / <alpha-value>)",
        "chains-base": "rgb(var(--chains-base) / <alpha-value>)",
        "chains-blast": "rgb(var(--chains-blast) / <alpha-value>)",
        "chains-celestia": "rgb(var(--chains-celestia) / <alpha-value>)",
        "chains-celo": "rgb(var(--chains-celo) / <alpha-value>)",
        "chains-derive": "rgb(var(--chains-derive) / <alpha-value>)",
        "chains-eclipse": "rgb(var(--chains-eclipse) / <alpha-value>)",
        "chains-eigenda": "rgb(var(--chains-eigenda) / <alpha-value>)",
        "chains-ethereum": "rgb(var(--chains-ethereum) / <alpha-value>)",
        "chains-ethereum-blobs": "rgb(var(--chains-ethereum-blobs) / <alpha-value>)",
        "chains-ethereum-calldata": "rgb(var(--chains-ethereum-calldata) / <alpha-value>)",
        "chains-fraxtal": "rgb(var(--chains-fraxtal) / <alpha-value>)",
        "chains-gravity": "rgb(var(--chains-gravity) / <alpha-value>)",
        "chains-imx": "rgb(var(--chains-imx) / <alpha-value>)",
        "chains-ink": "rgb(var(--chains-ink) / <alpha-value>)",
        "chains-linea": "rgb(var(--chains-linea) / <alpha-value>)",
        "chains-lisk": "rgb(var(--chains-lisk) / <alpha-value>)",
        "chains-loopring": "rgb(var(--chains-loopring) / <alpha-value>)",
        "chains-manta": "rgb(var(--chains-manta) / <alpha-value>)",
        "chains-mantle": "rgb(var(--chains-mantle) / <alpha-value>)",
        "chains-metis": "rgb(var(--chains-metis) / <alpha-value>)",
        "chains-mint": "rgb(var(--chains-mint) / <alpha-value>)",
        "chains-mode": "rgb(var(--chains-mode) / <alpha-value>)",
        "chains-op-mainnet": "rgb(var(--chains-op-mainnet) / <alpha-value>)",
        "chains-orderly": "rgb(var(--chains-orderly) / <alpha-value>)",
        "chains-pgn": "rgb(var(--chains-pgn) / <alpha-value>)",
        "chains-plume": "rgb(var(--chains-plume) / <alpha-value>)",
        "chains-polygon-zkevm": "rgb(var(--chains-polygon-zkevm) / <alpha-value>)",
        "chains-real": "rgb(var(--chains-real) / <alpha-value>)",
        "chains-redstone": "rgb(var(--chains-redstone) / <alpha-value>)",
        "chains-megaeth": "rgb(var(--chains-megaeth) / <alpha-value>)",
        "chains-rhino": "rgb(var(--chains-rhino) / <alpha-value>)",
        "chains-scroll": "rgb(var(--chains-scroll) / <alpha-value>)",
        "chains-soneium": "rgb(var(--chains-soneium) / <alpha-value>)",
        "chains-starknet": "rgb(var(--chains-starknet) / <alpha-value>)",
        "chains-swell": "rgb(var(--chains-swell) / <alpha-value>)",
        "chains-taiko": "rgb(var(--chains-taiko) / <alpha-value>)",
        "chains-unichain": "rgb(var(--chains-unichain) / <alpha-value>)",
        "chains-world": "rgb(var(--chains-world) / <alpha-value>)",
        "chains-zircuit": "rgb(var(--chains-zircuit) / <alpha-value>)",
        "chains-zksync-era": "rgb(var(--chains-zksync-era) / <alpha-value>)",
        "chains-zora": "rgb(var(--chains-zora) / <alpha-value>)",
        "chains-unlisted1": "rgb(var(--chains-unlisted1) / <alpha-value>)",
        "chains-unlisted2": "rgb(var(--chains-unlisted2) / <alpha-value>)",
        "chains-unlisted3": "rgb(var(--chains-unlisted3) / <alpha-value>)",
        "chains-unlisted4": "rgb(var(--chains-unlisted4) / <alpha-value>)",
        "chains-unlisted5": "rgb(var(--chains-unlisted5) / <alpha-value>)",
        "chains-unlisted6": "rgb(var(--chains-unlisted6) / <alpha-value>)",
        "chains-unlisted7": "rgb(var(--chains-unlisted7) / <alpha-value>)",
        "chains-unlisted8": "rgb(var(--chains-unlisted8) / <alpha-value>)",
        "chains-custom-warm-1": "rgb(var(--chains-custom-warm-1) / <alpha-value>)",
        "chains-custom-warm-2": "rgb(var(--chains-custom-warm-2) / <alpha-value>)",
        "chains-custom-warm-3": "rgb(var(--chains-custom-warm-3) / <alpha-value>)",
        "chains-custom-warm-4": "rgb(var(--chains-custom-warm-4) / <alpha-value>)",
        "chains-custom-warm-5": "rgb(var(--chains-custom-warm-5) / <alpha-value>)",
        "chains-custom-cool-1": "rgb(var(--chains-custom-cool-1) / <alpha-value>)",
        "chains-custom-cool-2": "rgb(var(--chains-custom-cool-2) / <alpha-value>)",
        "chains-custom-cool-3": "rgb(var(--chains-custom-cool-3) / <alpha-value>)",
        "chains-custom-cool-4": "rgb(var(--chains-custom-cool-4) / <alpha-value>)",
        "chains-custom-cool-5": "rgb(var(--chains-custom-cool-5) / <alpha-value>)"
      },
      backgroundImage: {
        'glow-yellow': 'radial-gradient(50% 50% at 50% 50%, rgb(var(--accent-yellow)) 0%, rgba(217, 217, 217, 0) 100%)',
        'glow-turquoise': 'radial-gradient(50% 50% at 50% 50%, rgb(var(--accent-turquoise)) 0%, rgba(217, 217, 217, 0) 100%)',
        "oli-gradient": "linear-gradient(to right, rgb(92, 68, 194) 0%, rgb(105, 173, 218) 50%, rgb(255, 22, 132) 94%)",
        "gradient-accent-warm": "linear-gradient(to right, rgb(254, 84, 104) 0%, rgb(255, 223, 39) 100%)",
        "gradient-accent-cool": "linear-gradient(to right, rgb(16, 128, 140) 0%, rgb(29, 247, 239) 100%)",
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
        'loading-screen': '9999',
        'context-menu': '9000',
        'global-search-tooltip': '8500',
        'global-search': '8000',
        'global-search-backdrop': '7000',
        'dropdown': '1000',
        'dropdown-background': '999',
        'show-loading': '200',
        'tooltip': '110',
        'sidebar-new-badge': '100',
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
      boxShadow: {
        'card-dark': '0px 0px 27px rgb(var(--ui-shadow))',
        "standard": "0px 0px 27px 0px rgb(var(--ui-shadow))",
        "soft-lg": "0px 0px 50px 0px rgb(var(--ui-shadow))"
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
        'heading': {
          fontFamily: theme("fontFamily.raleway"),
          fontWeight: '600', // bold (adjusted from 700)
          lineHeight: '120%',
        },
        'heading-large': {
          fontFamily: theme("fontFamily.raleway"),
          fontWeight: '600', // bold (adjusted from 700)
          lineHeight: '120%',
        },
        'heading-small': {
          fontFamily: theme('fontFamily.raleway'),
          fontWeight: '600', // bold (adjusted from 700)
          lineHeight: '120%',
        },
        'heading-caps': {
          fontFamily: theme('fontFamily.raleway'),
          fontWeight: '600', // bold
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
        'heading': {
          'xxxs': ["10px", "15px"],
          'xxs': ["12px", "17px"],
          'xs': ["14px", "17px"],
          'sm': ["16px", "19px"],
          'md': ["20px", "24px"],
          'lg': ["24px", "28px"],
          'xl': ["36px", "43px"],
          '2xl': ["48px", "48px"],
          '3xl': ["60px", "60px"],
          '4xl': ["72px", "72px"],
          '5xl': ["80px", "80px"],
          '6xl': ["92px", "92px"],
        },
        'heading-large': {
          'xxxs': ["10px", "15px"],
          'xxs': ["12px", "17px"],
          'xs': ["14px", "17px"],
          'sm': ["16px", "19px"],
          'md': ["20px", "24px"],
          'lg': ["24px", "28px"],
          'xl': ["36px", "43px"],
          '2xl': ["48px", "48px"],
          '3xl': ["60px", "60px"],
          '4xl': ["72px", "72px"],
          '5xl': ["80px", "80px"],
          '6xl': ["92px", "92px"],
        },
        'heading-small': {
          'xxxxxs': '7px',
          'xxxxs': '8px',
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
          'xxxs': ["9px", "9px"],
          'xxs': ["10px", "10px"],
          'xs': ["12px", "12px"],
          'sm': ["14px", "14px"],
          'md': ["16px", "16px"],
          'lg': ["18px", "18px"],
          'xl': ["20px", "20px"],
          '2xl': ["24px", "24px"],
          '3xl': ["30px", "30px"],
          '4xl': ["36px", "36px"],
          '5xl': ["48px", "48px"],
          '6xl': ["60px", "60px"],
        },
        'text': {
          'xxxs': ["9px", "9px"],
          'xxs': ["10px", "15px"],
          'xs': ["12px", "16px"],  // Updated: lineHeight 18px → 16px
          'sm': ["14px", "16px"],
          'md': ["15px", "24px"],  // Updated: fontSize 16px → 15px
          'lg': ["18px", "28px"],  // Updated: lineHeight 27px → 28px
          'xl': ["20px", "30px"],
          '2xl': ["22px", "36px"],
          '3xl': ["30px", "36px"],
          '4xl': ["36px", "54px"],
          '5xl': ["48px", "72px"],
          '6xl': ["60px", "90px"],
        },
      };

      const newUtilities = {};

      // Iterate over each category to generate utilities
      Object.keys(baseStyles).forEach(category => {
        // Size variants (e.g., .heading-large-xxxs)
        if (sizeVariants[category]) {
          Object.entries(sizeVariants[category]).forEach(([size, value]) => {
            if(typeof value === 'string') {
              newUtilities[`.${category}-${size}`] = {
                ...baseStyles[category],
                fontSize: value,
                lineHeight: parseFloat(value) * 1.2 + 'px',
              };
            } else {
              const [fontSize, lineHeight] = value;
              newUtilities[`.${category}-${size}`] = {
                ...baseStyles[category],
                fontSize: fontSize,
                lineHeight: lineHeight,
              };
            }
          });
        }
      });

      // Add the generated utilities to Tailwind
      addUtilities(newUtilities, ['responsive']);
    },
  ],
};



