/**
 * Tailwind Preset Generated from Figma
 * Generated on: 2025-05-29T15:14:27.400Z
 * Command to generate: `npx tsx lib/figma-styles/figma.ts`
 * 
 * Usage in tailwind.config.js
 */
const plugin = require('tailwindcss/plugin');

export const figmaStyles = {
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        "fira-sans": [
          "Fira Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        raleway: [
          "Raleway",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      fontSize: {
        "heading-caps-2xl": [
          "36px",
          {
            lineHeight: "43.20000076293945px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-3xl": [
          "48px",
          {
            lineHeight: "48px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-4xl": [
          "60px",
          {
            lineHeight: "60px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-5xl": [
          "72px",
          {
            lineHeight: "72px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-6xl": [
          "80px",
          {
            lineHeight: "80px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-lg": [
          "24px",
          {
            lineHeight: "31.920001983642578px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-md": [
          "20px",
          {
            lineHeight: "24px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-sm": [
          "16px",
          {
            lineHeight: "19.200000762939453px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-xl": [
          "30px",
          {
            lineHeight: "39.900001525878906px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-xs": [
          "14px",
          {
            lineHeight: "16.80000114440918px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-xxs": [
          "12px",
          {
            lineHeight: "14.40000057220459px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-caps-xxxs": [
          "10px",
          {
            lineHeight: "12px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-2xl": [
          "48px",
          {
            lineHeight: "48px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-3xl": [
          "60px",
          {
            lineHeight: "60px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-4xl": [
          "72px",
          {
            lineHeight: "72px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-5xl": [
          "80px",
          {
            lineHeight: "80px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-6xl": [
          "92px",
          {
            lineHeight: "92px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-lg": [
          "30px",
          {
            lineHeight: "36px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-md": [
          "20px",
          {
            lineHeight: "24px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-sm": [
          "16px",
          {
            lineHeight: "19.200000762939453px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-xl": [
          "36px",
          {
            lineHeight: "43.20000076293945px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-xs": [
          "14px",
          {
            lineHeight: "16.80000114440918px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-xxs": [
          "12px",
          {
            lineHeight: "14.088000297546387px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-large-xxxs": [
          "10px",
          {
            lineHeight: "11.739999771118164px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-2xl": [
          "36px",
          {
            lineHeight: "43.20000076293945px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-3xl": [
          "48px",
          {
            lineHeight: "48px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-4xl": [
          "60px",
          {
            lineHeight: "60px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-5xl": [
          "72px",
          {
            lineHeight: "72px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-6xl": [
          "80px",
          {
            lineHeight: "80px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-lg": [
          "24px",
          {
            lineHeight: "31.920001983642578px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-md": [
          "20px",
          {
            lineHeight: "24px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-sm": [
          "16px",
          {
            lineHeight: "19.200000762939453px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-xl": [
          "30px",
          {
            lineHeight: "39.900001525878906px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-xs": [
          "14px",
          {
            lineHeight: "16.80000114440918px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-xxs": [
          "12px",
          {
            lineHeight: "14.40000057220459px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "heading-small-xxxs": [
          "10px",
          {
            lineHeight: "12px",
            letterSpacing: "0em",
            fontWeight: "700"
          }
        ],
        "numbers-2xl": [
          "24px",
          {
            lineHeight: "24px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-3xl": [
          "30px",
          {
            lineHeight: "30px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-4xl": [
          "36px",
          {
            lineHeight: "36px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-5xl": [
          "48px",
          {
            lineHeight: "48px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-6xl": [
          "60px",
          {
            lineHeight: "60px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-lg": [
          "18px",
          {
            lineHeight: "18px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-md": [
          "16px",
          {
            lineHeight: "16px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-sm": [
          "14px",
          {
            lineHeight: "14px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-xl": [
          "20px",
          {
            lineHeight: "20px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-xs": [
          "12px",
          {
            lineHeight: "12px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-xxs": [
          "10px",
          {
            lineHeight: "10px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "numbers-xxxs": [
          "9px",
          {
            lineHeight: "9px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-2xl": [
          "24px",
          {
            lineHeight: "36px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-3xl": [
          "30px",
          {
            lineHeight: "36px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-4xl": [
          "36px",
          {
            lineHeight: "54px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-5xl": [
          "48px",
          {
            lineHeight: "72px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-6xl": [
          "60px",
          {
            lineHeight: "90px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-lg": [
          "18px",
          {
            lineHeight: "27px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-md": [
          "16px",
          {
            lineHeight: "24px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-sm": [
          "14px",
          {
            lineHeight: "21px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-xl": [
          "20px",
          {
            lineHeight: "30px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-xs": [
          "12px",
          {
            lineHeight: "18px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-xxs": [
          "10px",
          {
            lineHeight: "15px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ],
        "text-xxxs": [
          "9px",
          {
            lineHeight: "13.5px",
            letterSpacing: "0em",
            fontWeight: "500"
          }
        ]
      },
      spacing: {},
    }
  },
  plugins: [
    plugin(
      function ({ addUtilities, theme }) {
        const typeStylesData = [
          {
            "name": "heading-caps-2xl",
            "fontFamily": "Raleway",
            "fontSize": "36px",
            "lineHeight": "43.20000076293945px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-3xl",
            "fontFamily": "Raleway",
            "fontSize": "48px",
            "lineHeight": "48px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-4xl",
            "fontFamily": "Raleway",
            "fontSize": "60px",
            "lineHeight": "60px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-5xl",
            "fontFamily": "Raleway",
            "fontSize": "72px",
            "lineHeight": "72px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-6xl",
            "fontFamily": "Raleway",
            "fontSize": "80px",
            "lineHeight": "80px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-lg",
            "fontFamily": "Raleway",
            "fontSize": "24px",
            "lineHeight": "31.920001983642578px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-md",
            "fontFamily": "Raleway",
            "fontSize": "20px",
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-sm",
            "fontFamily": "Raleway",
            "fontSize": "16px",
            "lineHeight": "19.200000762939453px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-xl",
            "fontFamily": "Raleway",
            "fontSize": "30px",
            "lineHeight": "39.900001525878906px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-xs",
            "fontFamily": "Raleway",
            "fontSize": "14px",
            "lineHeight": "16.80000114440918px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-xxs",
            "fontFamily": "Raleway",
            "fontSize": "12px",
            "lineHeight": "14.40000057220459px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-caps-xxxs",
            "fontFamily": "Raleway",
            "fontSize": "10px",
            "lineHeight": "12px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-2xl",
            "fontFamily": "Raleway",
            "fontSize": "48px",
            "lineHeight": "48px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-3xl",
            "fontFamily": "Raleway",
            "fontSize": "60px",
            "lineHeight": "60px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-4xl",
            "fontFamily": "Raleway",
            "fontSize": "72px",
            "lineHeight": "72px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-5xl",
            "fontFamily": "Raleway",
            "fontSize": "80px",
            "lineHeight": "80px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-6xl",
            "fontFamily": "Raleway",
            "fontSize": "92px",
            "lineHeight": "92px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-lg",
            "fontFamily": "Raleway",
            "fontSize": "30px",
            "lineHeight": "36px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-md",
            "fontFamily": "Raleway",
            "fontSize": "20px",
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-sm",
            "fontFamily": "Raleway",
            "fontSize": "16px",
            "lineHeight": "19.200000762939453px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-xl",
            "fontFamily": "Raleway",
            "fontSize": "36px",
            "lineHeight": "43.20000076293945px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-xs",
            "fontFamily": "Raleway",
            "fontSize": "14px",
            "lineHeight": "16.80000114440918px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-xxs",
            "fontFamily": "Raleway",
            "fontSize": "12px",
            "lineHeight": "14.088000297546387px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-large-xxxs",
            "fontFamily": "Raleway",
            "fontSize": "10px",
            "lineHeight": "11.739999771118164px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-2xl",
            "fontFamily": "Raleway",
            "fontSize": "36px",
            "lineHeight": "43.20000076293945px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-3xl",
            "fontFamily": "Raleway",
            "fontSize": "48px",
            "lineHeight": "48px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-4xl",
            "fontFamily": "Raleway",
            "fontSize": "60px",
            "lineHeight": "60px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-5xl",
            "fontFamily": "Raleway",
            "fontSize": "72px",
            "lineHeight": "72px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-6xl",
            "fontFamily": "Raleway",
            "fontSize": "80px",
            "lineHeight": "80px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-lg",
            "fontFamily": "Raleway",
            "fontSize": "24px",
            "lineHeight": "31.920001983642578px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-md",
            "fontFamily": "Raleway",
            "fontSize": "20px",
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-sm",
            "fontFamily": "Raleway",
            "fontSize": "16px",
            "lineHeight": "19.200000762939453px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-xl",
            "fontFamily": "Raleway",
            "fontSize": "30px",
            "lineHeight": "39.900001525878906px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-xs",
            "fontFamily": "Raleway",
            "fontSize": "14px",
            "lineHeight": "16.80000114440918px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-xxs",
            "fontFamily": "Raleway",
            "fontSize": "12px",
            "lineHeight": "14.40000057220459px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "heading-small-xxxs",
            "fontFamily": "Raleway",
            "fontSize": "10px",
            "lineHeight": "12px",
            "letterSpacing": "0em",
            "fontWeight": 700
          },
          {
            "name": "numbers-2xl",
            "fontFamily": "Fira Sans",
            "fontSize": "24px",
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-3xl",
            "fontFamily": "Fira Sans",
            "fontSize": "30px",
            "lineHeight": "30px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-4xl",
            "fontFamily": "Fira Sans",
            "fontSize": "36px",
            "lineHeight": "36px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-5xl",
            "fontFamily": "Fira Sans",
            "fontSize": "48px",
            "lineHeight": "48px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-6xl",
            "fontFamily": "Fira Sans",
            "fontSize": "60px",
            "lineHeight": "60px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-lg",
            "fontFamily": "Fira Sans",
            "fontSize": "18px",
            "lineHeight": "18px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-md",
            "fontFamily": "Fira Sans",
            "fontSize": "16px",
            "lineHeight": "16px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-sm",
            "fontFamily": "Fira Sans",
            "fontSize": "14px",
            "lineHeight": "14px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-xl",
            "fontFamily": "Fira Sans",
            "fontSize": "20px",
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-xs",
            "fontFamily": "Fira Sans",
            "fontSize": "12px",
            "lineHeight": "12px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-xxs",
            "fontFamily": "Fira Sans",
            "fontSize": "10px",
            "lineHeight": "10px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "numbers-xxxs",
            "fontFamily": "Fira Sans",
            "fontSize": "9px",
            "lineHeight": "9px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-2xl",
            "fontFamily": "Raleway",
            "fontSize": "24px",
            "lineHeight": "36px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-3xl",
            "fontFamily": "Raleway",
            "fontSize": "30px",
            "lineHeight": "36px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-4xl",
            "fontFamily": "Raleway",
            "fontSize": "36px",
            "lineHeight": "54px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-5xl",
            "fontFamily": "Raleway",
            "fontSize": "48px",
            "lineHeight": "72px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-6xl",
            "fontFamily": "Raleway",
            "fontSize": "60px",
            "lineHeight": "90px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-lg",
            "fontFamily": "Raleway",
            "fontSize": "18px",
            "lineHeight": "27px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-md",
            "fontFamily": "Raleway",
            "fontSize": "16px",
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-sm",
            "fontFamily": "Raleway",
            "fontSize": "14px",
            "lineHeight": "21px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-xl",
            "fontFamily": "Raleway",
            "fontSize": "20px",
            "lineHeight": "30px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-xs",
            "fontFamily": "Raleway",
            "fontSize": "12px",
            "lineHeight": "18px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-xxs",
            "fontFamily": "Raleway",
            "fontSize": "10px",
            "lineHeight": "15px",
            "letterSpacing": "0em",
            "fontWeight": 500
          },
          {
            "name": "text-xxxs",
            "fontFamily": "Raleway",
            "fontSize": "9px",
            "lineHeight": "13.5px",
            "letterSpacing": "0em",
            "fontWeight": 500
          }
        ];
        const fontsData = [
          {
            "name": "fira-sans",
            "fontFamily": "Fira Sans"
          },
          {
            "name": "raleway",
            "fontFamily": "Raleway"
          }
        ];

        const utilities = {};
        typeStylesData.forEach(style => {
          const fontInfo = fontsData.find(f => f.fontFamily === style.fontFamily);

          // The key for theme('fontFamily') is the slugified name (fontInfo.name)
          const fontFamilyThemeKey = fontInfo ? fontInfo.name : null;

          if (!fontFamilyThemeKey) {
            console.warn(`[Figma Plugin Gen] Could not find font theme key for style: ${style.name} (font family: ${style.fontFamily}). Skipping this utility.`);
            return;
          }

          // Ensure the font family exists in the theme
          const themeFontFamily = theme('fontFamily');
          if (!themeFontFamily || !themeFontFamily[fontFamilyThemeKey]) {
            console.warn(`[Figma Plugin Gen] Font family key "${fontFamilyThemeKey}" not found in Tailwind theme for style: ${style.name}. Skipping this utility.`);
            return;
          }

          const utilityClass = `.${style.name}`; // e.g., .type-heading-large-xs

          const styleProperties = {
            fontFamily: themeFontFamily[fontFamilyThemeKey][0],
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
    )
  ]
};
