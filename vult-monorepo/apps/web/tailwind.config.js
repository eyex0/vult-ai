/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#090a0b',
        panel: '#111315',
        line: '#272a2e',
        muted: '#9399a2',
        accent: '#e36d4f',
        lime: '#b5e48c'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif']
      }
    }
  },
  plugins: []
};