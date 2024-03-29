/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./_includes/**/*.{html,njk}",
    "./content/**/*.{html,njk}"
  ],
  theme: {
  },
  daisyui: {
    themes: ["light", "dark"],
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
}

