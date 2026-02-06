/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#21336a',
        accent: '#deab5f',
        primaryDark: '#182647',
        primaryLight: '#2a4385',
        accentDark: '#c5924a',
        accentLight: '#e8c080',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}