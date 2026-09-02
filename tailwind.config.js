/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          blueHover: '#1557b0',
          red: '#ea4335',
          yellow: '#fbbc04',
          green: '#34a853',
        },
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        sansserif: ['"Google Sans"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
