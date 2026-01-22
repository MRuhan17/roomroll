import React from 'react';

interface GlobalBackgroundProps {
    isDarker?: boolean;
}

export function GlobalBackground({ isDarker = false }: GlobalBackgroundProps) {
    return (
        <>
            {/* Base layer: Deep stone gradient with subtle lighting */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    background: isDarker
                        ? 'linear-gradient(135deg, #1a1612 0%, #0d0a08 50%, #1a1410 100%)'
                        : 'linear-gradient(135deg, #2a2420 0%, #1a1510 50%, #252118 100%)',
                }}
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
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 200, 120, 0.3) 0%, transparent 60%)',
                }}
            />
        </>
    );
}
