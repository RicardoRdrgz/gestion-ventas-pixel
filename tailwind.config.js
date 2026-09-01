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
          dark: '#202124',
          surface: '#f8f9fa',
          border: '#dadce0',
        }
      }
    },
  },
  plugins: [],
}
