/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        sage: '#7CB69D',
        terracotta: '#E07A5F',
        ocean: '#5A9BBF',
        lavender: '#9B8AA6',
        sand: '#E8DFD0',
        cream: '#F7F5F0',
        bark: '#3D352D',
      },
    },
  },
  plugins: [],
};
