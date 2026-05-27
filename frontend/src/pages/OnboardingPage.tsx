import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encodeCampaignId } from "@/lib/campaignId";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Sparkles, 
  Sword, 
  BookOpen, 
  Shield,
  ArrowRight,
  ArrowLeft,
  BookOpenText,
  Wand2,
  Skull,
  Crown,
  Compass,
  Heart,
  Swords,
  EyeOff,
  MapPin,
  Target,
  ShieldAlert
} from "lucide-react";
import { Reveal, AmbientBackdrop, SurfaceCard, Embers } from "@/components/landing/LandingPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign, joinCampaign } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { login } from "@/services/auth";

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [step, setStep] = useState<"choice" | "create" | "join">("choice");
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [createName, setCreateName] = useState("");
  const [createWorld, setCreateWorld] = useState("");
  const [playMode, setPlayMode] = useState<"human_dm" | "player_only" | "ai_dm">("human_dm");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reforge session states
  const [showReforgeModal, setShowReforgeModal] = useState(false);
  const [reforgePassword, setReforgePassword] = useState("");
  const [reforgeError, setReforgeError] = useState<string | null>(null);
  const [isReforging, setIsReforging] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Storyteller parameters
  const [genre, setGenre] = useState("High Fantasy");
  const [tone, setTone] = useState("serious");
  const [storyFootnotes, setStoryFootnotes] = useState("");
  
  // Story Guidance states
  const [locations, setLocations] = useState("");
  const [forbiddenLore, setForbiddenLore] = useState("");
  const [objectives, setObjectives] = useState("");
  const [villains, setVillains] = useState("");
  const [conflicts, setConflicts] = useState("");
  const [themes, setThemes] = useState("");

  // Campaign pacing and duration states
  const [targetSessions, setTargetSessions] = useState<number>(5);
  const [customSessions, setCustomSessions] = useState<string>("");
  const [pacingIntensity, setPacingIntensity] = useState<'auto' | 'slow' | 'balanced' | 'fast'>("balanced");

  const handleReforgeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !reforgePassword) return;
    setIsReforging(true);
    setReforgeError(null);
    try {
      const response = await login({ email: user.email, password: reforgePassword });
      setAuth(response.user, response.token);
      setShowReforgeModal(false);
      setReforgePassword("");
      setError(null);
      
      // Auto-retry forging!
      if (step === "create") {
        createMutation.mutate({ 
          name: createName, 
          worldType: createWorld || genre, 
          playMode,
          genre,
          tone,
          storyFootnotes,
          guidance: {
            important_locations: locations,
            forbidden_lore: forbiddenLore,
            campaign_objectives: objectives,
            recurring_villains: villains,
            faction_conflicts: conflicts,
            emotional_themes: themes
          },
          targetSessions,
          pacingIntensity
        });
      } else if (step === "join" && joinCode) {
        joinMutation.mutate(joinCode);
      }
    } catch (err) {
      setReforgeError(getApiErrorMessage(err, "Verification failed. Try again."));
    } finally {
      setIsReforging(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: { 
      name: string; 
      worldType: string; 
      playMode: "human_dm" | "player_only" | "ai_dm";
      genre: string;
      tone: string;
      storyFootnotes: string;
      guidance: {
        important_locations?: string;
        forbidden_lore?: string;
        campaign_objectives?: string;
        recurring_villains?: string;
        faction_conflicts?: string;
        emotional_themes?: string;
      };
      targetSessions: number;
      pacingIntensity: 'auto' | 'slow' | 'balanced' | 'fast';
    }) =>
      createCampaign(
        data.name, 
        "", 
        data.worldType, 
        data.playMode, 
        data.genre, 
        data.tone, 
        data.storyFootnotes, 
        data.guidance,
        data.targetSessions,
        data.pacingIntensity
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      navigate(`/campaigns/${encodeCampaignId(data.campaign.id)}/setup`);
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Could not forge world.");
      if (msg.toLowerCase().includes("invalid or expired token") || msg.toLowerCase().includes("unauthorized")) {
        setError("The connection to the world archive was lost. Reforging your session...");
        setShowReforgeModal(true);
      } else {
        setError(msg);
      }
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCampaign(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      navigate(`/campaigns`);
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Could not find campaign.");
      if (msg.toLowerCase().includes("invalid or expired token") || msg.toLowerCase().includes("unauthorized")) {
        setError("The connection to the world archive was lost. Reforging your session...");
        setShowReforgeModal(true);
      } else {
        setError(msg);
      }
    },
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-[#f5efe2] flex flex-col items-center justify-center p-6">
      <AmbientBackdrop />
      <Embers />
      
      <div className="relative z-10 w-full max-w-3xl">
        {step === "choice" && (
          <div className="text-center space-y-12">
            <Reveal>
              <div className="flex justify-center mb-6">
                <Sparkles className="h-12 w-12 text-[#d5b45d] animate-pulse" />
              </div>
              <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tight text-[#f6f2e8]">
                Welcome, <span className="text-[#d5b45d]">{user?.displayName || "Traveler"}</span>
              </h1>
              <p className="mt-6 text-xl text-[#d6d1c8]/80 max-w-lg mx-auto leading-relaxed">
                Your journey begins here. How will you enter the realm?
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2">
              <Reveal delay={0.1}>
                <SurfaceCard 
                  className="p-8 group cursor-pointer hover:border-[#d5b45d]/50 transition-all duration-500 hover:-translate-y-1"
                  onClick={() => setStep("create")}
                >
                  <Plus className="h-8 w-8 text-[#d5b45d] mb-6 group-hover:scale-110 transition-transform" />
                  <h2 className="font-display text-2xl uppercase text-[#f4ecdd]">Forge a World</h2>
                  <p className="mt-4 text-[#cbc3b5]/70 leading-relaxed">
                    Become the Architect. Lead your own campaigns as a Dungeon Master or set up an autonomous AI-driven realm.
                  </p>
                </SurfaceCard>
              </Reveal>

              <Reveal delay={0.2}>
                <SurfaceCard 
                  className="p-8 group cursor-pointer hover:border-[#87a8ff]/50 transition-all duration-500 hover:-translate-y-1"
                  onClick={() => setStep("join")}
                >
                  <Search className="h-8 w-8 text-[#87a8ff] mb-6 group-hover:scale-110 transition-transform" />
                  <h2 className="font-display text-2xl uppercase text-[#f4ecdd]">Join a Party</h2>
                  <p className="mt-4 text-[#cbc3b5]/70 leading-relaxed">
                    Step into an existing story. Enter a secret invite code to begin.
                  </p>
                </SurfaceCard>
              </Reveal>
            </div>
            
            <Reveal delay={0.3}>
                <button 
                    onClick={() => navigate('/campaigns')}
                    className="text-[0.7rem] uppercase tracking-[0.4em] text-[#8e8778] hover:text-[#f4efe3] transition-colors"
                >
                    Or explore the dashboard first
                </button>
            </Reveal>
          </div>
        )}

        {step === "create" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-4xl w-full mx-auto"
          >
            <div className="text-center mb-2">
              <Shield className="h-10 w-10 text-[#d5b45d] mx-auto mb-3" />
              <h2 className="font-display text-4xl uppercase text-[#f6f2e8] tracking-widest">World Forging</h2>
              <p className="text-[#d6d1c8]/60 mt-1 max-w-lg mx-auto text-xs">
                {createStep === 1 && "Phase I: Breathe life and style into your fantasy realm"}
                {createStep === 2 && "Phase II: Detail footnotes, objectives, secrets, and villains"}
                {createStep === 3 && "Phase III: Bind play roles and unleash your campaign"}
              </p>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="flex justify-between items-center max-w-md mx-auto mb-8 relative px-4">
              <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-[#1a1710] -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-6 h-0.5 bg-[#d5b45d] -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((createStep - 1) / 2) * 92}%` }}
              />
              {[1, 2, 3].map((num) => (
                <div 
                  key={num} 
                  onClick={() => {
                    if (createName || num < createStep) {
                      setCreateStep(num as 1 | 2 | 3);
                    }
                  }}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-display text-sm border transition-all duration-500 cursor-pointer ${
                    createStep >= num 
                      ? "bg-[#0c0a07] border-[#d5b45d] text-[#d5b45d] shadow-[0_0_12px_rgba(213,180,93,0.4)]" 
                      : "bg-[#0c0a07] border-[#2d281e] text-[#5c5443] hover:border-[#5c5443]"
                  }`}
                >
                  {num === 1 && <Wand2 className="h-4 w-4" />}
                  {num === 2 && <BookOpenText className="h-4 w-4" />}
                  {num === 3 && <Shield className="h-4 w-4" />}
                </div>
              ))}
            </div>

            <SurfaceCard className="p-8 border-[#211d15] bg-black/40 backdrop-blur-md">
              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (createStep < 3) {
                    if (createStep === 1 && !createName.trim()) {
                      setError("Campaign name is required.");
                      return;
                    }
                    setError(null);
                    setCreateStep((prev) => (prev + 1) as 1 | 2 | 3);
                  } else {
                    if (createName) {
                      createMutation.mutate({ 
                        name: createName, 
                        worldType: createWorld || genre, 
                        playMode,
                        genre,
                        tone,
                        storyFootnotes,
                        guidance: {
                          important_locations: locations,
                          forbidden_lore: forbiddenLore,
                          campaign_objectives: objectives,
                          recurring_villains: villains,
                          faction_conflicts: conflicts,
                          emotional_themes: themes
                        },
                        targetSessions,
                        pacingIntensity
                      });
                    }
                  }
                }}
              >
                {/* STEP 1: SPARK OF CREATION */}
                {createStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Campaign Title</Label>
                        <Input 
                          placeholder="e.g. The Obsidian Spire" 
                          className="bg-black/60 border-[#2d281e] h-12 text-lg focus:border-[#d5b45d]/50 focus:ring-1 focus:ring-[#d5b45d]/20 transition-all text-[#f4efe3]"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">World Setting / Concept</Label>
                        <Input 
                          placeholder="e.g. Broken Continent of Aethelgard" 
                          className="bg-black/60 border-[#2d281e] h-12 focus:border-[#d5b45d]/50 focus:ring-1 focus:ring-[#d5b45d]/20 transition-all text-[#f4efe3]"
                          value={createWorld}
                          onChange={(e) => setCreateWorld(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d] block">Campaign Genre / Narrative Style</Label>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {[
                          { name: "High Fantasy", icon: Crown, desc: "✨ Majestic magic, ancient lore, and heroic legends" },
                          { name: "Dark Fantasy", icon: Swords, desc: "⚔️ Gritty combat, heavy moral choices, and grim odds" },
                          { name: "Horror / Gothic", icon: Skull, desc: "👁️ Whispering shadows, sanity checks, and lurking dread" },
                          { name: "Political Intrigue", icon: Shield, desc: "🏛️ Secret alliances, noble betrayals, and high stakes" },
                          { name: "Wilderness Survival", icon: Compass, desc: "🌲 Scarce resources, fierce weather, and untamed wilds" },
                          { name: "Ancient Ruins Exploration", icon: BookOpen, desc: "🏰 Forgotten dungeons, lost history, and mythic traps" },
                        ].map((g) => {
                          const IconComponent = g.icon;
                          return (
                            <div
                              key={g.name}
                              onClick={() => setGenre(g.name)}
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                                genre === g.name
                                  ? "bg-[#d5b45d]/5 border-[#d5b45d] shadow-[0_0_12px_rgba(213,180,93,0.1)]"
                                  : "bg-black/50 border-[#211d15] hover:border-[#cbc3b5]/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <IconComponent className={`h-4 w-4 ${genre === g.name ? "text-[#d5b45d]" : "text-[#8e8778]"}`} />
                                <h4 className="font-display text-xs uppercase tracking-wide text-[#f4ecdd]">{g.name}</h4>
                              </div>
                              <p className="text-[10px] text-[#cbc3b5]/60 leading-relaxed">{g.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d] block">Campaign Tone</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "serious", label: "🎭 Serious & Dramatic" },
                          { id: "mysterious", label: "👁️ Mysterious & Gothic" },
                          { id: "brutal", label: "💀 Brutal & Grim" },
                          { id: "emotional", label: "❤️ Emotional & Character-driven" },
                          { id: "chaotic", label: "🔥 Chaotic & High-action" },
                          { id: "comedic", label: "🍺 Lighthearted & Comedic" }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTone(t.id)}
                            className={`px-4 py-2 rounded-full border text-xs tracking-wider font-display uppercase transition-all duration-300 ${
                              tone === t.id
                                ? "bg-[#d5b45d]/10 border-[#d5b45d] text-[#d5b45d] shadow-[0_0_10px_rgba(213,180,93,0.15)]"
                                : "bg-black/60 border-[#211d15] text-[#8e8778] hover:border-[#cbc3b5]/30 hover:text-white"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: STORY FOOTNOTES & FORBIDDEN LORE */}
                {createStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-4 rounded-lg bg-[#d5b45d]/5 border border-[#d5b45d]/20 flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-[#d5b45d] shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-[#f4efe3]">Co-Storyteller Integration Active</p>
                        <p className="text-[#cbc3b5]/70 leading-relaxed">
                          Detail your custom lore, hidden secrets, planned twists, and villain traits below. 
                          The AI Dungeon Master will respect and weave these footnotes directly into the narrative 
                          pacing, NPC motives, and quest rewards, without spoiling them for players.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Story Footnotes & Campaign Secrets</Label>
                      <textarea
                        placeholder="e.g. The mysterious merchant Eloth is secretly Baron Vance in disguise. The crown players seek is actually cursed to attract ghouls. Faction X hates Faction Y because of the ancient Betrayal of Oakhaven..."
                        className="w-full bg-black/60 border border-[#2d281e] rounded-lg p-4 min-h-[120px] text-xs focus:border-[#d5b45d]/50 focus:ring-1 focus:ring-[#d5b45d]/20 transition-all text-[#f4efe3] leading-relaxed resize-none"
                        value={storyFootnotes}
                        onChange={(e) => setStoryFootnotes(e.target.value)}
                      />
                    </div>

                    <div className="border-t border-[#211d15] pt-5 space-y-4">
                      <h4 className="font-display text-xs uppercase tracking-[0.2em] text-[#cbc3b5] flex items-center gap-2">
                        <BookOpenText className="h-4 w-4 text-[#d5b45d]" />
                        Advanced Narrative Guidance (Optional)
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-[#d5b45d]/70" /> Important Locations
                          </Label>
                          <Input 
                            placeholder="e.g. Shadowed Crypts, High Citadel" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={locations}
                            onChange={(e) => setLocations(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <EyeOff className="h-3 w-3 text-[#d5b45d]/70" /> Forbidden Lore / Secrets
                          </Label>
                          <Input 
                            placeholder="e.g. The King is a vampire, dragons exist" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={forbiddenLore}
                            onChange={(e) => setForbiddenLore(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-[#d5b45d]/70" /> Campaign Objectives
                          </Label>
                          <Input 
                            placeholder="e.g. Recover the 3 Sun Shards" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={objectives}
                            onChange={(e) => setObjectives(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <Skull className="h-3 w-3 text-[#d5b45d]/70" /> Recurring Villains
                          </Label>
                          <Input 
                            placeholder="e.g. Malakor the Undying, Baron Vance" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={villains}
                            onChange={(e) => setVillains(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <Swords className="h-3 w-3 text-[#d5b45d]/70" /> Faction Conflicts
                          </Label>
                          <Input 
                            placeholder="e.g. Iron Crown vs Whispering Order" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={conflicts}
                            onChange={(e) => setConflicts(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-[#8e8778] flex items-center gap-1.5">
                            <Heart className="h-3 w-3 text-[#d5b45d]/70" /> Emotional Themes
                          </Label>
                          <Input 
                            placeholder="e.g. Hope, sacrifice, tragedy" 
                            className="bg-black/60 border-[#211d15] h-9 text-xs focus:border-[#d5b45d]/30 text-[#f4efe3]"
                            value={themes}
                            onChange={(e) => setThemes(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PLAY MODE & BINDING */}
                {createStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Compact Campaign Details Summary */}
                    <div className="p-4 rounded-lg bg-black/60 border border-[#211d15] flex flex-col sm:flex-row justify-between gap-4 text-xs">
                      <div>
                        <span className="text-[9px] text-[#8e8778] uppercase tracking-wider">Campaign Name</span>
                        <h4 className="font-display text-[#f4efe3] font-semibold text-sm uppercase">{createName}</h4>
                        {createWorld && <p className="text-[10px] text-[#cbc3b5]/60 mt-0.5">{createWorld}</p>}
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[9px] text-[#8e8778] uppercase tracking-wider block">Genre</span>
                          <span className="px-2 py-0.5 rounded bg-[#d5b45d]/10 border border-[#d5b45d]/20 text-[#d5b45d] text-[10px] tracking-wide font-display uppercase">{genre}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#8e8778] uppercase tracking-wider block">Tone</span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#cbc3b5] text-[10px] tracking-wide font-display uppercase">{tone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Select Play Mode & Dungeon Master Role</Label>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div 
                          onClick={() => setPlayMode("human_dm")}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                            playMode === "human_dm" 
                              ? "bg-[#d5b45d]/5 border-[#d5b45d] shadow-[0_0_15px_rgba(213,180,93,0.15)]" 
                              : "bg-black/40 border-[#211d15] hover:border-[#cbc3b5]/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Shield className="h-5 w-5 text-[#d5b45d]" />
                              <span className="text-[8px] font-semibold bg-[#d5b45d]/20 text-[#d5b45d] px-2 py-0.5 rounded-full tracking-wider uppercase">Classic</span>
                            </div>
                            <h4 className="font-display text-sm uppercase text-[#f4ecdd] mb-1">Play as DM</h4>
                            <p className="text-[11px] text-[#cbc3b5]/60 leading-normal">
                              You act as the Dungeon Master, with AI assistants generating lore, story prep boards, and dialogues.
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#d5b45d]/10 flex flex-wrap gap-1">
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#d5b45d]/10">DM Dashboard</span>
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#d5b45d]/10">AI Assisted</span>
                          </div>
                        </div>

                        <div 
                          onClick={() => setPlayMode("player_only")}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                            playMode === "player_only" 
                              ? "bg-[#87a8ff]/5 border-[#87a8ff] shadow-[0_0_15px_rgba(135,168,255,0.15)]" 
                              : "bg-black/40 border-[#211d15] hover:border-[#cbc3b5]/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Sword className="h-5 w-5 text-[#87a8ff]" />
                              <span className="text-[8px] font-semibold bg-[#87a8ff]/20 text-[#87a8ff] px-2 py-0.5 rounded-full tracking-wider uppercase">Spoiler Free</span>
                            </div>
                            <h4 className="font-display text-sm uppercase text-[#f4ecdd] mb-1">Play as Player</h4>
                            <p className="text-[11px] text-[#cbc3b5]/60 leading-normal">
                              You play as a Character. You can invite a friend to DM, or run with zero spoilers and dynamic quest hooks.
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#87a8ff]/10 flex flex-wrap gap-1">
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#87a8ff]/10">Character Sheet</span>
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#87a8ff]/10">Spoiler Protected</span>
                          </div>
                        </div>

                        <div 
                          onClick={() => setPlayMode("ai_dm")}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                            playMode === "ai_dm" 
                              ? "bg-[#c084fc]/5 border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.15)]" 
                              : "bg-black/40 border-[#211d15] hover:border-[#cbc3b5]/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Sparkles className="h-5 w-5 text-[#c084fc]" />
                              <span className="text-[8px] font-semibold bg-[#c084fc]/20 text-[#c084fc] px-2 py-0.5 rounded-full tracking-wider uppercase">DM-Less</span>
                            </div>
                            <h4 className="font-display text-sm uppercase text-[#f4ecdd] mb-1">AI Dungeon Master</h4>
                            <p className="text-[11px] text-[#cbc3b5]/60 leading-normal">
                              No human DM needed. The AI DM completely controls narration, world events, NPCs, and pacing.
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#c084fc]/10 flex flex-wrap gap-1">
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#c084fc]/10">Fully Autonomous</span>
                            <span className="text-[8px] bg-black/50 text-[#cbc3b5] px-1.5 py-0.5 rounded border border-[#c084fc]/10">Instant Co-Op</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Duration & Pacing Section */}
                    <div className="space-y-4 border-t border-[#211d15] pt-5">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#d5b45d]" />
                        <Label className="text-[10px] uppercase tracking-[0.3em] text-[#d5b45d]">Expected Campaign Duration</Label>
                      </div>
                      <p className="text-[10px] text-[#cbc3b5]/60 mt-0.5 leading-relaxed">
                        The AI co-storyteller dynamically adapts milestones, lore revelations, boss encounter difficulty, and story climax density to fit your session target.
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {[
                          { value: 3, label: "Short Story", desc: "3 Sessions", detail: "Fast pacing, rapid levelups, quick boss showdown" },
                          { value: 5, label: "Medium Arc", desc: "5 Sessions", detail: "Classic balance, organic subplots, rich narrative" },
                          { value: 10, label: "Long Chronicle", desc: "10 Sessions", detail: "Slow buildup, epic factions, deep lore reveal" },
                          { value: -1, label: "Custom Scope", desc: "Manual sessions", detail: "Configure your exact target chapter count" }
                        ].map((opt) => {
                          const isSelected = opt.value === -1 ? ![3, 5, 10].includes(targetSessions) : targetSessions === opt.value;
                          return (
                            <div
                              key={opt.label}
                              onClick={() => {
                                if (opt.value === -1) {
                                  setTargetSessions(8);
                                  setCustomSessions("8");
                                } else {
                                  setTargetSessions(opt.value);
                                  setCustomSessions("");
                                }
                              }}
                              className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                                isSelected
                                  ? "bg-[#d5b45d]/5 border-[#d5b45d] shadow-[0_0_12px_rgba(213,180,93,0.1)]"
                                  : "bg-black/50 border-[#211d15] hover:border-[#cbc3b5]/30"
                              }`}
                            >
                              <div>
                                <h5 className="font-display text-[11px] uppercase tracking-wide text-[#f4ecdd]">{opt.label}</h5>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded mt-1 inline-block ${
                                  isSelected ? "bg-[#d5b45d]/20 text-[#d5b45d]" : "bg-white/5 text-[#cbc3b5]"
                                }`}>
                                  {opt.desc}
                                </span>
                              </div>
                              <p className="text-[9px] text-[#cbc3b5]/50 leading-tight mt-2">{opt.detail}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom Input Panel */}
                      {![3, 5, 10].includes(targetSessions) && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-black/60 border border-[#2d281e]"
                        >
                          <Label className="text-[10px] uppercase tracking-wider text-[#cbc3b5] shrink-0">Custom Session Target:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            placeholder="e.g. 8"
                            className="bg-black border-[#211d15] h-9 w-24 text-center focus:border-[#d5b45d]/50 text-white"
                            value={customSessions}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomSessions(val);
                              const parsed = parseInt(val, 10);
                              if (!isNaN(parsed) && parsed > 0) {
                                setTargetSessions(parsed);
                              }
                            }}
                          />
                          <span className="text-[10px] text-[#cbc3b5]/40 font-mono">sessions (recommend 3 to 15 sessions)</span>
                        </motion.div>
                      )}

                      {/* Pacing Intensity Selector */}
                      <div className="space-y-2 mt-4">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#cbc3b5] block">Pacing Pushing Intensity</Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "balanced", label: "⚖️ Balanced", desc: "Harmonious flow of combat, discovery, and quiet roleplay" },
                            { id: "fast", label: "⚡ Fast Paced", desc: "Rapid narrative shifts, compressed transitions, swift actions" },
                            { id: "slow", label: "🕯️ Slow Paced", desc: "Drawn-out atmosphere, deep lore dumps, patient exploration" }
                          ].map((intensity) => (
                            <button
                              key={intensity.id}
                              type="button"
                              onClick={() => setPacingIntensity(intensity.id as any)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] tracking-wider font-display uppercase transition-all duration-300 flex flex-col items-start text-left ${
                                pacingIntensity === intensity.id
                                  ? "bg-[#d5b45d]/10 border-[#d5b45d] text-[#d5b45d] shadow-[0_0_10px_rgba(213,180,93,0.15)]"
                                  : "bg-black/60 border-[#211d15] text-[#8e8778] hover:border-[#cbc3b5]/30 hover:text-white"
                              }`}
                            >
                              <span className="font-semibold">{intensity.label}</span>
                              <span className="text-[8px] text-[#cbc3b5]/50 capitalize mt-0.5 normal-case font-normal">{intensity.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && <p className="text-red-400 text-xs text-center font-display uppercase tracking-wider">{error}</p>}

                {/* Setup Navigation Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  {createStep > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => setCreateStep((prev) => (prev - 1) as 1 | 2 | 3)}
                      className="h-12 border border-[#211d15] hover:border-[#cbc3b5]/30 bg-black/60 text-[#cbc3b5] hover:text-white font-display uppercase tracking-wider text-xs flex items-center justify-center gap-2 sm:w-1/3"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className={`h-12 text-white font-display uppercase tracking-wider text-xs animate-glow flex items-center justify-center gap-2 flex-1 ${
                      createStep === 3
                        ? "bg-[linear-gradient(180deg,_#ab211f,_#7d1011)] hover:opacity-90"
                        : "bg-black/60 border border-[#d5b45d]/40 text-[#d5b45d] hover:bg-[#d5b45d]/5"
                    }`}
                    disabled={createMutation.isPending}
                  >
                    {createStep === 3 ? (
                      createMutation.isPending ? "Forging World..." : <>Forge World <Sparkles className="h-4 w-4" /></>
                    ) : (
                      <>Continue <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setStep("choice");
                      setCreateStep(1);
                    }}
                    className="text-[9px] uppercase tracking-[0.3em] text-[#8e8778] hover:text-white transition-colors"
                  >
                    Cancel & Back to Choices
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </motion.div>
        )}

        {step === "join" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
              <Sword className="h-10 w-10 text-[#87a8ff] mx-auto mb-4" />
              <h2 className="font-display text-4xl uppercase text-[#f6f2e8]">Seek a Party</h2>
              <p className="text-[#d6d1c8]/70 mt-2">Enter the secret sigil to join a campaign.</p>
            </div>

            <SurfaceCard className="p-8">
              <form 
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCode) joinMutation.mutate(joinCode);
                }}
              >
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-[#87a8ff]">Invite Code</Label>
                  <Input 
                    placeholder="e.g. OBSIDIAN-GATE" 
                    className="bg-black/40 border-tavern-border h-14 text-center text-2xl font-mono uppercase tracking-widest focus:border-[#87a8ff]/50 transition-colors"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <div className="pt-4 flex flex-col gap-4">
                  <Button 
                    type="submit" 
                    className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-display uppercase tracking-widest text-lg"
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Seeking..." : "Join Campaign"}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setStep("choice")}
                    className="text-[10px] uppercase tracking-[0.3em] text-[#8e8778] hover:text-white"
                  >
                    Back to Choices
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </motion.div>
        )}

        {/* Immersive Reforge Session Modal */}
        {showReforgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md border border-[#d5b45d]/30 bg-[#0a0806]/95 p-8 rounded-lg shadow-[0_0_50px_rgba(213,180,93,0.15)] space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                  <ShieldAlert className="h-10 w-10 text-[#ab211f] animate-pulse" />
                </div>
                <h3 className="font-display text-2xl uppercase tracking-widest text-[#f4efe3]">
                  Connection Severed
                </h3>
                <p className="text-[10px] text-[#cbc3b5]/70 italic leading-relaxed">
                  "Your link to the world archive has faded. Whisper your password to re-forge the connection and save your configurations."
                </p>
              </div>

              <form onSubmit={handleReforgeSession} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Active Traveler</Label>
                  <div className="p-3 bg-black/40 border border-[#2d281e] rounded-lg text-xs text-[#cbc3b5] font-mono select-none overflow-hidden text-ellipsis">
                    {user?.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-[0.2em] text-[#d5b45d]">Verify Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="Enter password..."
                    className="bg-black/60 border-[#2d281e] h-12 focus:border-[#d5b45d]/50 focus:ring-1 focus:ring-[#d5b45d]/20 text-[#f4efe3]"
                    value={reforgePassword}
                    onChange={(e) => setReforgePassword(e.target.value)}
                  />
                </div>

                {reforgeError && (
                  <p className="text-red-400 text-[10px] text-center font-display uppercase tracking-wider">
                    {reforgeError}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-12 bg-[linear-gradient(180deg,_#d5b45d,_#a28135)] hover:opacity-90 text-black font-display uppercase tracking-wider text-xs font-semibold"
                    disabled={isReforging}
                  >
                    {isReforging ? "Reforging..." : "Reforge Connection"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReforgeModal(false);
                      setReforgePassword("");
                      setReforgeError(null);
                    }}
                    className="text-[9px] uppercase tracking-[0.2em] text-[#cbc3b5]/40 hover:text-white transition-colors py-2"
                  >
                    Keep Offline Config
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
