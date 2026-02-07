/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        highlight: '#00adb5',
        danger: '#e94560',
        success: '#4ecca3',
        warning: '#f39c12',
        neon: {
          blue: '#00d4ff',
          green: '#39ff14',
          pink: '#ff10f0',
          yellow: '#ffff00',
        },
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 212, 255, 0.5)',
        'neon-strong': '0 0 20px rgba(0, 212, 255, 0.8)',
      },
    },
  },
  plugins: [],
}