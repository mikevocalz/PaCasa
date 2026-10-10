/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pa'Casa palette — the same steps the native app's theme uses, so the
        // two surfaces read as one product.
        ink: {
          400: '#90929C',
          500: '#70727F',
          600: '#545767',
          700: '#3C3F51',
          800: '#25293D',
          900: '#14182E',
          950: '#00041C',
        },
        silver: {
          50: '#FBFBFB',
          100: '#F6F6F6',
          300: '#DFE0E1',
          400: '#CED0D1',
          500: '#BEC0C2',
        },
        royal: {
          100: '#DBE8FE',
          300: '#80ACFC',
          400: '#4082FA',
          500: '#0058F8',
          600: '#004CD9',
        },
        carolina: {
          300: '#A5D4F8',
          400: '#78BEF4',
        },
        // Semantic tokens, owned by src/index.css.
        page: 'var(--page)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        fg: 'var(--fg)',
        'fg-muted': 'var(--fg-muted)',
        'fg-subtle': 'var(--fg-subtle)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        card: '0 20px 45px -30px rgba(0, 4, 28, 0.95)',
        raised: '0 14px 30px -14px rgba(0, 88, 248, 0.55)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
