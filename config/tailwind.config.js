/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./public/*.{html,js}"
  ],
  darkMode: 'class', // Use class-based dark mode (matches existing [data-theme="dark"])
  theme: {
    extend: {
      colors: {
        // Map existing CSS variables to Tailwind colors
        primary: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
        },
        secondary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        accent: {
          purple: '#C084FC',
          emerald: '#34D399',
          rose: '#FB7185',
          amber: '#FBBF24',
          cyan: '#67E8F9',
        },
        neutral: {
          25: '#FEFEFE',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '3d-sm': '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
        '3d-md': '0 4px 8px rgba(0, 0, 0, 0.12), 0 12px 24px rgba(0, 0, 0, 0.15), 0 24px 48px rgba(0, 0, 0, 0.1)',
        '3d-lg': '0 8px 16px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.15), 0 32px 64px rgba(0, 0, 0, 0.1)',
        '3d-xl': '0 12px 24px rgba(0, 0, 0, 0.18), 0 24px 48px rgba(0, 0, 0, 0.18), 0 48px 96px rgba(0, 0, 0, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'colored-primary': '0 8px 32px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(99, 102, 241, 0.2)',
        'colored-secondary': '0 8px 32px rgba(6, 182, 212, 0.3), 0 4px 16px rgba(6, 182, 212, 0.2)',
      },
      borderRadius: {
        '3xl': '2rem',
      },
      backdropBlur: {
        '3d': '24px',
      }
    },
  },
  plugins: [],
}
