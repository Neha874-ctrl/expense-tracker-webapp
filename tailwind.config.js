/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.js"],
  theme: {
    extend: {
      colors: {
        surface: '#1b1c17',
        background: '#131410',
        primary: '#55632d',
        secondary: '#5c614b',
        'accent-lime': '#a2b078',
      },
    },
  },
  plugins: [],
}
