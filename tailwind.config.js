/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { wine: '#6B0F24', 'wine-deep': '#4C0A19', cream: '#F2E8D5', ink: '#0E0A0B' },
      fontFamily: {
        display: ['Anybody', 'Impact', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
