import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Sparkles, Skull, HelpCircle, Trophy, Swords } from 'lucide-react';

interface MemoryMoment {
  id: number;
  summary: string;
  moment_type?: string;
  created_at: string;
}

const MOMENT_CONFIGS: Record<string, {
  title: string;
  icon: React.ComponentType<any>;
  glowColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
  particleColor: string;
}> = {
  betrayal: {
    title: "Vile Betrayal",
    icon: Swords,
    glowColor: "rgba(220, 38, 38, 0.4)",
    textColor: "text-red-400",
    borderColor: "border-red-500/40",
    emoji: "🗡️",
    particleColor: "bg-red-500/30"
  },
  failed_quest: {
    title: "Tragic Failure",
    icon: Shield,
    glowColor: "rgba(245, 158, 11, 0.35)",
    textColor: "text-amber-500",
    borderColor: "border-amber-600/30",
    emoji: "⚠️",
    particleColor: "bg-amber-600/20"
  },
  legendary_victory: {
    title: "Legendary Victory",
    icon: Trophy,
    glowColor: "rgba(234, 179, 8, 0.45)",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/40",
    emoji: "👑",
    particleColor: "bg-yellow-400/40"
  },
  dead_companion: {
    title: "Companion Fallen",
    icon: Skull,
    glowColor: "rgba(244, 63, 94, 0.4)",
    textColor: "text-rose-400",
    borderColor: "border-rose-500/40",
    emoji: "💀",
    particleColor: "bg-rose-600/30"
  },
  major_discovery: {
    title: "Grand Discovery",
    icon: Sparkles,
    glowColor: "rgba(168, 85, 247, 0.4)",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/40",
    emoji: "🔮",
    particleColor: "bg-purple-400/30"
  },
  famous_roll: {
    title: "Clutch Roll of Fate",
    icon: Trophy,
    glowColor: "rgba(251, 191, 36, 0.45)",
    textColor: "text-amber-400",
    borderColor: "border-amber-400/40",
    emoji: "🎲",
    particleColor: "bg-amber-400/40"
  }
};

export function CinematicPopupManager() {
  const [activeMoment, setActiveMoment] = useState<MemoryMoment | null>(null);

  useEffect(() => {
    const handleNewMoment = (e: Event) => {
      const customEvent = e as CustomEvent<MemoryMoment>;
      if (customEvent.detail) {
        setActiveMoment(customEvent.detail);
        
        // Auto-close after 7.5 seconds
        const timer = setTimeout(() => {
          setActiveMoment(null);
        }, 7500);
        
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('new-memory-moment', handleNewMoment);
    return () => {
      window.removeEventListener('new-memory-moment', handleNewMoment);
    };
  }, []);

  if (!activeMoment) return null;

  const typeKey = activeMoment.moment_type || 'major_discovery';
  const config = MOMENT_CONFIGS[typeKey] || {
    title: "Campaign Chronicle",
    icon: HelpCircle,
    glowColor: "rgba(213, 180, 93, 0.35)",
    textColor: "text-amber-200",
    borderColor: "border-amber-200/30",
    emoji: "📜",
    particleColor: "bg-amber-400/20"
  };

  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Full-screen Backdrop wash */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-[12px] transition-all"
          style={{
            background: `radial-gradient(circle at center, ${config.glowColor} 0%, rgba(12, 10, 9, 0.95) 75%)`
          }}
          onClick={() => setActiveMoment(null)}
        />

        {/* Ambient sparks floating up */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: "100%", 
                x: `${Math.random() * 100}%`,
                scale: Math.random() * 0.8 + 0.4,
                opacity: 0.8 
              }}
              animate={{ 
                y: "-10%",
                x: `${Math.random() * 100}%`,
                opacity: 0
              }}
              transition={{ 
                duration: Math.random() * 4 + 3,
                ease: "easeOut",
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className={`absolute w-1.5 h-1.5 rounded-full ${config.particleColor}`}
              style={{
                boxShadow: `0 0 8px ${config.glowColor}`
              }}
            />
          ))}
        </div>

        {/* Glassmorphic Medieval Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className={`relative max-w-xl w-full bg-stone-950/80 border ${config.borderColor} rounded-[24px] p-8 shadow-[0_0_80px_${config.glowColor}] backdrop-blur-md overflow-hidden text-center z-20`}
        >
          {/* Subtle gothic runic background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1px)] bg-[size:16px_16px]" />

          {/* Glowing Aura ring */}
          <div 
            className="absolute inset-x-0 -top-24 h-48 w-full blur-[60px] opacity-40 rounded-full"
            style={{ backgroundColor: config.glowColor }}
          />

          <div className="relative space-y-6">
            {/* Pulsing Medieval Icon Badge */}
            <div className="flex justify-center">
              <motion.div 
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-black/60 border ${config.borderColor} ${config.textColor} shadow-inner`}
              >
                <IconComponent className="h-8 w-8 stroke-[1.5]" />
              </motion.div>
            </div>

            {/* Sub-header */}
            <div className="space-y-1">
              <span className={`text-[10px] font-mono tracking-[0.4em] uppercase ${config.textColor} font-semibold`}>
                Campaign Chronicle Callback
              </span>
              <h2 className="text-[#f5efe2] font-serif text-3xl tracking-wide font-normal leading-tight">
                {config.title}
              </h2>
            </div>

            {/* Middle Divider */}
            <div className="flex items-center justify-center gap-3">
              <div className={`h-[1px] w-16 bg-gradient-to-r from-transparent to-${config.textColor.split('-')[1]}-500/30`} />
              <span className="text-xs">{config.emoji}</span>
              <div className={`h-[1px] w-16 bg-gradient-to-l from-transparent to-${config.textColor.split('-')[1]}-500/30`} />
            </div>

            {/* Summary Text */}
            <p className="text-[#cbc3b5] font-display text-lg leading-relaxed italic max-w-md mx-auto">
              "{activeMoment.summary}"
            </p>

            {/* Time Stamp */}
            <div className="text-[10px] text-stone-500 uppercase tracking-widest font-mono pt-4">
              Recorded at {new Date(activeMoment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Session Live
            </div>

            {/* medieval button */}
            <div className="pt-2">
              <button
                onClick={() => setActiveMoment(null)}
                className={`bg-stone-900 border border-stone-800 hover:border-[#d5b45d]/40 rounded-full px-6 py-2 text-xs font-display uppercase tracking-widest text-[#cbc3b5] hover:text-white transition-all`}
              >
                Close Chronicle
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
