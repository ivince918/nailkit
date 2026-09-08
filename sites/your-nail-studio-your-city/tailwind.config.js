import preset from '../../packages/template/src/tailwind-preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './salon.config.json',
    '../../packages/template/src/**/*.{js,jsx}',
  ],
}
