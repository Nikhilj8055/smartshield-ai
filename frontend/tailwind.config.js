/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6', // Apple warm off-white
        surface: '#FFFFFF',
        foreground: '#1D1D1F', // Apple charcoal
        muted: '#86868B',      // Apple neutral gray
        border: '#E5E5EA',     // Apple subtle border
        accent: {
          DEFAULT: '#0071E3',  // Apple signature blue
          hover: '#0077ED',
          subtle: '#E8F2FF',
        },
        risk: {
          low: '#34C759',      // Apple system green
          medium: '#FF9500',   // Apple system orange
          high: '#FF3B30',     // Apple system red
          critical: '#AF52DE', // Purple / high alert
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'premium': '0 8px 30px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'apple': '16px',
        'apple-sm': '10px',
      }
    },
  },
  plugins: [],
}
