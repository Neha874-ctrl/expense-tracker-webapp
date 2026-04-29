/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.js"],
  theme: {
    extend: {
      colors: {
        surface: '#1e0934',
        background: '#12051f',
        primary: '#7c3aed',
        secondary: '#be185d',
        'accent-lime': '#a3e635',
      },
    },
  },
  plugins: [],
}
