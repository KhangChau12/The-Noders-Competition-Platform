import type { Config } from 'tailwindcss'

/**
 * Design tokens for the v1.1 redesign (same house as thenodersptnk.com).
 *
 * Phase colour = meaning, used everywhere:
 *   violet → registration / open contests / NLP
 *   blue   → public test / primary actions inside a team or contest
 *   amber  → private test / invitations / champions / computer vision
 *   teal   → results / success / practice progress / tabular
 *
 * Each hue has: DEFAULT (accent text/fills), bg (dark tinted card ground),
 * strong (tinted card on navy), muted (secondary text on the tint),
 * ink (text on a solid DEFAULT fill).
 *
 * Legacy token names (bg-primary, text-secondary, primary-blue, …) are kept and
 * remapped to the new palette so untouched markup still reads correctly.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Grounds
        'bg-primary': '#0D0F14',
        'bg-surface': '#15181F',
        'bg-elevated': '#1A1D24',
        'bg-raised': '#23272F',

        // Lines
        'border-default': '#23272F',
        'border-subtle': '#343946',
        'border-focus': '#8DB1FF',

        // Text
        'text-primary': '#EEF0F4',
        'text-secondary': '#C9CED8',
        'text-tertiary': '#AAB0BC',
        'text-muted': '#878D99',
        'text-disabled': '#6B7180',

        // Brand navy field (hero bands, footer)
        navy: {
          DEFAULT: '#1F3A6B',
          deep: '#172C52',
          ink: '#2A4B8D',
          text: '#DCE5FF',
          soft: 'rgba(255,255,255,0.07)',
        },

        // Phase hues
        violet: { DEFAULT: '#B79CF0', bg: '#1E1B33', strong: '#2C2858', muted: '#9C95B5', soft: '#D4C6FA', line: '#44407A', ink: '#1A1638' },
        blue: { DEFAULT: '#8DB1FF', bg: '#15213B', strong: '#172C52', muted: '#9FB0CF', soft: '#A9C4FF', line: '#2E4A80', ink: '#0F1B33' },
        amber: { DEFAULT: '#E8A15A', bg: '#2A2015', strong: '#3A2A18', muted: '#B39C82', soft: '#F0C79A', line: '#6B5233', ink: '#2A1A08' },
        teal: { DEFAULT: '#6CC5A8', bg: '#12261F', strong: '#17463A', muted: '#8FB5A6', soft: '#A8DCC7', line: '#2C6B56', ink: '#0E2A20' },

        // Medals
        gold: '#F0C79A',
        silver: '#C9D1DC',
        bronze: '#C9926B',

        // Legacy names → new palette
        'primary-blue': '#8DB1FF',
        'accent-cyan': '#6CC5A8',
        success: '#6CC5A8',
        warning: '#E8A15A',
        error: '#E5806F',
        info: '#8DB1FF',
        'phase-registration': '#B79CF0',
        'phase-public': '#8DB1FF',
        'phase-private': '#E8A15A',
        'phase-ended': '#878D99',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-brand)', 'cursive'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        // Kept so legacy markup compiles; now a flat navy instead of a gradient.
        'gradient-brand': 'linear-gradient(#2A4B8D, #2A4B8D)',
      },
      maxWidth: {
        shell: '1280px',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        // Entrances. All are short and only move a few pixels; reduced-motion users get none.
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'grow-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        sweep: 'sweep 1.4s ease-in-out infinite',
        // "backwards" (not "both") so no transform is left behind once done:
        // a lingering transform would break position:fixed children such as modals.
        'page-in': 'page-in 320ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards',
        'fade-in': 'fade-in 200ms ease-out backwards',
        'fade-up': 'fade-up 260ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards',
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards',
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        slideInRight: 'slide-in-right 260ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards',
        'grow-x': 'grow-x 900ms cubic-bezier(0.2, 0.7, 0.2, 1) 150ms backwards',
      },
      boxShadow: {
        lift: '0 24px 48px rgba(5, 10, 25, 0.3)',
        pop: '0 16px 40px rgba(0, 0, 0, 0.45)',
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
    },
  },
  plugins: [],
}

export default config
