/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        graph: {
          concept: '#10b981',
          entity: '#f59e0b',
          relationship: '#8b5cf6',
          document: '#06b6d4',
          page: '#84cc16',
        }
      }
    },
  },
  plugins: [],
}