import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#3498db", // Bright blue
          dark: "#FF8E53",
        },
        secondary: {
          light: "#2ecc71", // Emerald green
          dark: "#45B7A0",
        },
        accent: {
          light: "#e74c3c", // Bright red
          dark: "#FFB400",
        },
        background: {
          light: "#d3d3d3", // Soft off-white
          dark: "#1A202C",
        },
        text: {
          light: "#34495e", // Dark blue-gray
          dark: "#E2E8F0",
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;