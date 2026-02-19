/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["index.html", "src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: 'Poppins, sans-serif',
      },
    },
  },
  plugins: [],
}

