import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Flame, Sparkles, MessageSquare, Shield,
  Volume2, Users, Send, RefreshCw, Wand2, Compass, AlertCircle, Bookmark, Scroll
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTavern, generateTavern, chatWithNpc, respondToFactionRecruitment, triggerTavernEvent } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { AmbientBackdrop } from "@/components/landing/LandingPrimitives";

export interface DialogueMessage {
  sender: 'player' | 'npc';
  text: string;
}

export interface Npc {
  id: string;
  name: string;
  role: string;
  faction: string;
  description: string;
  dialogue_history: DialogueMessage[];
  persistent_memories: string[];
  gossip_known: string;
}

export interface TavernRumor {
  text: string;
  credibility: 'High' | 'Moderate' | 'Unreliable';
  origin: string;
}

export interface FactionEncounter {
  id: string;
  faction: string;
  title: string;
  description: string;
  recruit_reward: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface TavernGossip {
  id: string;
  text: string;
  timestamp: string;
}

export function TavernPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const id = Number(campaignId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeNpc, setActiveNpc] = useState<Npc | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [latestTriggeredEvent, setLatestTriggeredEvent] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch tavern details
  const tavernQuery = useQuery({
    queryKey: ["campaignTavern", id],
    queryFn: () => getTavern(id),
    enabled: !!id,
  });

  const tavern = tavernQuery.data?.tavern;

  // Generate / Regenerate tavern mutation
  const generateMutation = useMutation({
    mutationFn: () => generateTavern(id),
    onSuccess: () => {
      setFeedback("The tavern has been woven anew in the storytelling cosmos.");
      queryClient.invalidateQueries({ queryKey: ["campaignTavern", id] });
    },
    onError: (err) => {
      setFeedback(getApiErrorMessage(err, "Failed to materialize the tavern."));
    }
  });

  // Chat with NPC mutation
  const chatMutation = useMutation({
    mutationFn: (data: { npcId: string; message: string }) =>
      chatWithNpc(id, data.npcId, data.message),
    onSuccess: (data) => {
      setChatPending(false);
      queryClient.invalidateQueries({ queryKey: ["campaignTavern", id] });
      // Update the active NPC in state to reflect dialogue history changes
      if (activeNpc) {
        const updatedNpc = data.tavern.npcs.find((n: Npc) => n.id === activeNpc.id);
        if (updatedNpc) {
          setActiveNpc(updatedNpc);
        }
      }
    },
    onError: (err) => {
      setChatPending(false);
      setFeedback(getApiErrorMessage(err, "The NPC remains silent. Dialogue failed."));
    }
  });

  // Respond to Faction recruitment mutation
  const respondFactionMutation = useMutation({
    mutationFn: (data: { encounterId: string; action: 'accept' | 'decline' }) =>
      respondToFactionRecruitment(id, data.encounterId, data.action),
    onSuccess: () => {
      setFeedback("Your faction alignment has shifted. Gossip ripples through the tavern.");
      queryClient.invalidateQueries({ queryKey: ["campaignTavern", id] });
    },
    onError: (err) => {
      setFeedback(getApiErrorMessage(err, "Failed to record your alignment."));
    }
  });

  // Trigger tavern event mutation
  const triggerEventMutation = useMutation({
    mutationFn: () => triggerTavernEvent(id),
    onSuccess: (data) => {
      setLatestTriggeredEvent(data.event);
      queryClient.invalidateQueries({ queryKey: ["campaignTavern", id] });
      // Clear splash event banner after 5 seconds
      setTimeout(() => {
        setLatestTriggeredEvent(null);
      }, 6000);
    },
    onError: (err) => {
      setFeedback(getApiErrorMessage(err, "Failed to stir up the tavern."));
    }
  });

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeNpc?.dialogue_history, chatPending]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeNpc || chatPending) return;

    const msg = chatInput.trim();
    setChatInput("");
    setChatPending(true);

    // Optimistically update dialogue history for immediate responsiveness
    const optimisticMessage: DialogueMessage = { sender: 'player', text: msg };
    setActiveNpc(prev => {
      if (!prev) return null;
      return {
        ...prev,
        dialogue_history: [...prev.dialogue_history, optimisticMessage]
      };
    });

    chatMutation.mutate({ npcId: activeNpc.id, message: msg });
  };

  // Get dynamic styles based on tavern ambience
  const getAmbienceStyles = (ambience: string) => {
    switch (ambience) {
      case "cozy_hearth":
        return {
          glow: "from-[#d5b45d]/10 via-[#ab211f]/5 to-transparent",
          border: "border-[#d5b45d]/20 hover:border-[#d5b45d]/40",
          particleColor: "bg-orange-500",
          ambienceBadge: "bg-[#d5b45d]/20 text-[#e9c97c] border-[#d5b45d]/30"
        };
      case "rowdy_brawl":
        return {
          glow: "from-[#ab211f]/15 via-red-950/10 to-transparent",
          border: "border-[#ab211f]/35 hover:border-[#ab211f]/50 shadow-[inset_0_0_15px_rgba(171,33,31,0.15)]",
          particleColor: "bg-red-500",
          ambienceBadge: "bg-[#ab211f]/25 text-red-300 border-[#ab211f]/40 animate-pulse"
        };
      case "mysterious_shadows":
        return {
          glow: "from-indigo-950/20 via-purple-950/10 to-transparent",
          border: "border-purple-500/20 hover:border-purple-500/45 shadow-[inset_0_0_20px_rgba(168,85,247,0.08)]",
          particleColor: "bg-purple-500",
          ambienceBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30"
        };
      case "lively_festival":
        return {
          glow: "from-amber-500/10 via-emerald-950/5 to-transparent",
          border: "border-emerald-500/20 hover:border-[#d5b45d]/40",
          particleColor: "bg-amber-400",
          ambienceBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        };
      default:
        return {
          glow: "from-stone-900/40 via-transparent to-transparent",
          border: "border-tavern-border hover:border-stone-700",
          particleColor: "bg-stone-500",
          ambienceBadge: "bg-stone-800 text-stone-300 border-stone-700"
        };
    }
  };

  const currentStyles = getAmbienceStyles(tavern?.ambience || "cozy_hearth");

  return (
    <section className="space-y-8 animate-in fade-in duration-500 relative min-h-screen pb-20 select-none">
      <AmbientBackdrop />

      {/* Floating Sparkles & Particles based on Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1] opacity-50">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full filter blur-[2px] ${currentStyles.particleColor} animate-ping`}
            style={{
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 4 + 4}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/campaigns")}
          className="border-tavern-border hover:bg-white/5 text-[#cbc3b5]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerEventMutation.mutate()}
            disabled={triggerEventMutation.isPending}
            className="border-[#d5b45d]/30 text-[#d5b45d] hover:bg-[#d5b45d]/10 gap-1.5 font-display text-xs uppercase tracking-wider"
          >
            <Compass className={`h-3.5 w-3.5 ${triggerEventMutation.isPending ? 'animate-spin' : ''}`} />
            Stir Up Tavern
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="border-tavern-border text-[#cbc3b5]/80 hover:bg-white/5 gap-1.5 text-xs uppercase"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Regen Tavern
          </Button>
        </div>
      </div>

      {/* Dynamic Event Splashing Banner */}
      <AnimatePresence>
        {latestTriggeredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="rounded-xl border border-[#ab211f]/40 bg-[#ab211f]/10 backdrop-blur-xl p-5 shadow-[0_0_30px_rgba(171,33,31,0.25)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-16 bg-[#d5b45d]/5 blur-md rounded-full" />
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-[#ab211f]/20 rounded-full border border-[#ab211f]/40 text-[#f5efe2]">
                <Volume2 className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d] font-bold">PROCEDURAL TAVERN EVENT TRIGGERS</span>
                <h4 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide">{latestTriggeredEvent.title}</h4>
                <p className="text-sm font-serif italic text-[#cbc3b5]/90 leading-relaxed">{latestTriggeredEvent.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {feedback && (
        <div className="rounded-md border border-[#d5b45d]/30 bg-[#d5b45d]/10 px-4 py-3 text-sm text-[#e9c97c] flex items-center justify-between">
          <span>{feedback}</span>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="text-[#cbc3b5] hover:text-[#f5efe2] h-6 px-2 text-xs">Dismiss</Button>
        </div>
      )}

      {/* loading indicator */}
      {tavernQuery.isLoading ? (
        <div className="space-y-6">
          <div className="h-96 rounded-xl border border-tavern-border bg-black/40 animate-pulse flex flex-col items-center justify-center">
            <Flame className="h-10 w-10 text-[#d5b45d] animate-bounce mb-3" />
            <span className="text-[#cbc3b5]/40 font-serif italic text-lg">Pushing open the heavy oak doors...</span>
          </div>
        </div>
      ) : !tavern ? (
        <Card className="border-dashed border-tavern-border bg-black/20 text-center py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(213,180,93,0.02),_transparent_60%)] pointer-events-none" />
          <Flame className="h-12 w-12 text-[#cbc3b5]/30 mx-auto mb-4" />
          <CardTitle className="text-2xl font-display text-[#f5efe2]">Tavern Is Sealed</CardTitle>
          <CardDescription className="text-base font-serif italic text-[#cbc3b5]/60 max-w-md mx-auto mt-2 leading-relaxed">
            The tavern has not been raised yet in this corner of the realm. Click the button to materialise your persistent social hub.
          </CardDescription>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="mt-6 bg-[#ab211f] hover:bg-[#8f1917] font-display uppercase tracking-widest text-xs">
            {generateMutation.isPending ? "Materialising..." : "Materialise Tavern"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Cinematic Tavern Header Banner */}
          <div className={`relative overflow-hidden rounded-2xl border ${currentStyles.border} bg-black/35 p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-500`}>
            <div className={`absolute top-0 right-0 p-40 bg-gradient-to-br ${currentStyles.glow} blur-[120px] rounded-full pointer-events-none z-[1]`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-[#d5b45d] bg-[#d5b45d]/10 px-3 py-1 rounded-full border border-[#d5b45d]/20">
                  <Flame className="h-3.5 w-3.5 animate-pulse" />
                  PERSISTENT CAMPAIGN TAVERN
                </span>
                <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${currentStyles.ambienceBadge}`}>
                  {tavern.ambience.replace('_', ' ')}
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-bold text-[#f5efe2] tracking-wide leading-tight">
                {tavern.name}
              </h2>
              
              <p className="text-[#cbc3b5]/90 font-serif italic text-base md:text-lg leading-relaxed max-w-4xl select-none">
                {tavern.description}
              </p>

              <div className="border-t border-stone-850 pt-4 mt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-[#cbc3b5]/60 font-serif">
                <span><strong className="text-[#d5b45d]">Establishment Mood:</strong> {tavern.world_state_evolution}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_380px]">
            {/* LEFT COLUMN: NPCs & Rumor Board */}
            <div className="space-y-8">
              {/* Tavern NPCs List */}
              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2 border-b border-stone-800 pb-3">
                  <Users className="h-5 w-5 text-[#d5b45d]" />
                  Active Tavern Patrons & NPCs
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {tavern.npcs?.map((npc: Npc) => (
                    <motion.div
                      key={npc.id}
                      whileHover={{ y: -3 }}
                      className="border border-tavern-border/55 bg-black/25 hover:bg-stone-900/20 hover:border-[#d5b45d]/35 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer"
                      onClick={() => setActiveNpc(npc)}
                    >
                      <div className="absolute top-0 right-0 p-16 bg-[#d5b45d]/0.5 blur-[30px] rounded-full pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-display font-bold text-[#f5efe2] tracking-wider leading-snug group-hover:text-[#d5b45d]">
                              {npc.name}
                            </h4>
                            <p className="text-xs uppercase tracking-widest text-[#d5b45d]/70 font-display mt-0.5">{npc.role}</p>
                          </div>
                          {npc.faction && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full scale-90">
                              {npc.faction}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-serif text-[#cbc3b5]/70 line-clamp-3 leading-relaxed">
                          {npc.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-850">
                        <span className="text-[10px] uppercase font-bold text-[#cbc3b5]/40 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {npc.dialogue_history.length > 1 ? `${npc.dialogue_history.length} lines exchanged` : "Unspoken"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#d5b45d] hover:text-[#e9c97c] h-7 px-2.5 text-xs font-display uppercase tracking-widest gap-1"
                        >
                          Talk
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Dynamic Rumor Board Scroll */}
              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2 border-b border-stone-800 pb-3">
                  <Bookmark className="h-5 w-5 text-[#d5b45d]" />
                  The Rumor Bulletin Board
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  {tavern.rumors?.map((rumor: TavernRumor, idx: number) => {
                    const getCredibilityBadge = (cred: string) => {
                      switch (cred) {
                        case 'High': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        case 'Moderate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        case 'Unreliable':
                        default:
                          return 'bg-[#ab211f]/20 text-[#fca5a5] border-[#ab211f]/30';
                      }
                    };
                    return (
                      <div
                        key={idx}
                        className="bg-black/45 border border-tavern-border/40 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-stone-800 transition-colors relative overflow-hidden"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-[#d5b45d]/60 font-display">RUMOR #{idx + 1}</span>
                            <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full border ${getCredibilityBadge(rumor.credibility)}`}>
                              {rumor.credibility}
                            </span>
                          </div>
                          <p className="text-sm font-serif italic text-[#cbc3b5]/90 leading-relaxed pl-2 border-l border-[#d5b45d]/20">
                            "{rumor.text}"
                          </p>
                        </div>
                        <div className="text-[10px] text-[#cbc3b5]/40 font-serif text-right border-t border-stone-850 pt-2">
                          — {rumor.origin}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Faction Quests & Rolling Gossip Feed */}
            <div className="space-y-8">
              {/* Faction recruitment scroll */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2 border-b border-stone-800 pb-3">
                  <Shield className="h-4.5 w-4.5 text-[#d5b45d]" />
                  Faction Recruitment Desk
                </h3>

                {tavern.faction_encounters?.map((enc: FactionEncounter) => (
                  <div
                    key={enc.id}
                    className="border border-[#d5b45d]/20 bg-black/40 rounded-xl p-5 space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-20 bg-[#d5b45d]/1 blur-[35px] rounded-full pointer-events-none" />
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#d5b45d]">{enc.faction}</span>
                        {enc.status !== 'pending' && (
                          <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full border ${enc.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
                            {enc.status}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-display font-bold text-[#f5efe2] tracking-wide">{enc.title}</h4>
                      <p className="text-xs font-serif text-[#cbc3b5]/80 leading-relaxed">{enc.description}</p>
                    </div>

                    <div className="border-t border-[#d5b45d]/10 pt-3 text-[11px] font-serif text-[#cbc3b5]/75">
                      <span className="text-[#d5b45d] font-bold">Reward/Terms:</span> {enc.recruit_reward}
                    </div>

                    {enc.status === 'pending' && (
                      <div className="flex gap-2 pt-1.5">
                        <Button
                          size="sm"
                          onClick={() => respondFactionMutation.mutate({ encounterId: enc.id, action: 'accept' })}
                          className="flex-1 bg-[#ab211f] hover:bg-[#8f1917] text-white text-xs uppercase font-display tracking-wider"
                        >
                          Sign Contract
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondFactionMutation.mutate({ encounterId: enc.id, action: 'decline' })}
                          className="border-tavern-border text-[#cbc3b5] hover:bg-white/5 text-xs uppercase font-display"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Rolling Gossip Medieval Feed */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2 border-b border-stone-800 pb-3">
                  <Scroll className="h-4.5 w-4.5 text-[#d5b45d]" />
                  Town Gossip Ticker
                </h3>

                <div className="border border-tavern-border/50 bg-black/30 rounded-xl p-4 space-y-4 max-h-[300px] overflow-y-auto">
                  {tavern.gossip_feed?.length > 0 ? (
                    tavern.gossip_feed.map((gos: TavernGossip) => (
                      <div key={gos.id} className="border-b border-stone-900 last:border-b-0 pb-3 last:pb-0 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-[#cbc3b5]/45">
                          <span className="font-serif">Whispered news...</span>
                          <span>{gos.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#cbc3b5]/85 leading-relaxed font-serif">
                          {gos.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="italic font-serif text-[#cbc3b5]/40 text-xs w-full text-center block">Tavern is quiet today. No rolling gossip yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NPC Chat Side Drawer Modal */}
      <AnimatePresence>
        {activeNpc && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-[#181512] border-l border-tavern-border relative flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.85)] rounded-l-2xl overflow-hidden"
            >
              {/* Background glowing textures */}
              <div className="absolute top-0 left-0 w-full p-28 bg-[#d5b45d]/2 blur-[80px] rounded-full pointer-events-none z-[1]" />
              
              {/* Modal Header */}
              <header className="border-b border-tavern-border px-6 py-5 flex items-center justify-between relative z-10 bg-black/30">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#d5b45d]">{activeNpc.role}</span>
                  <h4 className="text-2xl font-display font-bold text-[#f5efe2] tracking-wider">{activeNpc.name}</h4>
                  {activeNpc.faction && (
                    <p className="text-xs text-[#cbc3b5]/60 flex items-center gap-1.5 font-serif italic">
                      <Shield className="h-3.5 w-3.5 text-[#d5b45d]/70" />
                      Sworn Ally: {activeNpc.faction}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setActiveNpc(null)}
                  className="text-[#cbc3b5] hover:text-[#f5efe2] h-8 w-8 p-0 rounded-full hover:bg-stone-850"
                >
                  ✕
                </Button>
              </header>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-10">
                {/* Character visual descriptor block */}
                <div className="bg-black/35 rounded-xl border border-tavern-border/40 p-4 space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#d5b45d]/70 font-display">INSPECT DETAILS</span>
                  <p className="text-xs font-serif leading-relaxed text-[#cbc3b5]/85">{activeNpc.description}</p>
                </div>

                {/* dialogue thread */}
                <div className="space-y-4">
                  <span className="text-[9px] uppercase tracking-widest text-[#d5b45d]/70 font-display block">CONVERSATION</span>
                  
                  <div className="space-y-4">
                    {activeNpc.dialogue_history.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] ${msg.sender === 'player' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[8px] uppercase tracking-widest text-[#cbc3b5]/40 mb-1">
                          {msg.sender === 'player' ? 'You' : activeNpc.name}
                        </span>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm font-serif leading-relaxed border ${
                            msg.sender === 'player'
                              ? 'bg-[#ab211f]/15 border-[#ab211f]/35 text-[#f5efe2] rounded-tr-none'
                              : 'bg-black/50 border-tavern-border text-[#cbc3b5]/90 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {/* NPC typing simulation */}
                    {chatPending && (
                      <div className="flex flex-col max-w-[85%] mr-auto items-start animate-pulse">
                        <span className="text-[8px] uppercase tracking-widest text-[#cbc3b5]/40 mb-1">
                          {activeNpc.name}
                        </span>
                        <div className="rounded-2xl px-4 py-2.5 text-sm font-serif italic text-[#cbc3b5]/50 border bg-black/50 border-tavern-border rounded-tl-none">
                          Thinking and whispering secrets...
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Persistent Memories known by NPC */}
                {activeNpc.persistent_memories && activeNpc.persistent_memories.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-stone-900">
                    <span className="text-[9px] uppercase tracking-widest text-[#d5b45d]/70 font-display block">NPC PERSISTENT MEMORIES</span>
                    <ul className="space-y-2">
                      {activeNpc.persistent_memories.map((mem, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-xs font-serif text-[#cbc3b5]/75 leading-relaxed bg-[#d5b45d]/5 border border-[#d5b45d]/10 rounded-lg p-2.5">
                          <Bookmark className="h-4 w-4 shrink-0 text-[#d5b45d] mt-0.5" />
                          <span>{mem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Chat Input Bar Footer */}
              <footer className="border-t border-tavern-border px-6 py-4 relative z-10 bg-black/35">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Whisper details or ask ${activeNpc.name} questions...`}
                    disabled={chatPending}
                    className="flex-1 bg-black/60 border border-tavern-border rounded-lg px-4 py-2.5 text-sm text-[#f5efe2] placeholder-[#cbc3b5]/40 focus:ring-1 focus:ring-[#d5b45d]/40 focus:border-[#d5b45d]/40 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={chatPending || !chatInput.trim()}
                    className="bg-[#ab211f] hover:bg-[#8f1917] text-white p-2.5 rounded-lg border border-[#ab211f]/45"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
