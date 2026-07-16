/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 400:"#6b8cff", 500:"#4361ee", 600:"#3a0ca3" }
      }
    }
  },
  plugins: []
}