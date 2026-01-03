/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "node_modules/@rjsf/shadcn/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  safelist: [
    'xl:hidden',
    'xl:relative',
    'xl:inset-auto',
    'xl:z-auto',
    'xl:h-full',
    'xl:w-[800px]',
    'xl:flex',
    'xl:flex-1',
    'xl:min-w-0',
    'xl:overflow-y-auto',
    'xl:opacity-100',
    'xl:pointer-events-auto',
    // Portfolio theme colors
    'border-l-blue-500',
    'bg-blue-50',
    'dark:bg-blue-950/20',
    'text-blue-700',
    'dark:text-blue-300',
    'bg-blue-100',
    'dark:bg-blue-900/50',
    'text-blue-800',
    'dark:text-blue-200',
    'border-l-green-500',
    'bg-green-50',
    'dark:bg-green-950/20',
    'text-green-700',
    'dark:text-green-300',
    'bg-green-100',
    'dark:bg-green-900/50',
    'text-green-800',
    'dark:text-green-200',
    'border-l-purple-500',
    'bg-purple-50',
    'dark:bg-purple-950/20',
    'text-purple-700',
    'dark:text-purple-300',
    'bg-purple-100',
    'dark:bg-purple-900/50',
    'text-purple-800',
    'dark:text-purple-200',
    'border-l-orange-500',
    'bg-orange-50',
    'dark:bg-orange-950/20',
    'text-orange-700',
    'dark:text-orange-300',
    'bg-orange-100',
    'dark:bg-orange-900/50',
    'text-orange-800',
    'dark:text-orange-200',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      backgroundImage: {
        'diagonal-lines': `
          repeating-linear-gradient(-45deg, hsl(var(--border) / 0.4) 0 2px, transparent 1px 12px),
          linear-gradient(hsl(var(--background)), hsl(var(--background)))
        `,
      },
      ringColor: {
        DEFAULT: 'hsl(var(--primary))', // e.g. Tailwind's blue-500
      },
      fontSize: { // These are downshifted by 1
        xs: ['0.625rem', { lineHeight: '0.875rem' }], // 10px / 14px
        sm: ['0.75rem', { lineHeight: '1rem' }],     // 12px / 16px
        base: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px / 20px
        lg: ['1rem', { lineHeight: '1.5rem' }],   // 16px / 24px
        xl: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px / 28px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          foreground: "hsl(var(--neutral-foreground))",
        },
        status: {
          init: "hsl(var(--status-init))",
          "init-foreground": "hsl(var(--status-init-foreground))",
          running: "hsl(var(--status-running))",
          "running-foreground": "hsl(var(--status-running-foreground))",
          complete: "hsl(var(--status-complete))",
          "complete-foreground": "hsl(var(--status-complete-foreground))",
          failed: "hsl(var(--status-failed))",
          "failed-foreground": "hsl(var(--status-failed-foreground))",
          paused: "hsl(var(--status-paused))",
          "paused-foreground": "hsl(var(--status-paused-foreground))",
        },
        console: {
          DEFAULT: "hsl(var(--console-background))",
          foreground: "hsl(var(--console-foreground))",
          success: "hsl(var(--console-success))",
          error: "hsl(var(--console-error))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'chivo-mono': ['Chivo Mono', 'Noto Emoji', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pill: {
          '0%': { opacity: '0' },
          '10%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pill: 'pill 2s ease-in-out forwards',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/container-queries")],
}
