/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "var(--background)", // Using direct var for these as they might not be HSL
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                // Semantic DnD Theme Colors
                guild: {
                    bg: {
                        start: '#2a2420',
                        mid: '#1a1510',
                        end: '#252118',
                        'dark-start': '#1a1612',
                        'dark-mid': '#0d0a08',
                        'dark-end': '#1a1410',
                        'light-warmth': '#ffc878',
                    },
                    panel: {
                        parchment: '#fffbeb',     // amber-50
                        'parchment-to': '#f5f5f4', // stone-100
                        wood: '#451a03',          // amber-900
                        'wood-to': '#1c1917',     // stone-900
                        stone: '#292524',         // stone-800
                        'stone-to': '#1c1917',    // stone-900
                    },
                    border: {
                        parchment: '#451a03',     // amber-900
                        wood: '#b45309',          // amber-700
                        stone: '#57534e',         // stone-600
                    },
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}
