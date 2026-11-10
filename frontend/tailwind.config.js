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
        mono: {
          main: '#080808',
          pure: '#000000',
          white: '#FFFFFF',
          offwhite: '#F7F7F7',
          light: '#EEEEEE',
          border: '#DEDEDE',
          secondary: '#999999',
          muted: '#666666',
          textWhite: '#FFFFFF',
          textDark: '#111111',
        },
        atlas: {
          navy: '#080808',
          teal: '#000000',
          mint: '#EEEEEE',
          amber: '#666666',
          bg: '#F7F7F7',
          white: '#FFFFFF',
          cardDark: '#080808',
          cardLight: '#FFFFFF',
          borderDark: '#262626',
          borderLight: '#DEDEDE'
        },
        fintech: {
          blue: '#080808',
          dark: '#080808',
          cardDark: '#080808',
          cardLight: '#FFFFFF',
          borderDark: '#262626',
          borderLight: '#DEDEDE',
          accent: '#000000',
          gold: '#666666',
          purple: '#080808'
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        workbench: ['Workbench', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
