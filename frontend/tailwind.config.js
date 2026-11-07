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
        fintech: {
          blue: '#0052FF',
          dark: '#0A0E17',
          cardDark: '#121826',
          cardLight: '#FFFFFF',
          borderDark: '#1F293D',
          borderLight: '#E2E8F0',
          accent: '#10B981',
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

