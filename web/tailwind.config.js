/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aqi: {
          good: "#2E9E4F",
          satisfactory: "#7BC043",
          moderate: "#F2C230",
          poor: "#F28C28",
          veryPoor: "#E0443E",
          severe: "#8E1B3A",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "Noto Sans Devanagari", "sans-serif"],
      },
    },
  },
  plugins: [],
};
