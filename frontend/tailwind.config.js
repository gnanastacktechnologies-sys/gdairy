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
          DEFAULT: '#4F46E5', // Indigo-600
          dark: '#4338CA',    // Indigo-700
          light: '#EEF2FF'   // Indigo-50
        },
        surface: {
          bg: '#F3F4F6',      // Gray-100 background
          card: '#FFFFFF',    // White card background
          header: '#EEF2FF'   // Table Header
        },
        text: {
          main: '#1E293B',    // Slate-800
          sub: '#64748B'      // Slate-500
        },
        status: {
          success: '#16A34A', // Green-600
          warning: '#F59E0B', // Amber-500
          danger: '#EF4444'   // Red-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
