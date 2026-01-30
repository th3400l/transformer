/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./types/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg-color)',
        },
        text: {
          DEFAULT: 'var(--text-color)',
          muted: 'var(--text-muted)',
        },
        panel: {
          bg: 'var(--panel-bg)',
          border: 'var(--panel-border)',
        },
        control: {
          bg: 'var(--control-bg)',
          border: 'var(--control-border)',
        },
        accent: {
          DEFAULT: 'var(--accent-color)',
          hover: 'var(--accent-color-hover)',
        },
        paper: {
          bg: 'var(--paper-bg)',
          line: 'var(--paper-line-color)',
        },
        shadow: {
          DEFAULT: 'var(--shadow-color)',
        },
        ink: {
          black: 'var(--ink-black)',
          blue: 'var(--ink-blue)',
          red: 'var(--ink-red)',
          green: 'var(--ink-green)',
        },
        overlay: {
          DEFAULT: 'var(--overlay-color)',
          message: 'var(--overlay-message-color)',
          tip: 'var(--overlay-tip-color)',
        },
        rose: {
          primary: 'var(--rose-primary)',
          secondary: 'var(--rose-secondary)',
          highlight: 'var(--rose-highlight)',
          shadow: 'var(--rose-shadow)',
        }
      }
    },
  },
  plugins: [],
}

