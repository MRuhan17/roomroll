import { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'parchment' | 'wood' | 'stone';
}

export function ContentPanel({ children, className = '', variant = 'parchment' }: ContentPanelProps) {
  const variants = {
    parchment: 'bg-gradient-to-br from-amber-50/95 to-stone-100/95 border-amber-900/20',
    wood: 'bg-gradient-to-br from-amber-900/30 to-stone-900/40 border-amber-700/30 text-stone-100',
    stone: 'bg-gradient-to-br from-stone-800/60 to-stone-900/70 border-stone-600/30 text-stone-100',
  };

  return (
    <div 
      className={`rounded-sm border-2 shadow-2xl ${variants[variant]} ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {children}
    </div>
  );
}
