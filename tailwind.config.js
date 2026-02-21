/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        sage: 'rgb(var(--sage) / <alpha-value>)',
        terracotta: 'rgb(var(--terracotta) / <alpha-value>)',
        ocean: 'rgb(var(--ocean) / <alpha-value>)',
        lavender: 'rgb(var(--lavender) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        cream: 'rgb(var(--cream) / <alpha-value>)',
        bark: 'rgb(var(--bark) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
