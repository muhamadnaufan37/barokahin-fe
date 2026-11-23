/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6e9f8",
          100: "#d8def4",
          200: "#b8c2ec",
          500: "#4354a4",
          600: "#1f2c7a",
          700: "#141c52",
          800: "#101744",
        },
        urgent: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
