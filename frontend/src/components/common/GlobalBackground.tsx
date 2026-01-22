interface GlobalBackgroundProps {
    isDarker?: boolean;
}

export function GlobalBackground({ isDarker = false }: GlobalBackgroundProps) {
    const baseGradient = isDarker
        ? "from-guild-bg-dark-start via-guild-bg-dark-mid to-guild-bg-dark-end"
        : "from-guild-bg-start via-guild-bg-mid to-guild-bg-end";

    return (
        <>
            {/* Base layer: Deep stone gradient with subtle lighting */}
            <div
                className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-700 ease-in-out bg-gradient-to-br ${baseGradient}`}
            />

            {/* Texture layer: Subtle stone/parchment grain */}
            <div
                className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Vignette: Soft darkening at edges for depth */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                }}
            />

            {/* Subtle ambient light wash (candlelit warmth) */}
            <div
                className="fixed inset-0 z-0 opacity-[0.08] pointer-events-none"
                style={{
                    // Using the light-warmth color defined in tailwind.config.js (#ffc878)
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 200, 120, 0.3) 0%, transparent 60%)',
                }}
            />
        </>
    );
}
