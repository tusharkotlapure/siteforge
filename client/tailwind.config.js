/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Instrument Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          50: 'rgba(255,255,255,0.07)',
          100: 'rgba(255,255,255,0.05)',
          200: 'rgba(255,255,255,0.04)',
          300: 'rgba(255,255,255,0.03)',
        }
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow':  'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 12px rgba(79,70,229,0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(79,70,229,0.6)' },
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(79,70,229,0.25)',
        'glow':    '0 0 24px rgba(79,70,229,0.35)',
        'glow-lg': '0 0 48px rgba(79,70,229,0.45)',
      }
    }
  },
  plugins: [],
}
