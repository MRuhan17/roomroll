import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decodeCampaignId } from '@/lib/campaignId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, History, Play, Sparkles, Flame, Clock, 
  RefreshCw, MessageSquare, ChevronRight, Wand2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionRecaps, generateSessionRecap } from '@/services/campaigns';
import { getApiErrorMessage } from '@/services/api';
import { SessionRecapCinematic } from '@/components/campaign/SessionRecapCinematic';
import { AmbientBackdrop } from '@/components/landing/LandingPrimitives';

export function SessionRecapsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = decodeCampaignId(campaignId);

  const [selectedRecap, setSelectedRecap] = useState<any | null>(null);
  const [regeneratingSessionId, setRegeneratingSessionId] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('dramatic');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch all past session logs/recaps
  const recapsQuery = useQuery({
    queryKey: ['sessionRecaps', id],
    queryFn: () => getSessionRecaps(id),
    enabled: !!id,
  });

  // Regenerate recap mutation
  const regenerateMutation = useMutation({
    mutationFn: (data: { sessionId: string; tone: string }) => 
      generateSessionRecap(id, data.sessionId, data.tone),
    onSuccess: (data) => {
      setFeedback("Cinematic recap successfully woven anew.");
      queryClient.invalidateQueries({ queryKey: ['sessionRecaps', id] });
      setRegeneratingSessionId(null);
      // Automatically show the newly generated recap
      if (data.recap) {
        setSelectedRecap(data.recap);
      }
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "The magic failed. Could not weave the recap."));
      setRegeneratingSessionId(null);
    }
  });

  const handleRegenerate = (sessionId: string, tone: string) => {
    setRegeneratingSessionId(sessionId);
    regenerateMutation.mutate({ sessionId, tone });
  };

  const getToneBadgeClass = (tone: string) => {
    switch (tone?.toLowerCase()) {
      case 'heroic': return 'bg-[#d5b45d]/20 text-[#e9c97c] border-[#d5b45d]/30';
      case 'horror': return 'bg-[#ab211f]/20 text-[#fca5a5] border-[#ab211f]/30';
      case 'mysterious': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'tragic': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'dramatic':
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    }
  };

  const recaps = recapsQuery.data?.recaps || [];
  const latestRecap = recaps[0];
  const pastRecaps = recaps.slice(1);

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-screen pb-16">
      <AmbientBackdrop />

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/campaigns`)}
          className="border-tavern-border hover:bg-white/5 text-[#cbc3b5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>

      {/* Main Banner */}
      <div className="relative overflow-hidden rounded-xl border border-tavern-border/30 bg-black/40 p-6 md:p-8">
        <div className="absolute top-0 right-0 p-32 bg-[#d5b45d]/2 blur-[80px] rounded-full pointer-events-none" />
        <h1 className="text-4xl font-display font-bold tracking-wide text-[#f5efe2] flex items-center gap-3">
          <History className="h-8 w-8 text-[#d5b45d] animate-pulse" />
          The Chronicles of Memory
        </h1>
        <p className="mt-2 text-[#cbc3b5]/70 font-serif italic text-lg max-w-2xl leading-relaxed">
          Relive your legendary moments, catastrophic failures, and emotional choices through AI-powered bards and cinematic prose.
        </p>
      </div>

      {feedback && (
        <div className="rounded-md border border-[#d5b45d]/30 bg-[#d5b45d]/10 px-4 py-3 text-sm text-[#e9c97c] flex items-center justify-between animate-in fade-in duration-300">
          <span>{feedback}</span>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="text-[#cbc3b5] hover:text-[#f5efe2] h-6 px-2 text-xs">Dismiss</Button>
        </div>
      )}

      {recapsQuery.isLoading ? (
        <div className="space-y-6">
          <div className="h-80 rounded-xl border border-tavern-border bg-black/40 animate-pulse flex flex-col items-center justify-center">
            <span className="text-[#cbc3b5]/40 font-serif italic">Unrolling the ancient chronicles...</span>
          </div>
        </div>
      ) : recaps.length === 0 ? (
        <Card className="border-dashed border-tavern-border bg-black/20 text-center py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(213,180,93,0.02),_transparent_60%)] pointer-events-none" />
          <div className="rounded-full bg-stone-900/50 p-4 inline-block mb-4 border border-stone-800">
            <History className="h-8 w-8 text-[#cbc3b5]/50" />
          </div>
          <CardTitle className="text-2xl font-display text-[#f5efe2]">No Chronicles Recorded Yet</CardTitle>
          <CardDescription className="text-base font-serif italic text-[#cbc3b5]/60 max-w-md mx-auto mt-2 leading-relaxed">
            Your journey has just begun. Once the first session is completed and brought to an end by the Dungeon Master, an epic narrative will appear here.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Latest Session Showcase (Hero Card) */}
          {latestRecap && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl border border-tavern-border bg-black/35 hover:border-[#d5b45d]/40 transition-all duration-300 p-6 md:p-8 overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 p-32 bg-[#ab211f]/3 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-24 bg-[#d5b45d]/2 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#d5b45d] bg-[#d5b45d]/10 px-3 py-1 rounded-full border border-[#d5b45d]/20">
                      <Flame className="h-3.5 w-3.5 animate-pulse" />
                      LATEST ADVENTURE
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${getToneBadgeClass(latestRecap.tone)}`}>
                      {latestRecap.tone} TONE
                    </span>
                    <span className="text-xs text-[#cbc3b5]/50 flex items-center gap-1.5 ml-2">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(latestRecap.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-display font-bold text-[#f5efe2] tracking-wide leading-tight">
                    {latestRecap.title}
                  </h2>
                  
                  <p className="text-[#cbc3b5]/85 font-serif italic text-base md:text-lg leading-relaxed max-w-3xl line-clamp-3 select-none">
                    {latestRecap.summary}
                  </p>

                  {/* Highlights preview */}
                  {latestRecap.highlights && latestRecap.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {latestRecap.highlights.slice(0, 3).map((hl: any, i: number) => (
                        <span key={i} className="text-xs font-serif bg-stone-900/70 border border-stone-850 px-3 py-1 rounded-lg text-[#cbc3b5]/80">
                          • {hl.description.length > 40 ? hl.description.substring(0, 40) + '...' : hl.description}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Button 
                      size="lg" 
                      onClick={() => setSelectedRecap(latestRecap)}
                      className="bg-[#ab211f] hover:bg-[#8f1917] text-white shadow-[0_0_25px_rgba(171,33,31,0.35)] font-display uppercase tracking-widest text-sm"
                    >
                      <Play className="mr-2 h-4 w-4" fill="currentColor" />
                      Begin Cinematic Recap
                    </Button>

                    {/* Tone selectors & Regenerator */}
                    <div className="flex items-center gap-2 border border-stone-800 bg-stone-950/60 p-1.5 rounded-lg">
                      <select 
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="bg-transparent text-xs text-[#cbc3b5] border-none focus:ring-0 cursor-pointer pr-8 font-display uppercase"
                        disabled={regeneratingSessionId === latestRecap.sessionId}
                      >
                        <option value="dramatic" className="bg-stone-950">Dramatic</option>
                        <option value="heroic" className="bg-stone-950">Heroic</option>
                        <option value="mysterious" className="bg-stone-950">Mysterious</option>
                        <option value="tragic" className="bg-stone-950">Tragic</option>
                        <option value="horror" className="bg-stone-950">Horror</option>
                      </select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={regeneratingSessionId === latestRecap.sessionId}
                        onClick={() => handleRegenerate(latestRecap.sessionId, selectedTone)}
                        className="h-7 text-xs text-[#cbc3b5] hover:text-[#f5efe2] hover:bg-stone-800 gap-1.5 px-2.5"
                      >
                        {regeneratingSessionId === latestRecap.sessionId ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#d5b45d]" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5 text-[#d5b45d]" />
                        )}
                        <span>{regeneratingSessionId === latestRecap.sessionId ? "Weaving..." : "Regenerate Recap"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Past Chronicle Chapters Timeline List */}
          {pastRecaps.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2 border-b border-stone-800 pb-3">
                <History className="h-5 w-5 text-[#d5b45d]" />
                Past Chronicles & Chapters
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {pastRecaps.map((recap, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    key={recap.id}
                    className="border border-tavern-border/40 bg-black/25 hover:bg-black/40 hover:border-[#d5b45d]/35 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-16 bg-[#d5b45d]/0.5 blur-[40px] rounded-full pointer-events-none" />

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#cbc3b5]/60 font-serif">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(recap.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${getToneBadgeClass(recap.tone)} scale-90`}>
                          {recap.tone}
                        </span>
                      </div>

                      <h4 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide group-hover:text-[#d5b45d] transition-colors leading-snug">
                        {recap.title}
                      </h4>

                      <p className="text-sm font-serif text-[#cbc3b5]/70 line-clamp-3 select-none leading-relaxed">
                        {recap.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-850">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecap(recap)}
                        className="text-[#d5b45d] hover:text-[#e9c97c] hover:bg-stone-850 px-2 h-8 text-xs font-display uppercase tracking-wider"
                      >
                        Replay Recap
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>

                      {/* regeneration select for older logs */}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={regeneratingSessionId === recap.sessionId}
                        onClick={() => handleRegenerate(recap.sessionId, 'dramatic')}
                        className="h-8 text-[11px] text-[#cbc3b5]/60 hover:text-[#f5efe2] hover:bg-stone-850"
                      >
                        {regeneratingSessionId === recap.sessionId ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1 text-[#d5b45d]" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Regen
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cinematic Modal Player Overlay */}
      <AnimatePresence>
        {selectedRecap && (
          <SessionRecapCinematic
            recap={selectedRecap}
            onClose={() => setSelectedRecap(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
