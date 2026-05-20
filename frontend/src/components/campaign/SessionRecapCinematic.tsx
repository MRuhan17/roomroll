import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, ArrowDown, ChevronRight, X, Sparkles, 
  Compass, Flame, ShieldAlert, Award, Skull, Heart, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Highlight {
  type: 'decision' | 'betrayal' | 'discovery' | 'death' | 'legendary_roll' | 'emotional_moment' | 'faction_consequence';
  description: string;
  intensity: 'low' | 'medium' | 'high' | 'critical';
}

interface SessionRecap {
  title: string;
  summary: string;
  tone: string;
  highlights: Highlight[];
  narration: string;
  createdAt?: string;
}

interface SessionRecapCinematicProps {
  recap: SessionRecap;
  onClose: () => void;
}

export function SessionRecapCinematic({ recap, onClose }: SessionRecapCinematicProps) {
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Determine styles and themes based on the selected tone
  const getToneTheme = (tone: string) => {
    switch (tone?.toLowerCase()) {
      case 'heroic':
        return {
          bg: 'bg-gradient-to-b from-[#110f0c] via-[#2a1c0d] to-[#110f0c]',
          border: 'border-[#d5b45d]/40',
          glow: 'shadow-[0_0_50px_rgba(213,180,93,0.15)]',
          badgeBg: 'bg-[#d5b45d]/10 text-[#e9c97c] border-[#d5b45d]/30',
          accentColor: '#d5b45d',
          particleColor: 'rgba(213,180,93,0.3)',
          icon: <Award className="h-6 w-6 text-[#d5b45d]" />
        };
      case 'horror':
        return {
          bg: 'bg-gradient-to-b from-[#0a0505] via-[#220a0a] to-[#0a0505]',
          border: 'border-[#ab211f]/40',
          glow: 'shadow-[0_0_50px_rgba(171,33,31,0.2)]',
          badgeBg: 'bg-[#ab211f]/20 text-[#fca5a5] border-[#ab211f]/30',
          accentColor: '#ab211f',
          particleColor: 'rgba(171,33,31,0.4)',
          icon: <Skull className="h-6 w-6 text-[#ab211f]" />
        };
      case 'mysterious':
        return {
          bg: 'bg-gradient-to-b from-[#080510] via-[#1a0e30] to-[#080510]',
          border: 'border-[#a855f7]/40',
          glow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)]',
          badgeBg: 'bg-[#a855f7]/15 text-[#d8b4fe] border-[#a855f7]/30',
          accentColor: '#a855f7',
          particleColor: 'rgba(168,85,247,0.3)',
          icon: <Sparkles className="h-6 w-6 text-[#c084fc]" />
        };
      case 'tragic':
        return {
          bg: 'bg-gradient-to-b from-[#0d0f12] via-[#1e2330] to-[#0d0f12]',
          border: 'border-[#94a3b8]/40',
          glow: 'shadow-[0_0_50px_rgba(148,163,184,0.1)]',
          badgeBg: 'bg-[#334155]/30 text-[#cbd5e1] border-[#475569]/30',
          accentColor: '#94a3b8',
          particleColor: 'rgba(148,163,184,0.2)',
          icon: <Heart className="h-6 w-6 text-[#94a3b8]" />
        };
      case 'dramatic':
      default:
        return {
          bg: 'bg-gradient-to-b from-[#0c0a09] via-[#292524] to-[#0c0a09]',
          border: 'border-[#d5b45d]/30',
          glow: 'shadow-[0_0_40px_rgba(213,180,93,0.1)]',
          badgeBg: 'bg-[#78716c]/20 text-[#f5efe2] border-[#a8a29e]/30',
          accentColor: '#d5b45d',
          particleColor: 'rgba(213,180,93,0.25)',
          icon: <Flame className="h-6 w-6 text-[#d5b45d] animate-pulse" />
        };
    }
  };

  const theme = getToneTheme(recap.tone);

  // Auto-scroll loop
  useEffect(() => {
    let scrollInterval: any;
    if (isAutoScrolling && scrollContainerRef.current) {
      scrollInterval = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 2) {
            setIsAutoScrolling(false);
          } else {
            scrollContainerRef.current.scrollBy({ top: 1, behavior: 'auto' });
          }
        }
      }, 35);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling]);

  // Audio Narration TTS
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleNarration = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech narration is not supported on this browser.");
      return;
    }

    if (isPlayingNarration) {
      window.speechSynthesis.cancel();
      setIsPlayingNarration(false);
      return;
    }

    // Clean narration text of parenthetical notes like (whispered) for clean audio
    const cleanText = recap.narration.replace(/\([^)]*\)/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose a deep, epic sounding voice if possible
    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = voices.find(v => v.name.toLowerCase().includes('google uk english male') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('epic')) ?? voices[0];
    if (chosenVoice) utterance.voice = chosenVoice;
    
    utterance.rate = 0.9; // Slightly slower for epic tone
    utterance.pitch = 0.85; // Deeper pitch

    utterance.onend = () => {
      setIsPlayingNarration(false);
    };

    utterance.onerror = () => {
      setIsPlayingNarration(false);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingNarration(true);
  };

  // Get icons matching highlight types
  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'decision': return <Compass className="h-5 w-5 text-sky-400" />;
      case 'betrayal': return <ShieldAlert className="h-5 w-5 text-amber-500" />;
      case 'discovery': return <Sparkles className="h-5 w-5 text-teal-400" />;
      case 'death': return <Skull className="h-5 w-5 text-[#ab211f]" />;
      case 'legendary_roll': return <Award className="h-5 w-5 text-[#d5b45d] animate-bounce" />;
      case 'emotional_moment': return <Heart className="h-5 w-5 text-pink-400" />;
      case 'faction_consequence': return <Flame className="h-5 w-5 text-orange-500" />;
      default: return <Sparkles className="h-5 w-5 text-stone-400" />;
    }
  };

  const getIntensityBadge = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
      case 'low':
      default:
        return 'bg-stone-500/10 text-stone-300 border border-stone-500/30';
    }
  };

  // Render parenthetical dramatic script cues in highlights or red color
  const renderStyledScript = (text: string) => {
    const parts = text.split(/(\([^)]*\))/g);
    return parts.map((part, index) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return (
          <span 
            key={index} 
            className="text-serif font-semibold italic block text-center tracking-widest my-2 uppercase text-xs"
            style={{ color: theme.accentColor }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md overflow-hidden ${theme.bg}`}
    >
      {/* Cinematic Floating Embers Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: theme.accentColor,
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100, -200],
              x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20],
              opacity: [0, 0.8, 0],
              scale: [1, 1.5, 0.5]
            }}
            transition={{
              duration: Math.random() * 8 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -10
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className={`relative w-full max-w-4xl h-[90vh] rounded-2xl border ${theme.border} bg-black/65 backdrop-blur-xl flex flex-col overflow-hidden ${theme.glow}`}
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-black/40 z-10">
          <div className="flex items-center gap-3">
            {theme.icon}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#d5b45d]/70">Epic Cinematic Recap</span>
              <h2 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide">{recap.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleNarration}
              className={`gap-2 bg-stone-900/60 border-stone-700 hover:bg-stone-800 text-[#f5efe2] ${isPlayingNarration ? 'border-[#d5b45d]' : ''}`}
            >
              {isPlayingNarration ? (
                <>
                  <Pause className="h-4 w-4 text-[#d5b45d] animate-pulse" />
                  <span className="text-[#d5b45d]">Silence Bard</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Narration</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`gap-2 bg-stone-900/60 border-stone-700 hover:bg-stone-800 text-[#f5efe2] ${isAutoScrolling ? 'border-[#d5b45d]' : ''}`}
            >
              <ArrowDown className={`h-4 w-4 ${isAutoScrolling ? 'animate-bounce text-[#d5b45d]' : ''}`} />
              <span>{isAutoScrolling ? 'Pause Scroll' : 'Auto Scroll'}</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#cbc3b5] hover:text-[#f5efe2] hover:bg-stone-800 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cinematic Main Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 scrollbar-thin scrollbar-thumb-stone-800 select-none scroll-smooth"
        >
          {/* Tone Theme Graphic Overlay */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-5 pointer-events-none w-72 h-72 rounded-full blur-[80px]" style={{ backgroundColor: theme.accentColor }} />

          {/* Epic Audio Waves Pulse */}
          <AnimatePresence>
            {isPlayingNarration && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-1.5 py-4 border border-[#d5b45d]/20 bg-[#d5b45d]/5 rounded-xl animate-pulse"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[#d5b45d]"
                    animate={{ height: [8, Math.random() * 24 + 10, 8] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
                <span className="font-serif text-sm italic text-[#e9c97c] ml-2">The bard chants your triumphs and tragedies...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Narrative Chapter Banner */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block border border-stone-800 bg-stone-900/30 px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-[#cbc3b5]"
            >
              TONE: <span className="uppercase" style={{ color: theme.accentColor }}>{recap.tone}</span>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-display font-bold text-[#f5efe2] tracking-wider leading-tight drop-shadow-md"
            >
              {recap.title}
            </motion.h1>
            <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-[#d5b45d] to-transparent my-6" />
          </div>

          {/* 3-Paragraph Prose Summary */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert max-w-3xl mx-auto text-center"
          >
            <p className="font-serif text-[#f5efe2]/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap tracking-wide drop-shadow-sm font-light select-text">
              {recap.summary}
            </p>
          </motion.div>

          <hr className="border-stone-800 max-w-xl mx-auto" />

          {/* High-Stakes Highlights Section */}
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h3 className="text-sm font-display uppercase tracking-widest font-bold text-[#cbc3b5] flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-[#d5b45d]" />
                Legendary Milestones
              </h3>
              <p className="text-xs text-[#cbc3b5]/60 font-serif italic mt-1">Decisions, discoveries, and consequences carved in stone.</p>
            </div>

            {/* Vertical Interactive Timeline */}
            <div className="relative border-l border-stone-800 ml-4 md:ml-8 pl-6 md:pl-8 space-y-8 my-6">
              {recap.highlights.map((highlight, index) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={index}
                  className="relative group"
                >
                  {/* Timeline bullet with dynamic glow */}
                  <div 
                    className="absolute -left-[45px] md:-left-[53px] top-1.5 w-9 h-9 rounded-full bg-[#181615] border border-stone-700 flex items-center justify-center group-hover:scale-115 transition-transform duration-300 shadow-lg"
                    style={{ 
                      borderColor: highlight.intensity === 'critical' ? '#ab211f' : 'inherit',
                      boxShadow: highlight.intensity === 'critical' ? '0 0 12px rgba(171,33,31,0.4)' : 'none'
                    }}
                  >
                    {getHighlightIcon(highlight.type)}
                  </div>

                  {/* Recap content card */}
                  <div className="bg-[#181615]/60 hover:bg-[#201d1c]/80 border border-stone-800 hover:border-stone-700/60 rounded-xl p-4 transition-all duration-300 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.accentColor }}>
                        {highlight.type.replace('_', ' ')}
                      </span>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getIntensityBadge(highlight.intensity)}`}>
                        {highlight.intensity} STAKES
                      </span>
                    </div>
                    <p className="text-[#f5efe2]/90 text-sm md:text-base font-serif leading-relaxed select-text">
                      {highlight.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <hr className="border-stone-800 max-w-xl mx-auto" />

          {/* Voice Narrator Transcript Block */}
          <div className="max-w-2xl mx-auto bg-stone-950/80 border border-stone-850 p-6 md:p-8 rounded-2xl text-center space-y-6">
            <div className="inline-block border border-[#d5b45d]/20 bg-[#d5b45d]/5 p-2 rounded-full">
              <Volume2 className="h-6 w-6 text-[#d5b45d]" />
            </div>
            <h3 className="text-lg font-display font-semibold text-[#f5efe2] tracking-wide">The Bard's Narrative Script</h3>
            <blockquote className="font-serif italic text-base md:text-lg text-[#cbc3b5] leading-relaxed whitespace-pre-wrap select-text">
              {renderStyledScript(recap.narration)}
            </blockquote>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-stone-800 bg-black/40 flex items-center justify-between z-10 text-xs text-[#cbc3b5]/50 font-serif italic">
          <span>Persisted permanently in campaign history.</span>
          <span>Press ESC or close button to return to dashboard.</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
