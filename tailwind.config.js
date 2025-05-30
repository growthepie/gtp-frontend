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
        // "fira-sans": ["var(--font-fira-sans)", "sans-serif"],
        // ...figmaStyles.theme.extend.fontFamily,
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
        black: {
          DEFAULT: "#000000"
        },
        blackalpha: {
          "50": "#0000000a",
          "100": "#0000000f",
          "200": "#00000014",
          "300": "#00000029",
          "400": "#0000003d",
          "500": "#0000005c",
          "600": "#0000007a",
          "700": "#000000a3",
          "800": "#000000cc",
          "900": "#000000eb"
        },
        "dark-active-black": {
          DEFAULT: "#151a19"
        },
        "dark-active-text": {
          DEFAULT: "#cdd8d3"
        },
        "dark-arbitrum-blue": {
          DEFAULT: "#1df7ef"
        },
        "dark-b3": {
          DEFAULT: "#3368ef"
        },
        "dark-background": {
          DEFAULT: "#1f2726"
        },
        "dark-base-blue": {
          DEFAULT: "#2151f5"
        },
        "dark-blast-yellow": {
          DEFAULT: "#e9e238"
        },
        "dark-blue": {
          DEFAULT: "#1df7ef"
        },
        "dark-celestia": {
          DEFAULT: "#8e44ed"
        },
        "dark-celo-yellow": {
          DEFAULT: "#fcff52"
        },
        "dark-dark-red": {
          DEFAULT: "#d03434"
        },
        "dark-derive": {
          DEFAULT: "#fa8836"
        },
        "dark-eclipse-green": {
          DEFAULT: "#a1fea0"
        },
        "dark-ethereum-blobs": {
          DEFAULT: "#ffc300"
        },
        "dark-ethereum-calldata": {
          DEFAULT: "#00b3b3"
        },
        "dark-ethereum-gray": {
          DEFAULT: "#94abd3"
        },
        "dark-fraxtal": {
          DEFAULT: "#1864ab"
        },
        "dark-gravity": {
          DEFAULT: "#ffac43"
        },
        "dark-green-faint": {
          DEFAULT: "#eeff97"
        },
        "dark-green-neon": {
          DEFAULT: "#4cff7e"
        },
        "dark-hover": {
          DEFAULT: "#5a6462"
        },
        "dark-imx-green": {
          DEFAULT: "#3afcc9"
        },
        "dark-ink-purple": {
          DEFAULT: "#7132f5"
        },
        "dark-linea-blue": {
          DEFAULT: "#a9e9ff"
        },
        "dark-lisk": {
          DEFAULT: "#613fff"
        },
        "dark-loopring": {
          DEFAULT: "#4f5edf"
        },
        "dark-manta-pink": {
          DEFAULT: "#fb4ff2"
        },
        "dark-mantle-blue": {
          DEFAULT: "#10808c"
        },
        "dark-medium-background": {
          "30": "#3442404d",
          DEFAULT: "#344240"
        },
        "dark-metis-blue": {
          DEFAULT: "#00d2ff"
        },
        "dark-metric-colour": {
          "1": "#436964",
          "2": "#06a390"
        },
        "dark-mint-green": {
          DEFAULT: "#30bf54"
        },
        "dark-mode-green": {
          DEFAULT: "#c4df00"
        },
        "dark-neon-red": {
          DEFAULT: "#ff3838"
        },
        "dark-nova": {
          DEFAULT: "#ef6627"
        },
        "dark-optimism-red": {
          DEFAULT: "#fe5468"
        },
        "dark-orange": {
          DEFAULT: "#f0995a"
        },
        "dark-orderly": {
          DEFAULT: "#7d79e6"
        },
        "dark-other-chain": {
          "1": "#7d8887",
          "2": "#717d7c",
          "3": "#667170",
          "4": "#5a6665",
          "5": "#4f5b5a",
          "6": "#43504f",
          "7": "#384443",
          "8": "#2c3938"
        },
        "dark-petrol": {
          DEFAULT: "#10808c"
        },
        "dark-pgn-green": {
          DEFAULT: "#d7fd7b"
        },
        "dark-pink": {
          DEFAULT: "#fb4ff3"
        },
        "dark-polygon-purple": {
          DEFAULT: "#ad0dc5"
        },
        "dark-purple": {
          DEFAULT: "#ad0dc5"
        },
        "dark-real": {
          DEFAULT: "#d9ddf0"
        },
        "dark-red": {
          DEFAULT: "#fe5468"
        },
        "dark-restone-red": {
          DEFAULT: "#ff6061"
        },
        "dark-rhino-orange": {
          DEFAULT: "#ecb16b"
        },
        "dark-scroll-yellow": {
          DEFAULT: "#ffdf27"
        },
        "dark-soneium": {
          DEFAULT: "#d7e2dc"
        },
        "dark-starknet-orange": {
          DEFAULT: "#ec796b"
        },
        "dark-swell-blue": {
          DEFAULT: "#2956de"
        },
        "dark-taiko-pink": {
          DEFAULT: "#e81899"
        },
        "dark-teal": {
          DEFAULT: "#3afcc9"
        },
        "dark-unichain": {
          DEFAULT: "#ff47bb"
        },
        "dark-world-chain": {
          DEFAULT: "#d9d0c1"
        },
        "dark-yellow-saturated": {
          DEFAULT: "#ffdf27"
        },
        "dark-zircuit": {
          DEFAULT: "#01b98c"
        },
        "dark-zksync-purpleblue": {
          DEFAULT: "#2e3ec7"
        },
        "dark-zora-blue": {
          DEFAULT: "#2fb9f4"
        },
        "glo-dollar-blue": {
          DEFAULT: "#24e5df"
        },
        "gtp-orange-dark": {
          DEFAULT: "#fe5468"
        },
        "gtp-orange-light-yellow": {
          DEFAULT: "#ffdf27"
        },
        "gtp-turquoise-dark": {
          DEFAULT: "#10808c"
        },
        "gtp-turquoise-light": {
          DEFAULT: "#1df7ef"
        },
        "light-arbitrum-blue": {
          DEFAULT: "#2ecee8"
        },
        "light-background": {
          DEFAULT: "#eaeceb"
        },
        "light-base-blue": {
          DEFAULT: "#2151f5"
        },
        "light-blast-yellow": {
          DEFAULT: "#e9e238"
        },
        "light-blue": {
          DEFAULT: "#2ecee8"
        },
        "light-ethereum-gray": {
          DEFAULT: "#8b8b8b"
        },
        "light-green": {
          DEFAULT: "#45aa6f"
        },
        "light-hover": {
          DEFAULT: "#f0f5f3"
        },
        "light-imx-green": {
          DEFAULT: "#3ecda7"
        },
        "light-linea-blue": {
          DEFAULT: "#9ce5ff"
        },
        "light-loopring-blue": {
          DEFAULT: "#4f5edf"
        },
        "light-manta-pink": {
          DEFAULT: "#fb4ff2"
        },
        "light-metis-blue": {
          DEFAULT: "#00d2ff"
        },
        "light-mode-green": {
          DEFAULT: "#c4df00"
        },
        "light-optimism-red": {
          DEFAULT: "#dd3408"
        },
        "light-orderly": {
          DEFAULT: "#5d00ba"
        },
        "light-petrol": {
          DEFAULT: "#08373c"
        },
        "light-pgn-green": {
          DEFAULT: "#b9ee75"
        },
        "light-pink": {
          DEFAULT: "#f130de"
        },
        "light-polygon-purple": {
          DEFAULT: "#800094"
        },
        "light-purple": {
          DEFAULT: "#800094"
        },
        "light-red": {
          DEFAULT: "#dd3408"
        },
        "light-redstone-red": {
          DEFAULT: "#ff6061"
        },
        "light-rhino-orange": {
          DEFAULT: "#ecb16b"
        },
        "light-scroll-yellow": {
          DEFAULT: "#ffdf27"
        },
        "light-starknet-orange": {
          DEFAULT: "#ec796b"
        },
        "light-teal": {
          DEFAULT: "#3ecda7"
        },
        "light-yellow-saturated": {
          DEFAULT: "#fbb90d"
        },
        "light-zksync-purple": {
          DEFAULT: "#390094"
        },
        "light-zora-blue": {
          DEFAULT: "#2fb9f4"
        },
        white: {
          DEFAULT: "#ffffff"
        },
        whitealpha: {
          "50": "#ffffff0a",
          "100": "#ffffff0f",
          "200": "#ffffff14",
          "300": "#ffffff29",
          "400": "#ffffff3d",
          "500": "#ffffff5c",
          "600": "#ffffff7a",
          "700": "#ffffffa3",
          "800": "#ffffffcc",
          "900": "#ffffffeb"
        }
      },
      backgroundImage: {
        "dark-ethereum-gradient": "linear-gradient(-90deg, #94abd3 0.00%,#596780 100.00%)",
        "gradient-dark-red": "linear-gradient(90deg, #fe5468 0.00%,#98323e 100.00%)",
        "gradient-dark-yellow": "linear-gradient(-90deg, #ffe761 0.00%,#c7ae24 100.00%)",
        "gradient-green": "linear-gradient(-90deg, #eeff97 0.00%,#a1b926 100.00%)",
        "gradient-light-red": "linear-gradient(90deg, #fe5468 0.00%,#d41027 100.00%)",
        "gradient-red-yellow": "linear-gradient(81deg, #fe5468 0.00%,#ffdf27 100.00%)",
        "gradient-red-yellow-radial": "linear-gradient(90deg, #fe5468 0.00%,#ffdf27 100.00%)",
        "gradient-turquoise-blue": "linear-gradient(90deg, #10808c 0.00%,#1df7ef 100.00%)",
        "gradient-yellow-green": "linear-gradient(90deg, #ffdf27 0.00%,#eeff97 100.00%)",
        "oli-gradient": "linear-gradient(-46deg, #5c44c2 0.00%,#69adda 49.94%,#ff1684 94.50%)",
        "open-labels-initiative": "linear-gradient(-46deg, #5c44c2 0.00%,#69adda 49.94%,#ff1684 94.50%)"
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
        'global-search-tooltip': '8500',
        'global-search': '8000',
        'global-search-backdrop': '7000',
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
    // ...figmaStyles.plugins,
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



