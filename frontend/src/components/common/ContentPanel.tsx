import { type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ContentPanelProps {
    children: ReactNode;
    className?: string;
    variant?: 'parchment' | 'wood' | 'stone';
}

export function ContentPanel({ children, className = '', variant = 'parchment' }: ContentPanelProps) {
    const variants = {
        parchment: 'bg-gradient-to-br from-guild-panel-parchment/95 to-guild-panel-parchment-to/95 border-guild-border-parchment/20 text-stone-900',
        wood: 'bg-gradient-to-br from-guild-panel-wood/30 to-guild-panel-wood-to/40 border-guild-border-wood/30 text-stone-100',
        stone: 'bg-gradient-to-br from-guild-panel-stone/60 to-guild-panel-stone-to/70 border-guild-border-stone/30 text-stone-100',
    };

    return (
        <div
            className={cn(
                "rounded-sm border-2 shadow-2xl backdrop-blur-sm",
                variants[variant],
                className
            )}
            style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
        >
            {children}
        </div>
    );
}
