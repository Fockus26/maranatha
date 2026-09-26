import type { Config } from "tailwindcss";
import { radius, spacing } from "./theme/tokens";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        xs: `${radius.xs}px`,
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
      },
      spacing: Object.fromEntries(
        Object.entries(spacing).map(([key, val]) => [key, `${val}px`]),
      ),
    },
  },
};

export default config;
