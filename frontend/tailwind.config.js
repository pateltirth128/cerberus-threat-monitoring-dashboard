module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:            'rgb(var(--bg) / <alpha-value>)',
        surface:       'rgb(var(--surface) / <alpha-value>)',
        'surface-2':   'rgb(var(--surface-2) / <alpha-value>)',
        line:          'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink:           'rgb(var(--ink) / <alpha-value>)',
        muted:         'rgb(var(--muted) / <alpha-value>)',
        faint:         'rgb(var(--faint) / <alpha-value>)',
        accent:        'rgb(var(--accent) / <alpha-value>)',
        ok:            'rgb(var(--ok) / <alpha-value>)',
        bad:           'rgb(var(--bad) / <alpha-value>)',
        warn:          'rgb(var(--warn) / <alpha-value>)',
        info:          'rgb(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.35), 0 10px 30px -18px rgba(0,0,0,0.6)',
        lift: '0 8px 30px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 10px 40px -14px rgb(var(--accent) / 0.30)',
      },
      transitionTimingFunction: {
        signal: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
