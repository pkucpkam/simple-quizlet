/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Claude Brand Palette
        claude: {
          bg:        '#f5f4ef',       // cream page background
          surface:   '#ffffff',       // card/surface
          'surface-2': '#f9f8f4',    // subtle secondary surface
          border:    '#e8e7e2',       // default border
          'border-strong': '#d1d0cc', // stronger border
          text:      '#1a1917',       // primary text
          'text-2':  '#6b6964',       // secondary text
          'text-3':  '#9b9894',       // tertiary / placeholder
          accent:    '#d97706',       // amber accent (Claude brand)
          'accent-2': '#b45309',      // darker amber for hover
          'accent-light': '#fef3c7', // amber tint for badges/bg
          'accent-lighter': '#fffbeb', // very light amber
          sidebar:   '#f0efe9',       // sidebar background
          'sidebar-hover': '#e8e7e1', // sidebar item hover
          'sidebar-active': '#e2e0d8', // sidebar item active
          error:     '#dc2626',
          'error-light': '#fef2f2',
          success:   '#16a34a',
          'success-light': '#f0fdf4',
          warning:   '#d97706',
          'warning-light': '#fffbeb',
          info:      '#2563eb',
          'info-light': '#eff6ff',
        },
      },
      borderRadius: {
        'claude': '0.5rem',
        'claude-md': '0.75rem',
        'claude-lg': '1rem',
        'claude-xl': '1.5rem',
      },
      boxShadow: {
        'claude-sm': '0 1px 3px 0 rgba(26,25,23,0.06), 0 1px 2px -1px rgba(26,25,23,0.06)',
        'claude': '0 2px 8px 0 rgba(26,25,23,0.08), 0 1px 3px -1px rgba(26,25,23,0.06)',
        'claude-md': '0 4px 16px 0 rgba(26,25,23,0.1), 0 2px 6px -2px rgba(26,25,23,0.06)',
        'claude-lg': '0 8px 32px 0 rgba(26,25,23,0.12), 0 4px 12px -4px rgba(26,25,23,0.08)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'modal-in': 'modal-in 0.2s ease-out',
      },
      transitionTimingFunction: {
        'claude': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
