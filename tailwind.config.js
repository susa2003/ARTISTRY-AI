/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F1",
        ink: "#17201C",
        moss: "#28594B",
        sage: "#E2E8DC",
        clay: "#CB7857",
      },
      fontFamily: { display: ["Georgia"] },
    },
  },
  plugins: [],
};
