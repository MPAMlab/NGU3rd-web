// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom colors or other theme extensions if needed
      colors: {
        // Example: Define colors based on your prototype
        'dark-bg': '#0f172a', // Example dark background
        'card-bg': 'rgba(255, 255, 255, 0.05)', // Example glass background
        'purple-accent': '#8b5cf6', // Example accent color
        'fire-element': '#ef4444',
        'wood-element': '#10b981',
        'water-element': '#3b82f6',
      },
      aspectRatio: {
        '16/9': '16 / 9', // Add 16:9 aspect ratio utility
      },
    },
  },
  plugins: [],
}
