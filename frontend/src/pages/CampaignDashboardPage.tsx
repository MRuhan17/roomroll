import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { encodeCampaignId } from "@/lib/campaignId";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Plus, Search, BookOpen, Scroll, History, Shield, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaign, getActiveCampaign, getCampaignSnapshot, getUserCampaigns, joinCampaign } from "@/services/campaigns";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { AmbientBackdrop, Embers } from "@/components/landing/LandingPrimitives";

export function CampaignDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createWorld, setCreateWorld] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAdminSending, setIsAdminSending] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const activeCampaignQuery = useQuery({
    queryKey: ["activeCampaign"],
    queryFn: getActiveCampaign,
    retry: false,
  });

  const activeCampaignId = activeCampaignQuery.data?.campaign?.id;

  const campaignsQuery = useQuery({
    queryKey: ["userCampaigns"],
    queryFn: getUserCampaigns,
    retry: false,
  });

  const campaigns = campaignsQuery.data?.campaigns || [];


  const snapshotQuery = useQuery({
    queryKey: ["campaignSnapshot", activeCampaignId],
    queryFn: () => getCampaignSnapshot(activeCampaignId!),
    enabled: !!activeCampaignId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; worldType: string }) =>
      createCampaign(data.name, data.description, data.worldType),
    onSuccess: (data) => {
      setFeedback(`Campaign "${data.campaign.name}" created.`);
      setCreateName("");
      setCreateDesc("");
      setCreateWorld("");
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      queryClient.invalidateQueries({ queryKey: ["userCampaigns"] });
      navigate(`/campaigns/${encodeCampaignId(data.campaign.id)}/setup`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not create campaign.")),
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCampaign(code),
    onSuccess: (data) => {
      setFeedback(`Joined campaign "${data.campaign.name}".`);
      setJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      queryClient.invalidateQueries({ queryKey: ["userCampaigns"] });
      navigate(`/campaigns/${encodeCampaignId(data.campaign.id)}/setup`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not join campaign.")),
  });

  const campaign = activeCampaignQuery.data?.campaign;
  const snapshot = snapshotQuery.data?.snapshot;
  const activeCharacter = snapshot?.characters.find((character) => character.user_id === user?.id && !character.is_npc)
    ?? snapshot?.characters.find((character) => !character.is_npc)
    ?? snapshot?.characters[0];

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Title Header with drifting Embers */}
      <div className="relative overflow-hidden rounded-xl border border-tavern-border/30 bg-black/40 p-6 md:p-8">
        <div className="absolute top-0 right-0 p-32 bg-[#ab211f]/5 blur-[80px] rounded-full pointer-events-none" />
        <h1 className="text-4xl font-display font-bold tracking-wide text-[#f5efe2] drop-shadow-sm flex items-center gap-3">
          <Flame className="h-8 w-8 text-[#ab211f] animate-pulse" />
          The Adventurer's Log
        </h1>
        <p className="mt-2 text-[#cbc3b5]/70 font-serif italic text-lg max-w-2xl leading-relaxed">
          Manage your epic adventures, chronicle ancient worlds, or cross plans to join an active multiplayer party.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-[#ab211f]/30 bg-[#ab211f]/15 px-4 py-3 text-sm text-[#d5b45d] animate-in fade-in duration-300">
          {feedback}
        </div>
      ) : null}

      {/* Active Campaign Section */}
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-3 text-[#f5efe2]">
          <Play className="h-5 w-5 text-[#ab211f]" /> Current Quest
        </h2>
        {activeCampaignQuery.isLoading ? (
          <div className="h-48 rounded-xl border border-tavern-border bg-black/40 animate-pulse flex items-center justify-center">
            <span className="text-[#cbc3b5]/40 font-serif italic">Reading active campaign records...</span>
          </div>
        ) : campaign ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative overflow-hidden tavern-card tavern-border border bg-transparent">
              <div className="absolute top-0 right-0 p-32 bg-[#ab211f]/4 blur-[100px] rounded-full pointer-events-none" />
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-display text-[#f5efe2] tracking-wide">{campaign.name}</CardTitle>
                    <div className="mt-2 text-[#cbc3b5]/70 font-serif text-sm flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ab211f]/20 px-3 py-1 text-xs font-medium text-[#f5efe2] border border-[#ab211f]/30">
                        {campaign.world_type || "Fantasy"}
                      </span>
                      <span>Invite Rune: <span className="font-mono text-[#d5b45d] tracking-widest bg-black/40 px-2 py-0.5 rounded border border-[#d5b45d]/20">{campaign.invite_code}</span></span>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-[#ab211f] hover:bg-[#8f1917] text-white shadow-[0_0_20px_rgba(171,33,31,0.4)] font-display uppercase tracking-widest"
                    onClick={() => navigate(`/rooms/${encodeCampaignId(campaign.id)}`)}
                  >
                    <Play className="mr-2 h-4 w-4" fill="currentColor" />
                    Continue Journey
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] font-medium text-[#d5b45d]">
                          <BookOpen className="h-4 w-4 text-[#d5b45d]" />
                          Realm Canon & Lore
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-tavern-border hover:bg-white/5 text-[#cbc3b5] font-display uppercase tracking-wider" onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/recaps`)}>
                            <History className="h-3.5 w-3.5 mr-1" />
                            Session Recaps
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-tavern-border hover:bg-white/5 text-[#cbc3b5] font-display uppercase tracking-wider" onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/archive`)}>
                            World Archive
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-tavern-border hover:bg-white/5 text-[#cbc3b5] font-display uppercase tracking-wider gap-1" onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/tavern`)}>
                            <Flame className="h-3.5 w-3.5 text-[#ab211f]" />
                            Visit Tavern
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-[#cbc3b5]/80 leading-relaxed border-l-2 border-[#d5b45d]/40 pl-4 font-serif italic">
                        {campaign.description || "No chronicle has been penned for this adventure yet. The world's pages remain pure."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] font-medium text-[#d5b45d] mb-3">
                        <History className="h-4 w-4 text-[#d5b45d]" />
                        Recent Memories
                      </h4>
                      <div className="rounded border border-tavern-border bg-black/60 p-4 text-sm text-[#cbc3b5]/80 min-h-[80px] flex items-center">
                        {snapshotQuery.isLoading ? (
                          <span className="animate-pulse font-serif italic text-[#cbc3b5]/40">Consulting the ancient scrolls...</span>
                        ) : snapshot && snapshot.memories.length > 0 ? (
                          <ul className="space-y-3 w-full">
                            {snapshot.memories.slice(0, 2).map((mem) => (
                              <li key={mem.id} className="flex gap-3 items-start">
                                <Scroll className="h-4 w-4 shrink-0 text-[#ab211f] mt-0.5" />
                                <span className="leading-relaxed font-serif">{mem.summary}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic font-serif text-[#cbc3b5]/50 w-full text-center">
                            No adventures have yet begun. Let the AI Dungeon Master weave your first chapter.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                  {/* Character card */}
                  <div className="rounded border border-tavern-border bg-black/40 p-5 relative overflow-hidden group hover:border-[#d5b45d]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 bg-[#ab211f]/2 blur-[25px] rounded-full pointer-events-none" />
                    <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#d5b45d]">
                      <Shield className="h-4 w-4 text-[#d5b45d]" />
                      Traveler Profile
                    </h4>
                    {activeCharacter ? (
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xl font-display font-bold text-[#f5efe2]">{activeCharacter.name}</p>
                          <p className="text-sm font-serif italic text-[#cbc3b5]/70">
                            {activeCharacter.class_name ?? "Wanderer"} • Level {activeCharacter.level}
                          </p>
                        </div>
                        <Button
                          className="w-full bg-[#ab211f]/20 hover:bg-[#ab211f]/40 text-[#f5efe2] border border-[#ab211f]/50 font-display uppercase tracking-widest text-xs"
                          onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/characters/${activeCharacter.id}`)}
                        >
                          Open Character Sheet
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <p className="text-sm font-serif italic text-[#cbc3b5]/50">
                          The shadows remain empty. You have not yet forged a traveler sheet for this campaign.
                        </p>
                        <Button
                          className="w-full bg-transparent border border-tavern-border text-[#cbc3b5] hover:bg-white/5 font-display uppercase tracking-widest text-xs"
                          onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/setup`)}
                        >
                          Forge Traveler Sheet
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Roster card */}
                  <div className="rounded border border-tavern-border bg-black/40 p-5 relative overflow-hidden group hover:border-[#d5b45d]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-8 bg-[#d5b45d]/1 blur-[25px] rounded-full pointer-events-none" />
                    <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#d5b45d]">
                      <Scroll className="h-4 w-4 text-[#d5b45d]" />
                      Party Roster
                    </h4>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {snapshot?.characters?.length ? (
                        snapshot.characters.map((character) => (
                          <button
                            key={character.id}
                            type="button"
                            onClick={() => navigate(`/campaigns/${encodeCampaignId(campaign.id)}/characters/${character.id}`)}
                            className="rounded border border-tavern-border bg-black/40 px-4 py-3 text-left transition hover:bg-white/5 hover:border-[#d5b45d]/40"
                          >
                            <p className="text-base font-display font-bold text-[#f5efe2]">{character.name}</p>
                            <p className="mt-1 text-xs font-serif italic text-[#cbc3b5]/70">
                              {character.class_name ?? "Wanderer"} • Level {character.level}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm font-serif italic text-[#cbc3b5]/50 col-span-2 text-center py-4">
                          No other companions have stepped through the portal yet. Summon them with your invite rune!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-dashed border-tavern-border bg-black/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(171,33,31,0.03),_transparent_60%)] pointer-events-none" />
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-[#ab211f]/10 p-5 mb-5 border border-[#ab211f]/30 relative">
                  <Scroll className="h-10 w-10 text-[#d5b45d]" />
                  <Sparkles className="absolute top-0 right-0 h-4 w-4 text-[#d5b45d] animate-ping" />
                </div>
                <h3 className="text-2xl font-display font-bold text-[#f5efe2] tracking-wide">The Chronicles Await</h3>
                <p className="text-base font-serif italic text-[#cbc3b5]/70 max-w-md mt-2 mb-8 leading-relaxed">
                  No campaigns have yet echoed through these halls. The world awaits its next legend. Forge a new saga or bind yourself to an existing party below.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* World Chronicles Deck */}
      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold text-[#f5efe2] flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-[#ab211f]" />
          Your World Chronicles
        </h3>
        
        {campaignsQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-xl border border-tavern-border/30 bg-black/40 animate-pulse" />
            ))}
          </div>
        ) : campaignsQuery.error ? (
          <div className="p-6 rounded-xl border border-red-900/40 bg-red-950/15 text-left space-y-4 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-red-900/5 blur-[30px] rounded-full pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#ab211f]/10 p-3 border border-[#ab211f]/30">
                <Shield className="h-6 w-6 text-[#ab211f]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-display font-semibold text-[#f5efe2]">Leyline Interruption Detected</h4>
                <p className="text-red-400 font-serif italic text-sm leading-relaxed">
                  Failed to consult active chronicles. Try checking your leyline connection.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-900/20 space-y-3 text-xs font-mono text-[#cbc3b5]/70">
              <div className="flex justify-between gap-4">
                <span className="text-[#cbc3b5]/40 shrink-0">🔮 Target Leyline:</span>
                <span className="text-[#cbc3b5] break-all text-right">/api/campaigns</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#cbc3b5]/40 shrink-0">📜 Diagnostic Message:</span>
                <span className="text-red-400 break-all text-right">{getApiErrorMessage(campaignsQuery.error, "Connection terminated prematurely.")}</span>
              </div>
              <div className="mt-2 text-[10px] font-serif italic text-[#cbc3b5]/50 leading-relaxed pl-3 border-l border-[#d5b45d]/20">
                Troubleshooting Tip: Verify that your local backend server is running on port 5000, or verify that the production server is reachable and CORS settings allow requests from this origin.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button 
                size="sm" 
                onClick={() => campaignsQuery.refetch()} 
                className="bg-[#ab211f]/20 hover:bg-[#ab211f]/40 text-[#f5efe2] border border-[#ab211f]/50 font-display uppercase tracking-widest text-xs"
              >
                Re-attune Connection
              </Button>
            </div>
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {campaigns.map((camp: any) => {
              const isCurrent = camp.id === campaign?.id;
              return (
                <motion.div
                  key={camp.id}
                  whileHover={{ y: -2 }}
                  className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                    isCurrent 
                      ? "border-[#d5b45d] bg-[#d5b45d]/[0.02] shadow-[0_0_20px_rgba(213,180,93,0.15)]" 
                      : "border-tavern-border/30 bg-black/35 hover:border-[#d5b45d]/40"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-lg font-display font-semibold text-[#f5efe2]">{camp.name}</h4>
                      <p className="text-xs text-[#cbc3b5]/60 font-serif mt-1">World Type: <strong className="text-[#cbc3b5]">{camp.world_type || 'Classic Fantasy'}</strong></p>
                    </div>
                    {isCurrent && (
                      <span className="text-[8px] font-mono uppercase bg-[#d5b45d]/20 text-[#d5b45d] border border-[#d5b45d]/30 px-2 py-0.5 rounded-full tracking-wider">Active Quest</span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#cbc3b5]/60 font-mono border-t border-tavern-border/10 pt-3">
                    <div>👑 Host: <strong className="text-[#cbc3b5]">{camp.hostName}</strong></div>
                    <div>👥 Party: <strong className="text-[#cbc3b5]">{camp.playerCount} members</strong></div>
                    <div className="col-span-2 mt-1">⏳ Last Activity: <strong className="text-[#cbc3b5]">{new Date(camp.lastActivity).toLocaleDateString()}</strong></div>
                  </div>

                  <div className="mt-4 flex gap-2 justify-end pt-2 border-t border-tavern-border/10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs bg-transparent border-tavern-border text-[#cbc3b5] hover:bg-white/5 font-display uppercase tracking-widest"
                      onClick={() => navigate(`/campaigns/${encodeCampaignId(camp.id)}/setup`)}
                    >
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      className={`h-8 text-xs font-display uppercase tracking-widest ${
                        isCurrent 
                          ? "bg-[#ab211f] hover:bg-[#8f1917] text-white" 
                          : "bg-transparent border border-[#d5b45d]/40 text-[#d5b45d] hover:bg-[#d5b45d]/5"
                      }`}
                      onClick={() => navigate(`/rooms/${encodeCampaignId(camp.id)}`)}
                    >
                      {isCurrent ? "Resume Journey" : "Enter Session"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[#cbc3b5]/40 font-serif italic text-sm border border-dashed border-tavern-border/30 rounded-xl bg-black/10">
            No chronicles recorded. Use the scrolls below to forge a new campaign or join a party!
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Forge a new Campaign card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="tavern-card border-tavern-border rounded border bg-black/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-[#ab211f]/3 blur-[45px] rounded-full pointer-events-none" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
                <Plus className="h-6 w-6 text-[#ab211f]" />
                Forge a New Tale
              </CardTitle>
              <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">Become the Dungeon Master of a brand new campaign.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!createName.trim()) {
                    setFeedback("Campaign name is required to begin the chronicle.");
                    return;
                  }
                  createMutation.mutate({
                    name: createName.trim(),
                    description: createDesc.trim(),
                    worldType: createWorld.trim(),
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="camp-name" className="text-xs uppercase tracking-widest text-[#d5b45d]">Campaign Name</Label>
                  <Input
                    id="camp-name"
                    placeholder="e.g., The Lost Mines of Phandelver"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="bg-black/40 border-tavern-border text-[#f5efe2] placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#ab211f]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="camp-desc" className="text-xs uppercase tracking-widest text-[#d5b45d]">Lore Overview (Optional)</Label>
                    <Input
                      id="camp-desc"
                      placeholder="Chronicle your realm's overarching history and major events..."
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      className="bg-black/40 border-tavern-border text-[#f5efe2] placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#ab211f]"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="camp-world" className="text-xs uppercase tracking-widest text-[#d5b45d]">World Type</Label>
                    <Input
                      id="camp-world"
                      placeholder="e.g., High Fantasy, Sci-Fi, Cyberpunk"
                      value={createWorld}
                      onChange={(e) => setCreateWorld(e.target.value)}
                      className="bg-black/40 border-tavern-border text-[#f5efe2] placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#ab211f]"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#ab211f] hover:bg-[#8f1917] text-[#f5efe2] mt-4 font-display uppercase tracking-widest" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Forging Chronicles..." : "Forge Chronicles"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Join an existing Campaign card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="tavern-card border-tavern-border rounded border bg-black/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-[#d5b45d]/2 blur-[45px] rounded-full pointer-events-none" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
                <Search className="h-6 w-6 text-[#d5b45d]" />
                Join a Party
              </CardTitle>
              <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">Enter a secret invite rune to step into an ongoing companion campaign.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!joinCode.trim()) {
                    setFeedback("Invite rune is required to cross planes.");
                    return;
                  }
                  joinMutation.mutate(joinCode.trim());
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="join-code" className="text-xs uppercase tracking-widest text-[#d5b45d]">Invite Rune</Label>
                  <Input
                    id="join-code"
                    placeholder="Enter 12-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="font-mono uppercase bg-black/40 border-tavern-border text-[#d5b45d] tracking-widest placeholder:text-[#cbc3b5]/30 placeholder:font-serif placeholder:italic focus-visible:ring-[#d5b45d]"
                  />
                </div>
                <Button type="submit" className="w-full bg-transparent border border-[#d5b45d]/40 text-[#d5b45d] hover:bg-[#d5b45d]/10 mt-4 font-display uppercase tracking-widest" disabled={joinMutation.isPending}>
                  {joinMutation.isPending ? "Connecting Party..." : "Join Party"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dev & Admin Utility Deck */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 border border-tavern-border/30 bg-black/20 rounded-xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-16 bg-purple-500/2 blur-[40px] rounded-full pointer-events-none" />
        <h3 className="text-lg font-display font-bold text-[#f5efe2] tracking-wide flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Dev & Admin Utility Deck
        </h3>
        <p className="mt-2 text-xs text-[#cbc3b5]/60 font-serif leading-relaxed">
          Verify and validate your SMTP pipelines, newsletter generation engines, and real-time delivery mechanisms in live dev mode.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button
            onClick={async () => {
              if (isAdminSending) return;
              setIsAdminSending(true);
              setAdminFeedback(null);
              try {
                const response = await api.post("/admin/send-test-chronicle");
                const data = response.data;
                setAdminFeedback({
                  type: "success",
                  message: `Deliveries complete! Sent: ${data.sentCount}, Failed: ${data.failedCount}, Duplicates: ${data.duplicateCount}.`
                });
              } catch (err: any) {
                setAdminFeedback({
                  type: "error",
                  message: getApiErrorMessage(err, " Leyline failure. Could not dispatch test chronicle.")
                });
              } finally {
                setIsAdminSending(false);
              }
            }}
            disabled={isAdminSending}
            className="bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 font-display uppercase tracking-widest text-xs h-10 px-5 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isAdminSending ? "Sending Chronicles..." : "Send Test Chronicle"}
          </Button>

          {adminFeedback && (
            <div className={`text-xs px-4 py-2 rounded-lg border leading-relaxed font-serif ${
              adminFeedback.type === "success" 
                ? "bg-[#d5b45d]/10 border-[#d5b45d]/30 text-[#d5b45d]" 
                : "bg-red-950/20 border-red-900/40 text-red-400"
            }`}>
              {adminFeedback.message}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
