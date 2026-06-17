import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary - Warm Gold
                gold: {
                    50: "#fdfaf5",
                    100: "#f9f2e6",
                    200: "#f2e4c9",
                    300: "#e8d0a0",
                    400: "#ddb976",
                    500: "#d4a574",
                    600: "#b8885a",
                    700: "#9a6e47",
                    800: "#7d583a",
                    900: "#664830",
                },
                // Secondary - Sage Green
                sage: {
                    50: "#f5f8f6",
                    100: "#e8f0ea",
                    200: "#d1e0d4",
                    300: "#a8c3ae",
                    400: "#7d9d7f",
                    500: "#5a7c5c",
                    600: "#486249",
                    700: "#3a4f3b",
                    800: "#2f4031",
                    900: "#283629",
                },
                // Accent - Deep Teal
                teal: {
                    50: "#f0f9fa",
                    100: "#daf0f3",
                    200: "#b9e2e8",
                    300: "#8bced8",
                    400: "#5ab1c2",
                    500: "#3e94a8",
                    600: "#2c6e7c",
                    700: "#265a66",
                    800: "#244a53",
                    900: "#233e46",
                },
                // Neutral with warm undertones
                neutral: {
                    50: "#fafaf9",
                    100: "#f5f5f4",
                    200: "#e7e5e4",
                    300: "#d6d3d1",
                    400: "#a8a29e",
                    500: "#78716c",
                    600: "#57534e",
                    700: "#44403c",
                    800: "#292524",
                    900: "#1c1917",
                },
            },
            fontFamily: {
                arabic: ["Cairo", "Arial", "sans-serif"],
                "arabic-serif": ["Amiri", "serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            backdropBlur: {
                xs: "2px",
            },
            animation: {
                "fade-in": "fadeIn 0.6s ease-in",
                "fade-in-up": "fadeInUp 0.6s ease-out",
                "fade-in-down": "fadeInDown 0.5s ease-out",
                "slide-up": "slideUp 0.4s ease-out",
                "slide-up-notification": "slideUpNotification 0.3s ease-out",
                "slide-down": "slideDown 0.4s ease-out",
                "scale-in": "scaleIn 0.3s ease-out",
                pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
                float: "float 6s ease-in-out infinite",
                "shake-tap": "shake-tap 0.3s ease-out",
                shake: "shake 0.4s ease-in-out",
                "pulse-circle": "pulse-circle 0.4s ease-in-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                fadeInDown: {
                    "0%": { opacity: "0", transform: "translateY(-20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideUp: {
                    "0%": { transform: "translateY(100%)" },
                    "100%": { transform: "translateY(0)" },
                },
                slideUpNotification: {
                    "0%": { opacity: "0", transform: "translateX(-50%) translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(0)" },
                },
                scaleIn: {
                    "0%": { opacity: "0", transform: "scale(0.9)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                pulseSubtle: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.8" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "shake-tap": {
                    "0%, 100%": { transform: "scale(1)" },
                    "25%": { transform: "scale(0.92) rotate(-2deg)" },
                    "50%": { transform: "scale(0.88) rotate(2deg)" },
                    "75%": { transform: "scale(0.92) rotate(-1deg)" },
                },
                shake: {
                    "0%, 100%": { transform: "translateX(0) scale(1)" },
                    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px) scale(0.95)" },
                    "20%, 40%, 60%, 80%": { transform: "translateX(4px) scale(0.95)" },
                },
                "pulse-circle": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(0.92)" },
                    "100%": { transform: "scale(1)" },
                },
            },
            boxShadow: {
                glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                "glass-lg": "0 12px 48px 0 rgba(31, 38, 135, 0.2)",
                gold: "0 10px 40px rgba(212, 165, 116, 0.3)",
                "gold-lg": "0 20px 60px rgba(212, 165, 116, 0.4)",
                sage: "0 10px 40px rgba(125, 157, 127, 0.3)",
                "inner-glow": "inset 0 0 20px rgba(255, 255, 255, 0.05)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
