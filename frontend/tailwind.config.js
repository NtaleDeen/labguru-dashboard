/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#21336a',
        secondary: '#2d4a8f',
        accent: '#f0f4ff',
        highlight: '#d4af37',
        danger: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(33, 51, 106, 0.2)',
      },
    },
  },
  plugins: [],
}