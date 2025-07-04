/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "instagram-blue": "#0095f6",
        "instagram-gray": "#8e8e8e",
        "instagram-light-gray": "#dbdbdb",
        "instagram-bg": "#fafafa",
      },
      fontFamily: {
        "instagram": ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
