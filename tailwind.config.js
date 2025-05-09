// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Use Poppins as default sans font
      },
      // Add custom colors if needed, matching your prototypes
      colors: {
        'element-fire': '#ef4444', // red-500
        'element-wood': '#10b981', // green-500
        'element-water': '#3b82f6', // blue-500
      }
    },
  },
  plugins: [],
}
