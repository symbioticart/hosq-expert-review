import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral:    "#FF6F55",
        violet:   "#C47CF1",
        green:    "#14B672",
        greenDark:"#0A7A4B",
        blue:     "#56A4CB",
        pink:     "#E770C3",
        ink:      "#231F20",
        cream:    "#EBE2D6",
        blush:    "#E8DCD4",
        muted:    "#6B6566",
        hairline: "#D9CFC3",
        zebra:    "#FAF6F0",
      },
      borderRadius: { pill: "999px", card: "16px" },
      fontFamily: {
        sans:    ['"Cera Pro"', '"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Austin Cy"', '"Playfair Display"', "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
