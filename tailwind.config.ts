import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Identity Colors
        'primary-blue': '#2563EB',
        'accent-cyan': '#06B6D4',

        // Dark Theme Foundation
        'bg-primary': '#0F172A',
        'bg-surface': '#1E293B',
        'bg-elevated': '#334155',

        // Borders
        'border-default': '#334155',
        'border-subtle': '#475569',
        'border-focus': '#2563EB',

        // Text Hierarchy
        'text-primary': '#F8FAFC',
        'text-secondary': '#CBD5E1',
        'text-tertiary': '#94A3B8',
        'text-disabled': '#64748B',

        // Semantic Colors
        'success': '#059669',
        'warning': '#D97706',
        'error': '#DC2626',
        'info': '#2563EB',

        // Competition Phase Colors
        'phase-registration': '#8B5CF6',
        'phase-public': '#2563EB',
        'phase-private': '#06B6D4',
        'phase-ended': '#64748B',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-shrikhand)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
      },
      boxShadow: {
        'glow-blue-sm': '0 0 10px rgba(37, 99, 235, 0.3)',
        'glow-blue-md': '0 0 20px rgba(37, 99, 235, 0.4)',
        'glow-blue-lg': '0 0 30px rgba(37, 99, 235, 0.5)',
        'glow-cyan-sm': '0 0 10px rgba(6, 182, 212, 0.3)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
