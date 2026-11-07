/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atlas: {
          navy: '#111827',
          teal: '#14B8A6',
          mint: '#D1FAE5',
          amber: '#F59E0B',
          bg: '#F8FAFC',
          white: '#FFFFFF',
          cardDark: '#1E293B',
          cardLight: '#FFFFFF',
          borderDark: '#334155',
          borderLight: '#E2E8F0'
        },
        fintech: {
          blue: '#14B8A6', // Accent teal
          dark: '#111827',
          cardDark: '#1E293B',
          cardLight: '#FFFFFF',
          borderDark: '#334155',
          borderLight: '#E2E8F0',
          accent: '#14B8A6',
          gold: '#F59E0B',
          purple: '#6366F1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

