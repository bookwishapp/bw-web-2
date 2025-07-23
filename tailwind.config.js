// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'rgb(51, 102, 204)',
          teal: 'rgb(51, 153, 179)',
          gold: 'rgb(230, 179, 51)',
          orange: 'rgb(230, 128, 51)',
          pink: 'rgb(230, 102, 153)',
          cyan: 'rgb(51, 179, 230)',
        },
        text: {
          primary: 'rgb(0, 0, 0)',
          secondary: 'rgb(102, 102, 102)',
          tertiary: 'rgb(153, 153, 153)',
        },
        background: {
          primary: 'rgb(255, 255, 255)',
          secondary: 'rgb(247, 247, 247)',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}