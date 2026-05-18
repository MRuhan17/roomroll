import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, Search, BookOpen, Scroll, History, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaign, getActiveCampaign, getCampaignSnapshot, joinCampaign } from "@/services/campaigns";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export function CampaignDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createWorld, setCreateWorld] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeCampaignQuery = useQuery({
    queryKey: ["activeCampaign"],
    queryFn: getActiveCampaign,
    retry: false,
  });

  const activeCampaignId = activeCampaignQuery.data?.campaign?.id;

  useEffect(() => {
    if (activeCampaignQuery.isFetched && !activeCampaignQuery.data?.campaign) {
      navigate("/onboarding");
    }
  }, [activeCampaignQuery.isFetched, activeCampaignQuery.data, navigate]);

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
      navigate(`/campaigns/${data.campaign.id}/setup`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not create campaign.")),
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinCampaign(code),
    onSuccess: (data) => {
      setFeedback(`Joined campaign "${data.campaign.name}".`);
      setJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      // navigate(`/campaigns/${data.campaign.id}`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, "Could not join campaign.")),
  });

  const campaign = activeCampaignQuery.data?.campaign;
  const snapshot = snapshotQuery.data?.snapshot;
  const activeCharacter = snapshot?.characters.find((character) => character.user_id === user?.id && !character.is_npc)
    ?? snapshot?.characters.find((character) => !character.is_npc)
    ?? snapshot?.characters[0];

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-wide text-[#f5efe2] drop-shadow-sm">The Adventurer's Log</h1>
        <p className="mt-2 text-[#cbc3b5]/70 font-serif italic text-lg">
          Manage your epic adventures, build worlds, or join an existing party.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-[#ab211f]/30 bg-[#ab211f]/10 px-4 py-3 text-sm text-[#d5b45d]">
          {feedback}
        </div>
      ) : null}

      {/* Active Campaign Section */}
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-3 text-[#f5efe2]">
          <Play className="h-5 w-5 text-[#ab211f]" /> Current Adventure
        </h2>
        {activeCampaignQuery.isLoading ? (
          <div className="h-32 rounded-xl tavern-card animate-pulse" />
        ) : campaign ? (
          <Card className="relative overflow-hidden tavern-card tavern-border border bg-transparent">
            <div className="absolute top-0 right-0 p-32 bg-[#ab211f]/5 blur-[120px] rounded-full pointer-events-none" />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-display text-[#f5efe2]">{campaign.name}</CardTitle>
                  <CardDescription className="mt-2 text-[#cbc3b5]/70 font-serif">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ab211f]/20 px-3 py-1 text-xs font-medium text-[#f5efe2] border border-[#ab211f]/30">
                      {campaign.world_type || "Fantasy"}
                    </span>
                    <span className="ml-4">Invite Rune: <span className="font-mono text-[#d5b45d] tracking-widest">{campaign.invite_code}</span></span>
                  </CardDescription>
                </div>
                <Button 
                  size="lg" 
                  className="bg-[#ab211f] hover:bg-[#8f1917] text-white shadow-[0_0_20px_rgba(171,33,31,0.4)] font-display uppercase tracking-widest"
                  onClick={() => navigate(`/rooms/${campaign.id}`)}
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
                        Lore & Setup
                      </h4>
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-tavern-border hover:bg-white/5 text-[#cbc3b5] font-display uppercase tracking-wider" onClick={() => navigate(`/campaigns/${campaign.id}/archive`)}>
                        World Archive
                      </Button>
                    </div>
                    <p className="text-sm text-[#cbc3b5]/80 leading-relaxed border-l-2 border-[#d5b45d]/40 pl-4 font-serif italic">
                      {campaign.description || "No lore provided for this campaign yet."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] font-medium text-[#d5b45d] mb-3">
                      <History className="h-4 w-4 text-[#d5b45d]" />
                      Recent Recap
                    </h4>
                    <div className="rounded border border-tavern-border bg-black/60 p-4 text-sm text-[#cbc3b5]/80 min-h-[80px]">
                      {snapshotQuery.isLoading ? (
                        <span className="animate-pulse font-serif italic">Consulting the ancient scrolls...</span>
                      ) : snapshot && snapshot.memories.length > 0 ? (
                        <ul className="space-y-3">
                          {snapshot.memories.slice(0, 2).map((mem) => (
                            <li key={mem.id} className="flex gap-3 items-start">
                              <Scroll className="h-4 w-4 shrink-0 text-[#ab211f] mt-0.5" />
                              <span className="leading-relaxed font-serif">{mem.summary}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic font-serif text-[#cbc3b5]/50">The journey has just begun. No memories recorded yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded border border-tavern-border bg-black/40 p-5">
                  <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#d5b45d]">
                    <Shield className="h-4 w-4 text-[#d5b45d]" />
                    Character Sheet
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
                        onClick={() => navigate(`/campaigns/${campaign.id}/characters/${activeCharacter.id}`)}
                      >
                        Open Sheet
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-serif italic text-[#cbc3b5]/60">
                      No character is assigned to you in this campaign yet.
                    </p>
                  )}
                </div>

                <div className="rounded border border-tavern-border bg-black/40 p-5">
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
                          onClick={() => navigate(`/campaigns/${campaign.id}/characters/${character.id}`)}
                          className="rounded border border-tavern-border bg-black/40 px-4 py-3 text-left transition hover:bg-white/5 hover:border-[#d5b45d]/40"
                        >
                          <p className="text-base font-display font-bold text-[#f5efe2]">{character.name}</p>
                          <p className="mt-1 text-xs font-serif italic text-[#cbc3b5]/70">
                            {character.class_name ?? "Wanderer"} • Level {character.level}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm font-serif italic text-[#cbc3b5]/60">No party characters have been created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-tavern-border bg-black/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-[#ab211f]/10 p-5 mb-5 border border-[#ab211f]/30">
                <Scroll className="h-10 w-10 text-[#d5b45d]" />
              </div>
              <h3 className="text-2xl font-display font-bold text-[#f5efe2]">No Active Campaign</h3>
              <p className="text-base font-serif italic text-[#cbc3b5]/70 max-w-md mt-2 mb-8">
                You haven't joined or started any campaigns yet. Forge a new tale or join an existing party below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="tavern-card border-tavern-border rounded border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
              <Plus className="h-6 w-6 text-[#ab211f]" />
              Forge a New Tale
            </CardTitle>
            <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">Become the Dungeon Master of a new campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!createName.trim()) {
                  setFeedback("Campaign name is required.");
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
                  <Label htmlFor="camp-desc" className="text-xs uppercase tracking-widest text-[#d5b45d]">Lore & Setup (Optional)</Label>
                  <Input
                    id="camp-desc"
                    placeholder="A brief description of your world..."
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
                {createMutation.isPending ? "Forging..." : "Forge Campaign"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="tavern-card border-tavern-border rounded border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-display text-[#f5efe2]">
              <Search className="h-6 w-6 text-[#d5b45d]" />
              Join a Party
            </CardTitle>
            <CardDescription className="text-[#cbc3b5]/70 font-serif italic text-sm mt-2">Enter a secret invite rune to join an ongoing campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinCode.trim()) {
                  setFeedback("Invite rune is required.");
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
                {joinMutation.isPending ? "Joining..." : "Join Party"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
