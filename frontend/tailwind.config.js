/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-color': '#21336a',
        'primary-color': '#000',
        'pure-white': '#fff',
        'hover-color': '#deab5f',
        'background-color': 'rgba(250, 250, 250, 0.9)',
        'background-2-color': '#0a0a0a',
        'border-color': '#4b5563',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Important: Allow custom classes to override Tailwind
  important: false,
}