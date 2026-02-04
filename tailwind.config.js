/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pnhs: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          dark: '#1e3a8a',
          light: '#dbeafe',
        },
      },
    },
  },
  plugins: [],
}
