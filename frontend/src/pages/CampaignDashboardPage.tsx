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
      // navigate(`/campaigns/${data.campaign.id}`);
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
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Campaigns</h1>
        <p className="mt-1 text-slate-400">
          Manage your epic adventures, build worlds, or join an existing party.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          {feedback}
        </div>
      ) : null}

      {/* Active Campaign Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-cyan-400" /> Current Adventure
        </h2>
        {activeCampaignQuery.isLoading ? (
          <div className="h-32 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
        ) : campaign ? (
          <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-b from-slate-900 to-slate-900/50">
            <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-cyan-50">{campaign.name}</CardTitle>
                  <CardDescription className="mt-2 text-cyan-200/70">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      {campaign.world_type || "Fantasy"}
                    </span>
                    <span className="ml-3">Invite Code: <span className="font-mono text-white">{campaign.invite_code}</span></span>
                  </CardDescription>
                </div>
                <Button 
                  size="lg" 
                  className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                  onClick={() => navigate(`/rooms/${campaign.id}`)} // Temporary route until full campaign room is built
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <BookOpen className="h-4 w-4 text-amber-400" />
                        Lore & Metadata
                      </h4>
                      <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-white/10 hover:bg-white/5" onClick={() => navigate(`/campaigns/${campaign.id}/archive`)}>
                        World Archive
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-amber-500/30 pl-3">
                      {campaign.description || "No lore provided for this campaign yet."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <History className="h-4 w-4 text-purple-400" />
                      Recent Recap
                    </h4>
                    <div className="rounded-lg bg-black/40 p-3 border border-white/5 text-sm text-slate-400 min-h-[80px]">
                      {snapshotQuery.isLoading ? (
                        <span className="animate-pulse">Consulting the ancient scrolls...</span>
                      ) : snapshot && snapshot.memories.length > 0 ? (
                        <ul className="space-y-2">
                          {snapshot.memories.slice(0, 2).map((mem) => (
                            <li key={mem.id} className="flex gap-2">
                              <Scroll className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                              <span className="leading-snug">{mem.summary}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-slate-500">The journey has just begun. No memories recorded yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    Character Sheet
                  </h4>
                  {activeCharacter ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-base font-medium text-white">{activeCharacter.name}</p>
                        <p className="text-sm text-slate-400">
                          {activeCharacter.class_name ?? "Wanderer"} • Level {activeCharacter.level}
                        </p>
                      </div>
                      <Button
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                        onClick={() => navigate(`/campaigns/${campaign.id}/characters/${activeCharacter.id}`)}
                      >
                        Open Character Sheet
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      No character is assigned to you in this campaign yet.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Scroll className="h-4 w-4 text-cyan-300" />
                    Party Roster
                  </h4>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {snapshot?.characters?.length ? (
                      snapshot.characters.map((character) => (
                        <button
                          key={character.id}
                          type="button"
                          onClick={() => navigate(`/campaigns/${campaign.id}/characters/${character.id}`)}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="text-sm font-medium text-white">{character.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {character.class_name ?? "Wanderer"} • Level {character.level}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No party characters have been created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-white/20 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-white/5 p-4 mb-4">
                <Scroll className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">No Active Campaign</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
                You haven't joined or started any campaigns yet. Create a new world or join an existing party below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-400" />
              Forge a New World
            </CardTitle>
            <CardDescription>Become the Dungeon Master of a new campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
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
                <Label htmlFor="camp-name">Campaign Name</Label>
                <Input
                  id="camp-name"
                  placeholder="e.g., The Lost Mines of Phandelver"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="bg-black/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="camp-desc">Lore & Setup (Optional)</Label>
                  <Input
                    id="camp-desc"
                    placeholder="A brief description of your world..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    className="bg-black/20"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="camp-world">World Type</Label>
                  <Input
                    id="camp-world"
                    placeholder="e.g., High Fantasy, Sci-Fi, Cyberpunk"
                    value={createWorld}
                    onChange={(e) => setCreateWorld(e.target.value)}
                    className="bg-black/20"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Forging..." : "Create Campaign"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-400" />
              Join a Party
            </CardTitle>
            <CardDescription>Enter a secret invite code to join an ongoing campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinCode.trim()) {
                  setFeedback("Invite code is required.");
                  return;
                }
                joinMutation.mutate(joinCode.trim());
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="join-code">Invite Code</Label>
                <Input
                  id="join-code"
                  placeholder="Enter 12-character code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="font-mono uppercase bg-black/20"
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2" disabled={joinMutation.isPending}>
                {joinMutation.isPending ? "Joining..." : "Join Campaign"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
