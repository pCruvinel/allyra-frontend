/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Colors
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "#ffffff",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "#ffffff",
        },
        // Text Colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        // Status Colors
        "status-active": "var(--color-status-active)",
        "status-active-text": "var(--color-status-active-text)",
        // Base Colors
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          light: "var(--color-border-light)",
          muted: "var(--color-border-default)",
        },
        input: {
          DEFAULT: "hsl(var(--input) / <alpha-value>)",
          background: "var(--input-background)",
        },
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
