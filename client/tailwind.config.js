/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        genesis: {
          950: '#0b2419',
          900: '#123523',
          800: '#19472d',
          700: '#28633e',
          500: '#72a84d',
          lime: '#b9d873',
          cream: '#f6f3e9',
          'cream-dark': '#eae5d7',
          ink: '#142119',
          muted: '#69736b',
        },
        green: {
          950: '#0b2419',
          900: '#123523',
          800: '#19472d',
          700: '#28633e',
          600: '#3c8552',
          500: '#72a84d',
          400: '#8ec468',
          300: '#b9d873',
          200: '#d7e8ab',
          100: '#ebf4d4',
          50: '#f6f9ee',
        },
      },
      fontFamily: {
        serif: ['var(--serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--sans)', 'DM Sans', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}