/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zenblue: "#b3cde0",
        zengreen: "#ccebc5",
        zenpeach: "#fbb4ae",
      },
    },
  },
  plugins: [],
};
