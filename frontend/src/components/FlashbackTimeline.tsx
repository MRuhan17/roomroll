import React, { useState } from 'react';
import { useRoomStore } from '@/store/roomStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Skull, Trophy, Swords, Sparkles, Shield, 
  HelpCircle, Eye, ChevronRight, Calendar 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryMoment {
  id: number;
  summary: string;
  moment_type?: string;
  created_at: string;
  is_emotional_moment?: boolean;
}

const MOMENT_TYPES: Record<string, {
  label: string;
  icon: React.ComponentType<any>;
  themeColor: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  shadowColor: string;
  emoji: string;
}> = {
  betrayal: {
    label: "Betrayal",
    icon: Swords,
    themeColor: "from-red-600 to-red-950",
    bgColor: "bg-red-950/20",
    borderColor: "border-red-900/30 hover:border-red-500/30",
    iconColor: "text-red-400",
    shadowColor: "shadow-red-500/10",
    emoji: "🗡️"
  },
  failed_quest: {
    label: "Quest Failed",
    icon: Shield,
    themeColor: "from-amber-600 to-amber-950",
    bgColor: "bg-amber-950/15",
    borderColor: "border-amber-900/30 hover:border-amber-600/30",
    iconColor: "text-amber-500",
    shadowColor: "shadow-amber-500/5",
    emoji: "⚠️"
  },
  legendary_victory: {
    label: "Legendary Victory",
    icon: Trophy,
    themeColor: "from-yellow-600 to-amber-900",
    bgColor: "bg-yellow-950/20",
    borderColor: "border-yellow-900/30 hover:border-yellow-500/40",
    iconColor: "text-yellow-400",
    shadowColor: "shadow-yellow-500/10",
    emoji: "👑"
  },
  dead_companion: {
    label: "Fallen Companion",
    icon: Skull,
    themeColor: "from-rose-700 to-rose-950",
    bgColor: "bg-rose-950/25",
    borderColor: "border-rose-900/30 hover:border-rose-500/40",
    iconColor: "text-rose-400",
    shadowColor: "shadow-rose-500/10",
    emoji: "💀"
  },
  major_discovery: {
    label: "Discovery",
    icon: Sparkles,
    themeColor: "from-purple-600 to-purple-950",
    bgColor: "bg-purple-950/20",
    borderColor: "border-purple-900/30 hover:border-purple-500/30",
    iconColor: "text-purple-400",
    shadowColor: "shadow-purple-500/10",
    emoji: "🔮"
  },
  famous_roll: {
    label: "Clutch Roll",
    icon: Trophy,
    themeColor: "from-amber-500 to-yellow-900",
    bgColor: "bg-amber-950/20",
    borderColor: "border-amber-900/30 hover:border-amber-400/40",
    iconColor: "text-amber-400",
    shadowColor: "shadow-amber-500/10",
    emoji: "🎲"
  }
};

export function FlashbackTimeline() {
  const memories = useRoomStore(state => state.memories) || [];
  const [filter, setFilter] = useState<string>('all');
  const [flashbackMoment, setFlashbackMoment] = useState<MemoryMoment | null>(null);

  // Extract all memories flagged as emotional moments
  const emotionalMoments = memories.filter(m => m.is_emotional_moment || m.moment_type);

  // Apply filters
  const filteredMoments = emotionalMoments.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'victories') return m.moment_type === 'legendary_victory' || m.moment_type === 'famous_roll';
    if (filter === 'betrayals') return m.moment_type === 'betrayal';
    if (filter === 'fallen') return m.moment_type === 'dead_companion' || m.moment_type === 'failed_quest';
    if (filter === 'discoveries') return m.moment_type === 'major_discovery';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-tavern-border/40 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all",
            filter === 'all' 
              ? "bg-[#d5b45d] text-stone-950 font-bold shadow-[0_2px_10px_rgba(213,180,93,0.3)]" 
              : "bg-black/40 border border-tavern-border/50 text-[#cbc3b5] hover:border-[#d5b45d]/40"
          )}
        >
          📜 All Chronicles
        </button>
        <button
          onClick={() => setFilter('victories')}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all",
            filter === 'victories' 
              ? "bg-yellow-500 text-stone-950 font-bold shadow-[0_2px_10px_rgba(234,179,8,0.3)]" 
              : "bg-black/40 border border-tavern-border/50 text-yellow-400/90 hover:border-yellow-400/40"
          )}
        >
          👑 Victories
        </button>
        <button
          onClick={() => setFilter('betrayals')}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all",
            filter === 'betrayals' 
              ? "bg-red-500 text-stone-950 font-bold shadow-[0_2px_10px_rgba(239,68,68,0.3)]" 
              : "bg-black/40 border border-tavern-border/50 text-red-400 hover:border-red-400/40"
          )}
        >
          🗡️ Betrayals
        </button>
        <button
          onClick={() => setFilter('fallen')}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all",
            filter === 'fallen' 
              ? "bg-rose-500 text-stone-950 font-bold shadow-[0_2px_10px_rgba(244,63,94,0.3)]" 
              : "bg-black/40 border border-tavern-border/50 text-rose-400 hover:border-rose-400/40"
          )}
        >
          💀 Fallen
        </button>
        <button
          onClick={() => setFilter('discoveries')}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all",
            filter === 'discoveries' 
              ? "bg-purple-500 text-stone-950 font-bold shadow-[0_2px_10px_rgba(168,85,247,0.3)]" 
              : "bg-black/40 border border-tavern-border/50 text-purple-400 hover:border-purple-400/40"
          )}
        >
          🔮 Discoveries
        </button>
      </div>

      {/* Timeline Scroll Box */}
      {filteredMoments.length === 0 ? (
        <div className="py-12 text-center text-[#cbc3b5]/40 font-display italic text-sm">
          No chronicle callbacks recorded for this category yet.
        </div>
      ) : (
        <div className="relative border-l border-tavern-border/30 pl-6 ml-3 py-2 space-y-8">
          {filteredMoments.map((moment, index) => {
            const config = MOMENT_TYPES[moment.moment_type || 'major_discovery'] || {
              label: "Discovery",
              icon: HelpCircle,
              themeColor: "from-stone-700 to-stone-900",
              bgColor: "bg-stone-950/20",
              borderColor: "border-stone-900/30",
              iconColor: "text-stone-400",
              shadowColor: "shadow-stone-500/5",
              emoji: "📜"
            };
            const Icon = config.icon;

            return (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setFlashbackMoment(moment)}
                className={cn(
                  "relative group bg-black/30 hover:bg-black/50 border border-tavern-border/40 hover:border-[#d5b45d]/40 rounded-2xl p-5 shadow-sm transition-all duration-300 cursor-pointer flex items-start gap-4 z-10",
                  config.shadowColor
                )}
              >
                {/* Glowing target timeline indicator dot */}
                <div className={cn(
                  "absolute -left-[31px] top-6 h-3 w-3 rounded-full border border-stone-950 shadow-inner group-hover:scale-125 transition-transform bg-stone-700",
                  moment.moment_type === 'legendary_victory' || moment.moment_type === 'famous_roll' ? "bg-yellow-400" :
                  moment.moment_type === 'betrayal' ? "bg-red-500" :
                  moment.moment_type === 'dead_companion' || moment.moment_type === 'failed_quest' ? "bg-rose-500" :
                  moment.moment_type === 'major_discovery' ? "bg-purple-400" : "bg-[#d5b45d]"
                )} />

                {/* Left Mini Badge */}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/60 border border-tavern-border/50 shadow-md",
                  config.iconColor
                )}>
                  <Icon className="h-5 w-5 stroke-[1.5]" />
                </div>

                {/* Text Body */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-[9px] font-mono uppercase tracking-widest font-semibold border px-2 py-0.5 rounded-full bg-black/40",
                      config.iconColor,
                      config.borderColor
                    )}>
                      {config.emoji} {config.label}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(moment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className="text-[#cbc3b5] font-display text-sm leading-relaxed group-hover:text-[#f5efe2] transition-colors pr-4">
                    {moment.summary}
                  </p>
                </div>

                {/* Action arrow */}
                <div className="h-full flex items-center self-center text-stone-600 group-hover:text-[#d5b45d] transition-colors shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cinematic Flashback Overlay Presentation */}
      <AnimatePresence>
        {flashbackMoment && (() => {
          const config = MOMENT_TYPES[flashbackMoment.moment_type || 'major_discovery'] || {
            label: "Chronicle Callback",
            icon: HelpCircle,
            themeColor: "from-stone-700 to-stone-950",
            glowColor: "rgba(213, 180, 93, 0.3)",
            textColor: "text-amber-200",
            emoji: "📜"
          };
          const Icon = config.icon;
          const bgGlow = (momentType: string) => {
            if (momentType === 'legendary_victory' || momentType === 'famous_roll') return 'rgba(234,179,8,0.3)';
            if (momentType === 'betrayal') return 'rgba(220,38,38,0.3)';
            if (momentType === 'dead_companion' || momentType === 'failed_quest') return 'rgba(244,63,94,0.3)';
            if (momentType === 'major_discovery') return 'rgba(168,85,247,0.3)';
            return 'rgba(213,180,93,0.3)';
          };

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* full screen backdrop wash */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/95 backdrop-blur-[16px] transition-all cursor-pointer"
                style={{
                  background: `radial-gradient(circle at center, ${bgGlow(flashbackMoment.moment_type || '')} 0%, rgba(8, 6, 5, 0.98) 80%)`
                }}
                onClick={() => setFlashbackMoment(null)}
              />

              {/* Sparks particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-60">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      y: "110%", 
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
                      duration: Math.random() * 5 + 3,
                      ease: "easeOut",
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                    className={cn(
                      "absolute w-2 h-2 rounded-full",
                      flashbackMoment.moment_type === 'legendary_victory' || flashbackMoment.moment_type === 'famous_roll' ? "bg-yellow-500" :
                      flashbackMoment.moment_type === 'betrayal' ? "bg-red-500" :
                      flashbackMoment.moment_type === 'dead_companion' || flashbackMoment.moment_type === 'failed_quest' ? "bg-rose-500" :
                      flashbackMoment.moment_type === 'major_discovery' ? "bg-purple-500" : "bg-[#d5b45d]"
                    )}
                    style={{
                      boxShadow: `0 0 10px white`
                    }}
                  />
                ))}
              </div>

              {/* Huge Gothic Presentation Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="relative max-w-2xl w-full text-center space-y-8 z-20 px-6 py-12"
              >
                {/* Medieval Flashback Icon */}
                <div className="flex justify-center">
                  <motion.div 
                    initial={{ rotate: -15, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-3xl bg-black/80 border border-tavern-border/50 text-[#cbc3b5]/90 shadow-2xl",
                      config.iconColor
                    )}
                  >
                    <Icon className="h-10 w-10 stroke-[1.2]" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <span className={cn(
                    "text-[10px] font-mono tracking-[0.5em] uppercase font-semibold block",
                    config.iconColor
                  )}>
                    Chronicles of Remembrance
                  </span>
                  <h2 className="text-[#f5efe2] font-serif text-5xl font-normal tracking-wide drop-shadow-md">
                    {config.label}
                  </h2>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-stone-500/50" />
                  <span className="text-xl">{config.emoji}</span>
                  <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-stone-500/50" />
                </div>

                {/* Subtitle performance cue */}
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono block italic">
                  (with a deep, echoing whisper of the past...)
                </span>

                {/* Summary Text Reveal */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="text-[#f5efe2] font-serif text-3xl leading-relaxed italic max-w-2xl font-light drop-shadow-lg mx-auto"
                >
                  "{flashbackMoment.summary}"
                </motion.p>

                {/* Date */}
                <div className="text-xs text-stone-400 font-mono tracking-widest pt-4">
                  Recorded on {new Date(flashbackMoment.created_at).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* Dismiss button */}
                <div className="pt-6">
                  <button
                    onClick={() => setFlashbackMoment(null)}
                    className="bg-[#d5b45d] text-stone-950 font-bold border border-transparent rounded-full px-8 py-3 text-xs font-display uppercase tracking-widest hover:bg-[#d5b45d]/80 hover:shadow-[0_0_20px_rgba(213,180,93,0.4)] transition-all"
                  >
                    Dismiss Flashback
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
