/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      transitionProperty: {
        height: "height",
        width: "width",
      },
      colors: {
        forest: {
          DEFAULT: "#273130",
          50: "#D5DEDD",
          100: "#CAD5D4",
          200: "#B3C3C1",
          300: "#9CB0AE",
          400: "#869E9C",
          500: "#6F8C89",
          600: "#5D7573",
          700: "#4B5E5D",
          800: "#394846",
          850: "#2E3C3A",
          900: "#273130",
        },
        pie: {
          DEFAULT: "#D9A265",
          50: "#FDFBF8",
          100: "#F9F1E8",
          200: "#F1DDC7",
          300: "#E9CAA6",
          400: "#E1B686",
          500: "#D9A265",
          600: "#CE8738",
          700: "#A56A29",
          800: "#784D1E",
          900: "#4B3013",
        },
      },
    },
  },
  plugins: [],
};
