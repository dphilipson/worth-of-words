import themes from "daisyui/src/theming/themes";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        primary:
          "linear-gradient(120deg, rgba(84, 152, 255, 100%) 26.44%, rgba(161, 49, 249, 100%) 109.11%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...themes["[data-theme=light]"],
          secondary: "#64748B",
          a: {
            fontWeight: "400",
          },
          ".btn": {
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: "600",
          },
          ".btn-primary": {
            background:
              "linear-gradient(150deg, rgba(84, 152, 255, 100%) 26.44%, rgba(161, 49, 249, 100%) 109.11%)",
            border: "none",
            color: "white",
          },
          ".btn-primary:hover": {
            background:
              "linear-gradient(150deg, rgba(74, 140, 243, 100%) 26.44%, rgba(149, 37, 237, 100%) 109.11%)",
          },
          ".btn-primary:disabled": {
            background:
              "linear-gradient(150deg, rgba(84, 152, 255, 30%) 26.44%, rgba(161, 49, 249, 30%) 109.11%)",
            color: "white",
          },
        },
      },
    ],
  },
};
export default config;
