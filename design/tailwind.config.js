/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          olive: "#3D4E2A",
          oliveLight: "#485935",
          oliveDark: "#2A371B",
          moss: "#7A8B52",
          sage: "#C2CBAD",
          sageBg: "#D4DAC5",
          cream: "#FAF7F0",
          pageBg: "#F5F3EC",
          sand: "#D8C3A5",
          sandLight: "#F5EFE6",
          terracotta: "#B85C38",
          dark: "#3B3028",
          muted: "#786E65",
          border: "#E2DDD2",
          badgeGreenBg: "#E3EBD3",
          badgeGreenText: "#3D5220",
          badgeOrangeBg: "#FCEAD8",
          badgeOrangeText: "#A3521E",
          badgeYellowBg: "#FCF3D7",
          badgeYellowText: "#8C6B16",
          badgeBlueBg: "#E1EEF9",
          badgeBlueText: "#1B5386",
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(59, 48, 40, 0.05)',
        'card': '0 2px 10px rgba(59, 48, 40, 0.04)',
      }
    },
  },
  plugins: [],
}
