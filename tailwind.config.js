/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Claude Brand Palette – reads from CSS variables so dark mode works automatically
        claude: {
          bg:              'var(--claude-bg)',
          surface:         'var(--claude-surface)',
          'surface-2':     'var(--claude-surface-2)',
          border:          'var(--claude-border)',
          'border-strong': 'var(--claude-border-strong)',
          text:            'var(--claude-text)',
          'text-2':        'var(--claude-text-2)',
          'text-3':        'var(--claude-text-3)',
          accent:          'var(--claude-accent)',
          'accent-2':      'var(--claude-accent-2)',
          'accent-light':  'var(--claude-accent-light)',
          'accent-lighter':'var(--claude-accent-lighter, #fffbeb)',
          sidebar:         'var(--claude-sidebar)',
          'sidebar-hover': 'var(--claude-sidebar-hover)',
          'sidebar-active':'var(--claude-sidebar-active)',
          error:           'var(--claude-error, #dc2626)',
          'error-light':   'var(--claude-error-light, #fef2f2)',
          success:         'var(--claude-success, #16a34a)',
          'success-light': 'var(--claude-success-light, #f0fdf4)',
          warning:         'var(--claude-warning, #d97706)',
          'warning-light': 'var(--claude-warning-light, #fffbeb)',
          info:            'var(--claude-info, #2563eb)',
          'info-light':    'var(--claude-info-light, #eff6ff)',
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
